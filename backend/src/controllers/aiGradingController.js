const { Submission, Assignment, User } = require('../models');
const fetch = require('node-fetch');

// Coze API 配置
const COZE_API_URL = 'https://api.coze.cn/v3/chat';
const COZE_API_TOKEN = 'pat_mbYxFHt5rsdAhzu4OzSMzQ4K6jyStyUdNFlVkJHKbj7r9B0Gmp1N98zGSk6W3wUt';
const COZE_BOT_ID = '7559774554567000110';

/**
 * 启动 AI 批改任务（异步）
 * POST /api/ai-grading/start/:submissionId
 */
async function startAIGrading(req, res) {
  try {
    const { submissionId } = req.params;

    // 查找提交记录
    const submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          attributes: ['id', 'title', 'subject', 'teacher_id']
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        code: 404,
        message: '提交记录不存在'
      });
    }

    // 权限检查 - 只有教师才能批改
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权批改作业'
      });
    }

    // 检查是否已经在批改中
    if (submission.ai_grading_status === 'pending' || submission.ai_grading_status === 'processing') {
      return res.status(400).json({
        code: 400,
        message: 'AI批改正在进行中，请勿重复提交'
      });
    }

    // 检查是否有附件
    if (!submission.attachments || submission.attachments.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '该学生未上传作业附件'
      });
    }

    // 更新状态为等待批改
    submission.ai_grading_status = 'pending';
    submission.ai_error_message = null;
    await submission.save();

    // 立即返回，不等待批改完成
    res.json({
      code: 200,
      message: 'AI批改任务已启动',
      data: {
        submissionId: submission.id,
        status: 'pending'
      }
    });

    // 在后台异步执行批改
    processAIGrading(submission.id).catch(error => {
      console.error('AI批改异步处理失败:', error);
    });

  } catch (error) {
    console.error('启动AI批改失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 异步处理 AI 批改
 * @param {number} submissionId 提交ID
 */
async function processAIGrading(submissionId) {
  let submission = null;

  try {
    console.log(`开始处理 AI 批改，提交ID: ${submissionId}`);

    // 获取提交记录
    submission = await Submission.findByPk(submissionId);
    if (!submission) {
      throw new Error('提交记录不存在');
    }

    // 更新状态为批改中
    submission.ai_grading_status = 'processing';
    await submission.save();

    // 获取第一个附件URL（假设是图片）
    const attachments = submission.attachments || [];
    const imageUrl = Array.isArray(attachments) ? attachments[0] : attachments;
    
    if (!imageUrl) {
      throw new Error('未找到作业附件');
    }

    console.log(`开始调用 Coze API 批改，图片URL: ${imageUrl}`);

    // 调用 Coze API 创建聊天任务
    const requestBody = {
      bot_id: COZE_BOT_ID,
      user_id: `submission_${submissionId}`,
      stream: false,
      auto_save_history: true,
      additional_messages: [
        {
          role: 'user',
          content: JSON.stringify([
            {
              type: 'image',
              file_url: imageUrl
            }
          ]),
          content_type: 'object_string'
        }
      ]
    };

    console.log(`调用 Coze API: ${COZE_API_URL}`);
    
    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      timeout: 30000  // 30秒超时
    }).catch(err => {
      console.error('网络请求失败:', err);
      throw new Error(`网络连接失败: ${err.message}。请检查网络连接或稍后重试。`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Coze API 请求失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Coze API 响应:', JSON.stringify(result).substring(0, 1000));

    // 检查是否有错误
    if (result.code !== 0) {
      throw new Error(`Coze API 返回错误: ${result.msg || '未知错误'}`);
    }

    // 获取批改结果
    // 非流式调用时，响应中直接包含 messages
    let aiComment = '';
    
    if (result.data && result.data.messages) {
      // 查找 assistant 的回复
      const messages = result.data.messages;
      console.log(`收到 ${messages.length} 条消息`);
      
      for (const msg of messages) {
        console.log(`消息类型: ${msg.role} / ${msg.type}`);
        
        if (msg.role === 'assistant' && msg.type === 'answer') {
          // 提取内容
          if (typeof msg.content === 'string') {
            aiComment += msg.content;
          } else if (Array.isArray(msg.content)) {
            // content 是数组格式
            for (const item of msg.content) {
              if (item.type === 'text' && item.text) {
                aiComment += item.text;
              }
            }
          }
        }
      }
    }

    if (!aiComment || aiComment.trim().length === 0) {
      // 如果非流式调用没有立即返回结果，可能需要轮询
      const conversationId = result.data?.conversation_id;
      const chatId = result.data?.id;
      
      if (conversationId && chatId) {
        console.log(`未在响应中找到批改内容，开始轮询... conversation_id: ${conversationId}`);
        aiComment = await pollCozeResult(conversationId, chatId, submissionId);
      } else {
        throw new Error('AI 返回的批改内容为空');
      }
    } else {
      console.log(`✅ 直接从响应中获取到批改内容，长度: ${aiComment.length}`);
    }

    if (!aiComment) {
      throw new Error('AI 返回的批改内容为空');
    }

    // 清理和格式化文本
    const cleanedComment = cleanAndFormatText(aiComment);

    console.log(`AI批改完成，内容长度: ${cleanedComment.length}`);

    // 更新提交记录
    submission.ai_grading_status = 'completed';
    submission.ai_comment = cleanedComment;
    submission.ai_graded_at = new Date();
    submission.ai_error_message = null;
    await submission.save();

    console.log(`AI批改成功完成，提交ID: ${submissionId}`);

  } catch (error) {
    console.error('AI批改处理失败:', error);

    // 更新错误状态
    if (submission) {
      submission.ai_grading_status = 'failed';
      submission.ai_error_message = error.message;
      await submission.save();
    }
  }
}

/**
 * 轮询获取 Coze API 的批改结果
 * @param {string} conversationId 会话ID
 * @param {string} chatId 聊天ID
 * @param {number} submissionId 提交ID
 * @returns {Promise<string>} AI 批改内容
 */
async function pollCozeResult(conversationId, chatId, submissionId) {
  const MAX_ATTEMPTS = 40; // 最多轮询 40 次
  const POLL_INTERVAL = 3000; // 每 3 秒轮询一次
  const RETRIEVE_API_URL = `https://api.coze.cn/v3/chat/retrieve?conversation_id=${conversationId}&chat_id=${chatId}`;

  console.log(`开始轮询 Coze 结果，conversation_id: ${conversationId}, chat_id: ${chatId}`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // 等待一段时间再查询
      if (attempt > 1) {
        await sleep(POLL_INTERVAL);
      }

      console.log(`轮询第 ${attempt} 次，查询 URL: ${RETRIEVE_API_URL}`);

      // 使用 Retrieve Chat API 查询聊天结果
      const response = await fetch(RETRIEVE_API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${COZE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000  // 10秒超时
      }).catch(err => {
        console.error(`网络请求失败 (attempt ${attempt}):`, err.message);
        // 网络错误时继续轮询
        return null;
      });

      if (!response) {
        console.log(`第 ${attempt} 次轮询网络失败，继续等待...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`查询聊天失败: ${response.status} ${errorText}`);
        continue;
      }

      const result = await response.json();
      console.log(`轮询响应 (attempt ${attempt}):`, JSON.stringify(result).substring(0, 500));

      if (result.code !== 0) {
        console.error(`查询聊天返回错误: ${result.msg}`);
        continue;
      }

      // 检查聊天状态
      const status = result.data?.status;
      console.log(`聊天状态: ${status}`);

      if (status === 'completed') {
        // 聊天已完成，需要调用 Message List API 获取消息内容
        console.log(`聊天已完成，正在获取消息内容...`);
        
        try {
          // 根据 Coze API 文档，使用正确的消息列表 API
          const messagesApiUrl = `https://api.coze.cn/v3/chat/message/list?conversation_id=${conversationId}&chat_id=${chatId}`;
          console.log(`调用消息列表 API: ${messagesApiUrl}`);
          
          const messagesResponse = await fetch(messagesApiUrl, {
            method: 'GET',  // 使用 GET 方法
            headers: {
              'Authorization': `Bearer ${COZE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000
          }).catch(err => {
            console.error(`获取消息网络请求失败:`, err.message);
            throw err;
          });

          if (!messagesResponse.ok) {
            const errorText = await messagesResponse.text();
            console.error(`获取消息列表失败: ${messagesResponse.status} ${errorText}`);
            continue;
          }

          const messagesResult = await messagesResponse.json();
          console.log(`获取到消息响应:`, JSON.stringify(messagesResult).substring(0, 800));

          if (messagesResult.code !== 0) {
            console.error(`获取消息返回错误: ${messagesResult.msg}`);
            continue;
          }

          // 提取消息内容
          const messages = messagesResult.data || [];
          console.log(`共收到 ${messages.length} 条消息`);
          
          let content = '';
          
          for (const msg of messages) {
            console.log(`消息: role=${msg.role}, type=${msg.type}, content_type=${typeof msg.content}`);
            
            if (msg.role === 'assistant' && msg.type === 'answer') {
              // 提取内容 - 支持多种格式
              if (typeof msg.content === 'string') {
                console.log(`提取字符串内容，长度: ${msg.content.length}`);
                content += msg.content;
              } else if (typeof msg.content === 'object' && msg.content !== null) {
                // content 可能是对象或数组
                const contentObj = msg.content;
                
                // 如果是数组格式
                if (Array.isArray(contentObj)) {
                  for (const item of contentObj) {
                    if (item.type === 'text' && item.text) {
                      console.log(`提取数组文本项，长度: ${item.text.length}`);
                      content += item.text;
                    }
                  }
                }
                // 如果是对象格式且有 text 字段
                else if (contentObj.text) {
                  console.log(`提取对象文本，长度: ${contentObj.text.length}`);
                  content += contentObj.text;
                }
              }
            }
          }

          if (content && content.trim().length > 0) {
            console.log(`✅ 成功提取 AI 批改内容，总长度: ${content.length}`);
            return content;
          } else {
            console.log(`⚠️ 未找到有效的 assistant 消息内容，继续轮询...`);
            // 如果没有找到内容，可能还在生成中，继续等待
            continue;
          }
        } catch (msgError) {
          console.error(`获取消息时出错:`, msgError.message);
          continue;
        }
      } else if (status === 'failed') {
        const errorMsg = result.data?.last_error?.msg || '未知错误';
        throw new Error(`AI 批改失败: ${errorMsg}`);
      } else if (status === 'in_progress' || status === 'created') {
        console.log(`聊天状态: ${status}，继续等待...`);
      } else {
        console.log(`未知聊天状态: ${status}`);
      }

    } catch (error) {
      console.error(`轮询过程出错 (第 ${attempt} 次):`, error.message);
      
      // 如果已经接近最大尝试次数，抛出错误
      if (attempt >= MAX_ATTEMPTS - 3) {
        throw error;
      }
    }
  }

  // 超时未获取到结果
  throw new Error(`AI 批改超时：已轮询 ${MAX_ATTEMPTS} 次仍未获取到结果`);
}

/**
 * 延迟函数
 * @param {number} ms 毫秒数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清理和格式化 AI 返回的文本
 */
function cleanAndFormatText(text) {
  let cleaned = text;
  
  // 移除 JSON 格式的数据
  cleaned = cleaned.replace(/\{(?:[^{}]|\{[^{}]*\})*\}/g, (match) => {
    if (
      match.includes('"msg_type"') || 
      match.includes('"from_module"') ||
      match.includes('"plugin') || 
      match.includes('"tool') ||
      match.includes('"finish_reason"')
    ) {
      return '';
    }
    return match;
  });
  
  // 移除残留的JSON片段
  cleaned = cleaned.replace(/^[,\s]*["\{].*?["\}][,\s]*/gm, '');
  cleaned = cleaned.replace(/","from_module"[^}]*$/g, '');
  
  // 去除重复内容
  if (cleaned.length > 300) {
    const paragraphs = cleaned.split(/\n{2,}/);
    const uniqueParagraphs = [];
    const seenContent = new Set();
    
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      
      const key = trimmed.substring(0, 150);
      if (seenContent.has(key)) continue;
      
      seenContent.add(key);
      uniqueParagraphs.push(trimmed);
    }
    
    cleaned = uniqueParagraphs.join('\n\n');
  }
  
  // 清理多余的空行
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * 获取 AI 批改状态
 * GET /api/ai-grading/status/:submissionId
 */
async function getAIGradingStatus(req, res) {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId, {
      attributes: ['id', 'ai_grading_status', 'ai_comment', 'ai_graded_at', 'ai_error_message']
    });

    if (!submission) {
      return res.status(404).json({
        code: 404,
        message: '提交记录不存在'
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        submissionId: submission.id,
        status: submission.ai_grading_status,
        comment: submission.ai_comment,
        gradedAt: submission.ai_graded_at,
        errorMessage: submission.ai_error_message
      }
    });

  } catch (error) {
    console.error('获取AI批改状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 采纳 AI 批改结果（提交为正式批改）
 * POST /api/ai-grading/accept/:submissionId
 */
async function acceptAIGrading(req, res) {
  try {
    const { submissionId } = req.params;
    const { score } = req.body;

    if (!score || score < 0 || score > 100) {
      return res.status(400).json({
        code: 400,
        message: '请输入有效的分数（0-100）'
      });
    }

    const submission = await Submission.findByPk(submissionId);

    if (!submission) {
      return res.status(404).json({
        code: 404,
        message: '提交记录不存在'
      });
    }

    // 检查 AI 批改是否完成
    if (submission.ai_grading_status !== 'completed') {
      return res.status(400).json({
        code: 400,
        message: 'AI批改未完成，无法采纳'
      });
    }

    // 权限检查
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权批改作业'
      });
    }

    // 将 AI 批改结果设为正式批改
    submission.status = 'graded';
    submission.score = score;
    submission.comment = submission.ai_comment;  // 使用AI的评语
    submission.graded_at = new Date();
    submission.graded_by = req.user.id;
    await submission.save();

    res.json({
      code: 200,
      message: '批改已提交',
      data: {
        submissionId: submission.id,
        status: 'graded',
        score: submission.score
      }
    });

  } catch (error) {
    console.error('采纳AI批改失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 重新进行 AI 批改
 * POST /api/ai-grading/retry/:submissionId
 */
async function retryAIGrading(req, res) {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId);

    if (!submission) {
      return res.status(404).json({
        code: 404,
        message: '提交记录不存在'
      });
    }

    // 权限检查
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权批改作业'
      });
    }

    // 重置 AI 批改状态
    submission.ai_grading_status = 'pending';
    submission.ai_comment = null;
    submission.ai_graded_at = null;
    submission.ai_error_message = null;
    await submission.save();

    res.json({
      code: 200,
      message: 'AI批改任务已重新启动',
      data: {
        submissionId: submission.id,
        status: 'pending'
      }
    });

    // 在后台异步执行批改
    processAIGrading(submission.id).catch(error => {
      console.error('AI批改异步处理失败:', error);
    });

  } catch (error) {
    console.error('重新AI批改失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

/**
 * 取消 AI 批改
 * POST /api/ai-grading/cancel/:submissionId
 */
async function cancelAIGrading(req, res) {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId);

    if (!submission) {
      return res.status(404).json({
        code: 404,
        message: '提交记录不存在'
      });
    }

    // 权限检查
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权操作'
      });
    }

    // 只能取消正在进行中的批改
    if (submission.ai_grading_status !== 'pending' && submission.ai_grading_status !== 'processing') {
      return res.status(400).json({
        code: 400,
        message: 'AI批改未在进行中，无法取消'
      });
    }

    // 重置 AI 批改状态为 none
    submission.ai_grading_status = 'none';
    submission.ai_comment = null;
    submission.ai_graded_at = null;
    submission.ai_error_message = '批改已被取消';
    await submission.save();

    console.log(`AI批改已取消，提交ID: ${submissionId}`);

    res.json({
      code: 200,
      message: 'AI批改已取消',
      data: {
        submissionId: submission.id,
        status: 'none'
      }
    });

  } catch (error) {
    console.error('取消AI批改失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}

module.exports = {
  startAIGrading,
  getAIGradingStatus,
  acceptAIGrading,
  retryAIGrading,
  cancelAIGrading
};

