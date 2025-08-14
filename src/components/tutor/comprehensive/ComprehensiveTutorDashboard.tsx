import React, { useState, useEffect, useRef } from 'react';
import { Tutor, TutoringSession, DashboardStats } from '../../../types';
import { EarningsAnalytics } from './EarningsAnalytics';
import { StudentManagement } from './StudentManagement';
import { ScheduleManagement } from './ScheduleManagement';
import { SessionCalendarView } from '../../student/SessionCalendarView';
import { TutorSessions } from '../TutorSessions';
import { formatZAR, formatSADateTime } from '../../../utils/saFormatting';
import { userService } from '../../../services/userService';

interface ComprehensiveTutorDashboardProps {
  tutor: Tutor;
  upcomingSessions: TutoringSession[];
  stats: DashboardStats;
  activeTab?: string;
}

export const ComprehensiveTutorDashboard: React.FC<ComprehensiveTutorDashboardProps> = ({
  tutor,
  upcomingSessions,
  stats,
  activeTab = 'dashboard'
}) => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [studentNames, setStudentNames] = useState<{[key: string]: string}>({});
  const [selectedWeekDay, setSelectedWeekDay] = useState<number>(10); // Default to today (middle index)
  const [showNotifications, setShowNotifications] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Sample notifications data
  const [notifications] = useState([
    {
      id: 1,
      title: "New message from Emma's parent",
      message: "Thank you for the great math session yesterday! Emma is really enjoying the lessons.",
      time: "2 minutes ago",
      type: "message" as const,
      read: false
    },
    {
      id: 2,
      title: "Session reminder",
      message: "You have a Chemistry session with Sophia in 30 minutes",
      time: "28 minutes ago",
      type: "reminder" as const,
      read: false
    },
    {
      id: 3,
      title: "Payment received",
      message: "Payment of R180 received for Math session with Michael",
      time: "1 hour ago",
      type: "payment" as const,
      read: false
    },
    {
      id: 4,
      title: "Session completed",
      message: "Great job! You completed a Reading session with Emma Johnson",
      time: "3 hours ago",
      type: "success" as const,
      read: true
    },
    {
      id: 5,
      title: "New student assignment",
      message: "You've been assigned a new student: Alex Thompson for Mathematics",
      time: "5 hours ago",
      type: "assignment" as const,
      read: true
    },
    {
      id: 6,
      title: "Performance milestone",
      message: "Congratulations! You've completed 50 tutoring sessions this month",
      time: "1 day ago",
      type: "achievement" as const,
      read: true
    },
    {
      id: 7,
      title: "Schedule update",
      message: "Your availability for next week has been updated successfully",
      time: "2 days ago",
      type: "system" as const,
      read: true
    },
    {
      id: 8,
      title: "New review received",
      message: "Sarah's parent left a 5-star review for your English sessions",
      time: "3 days ago",
      type: "review" as const,
      read: true
    }
  ]);
  
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Submit Lesson Reports",
      description: "Emma (Math) & Michael (Reading) reports overdue",
      dueTime: "6:00 PM",
      priority: "URGENT" as const,
      type: "ADMIN" as const,
      completed: false
    },
    {
      id: 2,
      title: "Prepare for Sophia's Chemistry Session",
      description: "Create practice problems for chemical equations",
      dueTime: "4:00 PM • for Sophia",
      priority: "HIGH" as const,
      type: "AUTO" as const,
      completed: false
    },
    {
      id: 3,
      title: "Monthly Performance Review",
      description: "Submit self-assessment and student feedback forms",
      dueTime: "Dec 20",
      priority: "MEDIUM" as const,
      type: "ADMIN" as const,
      completed: false
    }
  ]);

  // Handle clicking outside notifications popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Fetch student names for all sessions
  useEffect(() => {
    const fetchStudentNames = async () => {
      const studentIds = Array.from(new Set(upcomingSessions.map(session => session.studentId)));
      const nameMap: {[key: string]: string} = {};

      for (const studentId of studentIds) {
        const profile = await userService.getUserProfile(studentId);
        if (profile && profile.full_name) {
          nameMap[studentId] = profile.full_name;
        } else {
          nameMap[studentId] = 'Unknown Student';
        }
      }

      setStudentNames(nameMap);
    };

    if (upcomingSessions.length > 0) {
      fetchStudentNames();
    }
  }, [upcomingSessions]);

  const quickActions = [
    {
      id: 'schedule-session',
      title: 'Schedule Session',
      description: 'Book a new tutoring session',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'message-student',
      title: 'Message Student',
      description: 'Send a message to your students',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'update-availability',
      title: 'Update Availability',
      description: 'Modify your teaching schedule',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'create-resource',
      title: 'Create Resource',
      description: 'Add teaching materials',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-orange-400 to-orange-600'
    }
  ];

  const completeTask = (taskId: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      )
    );
  };

  const snoozeTask = (taskId: number) => {
    // For demo purposes, just show alert
    alert('Task snoozed for 1 hour');
  };

  const handleStartSession = (sessionType: string = 'online') => {
    if (sessionType === 'online') {
      alert('Starting online session... Opening virtual classroom');
    } else {
      alert('Getting directions to in-person session location');
    }
  };

  const handleMessageParent = (studentName: string) => {
    setCurrentTab('messages');
    // Could pass additional context to open specific conversation
  };

  const handleRescheduleSession = (sessionId: string) => {
    alert('Opening reschedule dialog for session');
    // Would typically open a modal or navigate to reschedule page
  };

  const handleSessionNotes = (sessionId: string) => {
    alert('Opening session notes for review/editing');
    // Would typically open notes modal or navigate to notes page
  };

  const handleViewSession = (session: any) => {
    setSelectedSession(session);
    setShowViewPopup(true);
  };

  const handleMessageSession = (session: any) => {
    setSelectedSession(session);
    setShowMessagePopup(true);
  };

  const getScrollableDays = () => {
    const today = new Date();
    const days = [];
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    // Generate 21 days (3 weeks) with today in the middle
    for (let i = -10; i <= 10; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push({
        name: dayNames[day.getDay()],
        date: day.getDate(),
        month: day.getMonth(),
        isToday: i === 0,
        dayIndex: i + 10, // Index for the array
        fullDate: day
      });
    }
    return days;
  };

  // Handle scroll to update selected day based on center position
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;
      const centerPosition = scrollLeft + (containerWidth / 2);
      
      // Find which day is closest to center
      let closestIndex = 0;
      let closestDistance = Infinity;
      
      Array.from(container.children).forEach((child, index) => {
        const element = child as HTMLElement;
        const elementCenter = element.offsetLeft + (element.offsetWidth / 2);
        const distance = Math.abs(elementCenter - centerPosition);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      
      if (closestIndex !== selectedWeekDay) {
        setSelectedWeekDay(closestIndex);
      }
    }
  };

  // Set up scroll listener and initial position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Add a style element to hide webkit scrollbar
      const styleId = 'scrollbar-hide-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .overflow-x-auto::-webkit-scrollbar {
            display: none;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Set initial scroll position to center today (index 10)
      setTimeout(() => {
        const containerWidth = container.offsetWidth;
        const itemWidth = 60;
        const gap = 8;
        const totalItemWidth = itemWidth + gap;
        const selectedItemPosition = selectedWeekDay * totalItemWidth + (itemWidth / 2);
        const scrollPosition = selectedItemPosition - (containerWidth / 2);
        container.scrollLeft = Math.max(0, scrollPosition);
      }, 100); // Small delay to ensure elements are rendered
      
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Update scroll position when selected day changes programmatically
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerWidth = container.offsetWidth;
      const itemWidth = 60;
      const gap = 8;
      const totalItemWidth = itemWidth + gap;
      const selectedItemPosition = selectedWeekDay * totalItemWidth + (itemWidth / 2);
      const scrollPosition = selectedItemPosition - (containerWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [selectedWeekDay]);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-black">
            Welcome back, {tutor.firstName}
          </h1>
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3 3h-4l-3-3h5m-5-14a5 5 0 0110 0v6h0l1 2H5l1-2h0V3z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </div>
            </button>
            <button 
              onClick={() => setCurrentTab('profile')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            
            {/* Notifications Popup */}
            {showNotifications && (
              <div 
                ref={notificationRef}
                className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-black">Notifications</h3>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-25 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-25' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notification.read ? 'bg-blue-500' : 'bg-transparent'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-[14px] font-medium ${
                              !notification.read ? 'text-black' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className="text-[12px] text-gray-500 ml-2">
                              {notification.time}
                            </span>
                          </div>
                          <p className={`text-[13px] ${
                            !notification.read ? 'text-gray-700' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100 bg-gray-25">
                  <button className="w-full text-[13px] text-blue-600 hover:text-blue-700 transition-colors">
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-[20px] font-bold text-black">{upcomingSessions.length}</div>
            <div className="text-[14px] text-gray-600 font-semibold">Weekly Sessions</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-[20px] font-bold text-black">{formatZAR(2450)}</div>
            <div className="text-[14px] text-gray-600 font-semibold">Earnings</div>
          </div>
        </div>
      </div>


      {/* Upcoming Sessions */}
      <div className="px-6">
        <div className="space-y-4">
          <h2 className="text-[20px] font-semibold text-black">
            Upcoming Sessions
          </h2>
          
          {/* Week Days - Horizontal Scroll Selector */}
          <div className="relative mb-4">
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-2 px-4 py-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollSnapType: 'x mandatory'
              }}
            >
              {getScrollableDays().map((day, index) => {
                return (
                  <div
                    key={`${day.month}-${day.date}`}
                    className="flex flex-col items-center justify-center rounded-xl flex-shrink-0 bg-white text-gray-600 px-3 py-2 border border-gray-100 transition-all duration-200"
                    style={{
                      minWidth: '60px',
                      height: '70px',
                      scrollSnapAlign: 'center'
                    }}
                  >
                    <div className={`text-[12px] font-medium ${
                      day.isToday ? 'text-blue-500' : 'text-gray-600'
                    }`}>
                      {day.name}
                    </div>
                    <div className={`text-[16px] font-bold ${
                      day.isToday ? 'text-blue-500' : 'text-gray-900'
                    }`}>
                      {day.date}
                    </div>
                    {day.isToday && (
                      <div className="w-1 h-1 bg-blue-400 rounded-full mt-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Fixed Center Selection Indicator */}
            <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center pointer-events-none">
              <div className="bg-blue-600 text-white rounded-xl shadow-lg border-4 border-white flex flex-col items-center justify-center"
                   style={{
                     width: '68px',
                     height: '78px',
                     zIndex: 10
                   }}>
                <div className="text-[12px] font-medium text-white">
                  {getScrollableDays()[selectedWeekDay]?.name || ''}
                </div>
                <div className="text-[18px] font-bold text-white">
                  {getScrollableDays()[selectedWeekDay]?.date || ''}
                </div>
              </div>
            </div>
            
            {/* Gradient overlays for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-20"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-20"></div>
          </div>
          
          <div className="space-y-4">
            {/* Next Session - Highlighted */}
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-red-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-[12px] text-red-500 font-medium mb-2">• NEXT: 2:00 PM (30 mins)</div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[16px] font-semibold text-black">Emma Johnson (Grade K) • Math Basics</span>
                  </div>
                  <div className="flex items-center gap-4 text-[14px] text-gray-600 mb-1">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Online Session</span>
                    </div>
                  </div>
                  <div className="text-[14px] text-gray-600">
                    ✓ Practice counting & shapes
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => handleViewSession({id: 'session-1', student: 'Emma Johnson', subject: 'Math Basics', type: 'online'})}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button 
                  onClick={() => handleMessageSession({id: 'session-1', student: 'Emma Johnson', studentId: 'emma-123'})}
                  className="text-gray-700 px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
              </div>
            </div>

            {/* Regular Sessions */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[16px] font-semibold text-black">Michael Chen (Grade 5) • Reading Science</span>
                  </div>
                  <div className="flex items-center gap-4 text-[14px] text-gray-600 mb-1">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>In-Person</span>
                    </div>
                  </div>
                  <div className="text-[14px] text-gray-600">
                    Novel chapter discussion novel chapter
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => handleViewSession({id: 'session-2', student: 'Michael Chen', subject: 'Reading Comprehension', type: 'home'})}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button 
                  onClick={() => handleMessageSession({id: 'session-2', student: 'Michael Chen', studentId: 'michael-456'})}
                  className="text-gray-700 px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[16px] font-semibold text-black">Sophia Martinez (Grade 8) • Advanced Science</span>
                  </div>
                  <div className="flex items-center gap-4 text-[14px] text-gray-600 mb-1">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Online Session</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => handleViewSession({id: 'session-3', student: 'Sophia Martinez', subject: 'Chemistry', type: 'online'})}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button 
                  onClick={() => handleMessageSession({id: 'session-3', student: 'Sophia Martinez', studentId: 'sophia-789'})}
                  className="text-gray-700 px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6">
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-4 gap-3">
            <button 
              onClick={() => setCurrentTab('sessions')}
              className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[12px] font-medium">
                Schedule
              </span>
            </button>
            
            <button 
              onClick={() => setCurrentTab('messages')}
              className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-[12px] font-medium">
                Message
              </span>
            </button>
            
            <button 
              onClick={() => setCurrentTab('sessions')}
              className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[12px] font-medium">
                Availability
              </span>
            </button>
            
            <button 
              onClick={() => setCurrentTab('profile')}
              className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-[12px] font-medium">
                Resources
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div className="px-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-black">
              My Tasks ({tasks.filter(task => !task.completed).length} pending)
            </h2>
            <button className="text-[14px] text-blue-600">View All</button>
          </div>
          
          <div className="space-y-3">
            {tasks.filter(task => !task.completed).map((task) => (
              <div 
                key={task.id}
                className={`bg-white rounded-xl p-4 shadow-sm ${
                  task.priority === 'URGENT' ? 'border-l-4 border-l-red-500' : 'border border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-[16px] font-semibold text-black">{task.title}</div>
                    <div className="text-[14px] text-gray-600 mt-1">{task.description}</div>
                    <div className={`text-[12px] font-medium mt-1 ${
                      task.priority === 'URGENT' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      Due: {task.dueTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                      task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${
                      task.type === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => completeTask(task.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-[12px] font-medium transition-colors"
                  >
                    Complete
                  </button>
                  <button 
                    onClick={() => snoozeTask(task.id)}
                    className="text-gray-700 px-3 py-1 rounded-lg text-[12px] font-medium hover:bg-gray-100 transition-colors"
                  >
                    Snooze
                  </button>
                </div>
              </div>
            ))}
            
            {tasks.filter(task => !task.completed).length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <svg className="w-12 h-12 text-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-[16px] font-semibold text-black mb-1">All tasks completed!</h3>
                <p className="text-[14px] text-gray-600">Great work! You're all caught up.</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 text-[14px]">
            <button className="text-blue-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
            <button className="text-gray-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Task Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-6">
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            Recent Activity
          </h2>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              {[
                { message: '✔ Mathematics session with John completed', time: '2 hours ago', subject: 'Mathematics' },
                { message: '💰 Payment received for Physics sessions', time: '4 hours ago', subject: 'Physics' },
                { message: '📅 New Chemistry session booked by Sarah', time: '6 hours ago', subject: 'Chemistry' },
                { message: '⭐ New 5-star review from Mike', time: '1 day ago', subject: 'General' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="flex-1">
                    <div className="text-[16px] font-semibold text-black">
                      {activity.message}
                    </div>
                    <div className="text-[13px] text-blue-600 mt-1">
                      {activity.subject}
                    </div>
                  </div>
                  <div className="text-[13px] text-gray-500">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="px-6">
        <div className="space-y-3">
          <h2 className="text-[18px] font-semibold text-black">
            This Week Overview
          </h2>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] text-gray-600">Earnings Progress</span>
                <span className="text-[18px] font-semibold text-black">{formatZAR(2450)}/{formatZAR(3000)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <div className="flex justify-between text-[14px] text-gray-600">
                <span>{upcomingSessions.length + 12} sessions booked</span>
                <span>8 hours available</span>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="text-[16px] font-semibold text-black mb-2">Student Performance Highlights</h3>
              <div className="space-y-1 text-[14px] text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⭐</span>
                  Emma: Completed counting milestone
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">📈</span>
                  Michael: Reading level improved by 1 grade
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">⚠️</span>
                  Sophia: Needs extra chemistry practice
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="px-6 py-6 space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-black">Messages</h1>
        <p className="text-gray-600 mt-1">Chat with students and parents</p>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-[20px] font-semibold text-black">Recent Conversations</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors">
            New Message
          </button>
        </div>

        <div className="space-y-3">
          {/* Sample conversations */}
          {[
            {
              name: "Emma Johnson (Parent)",
              lastMessage: "Thank you for the math session today!",
              time: "2 min ago",
              unread: true,
              avatar: "E"
            },
            {
              name: "Michael Chen",
              lastMessage: "Can we reschedule tomorrow's session?",
              time: "1 hour ago",
              unread: false,
              avatar: "M"
            },
            {
              name: "Sophia Martinez (Parent)",
              lastMessage: "How is Sophia doing with chemistry?",
              time: "3 hours ago",
              unread: true,
              avatar: "S"
            },
            {
              name: "Admin",
              lastMessage: "Monthly report reminder",
              time: "1 day ago",
              unread: false,
              avatar: "A"
            }
          ].map((conversation, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center relative">
                  <span className="text-white font-bold text-[16px]">{conversation.avatar}</span>
                  {conversation.unread && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-[16px] ${conversation.unread ? 'font-semibold text-black' : 'font-medium text-gray-900'}`}>
                      {conversation.name}
                    </h3>
                    <span className="text-[12px] text-gray-500">{conversation.time}</span>
                  </div>
                  <p className={`text-[14px] ${conversation.unread ? 'text-gray-900' : 'text-gray-600'} line-clamp-1`}>
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-[16px] font-semibold text-black mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[14px] text-gray-700">Message Student</span>
            </button>
            <button className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-[14px] text-gray-700">Message Parent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="px-6 py-6">
        <h1 className="text-[28px] font-bold text-black mb-6">Profile</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-[20px]">{tutor.firstName?.[0]}{tutor.lastName?.[0]}</span>
            </div>
            <div>
              <h2 className="text-[20px] font-semibold text-black">{tutor.firstName} {tutor.lastName}</h2>
              <p className="text-gray-600">Mathematics & Science Tutor</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">Email</label>
              <p className="text-[16px] text-black">{tutor.email}</p>
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">Hourly Rate</label>
              <p className="text-[16px] text-black">{formatZAR(tutor.hourlyRate)}</p>
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">Subjects</label>
              <p className="text-[16px] text-black">{tutor.subjects?.join(', ')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return renderOverview();
      case 'sessions':
        return (
          <div className="bg-gray-50 min-h-screen">
            <TutorSessions 
              tutor={tutor}
              upcomingSessions={upcomingSessions}
              stats={stats}
            />
          </div>
        );
      case 'messages':
        return renderMessages();
      case 'progress':
        return <EarningsAnalytics tutorId={tutor.id} hourlyRate={tutor.hourlyRate} />;
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* View Session Popup */}
      {showViewPopup && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-black">Session Options</h3>
              <button 
                onClick={() => setShowViewPopup(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-[14px] text-gray-600 mb-1">Session with:</p>
              <p className="text-[16px] font-medium text-black">{selectedSession.student}</p>
              <p className="text-[14px] text-gray-600">{selectedSession.subject}</p>
            </div>
            
            <div className="space-y-3">
              {selectedSession.type === 'online' ? (
                <>
                  <button 
                    onClick={() => {
                      alert('Starting online session...');
                      setShowViewPopup(false);
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Start Online Session
                  </button>
                  <button 
                    onClick={() => {
                      alert('Opening session notes...');
                      setShowViewPopup(false);
                    }}
                    className="w-full text-gray-700 px-4 py-3 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Session Notes
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      alert('Opening directions to student location...');
                      setShowViewPopup(false);
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Get Directions
                  </button>
                  <button 
                    onClick={() => {
                      alert('Opening session notes...');
                      setShowViewPopup(false);
                    }}
                    className="w-full text-gray-700 px-4 py-3 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Session Notes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Session Popup */}
      {showMessagePopup && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-black">Send Message</h3>
              <button 
                onClick={() => setShowMessagePopup(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-[14px] text-gray-600 mb-1">About session with:</p>
              <p className="text-[16px] font-medium text-black">{selectedSession.student}</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  alert(`Opening chat with ${selectedSession.student}...`);
                  setShowMessagePopup(false);
                }}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Message Student
              </button>
              <button 
                onClick={() => {
                  alert(`Opening chat with ${selectedSession.student}'s parent...`);
                  setShowMessagePopup(false);
                }}
                className="w-full text-gray-700 px-4 py-3 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Message Parent
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Content based on sidebar navigation */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              currentTab === 'dashboard'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14H8V5z" />
            </svg>
            <span className="text-[12px] font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('sessions')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              currentTab === 'sessions'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[12px] font-medium">Sessions</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('messages')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              currentTab === 'messages'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[12px] font-medium">Messages</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('progress')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              currentTab === 'progress'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[12px] font-medium">Progress</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              currentTab === 'profile'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[12px] font-medium">Profile</span>
          </button>
        </div>
      </div>

      {/* Quick Action Modal */}
      {showQuickAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-semibold text-black">Quick Actions</h3>
              <button
                onClick={() => setShowQuickAction(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <button className="w-full bg-white text-black p-4 rounded-xl shadow-sm border border-gray-100 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="text-[16px] font-semibold">Schedule Session</div>
                    <div className="text-[14px] text-gray-600">Book a new tutoring session</div>
                  </div>
                </div>
              </button>
              
              <button className="w-full bg-white text-black p-4 rounded-xl shadow-sm border border-gray-100 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div>
                    <div className="text-[16px] font-semibold">Message Student</div>
                    <div className="text-[14px] text-gray-600">Send a message to your students</div>
                  </div>
                </div>
              </button>
              
              <button className="w-full bg-white text-black p-4 rounded-xl shadow-sm border border-gray-100 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-[16px] font-semibold">Update Availability</div>
                    <div className="text-[14px] text-gray-600">Modify your teaching schedule</div>
                  </div>
                </div>
              </button>
              
              <button className="w-full bg-white text-black p-4 rounded-xl shadow-sm border border-gray-100 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div>
                    <div className="text-[16px] font-semibold">Create Resource</div>
                    <div className="text-[14px] text-gray-600">Add teaching materials</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};