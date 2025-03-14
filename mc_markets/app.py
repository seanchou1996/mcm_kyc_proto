import os
from mc_markets import create_app

# 創建應用實例
app = create_app(os.getenv('FLASK_CONFIG') or 'default')

if __name__ == '__main__':
    # 從環境變量獲取端口，如果沒有則使用默認值5000
    port = int(os.environ.get('PORT', 5000))
    # 設置host為0.0.0.0以便在開發環境中也能從其他設備訪問
    app.run(host='0.0.0.0', port=port)
