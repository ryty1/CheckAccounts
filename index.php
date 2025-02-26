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
            line-height: 1.5;
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

        textarea {
            width: 95%;
            height: 150px;
            font-size: 16px;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            resize: vertical;
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

        #loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }

        /* 不同状态的颜色 */
        .status-normal { color: #007700; }
        .status-banned { color: #cc0000; }
        .status-error { color: #856404; }
        .status-unregistered { color: #666666; }
        .status-unavailable { color: #b34d00; }
        .status-timeout { color: #721c24; }
        .status-unknown { color: #333333; }

        /* 保证输出内容对齐 */
        pre {
            width: 100%;
            max-width: 600px;
            word-wrap: break-word;
            white-space: pre-wrap;
        }

        .output-line {
            display: flex;
            justify-content: space-between;
        }

        .output-line span {
            padding-right: 10px;
        }

        /* 强制只改变状态部分的颜色，账号和冒号保持默认颜色 */
        .output-line .account {
            color: inherit; /* 确保账号部分颜色不变 */
        }

        .output-line .status {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>账号检测</h1>
    <form id="accountForm">
        <textarea id="accounts" name="accounts" placeholder="请输入账号，多个账号每行一个"></textarea><br>
        <button type="submit">开始检测</button>
    </form>

    <div id="loading" style="display: none;">正在检测，请稍候...</div>
    <pre id="result" style="display: none;"></pre>

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
            const invalidAccountLines = [];

            // 对每个账号进行格式验证
            accounts.forEach((account, index) => {
                if (/^[A-Za-z0-9]+$/.test(account)) {
                    validAccounts.push(account);
                } else {
                    invalidAccounts.push(account);
                    invalidAccountLines.push(index + 1);  // 记录无效账号的行号
                }
            });

            // 如果没有有效的账号
            if (validAccounts.length === 0) {
                alert('请输入有效的账号');
                return;
            }

            // 如果有无效账号
            if (invalidAccounts.length > 0) {
                alert('以下账号格式无效 (行号):\n' + invalidAccountLines.join(', '));
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
                resultDiv.innerHTML = formatResults(data);
                resultDiv.style.display = 'block';
            })
            .catch(error => {
                document.getElementById('loading').style.display = 'none';
                alert('请求失败，请稍后再试');
            });
        });

        function formatResults(data) {
            const statusMessages = {
                "账号正常": "status-normal",
                "账号封禁": "status-banned",
                "服务器错误": "status-error",
                "账号未注册": "status-unregistered",
                "VPS不可用": "status-unavailable",
                "网关超时": "status-timeout",
                "未知状态": "status-unknown"
            };

            return data.split('\n').map(line => {
                const [account, status] = line.split(':');
                const statusClass = statusMessages[status.trim()] || 'status-unknown';
                return `<div class="output-line"><span class="account">${account}:</span><span class="status ${statusClass}">${status.trim()}</span></div>`;
            }).join('');
        }
    </script>
</body>
</html>