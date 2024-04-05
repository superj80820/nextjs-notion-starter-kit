## 什麼是 Composite Pattern？

> 將單一與多個物件的使用方式統一給使用者使用

UML 圖如下:

![](https://i.imgur.com/yc1ENxj.png)

## 問題情境

假設 PS5 設計的測試階段，會以**單核心**或**多核心**的 cpu 來測試，單核心 cpu 測試使用的指令需與多核心 cpu 使用的指令相同，這樣 PS5 單核與多核才都可以拿來測試

## 解決方式

UML 圖如下:

![](https://i.imgur.com/lt1FiyX.png)

我們先定義了`CPU`interface，單核心 cpu`SingleCPU{}`與多核心 cpu`MultiCPUs{}`都以此 interface 來實作，`PS5Start()`相依`CPU`interface，`SingleCPU{}`與`MultiCPUs{}`都可以帶入來運行`.Run()`

`MultiCPUs{}`有`.AddSubCPU()`可以新增多個 cpu 至此 struct，而`MultiCPUs{}.Run()`會將多個 cpu 依依運行。

(相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns))

code 如下:

```go
package main

import "fmt"

type CPU interface {
	Run()
}

type SingleCPU struct{}

func (SingleCPU) Run() {
	fmt.Println("run cpu")
}

type MultiCPUs struct {
	SubCPUs []CPU
}

func (d MultiCPUs) Run() {
	for _, cpu := range d.SubCPUs {
		cpu.Run()
	}
}

func (m *MultiCPUs) AddSubCPU(cpu CPU) {
	m.SubCPUs = append(m.SubCPUs, cpu)
}

func PS5Start(cpu CPU) {
	cpu.Run()
}

func main() {
	singleCPU1 := SingleCPU{}
	PS5Start(singleCPU1)

	singleCPU2 := SingleCPU{}
	PS5Start(singleCPU2)

	multiCPUs := MultiCPUs{}
	multiCPUs.AddSubCPU(&singleCPU1)
	multiCPUs.AddSubCPU(&singleCPU2)
	PS5Start(multiCPUs)
}
```
