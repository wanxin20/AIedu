// 学习助手 API 服务 - 使用 Coze 智能体
const API_CONVERSATION_CREATE = 'https://api.coze.cn/v1/conversation/create';
const API_CHAT = 'https://api.coze.cn/v3/chat';
const API_TOKEN = 'pat_mbYxFHt5rsdAhzu4OzSMzQ4K6jyStyUdNFlVkJHKbj7r9B0Gmp1N98zGSk6W3wUt';
const BOT_ID = '7559844727307812916';

// 生成或获取固定的用户ID（保持会话上下文的关键）
const getUserId = (): string => {
  let userId = localStorage.getItem('coze_user_id');
  if (!userId) {
    userId = 'student_' + Math.random().toString(36).substring(2, 15) + Date.now();
    localStorage.setItem('coze_user_id', userId);
    console.log('🆕 创建新的用户ID:', userId);
  } else {
    console.log('✅ 使用已存在的用户ID:', userId);
  }
  return userId;
};

/**
 * 调用学习助手 API - 支持流式输出和会话上下文
 * @param userMessage 用户消息
 * @param onProgress 流式输出回调函数
 * @param conversationId 会话ID（可选，用于保持上下文）
 * @param historyMessages 历史消息（可选，用于显式传递上下文）
 * @returns Promise<{ response: string, conversationId: string }>
 */
