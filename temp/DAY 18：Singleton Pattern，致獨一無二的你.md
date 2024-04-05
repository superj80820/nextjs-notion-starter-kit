## 什麼是 Singleton Pattern？

![](https://i.imgur.com/BBvzTg9.jpg)

> 整個程式運作只會有此一個物件，不會創建第二個重複的物件

在實際情境中某些物件，比如連線 DB、與其他 service 長連線、取得環境 config，我們都希望可以整個運行環境「只有一個」，才不會造成資源的浪費，或者系統每個部分運行得到的值不同。

## 問題情境

取得連線 DB 的物件，並且整個系統不會重複創建導致浪費 DB 連線的資源。

## 解決方式

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)

第一種方式(初始化即創建)：在 import 模組的時候，將 db 透過`init()`創建`dbInstance{}`(`init()`function 有著程式 runtime 會先行運行的特性)，此後只有`GetInstance()`這個公開方法可以取得`dbInstance{}`，並無任何方法再創建`dbInstance{}`

優點：可以在初始化就創建 instance，不用等到呼叫才創建(第二種方式)
缺點：無法控制初始化的時間點，舉例來說有可能「環境變數」套件都還沒有初始化，db 就開始初始化了，導致讀不到正確的環境變數

```go
// db/db.go
package db

type DBInstance struct{}

var dbInstance *DBInstance

func init() {
	dbInstance = &DBInstance{}
}

func GetInstance() *DBInstance {
	return dbInstance
}
```

```go
// main file
package main

import "DAY-18/db"

func main() {
	db.GetInstance()
}
```

為了解決缺點，所以許多專案會不以`init()`來初始化物件，而是任意一個公開方法來初始化：

```go
// db-2/db-2.go file
package db

type DBInstance struct{}

var dbInstance *DBInstance

func InitDB() {
	dbInstance = &DBInstance{}
}

func GetInstance() *DBInstance {
	return dbInstance
}
```

```go
// main file
package main

import db "DAY-18/db-2"

func main() {
	db.Init()
	db.GetInstance()
}
```

第二種方式(lazy 方式)：在呼叫`GetInstance()`的時候會做檢查，如果`dbInstance{}`不存在就創建，存在就回傳現存的`dbInstance{}`

優點：可以在真的用到此物件時，才創建此物件，以節省記憶體，這即是 lazy 方式的優點
缺點：由於在使用物件時才會創建，所以第一次呼叫時需要創建會花較多的時間

```go
package main

type DBInstance struct{}

var dbInstance *DBInstance

func GetInstance() *DBInstance {
	if dbInstance == nil {
		dbInstance = &DBInstance{}
	}
	return dbInstance
}

func main() {
	GetInstance()
}
```

如果覺得`if dbInstance == nil`的檢查很麻煩的話，也可以用`sync.Once{}`來實作，`sync.Once{}.Do(func)`可以讓 function 裡的物件永遠只執行一次，以達到 Singleton 的效果，裡頭適用 CAS 演算法來實作：

```go
package main

import "sync"

type DBInstance struct{}

var (
	dbInstance *DBInstance
	once       = &sync.Once{}
)

func GetInstance() *DBInstance {
	once.Do(func() {
		dbInstance = &DBInstance{}
	})
	return dbInstance
}

func main() {
	GetInstance()
}
```
