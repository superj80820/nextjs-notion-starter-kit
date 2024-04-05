## 什麼是 Proxy Pattern？

> 讓代理物件操作實際物件，讓代理物件處理與業務邏輯無關的事情

UML 圖如下:

![](https://i.imgur.com/2VKPdO9.png)

在操作物件時，有時候我們有加上 log、權限管控等等功能，這跟實際操作物件的業務無關，這時就可以用 Proxy Pattern 來去處理代理這些功能，並且保持介面相同。

Proxy Pattern 與 Decorator Pattern 相似，兩者主要差異是：

- Proxy Pattern: 是增加新的功能在原物件上
- Decorator Pattern: 是增強原物件的功能

## 問題情境

PS5 在玩開啟遊戲時，需要新增 log，但如果在原本業務邏輯上加上 log 會模糊掉業務的意圖，我們需要有方法解決此問題。

## 解決方式

UML 圖如下:

![](https://i.imgur.com/6sOJHEj.png)

新增一個`PS5`interface，`PS5Machine{}`與`PS5MachineProxy{}`都依照此 interface 實作，這樣使用者在使用時只要依賴`PS5`interface，就都可以使用`PS5Machine{}`與`PS5MachineProxy{}`。

在`PS5MachineProxy{}.PlayGame()`裡呼叫`PS5Machine{}.PlayGame()`，並在整個實作添加 log。

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)

code 如下:

```go
package main

import (
	"fmt"
	"time"
)

type PS5 interface {
	PlayGame()
}

type PS5Machine struct{}

func NewPS5Machine() *PS5Machine {
	return &PS5Machine{}
}

func (u *PS5Machine) PlayGame() {
	fmt.Println("play game")
}

type PS5MachineProxy struct {
	ps5 *PS5Machine
}

func NewPS5MachineProxy(ps5 *PS5Machine) *PS5MachineProxy {
	return &PS5MachineProxy{
		ps5: ps5,
	}
}

func (p *PS5MachineProxy) PlayGame() {
	start := time.Now()
	p.ps5.PlayGame()
	fmt.Printf("play game cost time: %s", time.Since(start))
}

func main() {
	ps5 := NewPS5MachineProxy(NewPS5Machine())
	ps5.PlayGame()
}
```
