## 什麼是 Thread-Specific Storage Pattern？

> 為每個 goroutine 擁有自己的儲存空間，供不同的情境識別與使用

舉例來說，如果正在設計一個 logger 物件，我們希望不同 goroutine 透過此物件紀錄 log 時也能說明此動作是哪個 goroutine 做的，那此 logger 物件就需要「能辨識不同的 goroutine」。

### java 的方式

以 java 來說，設計的方式是一個 logger 物件擁有 ThreadLocal 類別，ThreadLocal 簡單來說即是一個 hashmap，但他在`.get()`與`.set()`時都可以以 thread id 來當作 key，並存入任意 value。

不同的 thread 從此空間拿取資料只能依照自己的 thread id 拿取，所以不會產生 race condition，也不需要 lock 保護，如圖：

![](https://i.imgur.com/gYvMaSY.png)

### golang 的方式

golang 的標準庫不提供取得 goroutine id 的方法，gopher Andrew Gerrand 認為：

> We wouldn't even be having this discussion if thread local storage wasn't useful. But every feature comes at a cost, and in my opinion the cost of threadlocals far outweighs their benefits. They're just not a good fit for Go.

即取得 id 的開銷比實際的應用來的大，所以不採用此方式。雖然有[gls](https://github.com/jtolio/gls)這樣的 library，但是利用 stack 的特性來實作，並不是很穩定的作法。

所以 golang 是採用 context 的做法來達到「讓 goroutine 擁有自己的儲存空間」，context 可以利用`With`等方法，把 context 夾帶**某些值**，帶到不同的 goroutine，

- `context.WithValue(ctx, key, val)`: 可以將原有 context 新增某 key，並存放著某 value

除此之外也有其他`With`方法，讓 context 可以夾帶**某些功能**，

- `context.WithCancel(ctx, cancelFunc)`: 讓 context 夾帶**取消功能**，當呼叫取消後，`context.Done()`就會發出 close 訊號
- `context.WithDeadline(ctx, deadlineTime)`: 讓 context 夾帶**特定時間結束功能**，當到特定時間後，`context.Done()`就會發出 close 訊號
- `context.WithTimeout(ctx, timeout)`: 讓 context 夾帶**倒數計時結束功能**，當倒數計時完畢後，`context.Done()`就會發出 close 訊號

每個 goroutine 都可以用的`context.With`來複製一份 context 並添加事物，藉此達到獨立的儲存空間，如圖：

![](https://i.imgur.com/fAlzza0.jpg)

上圖每個地鼠都是一個 goroutine，他們都擁有自己透過`With`複製的 context

## 問題情境

設計一個 server 的 logger 系統，在不同 goroutine request 進入系統後，log 時都會顯示 request id

## 解決方式

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。

透過`context.WithValue()`，將不同 goroutine request 的 context 夾帶唯一的 uuid，在`RequestHandler()`運行時就可以用`ctx.Value(RequestID{})`取出 request id 來 log，如下：

```go
package main

import (
	"context"
	"fmt"
	"time"

	uuid "github.com/satori/go.uuid"
)

type RequestID struct{}

func RequestHandler(ctx context.Context) {
	fmt.Printf("request ID is %s\n", ctx.Value(RequestID{}))

	// do something
}

func main() {
	ctx := context.Background()
	go RequestHandler(context.WithValue(ctx, RequestID{}, uuid.NewV4().String()))
	go RequestHandler(context.WithValue(ctx, RequestID{}, uuid.NewV4().String()))
	go RequestHandler(context.WithValue(ctx, RequestID{}, uuid.NewV4().String()))

	time.Sleep(10 * time.Second) //等待goroutine執行完畢
}
```

事實上這就是很多框架如[gin](https://github.com/gin-gonic/gin), [iris](https://github.com/kataras/iris)對 request id 添加方式，會在 router 設定處添加`RequestIDMiddleware()`這類 middleware，並會在裡頭處理與`context.WithValue()`概念相同的實作，將 request id 添加到此 request 的 context 上，供後續 log 使用，gin 的範例如下：

```go
func RequestIdMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    c.Writer.Header().Set("X-Request-Id", uuid.NewV4().String())
    c.Next()
  }
}

func main() {
  router := gin.Default()
  router.Use(RequestIdMiddleware)

  // 其他router設定
}
```
