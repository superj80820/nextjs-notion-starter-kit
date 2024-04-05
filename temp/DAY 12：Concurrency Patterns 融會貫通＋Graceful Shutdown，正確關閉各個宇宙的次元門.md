前 11 天已經將常見的 concurrency patterns 介紹完畢，今天我們要介紹的不是 patterns，而是在實務使用 concurrency patterns 要特別注意的事項「Graceful Shutdown」。

在實務的系統設計中，會將多個 pattern 融合以應付複雜的需求，本篇程式碼很長，如果範例過於複雜，建議可以先看 DAY 7 ~ DAY 11 的文章，先以較小的知識點來理解 pattern，再進入多個 pattern 結合的本文章。

## 什麼是 Graceful Shutdown？

> 安全的關閉正在運行的 goroutine，即 goroutine 當前的任務運行完畢再關閉

在[DAY 9：Worker Pool Pattern，就。很。Pool。](https://ithelp.ithome.com.tw/articles/10270015)，或[DAY 7：Fan-Out Fan-In Pattern，看吧世界！這就是多人解決的力量！](https://ithelp.ithome.com.tw/articles/10268715)的 pattern 中，如果在運行時直接使用 ctrl+c 關閉程序，正在運行的 goroutine 會直接關閉，導致正在被消費的 job 中斷，這樣會造成程式不安全。

舉例來說，如果有系統正在對 DB 進行 transaction，但 server 直接 shutdown 了，那 transaction 就不會 rollback，整個 DB 就會停在 transaction 的狀態，造成系統不穩定，我們期望應該是

> server 收到 shutdown 的請求後，停止接收新的 requests，將現有的 requests 處理完畢後 shutdown

## 問題情境

延續推播新聞系統的情境，將新的新聞直接推播出去，除了推播系統效率要高，還需紀錄推播完成的時間。

另外還加上以下各種情境，這都需要前面的 DAY 1 ~ DAY 11 的 pattern 觀念，我將其中比較核心的 pattern 也寫出來：

- 會有多個新聞 producer 輸入，並有一個 consumer 來消費，即：
    - [DAY 8：Producer Consumer Pattern](https://ithelp.ithome.com.tw/articles/10269446)的觀念
- consumer 消費處理完畢後會記錄推播完成的時間，即：
    - [DAY 7：Fan-Out Fan-In Pattern](https://ithelp.ithome.com.tw/articles/10268715)的觀念
- consumer 需要有多個 worker 來做耗時任務，即：
    - [DAY 9：Worker Pool Pattern](https://ithelp.ithome.com.tw/articles/10270015)的 worker 觀念
- 需要 Graceful Shutdown，即：
    - [DAY 10：Two-phase Termination Pattern](https://ithelp.ithome.com.tw/articles/10270786)安全關閉 goroutine 的觀念
    - [DAY 11：Thread-Specific Storage Pattern](https://ithelp.ithome.com.tw/articles/10271558)context 來控制 goroutine 生命週期的觀念

## 解決方式

整體的運行圖：

![](https://i.imgur.com/ZoyWHMI.png)

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。整體程式碼：

```go
package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

type SendInfo struct {
	NewsName   string
	FinishTime time.Time
}

type NewsSender struct {
	inputsChan  chan string
	jobsChan    chan string
	resultsChan chan SendInfo
	wg          *sync.WaitGroup
}

type NewsCompleteLogger struct {
	completeNews <-chan SendInfo
	done         chan bool
}

func (c *NewsSender) StartConsume(ctx context.Context) {
	for {
		select {
		case in := <-c.inputsChan:
			if ctx.Err() != nil {
				close(c.jobsChan)
				return
			}
			c.jobsChan <- in
		case <-ctx.Done():
			close(c.jobsChan)
			return
		}
	}
}

func (c *NewsSender) StartWorker(ctx context.Context, id int) {
	defer c.wg.Done()
	fmt.Printf("create worker %d\n", id)
	time.Sleep(time.Duration(3 * time.Second)) //模擬與某service建立socket的時間
	for {
		select {
		case job, ok := <-c.jobsChan:
			if !ok {
				fmt.Printf("close worker %d\n", id)
				return
			}
			time.Sleep(time.Duration(3 * time.Second)) //模擬推播運行的時間
			fmt.Printf("<<worker %d finish %s>>\n", id, job)
			c.resultsChan <- SendInfo{job, time.Now()}
		case <-ctx.Done():
			fmt.Printf("close worker %d\n", id)
			return
		}
	}
}

func (c *NewsSender) CreateWorkerPool(ctx context.Context, poolSize int) {
	c.wg = &sync.WaitGroup{}
	c.wg.Add(poolSize)
	for w := 0; w < poolSize; w++ {
		go c.StartWorker(ctx, w)
	}
}

func (c *NewsSender) StopWait(ctx context.Context) {
	c.wg.Wait()
	close(c.resultsChan)
}

func CreateNewsSender(ctx context.Context) *NewsSender {
	newsSender := NewsSender{
		inputsChan:  make(chan string),
		jobsChan:    make(chan string),
		resultsChan: make(chan SendInfo),
	}
	return &newsSender
}

func ProduceToNewsSender(allNews []string, inputsChan chan<- string) {
	for _, news := range allNews {
		fmt.Printf("<<producer send %s>>\n", news)
		inputsChan <- news
	}
}

func CreateNewsCompleteLogger(ctx context.Context, completeNews <-chan SendInfo) *NewsCompleteLogger {
	newsCompleteLogger := NewsCompleteLogger{
		completeNews: completeNews,
		done:         make(chan bool),
	}
	return &newsCompleteLogger
}

func (n *NewsCompleteLogger) StartLog(ctx context.Context) {
	for result := range n.completeNews {
		fmt.Printf("<<fan in news>> news %s is sent at %s\n", result.NewsName, result.FinishTime)
	}
	close(n.done)
}

func (n *NewsCompleteLogger) StopWait(ctx context.Context) {
	<-n.done
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	newsSender := CreateNewsSender(ctx)
	newsCompleteLogger := CreateNewsCompleteLogger(ctx, newsSender.resultsChan)
	newsSender.CreateWorkerPool(ctx, 3)

	go ProduceToNewsSender([]string{
		"中秋節來了",
		"記得",
		"不要戶外烤肉～",
		"也不要吃太撐",
	}, newsSender.inputsChan)
	go ProduceToNewsSender([]string{
		"床前明月光",
		"疑似地上霜",
		"舉頭望明月",
		"低頭思故鄉",
	}, newsSender.inputsChan)
	go ProduceToNewsSender([]string{
		"渭城朝雨邑輕塵",
		"客舍青青柳色新",
		"勸君更盡一杯酒",
		"西出陽關無故人",
	}, newsSender.inputsChan)

	go newsSender.StartConsume(ctx)
	go newsCompleteLogger.StartLog(ctx)

	termChan := make(chan os.Signal)
	signal.Notify(termChan, syscall.SIGINT, syscall.SIGTERM)
	<-termChan

	fmt.Println("================\nctrl+c event\n================")
	cancel()
	newsSender.StopWait(ctx)
	newsCompleteLogger.StopWait(ctx)
}
```

### Concurrency Patterns 融會貫通

![](https://i.imgur.com/LKaqj6g.png)

首先，整個系統分別有兩個 struct `NewsSender{}`與`NewsCompleteLogger{}`，

```go
type NewsSender struct {
	inputsChan  chan string
	jobsChan    chan string
	resultsChan chan SendInfo
	wg          *sync.WaitGroup
}

type NewsCompleteLogger struct {
	completeNews <-chan SendInfo
	done         chan bool
}
```

- `NewsSender{}`擁有
    - `inputsChan{}` 與 producer goroutine 溝通
    - `jobsChan{}` 將收到的任務朝 worker 發送
    - `resultsChan{}` 將 worker 處理完畢的新聞資訊與`NewsCompleteLogger{}`溝通
    - `wg{}`用來等待所有 goroutine 處理結束
- `NewsCompleteLogger{}`擁有
    - `completeNews{}`接收`resultsChan{}`的新聞資訊
    - `done`等待`completeNews{}`消費完畢後，發送訊號的 channel

`NewsSender{}`會實作 Producer Consumer Pattern、Worker Pool Pattern、Fan-Out Fan-In Pattern

![](https://i.imgur.com/6uOupT2.png)

將多個新聞輸入為 Producer Consumer Pattern，透過`ProduceToNewsSender()`送至`newsSender.inputsChan{}`

```go
func ProduceToNewsSender(allNews []string, inputsChan chan<- string) {
	for _, news := range allNews {
		fmt.Printf("<<producer send %s>>\n", news)
		inputsChan <- news
	}
}

go ProduceToNewsSender([]string{
	"中秋節來了",
	"記得",
	"不要戶外烤肉～",
	"也不要吃太撐",
}, newsSender.inputsChan)
go ProduceToNewsSender([]string{
	"床前明月光",
	"疑似地上霜",
	"舉頭望明月",
	"低頭思故鄉",
}, newsSender.inputsChan)
go ProduceToNewsSender([]string{
	"渭城朝雨邑輕塵",
	"客舍青青柳色新",
	"勸君更盡一杯酒",
	"西出陽關無故人",
}, newsSender.inputsChan)
```

而`NewsSender.StartConsume()`是一個 consumer 來消費，這是因為`newsSender.inputsChan{}`會再將接收到的新聞傳送至`newsSender.jobsChan{}`供 worker pool 處理。

```go
func (c *NewsSender) StartConsume(ctx context.Context) {
	for {
		select {
		case in := <-c.inputsChan:
			if ctx.Err() != nil {
				close(c.jobsChan)
				return
			}
			c.jobsChan <- in
		case <-ctx.Done():
			close(c.jobsChan)
			return
		}
	}
}
```

這些 woker 會預先啟動，即 Worker Pool Pattern 的觀念，已避免每次使用 goroutine 都要初始化

```go
func (c *NewsSender) StartWorker(ctx context.Context, id int) {
	defer c.wg.Done()
	fmt.Printf("create worker %d\n", id)
	time.Sleep(time.Duration(3 * time.Second)) //模擬與某service建立socket的時間
	for {
		select {
		case job, ok := <-c.jobsChan:
			if !ok {
				fmt.Printf("close worker %d\n", id)
				return
			}
			time.Sleep(time.Duration(3 * time.Second)) //模擬推播運行的時間
			fmt.Printf("<<worker %d finish %s>>\n", id, job)
			c.resultsChan <- SendInfo{job, time.Now()}
		case <-ctx.Done():
			fmt.Printf("close worker %d\n", id)
			return
		}
	}
}

func (c *NewsSender) CreateWorkerPool(ctx context.Context, poolSize int) {
	c.wg = &sync.WaitGroup{}
	c.wg.Add(poolSize)
	for w := 0; w < poolSize; w++ {
		go c.StartWorker(ctx, w)
	}
}

func main() {
	// ...
	newsSender.CreateWorkerPool(ctx, 3)
	// ..
}
```

最後新聞經`newsSender.jobsChan{}`到 woker pool 再到`newsSender.resultsChan{}`即形成了 Fan-Out Fan-In Pattern

`newsSender.resultsChan{}`會在交給`newsCompleteLogger.StartLog()`會不斷把`newsSender.resultsChan{}`送出的新聞時間記錄下來

```go
func (n *NewsCompleteLogger) StartLog(ctx context.Context) {
	for result := range n.completeNews {
		fmt.Printf("<<fan in news>> news %s is sent at %s\n", result.NewsName, result.FinishTime)
	}
	close(n.done)
}
```

### Graceful Shutdown

大家會發現 code 中所有的 function 都有傳入 context，即是需要用`context.WithCancel()`的方式，對底下所有的 goroutine 利用`ctx.Done()`做關閉。

透過`signal.Notify(termChan, syscall.SIGINT, syscall.SIGTERM)`來綁定`ctrl+c`的訊號，並等待觸發。

在觸發`ctrl+c`後，呼叫`cancel()`後，各個 goroutine 的`ctx.Done()`會開始執行關閉程序，必須要有方法等待至「所有 goroutine 已經關閉」，`newsSender{}`與`newsCompleteLogger{}`都有採用`StopWait()`實作

```go

// ...

func (c *NewsSender) StopWait(ctx context.Context) {
	c.wg.Wait()
	close(c.resultsChan)
}

// ...

func (n *NewsCompleteLogger) StopWait(ctx context.Context) {
	<-n.done
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())

	// ...

	termChan := make(chan os.Signal)
	signal.Notify(termChan, syscall.SIGINT, syscall.SIGTERM)
	<-termChan

	fmt.Println("================\nctrl+c event\n================")
	cancel()
	newsSender.StopWait(ctx)
	newsCompleteLogger.StopWait(ctx)
}
```

- `newsSender.StopWait()`：裡頭`c.wg.Wait()`會等待所有 goroutine 的`c.wg.Done()`運行，`c.wg.Done()`是由`ctx.Done()`觸發。`c.wg.Wait()`等待完畢後，關閉`newsSender.resultsChan{}`做善後動作
- `newsCompleteLogger.StopWait()`：裡頭`newsCompleteLogger.done{}`會等待唯一一個 goroutine 運行完畢，即`newsCompleteLogger.StartLog()`將`newsSender.resultsChan{}`都讀完的時候會對`newsCompleteLogger.done{}`做 close

`.StopWait()`都執行完畢後，即所有 goroutine 對剩餘的訊息都消費完畢，即可安全的關閉主程序`main()`。
