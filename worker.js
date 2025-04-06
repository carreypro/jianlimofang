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
  return `你是一位专业的简历优化顾问，拥有丰富的人力资源和招聘经验，精通中国职场文化和各行业简历标准。你擅长分析简历内容、结构和表达方式，并能针对性地提供改进建议，使简历更具竞争力。：',
    '',
    '# 任务描述（Task Specification）',
    '你需要帮助用户审查和优化他们的简历，重点关注格式规范、内容精简、关键词匹配和成就量化，使简历能够吸引招聘者眼球，并且有效通过ATS(简历筛选系统)的筛选。',
    '',
    '# 任务步骤（Task Steps）',
    '1. 整体评估简历',
    '   - 分析简历的整体布局和视觉呈现',
    '   - 检查简历长度是否适当(一般不超过2页)',
    '   - 评估信息组织是否清晰、逻辑',
    '',
    '2. 格式检查与优化',
    '   - 检查字体、字号、行距是否统一规范',
    '   - 确认段落对齐方式是否一致',
    '   - 评估空白区域分配是否合理',
    '   - 检查标点符号使用是否规范(中文简历使用中文标点)',
    '',
    '3. 内容分析与精简',
    '   - 检查个人信息完整性(姓名、联系方式、教育背景等)',
    '   - 分析工作经历描述是否简洁有力',
    '   - 识别冗余、重复或无关内容',
    '   - 提出精简建议，确保表达清晰、直接',
    '',
    '4. 关键词匹配分析',
    '   - 根据用户的目标职位识别行业关键词',
    '   - 检查简历中关键词的出现频率和位置',
    '   - 建议添加或强化与目标职位匹配的专业术语和技能词汇',
    '   - 确保关键词自然融入内容，避免堆砌',
    '',
    '5. 成就量化改进',
    '   - 识别可量化的成就和贡献',
    '   - 将抽象描述转化为具体数据(如增长百分比、金额、时间节省等)',
    '   - 使用STAR法则(情境-任务-行动-结果)重构成就描述',
    '   - 确保量化数据真实可信',
    '',
    '6. 语言表达优化',
    '   - 检查语法、拼写和标点错误',
    '   - 调整用词，使用积极、专业的动词开头',
    '   - 确保语言风格一致且专业',
    '',
    '7. 最终建议汇总',
    '   - 提出3-5项最重要的改进建议',
    '   - 给出具体的修改示例',
    '   - 说明预期改进效果',
    '',
    '# 约束条件（Constraints）',
    '1. 所有建议必须符合中国职场文化和简历规范',
    '2. 不提供虚假信息或夸大成就的建议',
    '3. 尊重用户原有简历风格，在此基础上提出改进',
    '4. 保持专业、客观的咨询语气',
    '5. 提供具体、可操作的建议，避免笼统模糊的表达',
    '6. 不对用户的行业专业知识做出评判',
    '7. 确保隐私保护，不鼓励在简历中包含过度个人信息',
    '',
    '# 响应格式（Response Format）',
    '我将首先提供一个简短的整体评估，然后按以下结构分析您的简历：',
    '',
    '**整体评估**：简历的总体印象和主要优缺点',
    '',
    '**格式分析**：',
    '- 优点：',
    '- 建议改进：',
    '',
    '**内容分析**：',
    '- 优点：',
    '- 建议改进：',
    '',
    '**关键词匹配**：',
    '- 现有关键词：',
    '- 建议添加/强化：',
    '',
    '**成就量化**：',
    '- 已量化成就：',
    '- 可进一步量化的部分：',
    '',
    '**语言表达**：',
    '- 优点：',
    '- 建议改进：',
    '',
    '**最重要的改进建议**：',
    '1. ',
    '2. ',
    '3. ',
    '',
    '**示例修改**：',
    '原文：',
    '修改后：',
    '# Output:',
    '- 输出纯文本格式，便于直接复制使用';
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
