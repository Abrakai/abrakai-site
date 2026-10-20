# 阿布拉．凱工作室 官網

https://abrakai-studio.com

- `public/`：網站本體（由 Neocities 版 V2.3.0 搬移而來）
  - `index.html`：首頁（服務、作品、AI 小教室、免費工具、產品、房產專區、合作、聯絡）
  - `tools/`：免費 AI 小工具（BG Magic 去背、StickerCraft、GridCut、QR Maker、文章朗讀、Co-Space 課堂互動）
  - `real-estate/`：房產專區（房產安心查、贈與稅規劃）
  - `classroom/`、`products/`、`works/`、`profile.html`、`privacy.html`
  - 舊網址 `tools/remove-bg.html`、`sticker.html`、`qr.html`、`compress.html` 會自動轉到新工具頁
- `docs/neocities-notes/`：內部更新說明（不會上線）
- 純靜態網站，部署在 Cloudflare；推到 `main` 分支會自動上線
- 上線後可在 GitHub Actions 手動執行「官網上線檢查」

## 分工原則

- 官網內容頁：首頁、介紹、作品、課程、產品
- 請勿刪除或覆蓋：`wrangler.toml`、`.github/`、`tools/site_check.py`、`docs/`
- 付費會員工具不放在這個公開倉庫

授權說明見 `LICENSE-NOTICE.md`。
