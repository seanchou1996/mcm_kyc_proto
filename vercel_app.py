import os
from trademedalfx import create_app

# 創建應用實例
app = create_app(os.getenv('FLASK_CONFIG') or 'production')

# 這是Vercel需要的入口點
if __name__ == '__main__':
    # 從環境變量獲取端口，如果沒有則使用默認值8080
    port = int(os.environ.get('PORT', 8080))
    # 設置host為0.0.0.0以便在部署環境中可以正常工作
    app.run(host='0.0.0.0', port=port) 