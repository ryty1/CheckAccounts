const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// Singbox 配置文件路径
const SINGBOX_CONFIG_PATH = path.join(process.env.HOME, "serv00-play", "singbox", "singbox.json");

// 使用 JSON 中间件
app.use(express.json());

// 提供静态文件的目录（如 log.html）
app.use(express.static(path.join(__dirname, 'public')));

// 获取 GOOD_DOMAIN 的值
app.get('/get-good-domain', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync(SINGBOX_CONFIG_PATH, 'utf8'));
        res.json({ GOOD_DOMAIN: config.GOOD_DOMAIN || 'null' });
    } catch (err) {
        res.status(500).json({ error: '读取配置失败', details: err.message });
    }
});

// 修改 GOOD_DOMAIN 的值
app.post('/set-good-domain', (req, res) => {
    const { GOOD_DOMAIN } = req.body;

    if (GOOD_DOMAIN === undefined || GOOD_DOMAIN === null) {
        return res.status(400).json({ error: '缺少 GOOD_DOMAIN 参数' });
    }

    try {
        let config = JSON.parse(fs.readFileSync(SINGBOX_CONFIG_PATH, 'utf8'));
        config.GOOD_DOMAIN = GOOD_DOMAIN;
        fs.writeFileSync(SINGBOX_CONFIG_PATH, JSON.stringify(config, null, 4));
        res.json({ message: '更新成功', GOOD_DOMAIN });
    } catch (err) {
        res.status(500).json({ error: '更新配置失败', details: err.message });
    }
});

// 路由：返回 log.html 页面
app.get("/goodomains", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "goodomains.html"));
});

// 启动服务器
app.listen(3000, () => console.log('Server running on port 3000'));