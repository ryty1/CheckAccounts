export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const user = url.searchParams.get("user");

  if (!user) {
    return jsonResponse("error", "缺少账号参数", 400);
  }

  const targetUrl = `https://${user}.serv00.net`;

  try {
    const response = await fetch(targetUrl, { 
      method: "HEAD", 
      redirect: "manual" 
    });

    const statusCode = response.status;

    if (statusCode === 301 || statusCode === 308) {
      return jsonResponse("error", "账号未注册", statusCode);
    }

    return handleStatusCode(statusCode);
  } catch (error) {
    return jsonResponse("error", "请求失败或域名不存在", 500);
  }
}

function jsonResponse(status, message, httpStatus) {
  return new Response(
    JSON.stringify({ status, message }), 
    { 
      status: httpStatus,
      headers: { 
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",  // 允许所有域访问
        "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",  // 允许的 HTTP 方法
        "Access-Control-Allow-Headers": "Content-Type"  // 允许的请求头
      }
    }
  );
}

function handleStatusCode(statusCode) {
  if (statusCode >= 200 && statusCode <= 299) {
    return jsonResponse("success", "账号正常", 200);
  } else if ((statusCode >= 300 && statusCode <= 399) && statusCode !== 301 && statusCode !== 308) {
    return jsonResponse("success", "账号正常", statusCode);
  } else if (statusCode === 403) {
    return jsonResponse("error", "账号已封禁", 403);
  } else if (statusCode >= 400 && statusCode <= 499) {
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