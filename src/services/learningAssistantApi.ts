// 学习助手 API 服务 - 使用 Coze 智能体
const API_BASE_URL = 'https://api.coze.cn/v3/chat';
const API_TOKEN = 'pat_mbYxFHt5rsdAhzu4OzSMzQ4K6jyStyUdNFlVkJHKbj7r9B0Gmp1N98zGSk6W3wUt';
const BOT_ID = '7559844727307812916';

// 生成或获取固定的用户ID（保持会话上下文的关键）
const getUserId = (): string => {
  let userId = localStorage.getItem('coze_user_id');
  if (!userId) {
    userId = 'student_' + Math.random().toString(36).substring(2, 15) + Date.now();
    localStorage.setItem('coze_user_id', userId);
  }
  return userId;
};

/**
 * 调用学习助手 API - 支持流式输出和会话上下文
 * @param userMessage 用户消息
 * @param onProgress 流式输出回调函数
 * @param conversationId 会话ID（可选，用于保持上下文）
 * @returns Promise<{ response: string, conversationId: string }>
 */
export async function chatWithAssistant(
  userMessage: string,
  onProgress?: (chunk: string) => void,
  conversationId?: string
): Promise<{ response: string; conversationId: string }> {
  try {
    const userId = getUserId(); // 使用固定的用户ID
    
    console.log('📤 开始调用学习助手 API');
    console.log('用户消息:', userMessage);
    console.log('Bot ID:', BOT_ID);
    console.log('User ID:', userId);
    console.log('会话ID:', conversationId || '新会话');
    
    // 构建请求体 - 根据 Coze API v3 文档
    const requestBody: any = {
      bot_id: BOT_ID,
      user_id: userId, // 使用固定的用户ID以保持上下文
      stream: true,
      auto_save_history: true, // 自动保存历史记录
      additional_messages: [
        {
          role: 'user',
          content: userMessage,
          content_type: 'text'
        }
      ]
    };
    
    // 如果有会话ID，添加到请求中以继续之前的对话
    if (conversationId) {
      requestBody.conversation_id = conversationId;
      console.log('📌 使用现有会话，会话ID:', conversationId);
    } else {
      console.log('🆕 创建新会话');
    }
    
    console.log('📤 请求体:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 错误响应:', errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let newConversationId = conversationId || '';

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    console.log('📥 开始接收流式数据...');

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('✅ 流式数据接收完成');
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      console.log('📦 收到数据块:', chunk.substring(0, 200));
      
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.slice(5).trim();
            if (jsonStr === '[DONE]') {
              console.log('✅ 收到 [DONE] 信号');
              continue;
            }
            
            const data = JSON.parse(jsonStr);
            console.log('📄 解析的数据:', JSON.stringify(data).substring(0, 300));
            
            // 提取会话ID - 从多个可能的字段中获取
            // Coze API 可能在不同的事件类型中返回不同字段名的会话ID
            const possibleConversationId = 
              data.conversation_id || 
              data.conversationId || 
              data.id ||
              (data.data && data.data.conversation_id) ||
              (data.data && data.data.conversationId);
            
            if (possibleConversationId) {
              if (!newConversationId || newConversationId !== possibleConversationId) {
                newConversationId = possibleConversationId;
                console.log('💬 获取到会话ID:', newConversationId, '从事件:', data.event || 'unknown');
              }
            }
            
            // 提取内容 - 根据 Coze API v3 流式响应格式
            let content = '';
            
            // 1. conversation.message.delta 事件 - 流式输出的增量内容
            if (data.event === 'conversation.message.delta' && data.message?.content) {
              content = data.message.content;
            }
            // 2. conversation.message.completed 事件 - 完整消息
            else if (data.event === 'conversation.message.completed' && data.message?.content) {
              // 这个事件通常在最后，包含完整内容，但我们已经通过delta收集了，可以跳过
              console.log('✅ 消息完成事件');
            }
            // 3. 其他可能的格式
            else if (data.message?.content) {
              content = data.message.content;
            } else if (data.content) {
              content = data.content;
            } else if (data.delta?.content) {
              content = data.delta.content;
            }
            
            if (content) {
              console.log('💬 提取的内容片段:', content.substring(0, 100));
              fullText += content;
              
              // 调用进度回调 - 实时显示
              if (onProgress) {
                onProgress(content);
              }
            }
          } catch (e) {
            console.warn('⚠️ 解析流式数据失败:', e, '原始行:', line);
          }
        }
      }
    }

    console.log('💬 完整回复:', fullText.substring(0, 200));
    console.log('💬 最终会话ID:', newConversationId);
    
    // 如果没有获取到会话ID，这是个问题
    if (!newConversationId) {
      console.warn('⚠️ 警告：未能从API响应中获取会话ID，上下文可能无法保持');
    } else {
      console.log('✅ 会话ID已确认，后续对话将保持上下文');
    }
    
    // 清理和格式化响应内容
    const cleanedText = cleanResponseText(fullText);
    
    return {
      response: cleanedText || '抱歉，我暂时无法回复。请稍后再试。',
      conversationId: newConversationId
    };
  } catch (error) {
    console.error('❌ 学习助手 API 调用失败:', error);
    throw error;
  }
}

