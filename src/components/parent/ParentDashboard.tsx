import React, { useState, useEffect, useRef } from 'react';
import { Calendar, BookOpen, MessageCircle, TrendingUp, Settings, Bell, User, Plus } from 'lucide-react';
import { MdStar, MdRocket, MdTrendingUp } from 'react-icons/md';
import { BottomNavigation, getParentNavigationTabs } from '../common/BottomNavigation';
import { MobileMessaging } from '../messaging/MobileMessaging';
import { AppHeader } from '../common/AppHeader';

interface Student {
  id: string;
  name: string;
  grade: string;
  subject: string;
  nextSession?: {
    time: string;
    tutor: string;
    subject: string;
  };
  weeklyProgress: number;
}

interface Session {
  id: string;
  time: string;
  student: string;
  grade: string;
  subject: string;
  tutor: string;
  location: string;
  cost: number;
  status: 'upcoming' | 'in-progress' | 'completed';
}

interface Notification {
  id: string;
  type: 'completion' | 'message' | 'reschedule' | 'payment';
  title: string;
  message: string;
  time: string;
  student?: string;
}

interface MonthlyOverview {
  sessionsCompleted: number;
  totalInvestment: number;
  budget: number;
  progressHighlights: string[];
}

interface ParentDashboardProps {
  parentId: string;
  parent?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ parentId, parent }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [students] = useState<Student[]>([
    {
      id: '1',
      name: 'Emma',
      grade: 'K',
      subject: 'Math',
      nextSession: {
        time: 'Next: 2hrs',
        tutor: 'Ms. Jennifer',
        subject: 'Math'
      },
      weeklyProgress: 80
    },
    {
      id: '2', 
      name: 'Michael',
      grade: '5',
      subject: 'Reading',
      nextSession: {
        time: 'Next: 3hrs',
        tutor: 'Mr. David',
        subject: 'Reading'
      },
      weeklyProgress: 90
    },
    {
      id: '3',
      name: 'Sophia',
      grade: '8', 
      subject: 'Science',
      nextSession: {
        time: '4:30 Today',
        tutor: 'Dr. Williams',
        subject: 'Science'
      },
      weeklyProgress: 100
    }
  ]);

  const [todaysSessions] = useState<Session[]>([
    {
      id: '1',
      time: '2:00 PM',
      student: 'Emma Johnson',
      grade: 'Kindergarten',
      subject: 'Math Basics',
      tutor: 'Ms. Jennifer',
      location: 'Online Session',
      cost: 25,
      status: 'upcoming'
    },
    {
      id: '2',
      time: '3:00 PM', 
      student: 'Michael',
      grade: 'Grade 5',
      subject: 'Reading Comprehension',
      tutor: 'Mr. David',
      location: 'In-Person',
      cost: 30,
      status: 'upcoming'
    },
    {
      id: '3',
      time: '4:30 PM',
      student: 'Sophia',
      grade: 'Grade 8', 
      subject: 'Science Lab',
      tutor: 'Dr. Williams',
      location: 'Online Session',
      cost: 35,
      status: 'upcoming'
    }
  ]);

  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'completion',
      title: 'Emma completed Math worksheet - Great progress!',
      message: 'Ms. Jennifer • Math Tutoring',
      time: 'Today, 10:30 AM',
      student: 'Emma'
    },
    {
      id: '2',
      type: 'message',
      title: "Sophia's Science test results: A- (Excellent!)",
      message: 'Dr. Williams • Science Tutoring',
      time: 'Yesterday, 4:45 PM',
      student: 'Sophia'
    },
    {
      id: '3',
      type: 'reschedule',
      title: "Michael's reading session rescheduled to 3:30",
      message: 'Mr. David • Reading Tutoring',
      time: 'Monday, 2:15 PM',
      student: 'Michael'
    }
  ]);

  const [monthlyOverview] = useState<MonthlyOverview>({
    sessionsCompleted: 24,
    totalInvestment: 720,
    budget: 800,
    progressHighlights: [
      'Emma: Mastered basic addition concepts',
      'Michael: Reading level improved by 2 grades',
      'Sophia: Science test scores up 15%'
    ]
  });

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

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'message':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case 'reschedule':
        return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'schedule':
        return renderScheduleContent();
      case 'messages':
        return renderMessagesContent();
      case 'progress':
        return renderProgressContent();
      case 'profile':
        return renderProfileContent();
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--tutorkai-neutral-50)' }}>
      {/* App Header */}
      <AppHeader 
        firstName={parent?.firstName || 'Sarah'}
        lastName={parent?.lastName || 'Johnson'}
        userRole="parent"
        notificationCount={3}
        onProfileClick={() => setShowProfileMenu(!showProfileMenu)}
      />

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
                  setActiveTab('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                View Profile
              </button>
              <button 
                onClick={() => {
                  // Parent dashboard doesn't have settings tab, could navigate to settings or show message
                  setShowProfileMenu(false);
                  console.log('Settings functionality to be implemented');
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
      
      <div style={{ padding: 'var(--tutorkai-space-4)' }}>
        {/* Overview Stats */}
        <div className="flex items-center" style={{
          gap: 'var(--tutorkai-space-6)',
          marginBottom: 'var(--tutorkai-space-4)'
        }}>
          <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
            <span className="tutorkai-body-sm" style={{
              fontWeight: 'var(--tutorkai-font-medium)',
              color: 'var(--tutorkai-secondary-700)'
            }}>Student Overview:</span>
            <span className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-primary-600)' }}>3 Active</span>
          </div>
          <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
            <span className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-secondary-600)' }}>
              8 Sessions This Week
            </span>
          </div>
        </div>
      </div>

        {/* Student Quick Selector */}
        <div className="bg-white border-b" style={{
          borderColor: 'var(--tutorkai-secondary-200)',
          padding: 'var(--tutorkai-space-4)'
        }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--tutorkai-space-3)' }}>
          <h2 className="tutorkai-heading-5">My Students</h2>
          <button className="flex items-center tutorkai-btn-secondary" style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--tutorkai-primary-600)',
            gap: 'var(--tutorkai-space-1)',
            padding: 'var(--tutorkai-space-2)'
          }}>
            <Plus className="w-4 h-4" />
            <span className="tutorkai-caption">Add Child</span>
          </button>
        </div>
        
        <div className="flex overflow-x-auto" style={{
          gap: 'var(--tutorkai-space-4)',
          paddingBottom: 'var(--tutorkai-space-2)'
        }}>
          {students.map((student) => (
            <div key={student.id} className="flex-shrink-0 rounded-lg" style={{
              backgroundColor: 'var(--tutorkai-secondary-50)',
              borderRadius: 'var(--tutorkai-radius-lg)',
              padding: 'var(--tutorkai-space-3)',
              minWidth: '160px'
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--tutorkai-space-1)' }}>
                <span className="tutorkai-body" style={{ fontWeight: 'var(--tutorkai-font-medium)' }}>
                  {student.name} ({student.grade})
                </span>
              </div>
              <div className="tutorkai-body-sm" style={{
                color: 'var(--tutorkai-secondary-600)',
                marginBottom: 'var(--tutorkai-space-2)'
              }}>
                {student.subject} {student.nextSession?.time}
              </div>
              <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < Math.floor(student.weeklyProgress / 20)
                        ? getProgressColor(student.weeklyProgress)
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
                <span className="tutorkai-caption" style={{
                  color: 'var(--tutorkai-secondary-500)',
                  marginLeft: 'var(--tutorkai-space-1)'
                }}>Wk</span>
              </div>
            </div>
          ))}
          
          {/* All Students View */}
          <div className="flex-shrink-0 rounded-lg flex items-center justify-center cursor-pointer" style={{
            backgroundColor: 'var(--tutorkai-primary-50)',
            borderRadius: 'var(--tutorkai-radius-lg)',
            padding: 'var(--tutorkai-space-3)',
            minWidth: '100px',
            transition: 'background-color var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--tutorkai-primary-100)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--tutorkai-primary-50)'}>
            <div className="text-center">
              <div className="tutorkai-body-sm" style={{
                fontWeight: 'var(--tutorkai-font-medium)',
                color: 'var(--tutorkai-primary-700)'
              }}>All</div>
              <div className="tutorkai-caption" style={{ color: 'var(--tutorkai-primary-600)' }}>Students</div>
              <div className="tutorkai-caption" style={{ color: 'var(--tutorkai-primary-600)' }}>View</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Today's Schedule */}
        <div className="tutorkai-card">
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--tutorkai-secondary-200)' }}>
            <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
              <Calendar className="w-5 h-5" style={{ color: 'var(--tutorkai-primary-600)' }} />
              <h3 className="tutorkai-heading-4">Today's Schedule</h3>
            </div>
            <button className="tutorkai-btn-secondary tutorkai-caption" style={{ 
              background: 'transparent', 
              border: 'none',
              color: 'var(--tutorkai-primary-600)',
              padding: 'var(--tutorkai-space-2)'
            }}>
              View Calendar
            </button>
          </div>
          
          <div style={{ 
            padding: 'var(--tutorkai-space-4)', 
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--tutorkai-space-4)'
          }}>
            {todaysSessions.map((session) => (
              <div key={session.id} className="border rounded-lg" style={{ 
                borderColor: 'var(--tutorkai-secondary-200)',
                borderRadius: 'var(--tutorkai-radius-lg)',
                padding: 'var(--tutorkai-space-4)'
              }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="tutorkai-body" style={{ fontWeight: 'var(--tutorkai-font-medium)' }}>
                      {session.time} - {session.student} ({session.grade})
                    </div>
                    <div className="tutorkai-body-sm">
                      📚 {session.subject} with {session.tutor}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tutorkai-caption">{session.location}</div>
                    <div className="tutorkai-body" style={{ fontWeight: 'var(--tutorkai-font-medium)' }}>
                      ${session.cost}
                    </div>
                  </div>
                </div>
                
                <div className="flex" style={{ gap: 'var(--tutorkai-space-2)' }}>
                  {session.location === 'Online Session' ? (
                    <button className="tutorkai-btn tutorkai-btn-success">
                      Join
                    </button>
                  ) : (
                    <button className="tutorkai-btn tutorkai-btn-primary">
                      Directions
                    </button>
                  )}
                  <button className="tutorkai-btn tutorkai-btn-secondary">
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4" style={{ gap: 'var(--tutorkai-space-4)' }}>
          <button className="tutorkai-card flex flex-col items-center" style={{ 
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            minHeight: '80px',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <Calendar className="w-6 h-6" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-caption" style={{ 
              fontWeight: 'var(--tutorkai-font-medium)',
              textAlign: 'center'
            }}>
              Book Session
            </span>
          </button>
          <button className="tutorkai-card flex flex-col items-center" style={{ 
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            minHeight: '80px',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <MessageCircle className="w-6 h-6" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-caption" style={{ 
              fontWeight: 'var(--tutorkai-font-medium)',
              textAlign: 'center'
            }}>
              Messages
            </span>
          </button>
          <button className="tutorkai-card flex flex-col items-center" style={{ 
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            minHeight: '80px',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <TrendingUp className="w-6 h-6" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-caption" style={{ 
              fontWeight: 'var(--tutorkai-font-medium)',
              textAlign: 'center'
            }}>
              Progress Reports
            </span>
          </button>
          <button className="tutorkai-card flex flex-col items-center" style={{ 
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            minHeight: '80px',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ 
              fontSize: 'var(--tutorkai-text-lg)',
              color: 'var(--tutorkai-primary-600)'
            }}>⋯</div>
            <span className="tutorkai-caption" style={{ 
              fontWeight: 'var(--tutorkai-font-medium)',
              textAlign: 'center'
            }}>
              More
            </span>
          </button>
        </div>

        {/* Notifications & Updates */}
        <div className="tutorkai-card">
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--tutorkai-secondary-200)' }}>
            <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
              <Bell className="w-5 h-5" style={{ color: 'var(--tutorkai-primary-600)' }} />
              <h3 className="tutorkai-heading-4">Recent Updates</h3>
            </div>
            <button className="tutorkai-btn-secondary tutorkai-caption" style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--tutorkai-primary-600)',
              padding: 'var(--tutorkai-space-2)'
            }}>View All</button>
          </div>
          
          <div style={{
            padding: 'var(--tutorkai-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--tutorkai-space-3)'
          }}>
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start rounded-lg" style={{
                gap: 'var(--tutorkai-space-3)',
                padding: 'var(--tutorkai-space-3)',
                transition: 'background-color var(--tutorkai-duration-fast) var(--tutorkai-ease-out)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--tutorkai-secondary-50)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div className="flex-shrink-0" style={{ marginTop: 'var(--tutorkai-space-1)' }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="tutorkai-body-sm" style={{ fontWeight: 'var(--tutorkai-font-medium)' }}>
                    {notification.title}
                  </div>
                  <div className="tutorkai-caption" style={{
                    color: 'var(--tutorkai-secondary-600)',
                    marginTop: 'var(--tutorkai-space-1)'
                  }}>
                    {notification.message}
                  </div>
                  <div className="tutorkai-caption" style={{
                    color: 'var(--tutorkai-secondary-500)',
                    marginTop: 'var(--tutorkai-space-1)'
                  }}>
                    {notification.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Overview */}
        <div className="tutorkai-card">
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--tutorkai-secondary-200)' }}>
            <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--tutorkai-primary-600)' }} />
              <h3 className="tutorkai-heading-4">This Month Overview</h3>
            </div>
            <button className="tutorkai-btn-secondary tutorkai-caption" style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--tutorkai-primary-600)',
              padding: 'var(--tutorkai-space-2)'
            }}>Full Report</button>
          </div>
          
          <div style={{ padding: 'var(--tutorkai-space-4)' }}>
            {/* Stats Cards */}
            <div className="grid grid-cols-2" style={{
              gap: 'var(--tutorkai-space-4)',
              marginBottom: 'var(--tutorkai-space-4)'
            }}>
              <div className="text-center">
                <div className="tutorkai-heading-2" style={{ color: 'var(--tutorkai-secondary-900)' }}>
                  {monthlyOverview.sessionsCompleted}
                </div>
                <div className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                  Sessions Completed
                </div>
                <div className="tutorkai-caption" style={{ color: 'var(--tutorkai-success-600)' }}>
                  ↑ 3 from last mo.
                </div>
              </div>
              <div className="text-center">
                <div className="tutorkai-heading-2" style={{ color: 'var(--tutorkai-secondary-900)' }}>
                  ${monthlyOverview.totalInvestment}
                </div>
                <div className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                  Total Investment
                </div>
                <div className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-500)' }}>
                  Budget: ${monthlyOverview.budget}/month
                </div>
              </div>
            </div>

            {/* Progress Highlights */}
            <div className="rounded-lg" style={{
              backgroundColor: 'var(--tutorkai-secondary-50)',
              borderRadius: 'var(--tutorkai-radius-lg)',
              padding: 'var(--tutorkai-space-3)'
            }}>
              <h4 className="tutorkai-body" style={{
                fontWeight: 'var(--tutorkai-font-medium)',
                color: 'var(--tutorkai-secondary-900)',
                marginBottom: 'var(--tutorkai-space-2)'
              }}>Progress Highlights</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tutorkai-space-1)' }}>
                {monthlyOverview.progressHighlights.map((highlight, index) => (
                  <div key={index} className="tutorkai-body-sm flex items-center" style={{ 
                    color: 'var(--tutorkai-secondary-700)', 
                    gap: 'var(--tutorkai-space-2)' 
                  }}>
                    {index === 0 && <MdStar size={16} color='var(--tutorkai-warning-500)' />}
                    {index === 1 && <MdRocket size={16} color='var(--tutorkai-success-500)' />}
                    {index === 2 && <MdTrendingUp size={16} color='var(--tutorkai-primary-500)' />}
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );

  const renderScheduleContent = () => (
    <div className="px-6 py-6 space-y-6 min-h-screen pb-20" style={{ backgroundColor: 'var(--tutorkai-neutral-50)' }}>
      <h1 className="text-[28px] font-bold text-black mb-6">Schedule</h1>
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Your children's schedule will appear here</p>
      </div>
    </div>
  );

  const renderMessagesContent = () => (
    <div className="h-screen">
      <MobileMessaging 
        userId={parent?.id || parentId}
        userRole="admin"
        userName={parent ? `${parent.firstName} ${parent.lastName}` : 'Parent'}
      />
    </div>
  );

  const renderProgressContent = () => (
    <div className="px-6 py-6 space-y-6 min-h-screen pb-20" style={{ backgroundColor: 'var(--tutorkai-neutral-50)' }}>
      <h1 className="text-[28px] font-bold text-black mb-6">Progress</h1>
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Your children's progress will be tracked here</p>
      </div>
    </div>
  );

  const renderProfileContent = () => (
    <div className="px-6 py-6 space-y-6 min-h-screen pb-20" style={{ backgroundColor: 'var(--tutorkai-neutral-50)' }}>
      <h1 className="text-[28px] font-bold text-black mb-6">Profile</h1>
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">
            {parent ? parent.firstName[0] : 'P'}
          </span>
        </div>
        <p className="text-black font-semibold text-lg">
          {parent ? `${parent.firstName} ${parent.lastName}` : 'Parent'}
        </p>
        <p className="text-gray-600">Parent Account</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--tutorkai-neutral-50)' }}>
      {renderContent()}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={getParentNavigationTabs()}
      />
    </div>
  );
};

export default ParentDashboard;