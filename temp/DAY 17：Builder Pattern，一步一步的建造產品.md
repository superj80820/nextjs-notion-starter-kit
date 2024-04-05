## 什麼是 Builder Pattern？

> 將建造物件的實作拆開，由使用者覺得要選擇建造什麼，來一步一步建造

舉例來說，當創建 PS5 時，

```go
CreatePS5(hasCPU, hasGPU bool)
```

如果有許多額外的選項，

```go
CreatePS5(CPUCores uint8, has大搖, has藍牙耳機 bool)
```

就會發現額外的選項需透過零值(zero value)來解決，

```go
CreatePS5(4, false, true)
```

這使得建構 PS5 的 function 難以快速理解其中的意義。

所以需要額外將這些步驟拆除，再由使用者決定是否要執行，並且將這些步驟拆分，也使得建構 function 不至於過長，

```go
CreatePS5(4).
Set大搖(true).
// Set藍牙耳機(true) 不執行就不會有藍牙耳機
```

優點：

- 將必要的建構參數放在 create function，額外的參數放在 set function，能在程式彈性時也擁有可讀性
- 不使建構 function 過於複雜

設計上通常有**Product**、**Director**、**Builder Interface**、**ConcreteBuilder**，

- Product: 實際產品
- Director: 操作 Builder 來生產產品的物件
- Builder Interface: 生產產品的物件的 interface，由於有此 interface，可以讓 Director 使用不同 ConcreteBuilder 來生產物件
- ConcreteBuilder: 實際生產產品的物件

## 問題情境

使用者購買 PS5，並且其中有多個周邊可以購買，使用者自行決定要加購什麼周邊

## 解決方式

UML 圖後如下：
![](https://i.imgur.com/Hw7rYvQ.png)

程式碼如下：

(相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns))

```go
package main

import (
	"fmt"
	"strings"
)

type PS5Builder interface {
	SetController(isBuy bool) PS5Builder
	SetBluetoothHeadphones(isBuy bool) PS5Builder
	Build() *PS5
}

type PS5 struct {
	cpu                 string
	gpu                 string
	controller          string
	bluetoothHeadphones string
}

func CreatePS5() *PS5 {
	return &PS5{
		cpu: "cpu",
		gpu: "gpu",
	}
}

func (p PS5) PlayGame() {
	var (
		accessories     []string
		withAccessories string
	)
	if p.controller != "" {
		accessories = append(accessories, p.controller)
	}
	if p.bluetoothHeadphones != "" {
		accessories = append(accessories, p.bluetoothHeadphones)
	}
	if len(accessories) != 0 {
		withAccessories = " with " + strings.Join(accessories, ", ")
	}
	fmt.Printf("loading...play%s!\n", withAccessories)
}

type PS5Director struct {
	Builder PS5Builder
}

func CreatePS5Director(concretePS5Builder *ConcretePS5Builder) *PS5Director {
	return &PS5Director{
		Builder: concretePS5Builder,
	}
}

func (p PS5Director) Construct() *PS5 {
	return p.Builder.
		SetController(true).
		Build()
}

type ConcretePS5Builder struct {
	ps5 *PS5
}

func CreateConcretePS5Builder() *ConcretePS5Builder {
	return &ConcretePS5Builder{
		ps5: CreatePS5(),
	}
}

func (p *ConcretePS5Builder) SetController(isBuy bool) PS5Builder {
	if isBuy {
		p.ps5.controller = "FightingStick"
	}
	return p
}

func (p *ConcretePS5Builder) SetBluetoothHeadphones(isBuy bool) PS5Builder {
	if isBuy {
		p.ps5.bluetoothHeadphones = "BluetoothHeadphones"
	}
	return p
}

func (p *ConcretePS5Builder) Build() *PS5 {
	return p.ps5
}

func main() {
	concretePS5Builder := CreateConcretePS5Builder()
	ps5Director := CreatePS5Director(concretePS5Builder)
	ps5 := ps5Director.Construct()

	ps5.PlayGame()
}
```

`CreateConcretePS5Builder()`建立實際的 builder 後，丟入`PS5Director{}`，而`PS5Director{}`會在透過`Construct()`來操作 builder 去 set ps5。

可以發現必填的欄位在`CreateConcretePS5Builder()`就已經填好，如果是有建構子(construct)的語言，例如 java 就會在建構子內做好，由於 golang 沒有，所以會用 create function 來達到此效果。而額外的欄位即在`.SetXXX()`function 設置。

另外在`.SetXXX()`function 後又會 return 自己的方式稱為 Fluent interface，此方法可以做出鏈式的寫法，即`.SetXXX().SetXXX()`，可以讓 set function 的使用更靈活。
