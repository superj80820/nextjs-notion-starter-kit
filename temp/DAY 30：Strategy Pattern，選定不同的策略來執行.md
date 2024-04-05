## 什麼是 Strategy Pattern？

> 設計相同介面但不同實作的物件，再由使用端以此介面去選擇要使用何種物件

UML 圖如下:

![](https://i.imgur.com/wdpjmgf.png)

## 問題情境

假設 PS5 會使用不同廠商的顯示晶片，需要有一個方法讓遊戲以不同的顯示晶片運行。

## 解決方式

`PS5{}.gpu`依賴`GPU`interface，A 廠商的`AGPU{}`與 B 廠商的`BGPU{}`都是以此`GPU`interface 實作，我們在`CreatePS5()`的時候選定要使用哪個廠商的 GPU，由使用端去選擇要使用何種**策略**來創造 PS5，選擇完策略後，就可以使用此策略物件來玩遊戲`PS5{}.PlayGame()`。

UML 圖如下:

![](https://i.imgur.com/GORPVOw.png)

code 如下:

(相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns))

```go
package main

import "fmt"

type GPU interface {
	Draw()
}

type AGPU struct{}

func (a AGPU) Draw() {
	fmt.Println("draw!")
}

type BGPU struct{}

func (b BGPU) Draw() {
	fmt.Println("draw!")
}

type CGPU struct{}

func (b CGPU) Draw() {
	fmt.Println("draw!")
}

type PS5 struct {
	gpu GPU
}

func CreatePS5(gpu GPU) PS5 {
	ps5 := PS5{
		gpu: gpu,
	}
	return ps5
}

func (p PS5) PlayGame() {
	p.gpu.Draw()
	fmt.Println("play game!")
}

func main() {
	gpu := AGPU{} // BGPU{} or CGPU{}
	ps5 := CreatePS5(&gpu)
	ps5.PlayGame()
}
```
