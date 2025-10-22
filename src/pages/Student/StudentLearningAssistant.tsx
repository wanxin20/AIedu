import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { chatWithAssistant } from '@/services/learningAssistantApi';
import { 
  getConversations, 
  getConversationDetail, 
  createConversation, 
  updateConversation, 
  deleteConversation as deleteConversationApi,
  saveMessagesBatch 
} from '@/services/conversationApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
  id: number | string; // 兼容后端数字ID和前端临时字符串ID
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  conversationId?: string; // Coze API 的会话ID，用于保持上下文
  messageCount?: number; // 消息数量
}

export default function StudentLearningAssistant() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<number | string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoSendTriggered, setAutoSendTriggered] = useState(false);
  const [isSending, setIsSending] = useState(false); // 使用 state 而不是 ref，可以触发重新渲染
  const lastSendTimeRef = useRef<number>(0); // 最后一次发送的时间戳，用于防抖
  const messagesRef = useRef<Message[]>(messages); // 使用 ref 来避免 useCallback 依赖 messages
  const isInitializedRef = useRef(false); // 防止重复初始化
  const savedMessageCountRef = useRef<number>(0); // 追踪已保存的消息数量

  // 同步 messages 到 ref
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // 初始化欢迎消息和会话
  useEffect(() => {
    // 防止重复初始化（React.StrictMode 会导致组件挂载两次）
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;
    
    // 创建初始欢迎消息
    const welcomeMessage: Message = {
      id: 'welcome',
      content: '你好！我是你的智能学习助手 🤖\n\n我可以帮助你：\n\n• 解答学科问题\n• 讲解知识点\n• 辅导作业难题\n• 提供学习建议\n\n有什么可以帮助你的吗?',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 处理从其他页面传递过来的问题（如从 Dashboard）
  useEffect(() => {
    const state = location.state as { question?: string } | null;
    
    // 严格条件：只有在初始状态（仅有欢迎消息）且有问题时才自动发送
    // messages.length === 1 确保只在初始状态触发，避免加载历史会话时误触发
    if (state?.question && !autoSendTriggered && !isTyping && messages.length === 1 && !currentSessionId) {
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
  }, [location.state, autoSendTriggered, isTyping, messages.length, currentSessionId]);

  // 保存新消息到后端（只保存未保存的新消息）
  const saveNewMessages = async (newMessages: Message[]) => {
    if (newMessages.length === 0) return;
    
    try {
      // 生成调用追踪信息
      const callstack = new Error().stack;
      console.log('💾💾💾 saveNewMessages 被调用');
      console.log('   时间戳:', new Date().toLocaleTimeString() + '.' + new Date().getMilliseconds());
      console.log('   消息数量:', newMessages.length);
      console.log('   会话ID:', currentSessionId);
      console.log('   消息内容:', newMessages.map(m => `[${m.sender}] ${m.content.substring(0, 20)}`));
      console.log('   调用栈:', callstack);
      
      // 过滤掉欢迎消息
      const messagesToSave = newMessages.filter(msg => 
        msg.id !== 'welcome' && !msg.id.startsWith('welcome-')
      );
      
      if (messagesToSave.length === 0) {
        console.log('💾 没有需要保存的消息（都是欢迎消息）');
        return;
      }
      
      if (currentSessionId && typeof currentSessionId === 'number') {
        // 更新现有会话（保存新消息）
        console.log('💾 更新现有会话', currentSessionId);
        
        await saveMessagesBatch(
          currentSessionId,
          messagesToSave.map(msg => ({
            sender: msg.sender,
            content: msg.content,
            suggestedQuestions: msg.suggestedQuestions
          }))
        );
        
        // 更新会话的cozeConversationId
        if (currentConversationId) {
          await updateConversation(currentSessionId, {
            cozeConversationId: currentConversationId
          });
        }
        
        // 更新本地会话列表
        const lastMessage = messagesToSave[messagesToSave.length - 1];
        setChatSessions(prev => prev.map(session => 
          session.id === currentSessionId
            ? {
                ...session,
                lastMessage: lastMessage.content,
                timestamp: new Date(),
                conversationId: currentConversationId,
                messageCount: (session.messageCount || 0) + messagesToSave.length
              }
            : session
        ));
        
        console.log('✅ 消息保存成功（现有会话）');
      } else {
        // 创建新会话
        console.log('💾 创建新会话并保存消息');
        
        // ⚠️ 使用传入的 messagesToSave，而不是 messagesRef.current
        // 因为 setMessages 是异步的，ref 可能还没更新
        const title = messagesToSave.length > 0 
          ? messagesToSave[0].content.substring(0, 30) + (messagesToSave[0].content.length > 30 ? '...' : '')
          : '新对话';
        
        console.log('💾 准备创建会话', {
          title,
          messageCount: messagesToSave.length,
          cozeConversationId: currentConversationId
        });
        
        const response = await createConversation({
          title,
          cozeConversationId: currentConversationId || undefined
        });
        
        const newSessionId = response.data.id;
        console.log('💾 会话创建成功，ID:', newSessionId);
        
        setCurrentSessionId(newSessionId);
        
        // 保存传入的新消息到新会话
        await saveMessagesBatch(
          newSessionId,
          messagesToSave.map(msg => ({
            sender: msg.sender,
            content: msg.content,
            suggestedQuestions: msg.suggestedQuestions
          }))
        );
        
        console.log('💾 消息保存到数据库成功');
        
        // 添加到本地会话列表
        const lastMessage = messagesToSave[messagesToSave.length - 1];
        const newSession: ChatSession = {
          id: newSessionId,
          title,
          lastMessage: lastMessage.content,
          timestamp: new Date(),
          messages: [...newMessages], // 使用传入的 newMessages
          conversationId: currentConversationId,
          messageCount: messagesToSave.length
        };
        
        setChatSessions(prev => [newSession, ...prev]);
        
        // 更新已保存消息数量
        savedMessageCountRef.current = messagesToSave.length;
        
        console.log('✅ 消息保存成功（新会话）', {
          sessionId: newSessionId,
          messageCount: messagesToSave.length,
          title
        });
      }
    } catch (error) {
      console.error('❌ 保存对话失败:', error);
      // 静默失败，不影响用户体验
    }
  };

  // 加载对话历史
  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    
    try {
      const response = await getConversations({ page: 1, pageSize: 100 });
      
      // 转换后端数据格式为前端格式
      const sessions: ChatSession[] = response.data.items.map(item => ({
        id: item.id,
        title: item.title,
        lastMessage: item.lastMessage || '',
        timestamp: new Date(item.lastMessageAt || item.createdAt),
        messages: [], // 消息会在加载会话详情时获取
        conversationId: item.cozeConversationId || undefined,
        messageCount: item.messageCount
      }));
      
      setChatSessions(sessions);
      console.log('✅ 从后端加载了', sessions.length, '个会话');
    } catch (error) {
      console.error('加载对话历史失败:', error);
      toast.error('加载历史会话失败');
      // 如果加载失败，设置为空数组
      setChatSessions([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 加载特定会话
  const loadChatSession = async (sessionId: number | string) => {
    try {
      if (typeof sessionId !== 'number') {
        console.error('无效的会话ID:', sessionId);
        return;
      }
      
      // 防止重复加载同一个会话
      if (sessionId === currentSessionId) {
        console.log('⚠️ 已经是当前会话，跳过加载');
        return;
      }
      
      // 防止在加载中或发送中时切换会话
      if (isLoadingHistory || isTyping || isSending) {
        console.log('⚠️ 正在加载或发送中，跳过会话切换');
        return;
      }
      
      // 从后端加载会话详情
      const response = await getConversationDetail(sessionId);
      const sessionData = response.data;
      
      // 转换消息格式
      const apiMessages = sessionData.messages || [];
      const formattedMessages: Message[] = apiMessages.map(msg => ({
        id: msg.id?.toString() || `msg-${Date.now()}`,
        content: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.timestamp || Date.now()),
        suggestedQuestions: msg.suggestedQuestions
      }));
      
      // 添加欢迎消息到开头（如果没有）
      const welcomeMessage: Message = {
        id: 'welcome',
        content: '你好！我是你的智能学习助手 🤖\n\n我可以帮助你：\n\n• 解答学科问题\n• 讲解知识点\n• 辅导作业难题\n• 提供学习建议\n\n有什么可以帮助你的吗？',
        sender: 'assistant',
        timestamp: new Date(sessionData.createdAt),
      };
      
      setMessages([welcomeMessage, ...formattedMessages]);
      setCurrentSessionId(sessionData.id);
      const loadedConversationId = sessionData.cozeConversationId || '';
      setCurrentConversationId(loadedConversationId);
      
      // 更新已保存消息数量（历史会话的消息都已保存）
      savedMessageCountRef.current = formattedMessages.length;
      
      console.log('📂 加载历史会话');
      console.log('   会话ID:', sessionId);
      console.log('   Coze会话ID:', loadedConversationId || '无');
      console.log('   消息数量:', formattedMessages.length);
      console.log('   已保存消息数:', savedMessageCountRef.current);
      console.log('   ⚠️ 注意:', loadedConversationId ? '可以继续对话并保持上下文' : '继续对话将创建新的上下文');
      
      // 在移动设备上，加载会话后关闭侧边栏
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('❌ 加载会话失败:', error);
      toast.error('加载会话失败，请重试');
    }
  };

  // 创建新会话
  const createNewSession = async () => {
    // 防止在加载中或发送中时创建新会话
    if (isLoadingHistory || isTyping || isSending) {
      console.log('⚠️ 正在加载或发送中，跳过创建新会话');
      return;
    }
    
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      content: '你好！我是你的智能学习助手 🤖\n\n我可以帮助你：\n\n• 解答学科问题\n• 讲解知识点\n• 辅导作业难题\n• 提供学习建议\n\n有什么可以帮助你的吗？',
      sender: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    setCurrentSessionId(null);
    setCurrentConversationId(''); // 清空会话ID
    savedMessageCountRef.current = 0; // 重置已保存消息数量
    
    console.log('🆕 创建新会话');
    console.log('   已清空conversation_id');
    console.log('   已重置保存计数器');
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
  const deleteSession = async (sessionId: number | string) => {
    try {
      if (typeof sessionId === 'number') {
        // 调用后端API删除
        await deleteConversationApi(sessionId);
        toast.success('会话已删除');
      }
      
      // 从本地列表移除
      const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
      setChatSessions(updatedSessions);
      
      // 如果删除的是当前会话，创建新会话
      if (sessionId === currentSessionId) {
        createNewSession();
      }
    } catch (error) {
      console.error('删除会话失败:', error);
      toast.error('删除会话失败');
    }
  };


  // 发送消息（支持自动发送传入的问题）
  const handleSendMessage = useCallback(async (autoQuestion?: string) => {
    const messageContent = autoQuestion || inputValue.trim();
    const now = Date.now();
    
    console.log('🎯 handleSendMessage 被调用', {
      content: messageContent?.substring(0, 20),
      timestamp: new Date().toLocaleTimeString(),
      isAuto: !!autoQuestion
    });
    
    // 🔒 多重防护机制
    // 1. 内容检查
    if (!messageContent) {
      console.log('⚠️ 阻止发送：内容为空');
      return;
    }
    
    // 2. 状态检查
    if (isTyping || isSending) {
      console.log('⚠️ 阻止重复发送：正在处理中', { isTyping, isSending });
      return;
    }
    
    // 3. 时间戳防抖检查（500ms内不允许重复发送）
    if (now - lastSendTimeRef.current < 500) {
      console.log('⚠️ 阻止重复发送：发送过于频繁', {
        timeSinceLastSend: now - lastSendTimeRef.current,
        minInterval: 500
      });
      return;
    }
    
    console.log('✅ 通过所有检查，开始发送消息');
    
    // 🔒 立即上锁并记录时间戳
    lastSendTimeRef.current = now;
    setIsSending(true);
    
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
    const historyMessages = messagesRef.current
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
      
      // 💾 保存这一轮对话（用户消息 + AI回复）
      await saveNewMessages([userMessage, assistantMessage]);
      
      // 🔓 释放锁
      setIsSending(false);
      
    } catch (error) {
      console.error('❌ 发送消息失败:', error);
      setIsTyping(false);
      setStreamingText('');
      
      // 🔓 释放锁
      setIsSending(false);
      
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
  }, [inputValue, isTyping, isSending, currentConversationId]);

  // 处理键盘事件（使用 onKeyDown，onKeyPress 已废弃）
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // 只有在非发送状态时才允许发送
      if (!isTyping && !isSending && inputValue.trim()) {
        handleSendMessage();
      }
    }
  }, [isTyping, isSending, inputValue, handleSendMessage]);

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

  // 注意：内容清理已在 API 层（learningAssistantApi.ts 的 cleanResponseText）完成
  // 这里不需要重复清理，直接渲染即可

  // Markdown 渲染组件（支持数学公式）
  const MarkdownRenderer = ({ content }: { content: string }) => {
    return (
      <div className="markdown-content prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
          components={{
            // 自定义标题渲染
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-2">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-1">
                {children}
              </h4>
            ),
            // 段落
            p: ({ children }) => (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                {children}
              </p>
            ),
            // 无序列表
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 my-3 text-gray-700 dark:text-gray-300">
                {children}
              </ul>
            ),
            // 有序列表
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1 my-3 text-gray-700 dark:text-gray-300">
                {children}
              </ol>
            ),
            // 列表项
            li: ({ children }) => (
              <li className="leading-relaxed ml-2">
                {children}
              </li>
            ),
            // 粗体
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900 dark:text-white">
                {children}
              </strong>
            ),
            // 斜体
            em: ({ children }) => (
              <em className="italic text-gray-800 dark:text-gray-200">
                {children}
              </em>
            ),
            // 行内代码
            code: ({ inline, children }: any) => {
              if (inline) {
                return (
                  <code className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-mono border border-blue-200 dark:border-blue-800">
                    {children}
                  </code>
                );
              }
              return <code className="font-mono text-sm">{children}</code>;
            },
            // 代码块
            pre: ({ children }: any) => {
              const [copied, setCopied] = useState(false);
              
              const handleCopy = () => {
                const code = children?.props?.children;
                if (code) {
                  navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              };
              
              return (
                <div className="relative group my-4">
                  <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg p-4 overflow-x-auto border border-gray-700">
                    {children}
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copied ? '已复制!' : '复制'}
                  </button>
                </div>
              );
            },
            // 引用块
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 my-3 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic">
                {children}
              </blockquote>
            ),
            // 表格
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-50 dark:bg-gray-800">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                {children}
              </td>
            ),
            // 链接
            a: ({ href, children }: any) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                {children}
                <i className="fa-solid fa-external-link-alt ml-1 text-xs"></i>
              </a>
            ),
            // 水平线
            hr: () => (
              <hr className="my-4 border-t border-gray-300 dark:border-gray-700" />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // 过滤会话列表
  const filteredSessions = searchQuery
    ? chatSessions.filter(session => 
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chatSessions;

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="flex-shrink-0 z-40 bg-white dark:bg-gray-800 shadow-sm">
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
      
      {/* 主内容区 - 固定高度，防止页面扩展 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 侧边栏 - 会话列表（固定高度，独立滚动） */}
        <aside 
          className={`w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
            showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0'
          } fixed lg:static h-[calc(100vh-4rem)] z-30`}
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
              type="button"
              onClick={createNewSession}
              disabled={isLoadingHistory || isTyping || isSending}
              className={`w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm ${
                isLoadingHistory || isTyping || isSending ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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
                  onClick={() => {
                    if (!isLoadingHistory && !isTyping && !isSending) {
                      loadChatSession(session.id);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer ${
                    currentSessionId === session.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : ''
                  } ${isLoadingHistory || isTyping || isSending ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-800 dark:text-white truncate w-48">{session.title}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLoadingHistory && !isTyping && !isSending) {
                            deleteSession(session.id);
                          }
                        }}
                        disabled={isLoadingHistory || isTyping || isSending}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
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
        
        {/* 聊天区域（固定高度，独立滚动） */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 聊天内容（独立滚动区域） */}
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
                        <MarkdownRenderer content={message.content} />
                      )}
                    </div>
                    
                    {/* 建议问题按钮 - 仅在空闲时显示 */}
                    {!isTyping && !isSending && message.sender === 'assistant' && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestedQuestions.map((question, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isTyping && !isSending) {
                                handleSendMessage(question);
                              }
                            }}
                            className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm border border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 transition-all hover:shadow-md hover:scale-105 flex items-center space-x-1"
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
                          <div className="flex-1">
                            <MarkdownRenderer content={streamingText} />
                          </div>
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
          
          {/* 输入区域（固定底部） */}
          <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-3xl mx-auto">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入你的问题..."
                  disabled={isTyping || isSending}
                  className={`flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                    (isTyping || isSending) ? 'opacity-70' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isTyping && !isSending && inputValue.trim()) {
                      handleSendMessage();
                    }
                  }}
                  disabled={!inputValue.trim() || isTyping || isSending}
                  className={`p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors ${
                    (!inputValue.trim() || isTyping || isSending) ? 'opacity-50 cursor-not-allowed' : ''
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
      
      {/* 页脚（可选，聊天界面通常不需要） */}
      {/* <footer className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 智慧教辅系统 - 智能学习助手</p>
        </div>
      </footer> */}
      
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