/**
 * 简历魔方 - Cloudflare Worker API
 * 处理简历优化请求并与DeepSeek API通信
 */

// 环境变量声明
let DEEPSEEK_API_KEY = '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// CORS 头信息
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 处理OPTIONS请求（预检请求）
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * 生成发送给DeepSeek的提示信息
 */
function generatePrompt(resumeText) {
  return `以下是一份简历内容，请对其进行优化，保持原有的信息和结构，但使其更加专业、更有吸引力。优化要点：

1. 使用更强的行动动词和成就导向的语言
2. 突出关键技能和成就
3. 确保语言简洁清晰
4. 保持格式一致
5. 移除冗余信息，保持核心内容
6. 确保使用专业术语，提升专业性
7. 纠正任何语法或拼写错误

原始简历内容：
${resumeText}

请直接返回优化后的完整简历内容，不要添加任何额外解释。`;
}

/**
 * 处理简历优化API请求
 */
async function handleApiRequest(request, env) {
  try {
    // 设置DeepSeek API密钥
    DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;
    
    if (!DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API密钥未设置' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // 解析请求体
    const requestData = await request.json();
    const { resumeText } = requestData;

    if (!resumeText || resumeText.trim() === '') {
      return new Response(
        JSON.stringify({ error: '请提供简历文本' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // 调用DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的简历优化顾问，擅长将普通的简历改写成更专业、更有吸引力的版本，突出申请人的技能和成就。'
          },
          { 
            role: 'user', 
            content: generatePrompt(resumeText) 
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'DeepSeek API调用失败');
    }

    const data = await response.json();
    const optimizedResume = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ optimizedResume }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || '服务器内部错误' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

// 测试端点处理函数
function handleTestRequest() {
  return new Response(
    JSON.stringify({ status: 'ok', message: 'API测试成功' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * 请求处理主入口
 */
export default {
  async fetch(request, env) {
    try {
      // 获取请求URL和方法
      const url = new URL(request.url);
      const method = request.method.toUpperCase();
      
      // 所有请求都添加CORS头
      if (method === 'OPTIONS') {
        return handleOptions();
      }

      // 处理API请求
      if (url.pathname === '/api/optimize') {
        if (method === 'POST') {
          return await handleApiRequest(request, env);
        }
        return new Response('Method Not Allowed', { 
          status: 405,
          headers: corsHeaders
        });
      }

      // 测试端点
      if (url.pathname === '/api/test') {
        return handleTestRequest();
      }

      // 对于其他路径，返回404
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      // 全局错误处理
      return new Response(
        JSON.stringify({ error: '服务器内部错误', details: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  }
};
