import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

// 定义消息接口
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

// 定义会话接口
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

export default function StudentLearningAssistant() {
  const { user, logout } = useContext(AuthContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 初始化欢迎消息
  useEffect(() => {
    // 创建初始欢迎消息
    const welcomeMessage: Message = {
      id: 'welcome',
      content: '你好！我是你的智能学习助手，有什么可以帮助你的吗？',
      sender: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    
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

  // 监听消息变化，自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      saveCurrentChat();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [messages, currentSessionId]);

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
        }
      } else {
        // 创建新会话
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: generateSessionTitle(messages),
          lastMessage: messages[messages.length - 1].content,
          timestamp: new Date(),
          messages: [...messages],
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
        
        // 在移动设备上，加载会话后关闭侧边栏
        if (window.innerWidth < 768) {
          setShowSidebar(false);
        }
      }
    } catch (error) {
      console.error('加载会话失败:', error);
      toast.error('加载会话失败，请重试');
    }
  };

  // 创建新会话
  const createNewSession = () => {
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      content: '你好！我是你的智能学习助手，有什么可以帮助你的吗？',
      sender: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    setCurrentSessionId(null);
    
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

  // 发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim() || isTyping) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // 模拟助手回复
    setTimeout(() => {
      let assistantResponse: string;
      
      // 根据用户输入内容生成不同的回复
      if (inputValue.toLowerCase().includes('你好') || inputValue.toLowerCase().includes('hello')) {
        assistantResponse = '你好！我是你的智能学习助手，有什么可以帮助你的吗？';
      } else if (inputValue.toLowerCase().includes('数学') || inputValue.toLowerCase().includes('函数') || inputValue.toLowerCase().includes('方程')) {
        assistantResponse = '数学是一门很有趣的学科！你是在学习函数、几何、代数还是其他内容？我可以帮你解答具体的数学问题。';
      } else if (inputValue.toLowerCase().includes('英语') || inputValue.toLowerCase().includes('grammar') || inputValue.toLowerCase().includes('语法')) {
        assistantResponse = '英语学习需要不断积累。你是在学习语法、词汇、听力还是阅读？告诉我你具体的问题，我会尽力帮助你。';
      } else if (inputValue.toLowerCase().includes('物理') || inputValue.toLowerCase().includes('化学') || inputValue.toLowerCase().includes('生物')) {
        assistantResponse = '自然科学探索世界的规律很有意思！你有什么具体的问题想要探讨吗？';
      } else {
        assistantResponse = `谢谢你的提问！关于"${inputValue}"这个话题，我可以为你提供更多信息。你可以问我更具体的问题，我会尽力帮助你。`;
      }
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: assistantResponse,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
                
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 hidden group-hover:block border border-gray-200 dark:border-gray-700">
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
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block rounded-2xl p-4 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* 正在输入提示 */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] text-left">
                    <div className="inline-block rounded-2xl p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 输入区域 */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-3xl mx-auto">
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
                  onClick={handleSendMessage}
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