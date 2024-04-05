## 什麼是 Fan-Out Fan-In Pattern？

> 將 input 由一個 producer 分發多個 goroutine 運行，再將多個 task goroutine 運行的結果由一個 consumer 收集資料合併為 output

如果程式的有著複雜的計算或者多個 IO 運行，可以將這些運行分發給 task goroutine 執行，使 task 執行更快速，在統一收集繼續下個流程。其中分發與收集的行為又被稱為 Fan Out、Fan In:

- Fan Out: input 傳入 producer 後開啟多個 goroutine 運行，直到 producer 不再接收 input，就像是**分發**任務一般，所以稱為 Fan **Out**
- Fan In: 由多個 input 傳入 consumer 後合併為 output 傳出，直到 consumer 不再接收 input，就像是**收集**資料一般，所以稱為 Fan **In**

![](https://i.imgur.com/2nnSBl1.png)

## 問題情境

設計一個新聞資訊網頁系統，需要從 A、B、C server 拿取資料，這些資料都沒有順序性，純粹是要都顯示在網頁上而已，所以如果 A 資料拿完再拿 B，這樣就太浪費時間了。可以同時拿取 A、B、C server 的資料加快取資料的速度。

實作有問題的系統如下， A、B、C server 透過`GetServerData()`拿取資料，再透過`ShowNews`顯示新聞資料：

```go
package main

import (
	"fmt"
	"math/rand"
	"time"
)

func GetServerData(serverName string) string {
	time.Sleep(time.Duration(rand.Intn(3)) * time.Second) //模擬取得server data消耗的時間
	return fmt.Sprintf("%s server data", serverName)
}

func ShowNews(news ...interface{}) {
	fmt.Println(news...)
}

func main() {
	start := time.Now()
	responseByServerA := GetServerData("A")
	responseByServerB := GetServerData("B")
	responseByServerC := GetServerData("C")
	ShowNews(responseByServerA, responseByServerB, responseByServerC)
	fmt.Printf("cost %s", time.Since(start))
}
```

會發現因為拿取資料無法並行，所以耗時較久

![](https://i.imgur.com/ZANI9bc.png)

## 解決方式

實作`Producer()`、`Task()`、`Consumer()`來分別**分發任務**、**執行任務**、**收集資料**，

```go
package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

func Producer(serverNames ...string) <-chan string {
	producerCh := make(chan string, len(serverNames))
	go func() {
		defer close(producerCh)
		for _, serverName := range serverNames {
			producerCh <- serverName
		}
	}()
	return producerCh
}

func Task(producerCh <-chan string) <-chan string {
	taskCh := make(chan string)
	go func() {
		defer close(taskCh)
		for serverName := range producerCh {
			taskCh <- GetServerData(serverName)
		}
	}()
	return taskCh
}

func Consumer(taskChs ...<-chan string) <-chan string {
	consumerCh := make(chan string)

	var wg sync.WaitGroup
	wg.Add(len(taskChs))
	go func() {
		wg.Wait()
		close(consumerCh)
	}()

	for _, task := range taskChs {
		go func(task <-chan string) {
			defer wg.Done()
			for new := range task {
				consumerCh <- new
			}
		}(task)
	}

	return consumerCh
}

func GetServerData(serverName string) string {
	time.Sleep(time.Duration(rand.Intn(3)) * time.Second) //模擬取得server data消耗的時間
	return fmt.Sprintf("%s server data", serverName)
}

func ShowNews(news ...interface{}) {
	fmt.Println(news...)
}

func main() {
	start := time.Now()
	producerCh := Producer("A", "B", "C")

	task1 := Task(producerCh)
	task2 := Task(producerCh)
	task3 := Task(producerCh)

	consumerCh := Consumer(task1, task2, task3)

	for new := range consumerCh {
		ShowNews(new)
	}
	fmt.Printf("cost %s", time.Since(start))
}
```

程式碼較長，重點如下：

- 將需要拿取資料的 server 名稱傳遞給`Producer()`後，`Producer()`會創建一個 Channel 來分發任務，所以需再將此 Channel 傳給`Task()`使其 goroutine 獲得任務
- `Task()`獲得任務開始執行後，也會產生各自的 Channel 用來傳遞 server 的資料，所以需再將此 Channel 送至`Consumer()`
- `Consumer()`獲得所有`Task()`的 Channel 後，會在啟動相對數量的 gorotine 合併資料至`consumerCh{}`，為了要確保資料取得完畢後關閉`consumerCh{}`，需透過`sync.WaitGroup{}`來取得`close(consumerCh)`的時機，時機的邏輯如下：
    - `wg.Add()`會加入需等待的數目，這邊輸入 goroutine 的數量
    - `wg.Done()`會減去需等待的數目
    - `wg.Wait()`會使程式等待，等待至`sync.WaitGroup{}`等待數目被減去至 0 時才會繼續執行
    - 所以將`wg.Done()`都安排在讀取完`Task()`Channel 後，就可以確保讀完資料再`close(consumerCh)`
- `for new := range consumerCh`會讀取 Channel 資料，直到`close(consumerCh)`後跳脫 for 迴圈

執行後由於取的資料可以同時執行因此加快了執行速度：

![](https://i.imgur.com/RHbCmve.png)