/**
 * 创建新的会话
 * @returns Promise<string> 返回新创建的会话ID
 */
export async function createConversation(): Promise<string> {
  try {
    const userId = getUserId();
    console.log('🆕 创建新会话，User ID:', userId);
    
    const response = await fetch('https://api.coze.cn/v1/conversation/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta_data: {
          user_id: userId,
          bot_id: BOT_ID
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 创建会话失败:', errorText);
      throw new Error(`创建会话失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 会话创建成功:', data);
    
    if (data.data?.id) {
      return data.data.id;
    } else if (data.id) {
      return data.id;
    } else {
      throw new Error('无法从响应中获取会话ID');
    }
  } catch (error) {
    console.error('❌ 创建会话失败:', error);
    throw error;
  }
}

/**
 * 清理响应文本 - 移除重复内容、JSON 元数据、工具调用和思考过程
 */
function cleanResponseText(text: string): string {
  let cleaned = text;
  
  console.log('🔍 原始文本长度:', text.length);
  console.log('🔍 原始文本内容:', text.substring(0, 500));
  
  // 0. 移除所有JSON格式内容（包括工具调用、插件信息、API返回等）
  // 先移除完整的JSON对象（包括嵌套的）
  cleaned = cleaned.replace(/\{(?:[^{}]|\{[^{}]*\})*\}/g, (match) => {
    // 如果JSON包含plugin、tool、api、log_id等关键词，移除
    if (
      match.includes('"plugin') || 
      match.includes('"tool') || 
      match.includes('"api_') || 
      match.includes('"log_id') ||
      match.includes('"code"') ||
      match.includes('"msg"') ||
      match.includes('"data"') ||
      match.includes('"url"') ||
      match.includes('"sitename"')
    ) {
      return '';
    }
    return match;
  });
  
  // 移除残留的JSON片段（以逗号、引号等开头或结尾的不完整片段）
  cleaned = cleaned.replace(/^[,\s]*["\{].*?["\}][,\s]*/gm, '');
  cleaned = cleaned.replace(/^[,:"]\w+[,:"]/gm, '');
  
  // 1. 移除 JSON 元数据标记
  cleaned = cleaned.replace(/\{"msg_type"[^}]*\}/g, '');
  cleaned = cleaned.replace(/\{[^}]*"finish_reason"[^}]*\}/g, '');
  cleaned = cleaned.replace(/\{[^}]*"tool_call"[^}]*\}/g, '');
  cleaned = cleaned.replace(/\{[^}]*"function_call"[^}]*\}/g, '');
  
  // 2. 移除工具调用相关的内容
  cleaned = cleaned.replace(/正在调用.*?工具.*?\n?/gi, '');
  cleaned = cleaned.replace(/调用工具[:：].*?\n?/gi, '');
  cleaned = cleaned.replace(/工具返回[:：].*?\n?/gi, '');
  cleaned = cleaned.replace(/使用工具[:：].*?\n?/gi, '');
  cleaned = cleaned.replace(/Tool call[:：].*?\n?/gi, '');
  cleaned = cleaned.replace(/Function call[:：].*?\n?/gi, '');
  
  // 3. 移除思考过程相关的内容
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/\[思考\][\s\S]*?\[\/思考\]/gi, '');
  cleaned = cleaned.replace(/【思考】[\s\S]*?【\/思考】/gi, '');
  cleaned = cleaned.replace(/```思考[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/^让我.*?思考.*?\n?/gim, '');
  cleaned = cleaned.replace(/^思考中.*?\n?/gim, '');
  cleaned = cleaned.replace(/^分析中.*?\n?/gim, '');
  cleaned = cleaned.replace(/^正在思考.*?\n?/gim, '');
  
  // 4. 移除包含工具调用或API调用的代码块
  cleaned = cleaned.replace(/```json\s*\{[^}]*"tool"[^}]*\}[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```json\s*\{[^}]*"function"[^}]*\}[\s\S]*?```/gi, '');
  
  // 5. 清理多余的空白和换行（在去重之前）
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  // 6. 移除重复的段落和句子（增强版去重 + 相似度检测）
  // 先按段落分割
  const paragraphs = cleaned.split(/\n\n+/);
  const uniqueParagraphs: string[] = [];
  const seenContent = new Set<string>();
  const seenSimilarContent: string[] = [];
  
  // 计算两个字符串的相似度
  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    if (len1 === 0 || len2 === 0) return 0;
    
    const shorter = len1 < len2 ? str1 : str2;
    const longer = len1 < len2 ? str2 : str1;
    
    let matchCount = 0;
    const shortLen = shorter.length;
    
    for (let i = 0; i < shortLen; i += 10) {
      const chunk = shorter.substring(i, Math.min(i + 20, shortLen));
      if (longer.includes(chunk)) {
        matchCount += chunk.length;
      }
    }
    
    return matchCount / shortLen;
  };
  
  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;
    
    // 跳过包含工具调用或思考关键词的段落
    if (
      trimmedPara.includes('tool_') ||
      trimmedPara.includes('function_') ||
      trimmedPara.includes('plugin_') ||
      trimmedPara.includes('api_id') ||
      trimmedPara.includes('log_id') ||
      trimmedPara.includes('sitename') ||
      /^(思考|分析|推理)[:：]/i.test(trimmedPara)
    ) {
      console.log('⚠️ 检测到工具调用或思考过程段落，已跳过');
      continue;
    }
    
    // 使用段落的标准化内容作为去重键
    const normalizedPara = trimmedPara.replace(/\s+/g, ' ');
    const shortKey = normalizedPara.substring(0, 150);
    
    // 1. 完全相同的内容检查
    if (seenContent.has(shortKey)) {
      console.log('⚠️ 检测到完全重复段落，已跳过:', shortKey.substring(0, 50));
      continue;
    }
    
    // 2. 相似度检查
    let isSimilar = false;
    for (const seenPara of seenSimilarContent) {
      const similarity = calculateSimilarity(normalizedPara, seenPara);
      if (similarity > 0.8) { // 80%以上相似度视为重复
        isSimilar = true;
        console.log('⚠️ 检测到高度相似段落（相似度: ' + (similarity * 100).toFixed(1) + '%），已跳过');
        break;
      }
    }
    
    if (isSimilar) {
      continue;
    }
    
    seenContent.add(shortKey);
    seenSimilarContent.push(normalizedPara);
    uniqueParagraphs.push(trimmedPara);
  }
  
  cleaned = uniqueParagraphs.join('\n\n');
  
  // 7. 再次检测并移除相邻重复的大块文本（例如整个章节重复）
  // 按行分割检查
  const lines = cleaned.split('\n');
  const uniqueLines: string[] = [];
  let lastNonEmptyLine = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 空行始终保留
    if (!trimmedLine) {
      uniqueLines.push(line);
      continue;
    }
    
    // 如果与上一行不同，保留
    if (trimmedLine !== lastNonEmptyLine) {
      uniqueLines.push(line);
      lastNonEmptyLine = trimmedLine;
    } else {
      console.log('⚠️ 检测到重复行，已跳过:', trimmedLine.substring(0, 50));
    }
  }
  
  cleaned = uniqueLines.join('\n');
  
  // 8. 最后清理
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  console.log('🎨 清理后的文本长度:', cleaned.length);
  console.log('🎨 清理后的文本内容:', cleaned.substring(0, 500));
  
  return cleaned;
}
