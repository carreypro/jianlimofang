const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 提供静态文件（前端页面）
app.use(express.static(path.join(__dirname, '../frontend')));

// 添加根路由处理程序 - 现在将重定向到前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 添加根路由处理程序
// app.get('/', (req, res) => {
//   res.send('简历优化API服务器正在运行');
// });

const PORT = process.env.PORT || 5001;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 简历优化的提示词
const generatePrompt = (resumeText) => {
  const promptParts = [
    '你是一位专业的简历优化顾问，拥有丰富的人力资源和招聘经验，精通中国职场文化和各行业简历标准。你擅长分析简历内容、结构和表达方式，并能针对性地提供改进建议，使简历更具竞争力。：',
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
    '- 输出纯文本格式，便于直接复制使用'
  ];
  
  return promptParts.join('\n');
};

app.post('/api/optimize', async (req, res) => {
  try {
    console.log('收到优化请求');
    const { resumeText } = req.body;
    
    if (!resumeText) {
      console.log('简历文本为空');
      return res.status(400).json({ error: '简历文本不能为空' });
    }
    
    console.log('简历文本长度:', resumeText.length);
    console.log('调用DeepSeek API...');
    console.log('API URL:', DEEPSEEK_API_URL);
    console.log('API Key前6位:', DEEPSEEK_API_KEY.substring(0, 6) + '...');
    
    // 调用DeepSeek API
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: generatePrompt('') // 将完整提示词模板作为系统消息
          },
          { role: 'user', content: resumeText } // 用户消息仅包含简历文本
        ],
        temperature: 0.3,  // 降低随机性
        max_tokens: 4000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + DEEPSEEK_API_KEY
        }
      }
    );

    console.log('API响应状态:', response.status);
    
    // 提取优化后的简历内容
    if (response.data?.choices?.[0]?.message?.content) {
      const optimizedResume = response.data.choices[0].message.content;
      return res.json({ optimizedResume });
    }
    
    throw new Error('API响应格式不符合预期');
    
  } catch (error) {
    console.error('简历优化失败:', error.message);
    console.error('详细错误:', error.response?.data || '无详细信息');
    res.status(500).json({
      error: '简历优化失败，请稍后再试',
      details: error.message
    });
  }
});

const server = app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
  console.log('API Key是否存在: ' + (!!DEEPSEEK_API_KEY));
  console.log('服务器已成功启动');
});

// 处理服务器错误
server.on('error', (error) => {
  console.error('服务器错误:', error);
  if (error.code === 'EADDRINUSE') {
    console.error('端口 ' + PORT + ' 已被占用，请尝试使用不同的端口');
  }
});
