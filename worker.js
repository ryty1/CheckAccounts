export default {
  // 定义 Cron Triggers 的事件处理程序
  async scheduled(event, env, ctx) {
    // 每次 Cron 触发时执行的代码
    const user = env.USER_SERV00;
    const kvKey = `status:${user}`;
    const historyKey = `history:${user}`;
    const targetUrl = `https://${user}.serv00.net/login`;

    console.log(`[${new Date().toISOString()}] 定时任务触发，检查状态：${targetUrl}`);

    // 调用检查登录状态的函数
    await checkLoginStatus(targetUrl, kvKey, historyKey, env);
  },

  // 请求处理
  async fetch(request, env) {
    if (request.url.includes('/history')) {
      return getHistory(env); // 返回历史记录
    } else {
      return new Response(htmlPage(), {
        headers: { "Content-Type": "text/html" },
      });
    }
  }
};

// 状态码映射到中文标识
const statusMessages = {
  200: "保活成功",
  400: "保活失败",
  401: "保活失败",
  403: "账号已封禁",
  404: "未安装账号服务",
  500: "保活失败",
  502: "保活失败",
  503: "保活失败",
  504: "保活失败"
};

// 检查登录页面状态并记录
async function checkLoginStatus(targetUrl, kvKey, historyKey, env) {
  try {
    // 访问目标 URL
    const response = await fetch(targetUrl);
    const statusCode = response.status;
    const statusMessage = statusMessages[statusCode] || `未知状态 (${statusCode})`;

    // 获取上次的状态码
    const previousStatus = await env.LOGIN_STATUS.get(kvKey);
    console.log(`[${new Date().toISOString()}] ${targetUrl} - 状态码: ${statusCode} (${statusMessage}) (之前: ${previousStatus || '无'})`);

    // 记录历史状态
    await updateHistory(historyKey, statusCode, env);

    // 如果状态码不是 200，则发送 Telegram 通知
    if (statusCode !== 200) {
      await sendTelegramAlert(targetUrl, statusCode, statusMessage, env);
    }

    // 更新当前状态码
    await env.LOGIN_STATUS.put(kvKey, String(statusCode));

    return new Response(`检测完成: ${targetUrl} - 状态码: ${statusCode} - ${statusMessage}`, { status: statusCode });
  } catch (error) {
    console.error("访问失败:", error);
    await sendTelegramAlert(targetUrl, "请求失败", "无法访问", env);
    return new Response("请求失败", { status: 500 });
  }
}

// 更新历史状态
async function updateHistory(historyKey, statusCode, env) {
  const maxHistory = 10;
  let history = await env.LOGIN_STATUS.get(historyKey);
  history = history ? JSON.parse(history) : [];

  // 添加新记录
  history.push({ time: new Date().toISOString(), status: statusCode });

  // 保持最多的历史记录数
  if (history.length > maxHistory) history.shift();

  // 更新历史记录到 KV 存储
  await env.LOGIN_STATUS.put(historyKey, JSON.stringify(history));
}

// 获取历史记录
async function getHistory(env) {
  const user = env.USER_SERV00;
  const historyKey = `history:${user}`;

  let history = await env.LOGIN_STATUS.get(historyKey);
  history = history ? JSON.parse(history) : [];

  return new Response(JSON.stringify(history), {
    headers: { "Content-Type": "application/json" },
  });
}

// 发送 Telegram 通知
async function sendTelegramAlert(targetUrl, statusCode, statusMessage, env) {
  const botToken = env.TG_BOT_TOKEN;
  const chatId = env.TG_CHAT_ID;
  const message = `⚠️ 状态变化\nURL: ${targetUrl}\n新状态: ${statusCode} - ${statusMessage}`;

  const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: message,
  };

  try {
    await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Telegram 发送失败:", error);
  }
}

// HTML 页面内容
function htmlPage() {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>状态记录</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }

        h1 {
          text-align: center;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        table, th, td {
          border: 1px solid #ddd;
        }

        th, td {
          padding: 10px;
          text-align: left;
        }

        th {
          background-color: #f2f2f2;
        }

        .loading {
          text-align: center;
          font-size: 18px;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>登录状态历史记录</h1>
        <div id="loading" class="loading">加载中...</div>
        <table id="historyTable">
          <thead>
            <tr>
              <th>时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

      <script>
        async function fetchHistory() {
          const response = await fetch("/history");
          if (response.ok) {
            const history = await response.json();
            const tableBody = document.querySelector("#historyTable tbody");

            // 清空表格
            tableBody.innerHTML = "";

            if (history.length === 0) {
              tableBody.innerHTML = "<tr><td colspan='2'>没有记录</td></tr>";
            } else {
              history.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = "<td>" + new Date(item.time).toLocaleString() + "</td><td>" + getStatusMessage(item.status) + "</td>";
                tableBody.appendChild(row);
              });
            }
            document.getElementById("loading").style.display = "none";
          } else {
            alert("加载历史记录失败");
          }
        }

        function getStatusMessage(statusCode) {
          const statusMessages = {
            200: "保活成功",
            400: "保活失败",
            401: "保活失败",
            403: "账号已封禁",
            404: "未安装账号服务",
            500: "保活失败",
            502: "保活失败",
            503: "保活失败",
            504: "保活失败"
          };
          return statusMessages[statusCode] || `未知状态 (${statusCode})`;
        }

        window.onload = fetchHistory;
      </script>
    </body>
    </html>
  `;
}