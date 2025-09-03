/**
 * 🎯 CONFIRMED ACTIVE TUTOR INTERFACE
 * This is the PRIMARY tutor dashboard component rendered at localhost:3000/dashboard
 * Status: ✅ CONFIRMED CURRENT - Use for all tutor modifications
 * See: CURRENT_INTERFACES.md for reference guide
 * Sections: Header, Stats, Upcoming Sessions, Quick Actions, Tasks, Activity, Overview
 */
import React, { useState, useEffect, useRef } from 'react';
import { Tutor, TutoringSession, DashboardStats } from '../../../types';
import { EarningsAnalytics } from './EarningsAnalytics';
import { StudentManagement } from './StudentManagement';
import { ScheduleManagement } from './ScheduleManagement';
import { SessionCalendarView } from '../../student/SessionCalendarView';
import { TutorSessions } from '../TutorSessions';
import { formatZAR, formatSADateTime } from '../../../utils/saFormatting';
import { userService } from '../../../services/userService';
import { notificationService, Notification } from '../../../services/notificationService';
import { lessonService } from '../../../services/lessonService';
import { messageService } from '../../../services/messageService';
import { TutorWorkCenter } from '../TutorWorkCenter';
import { MobileMessaging } from '../../messaging/MobileMessaging';
import { AppHeader } from '../../common/AppHeader';

