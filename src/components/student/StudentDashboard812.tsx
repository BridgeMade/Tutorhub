import React, { useState } from 'react';
import { Calendar, BookOpen, MessageCircle, TrendingUp, User, Clock, FileText, Download, Upload, Bell, Trophy, Star, Target, Award, CheckCircle, BarChart3, PieChart, Users, Brain, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { 
  MdPictureAsPdf, 
  MdVideoLibrary, 
  MdLink, 
  MdRefresh, 
  MdMoreHoriz,
  MdSchedule,
  MdUpload,
  MdDownload
} from 'react-icons/md';
import { BottomNavigation, getStudentNavigationTabs } from '../common/BottomNavigation';
import { MobileMessaging } from '../messaging/MobileMessaging';
import { AppHeader } from '../common/AppHeader';
import { SessionCalendarView } from './SessionCalendarView';
import { TutoringSession, DashboardStats, Student } from '../../types';

interface UpcomingLesson {
  id: string;
  subject: string;
  time: string;
  tutor: string;
  duration: string;
  type: 'online' | 'in-person';
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
}

interface Material {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'link';
  subject: string;
  uploadedBy: string;
  date: string;
}

interface RecentActivity {
  id: string;
  type: 'session' | 'assignment' | 'message' | 'material';
  title: string;
  description: string;
  time: string;
  subject?: string;
}

interface StudentDashboard812Props {
  studentName: string;
  grade: string;
  student?: Student;
  upcomingSessions?: TutoringSession[];
  stats?: DashboardStats;
}

const StudentDashboard812: React.FC<StudentDashboard812Props> = ({
  studentName = 'Sophia',
  grade = '8',
  student,
  upcomingSessions = [],
  stats
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [assignmentFilter, setAssignmentFilter] = useState<'All' | 'School' | 'Tutor'>('All');
  const [activityFilter, setActivityFilter] = useState<'All' | 'Sessions' | 'Homework'>('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Convert TutoringSession to UpcomingLesson format
  const convertToUpcomingLessons = (sessions: TutoringSession[]): UpcomingLesson[] => {
    return sessions.map(session => ({
      id: session.id,
      subject: session.subject,
      time: new Date(session.scheduledAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      tutor: `Tutor ${session.tutorId.slice(0, 8)}`, // Placeholder - would need tutor name lookup
      duration: `${session.duration} min`,
      type: session.sessionType === 'individual' || session.sessionType === 'group' ? 'in-person' : 'online'
    }));
  };

  const upcomingLessons = convertToUpcomingLessons(upcomingSessions);
  
  // Mock data fallback for demo - remove in production
  const mockLessons: UpcomingLesson[] = [
    {
      id: '1',
      subject: 'Biology',
      time: '3 hours',
      tutor: 'Dr. Williams',
      duration: '1 hour',
      type: 'online'
    },
    {
      id: '2',
      subject: 'Mathematics',
      time: 'Tomorrow 2:00 PM',
      tutor: 'Ms. Rodriguez',
      duration: '1 hour',
      type: 'in-person'
    }
  ];

  // Use real data if available, otherwise fallback to mock data
  const lessonsToShow = upcomingLessons.length > 0 ? upcomingLessons : mockLessons;

  const [assignments] = useState<(Assignment & { source: 'School' | 'Tutor' })[]>([
    {
      id: '1',
      title: 'Cell Structure Report',
      subject: 'Biology',
      dueDate: 'Tomorrow',
      status: 'pending',
      source: 'School'
    },
    {
      id: '2',
      title: 'Algebra Problem Set 5',
      subject: 'Mathematics',
      dueDate: 'Friday',
      status: 'submitted',
      source: 'Tutor'
    },
    {
      id: '3',
      title: 'Shakespeare Essay',
      subject: 'English',
      dueDate: 'Next Week',
      status: 'graded',
      grade: 'A-',
      source: 'School'
    },
    {
      id: '4',
      title: 'Mock Test - Calculus',
      subject: 'Mathematics',
      dueDate: 'Monday',
      status: 'pending',
      source: 'Tutor'
    }
  ]);

  const [materials] = useState<Material[]>([
    {
      id: '1',
      name: 'Cell Biology Notes.pdf',
      type: 'pdf',
      subject: 'Biology',
      uploadedBy: 'Dr. Williams',
      date: 'Yesterday'
    },
    {
      id: '2',
      name: 'Quadratic Equations Video',
      type: 'video', 
      subject: 'Mathematics',
      uploadedBy: 'Ms. Rodriguez',
      date: '2 days ago'
    }
  ]);

  const [recentActivities] = useState<(RecentActivity & { category: 'Sessions' | 'Homework' | 'Materials' })[]>([
    {
      id: '1',
      type: 'session',
      title: 'Biology session completed',
      description: 'Excellent understanding of cellular respiration!',
      time: '2 hours ago',
      subject: 'Biology',
      category: 'Sessions'
    },
    {
      id: '2',
      type: 'assignment',
      title: 'Math homework submitted',
      description: 'Algebra Problem Set 4 turned in on time',
      time: '1 day ago',
      subject: 'Mathematics',
      category: 'Homework'
    },
    {
      id: '3',
      type: 'material',
      title: 'New mock test available',
      description: 'Calculus Mock Test downloaded',
      time: '1 day ago',
      subject: 'Mathematics',
      category: 'Materials'
    },
    {
      id: '4',
      type: 'material',
      title: 'New study materials shared',
      description: 'Cell Biology Notes.pdf uploaded by Dr. Williams',
      time: '2 days ago',
      subject: 'Biology',
      category: 'Materials'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <Calendar className="w-4 h-4 text-[--tk-blue-600]" />;
      case 'assignment':
        return <FileText className="w-4 h-4 text-[--tk-green-500]" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-purple-600" />;
      case 'material':
        return <BookOpen className="w-4 h-4 text-[--tk-orange-gradient-start]" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <MdPictureAsPdf size={20} />;
      case 'video':
        return <MdVideoLibrary size={20} />;
      case 'link':
        return <MdLink size={20} />;
      default:
        return <MdPictureAsPdf size={20} />;
    }
  };

  // Filter functions
  const filteredAssignments = assignments.filter(assignment => 
    assignmentFilter === 'All' || assignment.source === assignmentFilter
  );

  const filteredActivities = recentActivities.filter(activity => 
    activityFilter === 'All' || activity.category === activityFilter
  );


  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleSettingsClick = () => {
    setActiveTab('settings');
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'book':
        setActiveTab('lessons');
        // Could also show a booking modal in the future
        break;
      case 'reschedule':
        setActiveTab('lessons');
        // Navigate to lessons where they can manage existing bookings
        break;
      case 'upload':
        setActiveTab('progress');
        // Navigate to progress where they can upload homework/assignments
        break;
      case 'download':
        setActiveTab('progress');
        // Navigate to progress where they can access downloaded materials
        break;
      default:
        break;
    }
  };

  const handleLessonAction = (action: string, lessonId?: string) => {
    console.log('Lesson action:', action, lessonId);
    switch (action) {
      case 'view':
        // Navigate to lesson details
        break;
      case 'message':
        // Open messaging with tutor
        setActiveTab('messages');
        break;
      default:
        break;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'lessons':
        return renderLessonsContent();
      case 'progress':
        return renderProgressContent();
      case 'messages':
        return renderMessagesContent();
      case 'profile':
        return renderProfileContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* App Header */}
      <AppHeader 
        firstName={studentName}
        userRole="student"
        notificationCount={2}
        onNotificationClick={handleNotificationClick}
        onSettingsClick={handleSettingsClick}
        onProfileClick={handleProfileClick}
      />

      {/* Notifications Popup */}
      {showNotifications && (
        <div className="absolute top-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium">Math lesson reminder</p>
                <p className="text-xs text-gray-600">Tomorrow at 3:00 PM with Ms. Rodriguez</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium">Assignment graded</p>
                <p className="text-xs text-gray-600">Your Shakespeare essay received an A-</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Menu */}
      {showProfileMenu && (
        <div className="absolute top-16 right-4 bg-white shadow-lg rounded-lg border border-gray-200 z-50 w-48">
          <div className="p-2">
            <button 
              onClick={() => setActiveTab('profile')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
            >
              View Profile
            </button>
            <button 
              onClick={() => {
                // Clear any stored authentication data
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userId');
                // Redirect to login page
                window.location.href = '/login';
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <div className="px-6 py-4 space-y-6">
        {/* Upcoming Tutoring Sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-black">
              Upcoming Tutoring Sessions
            </h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('lessons')}
                className="text-blue-600 text-[14px] font-medium hover:text-blue-700 transition-colors"
              >
                View Calendar
              </button>
            </div>
          </div>
          
          {/* Horizontal Swipe Lessons - Matching K-7 interaction */}
          {lessonsToShow.length > 0 ? (
            <div className="overflow-x-auto snap-x snap-mandatory pr-6 -mr-6 scrollbar-hide pb-2">
              <div className="flex gap-4">
                {lessonsToShow.map((lesson) => (
                  <div key={lesson.id} className="relative w-[292px] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] snap-start overflow-hidden flex-shrink-0 bg-white">
                    {/* Slate gradient top panel - mature styling */}
                    <div 
                      className="px-4 py-3 rounded-t-2xl relative bg-gradient-to-r from-slate-700 to-slate-800"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-[16px] font-semibold text-white tracking-tight leading-tight">{lesson.subject}</h3>
                          <p className="text-[14px] text-white/80 mt-0.5 font-medium">{lesson.duration} session</p>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* White bottom panel */}
                    <div className="bg-white px-4 py-3 rounded-b-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] text-gray-600 font-medium">Tutor: {lesson.tutor}</span>
                        <span className="text-[13px] font-semibold text-black tracking-tight">{lesson.time}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLessonAction('view', lesson.id)}
                          className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-[13px] font-medium hover:bg-gray-50 transition-colors min-h-[44px] flex items-center justify-center"
                        >
                          Join
                        </button>
                        <button
                          onClick={() => handleLessonAction('message', lesson.id)}
                          className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 text-[13px] font-medium hover:bg-slate-800 transition-colors min-h-[44px] flex items-center justify-center"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add lesson card at the end */}
                <div className="relative w-[292px] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] snap-start overflow-hidden flex-shrink-0 bg-gray-50 border-2 border-dashed border-gray-200">
                  <div 
                    onClick={() => handleQuickAction('book')}
                    className="h-full p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Calendar className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium text-center">Book your next lesson</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No upcoming lessons</p>
              <button 
                onClick={() => handleQuickAction('book')}
                className="mt-3 bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Book a Lesson
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-4 gap-3">
            <button 
              onClick={() => handleQuickAction('book')}
              className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors active:scale-95"
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Calendar size={20} />
              </div>
              <span className="text-[12px] font-medium">
                Book
              </span>
            </button>
            
            <button 
              onClick={() => handleQuickAction('reschedule')}
              className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors active:scale-95"
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Clock size={20} />
              </div>
              <span className="text-[12px] font-medium">
                Reschedule
              </span>
            </button>
            
            <button 
              onClick={() => handleQuickAction('upload')}
              className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors active:scale-95"
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Upload size={20} />
              </div>
              <span className="text-[12px] font-medium">
                Upload
              </span>
            </button>
            
            <button 
              onClick={() => handleQuickAction('download')}
              className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors active:scale-95"
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <Download size={20} />
              </div>
              <span className="text-[12px] font-medium">
                Download
              </span>
            </button>
          </div>
        </div>

        {/* Homework & Assignments */}
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            Homework & Assignments
          </h2>
          
          <div className="space-y-3">
            {/* Cell Structure Report */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-black">Cell Structure Report</h3>
                  <p className="text-[14px] text-gray-600">Biology - Biology</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-medium text-black">Due tomorrow</p>
              </div>
            </div>

            {/* Algebra Set 5 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-black">Algebra Set 5</h3>
                  <p className="text-[14px] text-gray-600">Mathematics - Tutor</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-medium text-black">Due Friday</p>
              </div>
            </div>

            {/* Shakespeare Essay */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-black">Shakespeare Essay</h3>
                  <p className="text-[14px] text-gray-600">English - English</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-medium text-black">Next week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress & Achievements */}
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            Progress & Achievements
          </h2>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="mb-4">
              <div className="text-[16px] font-semibold text-black mb-2">
                ✔ {stats ? `${Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100)}%` : '80%'} tasks complete this week
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${stats ? Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100) : 80}%` 
                  }}
                ></div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-[20px]">🏆</span>
                <span className="text-[12px] font-medium text-blue-600">
                  {stats?.completedSessions || 3} Sessions Complete
                </span>
              </div>
              {stats?.avgRating && (
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                  <span className="text-[20px]">⭐</span>
                  <span className="text-[12px] font-medium text-yellow-600">
                    {stats.avgRating.toFixed(1)} Avg Rating
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-black">
              Recent Activity
            </h2>
            <div className="flex gap-2">
              {(['All', 'Sessions', 'Homework'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`text-[13px] rounded-full px-3 py-1 border-none cursor-pointer font-medium transition-all duration-200 active:scale-95 ${
                    activityFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              {/* Biology session completed */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-semibold text-black">
                    ✔ Biology session completed
                  </div>
                  <div className="text-[14px] text-gray-600">
                    "Excellent understanding of cellular respiration!"
                  </div>
                  <div className="text-[13px] text-blue-600 mt-1">
                    Biology
                  </div>
                </div>
                <div className="text-[13px] text-gray-500">
                  2 hours ago
                </div>
              </div>

              {/* Math homework submitted */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  <FileText className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-semibold text-black">
                    📝 Math homework submitted
                  </div>
                  <div className="text-[14px] text-gray-600">
                    On time submission
                  </div>
                  <div className="text-[13px] text-blue-600 mt-1">
                    Mathematics
                  </div>
                </div>
                <div className="text-[13px] text-gray-500">
                  1 day ago
                </div>
              </div>

              {/* New mock test available */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-semibold text-black">
                    📄 New mock test available
                  </div>
                  <div className="text-[14px] text-gray-600">
                    Downloaded and ready for practice
                  </div>
                  <div className="text-[13px] text-blue-600 mt-1">
                    Mathematics
                  </div>
                </div>
                <div className="text-[13px] text-gray-500">
                  2 days ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLessonsContent = () => (
    <div className="bg-gray-50 min-h-full pb-20">
      {/* Header with padding */}
      <div className="px-6 py-6">
        <h1 className="text-[28px] font-bold text-black mb-2">Lessons</h1>
        <p className="text-gray-600">View your lesson schedule</p>
      </div>

      {/* Calendar - no side padding for full width */}
      <SessionCalendarView
        sessions={upcomingSessions}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onSessionClick={(session) => {
          console.log('Session clicked:', session);
          // Could navigate to lesson details or show modal
        }}
      />

      {/* Upcoming Lessons List */}
      <div className="px-6 py-6 space-y-4">
        <h2 className="text-[20px] font-semibold text-black">Upcoming Lessons</h2>
        {lessonsToShow.length > 0 ? (
          <div className="space-y-3">
            {lessonsToShow.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold text-black">{lesson.subject}</h3>
                    <p className="text-[14px] text-gray-600">{lesson.duration} session • {lesson.time}</p>
                    <p className="text-[12px] text-gray-500">with {lesson.tutor}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleLessonAction('view', lesson.id)}
                      className="bg-slate-700 text-white px-3 py-2 rounded-lg text-[12px] font-medium hover:bg-slate-800 transition-colors"
                    >
                      Join
                    </button>
                    <button 
                      onClick={() => handleLessonAction('message', lesson.id)}
                      className="text-gray-700 px-3 py-2 rounded-lg text-[12px] font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No upcoming lessons</p>
            <button 
              onClick={() => handleQuickAction('book')}
              className="mt-4 bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Book a Lesson
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProgressContent = () => {
    // Calculate subject progress based on stats
    const getSubjectProgress = () => {
      const subjects = [
        { 
          name: 'Mathematics', 
          progress: stats?.completedSessions ? Math.min(Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100), 100) : 78, 
          color: 'bg-blue-600', 
          bgColor: 'bg-blue-50',
          trend: '+5%'
        },
        { 
          name: 'Science', 
          progress: stats?.avgRating ? Math.round(stats.avgRating * 20) : 85, 
          color: 'bg-green-600', 
          bgColor: 'bg-green-50',
          trend: '+12%'
        },
        { 
          name: 'English', 
          progress: 82, 
          color: 'bg-purple-600', 
          bgColor: 'bg-purple-50',
          trend: '+3%'
        },
        { 
          name: 'Biology', 
          progress: 88, 
          color: 'bg-teal-600', 
          bgColor: 'bg-teal-50',
          trend: '+8%'
        }
      ];
      return subjects;
    };

    const subjectProgress = getSubjectProgress();
    const attendanceRate = stats ? Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100) : 92;
    const currentStreak = stats?.upcomingSessions || 7;
    const completionRate = stats ? Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100) : 85;

    return (
      <div className="bg-gray-50 min-h-full pb-20">
        {/* Header */}
        <div className="px-6 py-6">
          <h1 className="text-[28px] font-bold text-black mb-2">Academic Progress</h1>
          <p className="text-gray-600">Track your learning journey and achievements</p>
        </div>

        <div className="px-6 space-y-6">
          {/* Weekly Overview Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-black">This Week's Performance</h3>
                  <p className="text-[14px] text-gray-600">Your learning metrics</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-[24px] font-bold text-blue-600">{attendanceRate}%</div>
                <div className="text-[12px] text-gray-600 mt-1">Attendance Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-[24px] font-bold text-green-600">{currentStreak}</div>
                <div className="text-[12px] text-gray-600 mt-1">Day Streak</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-[24px] font-bold text-orange-600">{completionRate}%</div>
                <div className="text-[12px] text-gray-600 mt-1">Tasks Complete</div>
              </div>
            </div>
          </div>

          {/* Subject Performance */}
          <section>
            <h2 className="text-[20px] font-semibold text-black mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Subject Performance
            </h2>
            
            <div className="space-y-4">
              {subjectProgress.map((subject, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 ${subject.color} rounded-full`}></div>
                      <span className="text-[16px] font-medium text-black">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-green-600 font-medium">{subject.trend}</span>
                      <span className="text-[16px] font-semibold text-black">{subject.progress}%</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${subject.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Achievement Progress */}
          <section>
            <h2 className="text-[20px] font-semibold text-black mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Achievements & Recognition
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-7 h-7 text-yellow-600" />
                </div>
                <div className="text-[14px] font-semibold text-black mb-1">Honor Roll</div>
                <div className="text-[12px] text-gray-600">Consistent excellence</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="w-7 h-7 text-blue-600" />
                </div>
                <div className="text-[14px] font-semibold text-black mb-1">Top Performer</div>
                <div className="text-[12px] text-gray-600">Mathematics excellence</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div className="text-[14px] font-semibold text-black mb-1">Perfect Attendance</div>
                <div className="text-[12px] text-gray-600">Never missed a lesson</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-7 h-7 text-purple-600" />
                </div>
                <div className="text-[14px] font-semibold text-black mb-1">Goal Achiever</div>
                <div className="text-[12px] text-gray-600">Completed all targets</div>
              </div>
            </div>
          </section>

          {/* Weekly Goals & Targets */}
          <section>
            <h2 className="text-[20px] font-semibold text-black mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Weekly Goals & Targets
            </h2>
            
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-[14px] text-black line-through">Complete 4 tutoring sessions</span>
                  </div>
                  <span className="text-[12px] text-green-600 font-medium">Done</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-orange-300 rounded-full bg-orange-100">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mx-auto mt-0.5"></div>
                    </div>
                    <span className="text-[14px] text-black">Submit 3 assignments</span>
                  </div>
                  <span className="text-[12px] text-orange-600 font-medium">2/3</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    <span className="text-[14px] text-black">Complete practice test</span>
                  </div>
                  <span className="text-[12px] text-gray-500 font-medium">Pending</span>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 2: Detailed Performance Analytics */}
          <section>
            <h2 className="text-[20px] font-semibold text-black mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Performance Analytics
            </h2>
            
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-[32px] font-bold text-blue-600 mb-1">
                    {stats ? Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100) : 89}%
                  </div>
                  <div className="text-[12px] text-gray-600 mb-2">Assignment Success Rate</div>
                  <div className="flex items-center justify-center gap-1">
                    <ArrowUp className="w-3 h-3 text-green-500" />
                    <span className="text-[12px] text-green-600 font-medium">+7% this month</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-[32px] font-bold text-green-600 mb-1">
                    {stats?.avgRating ? stats.avgRating.toFixed(1) : '4.2'}
                  </div>
                  <div className="text-[12px] text-gray-600 mb-2">Average Grade (GPA)</div>
                  <div className="flex items-center justify-center gap-1">
                    <ArrowUp className="w-3 h-3 text-green-500" />
                    <span className="text-[12px] text-green-600 font-medium">+0.3 this term</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4">
                <div className="text-[14px] font-medium text-black mb-3">Weekly Study Time Breakdown</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">Mathematics</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-[12px] font-medium text-black">6.5h</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">Science</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-[12px] font-medium text-black">5.2h</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">English</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-[12px] font-medium text-black">3.8h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 2: Assignment Tracking & Management */}
          <section>
            <h2 className="text-[20px] font-semibold text-black mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Assignment Tracker
            </h2>
            
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="text-[16px] font-medium text-black">Cell Biology Lab Report</div>
                      <div className="text-[12px] text-gray-600">Biology • Due tomorrow</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-[12px] text-red-600 font-medium">Urgent</span>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-[12px] text-red-700 font-medium">Action needed: Submit draft for review</div>
                  <div className="text-[11px] text-red-600 mt-1">Estimated completion time: 2 hours</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="text-[16px] font-medium text-black">Calculus Problem Set 7</div>
                      <div className="text-[12px] text-gray-600">Mathematics • Due Friday</div>
                    </div>
                  </div>
                  <span className="text-[12px] text-blue-600 font-medium">In Progress</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[12px] text-blue-700 font-medium">Progress: 7/12 problems completed</div>
                    <div className="text-[12px] text-blue-600">58%</div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '58%' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="text-[16px] font-medium text-black">Shakespeare Analysis Essay</div>
                      <div className="text-[12px] text-gray-600">English • Submitted</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-[12px] text-green-600 font-medium">A-</span>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-[12px] text-green-700 font-medium">Excellent analysis of character development</div>
                  <div className="text-[11px] text-green-600 mt-1">Feedback: Strong thesis, well-supported arguments</div>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 2: AI Study Recommendations */}
          <section>
            <h2 className="text-[20px] font-semibold text-black mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Study Recommendations
            </h2>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-[16px] font-semibold text-black">Personalized Study Plan</div>
                  <div className="text-[12px] text-gray-600">Based on your performance patterns</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-[12px] font-bold text-red-600">!</span>
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-black mb-1">Focus Area: Biology</div>
                      <div className="text-[12px] text-gray-600 mb-2">Your cellular respiration scores are below average. Recommend 2 hours of focused study this week.</div>
                      <div className="text-[11px] text-blue-600 font-medium">Suggested: Review Chapter 8, complete practice quiz</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-black mb-1">Strength: Mathematics</div>
                      <div className="text-[12px] text-gray-600 mb-2">Excellent performance in calculus. Consider advancing to differentiation topics.</div>
                      <div className="text-[11px] text-purple-600 font-medium">Suggested: Challenge problems, peer tutoring opportunity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 2: Peer Comparison & Class Rankings */}
          <section>
            <h2 className="text-[20px] font-semibold text-black mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Class Performance Comparison
            </h2>
            
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="text-center mb-6">
                <div className="text-[24px] font-bold text-blue-600 mb-1">Top 15%</div>
                <div className="text-[14px] text-gray-600">Your class ranking</div>
                <div className="text-[12px] text-green-600 font-medium">↑ Improved 3 positions this month</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-[12px] font-bold text-blue-600">M</span>
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-black">Mathematics</div>
                      <div className="text-[12px] text-gray-600">Your average: 89%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold text-green-600">Above Average</div>
                    <div className="text-[12px] text-gray-600">Class avg: 82%</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-[12px] font-bold text-green-600">S</span>
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-black">Science</div>
                      <div className="text-[12px] text-gray-600">Your average: 78%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold text-orange-600">Below Average</div>
                    <div className="text-[12px] text-gray-600">Class avg: 85%</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-[12px] font-bold text-purple-600">E</span>
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-black">English</div>
                      <div className="text-[12px] text-gray-600">Your average: 91%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold text-green-600">Top Performer</div>
                    <div className="text-[12px] text-gray-600">Class avg: 79%</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-[12px] text-blue-700 font-medium">🎯 Goal: Move to Top 10% by end of term</div>
                <div className="text-[11px] text-blue-600 mt-1">Focus on Science improvement to reach your target</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderMessagesContent = () => (
    <div className="h-screen">
      <MobileMessaging 
        userId={student?.id || '1'}
        userRole="student"
        userName={student ? `${student.firstName} ${student.lastName}` : studentName}
      />
    </div>
  );

  const renderProfileContent = () => (
    <div className="px-6 py-6 space-y-6 bg-gray-50 min-h-full pb-20">
      <h1 className="text-[28px] font-bold text-black mb-6">Profile</h1>
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">{studentName[0]}</span>
        </div>
        <p className="text-black font-semibold text-lg">{studentName}</p>
        <p className="text-gray-600">Grade {grade} Student</p>
      </div>
    </div>
  );

  const renderSettingsContent = () => (
    <div className="px-6 py-6 space-y-6 bg-gray-50 min-h-full pb-20">
      <h1 className="text-[28px] font-bold text-black mb-6">Settings</h1>
      
      {/* Account Settings */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-[18px] font-semibold text-black mb-4">Account Settings</h2>
        <div className="space-y-3">
          <button className="w-full text-left px-3 py-2 text-[16px] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
            <span>Profile Information</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full text-left px-3 py-2 text-[16px] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
            <span>Password & Security</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-[18px] font-semibold text-black mb-4">Learning Preferences</h2>
        <div className="space-y-3">
          <button className="w-full text-left px-3 py-2 text-[16px] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
            <span>Notification Settings</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full text-left px-3 py-2 text-[16px] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
            <span>Study Reminders</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full text-left px-3 py-2 text-[16px] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
            <span>Privacy Settings</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Support */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-[18px] font-semibold text-black mb-4">Support & Help</h2>
        <div className="space-y-3">
          <button className="w-full text-left px-3 py-2 text-[16px] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
            <span>Help Center</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full text-left px-3 py-2 text-[16px] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
            <span>Contact Support</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderContent()}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={getStudentNavigationTabs()}
      />
    </div>
  );
};

export default StudentDashboard812;