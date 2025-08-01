import React, { useState, useEffect } from 'react';
import { Tutor, TutoringSession, DashboardStats } from '../../../types';
import { EarningsAnalytics } from './EarningsAnalytics';
import { StudentManagement } from './StudentManagement';
import { ScheduleManagement } from './ScheduleManagement';
import { SessionCalendarView } from '../../student/SessionCalendarView';
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
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [studentNames, setStudentNames] = useState<{[key: string]: string}>({});

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

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-400 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {tutor.firstName}!</h1>
              <p className="text-orange-100 text-xl mb-6">
                Your comprehensive tutoring command center
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="bg-white/20 px-4 py-3 rounded-xl">
                  <div className="font-semibold">Students</div>
                  <div className="text-2xl font-bold">{stats.totalStudents || 12}</div>
                </div>
                <div className="bg-white/20 px-4 py-3 rounded-xl">
                  <div className="font-semibold">This Week</div>
                  <div className="text-2xl font-bold">{upcomingSessions.length}</div>
                </div>
                <div className="bg-white/20 px-4 py-3 rounded-xl">
                  <div className="font-semibold">Rating</div>
                  <div className="text-2xl font-bold">{tutor.rating?.toFixed(1) || '4.9'}</div>
                </div>
                <div className="bg-white/20 px-4 py-3 rounded-xl">
                  <div className="font-semibold">Earnings</div>
                  <div className="text-2xl font-bold">{formatZAR(2450)}</div>
                </div>
                <div className="bg-white/20 px-4 py-3 rounded-xl">
                  <div className="font-semibold">Avg Progress</div>
                  <div className="text-2xl font-bold">87%</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowQuickAction(true)}
              className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Quick Actions
            </button>
          </div>
        </div>
      </div>


      {/* Upcoming Lessons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Upcoming Lessons</h3>
            <p className="text-sm text-gray-600">Your next scheduled tutoring sessions</p>
          </div>
          <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">View Full Schedule</button>
        </div>

        <div className="space-y-4">
          {upcomingSessions.slice(0, 4).map((session, index) => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {formatSADateTime(session.scheduledAt).split(',')[1]?.trim().slice(0, 5)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{session.subject}</h4>
                  <p className="text-sm text-gray-600">{studentNames[session.studentId] || 'Loading...'}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                    <span className="text-xs text-gray-500">{session.duration} min</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-500 hover:to-green-600 transition-all duration-200">
                  Start Session
                </button>
                <button className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
                  Reschedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Session Calendar</h3>
            <p className="text-sm text-gray-600">View your upcoming sessions and availability</p>
          </div>
        </div>
        <SessionCalendarView
          sessions={upcomingSessions}
          selectedMonth={new Date()}
          onMonthChange={() => {}}
          onSessionClick={(session) => {
            console.log('Session clicked:', session);
          }}
        />
      </div>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { type: 'session_completed', message: 'Mathematics session with John completed', time: '2 hours ago', color: 'green' },
              { type: 'payment_received', message: 'Payment received for Physics sessions', time: '4 hours ago', color: 'blue' },
              { type: 'new_booking', message: 'New Chemistry session booked by Sarah', time: '6 hours ago', color: 'purple' },
              { type: 'feedback_received', message: 'New 5-star review from Mike', time: '1 day ago', color: 'yellow' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full bg-${activity.color}-400 mt-2 flex-shrink-0`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                <div className="flex items-center space-x-3">
                  {action.icon}
                  <div>
                    <div className="font-semibold text-sm">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'students':
        return <StudentManagement tutorId={tutor.id} />;
      case 'schedule':
        return <ScheduleManagement tutorId={tutor.id} sessions={upcomingSessions} />;
      case 'earnings':
        return <EarningsAnalytics tutorId={tutor.id} hourlyRate={tutor.hourlyRate} />;
      case 'performance':
        return (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
            <p className="text-gray-600">Detailed performance metrics and analytics coming soon!</p>
          </div>
        );
      case 'resources':
        return (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Resource Library</h3>
            <p className="text-gray-600">Teaching resources and materials management coming soon!</p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Content based on sidebar navigation */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>

      {/* Quick Action Modal */}
      {showQuickAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
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
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className={`w-full bg-gradient-to-r ${action.color} text-white p-4 rounded-xl text-left hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                  <div className="flex items-center space-x-3">
                    {action.icon}
                    <div>
                      <div className="font-semibold">{action.title}</div>
                      <div className="text-sm opacity-90">{action.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};