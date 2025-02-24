export default async function handler(req, res) {
  try {
    // 获取 URL 参数
    const { user } = req.query;

    if (!user) {
      return res.status(400).json({ status: "error", message: "缺少账号参数" });
    }

    const targetUrl = `https://${user}.serv00.net`;

    // 发送 HEAD 请求
    const response = await fetch(targetUrl, { 
      method: "HEAD", 
      redirect: "manual" // 禁止自动重定向
    });

    const statusCode = response.status; // 获取状态码

    // 处理状态码
    if (statusCode === 301 || statusCode === 308) {
      return res.status(statusCode).json({ status: "error", message: "账号未注册" });
    } else if (statusCode >= 200 && statusCode <= 299) {
      return res.status(200).json({ status: "success", message: "账号正常" });
    } else if ((statusCode >= 300 && statusCode <= 399) && statusCode !== 301 && statusCode !== 308) {
      return res.status(statusCode).json({ status: "success", message: "账号正常" });
    } else if (statusCode === 403) {
      return res.status(403).json({ status: "error", message: "账号已封禁" });
    } else if (statusCode >= 400 && statusCode <= 499) {
      return res.status(statusCode).json({ status: "success", message: "账号正常" });
    } else if (statusCode >= 500 && statusCode <= 501) {
      return res.status(statusCode).json({ status: "error", message: "服务器错误" });
    } else if (statusCode === 502) {
      return res.status(502).json({ status: "error", message: "网关错误" });
    } else if (statusCode === 503) {
      return res.status(503).json({ status: "error", message: "服务器不可用" });
    } else if (statusCode === 504) {
      return res.status(504).json({ status: "error", message: "网关超时" });
    } else {
      return res.status(statusCode).json({ status: "error", message: "未知状态" });
    }
  } catch (error) {
    return res.status(500).json({ status: "error", message: "请求失败或域名不存在" });
  }
}