export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const user = env.USER_SERV00;
    const kvKey = `status:${user}`;
    const historyKey = `history:${user}`;
    const targetUrl = `https://${user}.serv00.net/login`;

    if (url.pathname === "/status") {
      return await getStatus(kvKey, env);
    }

    if (url.pathname === "/history") {
      return await getHistory(historyKey, env);
    }

    if (url.pathname === "/force-check") {
      return await checkLoginStatus(targetUrl, kvKey, historyKey, env, true);
    }

    return await checkLoginStatus(targetUrl, kvKey, historyKey, env, false);
  }
};

// 状态码映射
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

// 获取当前状态
async function getStatus(kvKey, env) {
  const statusCode = await env.LOGIN_STATUS.get(kvKey);
  const message = statusMessages[statusCode] || "未知状态";
  return new Response(`当前状态: ${user} - ${message}`);
}

// 获取最近 N 次历史记录
async function getHistory(historyKey, env) {
  const history = await env.LOGIN_STATUS.get(historyKey);
  return new Response(history || "无历史记录");
}

// 检测 `login` 页面状态
async function checkLoginStatus(targetUrl, kvKey, historyKey, env, force) {
  try {
    const response = await fetch(targetUrl);
    const statusCode = response.status;
    const statusMessage = statusMessages[statusCode] || `未知状态 (${statusCode})`;

    const previousStatus = await env.LOGIN_STATUS.get(kvKey);
    console.log(`[${new Date().toISOString()}] ${user} -  (${statusMessage}) (之前: ${previousStatus || '无'})`);

    // 记录历史状态
    await updateHistory(historyKey, statusCode, env);

    if (force || previousStatus !== String(statusCode)) {
      await sendTelegramAlert(targetUrl, statusCode, statusMessage, env);
      await env.LOGIN_STATUS.put(kvKey, String(statusCode));  
    }

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
  const message = `⚠️ 状态变化\n账号: ${user}\n新状态: ${statusCode} - ${statusMessage}`;

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