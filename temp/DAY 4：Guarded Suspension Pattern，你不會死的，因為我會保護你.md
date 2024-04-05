## 什麼是 Guarded Suspension Pattern？

> 如果 thread 執行時條件不符，就停下等待，等到條件符合時再開始開始執行

## 問題情境

當設計線上即時顯示留言板時，會接受大量的留言，並將其顯示出來，我們需確保留言不出現 race condition，也需確保沒留言時不執行顯示。

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。

實作有問題的系統如下，使用者不斷用`SendMessage()`發送留言`cool`至相當於 queue 的 m.messages slice，`Show()`會不斷讀取 m.messages 顯示，並移除訊息：

```go
package main

import (
	"fmt"
	"math/rand"
	"time"
)

type MessageBoard struct {
	messages []string
}

func (m *MessageBoard) SendMessage(message string) {
	m.messages = append(m.messages, message)
}

func (m *MessageBoard) Show() {
	for {
		fmt.Println(m.messages[0])
		m.messages = m.messages[1:]
	}
}

func main() {
	messageBoard := new(MessageBoard)
	go func() {
		for {
			time.Sleep(time.Duration(rand.Intn(10)) * time.Millisecond) //模擬各個client發送的隨機處理時間
			messageBoard.SendMessage("cool")
		}
	}()
	go func() {
		for {
			time.Sleep(time.Duration(rand.Intn(10)) * time.Millisecond) //模擬各個client發送的隨機處理時間
			messageBoard.SendMessage("cool")
		}
	}()
	go func() {
		messageBoard.Show()
	}()
	time.Sleep(10 * time.Second) //等待goroutine執行完畢
}
```

由於 m.messages 可能不存在訊息，此時讀取會發生 error 如下：

![](https://i.imgur.com/WUWehtr.png)

## 解決方式

需要在 m.messages 讀取時，新增執行條件，即「m.messages 為空的時候等待而不讀取，等到有訊息實再讀取顯示」，此時可以透過 channel 來實現，將 slice 改為 channel 如下

```go
package main

import (
	"fmt"
	"math/rand"
	"time"
)

type MessageBoard struct {
	messages chan string
}

func (m *MessageBoard) SendMessage(message string) {
	m.messages <- message
}

func (m *MessageBoard) Show() {
	for {
		fmt.Println(<-m.messages)
	}
}

func CreateMessageBoard() *MessageBoard {
	messageBoard := new(MessageBoard)
	messageBoard.messages = make(chan string, 100) //可容納100條訊息
	return messageBoard
}

func main() {
	messageBoard := CreateMessageBoard()
	go func() {
		for {
			time.Sleep(time.Duration(rand.Intn(10)) * time.Millisecond) //模擬各個client發送的隨機處理時間
			messageBoard.SendMessage("cool")
		}
	}()
	go func() {
		messageBoard.Show()
	}()
	time.Sleep(10 * time.Second) //等待goroutine執行完畢
}
```

channel 有幾個特性：

- 在讀寫時不會產生 race condtion
- 在讀取時如果沒有元素，會等待到有值再執行
- 如果使用 unbuffered channel，`e.g. make(chan string)`，寫入後如果沒有讀取，會在寫入處等待
- 如果使用 buffered channel，`e.g. make(chan string, 100)`，寫入後如果沒有讀取，可以繼續寫入，直到到達 buffer 數才會等待讀取

所以在程式碼中，當 m.messages 不存在訊息時，`Show()`會等待到有訊息在進行顯示。channel 可容納 100 條訊息，不會讓`SendMessage()`每條訊息都要等到`Show()`顯示完才能繼續發送。

## 跟經典 Java 模式比對

事實上，Guarded Suspension Pattern 經典的做法是採用值來當作「執行條件」，以此範例來說就是：

```go
for len(m.messages) != 0 {
	fmt.Println(m.messages[0])
	m.messages = m.messages[1:]
}
```

並且為了避免 for 迴圈一直重複檢查`len(m.messages) != 0`讓 cpu 飆升，所以需使用`sync.Cond{}`的`Wait()`來讓 goroutine 暫停，並在`SendMessage()`時用`Signal() or Broadcast()`啟動已暫停的 goroutine，其實相當於 java synchronized 的`Wait()`與`Notify() or notifyAll()`。

但 golang 提倡「share memory by communicating」，即 CSP(Communication Sequential Process)的目標之一，透過 channel 來在不同 goroutine 間分享資料，如果以`len(m.messages) != 0`來實作執行條件即是「communicate by sharing memory」，我們需透過`Lock()`、`Unlock()`來保護 m.messages，也需透過`Wait()`、`Signal()`來避免 goroutine 的執行與否，程式碼會複雜較多，而 channel 可以簡單乾淨的實現以上需求，因此多數 gopher 面對 Guarded Suspension Pattern 會採用 channel 而非`sync.Cond{}`，甚至有著廢除`sync.Cond{}`的[issue](https://github.com/golang/go/issues/21165)，不過在更複雜的場景與效能考量上，例如喚起不同停住的 goroutine，所以`sync.Cond{}`還是有存在的必要，所以此方案目前沒有被採用。

## 感謝

同事 Vic 協助校稿