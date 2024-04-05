## 什麼是 Bridge Pattern？

> 將抽像與實現分離，讓彼此變化互不影響

![](https://i.imgur.com/w7WGbeT.png)

## 問題情境

PS5 有著 PS5WithCD 與 PS5WithDigital 兩個版本

![](https://i.imgur.com/heRatBv.png)

如果使用傳統的繼承，我們要在 PS5WithCD 與 PS5WithDigital 上新增不同的手把款式，又要再個別新增兩個類別，但已問題的本質來說，這是件很奇怪的事情，只是新增不同的手把卻要做出新的 PS5。

![](https://i.imgur.com/8rrI85E.png)

那如果要再新增不同的手把配不同的 Sony 螢幕，這樣又要新增更多的類別，這樣就使得「不同的實現影響到了 PS5 這個物件的抽象」，我們需設計一個方式避免這種情形。

## 解決方式

UML 圖如下:

![](https://i.imgur.com/hVifdGu.png)

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)

code 如下:

```go
package main

type Controller interface {
	MethodA()
	MethodB()
	MethodC()
	MethodD()
}

type ControllerA struct{}

func (c ControllerA) MethodA() {}
func (c ControllerA) MethodB() {}
func (c ControllerA) MethodC() {}
func (c ControllerA) MethodD() {}

type ControllerB struct{}

func (c ControllerB) MethodA() {}
func (c ControllerB) MethodB() {}
func (c ControllerB) MethodC() {}
func (c ControllerB) MethodD() {}

type PS5 interface {
	Start()
	SetController()
	Play()
}

type PS5Machine struct {
	ps5Controller Controller
}

func (p PS5Machine) Start() {
	p.ps5Controller.MethodA()
	p.ps5Controller.MethodB()
}

func (p *PS5Machine) SetController(controller Controller) {
	p.ps5Controller = controller
}

func (p PS5Machine) Play() {
	p.ps5Controller.MethodC()
	p.ps5Controller.MethodD()
}

func main() {
	ps5 := PS5Machine{}
	ps5.Start()
	ps5.SetController(ControllerA{})
	ps5.Play()
	ps5.SetController(ControllerB{})
	ps5.Play()
}
```

我們將搖桿定義了一個`Controller`interface，而`PS5Machine{}`實際的實作都是依賴於此 interface，藉由`PS5Machine.SetController()`來任意變換搖桿，只要符合 interface 的規範即可，不需要為了不同的搖桿而新增新的 struct。