interface Task {
  id: number;
  title: string;
  description: string;
  dueTime: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'ADMIN' | 'AUTO' | 'PERSONAL';
  completed: boolean;
  createdAt?: Date;
}

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Notifications data - from notification service
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [notificationCounts, setNotificationCounts] = useState({ total: 0, unread: 0, urgent: 0 });
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  
  // Dashboard metrics
  const [weeklySessions, setWeeklySessions] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [upcomingBeyondWeek, setUpcomingBeyondWeek] = useState(0);
  
  // Session management
  const [filteredSessions, setFilteredSessions] = useState<TutoringSession[]>([]);
  
  // Work Center navigation
  const [workCenterTab, setWorkCenterTab] = useState<string>('tasks');
  const [workCenterSessionId, setWorkCenterSessionId] = useState<string>('');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Messaging state
  const [showFullMessaging, setShowFullMessaging] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showLessonActions, setShowLessonActions] = useState(false);

  // Fetch tasks from service or API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // TODO: Replace with actual task service call
        // const userTasks = await taskService.getUserTasks(tutor.id);
        // setTasks(userTasks);
        
        // For now, tasks start empty and are populated by user actions or auto-generation
        console.log('Tasks will be loaded from service for tutor:', tutor.id);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [tutor.id]);


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

  // Handle clicking outside profile menu popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

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

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userNotifications = await notificationService.getUserNotifications(tutor.id, {
          limit: 20
        });
        setNotifications(userNotifications);

        const counts = await notificationService.getNotificationCounts(tutor.id);
        setNotificationCounts(counts);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Set up real-time notification subscription
    const subscription = notificationService.subscribeToNotifications(
      tutor.id,
      (newNotification: Notification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setNotificationCounts(prev => ({
          total: prev.total + 1,
          unread: prev.unread + 1,
          urgent: prev.urgent + (newNotification.priority === 'urgent' ? 1 : 0)
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [tutor.id]);

  // Filter notifications based on selected filter
  useEffect(() => {
    let filtered = [...notifications];
    
    switch (notificationFilter) {
      case 'unread':
        filtered = notifications.filter(n => !n.is_read);
        break;
      case 'urgent':
        filtered = notifications.filter(n => n.priority === 'urgent');
        break;
      case 'all':
      default:
        filtered = notifications;
        break;
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, notificationFilter]);

  // Calculate weekly sessions from upcoming sessions
  useEffect(() => {
    const calculateWeeklySessions = () => {
      const now = new Date();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      currentWeekStart.setHours(0, 0, 0, 0);
      
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of current week (Saturday)
      currentWeekEnd.setHours(23, 59, 59, 999);

      const thisWeekSessions = upcomingSessions.filter(session => {
        const sessionDate = new Date(session.scheduledAt);
        return sessionDate >= currentWeekStart && sessionDate <= currentWeekEnd;
      });

      const beyondThisWeek = upcomingSessions.filter(session => {
        const sessionDate = new Date(session.scheduledAt);
        return sessionDate > currentWeekEnd;
      });

      setWeeklySessions(thisWeekSessions.length);
      setUpcomingBeyondWeek(beyondThisWeek.length);
    };

    calculateWeeklySessions();
  }, [upcomingSessions]);

  // Calculate earnings based on completed sessions
  const calculateSessionEarnings = (session: any) => {
    // Earnings rates based on session type
    const RATES = {
      online: 135,    // R135 per online session
      individual: 200, // R200 per at-home individual session  
      group: 200      // R200 per at-home group session
    };

    // Determine if session is online or at-home
    const sessionType = session.sessionType || session.lesson_type || 'individual';
    const isOnline = sessionType === 'online';
    
    return isOnline ? RATES.online : RATES.individual;
  };

  // Fetch earnings data based on completed lessons
  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        // Get current week date range
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Get completed lessons for this week
        const lessons = await lessonService.getUserLessons(tutor.id, 'tutor');
        
        // Filter for completed lessons in current week
        const completedThisWeek = lessons.filter(lesson => {
          const lessonDate = new Date(lesson.scheduled_at);
          return lesson.status === 'completed' && 
                 lessonDate >= weekStart && 
                 lessonDate <= weekEnd;
        });

        // Calculate total earnings
        const totalEarnings = completedThisWeek.reduce((total, lesson) => {
          return total + calculateSessionEarnings(lesson);
        }, 0);

        setWeeklyEarnings(totalEarnings);
      } catch (error) {
        console.error('Error fetching earnings data:', error);
        // Use default/fallback value
        setWeeklyEarnings(0);
      }
    };

    fetchEarningsData();
  }, [tutor.id]);

  // Filter sessions by selected date
  useEffect(() => {
    const selectedDate = getScrollableDays()[selectedWeekDay]?.fullDate;
    if (selectedDate) {
      const filtered = upcomingSessions.filter(session => {
        const sessionDate = new Date(session.scheduledAt);
        return sessionDate.toDateString() === selectedDate.toDateString();
      });
      setFilteredSessions(filtered);
    }
  }, [selectedWeekDay, upcomingSessions]);

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

  // Messaging handlers
  const handleCloseMessaging = () => {
    setShowFullMessaging(false);
    setSelectedConversationId(null);
  };

  const handleRescheduleSession = (sessionId: string) => {
    alert('Opening reschedule dialog for session');
    // Would typically open a modal or navigate to reschedule page
  };

  const handleSessionNotes = (sessionId: string) => {
    alert('Opening session notes for review/editing');
    // Would typically open notes modal or navigate to notes page
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await notificationService.markAsRead(notification.id, tutor.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      setNotificationCounts(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));
    }
  };

  const handleNotificationAction = async (notification: Notification, action: any) => {
    console.log('Notification action clicked:', action, notification);
    // Handle specific actions based on action.action
    switch (action.action) {
      case 'approve_reschedule_request':
        alert('Reschedule request approved');
        break;
      case 'decline_reschedule_request':
        alert('Reschedule request declined');
        break;
      case 'create_counter_proposal':
        alert('Opening counter proposal form');
        break;
      default:
        console.log('Unknown action:', action.action);
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await notificationService.markAllAsRead(tutor.id);
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setNotificationCounts(prev => ({ ...prev, unread: 0 }));
    }
  };

  // Session management handlers
  const handleCompleteSession = async (sessionId: string, studentName: string, subject: string) => {
    try {
      // Update session status to completed
      // TODO: Update this with actual session service call
      console.log('Completing session:', sessionId);
      
      // Auto-generate lesson report task
      const newTask: Task = {
        id: Date.now(),
        title: `Submit Lesson Report: ${studentName}`,
        description: `Complete lesson report for ${subject} session with ${studentName}`,
        dueTime: "End of day",
        priority: "HIGH",
        type: "AUTO",
        completed: false,
        createdAt: new Date()
      };
      
      setTasks(prev => [newTask, ...prev]);
      
      alert(`Session completed! Lesson report task created for ${studentName}.`);
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Error completing session. Please try again.');
    }
  };

  const handleNavigateToMyWork = (sessionId: string) => {
    // Navigate to Work Center with lesson planning tab and specific session
    setWorkCenterTab('lesson-planning');
    setWorkCenterSessionId(sessionId);
    setCurrentTab('progress'); // 'progress' tab shows the Work Center
  };

  const handleNavigateToTasks = () => {
    // Navigate to Work Center with tasks tab active
    setWorkCenterTab('tasks');
    setCurrentTab('progress'); // 'progress' tab shows the Work Center
  };

  // Helper function to check if session is planned
  const isSessionPlanned = (session: TutoringSession): boolean => {
    // In a real implementation, this would check the database for saved lesson plans
    // For now, we'll use session.notes as a simple indicator
    return !!(session.notes && session.notes.includes(':'));
  };

  // Helper function to get formatted topic display
  const getTopicDisplay = (session: TutoringSession): string => {
    if (session.notes && session.notes.includes(':')) {
      const parts = session.notes.split(':');
      return `${parts[0]}: ${parts[1]?.split('|')[0] || ''}`;
    }
    return '';
  };

  // Helper function to get notification category icon and styling
  const getNotificationDisplay = (notification: Notification) => {
    const categories = {
      reschedule_request: {
        icon: '🔄',
        category: 'Schedule',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      },
      reschedule_approved: {
        icon: '✅',
        category: 'Schedule',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      reschedule_declined: {
        icon: '❌',
        category: 'Schedule',
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      },
      session_reminder: {
        icon: '⏰',
        category: 'Session',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      session_cancelled: {
        icon: '🚫',
        category: 'Session',
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      },
      session_confirmed: {
        icon: '✅',
        category: 'Session',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      message_received: {
        icon: '💬',
        category: 'Message',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      assignment_created: {
        icon: '📝',
        category: 'Assignment',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
      },
      payment_reminder: {
        icon: '💰',
        category: 'Payment',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      admin_escalation: {
        icon: '⚠️',
        category: 'Admin',
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      },
      counter_proposal: {
        icon: '🔄',
        category: 'Schedule',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      counter_proposal_response: {
        icon: '💭',
        category: 'Schedule',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      }
    };

    return categories[notification.notification_type] || {
      icon: '📢',
      category: 'General',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    };
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
      {/* App Header */}
      <AppHeader 
        firstName={tutor.firstName}
        lastName={tutor.lastName}
        userRole="tutor"
        notificationCount={notificationCounts.unread}
        onNotificationClick={() => setShowNotifications(!showNotifications)}
        onSettingsClick={() => setCurrentTab('settings')}
        onProfileClick={() => setShowProfileMenu(!showProfileMenu)}
      />
      
      {/* Notifications Popup */}
      {showNotifications && (
        <div className="absolute top-20 right-6 z-50">
          <div 
            ref={notificationRef}
            className="w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
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
              
              {/* Filter Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setNotificationFilter('all')}
                  className={`flex-1 px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    notificationFilter === 'all' 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotificationFilter('unread')}
                  className={`flex-1 px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    notificationFilter === 'unread' 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Unread ({notificationCounts.unread})
                </button>
                <button
                  onClick={() => setNotificationFilter('urgent')}
                  className={`flex-1 px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    notificationFilter === 'urgent' 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Urgent ({notificationCounts.urgent})
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-[14px] font-medium text-gray-900 mb-1">
                    {notificationFilter === 'all' ? 'No notifications' :
                     notificationFilter === 'unread' ? 'No unread notifications' :
                     'No urgent notifications'}
                  </h3>
                  <p className="text-[12px] text-gray-500">
                    {notificationFilter === 'all' ? "You're all caught up! New notifications will appear here." :
                     notificationFilter === 'unread' ? "All notifications have been read." :
                     "No urgent notifications at this time."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => {
                  const display = getNotificationDisplay(notification);
                  return (
                    <div 
                      key={notification.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-25 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-blue-25' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${display.bgColor}`}>
                          {display.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${display.bgColor} ${display.color}`}>
                                  {display.category}
                                </span>
                                {notification.priority === 'urgent' && (
                                  <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-red-100 text-red-800">
                                    URGENT
                                  </span>
                                )}
                              </div>
                              <p className="text-[13px] font-medium text-gray-900 line-clamp-1">
                                {notification.title}
                              </p>
                              <p className="text-[12px] text-gray-600 line-clamp-2 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <span>{formatSADateTime(notification.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Menu */}
      {showProfileMenu && (
        <div className="absolute top-20 right-6 z-50">
          <div 
            ref={profileMenuRef}
            className="bg-white shadow-lg rounded-lg border border-gray-200 w-48"
          >
            <div className="p-2">
              <button 
                onClick={() => {
                  setCurrentTab('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                View Profile
              </button>
              <button 
                onClick={() => {
                  setCurrentTab('settings');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                Settings
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
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="px-6">
        <div className="space-y-4">
          <h2 className="text-[20px] font-semibold text-black">
            Upcoming Lessons
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
            {filteredSessions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-[16px] font-semibold text-black mb-1">No sessions scheduled</h3>
                <p className="text-[14px] text-gray-600">No sessions are scheduled for this date.</p>
              </div>
            ) : (
              filteredSessions.map((session, index) => {
                const studentName = studentNames[session.studentId] || 'Unknown Student';
                const sessionTime = new Date(session.scheduledAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                const isNext = index === 0; // First session is considered "next"
                const isOnline = session.sessionType === 'online';
                const isCompleted = session.status === 'completed';
                
                return (
                  <div 
                    key={session.id}
                    className={`bg-white rounded-xl p-4 shadow-sm ${
                      isNext && !isCompleted 
                        ? 'border-l-4 border-l-red-500' 
                        : isCompleted 
                          ? 'border-l-4 border-l-green-500'
                          : 'border border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isNext && !isCompleted && (
                          <div className="text-[12px] text-red-500 font-medium mb-2">
                            • NEXT: {sessionTime} ({session.duration} mins)
                          </div>
                        )}
                        {isCompleted && (
                          <div className="text-[12px] text-green-500 font-medium mb-2">
                            ✓ COMPLETED: {sessionTime}
                          </div>
                        )}
                        {!isNext && !isCompleted && (
                          <div className="text-[12px] text-gray-500 font-medium mb-2">
                            {sessionTime} ({session.duration} mins)
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-[16px] font-semibold text-black">
                            {studentName} • {session.subject}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[14px] text-gray-600 mb-1">
                          <div className="flex items-center gap-1">
                            {isOnline ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                            <span>{isOnline ? 'Online Session' : 'At-Home Session'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`text-[12px] px-2 py-1 rounded-full font-medium ${
                              isCompleted ? 'bg-green-100 text-green-800' :
                              session.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isCompleted ? 'Completed' : session.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Topic Status Display */}
                        <div className="text-[14px] mt-2">
                          {isSessionPlanned(session) ? (
                            <div className="flex items-center gap-2 text-green-700">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">📚 {getTopicDisplay(session)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-amber-700">
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="font-medium">Lesson plan incomplete</span>
                              </div>
                              <button
                                onClick={() => handleNavigateToMyWork(session.id)}
                                className="text-[13px] text-blue-600 hover:text-blue-700 font-medium underline"
                              >
                                Plan in My Work →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      {!isCompleted && (
                        <button 
                          onClick={() => handleCompleteSession(session.id, studentName, session.subject)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Complete
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleViewSession({id: session.id, student: studentName, subject: session.subject, type: isOnline ? 'online' : 'home'})}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      
                      <button 
                        onClick={() => handleMessageSession({id: session.id, student: studentName, studentId: session.studentId})}
                        className="text-gray-700 px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Message
                      </button>
                    </div>
                  </div>
                );
              })
            )}
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
            <button 
              onClick={() => handleNavigateToTasks()}
              className="text-[14px] text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
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
              {/* Recent activity will be populated from notifications and session updates */}
              {notifications.length > 0 ? (
                notifications.slice(0, 4).map((notification, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <div className="text-[16px] font-semibold text-black">
                        {notification.title}
                      </div>
                      <div className="text-[13px] text-blue-600 mt-1">
                        {notification.notification_type.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-[13px] text-gray-500">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              )}
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
                <span className="text-[18px] font-semibold text-black">{formatZAR(weeklyEarnings)}</span>
              </div>
              <div className="flex justify-between text-[14px] text-gray-600">
                <span>{weeklySessions} lessons this week</span>
                <span>{upcomingBeyondWeek} upcoming beyond this week</span>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="text-[16px] font-semibold text-black mb-2">Week Summary</h3>
              <div className="space-y-1 text-[14px] text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Completed Lessons:</span>
                  <span className="font-medium">{weeklySessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Earnings:</span>
                  <span className="font-medium">{formatZAR(weeklyEarnings)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pending Tasks:</span>
                  <span className="font-medium">{tasks.filter(t => !t.completed).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="h-full">
      <MobileMessaging 
        userId={tutor.id} 
        userRole="tutor"
        userName={`${tutor.firstName} ${tutor.lastName}`}
      />
    </div>
  );

  const renderSettings = () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="px-6 py-6">
        <h1 className="text-[28px] font-bold text-black mb-6">Settings</h1>
        
        {/* Account Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-[20px] font-semibold text-black mb-4">Account Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-[16px] font-medium text-black">Email Notifications</div>
                <div className="text-[14px] text-gray-600">Receive emails about sessions and updates</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-[16px] font-medium text-black">SMS Notifications</div>
                <div className="text-[14px] text-gray-600">Receive text messages for urgent updates</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-[16px] font-medium text-black">Auto-accept Sessions</div>
                <div className="text-[14px] text-gray-600">Automatically accept session bookings</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Teaching Preferences */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-[20px] font-semibold text-black mb-4">Teaching Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">Default Session Duration</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg text-[16px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="60">60 minutes</option>
                <option value="90" selected>90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">Travel Distance (for home sessions)</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg text-[16px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="5">Within 5km</option>
                <option value="10" selected>Within 10km</option>
                <option value="15">Within 15km</option>
                <option value="20">Within 20km</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">Maximum Students per Group Session</label>
              <select className="w-full p-3 border border-gray-300 rounded-lg text-[16px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="2">2 students</option>
                <option value="3" selected>3 students</option>
                <option value="4">4 students</option>
                <option value="5">5 students</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-[20px] font-semibold text-black mb-4">Payment Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">Hourly Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R</span>
                <input 
                  type="number" 
                  defaultValue={tutor.hourlyRate}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-[16px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" className="mr-3" defaultChecked />
                  <div>
                    <div className="text-[16px] font-medium text-black">Bank Transfer</div>
                    <div className="text-[14px] text-gray-600">Direct deposit to your bank account</div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" className="mr-3" />
                  <div>
                    <div className="text-[16px] font-medium text-black">PayFast</div>
                    <div className="text-[14px] text-gray-600">Instant payments via PayFast</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-[20px] font-semibold text-black mb-4">Privacy & Security</h2>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="text-left">
                  <div className="text-[16px] font-medium text-black">Change Password</div>
                  <div className="text-[14px] text-gray-600">Update your account password</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="text-left">
                  <div className="text-[16px] font-medium text-black">Two-Factor Authentication</div>
                  <div className="text-[14px] text-gray-600">Add extra security to your account</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <div className="text-[16px] font-medium text-black">Privacy Settings</div>
                  <div className="text-[14px] text-gray-600">Control who can see your profile</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Support & Help */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-[20px] font-semibold text-black mb-4">Support & Help</h2>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <div className="text-[16px] font-medium text-black">Help Center</div>
                  <div className="text-[14px] text-gray-600">Find answers to common questions</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="text-left">
                  <div className="text-[16px] font-medium text-black">Contact Support</div>
                  <div className="text-[14px] text-gray-600">Get help from our team</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-left">
                  <div className="text-[16px] font-medium text-black">Terms & Conditions</div>
                  <div className="text-[14px] text-gray-600">Read our terms of service</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => {
              alert('Settings saved successfully!');
            }}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-[16px] font-medium hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
          
          <button 
            onClick={() => setCurrentTab('dashboard')}
            className="w-full text-gray-700 px-6 py-3 rounded-lg text-[16px] font-medium hover:bg-gray-100 transition-colors border border-gray-300"
          >
            Cancel
          </button>
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
        
        {/* Earnings Analytics */}
        <div className="mt-6">
          <EarningsAnalytics tutorId={tutor.id} hourlyRate={tutor.hourlyRate} />
        </div>
      </div>
    </div>
  );

  const renderWorkCenter = () => (
    <TutorWorkCenter 
      tutorId={tutor.id} 
      initialTab={workCenterTab}
      initialSessionId={workCenterSessionId}
      tasks={tasks}
      onTasksUpdate={setTasks}
    />
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
        return renderWorkCenter();
      case 'settings':
        return renderSettings();
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
                  setShowFullMessaging(true);
                  setShowMessagePopup(false);
                }}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg text-[14px] font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Open Messages
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2">
        <div className="flex justify-around items-center max-w-full">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors min-w-0 flex-1 ${
              currentTab === 'dashboard'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="w-5 h-5 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-[10px] font-medium truncate">Home</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('sessions')}
            className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors min-w-0 flex-1 ${
              currentTab === 'sessions'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="w-5 h-5 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium truncate">Lessons</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('messages')}
            className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors min-w-0 flex-1 ${
              currentTab === 'messages'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="w-5 h-5 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium truncate">Messages</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('progress')}
            className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors min-w-0 flex-1 ${
              currentTab === 'progress'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="w-5 h-5 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a1 1 0 01-1 1H9a1 1 0 01-1-1V6m8 0H8m0 0H6a2 2 0 00-2 2v6a2 2 0 002 2h2m8-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-8 4h8" />
              </svg>
            </div>
            <span className="text-[10px] font-medium truncate">Work</span>
          </button>
          
          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors min-w-0 flex-1 ${
              currentTab === 'profile'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="w-5 h-5 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium truncate">Profile</span>
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

      {/* Full Screen Messaging Modal */}
      {showFullMessaging && (
        <div className="fixed inset-0 z-50 bg-white">
          <MobileMessaging 
            userId={tutor.id} 
            userRole="tutor"
            onClose={handleCloseMessaging}
            initialConversationId={selectedConversationId}
          />
        </div>
      )}
    </div>
  );
};