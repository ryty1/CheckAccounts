require('dotenv').config();
const express = require("express");
const { exec } = require('child_process');
const fs = require('fs'); // 导入 fs 模块
const app = express();
app.use(express.json());

// 存储最多 5 条日志的数组
let logs = [];
// 保存 start.sh 命令最近一次成功日志的变量
let latestStartLog = "";

function logMessage(message) {
    // 将新日志添加到数组中
    logs.push(message);
    // 保持数组最多包含 5 个元素
    if (logs.length > 5) {
        logs.shift();
    }

    // 将内容写入 error.log 文件
    const logContent = logs.join("\n");
    const logFilePath = '/home/serv00账户/domains/serv00账户.serv00.net/logs/error.log';
    fs.writeFileSync(logFilePath, logContent, 'utf8'); // 覆盖写入文件
}

// 通用的 shell 命令执行函数
function executeCommand(commandToRun, actionName, isStartLog = false) {
    const currentDate = new Date(); // 每次调用时更新时间
    const formattedDate = currentDate.toLocaleDateString();
    const formattedTime = currentDate.toLocaleTimeString();

    exec(commandToRun, function (err, stdout, stderr) {
        const timestamp = ${formattedDate} ${formattedTime};
        if (err) {
            const errorMsg = ${timestamp} ${actionName} 执行错误: ${err.message};
            logMessage(errorMsg);
            return;
        }
        if (stderr) {
            const stderrMsg = ${timestamp} ${actionName} 标准错误输出: ${stderr};
            logMessage(stderrMsg);
        }
        const successMsg = ${timestamp} ${actionName} 执行成功:\n${stdout};
        logMessage(successMsg);

        // 如果是 start.sh 命令，将日志保存为 latestStartLog
        if (isStartLog) {
            latestStartLog = successMsg;
        }
    });
}

// 执行 start.sh 的 shell 命令函数
function runShellCommand() {
    const commandToRun = "cd ~/serv00-play/singbox/ && bash start.sh";
    executeCommand(commandToRun, "start.sh", true); // 标记为来自 start.sh 的日志
}

// KeepAlive 函数，用于运行 keepalive.sh
function KeepAlive() {
    const commandToRun = "cd ~/serv00-play/ && bash keepalive.sh";
    executeCommand(commandToRun, "keepalive.sh");
}

// 每 20 秒自动运行一次 keepalive.sh
setInterval(KeepAlive, 20000); // 20000ms = 20秒

// API 端点 /info，用于同时执行 start.sh 和 keepalive.sh
app.get("/info", function (req, res) {
    runShellCommand(); // 直接调用 bash start.sh
    KeepAlive();       // 直接调用 bash keepalive.sh
    res.type("html").send("<pre> Singbox 和 KeepAlive 已成功复活！</pre>");
});

// API 端点 /node_info，用于显示 start.sh 的日志
app.get("/node_info", function (req, res) {
    // 显示最近一次 start.sh 的日志
    res.type("html").send("<pre>" + latestStartLog + "</pre>");
});

// API 端点 /keepalive，用于显示所有日志
app.get("/keepalive", function (req, res) {
    res.type("html").send("<pre>" + logs.join("\n") + "</pre>");
});

// 404 处理
app.use((req, res, next) => {
    if (req.path === '/info'  req.path === '/node_info'  req.path === '/keepalive') {
        return next();
    }
    res.status(404).send('页面未找到');
});

// 启动服务器
app.listen(3000, () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    const formattedTime = currentDate.toLocaleTimeString();
    const startMsg = ${formattedDate} ${formattedTime} 服务器已启动，监听端口 3000;
    logMessage(startMsg);
});
