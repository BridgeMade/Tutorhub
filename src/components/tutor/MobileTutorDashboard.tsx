import React, { useState, useEffect } from 'react';
import { Tutor, TutoringSession, DashboardStats } from '../../types';
import { formatZAR, formatSADateTime, formatSATime } from '../../utils/saFormatting';
import { userService } from '../../services/userService';
import { availabilityService } from '../../services/availabilityService';
import { AvailabilityModal } from './AvailabilityModal';
import { MobileMessaging } from '../messaging/MobileMessaging';

interface MobileTutorDashboardProps {
  tutor: Tutor;
  upcomingSessions: TutoringSession[];
  stats: DashboardStats;
}

export const MobileTutorDashboard: React.FC<MobileTutorDashboardProps> = ({
  tutor,
  upcomingSessions,
  stats
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'students' | 'messages' | 'more'>('dashboard');
  const [studentNames, setStudentNames] = useState<{[key: string]: string}>({});
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAvailable, setIsAvailable] = useState(true);
  const [tutorAvailability, setTutorAvailability] = useState<any[]>([]);

  // Load tutor availability from database
  useEffect(() => {
    const loadTutorAvailability = async () => {
      try {
        console.log('📅 Loading tutor availability for:', tutor.id);
        const availabilityData = await availabilityService.getTutorAvailability(tutor.id);
        setTutorAvailability(availabilityData);
        console.log('✅ Loaded tutor availability slots:', availabilityData.length);
      } catch (error) {
        console.error('❌ Error loading tutor availability:', error);
        setTutorAvailability([]);
      }
    };

    loadTutorAvailability();
  }, [tutor.id]);

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

  const renderDashboardContent = () => (
    <div className="space-y-6 pb-24">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {tutor.firstName}!</h1>
        <p className="text-orange-100 mb-4">Ready to inspire and teach?</p>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span>{tutor.rating?.toFixed(1) || 'N/A'} Rating</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span>{formatZAR(tutor.hourlyRate)}/hr</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Sessions</h3>
              <p className="text-xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Students</h3>
              <p className="text-xl font-bold text-gray-900">{stats.totalStudents || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Rating</h3>
              <p className="text-xl font-bold text-gray-900">{stats.avgRating?.toFixed(1) || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Earnings</h3>
              <p className="text-xl font-bold text-gray-900">{formatZAR(stats.totalEarnings || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setActiveTab('schedule')}
          className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Schedule Session</h3>
              <p className="text-xs opacity-90">Manage calendar</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('students')}
          className="bg-gradient-to-r from-green-400 to-emerald-400 text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Message Student</h3>
              <p className="text-xs opacity-90">Send messages</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setShowAvailabilityModal(true)}
          className="bg-gradient-to-r from-purple-400 to-violet-400 text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Update Availability</h3>
              <p className="text-xs opacity-90">Set schedule</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('more')}
          className="bg-gradient-to-r from-orange-400 to-pink-400 text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">View Earnings</h3>
              <p className="text-xs opacity-90">Financial data</p>
            </div>
          </div>
        </button>
      </div>

      {/* Today's Sessions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Today's Sessions</h2>
          <p className="text-sm text-gray-600">Your teaching schedule for today</p>
        </div>
        <div className="p-4">
          {upcomingSessions.slice(0, 3).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No sessions today</h3>
              <p className="text-sm text-gray-500">Your schedule is clear for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                    {session.subject.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{session.subject}</h3>
                    <p className="text-sm text-gray-600">{studentNames[session.studentId] || 'Loading...'}</p>
                    <p className="text-xs text-gray-500">{formatSATime(session.scheduledAt)} • {session.duration}min</p>
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

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600">Your latest teaching updates</p>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Session completed with Sarah M.</p>
                <p className="text-xs text-gray-500">Mathematics • Received 5/5 rating • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New student assigned: John D.</p>
                <p className="text-xs text-gray-500">Science tutoring • First session tomorrow • 1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Payment received</p>
                <p className="text-xs text-gray-500">{formatZAR(tutor.hourlyRate * 2)} for 2 sessions • 3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScheduleContent = () => {
    // Get current month and year for navigation
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    // Calculate calendar days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    const calendarDays = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      calendarDays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Week view calculations
    const getWeekDates = (date: Date) => {
      const week = [];
      const start = new Date(date);
      start.setDate(start.getDate() - start.getDay()); // Start from Sunday
      
      for (let i = 0; i < 7; i++) {
        const weekDate = new Date(start);
        weekDate.setDate(start.getDate() + i);
        week.push(weekDate);
      }
      return week;
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
      setSelectedDate(newDate);
    };
    
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

    const getSessionsForDay = (date: Date) => {
      return upcomingSessions.filter(session => {
        const sessionDate = new Date(session.scheduledAt);
        return sessionDate.toDateString() === date.toDateString();
      });
    };

    const getAvailabilityForDay = (dayName: string) => {
      return tutorAvailability.filter(slot => slot.day === dayName);
    };

    const weekDates = getWeekDates(selectedDate);

    return (
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Schedule</h1>
              <p className="text-blue-100">Manage your teaching calendar</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAvailable(!isAvailable)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isAvailable 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}
              >
                {isAvailable ? 'Available' : 'Busy'}
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>{upcomingSessions.length} Sessions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Today: {upcomingSessions.filter(s => isToday(new Date(s.scheduledAt))).length}</span>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {calendarView === 'month' 
                    ? `${monthNames[currentMonth]} ${currentYear}`
                    : calendarView === 'week'
                    ? `Week of ${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  }
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (calendarView === 'month') {
                      navigateMonth('prev');
                    } else if (calendarView === 'week') {
                      navigateWeek('prev');
                    } else {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(selectedDate.getDate() - 1);
                      setSelectedDate(newDate);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (calendarView === 'month') {
                      navigateMonth('next');
                    } else if (calendarView === 'week') {
                      navigateWeek('next');
                    } else {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(selectedDate.getDate() + 1);
                      setSelectedDate(newDate);
                    }
                  }}
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
              {(['month', 'week', 'day'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setCalendarView(view)}
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
                            ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-semibold' 
                            : hasSessionDate
                            ? 'bg-orange-100 text-orange-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedDate(new Date(date))}
                      >
                        {date.getDate()}
                        {hasSessionDate && !isTodayDate && (
                          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {calendarView === 'week' && (
              <div className="space-y-4">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="text-center">
                      <div className="text-xs font-medium text-gray-500 mb-1">{day}</div>
                      <div className={`text-sm font-medium p-2 rounded-lg ${
                        isToday(weekDates[index])
                          ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
                          : 'text-gray-700'
                      }`}>
                        {weekDates[index].getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Array.from({ length: 12 }, (_, hourIndex) => {
                    const hour = hourIndex + 8; // Start from 8 AM
                    const timeString = `${hour.toString().padStart(2, '0')}:00`;
                    
                    return (
                      <div key={hour} className="border border-gray-100 rounded-lg">
                        <div className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 border-b border-gray-100">
                          {timeString} - {(hour + 1).toString().padStart(2, '0')}:00
                        </div>
                        <div className="grid grid-cols-7 divide-x divide-gray-100">
                          {weekDates.map((date, dayIndex) => {
                            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
                            const dayAvailability = getAvailabilityForDay(dayName);
                            const daySessions = getSessionsForDay(date);
                            
                            const isAvailableSlot = dayAvailability.some(slot => {
                              const slotStart = parseInt(slot.startTime.split(':')[0]);
                              const slotEnd = parseInt(slot.endTime.split(':')[0]);
                              return hour >= slotStart && hour < slotEnd && slot.isAvailable;
                            });
                            
                            const hasSessionAtTime = daySessions.some(session => {
                              const sessionHour = new Date(session.scheduledAt).getHours();
                              return sessionHour === hour;
                            });

                            const sessionAtTime = daySessions.find(session => {
                              const sessionHour = new Date(session.scheduledAt).getHours();
                              return sessionHour === hour;
                            });

                            return (
                              <div 
                                key={`${dayIndex}-${hour}`} 
                                className={`p-2 min-h-[40px] flex items-center justify-center text-xs ${
                                  hasSessionAtTime 
                                    ? 'bg-gradient-to-br from-orange-100 to-pink-100 border-orange-200' 
                                    : isAvailableSlot 
                                    ? 'bg-green-50 hover:bg-green-100' 
                                    : 'bg-white hover:bg-gray-50'
                                }`}
                              >
                                {hasSessionAtTime && sessionAtTime ? (
                                  <div className="text-center">
                                    <div className="font-medium text-orange-700 truncate">
                                      {sessionAtTime.subject}
                                    </div>
                                    <div className="text-orange-600 text-xs">
                                      {formatSATime(sessionAtTime.scheduledAt)}
                                    </div>
                                  </div>
                                ) : isAvailableSlot ? (
                                  <div className="text-green-600 font-medium">
                                    Available
                                  </div>
                                ) : (
                                  <div className="text-gray-300">
                                    -
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {calendarView === 'day' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Day View</h3>
                <p className="text-sm text-gray-500">Coming soon - hourly day schedule</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Today's Sessions</h2>
                <p className="text-sm text-gray-600">Your teaching schedule</p>
              </div>
              <button className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
                + Schedule
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingSessions.filter(s => isToday(new Date(s.scheduledAt))).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">No sessions today</h3>
                <p className="text-sm text-gray-500">Your schedule is clear</p>
              </div>
            ) : (
              upcomingSessions.filter(s => isToday(new Date(s.scheduledAt))).map((session) => (
                <div key={session.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                      {session.subject.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{session.subject}</h3>
                      <p className="text-sm text-gray-600">{studentNames[session.studentId] || 'Loading...'}</p>
                      <p className="text-sm text-gray-500">
                        {formatSATime(session.scheduledAt)} • {session.duration} min
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium">
                        Start
                      </button>
                      <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium">
                        Reschedule
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
            <p className="text-sm text-gray-600">Next 5 scheduled sessions</p>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingSessions.slice(0, 5).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">No upcoming sessions</h3>
                <p className="text-sm text-gray-500">Students can book sessions with you</p>
              </div>
            ) : (
              upcomingSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                      {session.subject.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{session.subject}</h3>
                      <p className="text-sm text-gray-600">{studentNames[session.studentId] || 'Loading...'}</p>
                      <p className="text-sm text-gray-500">
                        {formatSADateTime(session.scheduledAt)} • {session.duration} min
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        session.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStudentsContent = () => {
    // Get unique students from sessions
    const uniqueStudents = Array.from(new Set(upcomingSessions.map(session => session.studentId)))
      .map(studentId => ({
        id: studentId,
        name: studentNames[studentId] || 'Loading...',
        subjects: Array.from(new Set(upcomingSessions
          .filter(session => session.studentId === studentId)
          .map(session => session.subject))),
        totalSessions: upcomingSessions.filter(session => session.studentId === studentId).length,
        lastSession: upcomingSessions
          .filter(session => session.studentId === studentId)
          .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0]
      }));

    return (
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">My Students</h1>
              <p className="text-green-100">Manage your student relationships</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                {uniqueStudents.length} Students
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span>Messages Available</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search students..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Active Students</h2>
            <p className="text-sm text-gray-600">Students with upcoming sessions</p>
          </div>
          <div className="divide-y divide-gray-100">
            {uniqueStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">No students yet</h3>
                <p className="text-sm text-gray-500">Students will appear here when they book sessions</p>
              </div>
            ) : (
              uniqueStudents.map((student) => (
                <div key={student.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">
                        {student.subjects.join(', ')} • {student.totalSessions} sessions
                      </p>
                      <p className="text-xs text-gray-500">
                        Next: {student.lastSession ? formatSADateTime(student.lastSession.scheduledAt) : 'No sessions'}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-3 py-1 rounded-lg text-xs font-medium">
                        Message
                      </button>
                      <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium">
                        Progress
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMoreContent = () => (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">More</h1>
            <p className="text-gray-300">Additional tools and settings</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
              Tutor Tools
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span>Monthly: {formatZAR(stats.totalEarnings || 0)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span>Analytics Available</span>
          </div>
        </div>
      </div>

      {/* Quick Earnings Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">This Month's Earnings</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatZAR(stats.totalEarnings || 0)}</p>
            <p className="text-sm text-gray-600 mt-1">+12% from last month</p>
          </div>
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Features & Tools</h2>
          <p className="text-sm text-gray-600">Access advanced tutoring features</p>
        </div>
        <div className="divide-y divide-gray-100">
          <button className="w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">Detailed Earnings</h3>
              <p className="text-sm text-gray-500">View payment history and analytics</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button 
            onClick={() => setShowAvailabilityModal(true)}
            className="w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">Availability Settings</h3>
              <p className="text-sm text-gray-500">Manage your teaching schedule</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">Analytics & Reports</h3>
              <p className="text-sm text-gray-500">Track student progress and performance</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">Teaching Resources</h3>
              <p className="text-sm text-gray-500">Upload and manage learning materials</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Account & Settings</h2>
          <p className="text-sm text-gray-600">Manage your tutor profile</p>
        </div>
        <div className="divide-y divide-gray-100">
          <button className="w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">Profile Settings</h3>
              <p className="text-sm text-gray-500">Update bio, qualifications, and subjects</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM12 10v4l-3 3h6l-3-3v-4z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-500">Session alerts and message preferences</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5zM8.25 12a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">Help & Support</h3>
              <p className="text-sm text-gray-500">FAQs, contact support, and guides</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Profile Quick View */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
            {tutor.firstName.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{tutor.firstName} {tutor.lastName}</h3>
            <p className="text-orange-100 text-sm">
              {tutor.subjects?.join(', ') || 'No subjects'} • {formatZAR(tutor.hourlyRate)}/hr
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{tutor.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <span>•</span>
              <span>{stats.totalSessions} sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagesContent = () => (
    <MobileMessaging
      currentUserId={tutor.id}
      userRole="tutor"
      userName={`${tutor.firstName} ${tutor.lastName}`}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'schedule':
        return renderScheduleContent();
      case 'students':
        return renderStudentsContent();
      case 'messages':
        return renderMessagesContent();
      case 'more':
        return renderMoreContent();
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              id: 'schedule',
              label: 'Schedule',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              id: 'students',
              label: 'Students',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
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
              id: 'more',
              label: 'More',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              )
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Availability Modal */}
      <AvailabilityModal
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        tutorId={tutor.id}
        initialAvailability={tutorAvailability}
        onSave={async (availability) => {
          setTutorAvailability(availability);
          console.log('Saved availability:', availability);
          // Reload availability from database to ensure sync
          try {
            const reloadedAvailability = await availabilityService.getTutorAvailability(tutor.id);
            setTutorAvailability(reloadedAvailability);
          } catch (error) {
            console.error('❌ Error reloading availability after save:', error);
          }
        }}
      />
    </div>
  );
};