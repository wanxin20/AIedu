// 学习助手 API 服务 - 使用 Coze 智能体
const API_BASE_URL = 'https://api.coze.cn/v3/chat';
const API_TOKEN = 'pat_mbYxFHt5rsdAhzu4OzSMzQ4K6jyStyUdNFlVkJHKbj7r9B0Gmp1N98zGSk6W3wUt';
const BOT_ID = '7559844727307812916';

/**
 * 调用学习助手 API - 支持流式输出
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
    console.log('📤 开始调用学习助手 API');
    console.log('用户消息:', userMessage);
    console.log('Bot ID:', BOT_ID);
    console.log('会话ID:', conversationId || '新会话');
    
    // 构建请求体
    const requestBody: any = {
      bot_id: BOT_ID,
      user_id: 'student_' + Date.now(),
      stream: true,
      auto_save_history: true,
      additional_messages: [
        {
          role: 'user',
          content: userMessage,
          content_type: 'text'
        }
      ]
    };
    
    // 如果有会话ID，添加到请求中以保持上下文
    if (conversationId) {
      requestBody.conversation_id = conversationId;
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
            console.log('📄 解析的数据:', data);
            
            // 提取会话ID
            if (data.conversation_id && !newConversationId) {
              newConversationId = data.conversation_id;
              console.log('💬 会话ID:', newConversationId);
            }
            
            // 提取内容 - 根据 Coze API 文档
            let content = '';
            if (data.event === 'message' && data.message?.content) {
              content = data.message.content;
            } else if (data.event === 'conversation.message.delta' && data.message?.content) {
              content = data.message.content;
            } else if (data.content) {
              content = data.content;
            } else if (data.delta?.content) {
              content = data.delta.content;
            }
            
            if (content) {
              console.log('💬 提取的内容:', content);
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

    console.log('💬 完整回复:', fullText);
    console.log('💬 会话ID:', newConversationId);
    
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
 * 清理响应文本 - 移除重复内容和 JSON 元数据
 */
function cleanResponseText(text: string): string {
  let cleaned = text;
  
  console.log('🔍 原始文本长度:', text.length);
  
  // 1. 移除 JSON 元数据（如 {"msg_type":"generate_answer_finish"...}）
  cleaned = cleaned.replace(/\{[^}]*"msg_type"[^}]*\}[^}]*"from_module"[^}]*\}/g, '');
  cleaned = cleaned.replace(/\{"msg_type"[^}]*\}/g, '');
  cleaned = cleaned.replace(/\{[^}]*"finish_reason"[^}]*\}/g, '');
  
  // 2. 移除重复的段落（检测连续重复的大段文本）
  const paragraphs = cleaned.split(/\n{2,}/);
  const uniqueParagraphs: string[] = [];
  const seenContent = new Set<string>();
  
  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;
    
    // 使用前 100 个字符作为去重键（足够识别重复段落）
    const key = trimmedPara.substring(0, 100);
    
    if (!seenContent.has(key)) {
      uniqueParagraphs.push(trimmedPara);
      seenContent.add(key);
    } else {
      console.log('⚠️ 检测到重复段落，已跳过');
    }
  }
  
  cleaned = uniqueParagraphs.join('\n\n');
  
  // 3. 清理多余的空白和换行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  console.log('🎨 清理后的文本长度:', cleaned.length);
  
  return cleaned;
}
