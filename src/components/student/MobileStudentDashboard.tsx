import React, { useState, useEffect } from 'react';
import { Student, TutoringSession, DashboardStats } from '../../types';
import { BookSessionModal } from './BookSessionModal';
import { assignmentService, AssignmentWithDetails } from '../../services/assignmentService';
import { formatSADate, formatSATime } from '../../utils/saFormatting';
import { MobileMessaging } from '../messaging/MobileMessaging';

interface MobileStudentDashboardProps {
  student: Student;
  upcomingSessions: TutoringSession[];
  stats: DashboardStats;
}

export const MobileStudentDashboard: React.FC<MobileStudentDashboardProps> = ({
  student,
  upcomingSessions,
  stats
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'progress' | 'messages' | 'settings'>('dashboard');
  const [showBookModal, setShowBookModal] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Settings state
  const [settingsData, setSettingsData] = useState({
    profile: {
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      grade: student.grade || '',
      school: ''
    },
    notifications: {
      sessionReminders: true,
      progressUpdates: true,
      messages: true,
      promotions: false
    },
    subjects: ['Mathematics', 'Science', 'English'],
    availability: {
      preferredDays: ['Monday', 'Wednesday', 'Friday'],
      preferredTimes: 'afternoon'
    },
    preferences: {
      theme: 'light',
      language: 'en-ZA'
    }
  });

  useEffect(() => {
    loadStudentAssignments();
  }, [student.id]);

  const loadStudentAssignments = async () => {
    try {
      const assignmentsResponse = await assignmentService.getStudentAssignments(student.id);
      if (assignmentsResponse.data) {
        setAssignments(assignmentsResponse.data);
      }
    } catch (error) {
      console.error('Error loading student assignments:', error);
    }
  };

  const getSubjectIcon = (subject: string) => {
    const subjectMap: { [key: string]: JSX.Element } = {
      'Mathematics': (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      'Science': (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      'English': (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    };
    return subjectMap[subject] || (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  };

  const getSubjectGradient = (subject: string) => {
    const gradientMap: { [key: string]: string } = {
      'Mathematics': 'bg-gradient-to-br from-blue-400 to-indigo-500',
      'Science': 'bg-gradient-to-br from-green-400 to-emerald-500',
      'English': 'bg-gradient-to-br from-purple-400 to-violet-500',
      'History': 'bg-gradient-to-br from-yellow-400 to-orange-500',
      'Geography': 'bg-gradient-to-br from-teal-400 to-cyan-500'
    };
    return gradientMap[subject] || 'bg-gradient-to-br from-orange-400 to-pink-500';
  };

  const renderDashboardContent = () => (
    <div className="space-y-6 pb-24">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {student.firstName}!</h1>
        <p className="text-orange-100 mb-4">Ready to continue your learning journey?</p>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span>{upcomingSessions.length} Upcoming</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>{stats.completedSessions} Complete</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowBookModal(true)}
          className="bg-gradient-to-r from-orange-400 to-pink-400 text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Book Session</h3>
              <p className="text-xs opacity-90">Schedule with tutor</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('progress')}
          className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">View Progress</h3>
              <p className="text-xs opacity-90">Track learning</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('sessions')}
          className="bg-gradient-to-r from-green-400 to-emerald-400 text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Manage Sessions</h3>
              <p className="text-xs opacity-90">View schedule</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className="bg-gradient-to-r from-purple-400 to-violet-400 text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Settings</h3>
              <p className="text-xs opacity-90">Account & preferences</p>
            </div>
          </div>
        </button>
      </div>

      {/* Upcoming Lessons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Lessons</h2>
          <p className="text-sm text-gray-600">Your scheduled sessions</p>
        </div>
        <div className="p-4">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No upcoming lessons</h3>
              <p className="text-sm text-gray-500 mb-4">Book your first session to get started!</p>
              <button
                onClick={() => setShowBookModal(true)}
                className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Book Session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-12 h-12 ${getSubjectGradient(session.subject)} rounded-xl flex items-center justify-center`}>
                    {getSubjectIcon(session.subject)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{session.subject}</h3>
                    <p className="text-sm text-gray-600">
                      {formatSADate(session.scheduledAt)} at {formatSATime(session.scheduledAt)}
                    </p>
                  </div>
                  <button className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium">
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Learning Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Learning Progress</h2>
          <p className="text-sm text-gray-600">Your achievements and feedback</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Sessions Completed</h3>
                <p className="text-sm text-gray-600">{stats.completedSessions} lessons finished</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.completedSessions}</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Average Rating</h3>
                <p className="text-sm text-gray-600">From your tutors</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.avgRating?.toFixed(1) || 'N/A'}</div>
          </div>

          <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4 4z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Latest Feedback</h3>
            </div>
            <p className="text-sm text-gray-600 italic">
              "Great progress in understanding algebraic concepts. Keep practicing the problem-solving techniques we discussed."
            </p>
            <p className="text-xs text-gray-500 mt-2">- Mathematics Tutor, 2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessionsContent = () => {
    // Get current month and year for navigation
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    // Calculate calendar days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    const calendarDays = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      calendarDays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const navigateMonth = (direction: 'prev' | 'next') => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(currentMonth + (direction === 'next' ? 1 : -1));
      setSelectedDate(newDate);
    };
    
    const isToday = (date: Date) => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };
    
    const isCurrentMonth = (date: Date) => {
      return date.getMonth() === currentMonth;
    };
    
    const hasSession = (date: Date) => {
      return upcomingSessions.some(session => {
        const sessionDate = new Date(session.scheduledAt);
        return sessionDate.toDateString() === date.toDateString();
      });
    };

    return (
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">My Sessions</h1>
          <p className="text-orange-100">View your learning schedule</p>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['month', 'week', 'day'].map((view) => (
                <button
                  key={view}
                  onClick={() => setCalendarView(view as any)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                    calendarView === view 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {calendarView === 'month' && (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => {
                    const isCurrentMonthDay = isCurrentMonth(date);
                    const isTodayDate = isToday(date);
                    const hasSessionDate = hasSession(date);
                    
                    return (
                      <div
                        key={index}
                        className={`aspect-square flex items-center justify-center text-sm relative cursor-pointer rounded-lg transition-colors ${
                          !isCurrentMonthDay 
                            ? 'text-gray-300' 
                            : isTodayDate 
                            ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white font-semibold' 
                            : hasSessionDate
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedDate(new Date(date))}
                      >
                        {date.getDate()}
                        {hasSessionDate && !isTodayDate && (
                          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {calendarView === 'week' && (
              <>
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 7);
                      setSelectedDate(newDate);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="font-semibold text-gray-900">
                    Week of {selectedDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 7);
                      setSelectedDate(newDate);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Week Days */}
                <div className="space-y-3">
                  {(() => {
                    const weekStart = new Date(selectedDate);
                    weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
                    
                    const weekDays = [];
                    for (let i = 0; i < 7; i++) {
                      const day = new Date(weekStart);
                      day.setDate(weekStart.getDate() + i);
                      weekDays.push(day);
                    }
                    
                    return weekDays.map((day, index) => {
                      const dayName = day.toLocaleDateString('en-ZA', { weekday: 'short' });
                      const dayNumber = day.getDate();
                      const isToday = day.toDateString() === new Date().toDateString();
                      const hasSessions = upcomingSessions.some(session => {
                        const sessionDate = new Date(session.scheduledAt);
                        return sessionDate.toDateString() === day.toDateString();
                      });
                      const daySessions = upcomingSessions.filter(session => {
                        const sessionDate = new Date(session.scheduledAt);
                        return sessionDate.toDateString() === day.toDateString();
                      });
                      
                      return (
                        <div 
                          key={index} 
                          className={`border rounded-xl p-4 ${
                            isToday ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isToday 
                                  ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {dayNumber}
                              </div>
                              <div>
                                <h4 className={`font-semibold ${isToday ? 'text-orange-800' : 'text-gray-900'}`}>
                                  {dayName}
                                </h4>
                                <p className={`text-sm ${isToday ? 'text-orange-600' : 'text-gray-600'}`}>
                                  {day.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            {hasSessions && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-green-700">
                                  {daySessions.length} session{daySessions.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {hasSessions ? (
                            <div className="space-y-2">
                              {daySessions.map((session, sessionIndex) => (
                                <div 
                                  key={sessionIndex}
                                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className={`w-8 h-8 ${getSubjectGradient(session.subject)} rounded-lg flex items-center justify-center`}>
                                    {getSubjectIcon(session.subject)}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 text-sm">{session.subject}</h5>
                                    <p className="text-xs text-gray-600">
                                      {formatSATime(session.scheduledAt)}
                                    </p>
                                  </div>
                                  <button className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium">
                                    Join
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500">No sessions scheduled</p>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}

            {calendarView === 'day' && (
              <>
                {/* Day Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setSelectedDate(newDate);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">
                      {selectedDate.toLocaleDateString('en-ZA', { weekday: 'long' })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setSelectedDate(newDate);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Daily Schedule */}
                <div className="space-y-1">
                  {(() => {
                    const hours = [];
                    const daySessions = upcomingSessions.filter(session => {
                      const sessionDate = new Date(session.scheduledAt);
                      return sessionDate.toDateString() === selectedDate.toDateString();
                    });
                    
                    // Generate hourly time slots from 8 AM to 8 PM
                    for (let hour = 8; hour <= 20; hour++) {
                      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                      let displayTime;
                      if (hour === 12) {
                        displayTime = '12:00 PM';
                      } else if (hour < 12) {
                        displayTime = `${hour}:00 AM`;
                      } else {
                        displayTime = `${hour - 12}:00 PM`;
                      }
                      
                      // Find sessions for this hour
                      const hourSessions = daySessions.filter(session => {
                        const sessionHour = new Date(session.scheduledAt).getHours();
                        return sessionHour === hour;
                      });
                      
                      hours.push({
                        hour,
                        timeSlot,
                        displayTime,
                        sessions: hourSessions
                      });
                    }
                    
                    return hours.map((timeData, index) => (
                      <div key={index} className="flex">
                        {/* Time Column */}
                        <div className="w-20 flex-shrink-0 pr-4 py-3">
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-700">
                              {timeData.displayTime}
                            </span>
                          </div>
                        </div>
                        
                        {/* Content Column */}
                        <div className="flex-1 border-l border-gray-200 pl-4 py-3 min-h-[60px]">
                          {timeData.sessions.length > 0 ? (
                            <div className="space-y-2">
                              {timeData.sessions.map((session, sessionIndex) => (
                                <div 
                                  key={sessionIndex}
                                  className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                                >
                                  <div className={`w-10 h-10 ${getSubjectGradient(session.subject)} rounded-lg flex items-center justify-center`}>
                                    {getSubjectIcon(session.subject)}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900">{session.subject}</h5>
                                    <p className="text-sm text-gray-600">
                                      {formatSATime(session.scheduledAt)}
                                    </p>
                                    <p className="text-xs text-gray-500">with Tutor</p>
                                  </div>
                                  <div className="flex flex-col space-y-1">
                                    <button className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium">
                                      Join
                                    </button>
                                    <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs">
                                      Details
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center h-full">
                              <span className="text-sm text-gray-400">No sessions</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Today's Summary */}
                <div className="mt-6 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900">Today's Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Sessions</p>
                      <p className="text-xl font-bold text-orange-600">
                        {upcomingSessions.filter(session => {
                          const sessionDate = new Date(session.scheduledAt);
                          return sessionDate.toDateString() === selectedDate.toDateString();
                        }).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Study Time</p>
                      <p className="text-xl font-bold text-orange-600">
                        {upcomingSessions.filter(session => {
                          const sessionDate = new Date(session.scheduledAt);
                          return sessionDate.toDateString() === selectedDate.toDateString();
                        }).length}h
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-600">Your latest session updates</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {stats.completedSessions > 0 ? (
                <>
                  <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Mathematics session completed</p>
                      <p className="text-xs text-gray-500">Received 4.8/5 rating • 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Science session scheduled</p>
                      <p className="text-xs text-gray-500">Tomorrow at 3:00 PM • 1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Feedback received</p>
                      <p className="text-xs text-gray-500">Great progress in algebra • 3 days ago</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">No recent activity</h3>
                  <p className="text-sm text-gray-500 mb-4">Start booking sessions to see your activity here</p>
                  <button
                    onClick={() => setShowBookModal(true)}
                    className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Book Your First Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsContent = () => (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-slate-200">Manage your account and learning preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          <p className="text-sm text-gray-600">Update your personal details</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={settingsData.profile.firstName}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  profile: { ...prev.profile, firstName: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={settingsData.profile.lastName}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  profile: { ...prev.profile, lastName: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={settingsData.profile.email}
              onChange={(e) => setSettingsData(prev => ({
                ...prev,
                profile: { ...prev.profile, email: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                value={settingsData.profile.grade}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  profile: { ...prev.profile, grade: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Grade</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <input
                type="text"
                value={settingsData.profile.school}
                onChange={(e) => setSettingsData(prev => ({
                  ...prev,
                  profile: { ...prev.profile, school: e.target.value }
                }))}
                placeholder="Your school name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-colors">
            Save Profile Changes
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-600">Control what notifications you receive</p>
        </div>
        <div className="p-4 space-y-4">
          {[
            { key: 'sessionReminders', label: 'Session Reminders', description: 'Get notified before your sessions start' },
            { key: 'progressUpdates', label: 'Progress Updates', description: 'Receive updates about your learning progress' },
            { key: 'messages', label: 'Messages', description: 'Notifications for new messages from tutors' },
            { key: 'promotions', label: 'Promotions', description: 'Special offers and promotional content' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <button
                onClick={() => setSettingsData(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    [item.key]: !prev.notifications[item.key as keyof typeof prev.notifications]
                  }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settingsData.notifications[item.key as keyof typeof settingsData.notifications]
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settingsData.notifications[item.key as keyof typeof settingsData.notifications]
                      ? 'translate-x-6' 
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Learning Preferences</h2>
          <p className="text-sm text-gray-600">Customize your learning experience</p>
        </div>
        <div className="p-4 space-y-4">
          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subjects I'm Learning</label>
            <div className="flex flex-wrap gap-2">
              {['Mathematics', 'Science', 'English', 'History', 'Geography', 'Art'].map((subject) => (
                <button
                  key={subject}
                  onClick={() => {
                    setSettingsData(prev => ({
                      ...prev,
                      subjects: prev.subjects.includes(subject)
                        ? prev.subjects.filter(s => s !== subject)
                        : [...prev.subjects, subject]
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settingsData.subjects.includes(subject)
                      ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Learning Days</label>
            <div className="grid grid-cols-3 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    setSettingsData(prev => ({
                      ...prev,
                      availability: {
                        ...prev.availability,
                        preferredDays: prev.availability.preferredDays.includes(day)
                          ? prev.availability.preferredDays.filter(d => d !== day)
                          : [...prev.availability.preferredDays, day]
                      }
                    }));
                  }}
                  className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settingsData.availability.preferredDays.includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Times */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time of Day</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'morning', label: 'Morning', time: '8-12 AM' },
                { value: 'afternoon', label: 'Afternoon', time: '12-5 PM' },
                { value: 'evening', label: 'Evening', time: '5-8 PM' }
              ].map((time) => (
                <button
                  key={time.value}
                  onClick={() => setSettingsData(prev => ({
                    ...prev,
                    availability: { ...prev.availability, preferredTimes: time.value }
                  }))}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors text-center ${
                    settingsData.availability.preferredTimes === time.value
                      ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div>{time.label}</div>
                  <div className="text-xs opacity-75">{time.time}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">App Preferences</h2>
          <p className="text-sm text-gray-600">Customize how the app works for you</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Dark Mode</h3>
              <p className="text-sm text-gray-600">Use dark theme for better evening study</p>
            </div>
            <button
              onClick={() => setSettingsData(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  theme: prev.preferences.theme === 'light' ? 'dark' : 'light'
                }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settingsData.preferences.theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settingsData.preferences.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={settingsData.preferences.language}
              onChange={(e) => setSettingsData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, language: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en-ZA">English (South Africa)</option>
              <option value="af-ZA">Afrikaans</option>
              <option value="zu-ZA">isiZulu</option>
              <option value="xh-ZA">isiXhosa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-500 hover:to-pink-500 transition-colors">
          Save All Settings
        </button>
        
        <button className="w-full bg-red-50 text-red-600 py-3 px-4 rounded-xl font-medium hover:bg-red-100 transition-colors border border-red-200">
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderProgressContent = () => (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">My Progress</h1>
        <p className="text-blue-100">Track your learning journey and achievements</p>
      </div>

      {/* Milestone Celebration */}
      {stats.completedSessions > 0 && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Congratulations!</h2>
                <p className="text-yellow-100">You achieved a new milestone</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Science Goal</p>
                    <p className="text-sm text-yellow-100">90%+ Achieved!</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/20 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Streak</p>
                    <p className="text-sm text-yellow-100">5 weeks strong!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button className="bg-white text-orange-600 px-6 py-2 rounded-xl font-semibold hover:bg-yellow-50 transition-colors">
                Share Achievement
              </button>
            </div>
          </div>
          
          {/* Celebration decorations */}
          <div className="absolute top-4 right-4 text-white/30">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="absolute bottom-4 left-4 text-white/20">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>
      )}

      {/* Lesson Reports */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Lesson Reports</h2>
          <p className="text-sm text-gray-600">Feedback and progress from your tutors</p>
        </div>
        <div className="p-4">
          {stats.completedSessions > 0 ? (
            <div className="space-y-4">
              {/* Sample lesson report */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Mathematics</h3>
                      <p className="text-sm text-gray-600">Algebra - Linear Equations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-medium text-green-800 mb-1">Strengths</h4>
                    <p className="text-sm text-green-700">Excellent understanding of basic algebraic concepts. Great problem-solving approach.</p>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <h4 className="font-medium text-orange-800 mb-1">Areas for Improvement</h4>
                    <p className="text-sm text-orange-700">Practice more complex multi-step equations. Work on showing detailed steps.</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-800 mb-1">Next Session Goals</h4>
                    <p className="text-sm text-blue-700">Focus on quadratic equations and graphing linear functions.</p>
                  </div>
                </div>
              </div>

              {/* Second sample lesson report */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Science</h3>
                      <p className="text-sm text-gray-600">Chemistry - Chemical Reactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < 5 ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">4 days ago</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-medium text-green-800 mb-1">Strengths</h4>
                    <p className="text-sm text-green-700">Outstanding grasp of balancing chemical equations. Clear understanding of reaction types.</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-800 mb-1">Next Session Goals</h4>
                    <p className="text-sm text-blue-700">Explore reaction rates and factors affecting chemical reactions.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No lesson reports yet</h3>
              <p className="text-sm text-gray-500 mb-4">Complete lessons to receive detailed progress reports</p>
              <button
                onClick={() => setShowBookModal(true)}
                className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Book Your First Lesson
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Progress Summary</h2>
          <p className="text-sm text-gray-600">Your learning achievements at a glance</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
                  <p className="text-sm text-gray-600">Lessons Complete</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgRating?.toFixed(1) || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Recent Achievement</h3>
            </div>
            <p className="text-sm text-gray-700">
              {stats.completedSessions > 0 
                ? "Completed your first mathematics lesson with excellent feedback!" 
                : "Book your first lesson to start tracking achievements!"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Mock Test Results */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Mock Test Results</h2>
          <p className="text-sm text-gray-600">Track your assessment performance and improvement</p>
        </div>
        <div className="p-4">
          {stats.completedSessions > 0 ? (
            <div className="space-y-4">
              {/* Sample mock test result 1 */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Mathematics Mock Exam</h3>
                      <p className="text-sm text-gray-600">Algebra & Geometry Assessment</p>
                      <p className="text-xs text-gray-500">Completed 3 days ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-1">78%</div>
                    <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">B+</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Score</span>
                      <span className="text-sm font-bold text-blue-900">39/50</span>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-800">Time</span>
                      <span className="text-sm font-bold text-purple-900">85/90 min</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">Topic Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Algebra</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-green-500 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Geometry</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-yellow-500 rounded-full" style={{width: '70%'}}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">70%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Word Problems</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-orange-500 rounded-full" style={{width: '60%'}}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">60%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-1">Focus Areas</h4>
                  <p className="text-sm text-orange-700">Practice more word problems and geometric proofs. Consider additional review of area calculations.</p>
                </div>
              </div>

              {/* Sample mock test result 2 */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Science Quiz</h3>
                      <p className="text-sm text-gray-600">Chemistry Reactions & Elements</p>
                      <p className="text-xs text-gray-500">Completed 1 week ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-1">92%</div>
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">A</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Score</span>
                      <span className="text-sm font-bold text-blue-900">23/25</span>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-800">Time</span>
                      <span className="text-sm font-bold text-purple-900">28/30 min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Improvement!</h4>
                      <p className="text-sm text-green-700">+15% from last attempt</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-800">↗ +15%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No test results yet</h3>
              <p className="text-sm text-gray-500 mb-4">Complete mock tests with your tutor to track performance</p>
              <button
                onClick={() => setShowBookModal(true)}
                className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Schedule Assessment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subject Performance Graphs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Subject Performance</h2>
          <p className="text-sm text-gray-600">Track your progress trends across all subjects</p>
        </div>
        <div className="p-4">
          {stats.completedSessions > 0 ? (
            <div className="space-y-6">
              {/* Mathematics Performance */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Mathematics</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">78%</span>
                    <p className="text-xs text-green-600">↗ +5%</p>
                  </div>
                </div>
                
                {/* Simple progress visualization */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                  </div>
                  <div className="flex items-end space-x-2 h-16">
                    <div className="bg-blue-300 rounded-t flex-1" style={{height: '60%'}}></div>
                    <div className="bg-blue-400 rounded-t flex-1" style={{height: '65%'}}></div>
                    <div className="bg-blue-400 rounded-t flex-1" style={{height: '70%'}}></div>
                    <div className="bg-blue-500 rounded-t flex-1" style={{height: '75%'}}></div>
                    <div className="bg-blue-600 rounded-t flex-1" style={{height: '78%'}}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                    <span>60%</span>
                    <span>65%</span>
                    <span>70%</span>
                    <span>75%</span>
                    <span>78%</span>
                  </div>
                </div>
              </div>

              {/* Science Performance */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Science</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">92%</span>
                    <p className="text-xs text-green-600">↗ +8%</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                  </div>
                  <div className="flex items-end space-x-2 h-16">
                    <div className="bg-green-300 rounded-t flex-1" style={{height: '70%'}}></div>
                    <div className="bg-green-400 rounded-t flex-1" style={{height: '75%'}}></div>
                    <div className="bg-green-400 rounded-t flex-1" style={{height: '80%'}}></div>
                    <div className="bg-green-500 rounded-t flex-1" style={{height: '85%'}}></div>
                    <div className="bg-green-600 rounded-t flex-1" style={{height: '92%'}}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                    <span>70%</span>
                    <span>75%</span>
                    <span>80%</span>
                    <span>85%</span>
                    <span>92%</span>
                  </div>
                </div>
              </div>

              {/* English Performance */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">English</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-purple-600">85%</span>
                    <p className="text-xs text-green-600">↗ +3%</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                  </div>
                  <div className="flex items-end space-x-2 h-16">
                    <div className="bg-purple-300 rounded-t flex-1" style={{height: '75%'}}></div>
                    <div className="bg-purple-400 rounded-t flex-1" style={{height: '78%'}}></div>
                    <div className="bg-purple-400 rounded-t flex-1" style={{height: '80%'}}></div>
                    <div className="bg-purple-500 rounded-t flex-1" style={{height: '82%'}}></div>
                    <div className="bg-purple-600 rounded-t flex-1" style={{height: '85%'}}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                    <span>75%</span>
                    <span>78%</span>
                    <span>80%</span>
                    <span>82%</span>
                    <span>85%</span>
                  </div>
                </div>
              </div>

              {/* Overall Progress Summary */}
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Overall Trend</h3>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold text-green-600">Excellent progress!</span> All subjects showing consistent improvement over the past 5 months.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Science: Leading subject</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">Math: Focus area</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No performance data yet</h3>
              <p className="text-sm text-gray-500 mb-4">Complete more lessons to see your progress trends</p>
              <button
                onClick={() => setShowBookModal(true)}
                className="bg-gradient-to-r from-purple-400 to-violet-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Start Learning Journey
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Goal Setting & Tracking */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Learning Goals</h2>
          <p className="text-sm text-gray-600">Set targets and track your progress towards them</p>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {/* Current Goals */}
            <div className="space-y-3">
              {/* Goal 1 - Mathematics */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Achieve 85% in Mathematics</h3>
                      <p className="text-sm text-gray-600">Target: End of June 2025</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-600">78%</span>
                    <p className="text-xs text-gray-500">Current</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>7% to go</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div className="h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" style={{width: '78%'}}></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-center">
                      <span className="text-xs font-medium text-blue-800">Sessions</span>
                      <p className="text-lg font-bold text-blue-900">12/15</p>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-center">
                      <span className="text-xs font-medium text-green-800">On Track</span>
                      <p className="text-lg font-bold text-green-900">✓</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal 2 - Science */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Maintain 90%+ in Science</h3>
                      <p className="text-sm text-gray-600">Target: Throughout 2025</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-600">92%</span>
                    <p className="text-xs text-gray-500">Current</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>Goal exceeded!</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div className="h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">Goal Achieved!</span>
                  </div>
                </div>
              </div>

              {/* Goal 3 - Reading */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Read 2 Books per Month</h3>
                      <p className="text-sm text-gray-600">Target: This month</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-purple-600">1/2</span>
                    <p className="text-xs text-gray-500">Books</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>1 more to go</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div className="h-3 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full" style={{width: '50%'}}></div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-800">
                    <span className="font-medium">Currently reading:</span> "The Great Gatsby"
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Goal Button */}
            <div className="text-center py-4">
              <button className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-6 py-3 rounded-xl font-medium text-sm hover:scale-105 transition-all duration-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Set New Goal</span>
                </div>
              </button>
            </div>

            {/* Motivational Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">This Week's Focus</h3>
              </div>
              <p className="text-sm text-gray-700">
                Great progress! You're on track with most goals. Focus on completing 2 more math practice sessions to stay ahead of your target.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagesContent = () => (
    <MobileMessaging
      currentUserId={student.id}
      userRole="student"
      userName={`${student.firstName} ${student.lastName}`}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'sessions':
        return renderSessionsContent();
      case 'progress':
        return renderProgressContent();
      case 'messages':
        return renderMessagesContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 md:hidden">
      {/* Main Content */}
      <div className="px-4 pt-6">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="flex justify-around">
          {[
            {
              id: 'dashboard',
              label: 'Dashboard',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )
            },
            {
              id: 'sessions',
              label: 'My Sessions',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )
            },
            {
              id: 'progress',
              label: 'Progress',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )
            },
            {
              id: 'messages',
              label: 'Messages',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? (tab.id === 'progress' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50')
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {showBookModal && (
        <BookSessionModal
          studentId={student.id}
          onClose={() => setShowBookModal(false)}
        />
      )}
    </div>
  );
};