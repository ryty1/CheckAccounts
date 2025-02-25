export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // 解析请求 URL，获取 user 参数
  const url = new URL(request.url);
  const user = url.searchParams.get("user"); // 从 URL 参数获取 user

  if (!user) {
    return jsonResponse("error", "缺少账号参数", 400);
  }

  const targetUrl = `https://${user}.serv00.net`;

  try {
    // 设置 fetch 请求，手动处理重定向
    const response = await fetch(targetUrl, { 
      method: "HEAD", 
      redirect: "manual" // 阻止自动重定向
    });

    const statusCode = response.status; // 获取状态码

    // 如果状态码是 301 或 308，返回 "账号未注册"
    if (statusCode === 301 || statusCode === 308) {
      return jsonResponse("error", "账号未注册", statusCode);
    }

    // 根据状态码返回相应的消息
    return handleStatusCode(statusCode);
  } catch (error) {
    return jsonResponse("error", "请求失败或域名不存在", 500);
  }
};

// 统一格式的 JSON 响应
function jsonResponse(status, message, httpStatus) {
  return new Response(
    JSON.stringify({ status, message }), 
    { 
      status: httpStatus,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    }
  );
}

// 处理状态码并返回相应的消息
function handleStatusCode(statusCode) {
  if (statusCode >= 200 && statusCode <= 299) {
    return jsonResponse("success", "账号正常", 200);
  } else if ((statusCode >= 300 && statusCode <= 399) && statusCode !== 301 && statusCode !== 308) {
    return jsonResponse("success", "账号正常", statusCode);
  } else if (statusCode === 403) {
    return jsonResponse("error", "账号已封禁", 403);
  } else if (statusCode >= 400 && statusCode <= 499) {
    // 400-499 其中除了 403 之外都是账号正常
    return jsonResponse("success", "账号正常", statusCode);
  } else if (statusCode >= 500 && statusCode <= 501) {
    return jsonResponse("error", "服务器错误", statusCode);
  } else if (statusCode === 502) {
    return jsonResponse("error", "网关错误", statusCode);
  } else if (statusCode === 503) {
    return jsonResponse("error", "服务器错误", statusCode);
  } else if (statusCode === 504) {
    return jsonResponse("error", "网关超时", statusCode);
  } else {
    return jsonResponse("error", "未知状态", statusCode);
  }
}