# 獨立電子喜帖 wedding-invitation

採用奶油白、炭黑與淡黃色的簡約婚禮小誌設計，保留翻書動畫、行事曆與出席回覆，加入性格互動卡、刮刮樂邀請、紙花、相片放大與婚禮倒數。純靜態網站，不需要 Node.js 後端、相簿專案、API key 或付費主機。

## 1. 修改喜帖

編輯 `config.js`：新人姓名、婚期、迎賓／開席時間、場地、地址、回覆期限。新人為鑫佑與宛瑩（Walker & Bonnie），婚期 2027-06-19，12:00 入座、12:30 開席。場地已依新人更正為晶宴・御豐館；地圖以館名定位；交通與導航按鈕優先使用新人提供的 `mapsUrl` 場地連結。御豐館地址已由新人提供並確認為「300新竹市東區光復里公道五路三段1號2樓」，同步用於喜帖、行事曆與嵌入地圖。

### 新人照片與 LINE 官方帳號

把自己的照片放進 `assets/`，在 `config.js` 的 `photos` 依序填入封面與三張相片的相對路徑，例如：

```js
photos: ['assets/cover.jpg', 'assets/together.jpg', 'assets/smile.jpg', 'assets/moments.jpg'],
```

目前封面與相簿使用新人提供的 `assets/walker-bonnie.jpg` 合照；未配置的相簿格會隱藏。照片載入後可點擊或用鍵盤 Enter 放大，Esc 關閉。照片建議先縮至長邊 1600–2000px，移除不想公開的 EXIF 資訊再上傳。

`lineOfficialUrl` 填入官方帳號的 HTTPS 加入好友連結（`lin.ee` 或 `line.me`）。空白時不顯示按鈕。

刮刮樂支援滑鼠與觸控；刮除約 42% 自動揭曉，也可按「直接揭曉」。偏好減少動態效果的裝置不播放紙花，翻頁改用較少動作的方式呈現。

## 2. Google Sheets 串接（須由表單擁有者操作一次）

流程：喜帖 → 原有 Google 表單 → Google 試算表。

1. 用擁有者帳號開啟原本 Google 表單的編輯頁。
2. 點「回覆」→ 綠色試算表圖示「連結至試算表」。
3. 選「建立新試算表」或「選取現有試算表」→ 建立／選取。
4. 確認表單已發布、接受回覆，且一般賓客有填寫權限。若希望免登入，關閉限制一次回覆、組織限定與需驗證的電子郵件收集。
5. 從喜帖填一筆「測試－請刪除」，送出後在 Google 頁面確認回覆已記錄，再到 Sheets 核對新增資料，最後刪除測試資料。

不用把試算表公開，也不用把 Sheets 網址填進前端。表單回覆目的地由 Google Forms 管理。

### 目前沿用的欄位

| 喜帖欄位 | 表單 entry ID | Sheets 內容 |
| --- | --- | --- |
| 姓名 | 422131427 | 姓名 |
| 是否出席 | 1516813007 | 是／否 |
| 出席人數 | 1699498460 | 含自己；不出席為 0 |
| 兒童座椅 | 265044724 | 座椅數量 |
| 是否素食 | 216919246 | 是／否 |
| 給新人的話 | 1228328755 | 祝福＋素食人數＋飲食備註 |

素食「人數」及飲食備註會附在給新人的話中，因為原表單只有是否素食欄位。若要改成試算表獨立欄位，需要先在 Google 表單新增題目，再修改 `assets/invitation-google-form.js` 的欄位對應。

若更換整張 Google 表單或刪掉重建題目，不能只改網址：entry ID 也須更新。可從表單的「預先填入表單」取得含 `entry.數字` 的連結確認 ID。

### 送出行為

送出會在同一分頁顯示 Google 的確認頁。只有 Google 顯示「回覆已記錄」才算完成；若表單關閉、需登入、欄位驗證失敗，Google 會直接顯示原因。移除了原本無法驗證收件結果的隱藏 iframe 與成功提示。若看到錯誤，可回上一頁或使用喜帖中的 Google 表單連結。

此版本不支援照片上傳：原 Google 表單沒有上傳題目，原相簿後端也未包含在附件裡，已隱藏上傳區避免誤導。網站仍保留原版樣式資源。

## 3. 建立獨立 GitHub repo

在 GitHub 建立空 repo，建議名稱 `wedding-invitation`。不要先新增 README。

在此資料夾開啟終端機，將下列網址中的 YOUR_ACCOUNT 改為你的帳號：

```bash
git init -b main
git add .
git commit -m "Create standalone wedding invitation"
git remote add origin https://github.com/YOUR_ACCOUNT/wedding-invitation.git
git push -u origin main
```

也可在 GitHub 網頁上傳：將本資料夾裡的 `index.html`、`config.js` 和整個 `assets` 資料夾放在 repo 根目錄，勿再包一層 wedding-invitation。

## 4. GitHub Pages

Repo → Settings → Pages：

- Source：Deploy from a branch
- Branch：main
- Folder：/(root)
- Save

網址通常為 `https://YOUR_ACCOUNT.github.io/wedding-invitation/`，以 Pages 畫面顯示為準。路徑已用相對路徑，支援 repo 子目錄。Private repo 的 Pages 可用性依 GitHub 方案而定；公開 repo 不要放賓客資料或密鑰。

## 5. 本機預覽

```bash
python3 -m http.server 8080
```

開啟 http://localhost:8080 。瀏覽器手機模式也可測試翻書與回覆區。

## 上線前確認

- [ ] 替換範例新人姓名、確認場地與時間、回覆期限。
- [ ] 手機上能翻頁、跳到回覆區，圖片沒有 404。
- [ ] Google 表單已連結 Sheets。
- [ ] 實測出席 2 人／素食 1 人／兒童座椅 1 張，Sheets 資料正確。
- [ ] 實測無法出席，出席／素食／座椅皆為 0。
- [ ] 以未登入 Google 的瀏覽器測試填寫權限。

## 已處理／待完成

已處理：獨立專案結構、缺少的設定檔、資源路徑、移除舊 API 與相簿頁依賴、可見 Google 確認頁、表單欄位資料建構檢查。
待完成：GitHub 遠端 repo 建立／推送、表單擁有者連結 Sheets、真實表單送件端到端驗證。本套件不代表已完成 Google 帳號內設定。

官方說明：
- https://support.google.com/docs/answer/2917686
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
