## 什麼是 Iterator Pattern？

> 將不同資料物件透過一致的方式取得其中的元素

## 問題情境

`string`與`[]string`是兩種不同的資料型態，我們需要迭代裡頭全部的元素。

## 解決方式

設計一個`Iterator`interface 介面，裡頭`.HasNext()`用來確認是否還擁有下一個元素，`.Next()`用來取得元素與把元素 index 往後移。

將`string`與`[]string`以`IterableString{}`、`IterableSliceString{}`實作`Iterator`interface，`PrintAllItems()`依賴此 interface 將元素印出。

相關的 code 在[Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)

code 如下:

```go
package main

import "fmt"

type Iterator interface {
	HasNext() bool
	Next() interface{}
}

type IterableSliceString []string

func (i IterableSliceString) Iterator() Iterator {
	return &SliceStringIterator{
		original: i,
		index:    0,
	}
}

type SliceStringIterator struct {
	original IterableSliceString
	index    int
}

func (s *SliceStringIterator) HasNext() bool {
	return s.index < len(s.original)
}

func (s *SliceStringIterator) Next() interface{} {
	item := s.original[s.index]
	s.index++
	return item
}

type IterableString string

func (i IterableString) Iterator() Iterator {
	return &StringIterator{
		original: i,
		index:    0,
	}
}

type StringIterator struct {
	original IterableString
	index    int
}

func (s *StringIterator) HasNext() bool {
	return s.index < len(s.original)
}

func (s *StringIterator) Next() interface{} {
	item := string(s.original[s.index])
	s.index++
	return item
}

func PrintAllItems(iterator Iterator) {
	for iterator.HasNext() {
		fmt.Println(iterator.Next())
	}
}

func main() {
	PrintAllItems(IterableSliceString{"a", "b", "c"}.Iterator())
	PrintAllItems(IterableString("abcd").Iterator())
}
```

需注意的是，golang 已經有`range`關鍵字可以迭代`string`、`map`、`slice`等型態，但 Iterator Pattern 不限定這些型態，而是任意型態只要滿足`Iterator`interface 的實作即可，例如 golang `database/sql`的`.Next()`就是以 Iterator Pattern 對 rows 一個一個迭代。
