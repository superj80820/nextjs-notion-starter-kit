## 什麼是 Producer Consumer Pattern？

> 多個 Producer(生產者)提供任 Job 任務，多個 Consumer(消費者)消費任務

有時候系統的任務不會直接執行，而由多個 Producer 程序存到一個 queue 中，再由其他 Consumer 程序讀取 queue 執行，這樣的話可以使 Producer 與 Consumer 程序間沒有直接關係，他們只依賴 queue，即可解耦。

例如在微服務的系統下，會利用 kafka 來做 message queue system，這樣即使微服務 auto scaling(水平擴增)也不會為服務找不到彼此，以 golang 的維度去對比這個問題如圖：

![](https://i.imgur.com/0RDIfoI.png)

由於 Producer goroutine 直接呼叫 A Consumer goroutine，導致兩者綁定，Producer goroutine 沒有機會把資訊傳送給 B Consumer goroutine 消費，這樣資訊一多時，Consumer 程序沒辦法增強消費能力會導致緩慢。

所以會設計一個 job channel 來搜集多個 Producer 的 Job，並交由 Consumer 處理，gorotine 只相依 channel 而不是其他 gorotine，就可以擴增 gorotine 的數量，如圖：

![](https://i.imgur.com/V4GT2nX.png)

## 問題情境

類似 Uber 的計程車系統，會有多個使用者叫車，不同的司機接單會收到此使用者的資訊。

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。

實作有問題的系統如下，有三位使用者`糖糖`、`鹽鹽`、`乖乖`分別會使用`UberProducer()`去叫車，由於沒有 job channel，每位使用者都在叫車時就要立即用`UberConsumer()`指定司機載人，這導致系統沒有分配 job 給 consumer 的功能：

```go
package main

import (
	"fmt"
	"time"
)

type UserInfo struct {
	ID   uint32
	Name string
}

var userInfos = []UserInfo{
	{
		1,
		"糖糖",
	},
	{
		2,
		"鹽鹽",
	},
	{
		3,
		"乖乖",
	},
}

func UberProducer(job chan<- UserInfo, i int) {
	go UberConsumer(userInfos[i], i)
}

func UberConsumer(userInfo UserInfo, id int) {
	fmt.Printf("uber consumer %d get %s user\n", id, userInfo.Name)
}

func main() {
	job := make(chan UserInfo)
	UberProducerCount := len(userInfos)

	for i := 0; i < UberProducerCount; i++ {
		go UberProducer(job, i)
	}

	time.Sleep(10 * time.Second) //等待goroutine執行完畢
}
```

這使得每次叫車都只會叫到 consumer 0, 1, 2：

![](https://i.imgur.com/1xTXGJ0.png)

## 解決方式

三位使用者一樣使用`UberProducer()`去叫車，而設計一個 job channel 會搜集這三位使用者的叫車單與資訊。而`UberConsumer()`則會利用`for userInfo := range job`不斷監聽 job channel 是否有新的叫車，如果有的話就執行載客服務

```go
package main

import (
	"fmt"
	"time"
)

type UserInfo struct {
	ID   uint32
	Name string
}

var userInfos = []UserInfo{
	{
		1,
		"糖糖",
	},
	{
		2,
		"鹽鹽",
	},
	{
		3,
		"乖乖",
	},
}

func UberProducer(job chan<- UserInfo, i int) {
	job <- userInfos[i]
}

func UberConsumer(job <-chan UserInfo, id int) {
	for userInfo := range job {
		fmt.Printf("uber consumer %d get %s user\n", id, userInfo.Name)
	}
}

func main() {
	job := make(chan UserInfo)
	UberProducerCount := len(userInfos)
	UberConsumerCount := 5

	for i := 0; i < UberProducerCount; i++ {
		go UberProducer(job, i)
	}

	for i := 0; i < UberConsumerCount; i++ {
		go UberConsumer(job, i)
	}

	time.Sleep(10 * time.Second) //等待goroutine執行完畢
}
```

由於 job channel 的關係，只要正在等待的 consumer 都有機會獲得 job，所以運行的結果是 consumer 3, 0, 4 載到客，並非 0, 1, 2：

![](https://i.imgur.com/Fip4AAX.png)
