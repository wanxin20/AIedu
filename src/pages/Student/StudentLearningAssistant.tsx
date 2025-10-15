import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { chatWithAssistant } from '@/services/learningAssistantApi';

// 定义消息接口
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  suggestedQuestions?: string[]; // AI建议的快捷问题
}

// 定义会话接口
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  conversationId?: string; // Coze API 的会话ID，用于保持上下文
}

export default function StudentLearningAssistant() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoSendTriggered, setAutoSendTriggered] = useState(false);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // 初始化欢迎消息和会话
  useEffect(() => {
    // 创建初始欢迎消息
    const welcomeMessage: Message = {
      id: 'welcome',
      content: '你好！我是你的智能学习助手 🤖\n\n我可以帮助你：\n• 解答学科问题\n• 讲解知识点\n• 辅导作业难题\n• 提供学习建议\n\n有什么可以帮助你的吗？',
      sender: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    
    // ⚠️ 不在初始化时创建会话
    // 原因：/v1/conversation/create 创建的会话ID与 /v3/chat 不兼容
    // 解决方案：让 /v3/chat API 在第一次调用时自动创建会话，然后保存返回的ID
    console.log('🚀 页面初始化');
    console.log('   策略：第一次发送消息时，/v3/chat 会自动创建会话');
    console.log('   我们会保存API返回的conversation_id，用于后续对话');
    
    // 初始化并加载历史对话
    loadChatHistory();
    
    // 监听窗口大小变化
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };
    
    handleResize(); // 初始检查
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 处理从其他页面传递过来的问题（如从 Dashboard）
  useEffect(() => {
    const state = location.state as { question?: string } | null;
    
    if (state?.question && !autoSendTriggered && !isTyping && messages.length > 0) {
      setAutoSendTriggered(true);
      
      // 等待欢迎消息渲染完成后自动发送
      const timer = setTimeout(() => {
        handleSendMessage(state.question);
        
        // 显示提示
        toast.success('问题已自动发送给学习助手', {
          duration: 2000,
        });
      }, 800);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, autoSendTriggered, isTyping, messages.length]);

  // 保存当前对话
  const saveCurrentChat = () => {
    if (messages.length <= 1) return; // 只有欢迎消息，不需要保存
    
    try {
      let sessions = [...chatSessions];
      let currentSession: ChatSession | undefined;
      
      if (currentSessionId) {
        // 更新现有会话
        currentSession = sessions.find(s => s.id === currentSessionId);
        if (currentSession) {
          currentSession.messages = [...messages];
          currentSession.lastMessage = messages[messages.length - 1].content;
          currentSession.timestamp = new Date();
          currentSession.conversationId = currentConversationId; // 保存会话ID
        }
      } else {
        // 创建新会话
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: generateSessionTitle(messages),
          lastMessage: messages[messages.length - 1].content,
          timestamp: new Date(),
          messages: [...messages],
          conversationId: currentConversationId, // 保存会话ID
        };
        sessions.unshift(newSession);
        setCurrentSessionId(newSession.id);
      }
      
      setChatSessions(sessions);
      localStorage.setItem('learningAssistantChatHistory', JSON.stringify(sessions));
    } catch (error) {
      console.error('保存对话失败:', error);
    }
  };

  // 监听消息变化，自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      saveCurrentChat();
    }, 2000);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentSessionId, currentConversationId]);

  // 生成会话标题
  const generateSessionTitle = (messageList: Message[]) => {
    // 提取用户的第一条消息作为标题
    const firstUserMessage = messageList.find(m => m.sender === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    return '新对话';
  };

  // 加载对话历史
  const loadChatHistory = () => {
    setIsLoadingHistory(true);
    
    try {
      const savedSessions = localStorage.getItem('learningAssistantChatHistory');
      if (savedSessions) {
        const sessions: ChatSession[] = JSON.parse(savedSessions);
        // 转换时间戳字符串为Date对象
        const parsedSessions = sessions.map(session => ({
          ...session,
          timestamp: new Date(session.timestamp),
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatSessions(parsedSessions);
      } else {
        // 如果没有保存的历史，创建模拟数据
        createMockChatHistory();
      }
    } catch (error) {
      console.error('加载对话历史失败:', error);
      // 如果加载失败，创建模拟数据
      createMockChatHistory();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 加载特定会话
  const loadChatSession = (sessionId: string) => {
    try {
      const session = chatSessions.find(s => s.id === sessionId);
      if (session) {
        setMessages(session.messages);
        setCurrentSessionId(session.id);
        const loadedConversationId = session.conversationId || '';
        setCurrentConversationId(loadedConversationId);
        
        console.log('📂 加载历史会话');
        console.log('   会话列表ID:', sessionId);
        console.log('   Coze会话ID:', loadedConversationId || '无（这是旧会话，没有保存会话ID）');
        console.log('   消息数量:', session.messages.length);
        console.log('   ⚠️ 注意:', loadedConversationId ? '可以继续对话并保持上下文' : '旧会话没有会话ID，继续对话将创建新的上下文');
        
        // 在移动设备上，加载会话后关闭侧边栏
        if (window.innerWidth < 768) {
          setShowSidebar(false);
        }
      }
    } catch (error) {
      console.error('❌ 加载会话失败:', error);
      toast.error('加载会话失败，请重试');
    }
  };

  // 创建新会话
  const createNewSession = async () => {
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      content: '你好！我是你的智能学习助手 🤖\n\n我可以帮助你：\n• 解答学科问题\n• 讲解知识点\n• 辅导作业难题\n• 提供学习建议\n\n有什么可以帮助你的吗？',
      sender: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    setCurrentSessionId(null);
    setCurrentConversationId(''); // 清空会话ID
    
    console.log('🆕 创建新会话');
    console.log('   已清空conversation_id');
    console.log('   下次发送消息时，/v3/chat 会自动创建新的会话');
    console.log('   我们会保存API返回的新conversation_id');
    
    toast.success('新会话已创建', {
      description: '可以开始新的对话了',
      duration: 2000,
    });
    
    // 在移动设备上，创建新会话后关闭侧边栏
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  // 删除会话
  const deleteSession = (sessionId: string) => {
    const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updatedSessions);
    localStorage.setItem('learningAssistantChatHistory', JSON.stringify(updatedSessions));
    
    // 如果删除的是当前会话，创建新会话
    if (sessionId === currentSessionId) {
      createNewSession();
    }
  };

  // 创建模拟的历史对话数据
  const createMockChatHistory = () => {
    const mockSessions: ChatSession[] = [];
    
    // 模拟会话1：数学问题
    const mathSession: ChatSession = {
      id: 'mock-math',
      title: '函数的基本性质',
      lastMessage: '谢谢你的详细解答！',
      timestamp: new Date(Date.now() - 86400000), // 昨天
      messages: [
        {
          id: 'm1-1',
          content: '你好，我想了解一下函数的基本性质有哪些？',
          sender: 'user',
          timestamp: new Date(Date.now() - 86400000 - 3600000)
        },
        {
          id: 'm1-2',
          content: '函数的基本性质主要包括：\n\n1. 定义域与值域：函数输入值的集合称为定义域，输出值的集合称为值域。\n2. 奇偶性：奇函数满足f(-x) = -f(x)，偶函数满足f(-x) = f(x)。\n3. 单调性：函数在某个区间内是递增或递减的。\n4. 周期性：函数值按照固定间隔重复的性质。\n5. 对称性：函数图像关于某条直线或点对称。\n\n需要我详细解释其中某一个性质吗？',
          sender: 'assistant',
          timestamp: new Date(Date.now() - 86400000 - 3500000)
        },
        {
          id: 'm1-3',
          content: '请详细解释一下单调性和如何判断函数的单调性。',
          sender: 'user',
          timestamp: new Date(Date.now() - 86400000 - 3400000)
        },
        {
          id: 'm1-4',
          content: '函数的单调性是指函数在定义域的某个区间内，当自变量x增大时，函数值f(x)是增大还是减小的性质。\n\n判断函数单调性的方法主要有：\n\n1. 定义法：对于区间内的任意x1 < x2，比较f(x1)和f(x2)的大小。\n2. 导数法：计算函数的导数f\'(x)，若f\'(x) > 0，则函数在该区间内单调递增；若f\'(x) < 0，则单调递减。\n3. 图像法：观察函数图像的上升或下降趋势。\n\n例如，对于函数f(x) = x²，它在区间(-∞, 0)上单调递减，在区间(0, +∞)上单调递增。',
          sender: 'assistant',
          timestamp: new Date(Date.now() - 86400000 - 3300000)
        },
        {
          id: 'm1-5',
          content: '谢谢你的详细解答！',
          sender: 'user',
          timestamp: new Date(Date.now() - 86400000 - 3200000)
        }
      ]
    };
    
    // 模拟会话2：英语问题
    const englishSession: ChatSession = {
      id: 'mock-english',
      title: '过去完成时的用法',
      lastMessage: '我明白了，谢谢你！',
      timestamp: new Date(Date.now() - 172800000), // 前天
      messages: [
        {
          id: 'm2-1',
          content: '请问过去完成时应该怎么使用？',
          sender: 'user',
          timestamp: new Date(Date.now() - 172800000 - 7200000)
        },
        {
          id: 'm2-2',
          content: '过去完成时表示在过去某一时间或动作之前已经发生或完成了的动作，它表示动作发生的时间是"过去的过去"。\n\n基本结构：had + 过去分词\n\n使用场景：\n1. 表示在过去某一时刻或动作以前完成了的动作，也可以说过去的时间关于过去的动作。\n2. 表示由过去的某一时刻开始，一直延续到过去另一时间的动作或状态。\n\n例如：\n- When I arrived at the station, the train had already left.\n- She had lived in London for five years before she moved to Paris.',
          sender: 'assistant',
          timestamp: new Date(Date.now() - 172800000 - 7100000)
        },
        {
          id: 'm2-3',
          content: '可以再举几个例子吗？',
          sender: 'user',
          timestamp: new Date(Date.now() - 172800000 - 7000000)
        },
        {
          id: 'm2-4',
          content: '当然可以！以下是一些过去完成时的例句：\n\n1. By the time I got home, my wife had cooked dinner.\n2. He had studied English for three years before he went to the US.\n3. They had already finished the project when I joined the team.\n4. She realized that she had forgotten her keys.\n5. Had you seen the movie before you read the book?\n\n这些例句都表示在过去的某个时间点之前已经完成的动作。',
          sender: 'assistant',
          timestamp: new Date(Date.now() - 172800000 - 6900000)
        },
        {
          id: 'm2-5',
          content: '我明白了，谢谢你！',
          sender: 'user',
          timestamp: new Date(Date.now() - 172800000 - 6800000)
        }
      ]
    };
    
    mockSessions.push(mathSession, englishSession);
    setChatSessions(mockSessions);
    localStorage.setItem('learningAssistantChatHistory', JSON.stringify(mockSessions));
  };

  // 发送消息（支持自动发送传入的问题）
  const handleSendMessage = async (autoQuestion?: string) => {
    const messageContent = autoQuestion || inputValue.trim();
    
    if (!messageContent || isTyping) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const userMessageContent = messageContent;
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setStreamingText('');
    
    const hasConversationId = !!currentConversationId;
    console.log('📤 发送消息');
    console.log('   当前会话ID:', currentConversationId || '无');
    console.log('   会话状态:', hasConversationId ? '继续现有会话' : '将创建新会话');
    console.log('   当前会话列表ID:', currentSessionId || '无');
    
    // 🔑 构建历史消息数组 - 用于上下文传递
    // 根据 Coze API 文档：只需传入 user 和 assistant 的消息，排除欢迎消息
    const historyMessages = messages
      .filter(msg => {
        // 过滤掉欢迎消息（id 为 'welcome' 或以 'welcome-' 开头）
        if (msg.id === 'welcome' || msg.id.startsWith('welcome-')) {
          return false;
        }
        // 只保留 user 和 assistant 消息
        return msg.sender === 'user' || msg.sender === 'assistant';
      })
      .map(msg => ({
        role: msg.sender as 'user' | 'assistant',
        content: msg.content
      }));
    
    console.log('📚 准备发送的历史消息数量:', historyMessages.length);
    if (historyMessages.length > 0) {
      console.log('   最早的消息:', historyMessages[0].content.substring(0, 50) + '...');
      console.log('   最新的消息:', historyMessages[historyMessages.length - 1].content.substring(0, 50) + '...');
    }
    
    try {
      // 调用真实的 AI 助手 API，传递会话ID和历史消息以保持上下文
      const result = await chatWithAssistant(
        userMessageContent,
        (chunk) => {
          // 流式输出回调 - 实时显示 AI 回复
          setStreamingText(prev => prev + chunk);
        },
        currentConversationId || undefined, // 传递会话ID，如果为空则创建新会话
        historyMessages.length > 0 ? historyMessages : undefined // 传递历史消息作为上下文
      );
      
      // 更新会话ID - 确保后续对话使用同一个会话
      if (result.conversationId) {
        if (currentConversationId !== result.conversationId) {
          console.log('📌 会话ID变更:', currentConversationId || '无', '->', result.conversationId);
          console.log('   变更原因:', !currentConversationId ? '新会话创建' : 'API返回了不同的ID');
        } else {
          console.log('✅ 会话ID保持一致:', result.conversationId);
        }
        setCurrentConversationId(result.conversationId);
      } else {
        console.warn('⚠️ 警告：API 未返回会话ID，上下文可能丢失');
      }
      
      // 提取建议问题
      const { cleanedContent, questions } = extractSuggestedQuestions(result.response);
      
      // AI 回复完成
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: cleanedContent || result.response, // 使用清理后的内容
        sender: 'assistant',
        timestamp: new Date(),
        suggestedQuestions: questions.length > 0 ? questions : undefined,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      setStreamingText('');
      
    } catch (error) {
      console.error('❌ 发送消息失败:', error);
      setIsTyping(false);
      setStreamingText('');
      
      // 显示错误消息
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: '抱歉，我遇到了一些问题，暂时无法回复。请稍后再试。',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('发送失败，请重试', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 提取建议问题 - 从 API 返回的特殊标记中解析
  const extractSuggestedQuestions = (content: string): { cleanedContent: string; questions: string[] } => {
    // 检查是否包含建议问题标记
    const marker = '__SUGGESTED_QUESTIONS__';
    const questionSeparator = '__Q__';
    
    if (content.includes(marker)) {
      // 分割内容和建议问题部分
      const parts = content.split(marker);
      const cleanedContent = parts[0].trim();
      
      if (parts[1]) {
        // 提取建议问题
        const questionsText = parts[1].trim();
        const questions = questionsText
          .split(questionSeparator)
          .map(q => q.trim())
          .filter(q => q.length > 0);
        
        console.log('💡 从API响应中提取到建议问题:', questions);
        
        return { cleanedContent, questions };
      }
    }
    
    // 如果没有特殊标记，返回原内容（兼容旧逻辑）
    return { cleanedContent: content, questions: [] };
  };

  // 格式化消息内容 - 将 Markdown 转换为 HTML
  const formatMessageContent = (content: string): string => {
    let html = content;
    
    // 0. 预处理：移除所有JSON格式内容和工具调用信息
    // 移除所有包含特定关键词的JSON对象（包括嵌套的）
    html = html.replace(/\{(?:[^{}]|\{[^{}]*\})*\}/g, (match) => {
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
        match.includes('"sitename"') ||
        match.includes('"summary"') ||
        match.includes('"logo_url"')
      ) {
        return '';
      }
      return match;
    });
    
    // 移除残留的JSON片段（以逗号、引号等开头的不完整片段）
    html = html.replace(/^[,\s]*["\{].*?["\}][,\s]*/gm, '');
    html = html.replace(/^[,:"]\w+[,:"]/gm, '');
    
    // 移除工具调用标记
    html = html.replace(/正在调用.*?工具.*?\n?/gi, '');
    html = html.replace(/调用工具[:：].*?\n?/gi, '');
    html = html.replace(/工具返回[:：].*?\n?/gi, '');
    html = html.replace(/使用工具[:：].*?\n?/gi, '');
    
    // 移除思考过程标记
    html = html.replace(/<think>[\s\S]*?<\/think>/gi, '');
    html = html.replace(/\[思考\][\s\S]*?\[\/思考\]/gi, '');
    html = html.replace(/【思考】[\s\S]*?【\/思考】/gi, '');
    html = html.replace(/```思考[\s\S]*?```/gi, '');
    
    // 移除思考过程文本
    html = html.replace(/^让我.*?思考.*?\n?/gim, '');
    html = html.replace(/^思考中.*?\n?/gim, '');
    html = html.replace(/^分析中.*?\n?/gim, '');
    html = html.replace(/^正在思考.*?\n?/gim, '');
    
    // 移除包含工具调用的JSON代码块
    html = html.replace(/```json\s*\{[^}]*"tool"[^}]*\}[\s\S]*?```/gi, '');
    html = html.replace(/```json\s*\{[^}]*"function"[^}]*\}[\s\S]*?```/gi, '');
    
    // 1. 转换标题（标题与上一行有间隔，与下一行无间隔）
    html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-0 border-l-4 border-green-500 pl-3">$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 dark:text-white mt-5 mb-0 border-l-4 border-blue-500 pl-3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-0 border-l-4 border-indigo-500 pl-3">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-0 border-l-4 border-purple-500 pl-3">$1</h1>');
    
    // 2. 转换粗体 **文本**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
    
    // 3. 转换斜体 *文本*
    html = html.replace(/\*(.+?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');
    
    // 4. 转换数学公式 \( ... \)
    html = html.replace(/\\\(([^)]+)\\\)/g, '<span class="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded font-mono text-sm mx-0.5">$1</span>');
    
    // 5. 转换行内代码 `code`
    html = html.replace(/`([^`]+)`/g, '<code class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded font-mono text-sm">$1</code>');
    
    // 6. 转换有序列表
    // 标题性质的数字列表（以冒号结尾，作为小标题，与上有间隔，与下无间隔）
    html = html.replace(/^(\d+)\.\s+(.+?)[：:]\s*$/gm, '<div class="flex items-start mt-4 mb-0"><span class="inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-blue-500 text-white text-xs font-bold mr-2 flex-shrink-0">$1</span><span class="flex-1 pt-0.5 font-semibold text-gray-900 dark:text-white">$2：</span></div>');
    
    // 普通数字列表（不以冒号结尾）
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex items-start my-1.5"><span class="inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-blue-500 text-white text-xs font-bold mr-2 flex-shrink-0">$1</span><span class="flex-1 pt-0.5">$2</span></div>');
    
    // 7. 转换无序列表
    html = html.replace(/^[-•●]\s+(.+)$/gm, '<div class="flex items-start my-1.5"><span class="text-blue-500 dark:text-blue-400 mr-2 text-base leading-6">●</span><span class="flex-1">$1</span></div>');
    
    // 8. 转换引用 > 文本
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-2 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-r">$1</blockquote>');
    
    // 9. 转换段落（保持空行分隔）并增强去重
    const paragraphs = html.split(/\n\n+/);
    const seenContent = new Set<string>();
    const seenSimilarContent: string[] = []; // 用于相似度检测
    const uniqueParagraphs: string[] = [];
    
    // 计算两个字符串的相似度（简单版本：基于公共子串）
    const calculateSimilarity = (str1: string, str2: string): number => {
      const len1 = str1.length;
      const len2 = str2.length;
      if (len1 === 0 || len2 === 0) return 0;
      
      // 使用最长公共子序列长度作为相似度指标
      const shorter = len1 < len2 ? str1 : str2;
      const longer = len1 < len2 ? str2 : str1;
      
      let matchCount = 0;
      const shortLen = shorter.length;
      
      // 简化版：计算较短字符串有多少部分出现在较长字符串中
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
      
      // 过滤掉包含工具调用、思考或JSON关键词的段落
      if (
        trimmed.includes('tool_') ||
        trimmed.includes('function_') ||
        trimmed.includes('plugin_') ||
        trimmed.includes('api_id') ||
        trimmed.includes('log_id') ||
        trimmed.includes('"url"') ||
        trimmed.includes('sitename') ||
        /^(思考|分析|推理)[:：]/i.test(trimmed)
      ) {
        continue;
      }
      
      // 使用标准化内容作为去重键
      const normalizedPara = trimmed.replace(/\s+/g, ' ').replace(/<[^>]*>/g, ''); // 移除HTML标签
      const shortKey = normalizedPara.substring(0, 150);
      
      // 1. 完全相同的内容检查
      if (seenContent.has(shortKey)) {
        continue;
      }
      
      // 2. 相似度检查（避免内容略有不同但本质相同的重复）
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
      
      // 转换为HTML
      if (trimmed.startsWith('<')) {
        uniqueParagraphs.push(para); // 已经是HTML标签
      } else {
        uniqueParagraphs.push(`<p class="my-2 leading-relaxed">${para.replace(/\n/g, '<br>')}</p>`);
      }
    }
    
    html = uniqueParagraphs.join('\n');
    
    // 10. 特殊处理：移除末尾的鼓励性重复语句
    // 检测末尾是否有类似"如果有...随时问我"这样的重复
    const encouragementPatterns = [
      /如果(有|还有).*?随时.*?[！!]?(<\/p>)?$/i,
      /有(什么|任何)问题.*?随时.*?[！!]?(<\/p>)?$/i,
      /小超人鼓励.*?[！!]?(<\/p>)?$/i,
    ];
    
    for (const pattern of encouragementPatterns) {
      const matches = html.match(new RegExp(pattern.source, 'gi'));
      if (matches && matches.length > 1) {
        // 如果出现多次，只保留最后一次
        const lastMatch = matches[matches.length - 1];
        html = html.replace(pattern, '');
        html = html + '\n' + lastMatch;
      }
    }
    
    // 11. 最后清理多余空白
    html = html.replace(/\n{3,}/g, '\n\n');
    html = html.trim();
    
    return html;
  };

  // 过滤会话列表
  const filteredSessions = searchQuery
    ? chatSessions.filter(session => 
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chatSessions;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <i 
                onClick={() => setShowSidebar(!showSidebar)}
                className="fa-solid fa-bars text-gray-600 dark:text-gray-300 cursor-pointer lg:hidden"
              ></i>
              <i className="fa-solid fa-graduation-cap text-orange-600 dark:text-orange-400 text-xl"></i>
              <h1 className="text-lg font-semibold hidden sm:block">智慧教辅系统</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/student/dashboard"
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center"
              >
                <i className="fa-solid fa-tachometer-alt mr-1"></i>
                <span>仪表盘</span>
              </Link>
              <Link
                to="/student/assignments"
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center"
              >
                <i className="fa-solid fa-clipboard-list mr-1"></i>
                <span>作业中心</span>
              </Link>
              <Link
                to="/student/resources"
                className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 flex items-center"
              >
                <i className="fa-solid fa-book-open mr-1"></i>
                <span>学习资源</span>
              </Link>
              <Link
                to="/student/learning-assistant"
                className="text-orange-600 dark:text-orange-400 font-medium flex items-center"
              >
                <i className="fa-solid fa-question-circle mr-1"></i>
                <span>学习助手</span>
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button 
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <i className="fa-solid fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative group">
                <button className="flex items-center space-x-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <i className="fa-solid fa-user-graduate text-gray-600 dark:text-gray-300"></i>
                  </div>
                  <span className="hidden md:inline text-sm font-medium">{user?.name || "学生"}</span>
                  <i className="fa-solid fa-chevron-down text-xs text-gray-500"></i>
                </button>
                
                <div className="absolute right-0 mt-0 pt-2 w-48 z-50 hidden group-hover:block">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <i className="fa-solid fa-sign-out-alt mr-2 text-gray-500"></i>
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* 主内容区 */}
      <main className="flex-1 flex">
        {/* 侧边栏 - 会话列表 */}
        <aside 
          className={`w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
            showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0'
          } fixed lg:static h-[calc(100vh-4rem)] lg:h-auto z-30`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">会话列表</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="搜索会话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          
          <div className="p-4">
            <button
              onClick={createNewSession}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              新会话
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">加载历史会话中...</p>
              </div>
            ) : filteredSessions.length > 0 ? (
              filteredSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => loadChatSession(session.id)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 ${
                    currentSessionId === session.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-800 dark:text-white truncate w-48">{session.title}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {session.lastMessage}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <i className="fa-solid fa-comments text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-gray-800 dark:text-white font-medium mb-2">暂无历史会话</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  开始与学习助手对话，记录将会保存在这里
                </p>
              </div>
            )}
          </div>
        </aside>
        
        {/* 聊天区域 */}
        <div className="flex-1 flex flex-col">
          {/* 聊天内容 */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.sender === 'assistant' && (
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mr-2">
                          <i className="fa-solid fa-robot text-white text-sm"></i>
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">学习助手</span>
                      </div>
                    )}
                    <div className={`inline-block rounded-2xl p-4 shadow-sm ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}>
                      {message.sender === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      ) : (
                        <div 
                          className="formatted-content leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                        />
                      )}
                    </div>
                    
                    {/* 建议问题按钮 */}
                    {message.sender === 'assistant' && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestedQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isTyping) {
                                handleSendMessage(question);
                              }
                            }}
                            className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm border border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 transition-all hover:shadow-md hover:scale-105 flex items-center space-x-1"
                            disabled={isTyping}
                          >
                            <i className="fa-solid fa-lightbulb text-yellow-500 text-xs"></i>
                            <span>{question}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* AI 正在回复 - 流式输出 */}
              {isTyping && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="max-w-[80%] text-left">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mr-2">
                        <i className="fa-solid fa-robot text-white text-sm"></i>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">学习助手</span>
                      <div className="ml-2 flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                    {streamingText ? (
                      <div className="inline-block rounded-2xl p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-start">
                          <div 
                            className="formatted-content leading-relaxed flex-1"
                            dangerouslySetInnerHTML={{ __html: formatMessageContent(streamingText) }}
                          />
                          <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 animate-pulse flex-shrink-0"></span>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-block rounded-2xl p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 滚动锚点 */}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* 输入区域 */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-3xl mx-auto">
              {/* 会话状态指示器 */}
              {currentConversationId && (
                <div className="mb-3 flex items-center justify-center">
                  <div className="inline-flex items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                      上下文已连接
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentConversationId);
                        toast.success('会话ID已复制');
                      }}
                      className="ml-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      title={`会话ID: ${currentConversationId}`}
                    >
                      <i className="fa-solid fa-info-circle text-xs"></i>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你的问题..."
                  disabled={isTyping}
                  className={`flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    isTyping ? 'opacity-70' : ''
                  }`}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className={`p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors ${
                    (!inputValue.trim() || isTyping) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                按 Enter 发送消息，Shift + Enter 换行
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 智慧教辅系统 - 智能学习助手</p>
        </div>
      </footer>
      
      {/* 移动端遮罩层 - 当侧边栏打开时 */}
      {showSidebar && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
    </div>
  );
}