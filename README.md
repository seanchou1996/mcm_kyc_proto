# MC Markets - 金融市場資訊平台

MC Markets 是一個專注於貴金屬、外匯和指數市場的資訊平台，提供最新的市場新聞、分析和 CFD 交易平台比較。

## 功能特點

- **市場新聞**: 提供貴金屬、外匯、商品和加密貨幣等市場的最新新聞和分析
- **CFD 平台比較**: 全面比較各大 CFD 交易平台的特點、優勢和劣勢
- **市場行情**: 實時顯示主要金融產品的價格和變動
- **搜索功能**: 快速查找相關新聞和平台信息

## 技術架構

- **後端**: Python Flask
- **前端**: HTML, CSS, JavaScript, Bootstrap 5
- **數據存儲**: 模擬數據（可擴展為數據庫存儲）
- **緩存**: Flask-Caching

## 安裝指南

### 前提條件

- Python 3.8 或更高版本
- pip 包管理器

### 安裝步驟

1. 克隆此倉庫:
   ```
   git clone https://github.com/yourusername/mc-markets.git
   cd mc-markets
   ```

2. 創建並激活虛擬環境:
   ```
   python -m venv venv
   source venv/bin/activate  # 在 Windows 上使用: venv\Scripts\activate
   ```

3. 安裝依賴:
   ```
   pip install -r requirements.txt
   ```

4. 運行應用:
   ```
   ./run.sh
   ```
   或者手動設置環境變量並運行:
   ```
   export FLASK_APP=mc_markets/app.py
   export FLASK_ENV=development
   flask run --host=0.0.0.0 --port=5000
   ```

5. 在瀏覽器中訪問:
   ```
   http://localhost:5000
   ```

## 項目結構

```
mc_markets/
├── __init__.py          # 應用初始化
├── app.py               # 應用入口點
├── config.py            # 配置設置
├── models.py            # 數據模型
├── routes.py            # 路由定義
├── utils.py             # 工具函數
├── static/              # 靜態文件 (CSS, JS, 圖片)
└── templates/           # HTML 模板
    ├── base.html        # 基礎模板
    ├── index.html       # 首頁
    ├── partials/        # 部分模板 (頁頭, 頁尾等)
    ├── news/            # 新聞相關模板
    ├── platforms/       # 平台比較相關模板
    └── errors/          # 錯誤頁面模板
```

## 開發指南

### 添加新功能

1. 在 `routes.py` 中添加新的路由
2. 在 `templates/` 目錄中創建相應的模板
3. 如果需要，在 `utils.py` 中添加新的工具函數
4. 更新 `models.py` 以支持新的數據結構

### 代碼風格

- 遵循 PEP 8 Python 代碼風格指南
- 使用有意義的變量和函數名
- 為函數和類添加文檔字符串

## 部署指南

### 本地部署

使用提供的 `run.sh` 腳本在本地運行應用。

### 生產環境部署

對於生產環境，建議使用 Gunicorn 作為 WSGI 服務器:

1. 安裝 Gunicorn:
   ```
   pip install gunicorn
   ```

2. 運行應用:
   ```
   gunicorn -w 4 -b 0.0.0.0:5000 "mc_markets.app:app"
   ```

3. 使用 Nginx 作為反向代理（推薦）。

## 貢獻指南

1. Fork 此倉庫
2. 創建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟一個 Pull Request

## 許可證

此項目採用 MIT 許可證 - 詳情請參閱 [LICENSE](LICENSE) 文件。

## 聯繫方式

如有任何問題或建議，請通過以下方式聯繫我們:

- 電子郵件: info@mcmarkets.com
- 網站: [https://www.mcmarkets.com](https://www.mcmarkets.com)

---

**免責聲明**: MC Markets 提供的信息僅供參考，不構成投資建議。交易 CFD 涉及高風險，您可能會損失所有投資資金。 