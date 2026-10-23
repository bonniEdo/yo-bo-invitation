# 婚禮出席意願調查

原始碼在 feature/attendance-survey，正式喜帖仍保留於 main 根目錄。發布副本為 main 的 survey-preview/。

https://bonniedo.github.io/yo-bo-invitation/survey-preview/

## 設計

按鈕開啟頁內設計彈窗；沒有 Google 表單跳轉或嵌入。短文、原合照、婚宴資訊，以及基隆愛三路預計來回遊覽車接駁說明。

彈窗調查姓名、出席意願、最多 4 位出席人數、基隆搭車意願與不超過出席人數的搭車人數，備註選填。不出席隱藏人數與搭車。無喜餅或聯絡欄位。關閉重開保留內容；鍵盤、Esc、背景鎖定與焦點還原由原生 dialog 支援。

## 收件尚待核對欄位

已保留新人提供的新 Google 表單 URL。環境無法讀取其題目，所以 survey-config.js 的 googleFields/choiceValues 尚未設定；設定前不會送出空白、錯誤或寫入舊表單。

請表單擁有者提供「預先填入表單」產生的連結，每題先選一個測試值，以核對 entry.ID 及完整選項文字。填入 googleFields（guestName、attendance、guestCount、message；bus、busCount 可選）及 choiceValues（attendance/bus 的 yes、maybe、no 對應 Google 的精確選項）後，客人可留在彈窗中背景送出。若沒有獨立搭車題目，接駁意願會併入備註。Google 必填題必須全部在網頁端有對應；如有其他題目，需依預填連結調整。

背景 Google POST 使用不透明回應，僅能顯示「回覆已送出，收件待確認」，不可宣稱已成功存檔。沒有部署可驗證 receipt 的服務。前端測試只使用模擬資料，不送出真實 Google 回覆。

## 發布

```sh
python scripts/publish-survey-preview.py --target /path/to/main-checkout
```

只提交 main 的 survey-preview/ 目錄，不替換根目錄正式喜帖。圖片字體沿用 main，內容變動會更新快取版本。
