require('dotenv').config();
const express = require("express");
const { exec } = require('child_process');
const path = require('path'); // 添加 path 模块
const app = express();
app.use(express.json());

// 存储最多5条日志
let logs = [];
// 存储最近的 start.sh 成功信息
let latestStartLog = "";

// 日志记录函数
function logMessage(message) {
    // 将新的日志加入数组
    logs.push(message);
    // 保持数组最多包含5个元素
    if (logs.length > 5) {
        logs.shift();
    }
}

// 执行通用的 shell 命令函数
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
            const stderrMsg = ${timestamp} ${actionName} 执行标准错误输出: ${stderr};
            logMessage(stderrMsg);
        }
        const successMsg = ${timestamp} ${actionName} 执行成功:\n${stdout};
        logMessage(successMsg);

        // 如果是 start.sh，保存日志到 latestStartLog
        if (isStartLog) {
            latestStartLog = successMsg;
        }
    });
}

// 执行 start.sh 的 shell 命令函数
function runShellCommand() {
    const commandToRun = cd ${process.env.HOME}/serv00-play/singbox/ && bash start.sh;
    executeCommand(commandToRun, "start.sh", true); // 标记为来自 start.sh 的日志
}

// KeepAlive 函数，执行 keepalive.sh
function KeepAlive() {
    const commandToRun = bash ${process.env.HOME}/serv00-play/keepalive.sh;
    executeCommand(commandToRun, "keepalive.sh");
}

// 每隔20秒自动执行 keepalive.sh
setInterval(KeepAlive, 20000); // 20000ms = 20秒

// API endpoint /info 执行 start.sh 和 keepalive.sh
app.get("/info", function (req, res) {
    runShellCommand(); // 直接调用 bash start.sh 命令
    KeepAlive();       // 直接调用 bash keepalive.sh 命令
    res.type("html").send("<pre> Serv00 和 KeepAlive 已复活成功！</pre>");
});

// API endpoint /node_info 显示 start.sh 的日志
app.get("/node_info", function (req, res) {
    // 显示最近的 start.sh 执行日志
    res.type("html").send("<pre>" + latestStartLog + "</pre>");
});

// API endpoint /keepalive 显示所有日志
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
