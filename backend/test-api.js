const axios = require('axios');
require('dotenv').config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function testDeepSeekAPI() {
  console.log('测试DeepSeek API连接...');
  console.log('API URL:', DEEPSEEK_API_URL);
  console.log('API Key前6位:', DEEPSEEK_API_KEY.substring(0, 6) + '...');
  
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位助手' },
          { role: 'user', content: '你好，请简单介绍一下自己' }
        ],
        temperature: 0.7,
        max_tokens: 100
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    console.log('API响应状态:', response.status);
    console.log('API响应内容:', response.data);
    console.log('Message对象结构:', JSON.stringify(response.data.choices[0].message, null, 2));
    console.log('测试成功!');
  } catch (error) {
    console.error('API调用失败:', error.message);
    console.error('详细错误:', error.response?.data || '无详细信息');
  }
}

testDeepSeekAPI();
