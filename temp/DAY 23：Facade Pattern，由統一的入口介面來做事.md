## 什麼是 Facade Pattern？

> 實作不依賴多個類別，而是依賴介面，並把這些類別實作在此介面

## 問題情境

(相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns))

當 PS5 啟動時，會用到許多 CPU 相關的指令集，以下方範例來說即是`StrcutA{}`、`StrcutB{}`，如果未來要更改`StrcutA{}`、`StrcutB{}`的`DoAction()`function 呼叫方式，或者`StrcutA{}`被棄用要改用`StructC{}`，都必須要修改`PS5{}.Start()`的實作。

```go
package main

import "fmt"

type StructA struct{}

func (s StructA) DoAction() {}

type StructB struct{}

func (s StructB) DoAction() {}

type PS5 struct {
}

func (p PS5) Start() {
	strcutA := StructA{}
	strcutB := StructB{}
	strcutA.DoAction()
	strcutB.DoAction()
	fmt.Println("start ps5...done!")
}

func main() {
	ps5 := PS5{}
	ps5.Start()
}
```

我們需要一個方式，能讓做這些更改時`PS5{}.Start()`不需要修改。

## 解決方式

`PS5{}.Start()`可以只依賴特定介面`CPUFacade` interface 的`Work()`，所以可以將`StrcutA{}`、`StructB{}`的使用方式都封裝在`Work()`中，就算後續`StrcutA{}`、`StructB{}`有變更呼叫方式或是棄用，都不影響`PS5{}.Start()`的呼叫。

```go
package main

import "fmt"

type CPUFacade interface {
	Work()
}

type StructA struct{}

func (s StructA) DoAction() {}

type StructB struct{}

func (s StructB) DoAction() {}

type CPU struct{}

func (c CPU) Work() {
	strcutA := StructA{}
	strcutB := StructB{}
	strcutA.DoAction()
	strcutB.DoAction()
}

type PS5 struct {
	cpu CPUFacade
}

func (p PS5) Start() {
	p.cpu.Work()
	fmt.Println("start ps5...done!")
}

func main() {
	ps5 := PS5{cpu: CPU{}}
	ps5.Start()
}
```
