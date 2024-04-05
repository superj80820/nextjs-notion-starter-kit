## 什麼是 Chain of Responsibility？

> 將 if...else 的行為抽象成物件，將 if...else 行為以物件串接的方式來操作

## 問題情境

在 PS5 的設計中，假設會依照不同的遊戲調整晶片，例如 3D 遊戲會啟用 3D 模式、高效能顯示會加強顯示晶片、音樂有用環繞音效會啟用音效晶片的環繞音效模式，

會設計成以下的 code：

```go
package main

import "fmt"

type Game struct {
	Name      string
	Type      string
	GraphType string
	AudioType string
}

type PS5 struct{}

func (PS5) PlayGame(game Game) {
	if game.Type == "3D遊戲" {
		fmt.Println("3D模式")
	}
	if game.GraphType == "高效能顯示" {
		fmt.Println("加強顯示晶片")
	}
	if game.AudioType == "環繞音效" {
		fmt.Println("環繞音效模式")
	}
	fmt.Printf("play %s", game.Name)
}

func main() {
	ps5 := PS5{}
	ps5.PlayGame(
		Game{
			Name:      "最終幻想",
			Type:      "3D遊戲",
			GraphType: "高效能顯示",
			AudioType: "環繞音效",
		},
	)
}
```

如果要在新增不同的晶片調整，就必須修改`PS5{}.PlayGame()`的 code，這不符合**開閉原則**，我們需要一個方式解決。

## 解決方式

可以在`PS5{}`新增一個`middleware` slice 成員，並把調整晶片的邏輯都抽象成`GameMiddleware()`、`GraphMiddleware()`、`AudioMiddleware()`middlewares，透過`PS5{}.AddMiddleware()`來新增這些 middleware，在最後`PS5{}.PlayGame()`的時候再一次運行所有 middleware 並且運行遊戲

```go
package main

import "fmt"

type Game struct {
	Name      string
	Type      string
	GraphType string
	AudioType string
}

type PS5 struct {
	middlewares []func(game Game)
}

func (p *PS5) AddMiddleware(middleware func(game Game)) *PS5 {
	p.middlewares = append(p.middlewares, middleware)
	return p
}

func (p PS5) PlayGame(game Game) {
	for _, middleware := range p.middlewares {
		middleware(game)
	}
	fmt.Printf("play %s", game.Name)
}

func GameMiddleware(game Game) {
	if game.Type == "3D遊戲" {
		fmt.Println("3D模式")
	}
}

func GraphMiddleware(game Game) {
	if game.GraphType == "高效能顯示" {
		fmt.Println("加強顯示晶片")
	}
}

func AudioMiddleware(game Game) {
	if game.AudioType == "環繞音效" {
		fmt.Println("環繞音效模式")
	}
}

func main() {
	ps5 := PS5{}
	ps5.
		AddMiddleware(GameMiddleware).
		AddMiddleware(GraphMiddleware).
		AddMiddleware(AudioMiddleware)
	ps5.PlayGame(
		Game{
			Name:      "最終幻想",
			Type:      "3D遊戲",
			GraphType: "高效能顯示",
			AudioType: "環繞音效",
		},
	)
}
```
