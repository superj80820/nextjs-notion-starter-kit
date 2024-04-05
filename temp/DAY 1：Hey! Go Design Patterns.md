![](https://i.imgur.com/P87VC4O.png)

大家好，本系列文章探討經典 Design Patterns 在現代語言 Golang 的演變。雖然小弟是一位還在學習的小小碼農，但希望文章能夠以相對淺顯不高深的角度，讓各位對 Design Patterns 更有感觸，也歡迎交流討論，謝謝～

## 什麼是 Design Patterns？

Design Patterns 是一種「經驗集成」。Erich Gamma、Richard Helm、Ralph Johnson、John Vlissides 大師們將過往許多問題解決的實作方案整理，進而出了[Design Patterns: Elements of Reusable Object-Oriented Software](https://zh.wikipedia.org/wiki/%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F%EF%BC%9A%E5%8F%AF%E5%A4%8D%E7%94%A8%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1%E8%BD%AF%E4%BB%B6%E7%9A%84%E5%9F%BA%E7%A1%80)一書，裡頭統整了 23 種 Patterns。

除了此 23 種經典 Patterns，在 Web 的世界由於對高併發(concurrency)需求相當高，也衍伸出了 Concurrency Patterns ，我選定[圖解 Java 多線程設計模式](https://www.tenlong.com.tw/products/9787115462749)來探討，裡頭有約 10 種 patterns，來確保大量的併發不產生 race condition、deadlock 等問題。

## 探討資料

- [書 - Go 語言並發之道](https://www.tenlong.com.tw/products/9787519824945)
- [書 - 圖解 Java 多線程設計模式](https://www.tenlong.com.tw/products/9787115462749)
- [良葛格大大 - 非關語言: 設計模式](https://openhome.cc/Gossip/DesignPattern/)
- [mohuishou 大大 - Go 设计模式](https://lailin.xyz/post/go-design-pattern.html)
- [Ressmix 大大 - 透彻理解 Java 并发编程](https://segmentfault.com/blog/ressmix_multithread)
- [lotusirous 大大 - go-concurrency-patterns](https://github.com/lotusirous/go-concurrency-patterns)

小弟會將這些資料內化了解，統整成 Golang 系列的文章。大家可能會有些好奇，為什麼 Golang 參考了那麼多 Java 的文章，主要是文章開頭說的，Design Patterns 是解決問題的經驗集成，這些經典的問題在 Java 時代即存在，那面對這些問題現代語言 Golang 是怎麼設計的呢？是否使一些問題更易於解決？如[良葛格大大 - 設計模式不死？](https://www.ithome.com.tw/voice/89076)一文中所說「我們真正該做的，是在傳達經典設計模式之後，多探討一些結合現代風格的實作」。

由於 Patterns 的寫法寫起來是都相似的，所以文章中有些 Code 的寫法幾乎與探討資料相同，會在相似的 Code 中標注來源，感謝。

（本系列對[良葛格大大](https://openhome.cc/Gossip/index.html)的文章有著大量的參考，受益良多，也很推薦大家看看大大的部落格！）

## 文章目錄

在此列出這次鐵人每天撰寫的目錄，也給自己一個目標讓自己不迷航 XD。由於對於高併發興趣挺大所以會先以 Concurrency Patterns 開始，再介紹經典 Design Patterns。

並且會把相關的 Code 放在此 [Github - go-design-patterns](https://github.com/superj80820/go-design-patterns)。

- Concurrency 併發模式: 如何讓程式高併發，並足夠安全，不產生 race condition、dead lock 等問題

    - [DAY 2：Single Threaded Execution Pattern，門就只有一個大家好好排隊啊～](https://ithelp.ithome.com.tw/articles/10264769)
    - [DAY 3：Read-Write-Lock Pattern，三人成虎，一人打虎！](https://ithelp.ithome.com.tw/articles/10265460)
    - [DAY 4：Guarded Suspension Pattern，你不會死的，因為我會保護你](https://ithelp.ithome.com.tw/articles/10266278)
    - [DAY 5：Thread-Per-Message Pattern，預備...發射！](https://ithelp.ithome.com.tw/articles/10267174)
    - [DAY 6：Feature Pattern，我把未來託付給你了！](https://ithelp.ithome.com.tw/articles/10267843)
    - [DAY 7：Fan-Out Fan-In Pattern，看吧世界！這就是多人解決的力量！](https://ithelp.ithome.com.tw/articles/10268715)
    - [DAY 8：Producer Consumer Pattern，點菜了，三份穿褲子的豬，一盤熱空氣，把牛變成鱒魚](https://ithelp.ithome.com.tw/articles/10269446)
    - [DAY 9：Worker Pool Pattern，就。很。Pool。](https://ithelp.ithome.com.tw/articles/10270015)
    - [DAY 10：Two-phase Termination Pattern，我就跟你說不要亂拔電源！](https://ithelp.ithome.com.tw/articles/10270786)
    - [DAY 11：Thread-Specific Storage Pattern，高併發的多重宇宙空間](https://ithelp.ithome.com.tw/articles/10271558)
    - [DAY 12：Concurrency Patterns 融會貫通＋ Graceful Shutdown，正確關閉各個宇宙的次元門](https://ithelp.ithome.com.tw/articles/10272236)

- Creational 建立模式: 如何有效的生產與管理物件

    - Abstract Factory
    - Builder
    - Factory Method
    - Prototype
    - Singleton

- Structural 結構模式: 如何設計出低耦合的物件關係

    - Adapter
    - Bridge
    - Composite
    - Decorator
    - Facade
    - Flyweight
    - Proxy

- Behavioral 行為模式: 如何讓物件互動的更彈性、有效率，職責更清晰

    - Chain of Responsibility
    - Command
    - Interpreter
    - Iterator
    - Mediator
    - Memento
    - Observer
    - State
    - Strategy
    - Template Methodbehavior.
    - Visitor
