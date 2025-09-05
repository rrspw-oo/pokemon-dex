# PWA Logo 上傳指南

## 需要的檔案格式

請準備以下規格的 PNG 檔案並放入 `public/icons/` 目錄：

### 必需檔案：
1. **icon-192x192.png** - 標準應用程式圖示
   - 尺寸: 192x192 像素
   - 格式: PNG
   - 用途: 應用程式主要圖示

2. **icon-512x512.png** - 大型應用程式圖示
   - 尺寸: 512x512 像素
   - 格式: PNG
   - 用途: 高解析度顯示和啟動畫面

3. **icon-192x192-maskable.png** - 適配性圖示
   - 尺寸: 192x192 像素
   - 格式: PNG
   - 用途: Android adaptive icons
   - 特殊要求: 圖示內容需要在安全區域內（中心 80% 區域）

## 設計建議

### 一般圖示設計：
- 使用清晰、簡潔的設計
- 確保在小尺寸下依然清晰可辨
- 避免過多細節和小文字
- 建議使用與品牌一致的顏色

### Maskable 圖示設計：
- 重要內容放在中心 80% 的安全區域內
- 外圍 20% 區域可能會被裁切
- 可以延伸背景到整個畫布
- 參考: https://web.dev/maskable-icon/

## 檔案結構

```
public/
├── icons/
│   ├── icon-192x192.png          ← 你要上傳的檔案
│   ├── icon-512x512.png          ← 你要上傳的檔案
│   └── icon-192x192-maskable.png ← 你要上傳的檔案
├── pokemonBall.svg               ← 備用圖示
└── manifest.json
```

## 上傳步驟

1. 準備好符合規格的 PNG 檔案
2. 將檔案上傳至 `public/icons/` 目錄
3. 確保檔名完全符合上述要求
4. 執行 `npm run build` 重新建立 PWA
5. 測試 PWA 安裝功能

## 驗證方式

### 開發模式驗證：
```bash
npm run dev
```
在瀏覽器中開啟開發者工具 > Application > Manifest，檢查圖示是否正確載入

### 生產模式驗證：
```bash
npm run build
npm run preview
```
測試 PWA 安裝功能，確保圖示正確顯示

## 備用方案

如果不提供自定義圖示，系統會自動使用 `pokemonBall.svg` 作為預設圖示。

## 注意事項

- PNG 檔案建議使用透明背景
- 檔案大小建議控制在 50KB 以內
- 確保圖片品質清晰，避免模糊或失真
- 上傳後需要重新建立專案才會生效