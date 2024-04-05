工廠模式主要有三種不同的實作：

- Simple Factory Pattern
- Factory Method Pattern
- Abstract Factory Pattern

這三種實作由簡單到複雜，今天會介紹 Simple Factory Pattern 延伸的 Factory Method Pattern

## 什麼是 Factory Method Pattern？

> 將複雜的生產邏輯再拆分至特定工廠，由使用者端決定要使用什麼工廠來生產產品

以昨天的例子簡單得來說，就是「將 if else/swtich 的邏輯拆分至不同工廠」，即：

```go
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
```

拆分至`PS5WithCDFactory{}`、`PS5WithDigital{}`，「單一產品由單一工廠生產」，這樣做有什麼優缺點呢？

優點:

- 符合**開閉原則**，在新增產品時不必修改 function 實作(對修改封閉)，但可以透過不同工廠來新增(對擴充開放)
- 修改都是擴充的，不是改 function 實作，所以把原本的邏輯改壞的可能性不高
- 如果創建邏輯過於複雜，Simple Factory Pattern 的邏輯會相當複雜，而 Factory Method Pattern 將邏輯拆成小工廠可以避免這個問題

缺點:

- 為每新增一個產品都需要新增一個工廠，如果產品眾多，程式碼會有數不盡的工廠，讓系統變得很複雜

## 問題情境

延續昨天的情境，要生產 PS5 主機**光碟版**與**數位版**給使用者，但使用者不需要知道「如何生產 CPU、顯示晶片與加裝光碟機」，使用者只需要獲得此產品就行。

## 解決方式

程式碼如下：

(相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns))

```go
package main

import "fmt"

type GameMachineFactory interface {
	Create() GameMachine
}

type PS5WithCDFactory struct{}

func (f *PS5WithCDFactory) Create() GameMachine {
	ps5 := &PS5WithCD{}
	ps5.AddCDMachine()
	ps5.AddCPU()
	ps5.AddGPU()
	return &PS5WithCD{}
}

type PS5WithDigitalFactory struct{}

func (f *PS5WithDigitalFactory) Create() GameMachine {
	ps5 := &PS5WithDigital{}
	ps5.AddCPU()
	ps5.AddGPU()
	return &PS5WithDigital{}
}

type GameMachine interface {
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

func User(gameMachineFactory GameMachineFactory) {
	gameMachine := gameMachineFactory.Create()
	gameMachine.PlayGame()
}

func main() {
	User(&PS5WithCDFactory{})
}
```

UML 圖如下：

![](https://i.imgur.com/ao9stPW.png)

可以與昨天 UML 圖比較，關鍵差異在於「把工廠也建立了 inferface」，使用者就可以使用`GameMachineFactory` interface 來去選擇哪間工廠，而選好了工廠後，工廠依照 interface 把`Create()`提供給使用者操作，創建出遊戲機，之後就與 Simple Factory Pattern 是一樣使用者依照`GameMachine`interface 來遊玩遊戲。
