# 喜帖內確認回覆

網站不再導向 Google 確認頁；送出後保留喜帖，翻到最後一頁。

- `rsvpEndpoint` 空白：背景傳送至原 Google Form。Google 的不透明跨來源回應無法證明資料已存入，因此只顯示「回覆已送出，收件待確認」。表單關閉、登入需求或驗證錯誤也可能仍收到不透明回應。
- 設定有效端點：只在服務實際儲存並傳回非空 receipt 後顯示「回覆已收到」。網路錯誤、逾時或服務失敗會保留表單內容，不翻到完成頁；相同內容重試沿用 requestId，減少重複送件。

## 由表單擁有者設定一次

1. 用原 Google 表單擁有者帳號開啟綁定於該表單的 Apps Script 專案。
2. 貼入 `google-forms-rsvp.gs` 的完整內容。`rsvpFields_` 依題目名稱與型別對應現有六題，若題目名稱不同，先修改別名；不要刪除既有資料。
3. 手動執行 `setupRsvp()` 並完成 Google 授權。此步把表單 ID 存入伺服器 Script Properties，不放在前端。
4. 部署為「網頁應用程式」，執行身分選自己、存取權選任何人。若帳號或組織禁止匿名網頁應用程式，需先解除該限制或採用其他後端。
5. 把部署的 `https://script.google.com/macros/s/…/exec` 網址填入 `config.js` 的 `rsvpEndpoint`，提交並更新網站。不要填 `/dev` 測試網址。
6. 實際送一筆測試回覆，核對 Google Form／連結的 Sheets 新增內容，再刪除測試資料。測試成功以前不要把服務標為已完成連線。

Google Apps Script 網頁應用程式回應可能經過 `script.googleusercontent.com` 重新導向；網路政策須允許 Google 的必要端點。前端用不觸發預檢的 `text/plain` JSON POST，實際公開部署與跨來源回應仍須驗證。不得用 `no-cors` 模式代替端點的真實收件確認。

設定後端也會再次限制：出席 1–4、素食 0–出席人數、兒童椅 0–min(2, 出席人數)。目前程式已備妥，但尚未取得擁有者部署網址，不能宣稱已上線或已通過真實 Google 收件測試。
