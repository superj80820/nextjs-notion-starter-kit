工廠模式主要有三種不同的實作：

- Simple Factory Pattern
- Factory Method Pattern
- Abstract Factory Pattern

這三種實作由簡單到複雜，今天會介紹最單純的 Simple Factory Pattern

## 什麼是 Simple Factory Pattern？

> 由一個工廠將製作產品的細節隱藏，讓使用者不需要不需要知道細節也能獲得產品

在製作一個物件的時候，物件常常還需要有其他後製的處理，這些處理使用者不需要知道，使用者只需要獲得此產品即可，所以需要將後製處理作封裝

## 問題情境

要生產 PS5 主機**光碟版**與**數位版**給使用者，但使用者不需要知道「如何生產 CPU、顯示晶片與加裝光碟機」，使用者只需要獲得此產品就行。

實作有問題的 code 如下：

(相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns))

```go
package factory

import "fmt"

type PS5WithCD struct{}

func (p PS5WithCD) PlayGame() {
	fmt.Println("loading cd...play!")
}
func (p PS5WithCD) AddCDMachine() {
	fmt.Println("adding cd machine...done!")
}
func (p PS5WithCD) AddCPU() {
	fmt.Println("adding cpu...done!")
}
func (p PS5WithCD) AddGPU() {
	fmt.Println("adding gpu...done!")
}

type PS5WithDigital struct{}

func (p PS5WithDigital) PlayGame() {
	fmt.Println("loading digital file...play!")
}
func (p PS5WithDigital) AddCPU() {
	fmt.Println("adding cpu...done!")
}
func (p PS5WithDigital) AddGPU() {
	fmt.Println("adding gpu...done!")
}

func main() {
	ps5 := PS5WithCD{}
	ps5.AddCDMachine()
	ps5.AddCPU()
	ps5.AddGPU()

	// or
	// ps5 := PS5WithDigital{}
	// ps5.AddCPU()
	// ps5.AddGPU()

	ps5.PlayGame()
}
```

使用者有可能會購買光碟版`PS5WithCD{}`或數位版`PS5WithDigital{}`，並且回家玩遊戲`.PlayGame()`，但 PS5 得組裝方式`.AddCDMachine()`、`.AddCPU()`、`.AddGPU()`都是使用者不需要知道的。

~~想像一下你去買 PS5 的時候老闆直接在你面前裝 CPU 那畫面也是夠嗆哈哈。~~

## 解決方式

我們需要`CreatePS5()`function 來將 PS5 的製作過程隱藏起來，如下：

```go
package factory

import "fmt"

type PS5 interface {
	PlayGame()
}

type PS5WithCD struct{}

func (p PS5WithCD) PlayGame() {
	fmt.Println("loading cd...play!")
}
func (p PS5WithCD) AddCDMachine() {
	fmt.Println("adding cd machine...done!")
}
func (p PS5WithCD) AddCPU() {
	fmt.Println("adding cpu...done!")
}
func (p PS5WithCD) AddGPU() {
	fmt.Println("adding gpu...done!")
}

type PS5WithDigital struct{}

func (p PS5WithDigital) PlayGame() {
	fmt.Println("loading digital file...play!")
}
func (p PS5WithDigital) AddCPU() {
	fmt.Println("adding cpu...done!")
}
func (p PS5WithDigital) AddGPU() {
	fmt.Println("adding gpu...done!")
}

func CreatePS5(style string) PS5 {
	switch style {
	case "PS5WithCD":
		ps5 := &PS5WithCD{}
		ps5.AddCDMachine()
		ps5.AddCPU()
		ps5.AddGPU()
		return ps5
	case "PS5WithDigital":
		ps5 := &PS5WithDigital{}
		ps5.AddCPU()
		ps5.AddGPU()
		return &PS5WithDigital{}
	}
	return nil
}

func main() {
	ps5 := CreatePS5("PS5WithCD")
	ps5.PlayGame()
}
```

這樣使用者就只需要`CreatePS5()`後即可直接`.PlayGame()`。`CreatePS5()`有個特別的地方，

> 即透過 interface 來定義與外部溝通的方式

由於`PS5WithCD{}`與`PS5WithDigital{}`始終是不同的東西，我們須將這兩個物件「相同」的行為定義出來，來跟使用者說「這個產品可以玩 PS5 的遊戲」，我們稱這個動作為「**抽象**」。

所以 PS5 interface 將`.PlayGame()`這個行為抽象出來，只要能玩 PS5 遊戲的產品，都稱為 PS5 系列相關的產品，即 PS5 的光碟版與數位版。

最後整體 UML 如下（CreatePS5 不是 struct，所以我在上方標註這是一個 function 的區塊）：

![](https://i.imgur.com/pF9K1Xk.png)

`PS5WithCD{}`、`PS5WithDigital{}`由`CreatePS5()`生產，他們依賴`PS5`interface，而 user(main function)透過 interface 來操作生產出來的 PS5。
