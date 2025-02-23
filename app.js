const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json()); // 解析 JSON 请求体

const CONFIG_PATH = path.join(process.env.HOME, "serv00-play", "singbox", "config.json");

// 读取配置
function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    } catch (err) {
        console.error("读取配置文件失败:", err);
        return null;
    }
}

// 写入配置
function writeConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
        console.log("配置文件更新成功！");
    } catch (err) {
        console.error("写入配置文件失败:", err);
    }
}

// 获取出站状态
app.get("/getOutboundStatus", (req, res) => {
    let config = readConfig();
    if (!config) return res.status(500).json({ error: "读取配置失败" });

    let status = "未出站";
    if (config.outbounds.some(outbound => outbound.type === "wireguard")) {
        status = "已配置 WireGuard";
    } else if (config.outbounds.some(outbound => outbound.type === "socks")) {
        status = "已配置 Socks";
    }

    res.json({ status });
});

// 设置 WireGuard 出站
app.post("/setWireGuard", (req, res) => {
    let config = readConfig();
    if (!config) return res.status(500).json({ error: "读取配置失败" });

    // 删除 socks 出站
    config.outbounds = config.outbounds.filter(outbound => outbound.type !== "socks");

    // 添加 WireGuard 出站
    config.outbounds.unshift({
        "type": "wireguard",
        "tag": "wireguard-out",
        "server": "162.159.195.100",
        "server_port": 4500,
        "local_address": [
            "172.16.0.2/32",
            "2606:4700:110:83c7:b31f:5858:b3a8:c6b1/128"
        ],
        "private_key": "mPZo+V9qlrMGCZ7+E6z2NI6NOV34PD++TpAR09PtCWI=",
        "peer_public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
        "reserved": [26, 21, 228]
    });

    writeConfig(config);
    res.json({ message: "WireGuard 出站已设置" });
});

// 设置 Socks 出站
app.post("/setSocks", (req, res) => {
    const { server, server_port, username, password } = req.body;
    if (!server || !server_port || !username || !password) {
        return res.status(400).json({ error: "参数不完整" });
    }

    let config = readConfig();
    if (!config) return res.status(500).json({ error: "读取配置失败" });

    // 删除 wireguard 出站
    config.outbounds = config.outbounds.filter(outbound => outbound.type !== "wireguard");

    // 添加 Socks 出站
    config.outbounds.unshift({
        "type": "socks",
        "tag": "socks5_outbound",
        "server": server,
        "server_port": parseInt(server_port),
        "version": "5",
        "username": username,
        "password": password
    });

    writeConfig(config);
    res.json({ message: "Socks 出站已设置" });
});

// 关闭出站
app.post("/disableOutbound", (req, res) => {
    let config = readConfig();
    if (!config) return res.status(500).json({ error: "读取配置失败" });

    config.outbounds = config.outbounds.filter(outbound =>
        outbound.type !== "wireguard" && outbound.type !== "socks"
    );

    writeConfig(config);
    res.json({ message: "已关闭出站" });
});

// 启动服务器
app.listen(3000, () => {
    console.log("服务器运行在 http://localhost:3000");
});