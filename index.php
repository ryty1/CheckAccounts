<?php
// 检查当前请求是否是根路径，重定向到 index.html
if ($_SERVER['REQUEST_URI'] == '/') {
    header("Location: /index.html", true, 301);
    exit();
}

// 定义状态消息
$statusMessages = [
    200 => "账号正常",
    301 => "账号未注册",
    302 => "账号正常",
    403 => "账号已封禁",
    404 => "账号正常",
    500 => "服务器错误",
    502 => "网关错误",
    503 => "VPS不可用",
    504 => "网关超时"
];

// 处理 POST 请求
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 获取前端提交的 JSON 数据
    $input = json_decode(file_get_contents('php://input'), true);
    $accounts = $input['accounts'] ?? [];

    if (empty($accounts)) {
        echo json_encode(["error" => "请输入账号"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $results = [];

    foreach ($accounts as $username) {
        $originalUsername = $username; // 保留原始用户名

        // 处理 Punycode 转码（适用于包含中文字符的账号）
        if (preg_match('/[^\x00-\x7F]/', $username)) {
            $punycodeUsername = idn_to_ascii($username, IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46);
            if ($punycodeUsername === false) {
                $results[] = "$originalUsername: 转码失败";
                continue;
            }
            $username = $punycodeUsername;
        }

        // 确保用户名格式正确
        if (!preg_match('/^[A-Za-z0-9-]+$/', $username)) {
            $results[] = "$originalUsername: 账号格式错误";
            continue;
        }

        // 访问账号检测 URL
        $apiUrl = "https://{$username}.serv00.net";
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // 防止重定向
        curl_setopt($ch, CURLOPT_HEADER, true); // 只获取头部信息
        curl_setopt($ch, CURLOPT_NOBODY, true); // 不返回页面内容
        curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // 解析状态码对应的消息
        $statusMessage = $statusMessages[$statusCode] ?? '未知状态';
        $results[] = "$originalUsername: $statusMessage";
    }

    // 返回 JSON 格式的响应
    echo json_encode($results, JSON_UNESCAPED_UNICODE);
}
