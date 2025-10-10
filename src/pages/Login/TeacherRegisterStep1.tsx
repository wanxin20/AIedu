import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';

// 模拟班级数据
const classData = [
  { id: 1, name: '高一(1)班' },
  { id: 2, name: '高一(2)班' },
  { id: 3, name: '高二(1)班' },
  { id: 4, name: '高二(2)班' },
  { id: 5, name: '高三(1)班' },
  { id: 6, name: '高三(2)班' },
];

// 模拟学科数据
const subjectData = [
  { id: 1, name: '数学' },
  { id: 2, name: '语文' },
  { id: 3, name: '英语' },
  { id: 4, name: '物理' },
  { id: 5, name: '化学' },
  { id: 6, name: '生物' },
  { id: 7, name: '历史' },
  { id: 8, name: '地理' },
  { id: 9, name: '政治' },
];

export default function TeacherRegisterStep1() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [className, setClassName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // 验证手机号格式
  const isValidPhone = (phoneNumber: string) => {
    return /^1[3-9]\d{9}$/.test(phoneNumber);
  };

  // 处理班级选择
  const handleClassSelect = (classId: number, className: string) => {
    setSelectedClass(classId);
    setClassName(className);
    setShowClassDropdown(false);
  };

  // 处理学科选择
  const handleSubjectSelect = (subjectId: number, subjectName: string) => {
    setSelectedSubject(subjectId);
    setSubjectName(subjectName);
    setShowSubjectDropdown(false);
  };

  // 处理下一步
  const handleNext = () => {
    if (!isValidPhone(phone)) {
      toast.error('请输入有效的手机号');
      return;
    }

    if (!selectedClass) {
      toast.error('请选择所在班级');
      return;
    }

    if (!selectedSubject) {
      toast.error('请选择教学学科');
      return;
    }

    // 存储第一步数据到localStorage，供第二步使用
    localStorage.setItem('register_teacher_step1', JSON.stringify({
      phone,
      classId: selectedClass,
      className,
      subjectId: selectedSubject,
      subjectName
    }));

    navigate('/register/teacher/step2');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                <i className="fa-solid fa-chalkboard-user text-green-600 dark:text-green-400 text-3xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">教师注册</h1>
              <p className="text-gray-500 dark:text-gray-400">第一步：基本信息填写</p>
              
              {/* 进度指示器 */}
              <div className="flex items-center justify-center mt-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">1</div>
                  <div className="w-16 h-1 bg-green-600 mx-2"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center">2</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* 手机号输入框 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  手机号
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-phone text-gray-400"></i>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={11}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white transition-colors"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>
              
              {/* 班级选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  所在班级
                </label>
                <div 
                  className="relative"
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-building text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    value={className}
                    readOnly
                    placeholder="请选择班级"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white transition-colors cursor-pointer"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${showClassDropdown ? 'rotate-180' : ''}`}></i>
                  </div>
                  
                  {showClassDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                      {classData.map((cls) => (
                        <div 
                          key={cls.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClassSelect(cls.id, cls.name);
                          }}
                          className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          {cls.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 学科选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  教学学科
                </label>
                <div 
                  className="relative"
                  onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-book text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    value={subjectName}
                    readOnly
                    placeholder="请选择教学学科"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white transition-colors cursor-pointer"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`}></i>
                  </div>
                  
                  {showSubjectDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                      {subjectData.map((subject) => (
                        <div 
                          key={subject.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubjectSelect(subject.id, subject.name);
                          }}
                          className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          {subject.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 下一步按钮 */}
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading || !phone || !selectedClass || !selectedSubject}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isLoading || !phone || !selectedClass || !selectedSubject
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    处理中...
                  </>
                ) : (
                  '下一步'
                )}
              </button>
              
              {/* 已有账号 */}
              <div className="text-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">已有账号？</span>
                <Link 
                  to="/login" 
                  className="text-green-600 dark:text-green-400 hover:underline ml-1"
                >
                  前往登录
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}