<?php

// 检查当前请求是否是根路径
if ($_SERVER['REQUEST_URI'] == '/') {
    // 重定向到 index.html
    header("Location: /index.html", true, 301);
    exit();
}

// 定义状态消息
$statusMessages = [
    200 => "账号正常",
    301 => "账号未注册",
    403 => "账号已封禁",
    404 => "账号正常",
    500 => "服务器错误",
    502 => "网关错误",
    503 => "VPS不可用",
    504 => "网关超时"
];

// 处理请求
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 解析前端提交的数据
    $input = json_decode(file_get_contents('php://input'), true);
    $accounts = $input['accounts'] ?? [];

    if (empty($accounts)) {
        echo "请输入账号";
        exit;
    }

    $results = [];

    foreach ($accounts as $username) {
        $apiUrl = "https://{$username}.serv00.net";
        $ch = curl_init($apiUrl);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // 防止重定向
        curl_setopt($ch, CURLOPT_HEADER, true); // 获取头部信息
        curl_setopt($ch, CURLOPT_NOBODY, true); // 只获取状态码，不返回内容

        curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $statusMessage = $statusMessages[$statusCode] ?? '未知状态';
        $results[] = "{$username}: {$statusMessage}";
    }

    // 以纯文本形式输出，每行一个结果
    echo implode("\n", $results);
}
