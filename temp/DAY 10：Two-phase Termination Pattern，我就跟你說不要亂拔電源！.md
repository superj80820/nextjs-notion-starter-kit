## 什麼是 Two-phase Termination Pattern？

> 分兩個階段關閉 goroutine，第一階段先結束 goroutine 的程式邏輯，第二階段再結束 goroutine 本身

![](https://i.imgur.com/MCUxWsp.png)

此模式的核心目標如以下三點：

1. 安全的終止 goroutine（安全性）
2. 必定會關閉 goroutine（生命性）
3. 發出關閉請求後盡快運行邏輯關閉的處理（響應性）

以 golang 來說我們關閉 goroutine 會採取關閉 channel 的方法：

```go
package main

func main() {
	done := make(chan bool)
	go func() {
		for {
			select {
			case <-done:
				// 關閉的善後程序
				return
            // 其他 case
			}
		}
	}()

	close(done)
}
```

這樣的關閉方式其實就有滿足以上三點了。收到`done channel`被關閉的訊號後，goroutine 會執行`case <-done:`區域的善後程序並 return 關閉 goroutine：

- 達到安全性：不會有意外退出的情形。
- 達到生命性：不會有 goroutine 是暫停狀態的情形而無法關閉。
- 達到響應性：跟生命性的問題相關，不會有 goroutine 是暫停狀態的情形而沒有處理關閉程序

所以在平常使用 golang 的時候並不會思考這些問題，Two-phase Termination Pattern 主要是在 java 這類「直接控制 thread 生命週期」的語言才會應用到。

java 的 thread 是用物件封裝的，開發者可以控制 thread 的生命週期，並且提供了 `Thread.stop()`來關閉 thread，但這是不安全的，他會使運行的 thread 突然中止，就好像正在計算的電腦，插座直接被拔掉了一樣。

因此 java 開發者不建議用`Thread.stop()`關閉 thread，而是用`Thread.interrupt()`加上`flag`的方式，

- `Thread.interrupt()`是為了關閉正處於`Thread.sleep()`、`Thread.wait()`這類「暫停狀態」的 thread
- `flag`是為了關閉正在運行的 thread

如下：

```java
try {
    while (isRunnable) {
        doSomething();
    }
} catch (InterruptedException e) {
} finally {
    doShutdown();
}
```

如果 thread 正在運行，`while (isRunnable)`這個`flag`是`false`的話就可以控制是否運行。

如果 thread 運行`Thread.sleep()`、`Thread.wait()`導致 thread 暫停，`Thread.interrupt()`就可以使 thread 拋出異常`InterruptedException`，並執行最後的`doShutdown()`善後程序。

java 設計會以一個 function 執行`Thread.interrupt()`與改變`flag`，而正在運行的 thread 再執行關閉動作，

```java
public void terminate() {
	isRunnable = false;
	interrupt();
}
```

從`Thread.stop()`到`Thread.interrupt()`，會較能比對出 Two-phase Termination Pattern 「兩階段終止」的行為。

而 golang 不能直接控制 goroutine 的生命週期，無法做出 java 直接關閉 thread 的行為，所以原本 channel 的做法，即符合 Two-phase Termination Pattern 的目標。

## 問題情境

設計一個提示，提示關閉程序後顯示。

## 解決方式

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。

```go
package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		for {
			select {
			case <-done:
				fmt.Println("bye bye")
				os.Exit(1)
			}
		}
	}()

	// do something

	select {}
}
```

`done{}` channel 會透過`signal.Notify()`與`os.Interrupt`、`syscall.SIGINT`、`syscall.SIGTERM`這些關閉相關的 system 訊號綁定，並以 goroutine 的方式一直運作在整個程序。

再執行`do something`的部分時，只要我們使用`control+c`或者其他關閉程序的方法，channel 接收到關閉訊號就會安全地執行`case <-done:`範圍的 code，即在 terminal 顯示`bye bye`提示並關閉程序。
