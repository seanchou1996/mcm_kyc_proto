#!/bin/bash

# 激活虛擬環境
source venv/bin/activate

# 設置環境變數
export FLASK_APP=mc_markets
export FLASK_ENV=development
export PORT=8888

# 檢查是否安裝了所需的依賴
if ! pip show flask > /dev/null 2>&1; then
    echo "安裝所需的依賴..."
    pip install -r requirements.txt
fi

# 啟動應用
echo "啟動 MC Markets 應用..."
echo "應用將在 http://localhost:$PORT 運行"
flask run --host=0.0.0.0 --port=$PORT 