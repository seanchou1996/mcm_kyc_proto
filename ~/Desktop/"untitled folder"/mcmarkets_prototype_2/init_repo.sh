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

git remote add origin https://github.com/seanchou1996/mcmarkets_prototype_2.git
git branch -M main
git push -u origin main

然後可以在Vercel上導入該倉庫以部署網站。
" 

# 執行遠程倉庫連接命令
cd ~/Desktop/"untitled folder"/mcmarkets_prototype_2

# 檢查遠程倉庫配置
git remote -v

# 如果已經設置了origin，可以用以下命令移除
git remote remove origin

# 重新添加遠程倉庫
git remote add origin https://github.com/seanchou1996/mcmarkets_prototype_2.git

# 確保所有更改都已提交
git add .
git commit -m "Initial commit"

# 推送到main分支
git push -u origin main 