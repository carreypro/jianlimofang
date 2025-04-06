/**
 * 简历魔方 - 前端服务器
 * 用于在本地开发环境中提供前端页面访问
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// 启用CORS
app.use(cors());

// 提供静态文件（前端页面）
app.use(express.static(path.join(__dirname, 'frontend')));

// 添加根路由处理程序 - 将所有请求重定向到前端页面
app.get('*', (req, res) => {
  // 如果是API请求，不处理（让它转发到后端API服务器）
  if (req.path.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found on frontend server');
  }
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`前端服务器运行在端口 ${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log('注意: 后端API服务器需要单独启动，运行在端口5001');
});
