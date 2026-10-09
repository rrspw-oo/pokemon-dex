# 寶可夢圖鑑搜尋器

一個基於 React 的寶可夢圖鑑搜尋工具，Game Boy 機身外觀、彩色點陣圖、手機優先。

## 功能特色

### 搜尋
- 支援中文、英文名稱與編號（`25`、`#25`）搜尋，全部在瀏覽器內完成，不需連線查詢
- 英文拼錯也找得到（例如 `charzard`、`garchmp`）
- 可用型態關鍵字搜尋：`mega`、`超級`、`阿羅拉`、`伽勒爾`、`洗翠`、`帕底亞`
- 屬性搜尋：`惡`、`惡屬性`、`dark` 會列出該屬性的寶可夢
- Pokémon GO 進化條件搜尋：例如 `捕捉惡屬性`、`步行`、`心心`、`誘餌`、`神奧之石`、`交換`，會列出需要拿來進化的寶可夢，卡片下方顯示符合的條件（例如「進化成流氓熊貓：設為夥伴捕捉 32 隻惡屬性」），社群日或活動時可以馬上找到該帶哪隻當夥伴
- 輸入時顯示建議清單（含縮圖），可用方向鍵、Enter、Esc 操作

### 圖鑑頁
- 點選建議或結果卡片進入圖鑑頁：大圖、屬性；卡片左上角「上一隻」回到上一個看過的寶可夢，從搜尋結果進來時顯示「全部結果」；搜尋只找到一筆時也會先顯示結果列表
- 一般 / 閃光 / 超極巨化 外觀切換（有資料才會出現）
- 進化：橫向列出整條進化鏈，分支進化（例如伊布）在同一階段內排成小格；不會進化的寶可夢會標示「此寶可夢不會進化」
- Pokémon GO 進化條件涵蓋範圍：game master 中全部 478 條進化（含地區型態條件不同的版本，例如伽勒爾呆呆獸要捕捉 30 隻毒屬性）。不包含社群日與夥伴活動期間的限定條件、超級進化能量、淨化寶可夢的糖果折扣，以及伊布取名進化。資料時間以 PokeMiners 最後更新為準
- Pokémon GO 進化條件：點進化鏈中的寶可夢，下方顯示在 Pokémon GO 進化成牠所需的條件（糖果、道具、誘餌模組、夥伴步行公里數或心心、任務、性別、時段、限地區型態、交換免糖果），並可按「查看」前往牠的圖鑑頁。例如仙子伊布為 25 顆糖果與和夥伴獲得 70 顆心心，流氓熊貓為 50 顆糖果與「設為夥伴捕捉 32 隻惡屬性」
- PvP 推薦：選擇超級聯盟 / 高級聯盟 / 大師聯盟，顯示 PvPoke 推薦的一般招式與特殊招式（需要菁英招式學習器的會標「菁英」）、PvPoke 排名與分數，以及在該聯盟 CP 上限內能力乘積最高的 IV、等級與 CP（等級上限 50，不含最佳夥伴加成；畫面上不另外顯示這段說明）。PvP 資料只在打開圖鑑頁時才載入
- 型態變化：多麗米亞、酋雷姆、奈克洛茲瑪、謝米、胡帕、基格爾德、蒼響、藏瑪然特在 Pokémon GO 可以變換型態。點選型態會顯示變換條件（糖果、星星沙子、合體能量、合體對象、需學會的招式），沒有對應條件的型態標示「目前無法透過型態變化獲得，在官方有活動時方可進化」；資料庫裡有的型態可直接前往其圖鑑頁
- 其他型態：超級進化、地區型態、形態變化等，每個型態都有自己的圖。Pokémon GO 沒有的搭檔皮卡丘、搭檔伊布已移除
- 支援瀏覽器返回鍵；重新整理時會停留在目前的寶可夢

