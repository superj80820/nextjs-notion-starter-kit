## 什麼是 Flyweight Pattern？

> 將可共用的物件共用以節省空間

## 問題情境

設計一個撲克牌遊戲，如果牌局在運行，每創建一個牌局就需要建立新的卡牌，這樣會很浪費記憶體，需要有方法解決此問題。

## 解決方式

(相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns))

設計一個可共用的物件`pockerCards{}`，裡頭有著所有撲克牌，在用`NewPockerGame()`開啟每場牌局時，程式會設定卡牌的來源都來自`pockerCards{}`

```go
package main

import "fmt"

var pockerCards = map[int]*Card{
	1: {
		Name:  "A",
		Color: "紅",
	},
	2: {
		Name:  "A",
		Color: "黑",
	},
	// 其他卡牌
}

type Card struct {
	Name  string
	Color string
}

type PockerGame struct {
	Cards map[int]*Card
}

func NewPockerGame() *PockerGame {
	board := &PockerGame{Cards: map[int]*Card{}}
	for id := range pockerCards {
		board.Cards[id] = pockerCards[id]
	}
	return board
}

func main() {
	game1 := NewPockerGame()
	game2 := NewPockerGame()
	fmt.Println(game1.Cards[1] == game2.Cards[1])
}
```

## 與 Singleton Pattern 的差異

兩者都有共用的概念，但有些許差異：

- Singleton Pattern 在整個系統只會有一個物件
- Flyweight Pattern 在整個系統可以有多個物件
