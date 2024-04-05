在 DAY 2~DAY 4 我們使用到了 goroutine、lock、channel，主要目標在**保護**併發下的資料避免 race condition，接下來會以提高執行**效率**為討論重點。

## 什麼是 Thread-Per-Message Pattern？

> 每一個 message 開啟一個 goroutine 來運行

如果有多個 task 需要運行，每個 task 的執行時間過長，比如 IO 或者是複雜的運算，那一個一個執行 task 是相當浪費時間的，只要 task 沒有執行順序的需求，可以將所有 task 都同時執行。

並且 Thread-Per-Message Pattern 是用在不需要 goroutine 回傳值的情境中，如果需要回傳值，可以使用 Future Pattern，接下來的文章會再介紹。

![](https://i.imgur.com/FjBmPTL.png)

## 問題情境

設計一個推播新聞系統，會將新的新聞直接推播出去，我們希望推播系統效率要高。

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。

實作有問題的系統如下：

```go
package main

import (
	"fmt"
	"time"
)

func PushNews(news string, startTime time.Time) {
	time.Sleep(time.Duration(3 * time.Second)) //模擬推播運行的時間
	fmt.Printf("%s cost %s\n", news, time.Since(startTime))
}

func main() {
	start := time.Now()
	allNews := []string{
		"中秋節來了",
		"記得",
		"不要戶外烤肉～",
	}
	for _, news := range allNews {
		PushNews(news, start)
	}
	fmt.Printf("cost %s", time.Since(start))
}
```

由於每則新聞都是一則一則推播，所以耗時了約 9 秒

![](https://i.imgur.com/coXVtD9.png)

## 解決方式

在`PushNews()`加上`go`就可以啟動 goroutine 來推播

```go
package main

import (
	"fmt"
	"time"
)

func PushNews(news string, startTime time.Time) {
	time.Sleep(time.Duration(3 * time.Second)) //模擬推播運行的時間
	fmt.Printf("%s cost %s\n", news, time.Since(startTime))
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

由於是同時推播，所以推播只花了 3 秒

![](https://i.imgur.com/xNWDona.png)
