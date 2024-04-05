## 什麼是 Worker Pool Pattern？

> 設定好 pool 的 goroutine 數量，預先啟動多個 goroutine，把 job 傳給這些 goroutine 執行

與 Thread-Per-Message Pattern 類似，都是將 message 或 job 傳給 goroutine 執行的 pattern，不同的是：

- Thread-Per-Message Patternt 當接收到 message 的時候啟動 goroutine
- Worker Pool Pattern 是預先啟動好 goroutine，稱之為**pool**

預先啟動好的 goroutine 可以先做一些前置動作，例如 DB 連線、與其他 service 的 socket 連線等，可避免收到 job 時才開始執行這些動作導致速度緩慢，或者無法控制 goroutine 數量導致系統崩潰。

## 問題情境

延續[DAY 5：Thread-Per-Message Pattern](https://ithelp.ithome.com.tw/articles/10267174)的情境

設計一個推播新聞系統，會將新的新聞直接推播出去，我們希望推播系統效率要高，並且每次推播都會跟某 service 建立 socket 拿取資料，如圖：

![](https://i.imgur.com/2cYFpbx.png)

圖中**socket 連線**屬於耗時的 IO 行為，每個 goroutine 都連線 socket 會導致初始化過慢，並且 goroutine 一多起來，socket 連線過多會導致連線損壞。

設計有問題的程式碼如下：

(相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。)

```go
package main

import (
	"fmt"
	"time"
)

func PushNews(news string, startTime time.Time) <-chan time.Time {
	newsCh := make(chan time.Time)
	go func() {
		time.Sleep(time.Duration(10 * time.Second)) //模擬與某service建立socket的時間
		time.Sleep(time.Duration(3 * time.Second))  //模擬推播運行的時間
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
		"也不要吃太撐",
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

`time.Sleep(time.Duration(10 * time.Second))`會導致每個 goroutine 都花了 10 秒來練線 socket，導致運行緩慢。

## 解決方式

如果可以：

- 控制 goroutine 數量
- 預先連線 socket

即可避免 goroutine 接到 job 初始化過慢的問題，程式碼如下：

```go
package main

import (
	"fmt"
	"time"
)

type SendInfo struct {
	NewsName   string
	FinishTime time.Time
}

func Worker(id int, jobs <-chan string, results chan<- SendInfo, startTime time.Time) {
	time.Sleep(time.Duration(10 * time.Second)) //模擬與某service建立socket的時間
	for job := range jobs {
		time.Sleep(time.Duration(3 * time.Second)) //模擬推播運行的時間
		fmt.Printf("%s cost %s by worker %d\n", job, time.Since(startTime), id)
		results <- SendInfo{job, time.Now()}
	}
}

func main() {
	start := time.Now()
	allNews := []string{
		"中秋節來了",
		"記得",
		"不要戶外烤肉～",
		"也不要吃太撐",
	}
	jobs := make(chan string, len(allNews))
	results := make(chan SendInfo, len(allNews))

	for w := 1; w <= 2; w++ {
		go Worker(w, jobs, results, start)
	}

	for _, news := range allNews {
		jobs <- news
	}

	// do something

	for r := 1; r <= len(allNews); r++ {
		result := <-results
		fmt.Printf("news %s is sent at %s\n", result.NewsName, result.FinishTime)
	}
}
```

- `for w := 1; w <= 2; w++`在 pool 創建了三個 goroutine，稱之為 worker，他們會先初始化 socket 連線，讓後續有 job 傳入時不需要再執行一次 socket 連線
- `for _, news := range allNews`即開始送 job 給 worker，由於 worker 已經初始化，運行不會被 socket 初始化拖慢
- 控制 worker 的數量為三個，使 socket 連線數是可控的

概念如圖：

![](https://i.imgur.com/nop2xy9.png)

運行結果如圖：

![](https://i.imgur.com/NCgtoG6.png)

如此一來每次運行 goroutine 就不用做 socket 連線，節省了許多時間。

不過，由於 pool 只有運行三個 goroutine，而 news 有四個，所以第四個`也不要吃太撐`news 會在 pool 都處理完前三個 news 後再執行。Worker Pool Pattern 可以限制 pool 的 goroutine 數量，以避免系統負載過大，但也需要考慮 pool 是否過小，導致 news jobs 常常需等待 pool 的情形。
