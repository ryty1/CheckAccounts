#!/bin/bash

# 从当前系统中获取当前用户的用户名
USERNAME=$(whoami)

# 如果未能获取用户名，退出脚本
if [[ -z "$USERNAME" ]]; then
    echo "无法获取当前系统用户名，脚本退出。"
    exit 1
fi

# 定义域名，后缀修改为 serv00.net
DOMAIN="$USERNAME.serv00.net"

# 定义 Node.js 应用端口号
NODE_PORT=3000

# 定义存放域名文件夹的根路径
DOMAIN_FOLDER_ROOT="/home/$USERNAME/domains"

# 定义新域名文件夹路径
DOMAIN_DIR="$DOMAIN_FOLDER_ROOT/$DOMAIN"

# 定义 Node.js 项目文件夹路径
PUBLIC_NODEJS_DIR="$DOMAIN_DIR/public_nodejs"

# 定义 app.js 文件的路径
APP_JS_PATH="$PUBLIC_NODEJS_DIR/app.js"

# 定义 app.js 文件的下载地址
APP_JS_URL="https://raw.githubusercontent.com/ryty1/htmlalive/main/app.js"

# 删除旧域名及其对应文件夹
echo "正在删除旧域名 $DOMAIN..."
devil www del "$DOMAIN" 2>/dev/null
if [[ -d "$DOMAIN_DIR" ]]; then
    echo "正在删除旧域名的文件夹：$DOMAIN_DIR"
    rm -rf "$DOMAIN_DIR"
    echo "旧域名文件夹已删除：$DOMAIN_DIR"
fi

# 添加新域名并绑定到 Node.js 应用
echo "正在生成新域名 $DOMAIN..."
devil www add "$DOMAIN" nodejs /usr/local/bin/node22

# 创建新的域名文件夹及其子目录
if [[ ! -d "$PUBLIC_NODEJS_DIR" ]]; then
    mkdir -p "$PUBLIC_NODEJS_DIR"
    echo "已创建新域名文件夹及子目录：$PUBLIC_NODEJS_DIR"
fi

# 初始化 Node.js 项目并安装依赖
echo "正在初始化 Node.js 项目并安装依赖..."
cd "$DOMAIN_DIR" || exit

# 如果 package.json 不存在，则初始化 Node.js 项目
if [[ ! -f package.json ]]; then
    echo "初始化 package.json..."
    npm init -y > /dev/null
    echo "已初始化 Node.js 项目：package.json"
fi

# 安装依赖（dotenv, basic-auth, express）
echo "正在安装依赖到目录：$PUBLIC_NODEJS_DIR"
if npm install dotenv basic-auth express > /dev/null; then
    echo "依赖已成功安装：dotenv, basic-auth, express"
else
    echo "依赖安装失败，请检查 Node.js 环境。"
    exit 1
fi

# 下载 app.js 文件到域名文件夹
echo "正在下载 app.js 文件到：$APP_JS_PATH"
if curl -s -o "$APP_JS_PATH" "$APP_JS_URL"; then
    echo "app.js 文件已成功下载到 $APP_JS_PATH"
else
    echo "下载 app.js 文件失败，请检查下载地址：$APP_JS_URL"
    exit 1
fi

# 赋予 app.js 适当的权限（644：可读写权限，适合大多数情况）
echo "正在为 app.js 设置文件权限..."
chmod 644 "$APP_JS_PATH"
if [[ $? -eq 0 ]]; then
    echo "文件权限已成功设置为 644"
else
    echo "设置文件权限失败"
    exit 1
fi

# 输出结果
echo "域名 $DOMAIN 已成功生成并指向 Node.js 应用的端口 $NODE_PORT。"
echo "Node.js $NODE_VERSION 已安装到 $PUBLIC_NODEJS_DIR。"
echo "app.js 文件已保存到 $APP_JS_PATH，并完成域名文件夹配置。"
echo "Node.js 项目已初始化，并安装了必要依赖：dotenv, basic-auth, express。"
