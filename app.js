const fs = require('fs');
const path = require('path');
const axios = require('axios');
const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = 3000;
const repoOwner = "你的GitHub用户名";
const repoName = "你的仓库名";
const localTagFile = path.join(__dirname, 'latest_tag.txt');  // 记录本地标签
const localFolder = __dirname;  // 你的项目目录

// 启动 WebSocket 服务器
const server = app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
const wss = new WebSocket.Server({ server });

// **获取 GitHub 最新标签**
const getLatestTag = async () => {
    try {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/tags`;
        const response = await axios.get(url);
        return response.data.length > 0 ? response.data[0].name : null;
    } catch (error) {
        console.error("❌ 获取 GitHub 标签失败:", error);
        return null;
    }
};

// **获取本地存储的标签**
const getLocalTag = () => fs.existsSync(localTagFile) ? fs.readFileSync(localTagFile, 'utf8').trim() : null;

// **保存本地最新的标签**
const saveLocalTag = (tag) => fs.writeFileSync(localTagFile, tag, 'utf8');

// **获取指定标签下的文件列表**
const getFileList = async (tag) => {
    try {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${tag}?recursive=1`;
        const response = await axios.get(url);
        return response.data.tree.filter(file => file.type === "blob" && file.path.startsWith("single/"));
    } catch (error) {
        console.error("❌ 获取文件列表失败:", error);
        return [];
    }
};

// **下载文件内容**
const getFileContent = async (tag, filePath) => {
    try {
        const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${tag}/${filePath}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`❌ 下载失败: ${filePath}`, error);
        return null;
    }
};

// **保存文件**
const saveFile = (filePath, content) => {
    const localPath = path.join(localFolder, filePath.replace(/^single\//, ""));  // 移除 single/ 目录
    fs.mkdirSync(path.dirname(localPath), { recursive: true });  // 创建文件夹
    fs.writeFileSync(localPath, content, 'utf8');
};

// **WebSocket 监听前端请求**
wss.on('connection', async (ws) => {
    console.log('✅ Client connected');

    const latestTag = await getLatestTag();
    const localTag = getLocalTag();

    // 连接时，发送 GitHub 最新版本 和 本地版本
    ws.send(JSON.stringify({ latestTag, localTag }));

    ws.on('message', async (message) => {
        const { tag } = JSON.parse(message);
        if (!tag) {
            ws.send(JSON.stringify({ progress: 100, message: "❌ 错误: 没有提供标签。" }));
            return;
        }

        if (tag === localTag) {
            ws.send(JSON.stringify({ progress: 100, message: "✅ 已是最新版本，无需更新。" }));
            return;
        }

        ws.send(JSON.stringify({ progress: 5, message: "🔍 获取文件列表..." }));

        try {
            const fileList = await getFileList(tag);
            if (!fileList.length) {
                ws.send(JSON.stringify({ progress: 100, message: "❌ 没有找到可更新的文件。" }));
                return;
            }

            let progress = 5;
            const step = Math.floor(95 / fileList.length);

            for (const file of fileList) {
                progress += step;
                ws.send(JSON.stringify({ progress, message: `📥 下载 ${file.path}...` }));

                const content = await getFileContent(tag, file.path);
                if (content) {
                    saveFile(file.path, content);
                    ws.send(JSON.stringify({ progress, message: `✅ 更新 ${file.path}` }));
                }
            }

            // 记录最新的本地标签
            saveLocalTag(tag);
            ws.send(JSON.stringify({ progress: 100, message: "🎉 更新完成。" }));
        } catch (error) {
            ws.send(JSON.stringify({ progress: 100, message: "❌ 更新失败。" }));
            console.error(error);
        }
    });
});

// 提供静态文件访问
app.use(express.static(path.join(__dirname, 'public')));