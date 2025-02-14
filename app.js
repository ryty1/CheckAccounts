const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// 解析JSON请求体
app.use(express.json());

app.post('/modify-script', (req, res) => {
  const { userSwitch, vmessPrefix, hy2Prefix } = req.body;

  // 获取脚本路径
  const scriptPath = '/home/user/serv00-play/singbox/start.sh'; // 需要根据实际情况调整

  // 读取脚本内容
  fs.readFile(scriptPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: '读取脚本失败' });
    }

    let modifiedData = data;

    // 修改用户名部分
    if (userSwitch) {
      modifiedData = modifiedData.replace(/user="\$\(whoami\)"/, 'user="$(whoami | cut -c $(($(whoami | wc -m) - 1))-)"');
    } else {
      modifiedData = modifiedData.replace(/user="\$\(whoami\) \| cut -c \$(\$\((whoami \| wc -m) - 1\))-"$/, 'user="$(whoami)"');
    }

    // 修改 vmessname 前缀
    if (vmessPrefix) {
      modifiedData = modifiedData.replace(/vmessname="Argo-vmess-(.*)"/, `vmessname="${vmessPrefix}-$1"`);
    }

    // 修改 hy2name 前缀
    if (hy2Prefix) {
      modifiedData = modifiedData.replace(/hy2name="Hy2-(.*)"/, `hy2name="${hy2Prefix}-$1"`);
    }

    // 将修改后的内容写回脚本
    fs.writeFile(scriptPath, modifiedData, 'utf8', (err) => {
      if (err) {
        return res.status(500).json({ message: '保存脚本失败' });
      }
      res.json({ message: '脚本修改成功' });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});