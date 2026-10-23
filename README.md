# 前期婚禮意願調查分支

本分支首頁為簡易調查版；正式喜帖保留在 `main`。調查按鈕直接開啟新人提供的 Google 表單，適合親友與長輩閱讀。

請先閱讀 [SURVEY.md](SURVEY.md) 的啟用收件與獨立部署說明。以下是正式喜帖的歷史文件，並非此分支首頁功能。

---

# 獨立電子喜帖 wedding-invitation

採用奶油白、炭黑與淡黃色的簡約婚禮小誌設計，保留翻書動畫、行事曆與出席回覆，加入人物互動介紹、刮刮樂邀請、紙花、相片放大與婚禮倒數。純靜態網站，不需要 Node.js 後端、相簿專案、API key 或付費主機。

## 1. 修改喜帖

編輯 `config.js`：新人姓名、婚期、迎賓／開席時間、場地、地址、回覆期限。新人為鑫佑與宛瑩（Walker & Bonnie），婚期 2027-06-19，12:00 入座、12:30 開席。場地已依新人更正為晶宴・御豐館；地圖以館名定位；交通與導航按鈕優先使用新人提供的 `mapsUrl` 場地連結。御豐館地址已由新人提供並確認為「300新竹市東區光復里公道五路三段1號2樓」，同步用於喜帖、行事曆與嵌入地圖。

### 新人照片與 LINE 官方帳號

把自己的照片放進 `assets/`，在 `config.js` 的 `photos` 依序填入封面與三張相片的相對路徑，例如：

```js
photos: ['assets/cover.jpg', 'assets/together.jpg', 'assets/smile.jpg', 'assets/moments.jpg'],
```

封面使用 `assets/walker-bonnie.jpg`，故事頁依序使用新人提供的灑花、香檳與庭院插畫。`photos[0]` 是封面，`photos[1]`、`photos[2]`、`photos[3]` 是三張手動循環輪播的故事照片，可各自替換。左右按鈕、觸控滑動與鍵盤方向鍵可循環切換；圓點可直接選圖，上下捲動不會換圖或觸發圖片特效。照片載入後可點擊或用鍵盤 Enter 放大，Esc 關閉。照片建議先縮至長邊 1600–2000px，移除不想公開的 EXIF 資訊再上傳。

### 六頁喜帖

依序為封面（`#invitation`）、我們的小故事與照片（`#story`）、婚宴時間／地點／小地圖（`#details`）、出席回覆表單（`#rsvp`）、感謝與禮物兌換刮刮樂（`#thanks`）、使用封面同圖的雜誌封底（`#backcover`）。每頁先捲動閱讀內容，再向左翻頁；封面右側圖示與頁內的前後頁連結也會播放翻頁動畫。故事頁的照片由左右按鈕、觸控滑動或鍵盤方向鍵手動循環切換；往下捲動不會換照片。圓點可直接選圖，點擊照片開啟目前原圖。開啟減少動態效果時，停用滑動過場，仍可手動切換。

表單與最後一頁彼此獨立，賓客可以先翻到最後看小禮物，再返回填寫；填寫內容與已揭曉的刮刮樂在翻頁後會保留。送出後留在喜帖並翻到最後一頁；真實收件確認的部署方式見 `integrations/README.md`。

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

出席人數最多 4 位，素食人數不得超過出席人數（最多 4 位），兒童椅不得超過出席人數且最多 2 張。前端選單與資料建構都檢查這些限制。

送出後留在喜帖，翻到感謝與刮刮樂頁。預設背景傳送原 Google 表單；因無法讀取 Google 的跨來源回應，只能顯示「回覆已送出，收件待確認」，不能當成已存檔。設定 `rsvpEndpoint` 後，只有服務回傳實際回覆識別碼，才顯示「回覆已收到」。設定步驟見 [整合說明](integrations/README.md)。目前尚未部署 Apps Script，也未執行真實送件測試。

網路錯誤時保留填寫內容，讓賓客重試或聯絡新人。相同內容的重試沿用 requestId；Apps Script 端使用鎖與已存識別碼防止重複提交。修改後重新送出會建立新回覆；若要修改已收到的舊回覆，仍請新人在表單／Sheets 核對處理。

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

已處理：獨立專案結構、缺少的設定檔、資源路徑、移除舊 API 與相簿頁依賴、喜帖內送出流程、表單欄位資料建構檢查。
待完成：表單擁有者部署收件確認端點、確認 Sheets 連結、真實表單送件端到端驗證。本套件不代表已完成 Google 帳號內設定。

官方說明：
- https://support.google.com/docs/answer/2917686
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 行事曆

「加入我的行事曆」提供 Google 行事曆預填事件，以及 Apple／其他行事曆可開啟的 HTTPS `.ics` 檔案，另保留下載備用連結。選擇後仍由賓客在自己的行事曆確認加入。LINE 等內建瀏覽器可能限制開啟外部行事曆，畫面提供改用 Safari／Chrome 的提示。

修改 `config.js` 的日期、時間、場地或導航資訊後，執行 `node scripts/generate-calendar.cjs`，並提交更新的 `assets/wedding-invitation.ics`。網站維持純靜態，不需要 Node.js 服務。

## 雜誌封面與景深

首頁以全版合照呈現雜誌封面，僅在每行文字下方加上邊緣漸淡的黑色半透明底色；右側手指圖示輕微縮放，點擊可前往故事頁。減少動態效果時停用手指縮放。`assets/invitation-magazine.css` 負責刊名字體、遮罩、書脊紙張、陰影及前後景失焦。`assets/invitation-depth.js` 使用滑鼠視差調整 CSS 3D 傾斜與反光，觸控裝置只保留捲動時的分層效果，不要求陀螺儀權限。開啟系統「減少動態效果」時停用視差、入場失焦與額外動態。原有翻頁動畫持續由 `assets/invitation-book.js` 管理，視差隨封面展開淡出。

## 簡約版面

人物介紹以頭像、姓名與 MBTI 橫向排列，兩人以細線分隔。故事、婚宴資訊與回覆表單統一使用留白及分隔線，移除卡片外框、圓角與大片區塊底色；操作按鈕採圓角外框，表單欄位採底線形式。刮刮樂保留必要的刮除畫布。樣式集中在 `assets/invitation-polish.css`。

## 字體

中文字使用本機提供的「霞鶩文楷 TC」，「芫荽 Iansui」作為缺字備援；字型與 SIL Open Font License 存放於 `assets/fonts/`，不需訪客安裝或連到外部字型 CDN。英文改用易讀的 Arial／Helvetica Neue，雜誌刊名使用 Georgia，皆為非手寫字體；刮刮樂英文也同步使用 Arial。

## 點擊互動

一般點擊會在點擊處冒出橘色小愛心，可連續觸發。最多同時保留 72 顆，動畫結束後移除；不攔截按鈕或連結操作，輸入欄位與刮刮樂畫布不觸發。開啟減少動態效果時停用愛心。

頁尾「回到回覆頁」會返回出席回覆頁。翻頁容器依目前可見頁面調整高度，封底之後不再保留最長內頁造成的多餘捲動空間。
