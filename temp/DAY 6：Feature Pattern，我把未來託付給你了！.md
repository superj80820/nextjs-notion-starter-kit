## 什麼是 Future Pattern？

> 呼叫者將 task 交給 goroutine 執行，執行完畢後 goroutine 將 task 運行得到的結果傳回呼叫者

在昨天講解完 Thread-Per-Message Pattern 後，將 message 以 goroutine 執行後，是沒辦法獲得回傳值的，如果有此需求，可以搭配 Future Pattern

當 goroutine 運行後，呼叫者需要有一個中間物件來去取得 goroutine 未來運行的結果，golang 通常採用 channel 實作

![](https://i.imgur.com/6VcgtcL.png)

## 問題情境

延續推播新聞系統的情境，將新的新聞直接推播出去，除了推播系統效率要高，還需紀錄推播完成的時間

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。

昨天的 code 並沒辦法接收到`PushNews()`的回傳運行完結束的時間值：

```go
package main

import (
	"fmt"
	"time"
)

func PushNews(news string, startTime time.Time) time.Time {
	time.Sleep(time.Duration(3 * time.Second)) //模擬推播運行的時間
	fmt.Printf("%s cost %s\n", news, time.Since(startTime))
	return time.Now()
}

func main() {
	start := time.Now()
	allNews := []string{
		"中秋節來了",
		"記得",
		"不要戶外烤肉～",
	}
	for _, news := range allNews {
		go PushNews(news, start)
	}
	time.Sleep(10 * time.Second) //等待goroutine執行完畢
}
```

## 解決方式

將 golang channel，實作至`PushNews()`中。goroutine 運行後，將`newsCh{}`先回傳給呼叫者`main()`，在**未來(feature)**時 goroutine 會將發送完畢的時間`time.Now()`傳至 channel，呼叫者`main()`只需在需要時等待 channel 收到`time.Now()`出現，如下：

```go
package main

import (
	"fmt"
	"time"
)

func PushNews(news string, startTime time.Time) <-chan time.Time {
	newsCh := make(chan time.Time)
	go func() {
		time.Sleep(time.Duration(3 * time.Second)) //模擬推播運行的時間
		fmt.Printf("%s cost %s\n", news, time.Since(startTime))
		newsCh <- time.Now()
	}()
	return newsCh
}

func main() {
	start := time.Now()
	allNews := []string{
		"中秋節來了",
		"記得",
		"不要戶外烤肉～",
	}
	newsChs := []<-chan time.Time{}
	for _, news := range allNews {
		newsChs = append(newsChs, PushNews(news, start))
	}

	// do something

	for index, newsCh := range newsChs {
		fmt.Printf("news %d is sent at %s\n", index, <-newsCh)
	}
}
```

先透過`for _, news := range allNews`將所有的新聞發送以啟動 goroutine，但這邊僅是啟動，並取得一個中間物件 channel，等到有需要再從 channel 取得資料，甚至可以先在`// do somethins`處做其他事情。

最後在`for index, newsCh := range newsChs`取得 channel 的資料，如[Guarded Suspension Pattern yorktodo](yorktodo)所說，channel 會等到有資料再運行，否則等待，所以此處會等到所有`<-newsCh`都接收完畢才會離開 for 迴圈運行完`main()`，如下：

![](https://i.imgur.com/hiIsqpW.png)

## 與常見的 javascript promise 對比

promise 與 feature 是相似的概念，差異是：

- promise 是以`.then(function)`的風格傳送 function 給 promise 來去實作取得資料後的動作
- feature 是以`.get()`或者 golang `<-channel`的方式取得資料後再呼叫處實作後續動作

但兩者精神相同，都是處理如何**異步**取得資料。

如果熟悉 javascript 的話，可以用`Promise.all()`去思考此範例，如下：

```javascript
const pushNews = (news, startTime) =>
  new Promise((resolve) =>
    setTimeout(() => {
      console.log(`${news} cost ${Date.now() - startTime}`);
      resolve(Date.now());
    }, 3000)
  );

const start = Date.now();
Promise.all(
  ["中秋節來了", "記得", "不要戶外烤肉～"].map((news) => pushNews(news, start))
).then((allNews) =>
  allNews.map((finishTimes, index) =>
    console.log(`"news ${index} is sent at ${finishTimes}"`)
  )
);

// do something
```

會發現`for _, news := range allNews`與`Promise.all()`相同都是在啟動異步的 code，等到異步的資料都會來就以`.then(function)`中的 function 來處理，由於示異步，我們也可以在程式`// do something`處執行其他事情而不被 block
