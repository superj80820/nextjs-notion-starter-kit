## 什麼是 Decorator Pattern？

> 不以靜態繼承而是用動態組合的方式增加功能

UML 圖如下:

![](https://i.imgur.com/F77FKK5.png)

ProductDecorator 與 ProductA、ProductB 類別一樣都是以 Product interface 實作，並且擁有依照 Product 定義的成員，所以在呼叫`operation()`時就可以呼叫成員的`operation()`並且再新增額外的功能。

## 問題情境

在 golang 中沒有繼承，所以在現有功能中新增功能其實就是利用 Decorator Pattern，但如果在 java 中，時常使用繼承來新增功能，但如果過度使用繼承，事實上沒有辦法重用程式，如下：

![](https://i.imgur.com/I5zwNrK.png)

PS5 主機 interface 有`PS5.StartGPUEngine()`來啟動顯示晶片，`PS5WithCD{}`、`PS5WithDigital{}`都會繼承此 interface 來實作，但如果這時候要在顯示晶片上新增加強功能，就需要在繼承一次導致`PS5WithCDPlus{}`、`PS5WithDigitalPlus{}`的產生，但看我們要做的事情的本質就是「一個」新增加強功能，需要「兩個」類是多餘的。

## 解決方式

UML 圖如下:

![](https://i.imgur.com/YZrVKRR.png)

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)

code 如下:

```go
package main

import "fmt"

type PS5 interface {
	StartGPUEngine()
}

type PS5WithCD struct{}

func (p PS5WithCD) StartGPUEngine() {
	fmt.Println("start normal gpu engine")
}

type PS5WithDigital struct{}

func (p PS5WithDigital) StartGPUEngine() {
	fmt.Println("start normal gpu engine")
}

type PS5MachinePlus struct {
	ps5Machine PS5
}

func (p *PS5MachinePlus) SetPS5Machine(ps5 PS5) {
	p.ps5Machine = ps5
}

func (p PS5MachinePlus) StartGPUEngine() {
	p.ps5Machine.StartGPUEngine()
	fmt.Println("start plus plugin")
}

func main() {
	ps5MachinePlus := PS5MachinePlus{
		ps5Machine: PS5WithCD{}, // or PS5WithDigital{}
	}
    // ps5MachinePlus.SetPS5Machine(PS5WithDigital{}) // 可以在更換主機
	ps5MachinePlus.StartGPUEngine()
}
```

我們將加強功能定義為一個 struct `PS5MachinePlus{}`，這個`PS5MachinePlus{}`介面跟`PS5WithCD{}`、`PS5WithDigital{}`介面都是以`PS5`interface 來實作的，所以外部使用者呼叫的時候介面是沒有變更的。

`PS5MachinePlus{}`擁有`ps5Machine{}`，此成員依賴`PS5`interface，讓 `PS5WithCD{}`、`PS5WithDigital{}`都可以帶入。

`PS5MachinePlus{}`在內部實作`StartGPUEngine()`時，會使用到`ps5Machine{}`，`ps5Machine{}`可以在創建 struct 的時候帶入，也可以透過 `SetPS5Machine()` 替換，他是**動態**帶入的，這也讓 Decorator Pattern 在 runtime 更加彈性。
