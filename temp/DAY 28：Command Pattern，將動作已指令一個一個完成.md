## 什麼是 Command Pattern？

> 將建立指令與實際執行分離

## 問題情境

PS5 有特定操作 CPU 指令的實作`.ACommand()`、`.BCommand()`，如果現在又多了新的特定操作，必須修改`PS5{}`，這不符合**開閉原則**，我們需要有方法滿足開閉原則。

```go
package main

import "fmt"

type CPU struct{}

func (CPU) ADoSomething() {
	fmt.Println("a do something")
}
func (CPU) BDoSomething() {
	fmt.Println("b do something")
}
func (CPU) CDoSomething() {
	fmt.Println("c do something")
}

type PS5 struct {
	cpu CPU
}

func (p PS5) ACommand() {
	p.cpu.ADoSomething()
	p.cpu.CDoSomething()
}
func (p PS5) BCommand() {
	p.cpu.ADoSomething()
	p.cpu.BDoSomething()
}
func main() {
	cpu := CPU{}
	ps5 := PS5{cpu}
	ps5.ACommand()
	ps5.BCommand()
}
```

## 解決方式

新增`Command`interface，裡頭有`Execute()`這個 function，並實作`ACommand{}`、`BCommand{}`，**讓指令的建立從`PS5{}`中分離出來**，即滿足開閉原則。

最後透過`PS5{}.SetCommand()`來將符合`Command`interface 的指令設定給 PS5，再透過`PS5{}.DoCommand()`選擇要執行的指令。

```go
package main

import "fmt"

type CPU struct{}

func (CPU) ADoSomething() {
	fmt.Println("a do something")
}
func (CPU) BDoSomething() {
	fmt.Println("b do something")
}
func (CPU) CDoSomething() {
	fmt.Println("c do something")
}

type Command interface {
	Execute()
}

type ACommand struct {
	cpu CPU
}

func (a ACommand) Execute() {
	a.cpu.ADoSomething()
	a.cpu.CDoSomething()
}

type BCommand struct {
	cpu CPU
}

func (b BCommand) Execute() {
	b.cpu.ADoSomething()
	b.cpu.BDoSomething()
}

type PS5 struct {
	commands map[string]Command
}

func (p *PS5) SetCommand(name string, command Command) {
	p.commands[name] = command
}

func (p *PS5) DoCommand(name string) {
	p.commands[name].Execute()
}

func main() {
	cpu := CPU{}
	aCommand := ACommand{cpu}
	bCommand := BCommand{cpu}
	ps5 := PS5{make(map[string]Command)}
	ps5.SetCommand("a", aCommand)
	ps5.SetCommand("b", bCommand)
	ps5.DoCommand("a")
	ps5.DoCommand("b")
}
```
