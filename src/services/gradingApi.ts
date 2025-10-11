// 作业批改 API 服务 - 使用 Coze 智能体
const API_BASE_URL = 'https://api.coze.cn/v3/chat';
const API_TOKEN = 'pat_mbYxFHt5rsdAhzu4OzSMzQ4K6jyStyUdNFlVkJHKbj7r9B0Gmp1N98zGSk6W3wUt';
const BOT_ID = '7559774554567000110';

export interface GradingApiRequest {
  imageUrl: string; // 作业图片 URL
  assignmentName?: string; // 作业名称（可选）
  subject?: string; // 学科（可选）
}

export interface GradingResult {
  score: number; // 分数
  comment: string; // 批改评语
  suggestions?: string; // 改进建议（可选）
}

/**
 * 调用作业批改 API - 支持流式输出
 * @param imageUrl 作业图片 URL
 * @param onProgress 流式输出回调函数
 * @returns Promise<GradingResult>
 */
export async function gradeAssignmentWithStream(
  imageUrl: string,
  onProgress?: (chunk: string) => void
): Promise<GradingResult> {
  try {
    console.log('📤 开始调用批改 API');
    console.log('图片URL:', imageUrl);
    console.log('Bot ID:', BOT_ID);
    
    // 构建包含图片的消息
    const requestBody = {
      bot_id: BOT_ID,
      user_id: 'teacher_' + Date.now(),
      stream: true,
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
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n详细信息: ${errorText}`);
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

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
      console.log('📦 收到数据块:', chunk.substring(0, 200)); // 只打印前200字符
      
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
            
            // 尝试多种可能的内容路径
            let content = '';
            if (data.event === 'message' && data.message?.content) {
              content = data.message.content;
            } else if (data.content) {
              content = data.content;
            } else if (data.delta?.content) {
              content = data.delta.content;
            } else if (data.choices?.[0]?.delta?.content) {
              content = data.choices[0].delta.content;
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

    console.log('📝 批改完整文本:', fullText);
    
    // 清理和格式化文本
    const cleanedText = cleanAndFormatText(fullText);
    
    return {
      score: 0, // 分数由教师手动输入
      comment: cleanedText || '批改完成，请查看详细内容。',
    };
  } catch (error) {
    console.error('❌ 作业批改 API 调用失败:', error);
    throw error;
  }
}

/**
 * 清理和格式化 AI 返回的文本
 */
function cleanAndFormatText(text: string): string {
  let cleaned = text;
  
  console.log('🔍 原始文本长度:', text.length);
  
  // 1. 移除 JSON 格式的数据和结尾信息
  cleaned = cleaned.replace(/\{[^}]*"msg_type"[^}]*\}/g, '');
  cleaned = cleaned.replace(/","from_module"[^}]*$/g, '');
  cleaned = cleaned.replace(/\}[^}]*"from_module"[^}]*$/g, '');
  
  // 2. 检测并移除重复内容（更智能的检测）
  if (cleaned.length > 300) {
    // 查找重复的段落标记
    const paragraphs = cleaned.split(/\n{2,}/);
    const uniqueParagraphs = [];
    const seen = new Set();
    
    for (const para of paragraphs) {
      const key = para.trim().substring(0, 50); // 使用前50字符作为去重键
      if (!seen.has(key) || para.trim().length < 50) {
        uniqueParagraphs.push(para);
        seen.add(key);
      }
    }
    
    cleaned = uniqueParagraphs.join('\n\n');
  }
  
  // 3. 修复错误的 LaTeX 格式
  // \frac{3{4} -> \frac{3}{4}
  cleaned = cleaned.replace(/\\frac\{(\d+)\{(\d+)\}/g, '\\frac{$1}{$2}');
  
  // 4. 转换 LaTeX 数学公式为更易读的 HTML 格式
  // \frac{a}{b} -> <sup>a</sup>/<sub>b</sub> (分数)
  cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<sup>$1</sup>⁄<sub>$2</sub>');
  
  // 5. 处理其他 LaTeX 公式
  // \(...\) 行内公式
  cleaned = cleaned.replace(/\\\(([^)]+)\\\)/g, (_match, formula) => {
    let f = formula;
    // 简化分数表示
    f = f.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<sup>$1</sup>⁄<sub>$2</sub>');
    // 移除 boldsymbol
    f = f.replace(/\\boldsymbol\{([^}]+)\}/g, '$1');
    // 转换符号
    f = f.replace(/\\times/g, '×');
    f = f.replace(/\\div/g, '÷');
    f = f.replace(/\\left\(/g, '(');
    f = f.replace(/\\right\)/g, ')');
    return f;
  });
  
  // 6. 转换 LaTeX 符号
  cleaned = cleaned.replace(/\\implies/g, ' ⇒ ');
  cleaned = cleaned.replace(/\\times/g, '×');
  cleaned = cleaned.replace(/\\div/g, '÷');
  cleaned = cleaned.replace(/\\neq/g, '≠');
  cleaned = cleaned.replace(/\\leq/g, '≤');
  cleaned = cleaned.replace(/\\geq/g, '≥');
  cleaned = cleaned.replace(/\\left\(/g, '(');
  cleaned = cleaned.replace(/\\right\)/g, ')');
  cleaned = cleaned.replace(/\\left\[/g, '[');
  cleaned = cleaned.replace(/\\right\]/g, ']');
  
  // 7. 清理多余的反斜杠
  cleaned = cleaned.replace(/\\([^a-zA-Z])/g, '$1');
  
  // 8. 清理多余的空白和换行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  console.log('🎨 清理后的文本长度:', cleaned.length);
  
  return cleaned;
}

