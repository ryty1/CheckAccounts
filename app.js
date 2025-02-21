const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const repoOwner = 'ryty1';  // GitHub 用户名
const repoName = 'My-test';    // GitHub 仓库名
const repoFolder = 'single';  // 只下载 single 目录的内容
const localFolder = '.';      // 文件存储在当前目录

// WebSocket 监听前端请求
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', async (message) => {
        const { tag } = JSON.parse(message);
        if (!tag) {
            ws.send(JSON.stringify({ progress: 100, message: "Error: No tag provided." }));
            return;
        }

        ws.send(JSON.stringify({ progress: 5, message: "Fetching file list..." }));

        try {
            const fileList = await getFileList(tag);
            if (!fileList.length) {
                ws.send(JSON.stringify({ progress: 100, message: "Error: No files found." }));
                return;
            }

            let progress = 5;
            const step = Math.floor(95 / fileList.length);

            for (const file of fileList) {
                progress += step;
                ws.send(JSON.stringify({ progress, message: `Downloading ${file.path}...` }));

                const content = await getFileContent(tag, file.path);
                if (content) {
                    saveFile(file.path, content);
                    ws.send(JSON.stringify({ progress, message: `Updated ${file.path}` }));
                }
            }

            ws.send(JSON.stringify({ progress: 100, message: "Update complete." }));
        } catch (error) {
            ws.send(JSON.stringify({ progress: 100, message: "Error: Update failed." }));
            console.error(error);
        }
    });
});

// 获取 GitHub 指定目录的文件列表
const getFileList = async (tag) => {
    try {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoFolder}?ref=${tag}`;
        const response = await axios.get(url);
        return response.data.filter(file => file.type === 'file');  // 只获取文件，不要文件夹
    } catch (error) {
        console.error("Error fetching file list:", error);
        return [];
    }
};

// 获取 GitHub 文件内容
const getFileContent = async (tag, filePath) => {
    try {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${tag}`;
        const response = await axios.get(url);
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
    } catch (error) {
        console.error(`Error fetching ${filePath}:`, error);
        return null;
    }
};

// 保存文件到本地，并去掉 `single/` 目录前缀
const saveFile = (filePath, content) => {
    const relativePath = filePath.replace(repoFolder + '/', '');  // 去掉 single/
    const localPath = path.join(__dirname, localFolder, relativePath);

    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, content);
};

// 启动服务器
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});