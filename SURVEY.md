# 婚禮出席意願調查

分支：`feature/attendance-survey`。正式喜帖保留於 main 根目錄。獨立預覽位於 main 的 `survey-preview/`：

https://bonniedo.github.io/yo-bo-invitation/survey-preview/

目前版本使用新人提供的 Google 表單，兩個「填寫出席意願調查」按鈕直接開啟同一份表單（同分頁，不嵌入、不重複蒐集資料）：

https://docs.google.com/forms/d/e/1FAIpQLSchkwGkWyiMbEgX8mKo9tgsprheZJftJVKG8UlztxMXeD_wtw/viewform

頁面沒有喜餅、聯絡方式欄位，也不再使用原有自訂表單或 Apps Script endpoint。Google 表單內的題目與是否開放收件由表單擁有者管理；目前環境無法存取 docs.google.com，未驗證 Google 表單內部題目或真實送件。舊 `integrations/attendance-survey.gs` 僅為備用程式，本版不使用它。

## 設計

- 使用舉杯合照原圖，3:2 完整呈現，不裁切人臉。
- 中文主標題與導引、20px 正文、高對比文字、60px 以上按鈕。
- 用清楚邀請說明與婚宴資訊，適合親友與長輩閱讀。
- 正式喜帖後續另行送上。

## 發布

更新此分支後，在獨立 main checkout 匯出：

```sh
python scripts/publish-survey-preview.py --target /path/to/main-checkout
```

只提交 main 的 survey-preview/ 目錄，不替換根目錄正式喜帖。預覽共用 main 既有的合照與字體，並依來源內容更新快取版本。
