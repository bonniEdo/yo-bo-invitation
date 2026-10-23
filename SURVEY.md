# 婚禮出席意願調查

原始碼在 feature/attendance-survey，正式喜帖仍保留於 main 根目錄。發布副本為 main 的 survey-preview/。

https://bonniedo.github.io/yo-bo-invitation/survey-preview/

## 設計

按鈕開啟頁內設計彈窗；沒有 Google 表單跳轉或嵌入。短文、原合照、婚宴資訊，以及基隆愛三路預計來回遊覽車接駁說明。

彈窗調查姓名、出席意願、最多 4 位出席人數、基隆搭車意願與不超過出席人數的搭車人數，備註選填。不出席隱藏人數與搭車。無喜餅或聯絡欄位。關閉重開保留內容；鍵盤、Esc、背景鎖定與焦點還原由原生 dialog 支援。

## Google 表單連線

欄位已依新人提供的預填連結核對：

- 姓名：entry.2128613680
- 出席意願（核取方塊，網站只選一項）：entry.357255704
- 人數（下拉，選項值需含空格，如「2 位」）：entry.853536165
- 備註：entry.1949204995

出席意願的三個選項文字依截圖及預填網址設定。基隆遊覽車選項及搭車人數一併寫入備註。已啟用三種出席意願的送出。「無法出席」在網站內仍記為 0 人；依新人最新指定，Google 人數選單對應值是「Pass」（大小寫相同），不使用 1 人或其他數字代替。Google 下拉選單必須實際有「Pass」，否則會拒收該回覆。

背景 Google POST 使用不透明回應，僅能顯示「回覆已送出，收件待確認」，不可宣稱已成功存檔。環境無法存取 docs.google.com，尚未確認真實儲存；前端測試攔截請求，不寫入 Google 回覆。公開後需由新人核對一筆實際送件的試算表。

## 發布

```sh
python scripts/publish-survey-preview.py --target /path/to/main-checkout
```

只提交 main 的 survey-preview/ 目錄，不替換根目錄正式喜帖。圖片字體沿用 main，內容變動會更新快取版本。
