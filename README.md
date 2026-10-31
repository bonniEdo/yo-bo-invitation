# 鑫佑 & 宛瑩的婚禮小誌

2027 年 6 月 19 日，12:00 入座、12:30 午宴。場地為晶宴・御豐館／綺麗劇場，地址：新竹市東區公道五路三段 1 號 2 樓。

## 正式喜帖與前期調查

- `main` 根目錄：婚禮前發給已答應出席親友的正式喜帖。保留翻書、故事、相簿、刮刮樂、行事曆與導航；沒有出席表單、回覆入口或回覆截止日。
- `feature/attendance-survey`：先詢問是否有意願出席，保留 Google 表單、大家庭人數及基隆接駁調查。
- `main/survey-preview/`：調查分支的發布副本。預覽網址為 https://bonniedo.github.io/yo-bo-invitation/survey-preview/ 。

正式喜帖相簿目前有五張：三張婚禮插畫、雪山合照與日常合照，支援左右切換、愛心選圖與點圖放大。日後可在 `config.js` 的 `photos` 替換為婚紗照；第 0 張為封面／封底，其後五張對應相簿。

## 更新

- 婚宴設定在 `config.js`，場地名稱與場館分別為 `venueName`、`venueRoom`。
- 修改日期、地點後執行 `node scripts/generate-calendar.cjs` 重新產生行事曆檔案；更新下載網址的版本號，避免行動瀏覽器快取舊場館。
- 表單收件程式留在 `integrations/` 供歷史參考，正式喜帖不再載入或呼叫它。
- 舊的 `#rsvp` 連結會轉到婚宴資訊，不再打開表單。

## 預覽與發布

本地執行 `python -m http.server 8090`。GitHub Pages 以 main 根目錄發布，原喜帖網址不變。修改調查版時，從調查分支執行 `scripts/publish-survey-preview.py --target /path/to/main-checkout`，只更新 main 的 survey-preview/。

不要把賓客資料、API key 或私人收件內容提交到 repo。
