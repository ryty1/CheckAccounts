#!/bin/bash
USERNAME=$(whoami)
if [[ -z "$USERNAME" ]]; then
    echo "无法获取当前系统用户名，脚本退出。"
    exit 1
fi
echo ""
DOMAIN="$USERNAME.serv00.net"
NODE_PORT=3000
DOMAIN_FOLDER_ROOT="/home/$USERNAME/domains"
DOMAIN_DIR="$DOMAIN_FOLDER_ROOT/$DOMAIN"
PUBLIC_NODEJS_DIR="$DOMAIN_DIR/public_nodejs"
APP_JS_PATH="$PUBLIC_NODEJS_DIR/app.js"
APP_JS_URL="https://raw.githubusercontent.com/ryty1/htmlalive/main/app.js"

devil www del "$DOMAIN"  > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
    echo " [OK] 默认域名已成功删除。"
    echo ""
else
    echo "默认域名删除失败，可能不存在。"
    echo ""
fi

if [[ -d "$DOMAIN_DIR" ]]; then
    rm -rf "$DOMAIN_DIR"
fi

if devil www add "$DOMAIN" nodejs /usr/local/bin/node22 > /dev/null 2>&1; then
    echo " [OK] $DOMAIN 已生成。"
    echo ""
else
    echo "新域名生成失败，请检查环境配置。"
    echo ""
    exit 1
fi

if [[ ! -d "$PUBLIC_NODEJS_DIR" ]]; then
    mkdir -p "$PUBLIC_NODEJS_DIR"
fi

if npm install dotenv basic-auth express > /dev/null 2>&1; then
    echo " [OK] 依赖已成功安装！"
    echo ""
else
    echo "依赖安装失败，请检查 Node.js 环境。"
    exit 1
fi

if curl -s -o "$APP_JS_PATH" "$APP_JS_URL"; then
    echo " [OK] 配置文件 下载成功"
else
    echo "配置文件 下载失败，请检查下载地址。"
    exit 1
fi

chmod 644 "$APP_JS_PATH"
if [[ $? -eq 0 ]]; then
    echo ""
else
    echo "文件权限设置失败"
    exit 1
fi
echo " 【 恭 喜 】： 一 键 部 署 已 完 成 。"
echo " —————————————————————————————————————————————————————————————————————— "
echo " |**保活网页 https://$DOMAIN/info "
echo ""
echo " |**查看节点 https://$DOMAIN/node_info "
echo ""
echo " |**输出日志 https://$DOMAIN/keepalive "
echo " —————————————————————————————————————————————————————————————————————— "
echo 