export async function chatWithAssistant(
  userMessage: string,
  onProgress?: (chunk: string) => void,
  conversationId?: string,
  historyMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ response: string; conversationId: string }> {
  try {
    const userId = getUserId(); // 使用固定的用户ID
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 开始调用学习助手 API (v3/chat)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 用户消息:', userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''));
    console.log('🤖 Bot ID:', BOT_ID);
    console.log('👤 User ID:', userId);
    console.log('💬 Conversation ID:', conversationId || '【空 - 将创建新会话】');
    console.log('📚 历史消息数量:', historyMessages?.length || 0);
    console.log('🔄 模式:', conversationId ? '继续现有会话' : '创建新会话');
    
    // 构建 additional_messages - 包含历史消息和当前用户问题
    // 根据 Coze API v3 文档：
    // - additional_messages 中的最后一条消息会作为本次对话的用户输入
    // - 其他消息均为本次对话的上下文
    // - 只需传入 role=user 和 role=assistant, type=answer 的消息
    const additionalMessages: any[] = [];
    
    // 1. 添加历史消息作为上下文（如果有）
    if (historyMessages && historyMessages.length > 0) {
      console.log('📜 正在构建上下文消息...');
      for (const msg of historyMessages) {
        const messageObj: any = {
          role: msg.role,
          content: msg.content,
          content_type: 'text'
        };
        
        // assistant 消息需要指定 type=answer
        if (msg.role === 'assistant') {
          messageObj.type = 'answer';
        }
        
        additionalMessages.push(messageObj);
      }
      console.log('✅ 已添加 ' + historyMessages.length + ' 条历史消息作为上下文');
    }
    
    // 2. 添加当前用户消息（作为本次 Query）
    additionalMessages.push({
      role: 'user',
      content: userMessage,
      content_type: 'text'
    });
    
    console.log('📋 完整消息列表长度:', additionalMessages.length);
    console.log('   - 上下文消息:', additionalMessages.length - 1);
    console.log('   - 当前问题: 1');
    
    // 构建请求体 - 根据 Coze API v3 文档
    // 🔑 关键配置说明：
    // - bot_id: Bot ID（固定）
    // - user_id: 用户ID（必须保持一致以维持上下文）
    // - conversation_id: 会话ID（用于标识会话）
    // - auto_save_history: 自动保存历史（true）
    // - additional_messages: 历史消息 + 当前消息
    const requestBody: any = {
      bot_id: BOT_ID,
      user_id: userId,
      stream: true,
      auto_save_history: true,
      additional_messages: additionalMessages
    };
    
    // 注意：conversation_id 将作为 URL Query 参数传递，不放在 Body 中
    
    console.log('📤 完整请求体:');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 🔑 关键修复：conversation_id 应该作为 URL Query 参数，而不是 Body 参数！
    let apiUrl = API_CHAT;
    if (conversationId) {
      apiUrl = `${API_CHAT}?conversation_id=${conversationId}`;
      console.log('🔧 修复：将conversation_id添加到URL Query参数');
      console.log('   完整URL:', apiUrl);
      // 从Body中移除conversation_id
      delete requestBody.conversation_id;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const response = await fetch(apiUrl, {
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
            
            // 提取会话ID - conversation_id 是维持上下文的关键
            if (data.conversation_id) {
              const apiConversationId = data.conversation_id;
              
              if (!newConversationId) {
                // 首次获取会话ID
                newConversationId = apiConversationId;
                console.log('💬 获取到会话ID:', newConversationId);
                
                // 验证会话ID是否保持一致
                if (conversationId && conversationId !== newConversationId) {
                  console.error('❌ 警告：传递的会话ID与API返回的不一致！');
                  console.error('   传递:', conversationId);
                  console.error('   返回:', newConversationId);
                  console.error('   这意味着上下文已丢失！');
                } else if (conversationId) {
                  console.log('✅ 会话ID一致，上下文已连接');
                }
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
    
    // 清理和格式化响应内容，提取建议问题
    const { cleanedContent, suggestedQuestions } = cleanResponseText(fullText);
    
    // 将建议问题附加到响应内容末尾（使用特殊标记，前端会解析）
    let finalResponse = cleanedContent || '抱歉，我暂时无法回复。请稍后再试。';
    
    // 如果有建议问题，使用特殊格式附加（前端会解析）
    if (suggestedQuestions.length > 0) {
      finalResponse += '\n\n__SUGGESTED_QUESTIONS__\n' + suggestedQuestions.join('\n__Q__\n');
      console.log('💡 已将建议问题附加到响应中');
    }
    
    return {
      response: finalResponse,
      conversationId: newConversationId
    };
  } catch (error) {
    console.error('❌ 学习助手 API 调用失败:', error);
    throw error;
  }
}

/**
 * 显式创建新的会话（使用Coze Conversation API）
 * 根据官方文档格式创建会话
 * @returns Promise<string> 返回新创建的会话ID
 */
export async function createConversation(): Promise<string> {
  try {
    const userId = getUserId();
    console.log('🔧 调用Coze Conversation API创建新会话');
    console.log('   User ID:', userId);
    console.log('   Bot ID:', BOT_ID);
    console.log('   API端点:', API_CONVERSATION_CREATE);
    
    // 根据官方文档的请求格式
    const requestBody = {
      bot_id: BOT_ID,
      meta_data: {
        user_id: userId
      },
      messages: [] // 创建空会话
    };
    
    console.log('📤 请求体:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(API_CONVERSATION_CREATE, {
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
      console.error('❌ 创建会话API返回错误:', errorText);
      throw new Error(`创建会话失败: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('✅ 会话创建API完整响应:', JSON.stringify(data, null, 2));
    
    // 提取会话ID - 根据API响应结构
    const conversationId = data.data?.id || data.id || data.conversation_id;
    
    if (conversationId) {
      console.log('✅ 成功创建会话，ID:', conversationId);
      console.log('   🎯 保存此ID，后续所有消息都将在此会话中发送');
      return conversationId;
    } else {
      console.error('❌ API响应中未找到会话ID');
      console.error('   响应数据:', data);
      throw new Error('无法从API响应中获取会话ID');
    }
  } catch (error) {
    console.error('❌ 创建会话失败:', error);
    throw error;
  }
}

/**
 * 清理响应文本 - 移除重复内容、JSON 元数据、工具调用和思考过程，提取建议问题
 * @returns { cleanedContent: string, suggestedQuestions: string[] }
 */
function cleanResponseText(text: string): { cleanedContent: string; suggestedQuestions: string[] } {
  let cleaned = text;
  const suggestedQuestions: string[] = [];
  
  console.log('🔍 原始文本长度:', text.length);
  console.log('🔍 原始文本内容:', text.substring(0, 500));
  
  // 🔑 0. 首先提取建议问题 - 在清理 JSON 之前
  // 匹配 generate_answer_finish JSON 后面的建议问题
  // 使用更精确的匹配：找到 msg_type":"generate_answer_finish 的位置，然后匹配完整的 JSON 对象
  const finishMarker = '"msg_type":"generate_answer_finish"';
  const finishIndex = cleaned.indexOf(finishMarker);
  
  if (finishIndex !== -1) {
    // 从 msg_type 开始往前找到 JSON 开始的 {
    let jsonStart = cleaned.lastIndexOf('{', finishIndex);
    
    if (jsonStart !== -1) {
      // 从 JSON 开始位置往后找到匹配的 }
      let braceCount = 0;
      let jsonEnd = -1;
      
      for (let i = jsonStart; i < cleaned.length; i++) {
        if (cleaned[i] === '{') {
          braceCount++;
        } else if (cleaned[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
      }
      
      if (jsonEnd !== -1) {
        // 提取 JSON 后面的文本作为建议问题
        const questionText = cleaned.substring(jsonEnd + 1).trim();
        console.log('💡 检测到 generate_answer_finish 后的文本:', questionText);
        
        if (questionText.length > 0) {
          // 智能分割建议问题
          // 1. 首先尝试按问号分割
          let questions = questionText.split(/[？?]/);
          
          // 2. 处理每个问题片段
          const extractedQuestions = questions
            .map(q => q.trim())
            .filter(q => {
              // 过滤条件：长度在5-80字之间，且包含中文字符
              return q.length >= 5 && q.length <= 80 && /[\u4e00-\u9fa5]/.test(q);
            })
            .map(q => {
              // 清理问题文本
              // 移除可能的 JSON 残留和特殊字符
              q = q.replace(/[{}\[\]",;:]/g, '');
              q = q.replace(/from_module|from_unit|null/gi, '');
              // 移除开头的连接词
              q = q.replace(/^(还|或者|以及|和|或)\s*/, '');
              // 确保问题以问号结尾
              if (!q.endsWith('？') && !q.endsWith('?')) {
                q += '？';
              }
              return q.trim();
            })
            .filter(q => q.length >= 5 && q.length <= 80); // 再次过滤
          
          if (extractedQuestions.length > 0) {
            // 限制最多3个建议问题
            suggestedQuestions.push(...extractedQuestions.slice(0, 3));
            console.log('✅ 提取到建议问题 (' + suggestedQuestions.length + ' 个):', suggestedQuestions);
          }
          
          // 从原文中移除 JSON 和后面的建议问题部分
          cleaned = cleaned.substring(0, jsonStart).trim();
        }
      }
    }
  }
  
  // 1. 移除所有JSON格式内容（包括工具调用、插件信息、API返回等）
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
  
  // 🔑 5.5 检测并移除大段重复文本（在段落分割之前）
  // 这个方法可以检测到连续重复的大段文本，即使没有段落分隔符
  const detectAndRemoveLargeRepetition = (text: string): string => {
    const length = text.length;
    
    // 只处理较长的文本
    if (length < 100) return text;
    
    // 检测前半部分是否与后半部分相同或高度相似
    const half = Math.floor(length / 2);
    const firstHalf = text.substring(0, half).trim();
    const secondHalf = text.substring(half).trim();
    
    // 如果两半几乎相同，说明整体重复
    if (firstHalf === secondHalf) {
      console.log('⚠️ 检测到整体重复（前后两半完全相同），移除后半部分');
      return firstHalf;
    }
    
    // 检测是否存在重复的较大段落（使用滑动窗口）
    const minChunkSize = Math.min(50, Math.floor(length / 4)); // 最小检测块大小
    
    for (let chunkSize = Math.floor(length / 2); chunkSize >= minChunkSize; chunkSize -= 10) {
      for (let i = 0; i <= length - chunkSize * 2; i++) {
        const chunk1 = text.substring(i, i + chunkSize);
        const chunk2 = text.substring(i + chunkSize, i + chunkSize * 2);
        
        // 如果找到两个相邻的相同块
        if (chunk1 === chunk2) {
          console.log('⚠️ 检测到重复块（长度: ' + chunkSize + '），移除重复部分');
          // 移除第二个重复块
          return text.substring(0, i + chunkSize) + text.substring(i + chunkSize * 2);
        }
      }
    }
    
    return text;
  };
  
  // 应用大段重复检测
  cleaned = detectAndRemoveLargeRepetition(cleaned);
  
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
  console.log('💡 建议问题数量:', suggestedQuestions.length);
  
  return {
    cleanedContent: cleaned,
    suggestedQuestions: suggestedQuestions
  };
}
