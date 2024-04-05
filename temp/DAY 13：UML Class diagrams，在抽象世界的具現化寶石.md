在 DAY 1 ~ DAY 12 已經介紹了我認知常見的 concurrency patterns，接下來就要介紹經典的 GoF design pattern，但在這之前我認為可以先介紹一些 design pattern 的基本概念供大家有相同的認知，以便更清楚的講解，所以接下來幾篇會說明這些概念。

本篇要介紹的是 UML Class diagrams！

## 什麼是 UML Class diagrams？

> 透過圖形來說明物件建立、耦合、互動的關係

GoF design pattern 主要在講解物件與物件的關係，如果直接把 code 貼出來，「一行一行」的程式碼很難讓剛接觸此系統的人有「整體」的想像，俗話說「一張圖，勝過千言萬語」，Class diagrams 就是希望就由圖來讓人更快速的對此系統有初步的理解，所以應用在講解 GoF design pattern 也是合適的。

但 Class diagrams 的定義沒有一個統一標準，有許多規則的演變，但並不是每種都很常使用，我選擇以下幾種我認為最重要的規則，並且用[mermaid-js](https://mermaid-js.github.io/)繪畫（使用教學可以看我這篇[讓你心裡的邏輯具現化的念能力工具](https://ithelp.ithome.com.tw/articles/10234553)），實用與讓人看得懂最為重要，如果規則太複雜讓人無法理解就適得其反了。

先說明幾個小細節：

- +號代表是公開屬性或方法
- -號代表是私有屬性或方法
- 線條上如果有數字，代表此物件在這整個關係上的數量

（相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)）

1.  Generalization/Inheritance 繼承
    ![](https://i.imgur.com/Aj5dXdS.png)

    > A 會先定義好相關的屬性與方法並且**實作**，而 B 繼承 A 後，B 會擁有 A 相關的屬性與方法，並且 B 也可有有自己的屬性與方法

    舉例來說：PS5 是繼承自 PS4 而誕生的，PS5 能擁有玩 PS4 遊戲的功能，但也可以玩 PS5 的遊戲

    code 如下，需特別注意的是其實 golang 沒有繼承，只有組合（下方會介紹），但組合只組一項事物，也可以達到繼承的效果：

    ```go
    package main

    import "fmt"

    type PS4 struct {
    	PS4Game string
    }

    func (p PS4) PlayPS4Game() {
    	fmt.Printf("play %s", p.PS4Game)
    }

    type PS5 struct {
    	PS4
    	PS5Game string
    }

    func (p PS5) PlayPS5Game() {
    	fmt.Printf("play %s", p.PS5Game)
    }

    func main() {
    	ps5 := PS5{
    		PS4: PS4{PS4Game: "KOF14"},
    	}
    	ps5.PlayPS4Game()
    }
    ```

2.  Realization/Implementation 實作
    ![](https://i.imgur.com/RCdnGvZ.png)

    > A 會先定義好相關的方法但**不實作**，而 B 必須以 A 的定義來實作相關方法

    舉例來說：表演比賽說明來參賽的人只要會唱歌即可，所以不同的人種都可以參加

    code 如下：

    ```go
    package main

    import "fmt"

    type Contestant interface {
    	Sing()
    }

    type Mike struct{}

    func (m Mike) Sing() { fmt.Println("mike singing") }

    type Kevin struct{}

    func (m Kevin) Sing() { fmt.Println("kevin singing") }

    type York struct{}

    func (m York) Sing() { fmt.Println("york singing") }

    func Show(contestant Contestant) {
    	contestant.Sing()
    }

    func main() {
    	Show(Mike{})
    	Show(Kevin{})
    	Show(York{})
    }

    ```

3.  Composition 組合
    ![](https://i.imgur.com/IFVLKNs.png)

    > A 擁有多個部件，並且這些部件與 A 的生命週期是**相同**的，他們彼此**強制聯繫**

    舉例來說：PS5 擁有搖桿、CPU、顯示晶片這些部件，這些部件是為了 PS5 而生

    code 如下：

    ```go
    package main

    import "fmt"

    type PS5 struct {
    	CPU
    	Controller
    	GPU
    }

    type CPU struct{}
    type Controller struct{}
    type GPU struct{}

    func main() {
    	ps5 := PS5{
    		CPU{},
    		Controller{},
    		GPU{},
    	}
    	fmt.Println(ps5)
    }
    ```

4.  Aggregation 聚合
    ![](https://i.imgur.com/2bYoa8v.png)

    > A 擁有多個部件，並且這些部件與 A 的生命週期是**不相同**的，他們彼此**不強制聯繫**

    跟組合類似，但關鍵差異是：

    - 組合：是在定義 struct 的時候就要求把部件聯繫在一起
    - 聚合：是透過 function 去設置部件，所以不去設置也是可以的，因此彼此聯繫不強制

    舉例來說：switch 可以買鼓組也可以買專用手把來玩太鼓達人，但不買也是可以玩的

    code 如下：

    ```go
    package main

    import "fmt"

    type NintendoSwitch struct {
    	Controller string
    }

    func (n *NintendoSwitch) SetController(controller string) {
    	n.Controller = controller
    }

    func (n NintendoSwitch) PlayGame() {
    	if n.Controller != "" {
    		fmt.Printf("use %s to play game", n.Controller)
    	} else {
    		fmt.Println("use default controller to play game")
    	}
    }

    func main() {
    	nintendoSwitch := NintendoSwitch{}
    	nintendoSwitch.SetController("drum")
    	nintendoSwitch.PlayGame()
    }
    ```

5.  Association 關聯
    ![](https://i.imgur.com/CFAVzND.png)

    > A 的屬性中擁有 B，並在 A 創建的時候帶入 B

    跟聚合相似，但關鍵差異是：

    - 聚合是使用`.SetXXX()`這類的 function 將屬性設置
    - 關聯是在創建物件的時候就將屬性設置

    但 golang 並不能再創建物件時就將屬性設置，因為 golang 沒有 construct，所以我們可透過一個`CreateXXX()`來模擬

    舉例來說：我擁有 mac，我可以利用 mac 來去處理鐵人賽文章

    code 如下：

    ```go
    package main

    import "fmt"

    type Me struct {
    	Mac
    }

    type Mac struct{}

    func (m Mac) WriteArticle() {
    	fmt.Println("write article")
    }

    func CreateMe(mac Mac) *Me {
    	return &Me{mac}
    }

    func (m Me) WriteIronmanArticle() {
    	m.Mac.WriteArticle()
    }

    func main() {
    	me := CreateMe(Mac{})
    	me.WriteIronmanArticle()
    }
    ```

6.  Dependency 相依
    ![](https://i.imgur.com/DRdQc4v.png)

    > A 不擁有屬性 B，但 A 的某方法有透過**參數** B 來實現

    舉例來說：我雖然不擁有公司白板，但我可以透過它來跟其他人溝通

    code 如下：

    ```go
    package main

    import "fmt"

    type Me struct{}

    type Whiteboard struct{}

    func (w Whiteboard) DrawOnWhiteboard() {
    	fmt.Println("write")
    }

    func (m Me) Discuss(whiteboard Whiteboard) {
    	whiteboard.DrawOnWhiteboard()
    }

    func main() {
    	me := Me{}
    	me.Discuss(Whiteboard{})
    }
    ```
