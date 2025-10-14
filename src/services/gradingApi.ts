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
  console.log('🔍 原始文本前500字符:', text.substring(0, 500));
  
  // 1. 移除 JSON 格式的数据
  // 移除所有包含特定关键词的JSON对象
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
  
  // 2. 检测并移除重复内容（使用相似度算法，降低去重阈值）
  if (cleaned.length > 300) {
    const paragraphs = cleaned.split(/\n{2,}/);
    const uniqueParagraphs: string[] = [];
    const seenContent = new Set<string>();
    const seenSimilarContent: string[] = [];
    
    // 计算相似度
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
      const trimmed = para.trim();
      if (!trimmed) continue;
      
      // 使用较长的键（150字符）来更准确地去重
      const normalizedPara = trimmed.replace(/\s+/g, ' ');
      const shortKey = normalizedPara.substring(0, 150);
      
      // 完全相同的内容检查
      if (seenContent.has(shortKey)) {
        console.log('⚠️ 检测到完全重复段落，已跳过');
        continue;
      }
      
      // 相似度检查 - 只有 95% 以上相似度才视为重复（提高阈值，减少误判）
      let isSimilar = false;
      for (const seenPara of seenSimilarContent) {
        const similarity = calculateSimilarity(normalizedPara, seenPara);
        if (similarity > 0.95) {
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
      uniqueParagraphs.push(trimmed);
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

