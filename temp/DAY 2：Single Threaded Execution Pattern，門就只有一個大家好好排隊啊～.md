## 什麼是 Single Threaded Execution Pattern？

> 透過 lock，只會有一個 goroutine 執行此區段的程式碼

## 問題情境

當設計一個點讚系統上線，允許一人有多個讚，此時會有多個 Client 進行點讚，系統需確保點讚數量正確無誤。

有可能會發生，A、B、C、D 四人同時點讚，由於 A 在讀取讚數後，A 還沒寫入 B 又進行了讀取，隨後 A 加一寫入後，B 現有的資料還是未加一的，在 B 寫入時就把 A 加的一覆蓋，導致讚數少加一，如圖：

![](https://i.imgur.com/LvVOPxy.png)

## 問題實作

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。

四位使用者各按 10000 次讚，預期會統計到 40000 個讚，

```go
package main

import (
	"fmt"
	"time"
)

type Like struct {
	Count uint16
}

func (l *Like) Add(writerID string) {
	l.Count++
}

func AddLikes(writerID string, like *Like) {
	for i := 0; i < 10000; i++ {
		like.Add(writerID)
	}
}

func main() {
	like := new(Like)
	go AddLikes("A", like)
	go AddLikes("B", like)
	go AddLikes("C", like)
	go AddLikes("D", like)
	time.Sleep(1 * time.Second) //等待goroutine執行完畢
	fmt.Println(like.Count)
}
```

結果只有 28366 個讚:

```go
$ go run problem.go
28366
```

由於`like.Add()`並沒有 goroutine safe(執行緒安全)，造成了讀寫`like.Count`產生了 race condition，即四個 goroutine 會同時讀寫 count，導致有 goroutine 在寫入後，其他 goroutine 卻沒有讀到最新資料的狀況。

## 解決方式

可以透過在 `like.Add()`裡新增 lock 來確保 function`只會被一個goroutine讀寫`，當一個 goroutine 取得 `like.Add()`的 lock，即有權限執行此 function，除非此 goroutine unlock，讓其他 goroutine 有機會取得 lock，否則其他 goroutine 只能等待，如圖：

![](https://i.imgur.com/NxL0LCq.png)

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
	l.count++
	fmt.Printf("%s change count: %d\n", writerID, l.count)
}

func AddLikes(writerID string, like *Like) {
	for i := 0; i < 10000; i++ {
		like.Add(writerID)
	}
}

func main() {
	like := new(Like)
	go AddLikes("A", like)
	go AddLikes("B", like)
	go AddLikes("C", like)
	go AddLikes("D", like)
	time.Sleep(1 * time.Second) //等待goroutine執行完畢
}
```

## 與語法多樣的 java 對照

在 java 中提供了更方便的 synchronized，讓 lock 機制可以只加一個關鍵字就解決，

```java
public class Like {
    private int count = 0;

    public synchronized void add() {
        this.count++;
        System.out.println("like count: " + this.count);
    }
}
```

而 golang 沒有 synchronized 關鍵字，是透過`sync.Mutex`直接透過操作 lock 的方式。在 Java 的設計中提倡以 synchronized 來讓程式更安全，因為直接使用 lock 可能會在 function 結束後忘記 unlock 造成 dead lock，那 golang 該如何安全的使用 lock 呢？

golang 靠 defer 解決忘記 unlock 的問題，在`lock()`當下我們可以在下一行程式碼加入`defer Unlock()`，這樣 Golang 在 compile 後就會在 function 的 return 處之前都加上 `Unlock()`，藉此達到與 synchronized 一樣方便安全的效果。defer 也不只用在 lock，凡要在 return 前執行的動作都可以用 defer，泛用性很高。