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
  }
};

// 状态码映射到中文标识
const statusMessages = {
  200: "保活成功",
  400: "保活失败",
  401: "保活失败",
  403: "账号己封禁",
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

  history.push({ time: new Date().toISOString(), status: statusCode });
  if (history.length > maxHistory) history.shift();

  await env.LOGIN_STATUS.put(historyKey, JSON.stringify(history));
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