### 圖片
- 所有寶可夢（含型態）一律使用 PokeAPI 的點陣圖（96x96），閃光與超極巨化也是點陣圖
- 主要來源 raw.githubusercontent.com，失敗時改用 jsDelivr
- PWA 會把看過的圖存在 `sprites-cache`，離線也看得到
- 加到手機桌面後會自動更新：每次從背景切回 App、以及開著時每 30 分鐘，都會檢查新版本，有新版就自動重新載入；首頁由 service worker 提供，不會因瀏覽器快取而停在舊版

## 使用說明

1. 在搜尋框輸入寶可夢名稱或編號，從建議清單直接選擇，或按 GO / Enter 列出所有結果
2. 點選卡片進入圖鑑頁，查看進化鏈與其他型態
3. 點進化鏈或型態中的寶可夢可直接切換
4. 點標題「Pokemon Search Tool」清除搜尋

## 開發

```bash
npm install
npm run dev
npm run build
npm run lint
```

## 資料更新

寶可夢資料都打包在前端，執行期不呼叫 PokeAPI。資料來源更新後依序執行：

```bash
npm run data:evolutions
npm run data:forms
npm run data:go
npm run data:pvp
npm run data:fonts
```

| 指令 | 作用 |
| --- | --- |
| `data:evolutions` | 從 PokeAPI 產生 `src/data/evolution_chains.json`（進化鏈與條件） |
| `data:forms` | 依屬性、種族值與名稱把資料庫每一筆對應到 PokeAPI 的型態，寫入 `sprite`、`gmax_sprite`、`form_zh`、`form_en`，並以 PokeAPI 校正中文名稱與種族值；報告寫到 `node_modules/.cache/forms-report.json` |
| `data:go` | 從 PokeMiners 的 Pokémon GO game master 與官方繁體中文文字檔產生 `src/data/go_evolutions.json`（以進化後的圖鑑編號為鍵，條件文字已組好）與 `src/data/go_forms.json`（型態變化，圖片由 PokeAPI 的 pokemon-form 取得）。下載檔快取在 `node_modules/.cache/pogo`，加 `-- --refresh` 重新下載最新版 |
| `data:pvp` | 從 PvPoke 的 gamemaster 與三個聯盟的排名產生 `src/data/pvp.json`（GO 能力值、CP 倍率表、推薦招式、排名、菁英招式），並把對應的 PvPoke 編號寫入資料庫的 `go_id`。招式中文名優先用 GO 官方文字檔，沒有時用 PokeAPI。比對報告在 `node_modules/.cache/pogo/pvp-report.json`；加 `-- --refresh` 重新下載 |
| `data:fonts` | 依程式與資料中實際用到的字，產生 Cubic 11 與 Press Start 2P 的子集字型到 `src/assets/fonts/` |

PokeAPI 回應會快取在 `node_modules/.cache/pokeapi`，重跑不會重複下載。

## 技術堆疊

- React 19
- Vite 7 + vite-plugin-pwa
- PokeAPI（建置時資料來源與點陣圖）
- PvPoke（MIT 授權，授權檔在 `src/data/LICENSE-PvPoke.txt`）：PvP 推薦招式、排名與 GO 能力值
- PokeMiners game_masters 與 pogo_assets（Pokémon GO 進化條件，建置時使用；為社群解包的遊戲資料，未附授權條款）
- 字型：Cubic 11 俐方體11號、Press Start 2P（皆為 SIL OFL，授權檔在 `src/assets/fonts/`）

## 授權

- 程式碼以 MIT 授權釋出，見 `LICENSE`
- `src/customContent/` 內的自訂圖片不在 MIT 授權範圍內
- PvPoke 資料：MIT，授權檔在 `src/data/LICENSE-PvPoke.txt`
- 字型 Cubic 11、Press Start 2P：SIL Open Font License，授權檔在 `src/assets/fonts/`
- Pokémon 及相關名稱、圖像之版權屬於 Nintendo、Creatures、GAME FREAK 與 The Pokémon Company；Pokémon GO 遊戲資料屬於 Niantic。本專案為非官方粉絲作品，與上述公司無關。網頁底部顯示版權歸屬與資料來源
