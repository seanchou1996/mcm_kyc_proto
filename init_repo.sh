#!/bin/bash

# 初始化git倉庫
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "Initial commit for MC Markets Prototype V2"

# 說明如何添加遠程倉庫
echo "
倉庫已初始化完成。
接下來，請在GitHub創建一個新的倉庫，然後運行以下命令連接到遠程倉庫：

git remote add origin https://github.com/YOUR_USERNAME/mcmarkets_prototype_2.git
git branch -M main
git push -u origin main

然後可以在Vercel上導入該倉庫以部署網站。
" 