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

// 获取当前的 GOOD_DOMAIN
app.get('/getGoodDomain', (req, res) => {
  fs.readFile(SINGBOX_CONFIG_PATH, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: '读取配置文件失败' });
    }
    
    const config = JSON.parse(data);
    res.json({ GOOD_DOMAIN: config.GOOD_DOMAIN });
  });
});

// 更新 GOOD_DOMAIN
app.post('/updateGoodDomain', (req, res) => {
  const newGoodDomain = req.body.GOOD_DOMAIN;

  if (!newGoodDomain) {
    return res.status(400).json({ success: false, error: '缺少 GOOD_DOMAIN' });
  }

  fs.readFile(SINGBOX_CONFIG_PATH, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, error: '读取配置文件失败' });
    }

    const config = JSON.parse(data);
    config.GOOD_DOMAIN = newGoodDomain;

    fs.writeFile(SINGBOX_CONFIG_PATH, JSON.stringify(config, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: '保存配置文件失败' });
      }
      res.json({ success: true });
    });
  });
});

// 路由：返回 goodomains.html 页面
app.get("/goodomains", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "goodomains.html"));
});

// 路由：返回 log.html 页面
app.get("/goodomains", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "goodomains.html"));
});

// 启动服务器
app.listen(3000, () => console.log('Server running on port 3000'));