Creational 建立相關的 patterns 已經告一段落，接下來要進入 Structural 結構模式相關的 patterns，主要目的在**設計出低耦合的物件關係**，會以 Adapter Pattern 作為開頭。

## 什麼是 Adapter Pattern？

> 將不同產品**不一樣的使用方式**統一，讓使用者可以用**統一的方式**使用不同產品

市面上有很多不同的 usb 接口，比如 type-a、type-c、micro b 等等，如果我的電腦只支援 type-a 的接口，那就需要一個**adapter(轉換器)**，將 type-c、micro b**不同**的接口轉換成**統一**的。

在寫 code 也是一樣，系統建構時，如果有多個不同的套件，處理的情境相同，但方法名稱不同，建議以 Adapter Pattern 來實作，除了可以彈性的替換套件，也可以避免系統被套件綁定。

什麼是系統被套件綁定？就好像電腦所有的接口都插著 type-a 的設備，而從來不用 adapter，如果有天需使用 type-c 的設備，那除了把插口拔除換成 adapter 別無他法，那如果我們事先就是用 adater 插著電腦，未來要用 type-c 的設備就不需要拔除的這一段(即更改實作)

UML 圖：

![](https://i.imgur.com/p7vnnZc.png)

圖中`AdapteeA{}`、`AdapteeB{}`都有各自的方法，如果 user 要使用他們，必須要有一個統一規範，即是`Target` interface，`AdapterA{}`、`AdapterB{}`遵循著規範將`AdapteeA{}`、`AdapteeB{}`各自的方法轉換成`Target.methodForUser()`方法給 user 使用。

## 問題情境

使用者買了一個格鬥遊戲大搖，這個大搖可供 PS5 與 Switch 兩種不同的晶片使用，廠商在訊號傳遞上，需設計一個 adapter 轉換器，將大搖的指令可套用在不同的裝置上。

## 解決方式

UML 圖如下:

![](https://i.imgur.com/7zaEdsL.png)

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)

code 如下:

```go
package main

import "fmt"

type SignalHandler interface {
	ClickButton()
}

type PS5 struct{}

func (_ PS5) ClickPS5Button() {
	fmt.Println("click ps5 button")
}

type PS5Adapter struct {
	ps5Machine *PS5
}

func (p PS5Adapter) ClickButton() {
	p.ps5Machine.ClickPS5Button()
}

type Switch struct{}

func (_ Switch) ClickSwitchButton() {
	fmt.Println("click switch button")
}

type SwitchAdapter struct {
	switchMachine *Switch
}

func (p SwitchAdapter) ClickButton() {
	p.switchMachine.ClickSwitchButton()
}

func CreateSignalHandler(platform string) SignalHandler {
	var signalHandler SignalHandler
	switch platform {
	case "ps5":
		signalHandler = PS5Adapter{
			ps5Machine: &PS5{},
		}
	case "switch":
		signalHandler = SwitchAdapter{
			switchMachine: &Switch{},
		}
	}
	return signalHandler
}

func main() {
	signalHandler := CreateSignalHandler("ps5")
	signalHandler.ClickButton()
}
```

由於`PS5{}`、`Switch{}`各自點選按鈕的方式不同，所以設計了`PS5Adapter{}`、`SwitchApater{}`並依照`SignalHandler`interface 將功能轉換實作至`ClickButton()`，使用者由於只依賴`SignalHandler`interface，不需理解實際`PS5{}`、`Switch{}`的點選按鈕的方式，只需選擇平台後創建好`signalHandler`，並點選即可。
