<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>账号检测</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: url('php.png') no-repeat center center fixed;
            background-size: cover;
            line-height: 1.6;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        h1 {
            text-align: center;
        }

        form {
            width: 100%;
            max-width: 600px;
        }

        label {
            display: block;
            text-align: left;
            margin-bottom: 10px;
        }

        textarea {
            width: 100%;
            height: 150px;
            font-size: 16px;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            resize: vertical; /* 只允许上下调整 */
        }

        button {
            font-size: 18px;
            padding: 12px 20px;
            cursor: pointer;
            border: none;
            border-radius: 6px;
            background: #007BFF;
            color: white;
            font-weight: bold;
            transition: 0.3s;
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
            display: block;
            margin: 0 auto;
        }

        button:hover {
            background: #0056b3;
        }

        .result {
            margin-top: 20px;
            white-space: pre-wrap;
            word-wrap: break-word;
            padding: 10px;
            border-radius: 5px;
            font-weight: bold;
            max-width: 600px;
            width: 100%;
        }

        /* 不同状态的颜色 */
        .status-normal { background: #e6f7e6; color: #007700; } /* 账号正常 */
        .status-banned { background: #ffe6e6; color: #cc0000; } /* 账号封禁 */
        .status-error { background: #fff3cd; color: #856404; }  /* 服务器错误 */
        .status-unregistered { background: #f0f0f0; color: #666666; } /* 账号未注册 */
        .status-unavailable { background: #ffebcd; color: #b34d00; } /* VPS不可用 */
        .status-timeout { background: #f8d7da; color: #721c24; } /* 网关超时 */
        .status-unknown { background: #e0e0e0; color: #333333; } /* 未知状态 */
    </style>
</head>
<body>
    <h1>账号检测</h1>
    <form id="accountForm">
        <label for="accounts">请输入账号，多个账号每行一个</label><br><br>
        <textarea id="accounts" name="accounts"></textarea><br><br>
        <button type="submit">开始检测</button>
    </form>

    <div id="loading" style="display: none; text-align: center;">正在检测，请稍候...</div>
    <div id="result" class="result" style="display: none;"></div>

    <script>
        document.getElementById('accountForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const accountsInput = document.getElementById('accounts').value.trim();
            if (!accountsInput) {
                alert('请输入至少一个账号');
                return;
            }

            const accounts = accountsInput.split('\n').map(account => account.trim());
            const validAccounts = [];
            const invalidAccounts = [];

            // 对每个账号进行格式验证
            accounts.forEach(account => {
                if (/^[A-Za-z0-9]+$/.test(account)) {
                    validAccounts.push(account);
                } else {
                    invalidAccounts.push(account);
                }
            });

            // 如果没有有效的账号
            if (validAccounts.length === 0) {
                alert('请输入有效的账号');
                return;
            }

            // 如果有无效账号
            if (invalidAccounts.length > 0) {
                alert('以下账号格式无效: ' + invalidAccounts.join(', '));
            }

            document.getElementById('loading').style.display = 'block';
            document.getElementById('result').style.display = 'none';

            fetch('/index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accounts: validAccounts })
            })
            .then(response => response.text())  // 返回的是HTML字符串
            .then(data => {
                document.getElementById('loading').style.display = 'none';
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = data;
                resultDiv.style.display = 'block';
            })
            .catch(error => {
                document.getElementById('loading').style.display = 'none';
                alert('请求失败，请稍后再试');
            });
        });
    </script>
</body>
</html>