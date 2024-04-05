工廠模式主要有三種不同的實作：

- Simple Factory Pattern
- Factory Method Pattern
- Abstract Factory Pattern

這三種實作由簡單到複雜，今天會介紹 Factory Method Pattern 延伸的 Abstract Factory Pattern

![](https://i.imgur.com/f0JAz1I.jpg)

(文創系的看到我畫的 UML 後畫了一張他理解圖，恩...真滴棒XD)

## 什麼是 Abstract Factory Pattern？

> 將性質相同產品集合起來由一個工廠生產

![](https://i.imgur.com/wLdpWi9.png)

優點：

- 符合**開閉原則**，與 Factory Method Pattern 相同，在新增產品時不必修改 function 實作(對修改封閉)，但可以透過不同工廠來新增(對擴充開放)
- 可避免 Factory Method Pattern 一個產品就要一個工廠導致工廠過多的問題

缺點：

- 由於工廠為一群產品的集合，如果你要新增一個產品，必須在每個工廠都新增此產品，成本會很大。這稱為**開閉原則的傾斜性**，即「新增有一群產品的工廠很簡單（傾向此目的），但新增一個產品至集合很困難」

## 問題情境

我們修改昨天的情境，使用者想要有個「遊戲房」，使用者除了要遊戲主機，還要遊戲產品。

- 要生產遊戲主機與電視給使用者，使用者不需要知道「如何生產 CPU、顯示晶片、遊戲製作」，使用者只需要獲得此產品就行。
- 買 Sony 系列的主機，就會買 PS 相關的遊戲；買任天堂系列的主機，就會買 Switch 相關的遊戲。

## 解決方式

套用到上方的 UML 圖後如下：

![](https://i.imgur.com/yhtIaJt.png)

我們的工廠 interface 不像昨天只是**單純生產遊戲主機**，而是要**生產遊戲屋相關的產品**，所以改名為`GameRoomFactory{}`，裡頭`.GameMachineFactory()`可以生產主機，`.GameFactory()`可以生產遊戲。

而工廠生產的主機與遊戲，也分別抽象出兩個 interface`Game`與`GameMachine`。

使用者只管「把主機抱回家(`.GameMachineFactory()`)」與「取得遊戲來玩(`.GameFactory()`)」，實際會獲得什麼主機與遊戲完全看使用者選擇 Sony 還是任天堂。所以`User()`會只依賴於`GameRoomFactory{}`interface，並不直接呼叫`SonyFactory{}`或`NintendoFactory{}`。

選擇品牌來決定要什麼樣的產品集群，這樣的集群又被稱為「產品族」，在抽象工廠常用此名詞稱呼。

程式碼如下：

(相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns))

```go
package main

import "fmt"

// 定義抽象工廠
type GameRoomFactory interface {
	GameMachineFactory() GameMachine
	GameFactory() Game
}

// 定義抽象產品
type Game interface {
	Start()
}

type GameMachine interface {
	PlayGame()
}

// 實作產品
type PS5 struct{}

func (p PS5) PlayGame() {
	fmt.Println("loading cd...play!")
}
func (p PS5) addCDMachine() {
	fmt.Println("adding cd machine...done!")
}
func (p PS5) addCPU() {
	fmt.Println("adding cpu...done!")
}
func (p PS5) addGPU() {
	fmt.Println("adding gpu...done!")
}

type GameFinalFantasy struct{}

func (s *GameFinalFantasy) build() {
	fmt.Println("build game...done!")
}
func (s *GameFinalFantasy) Start() {
	fmt.Println("start game...done!")
}

type Switch struct{}

func (s Switch) PlayGame() {
	fmt.Println("loading cd...play!")
}
func (s Switch) addCDMachine() {
	fmt.Println("adding cd machine...done!")
}
func (s Switch) addCPU() {
	fmt.Println("adding cpu...done!")
}
func (s Switch) addGPU() {
	fmt.Println("adding gpu...done!")
}

type GameMario struct{}

func (s *GameMario) build() {
	fmt.Println("build game...done!")
}
func (s *GameMario) Start() {
	fmt.Println("start game...done!")
}

// 實作工廠
type SonyFactory struct{}

func (f *SonyFactory) GameMachineFactory() GameMachine {
	ps5 := &PS5{}
	ps5.addCDMachine()
	ps5.addCPU()
	ps5.addGPU()
	return &PS5{}
}

func (f *SonyFactory) GameFactory() Game {
	game := &GameFinalFantasy{}
	game.build()
	return game
}

type NintendoFactory struct{}

func (n *NintendoFactory) GameMachineFactory() GameMachine {
	switchMachine := &Switch{}
	switchMachine.addCDMachine()
	switchMachine.addCPU()
	switchMachine.addGPU()
	return &PS5{}
}

func (n *NintendoFactory) GameFactory() Game {
	game := &GameMario{}
	game.build()
	return game
}

func User(gameHomeFactory GameRoomFactory) {
	gameMachine := gameHomeFactory.GameMachineFactory()
	game := gameHomeFactory.GameFactory()
	game.Start()
	gameMachine.PlayGame()
}

func main() {
	User(&SonyFactory{})
}
```
