## 什麼是 Read-Write-Lock Pattern？

> 多讀單寫。將 lock 分為 read 與 write 兩種，讓 lock 效能更佳，read 行為不會改變資料，所以 read lock 時可以再同時 read，達到「多讀」，而 write 行為會改變資料，所以 write lock 不能再同時 read 與 write 時，達到「單寫」

read, write 中在取得 lock 的時候，只要碰到以下兩種「衝突 conflict」狀態，就會等待此衝突結束，再取得 lock：

- read 與 write 的 lock 同時存在
- write 與 write 的 lock 同時存在

而在以下情形，會直接取得 lock，不會等待此狀態結束：

- read 與 read 的 lock 同時存在

## 問題情境

延續上篇 Single Threaded Execution Pattern 的情境，

當設計一個點讚系統上線，允許一人有多個讚，此時會有多個 Client 進行點讚，系統需確保點讚數量正確無誤，還須確保讀寫效能不受到太大影響。

有可能會發生，A、B、C、D 同時兩人點讚與兩人讀讚，由於 A 在讀取讚數後，A 還沒寫入 B、C 又進行了讀取，隨後 A 加一寫入後，B、C 現有的資料還是未加一的，B、C 將資料拿去顯示，就會是舊的數字，如圖：

![](https://i.imgur.com/ku8kUvg.png)

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。

實作有問題的系統如下，A、D 不斷地寫入，B、C 不斷的讀取：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type Like struct {
	count uint8
}

func (l *Like) Add(writerID string) {
	fmt.Printf("%s change count: %d\n", writerID, l.count+1)
	l.count++
}

func (l *Like) Show(readerID string) {
	fmt.Printf("%s read count: %d\n", readerID, l.count)
}

func AddLikes(writerID string, like *Like) {
	for i := 0; i < 100; i++ {
		like.Add(writerID)
	}
}

func ReadLikes(readerID string, like *Like) {
	for i := 0; i < 200; i++ {
		like.Show(readerID)
	}
}

func main() {
	like := new(Like)
	go AddLikes("A", like)
	go ReadLikes("B", like)
	go ReadLikes("C", like)
	go AddLikes("D", like)
	time.Sleep(10 * time.Second) //等待goroutine執行完畢
}
```

執行後會發現當 A、D 改變 like.count 之後，B、C 並不同步，如圖 D 已經將 like.count 改成 27，但 B 其中一次讀取是 20，C 其中一次讀取也是 20

![](https://i.imgur.com/fJ8BMYb.png)

## 解決方式

在寫入處`Add()`與讀取處`Show()`中加入`sync.Mutex{}`的 lock，使讀寫不同時進行，如圖：

![](https://i.imgur.com/SknzyXc.png)

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type Like struct {
	sync.Mutex
	count uint16
}

func (l *Like) Add(writerID string) {
	l.Lock()
	defer l.Unlock()
	fmt.Printf("%s change count: %d\n", writerID, l.count+1)
	l.count++
}

func (l *Like) Show(readerID string) {
	l.Lock()
	defer l.Unlock()
	fmt.Printf("%s read count: %d\n", readerID, l.count)
}

func AddLikes(writerID string, like *Like) {
	for i := 0; i < 100; i++ {
		like.Add(writerID)
	}
}

func ReadLikes(readerID string, like *Like) {
	for i := 0; i < 200; i++ {
		like.Show(readerID)
	}
}

func main() {
	like := new(Like)
	go AddLikes("A", like)
	go ReadLikes("B", like)
	go ReadLikes("C", like)
	go AddLikes("D", like)
	time.Sleep(10 * time.Second) //等待goroutine執行完畢
}
```

但執行之後會發現，B、C 讀取害 like.count 被改變的機會降得很低，如圖：

![](https://i.imgur.com/Z2IZAqa.png)

這是因為只要 lock 存在，其他 lock 請求就必須等待，因為 B、C 爭取 lock 大大降低了整個系統取得 lock 的機會，但我們仔細思考看看，B、C 真的需要競爭此 lock 嗎？答案是不用的，因為 B、C 並不會改變 like.count，所以可以同時運行，系統只需注意 A、D 要改變 like.count 的其他人都讀寫完畢即可，整體運行的時間也會降低，如圖：

![](https://i.imgur.com/uwFXNIb.png)

將`sync.Mutex{}`換成`sync.RWMutex{}`讀寫鎖，`Show()`部分的 lock 換成 read-lock，如下：

```golang
package main

import (
	"fmt"
	"sync"
	"time"
)

type Like struct {
	sync.RWMutex
	count uint16
}

func (l *Like) Add(writerID string) {
	l.Lock()
	defer l.Unlock()
	fmt.Printf("%s change count: %d\n", writerID, l.count+1)
	l.count++
}

func (l *Like) Show(readerID string) {
	l.RLock()
	defer l.RUnlock()
	fmt.Printf("%s read count: %d\n", readerID, l.count)
}

func AddLikes(writerID string, like *Like) {
	for i := 0; i < 100; i++ {
		like.Add(writerID)
	}
}

func ReadLikes(readerID string, like *Like) {
	for i := 0; i < 200; i++ {
		like.Show(readerID)
	}
}

func main() {
	like := new(Like)
	go AddLikes("A", like)
	go ReadLikes("B", like)
	go ReadLikes("C", like)
	go AddLikes("D", like)
	time.Sleep(10 * time.Second) //等待goroutine執行完畢
}
```

B、C 多讀，A、D 單寫，使得寫入與讀取的機會都變得更有效率，如圖：

![](https://i.imgur.com/iR2Ui3U.png)
