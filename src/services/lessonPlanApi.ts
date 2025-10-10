// 教案生成 API 服务
const API_BASE_URL = 'http://a.gptpro.cn/v1/workflow/run';
const API_TOKEN = 'pat_fa35ef830526bb9ad7dc1ef8cee0e355a0f3efe2f0538308ac612114a6716b34';
const WORKFLOW_ID = '7559058612954333184';

export interface LessonPlanApiRequest {
  input: string; // 课程内容，如"一元二次方程"
}

export interface LessonPlanApiResponse {
  // 根据实际API返回结构定义
  success?: boolean;
  data?: {
    content?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * 调用教案生成 API
 * @param sectionTitle 章节标题，如"一元二次方程"
 * @returns Promise<LessonPlanApiResponse>
 */
export async function generateLessonPlanFromApi(sectionTitle: string): Promise<any> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        parameters: JSON.stringify({
          input: sectionTitle
        })
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API 原始返回数据:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('教案生成 API 调用失败:', error);
    throw error;
  }
}

/**
 * 解析 API 返回的教案内容
 * 直接返回格式化后的原始内容，不进行提取
 */
export function parseApiResponse(apiResponse: any, sectionTitle: string, _subject: string) {
  console.log('开始解析 API 响应...');
  
  let content = '';
  
  // 特殊处理：如果 data 是字符串，先解析它
  let parsedData = apiResponse;
  if (apiResponse?.data && typeof apiResponse.data === 'string') {
    try {
      console.log('检测到 data 是字符串，尝试解析...');
      parsedData = {
        ...apiResponse,
        data: JSON.parse(apiResponse.data)
      };
      console.log('✓ 解析成功');
    } catch (e) {
      console.warn('data 字段解析失败，使用原始值');
    }
  }
  
  // 尝试不同的可能路径
  const possiblePaths = [
    parsedData?.data?.output,
    parsedData?.data?.outputs?.[0]?.text,
    parsedData?.data?.text,
    parsedData?.data?.content,
    parsedData?.output,
    parsedData?.text,
    parsedData?.content,
  ];
  
  for (const path of possiblePaths) {
    if (path && typeof path === 'string' && path.trim()) {
      content = path;
      console.log('✓ 找到内容，长度:', content.length);
      break;
    }
  }
  
  // 如果还是没找到内容
  if (!content) {
    console.warn('未找到内容');
    content = '未能获取教案内容';
  }
  
  return {
    id: `lesson-${Date.now()}`,
    title: `数学 - ${sectionTitle} 教案`,
    content: content, // 直接返回原始内容
  };
}

/**
 * 将 Markdown 内容转换为带样式的 HTML
 */
export function convertMarkdownToHTML(markdown: string): string {
  let html = markdown;
  
  // 转换标题
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-800 dark:text-white mt-8 mb-4">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-gray-800 dark:text-white mt-6 mb-3">$1</h3>');
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-lg font-medium text-gray-700 dark:text-gray-200 mt-4 mb-2">$1</h4>');
  
  // 转换粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>');
  
  // 转换列表项
  html = html.replace(/^[-•·*]\s+(.+)$/gm, '<li class="ml-4 text-gray-700 dark:text-gray-300 mb-2">• $1</li>');
  
  // 转换数字列表
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="ml-4 text-gray-700 dark:text-gray-300 mb-2"><span class="font-medium">$1.</span> $2</div>');
  
  // 转换段落（双换行）
  html = html.replace(/\n\n/g, '<br><br>');
  
  // 转换单换行为 <br>
  html = html.replace(/\n/g, '<br>');
  
  // 包装整个内容
  html = '<div class="prose prose-slate dark:prose-invert max-w-none">' + html + '</div>';
  
  return html;
}
