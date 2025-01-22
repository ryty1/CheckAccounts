#!/bin/bash
USERNAME=$(whoami)
if [[ -z "$USERNAME" ]]; then
    echo "无法获取当前系统用户名，脚本退出。"
    exit 1
fi
DOMAIN="$USERNAME.serv00.net"
NODE_PORT=3000
DOMAIN_FOLDER_ROOT="/home/$USERNAME/domains"
DOMAIN_DIR="$DOMAIN_FOLDER_ROOT/$DOMAIN"
PUBLIC_NODEJS_DIR="$DOMAIN_DIR/public_nodejs"
APP_JS_PATH="$PUBLIC_NODEJS_DIR/app.js"
APP_JS_URL="https://raw.githubusercontent.com/ryty1/htmlalive/main/app.js"
echo "正在删除默认域名"
devil www del "$DOMAIN" 2>/dev/null
if [[ -d "$DOMAIN_DIR" ]]; then
    rm -rf "$DOMAIN_DIR"
fi
echo "正在生成新域名 $DOMAIN..."
devil www add "$DOMAIN" nodejs /usr/local/bin/node22
if [[ ! -d "$PUBLIC_NODEJS_DIR" ]]; then
    mkdir -p "$PUBLIC_NODEJS_DIR"
fi
echo "正在安装依赖………"
if npm install dotenv basic-auth express > /dev/null; then
    echo "依赖已成功安装！"
else
    echo "依赖安装失败，请检查 Node.js 环境。"
    exit 1
fi
echo "正在下载 app.js"
if curl -s -o "$APP_JS_PATH" "$APP_JS_URL"; then
    echo "app.js 文件下载成功"
else
    echo "下载 app.js 文件失败，请检查下载地址。"
    exit 1
fi
chmod 644 "$APP_JS_PATH"
if [[ $? -eq 0 ]]; then
else
    exit 1
fi
echo " 一 键 部 署 己 完 成 。"
echo " "
echo " 保活地址 https://"$DOMAIN"/info "

