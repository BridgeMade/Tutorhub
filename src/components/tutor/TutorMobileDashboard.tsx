import React, { useState } from 'react';
import { Calendar, CheckSquare, BookOpen, MessageCircle, TrendingUp, User, Clock, Plus, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  MdSchool, 
  MdAttachMoney, 
  MdNoteAlt, 
  MdBarChart, 
  MdCheckCircle,
  MdAssignment,
  MdPerson,
  MdLocationOn,
  MdVideoCall,
  MdPhone,
  MdEditNote,
  MdLightbulb,
  MdSchedule,
  MdCircle,
  MdAutoAwesome,
  MdSettings,
  MdStar,
  MdWarning
} from 'react-icons/md';

interface Session {
  id: string;
  time: string;
  student: string;
  grade: string;
  subject: string;
  type: 'online' | 'in-person';
  cost: number;
  notes?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueTime: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  type: 'admin' | 'auto' | 'self';
  student?: string;
}

interface WeeklyOverview {
  sessionsBooked: number;
  hoursAvailable: number;
  earnings: number;
  goal: number;
}

interface Activity {
  id: string;
  type: 'session' | 'message' | 'content' | 'payment';
  title: string;
  description: string;
  time: string;
  amount?: number;
}

interface TutorMobileDashboardProps {
  tutorName: string;
  todayEarnings: number;
  weeklyEarnings: number;
}

const TutorMobileDashboard: React.FC<TutorMobileDashboardProps> = ({
  tutorName = 'Dr. Williams',
  todayEarnings = 420,
  weeklyEarnings = 420
}) => {
  const [currentDay, setCurrentDay] = useState(2); // Wednesday (index 2)
  const [weekdays] = useState(['MON 16', 'TUE 17', 'WED 18', 'THU 19', 'FRI 20']);
  const [dayLabels] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  const [todaysSessions] = useState<Session[]>([
    {
      id: '1',
      time: '2:00 PM',
      student: 'Emma Johnson',
      grade: 'Grade K',
      subject: 'Math Basics',
      type: 'online',
      cost: 25,
      notes: 'Practice counting & shapes'
    },
    {
      id: '2',
      time: '3:30 PM',
      student: 'Michael Chen',
      grade: 'Grade 5',
      subject: 'Reading Comprehension',
      type: 'in-person',
      cost: 30,
      notes: 'Novel chapter discussion'
    },
    {
      id: '3',
      time: '5:00 PM',
      student: 'Sophia Martinez',
      grade: 'Grade 8',
      subject: 'Advanced Science',
      type: 'online',
      cost: 35,
      notes: 'Chemistry lab review'
    }
  ]);

  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Submit Lesson Reports',
      description: 'Emma (Math) & Michael (Reading) reports overdue',
      dueTime: 'Due: 6:00 PM',
      priority: 'urgent',
      type: 'admin'
    },
    {
      id: '2',
      title: 'Prepare for Sophia\'s Chemistry Session',
      description: 'Create practice problems for chemical equations',
      dueTime: 'Due: 4 PM',
      priority: 'high',
      type: 'auto',
      student: 'Sophia'
    },
    {
      id: '3',
      title: 'Monthly Performance Review',
      description: 'Submit self-assessment and student feedback forms',
      dueTime: 'Due: Dec 20',
      priority: 'medium',
      type: 'admin'
    }
  ]);

  const [weeklyOverview] = useState<WeeklyOverview>({
    sessionsBooked: 18,
    hoursAvailable: 8,
    earnings: 420,
    goal: 500
  });

  const [recentActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'session',
      title: 'Completed Chemistry session with Sophia',
      description: 'Session rating: 5 stars • Earned: $35',
      time: '2 hours ago'
    },
    {
      id: '2',
      type: 'message',
      title: 'Received message from Sarah Johnson (Emma\'s mom)',
      description: '"Thank you for today\'s session! Emma loved it!"',
      time: '4 hours ago'
    },
    {
      id: '3',
      type: 'content',
      title: 'Created new worksheet: "Fraction Basics"',
      description: 'Added to content library • Used by 3 tutors',
      time: 'Yesterday'
    },
    {
      id: '4',
      type: 'payment',
      title: 'Payment received: $150 (5 sessions with Michael)',
      description: 'Payment method: Bank transfer',
      time: 'Yesterday',
      amount: 150
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <MdCheckCircle size={16} color='var(--tutorkai-success-600)' />;
      case 'message':
        return <MessageCircle size={16} color='var(--tutorkai-primary-600)' />;
      case 'content':
        return <MdSchool size={16} color='var(--tutorkai-secondary-600)' />;
      case 'payment':
        return <MdAttachMoney size={16} color='var(--tutorkai-success-600)' />;
      default:
        return <MdAssignment size={16} color='var(--tutorkai-secondary-500)' />;
    }
  };

  const navigateDay = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentDay > 0) {
      setCurrentDay(currentDay - 1);
    } else if (direction === 'right' && currentDay < weekdays.length - 1) {
      setCurrentDay(currentDay + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">TutorKai Tutor</h1>
            <p className="text-sm text-gray-600">Good morning, {tutorName}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                4
              </div>
            </div>
            <User className="w-6 h-6 text-gray-600" />
          </div>
        </div>
        
        <div style={{ 
          marginTop: 'var(--tutorkai-space-3)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--tutorkai-space-6)' 
        }}>
          <div className="tutorkai-body-sm">
            <span style={{ color: 'var(--tutorkai-secondary-600)' }}>Today:</span>
            <span style={{ 
              marginLeft: 'var(--tutorkai-space-1)', 
              fontWeight: 'var(--tutorkai-font-medium)' 
            }}>6 sessions</span>
          </div>
          <div className="tutorkai-body-sm">
            <span style={{ color: 'var(--tutorkai-secondary-600)' }}>This Week:</span>
            <span style={{ 
              marginLeft: 'var(--tutorkai-space-1)', 
              fontWeight: 'var(--tutorkai-font-medium)',
              color: 'var(--tutorkai-success-600)'
            }}>${weeklyEarnings} earned</span>
          </div>
        </div>
        
        <div style={{ 
          marginTop: 'var(--tutorkai-space-2)', 
          backgroundColor: 'var(--tutorkai-primary-50)', 
          borderRadius: 'var(--tutorkai-radius-lg)', 
          padding: 'var(--tutorkai-space-3)' 
        }}>
          <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
            <Clock className="w-4 h-4" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-body-sm" style={{ 
              color: 'var(--tutorkai-primary-800)', 
              fontWeight: 'var(--tutorkai-font-medium)' 
            }}>Next: Chemistry in 30 mins</span>
          </div>
        </div>
      </div>

      <div style={{ 
        padding: 'var(--tutorkai-space-4)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--tutorkai-space-6)' 
      }}>
        {/* Daily Schedule (Horizontal Swipe) */}
        <div className="tutorkai-card">
          <div style={{ 
            padding: 'var(--tutorkai-space-4) var(--tutorkai-space-4) var(--tutorkai-space-3)', 
            borderBottom: '1px solid var(--tutorkai-secondary-200)' 
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => navigateDay('left')}
                  disabled={currentDay === 0}
                  className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex space-x-2">
                  {weekdays.map((day, index) => (
                    <div
                      key={day}
                      className={`px-2 py-1 rounded text-sm ${
                        index === currentDay
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-500'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigateDay('right')}
                  disabled={currentDay === weekdays.length - 1}
                  className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button className="tutorkai-btn-secondary tutorkai-body-sm" style={{ 
                background: 'transparent', 
                border: 'none',
                color: 'var(--tutorkai-primary-600)' 
              }}>View Week</button>
            </div>
            <div className="flex justify-center mt-2">
              <div className="flex space-x-1">
                {weekdays.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentDay ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-gray-900">
                TODAY - {dayLabels[currentDay]}, Dec {18 + currentDay - 2}
              </span>
            </div>
          </div>
          
          <div style={{ 
            padding: 'var(--tutorkai-space-4)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--tutorkai-space-4)' 
          }}>
            {todaysSessions.map((session, index) => (
              <div key={session.id} className={`rounded-lg p-4 ${index === 0 ? 'bg-red-50 border-l-4 border-red-500' : 'bg-gray-50'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    {index === 0 && (
                      <div className="flex items-center mb-1" style={{ gap: 'var(--tutorkai-space-1)' }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--tutorkai-error-500)' }}></div>
                        <span className="tutorkai-caption" style={{ 
                          fontWeight: 'var(--tutorkai-font-medium)', 
                          color: 'var(--tutorkai-error-600)' 
                        }}>NEXT: {session.time} (30 mins)</span>
                      </div>
                    )}
                    <div className="tutorkai-body flex items-center gap-2" style={{ 
                      fontWeight: 'var(--tutorkai-font-medium)', 
                      color: 'var(--tutorkai-secondary-900)' 
                    }}>
                      <MdPerson size={16} color='var(--tutorkai-primary-600)' />
                      {session.student} ({session.grade}) • {session.subject}
                    </div>
                    <div className="tutorkai-body-sm flex items-center gap-2" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                      <MdLocationOn size={14} color='var(--tutorkai-secondary-600)' />
                      {session.type === 'online' ? 'Online Session' : 'In-Person'} • ${session.cost}/hour
                    </div>
                    <div className="tutorkai-body-sm flex items-center gap-1" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                      <MdNoteAlt size={14} color='var(--tutorkai-secondary-600)' /> {session.notes}
                    </div>
                  </div>
                </div>
                
                <div className="flex" style={{ gap: 'var(--tutorkai-space-2)' }}>
                  {session.type === 'online' ? (
                    <button className="tutorkai-btn tutorkai-btn-success tutorkai-body-sm flex items-center gap-1">
                      <MdVideoCall size={16} />
                      Start Session
                    </button>
                  ) : (
                    <button className="tutorkai-btn tutorkai-btn-primary tutorkai-body-sm flex items-center gap-1">
                      <MdLocationOn size={16} />
                      Directions
                    </button>
                  )}
                  <button className="tutorkai-btn tutorkai-btn-secondary tutorkai-body-sm flex items-center gap-1">
                    <MdPhone size={16} />
                    Call Parent
                  </button>
                  <button className="tutorkai-btn tutorkai-btn-secondary tutorkai-body-sm flex items-center gap-1">
                    <MdEditNote size={16} />
                    Notes
                  </button>
                </div>
              </div>
            ))}
            
            <div className="text-center text-gray-500 text-sm py-2 flex items-center justify-center gap-2">
              <MdLightbulb size={16} color='var(--tutorkai-warning-500)' />
              Swipe left/right to view other days
            </div>
          </div>
        </div>

        {/* Task Management Center */}
        <div className="tutorkai-card">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MdCheckCircle size={20} color='var(--tutorkai-success-600)' />
                My Tasks (5 pending)
              </h2>
            </div>
            <button className="text-blue-600 text-sm">View All</button>
          </div>
          
          <div className="p-4 space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className={`border rounded-lg p-3 ${getPriorityColor(task.priority)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                  </div>
                  <div className="text-xs font-medium">{task.dueTime}</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-white rounded-full flex items-center gap-1">
                      <MdCircle size={8} color={task.type === 'admin' ? 'var(--tutorkai-primary-500)' : task.type === 'auto' ? 'var(--tutorkai-warning-500)' : 'var(--tutorkai-success-500)'} />
                      {task.type === 'admin' ? 'ADMIN' : task.type === 'auto' ? 'AUTO' : 'SELF'}
                    </span>
                    {task.student && (
                      <span className="text-xs text-gray-600">for {task.student}</span>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button className="bg-white text-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <MdCheckCircle size={12} color='var(--tutorkai-success-600)' />
                      Complete
                    </button>
                    <button className="bg-white text-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <MdSchedule size={12} color='var(--tutorkai-warning-600)' />
                      Snooze
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex space-x-2">
              <button className="flex items-center space-x-1 text-blue-600 text-sm">
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
              <button className="flex items-center gap-1 text-sm" style={{ color: 'var(--tutorkai-secondary-500)' }}>
                <MdBarChart size={16} /> Task Analytics
              </button>
              <button className="flex items-center gap-1 text-gray-500 text-sm">
                <MdSettings size={16} />
                Auto Settings
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4" style={{ gap: 'var(--tutorkai-space-3)' }}>
          <button className="tutorkai-card flex flex-col items-center" style={{ 
            padding: 'var(--tutorkai-space-3)', 
            gap: 'var(--tutorkai-space-1)'
          }}>
            <Calendar className="w-6 h-6" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-caption" style={{ 
              fontWeight: 'var(--tutorkai-font-medium)', 
              color: 'var(--tutorkai-secondary-900)' 
            }}>Set Availability</span>
          </button>
          <button className="tutorkai-card flex flex-col items-center" style={{ 
            padding: 'var(--tutorkai-space-3)', 
            gap: 'var(--tutorkai-space-1)'
          }}>
            <BookOpen className="w-6 h-6" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-caption" style={{ 
              fontWeight: 'var(--tutorkai-font-medium)', 
              color: 'var(--tutorkai-secondary-900)' 
            }}>Create Content</span>
          </button>
          <button className="tutorkai-card flex flex-col items-center" style={{ 
            padding: 'var(--tutorkai-space-3)', 
            gap: 'var(--tutorkai-space-1)'
          }}>
            <MessageCircle className="w-6 h-6" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-caption" style={{ 
              fontWeight: 'var(--tutorkai-font-medium)', 
              color: 'var(--tutorkai-secondary-900)' 
            }}>Message Parents</span>
          </button>
          <button className="tutorkai-card flex flex-col items-center" style={{ 
            padding: 'var(--tutorkai-space-3)', 
            gap: 'var(--tutorkai-space-1)'
          }}>
            <BarChart3 className="w-6 h-6" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-caption" style={{ 
              fontWeight: 'var(--tutorkai-font-medium)', 
              color: 'var(--tutorkai-secondary-900)' 
            }}>View Earnings</span>
          </button>
        </div>

        {/* Weekly Overview */}
        <div className="tutorkai-card">
          <div className="flex items-center justify-between pb-4 border-b" style={{ 
            borderColor: 'var(--tutorkai-secondary-200)',
            padding: 'var(--tutorkai-space-4) var(--tutorkai-space-4) var(--tutorkai-space-3)'
          }}>
            <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--tutorkai-primary-600)' }} />
              <h2 className="tutorkai-heading-4 flex items-center gap-2">
                <MdBarChart size={20} color='var(--tutorkai-primary-600)' />
                This Week Overview
              </h2>
            </div>
            <button className="tutorkai-btn-secondary tutorkai-body-sm" style={{
              background: 'transparent',
              border: 'none', 
              color: 'var(--tutorkai-primary-600)'
            }}>Analytics</button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Earnings Progress</span>
                <span className="text-lg font-bold text-gray-900">${weeklyOverview.earnings}/${weeklyOverview.goal} goal</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                  style={{ width: `${(weeklyOverview.earnings / weeklyOverview.goal) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{weeklyOverview.sessionsBooked} hours booked</span>
                <span>{weeklyOverview.hoursAvailable} hours available</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-2">Student Performance Highlights</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <MdStar size={16} color='var(--tutorkai-warning-500)' />
                  Emma: Completed counting milestone
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp style={{ fontSize: '1rem', color: 'var(--tutorkai-success-600)' }} />
                  Michael: Reading level improved by 1 grade
                </div>
                <div className="flex items-center gap-2">
                  <MdWarning size={16} color='var(--tutorkai-warning-600)' />
                  Sophia: Needs extra chemistry practice
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="tutorkai-card">
          <div className="flex items-center justify-between pb-4 border-b" style={{
            borderColor: 'var(--tutorkai-secondary-200)',
            padding: 'var(--tutorkai-space-4) var(--tutorkai-space-4) var(--tutorkai-space-3)'
          }}>
            <h2 className="tutorkai-heading-4 flex items-center gap-2">
              <MdEditNote size={20} color='var(--tutorkai-primary-600)' />
              Recent Activity
            </h2>
            <button className="tutorkai-btn-secondary tutorkai-body-sm" style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--tutorkai-primary-600)'
            }}>View All</button>
          </div>
          
          <div style={{ 
            padding: 'var(--tutorkai-space-4)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--tutorkai-space-3)'
          }}>
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start" style={{ gap: 'var(--tutorkai-space-3)' }}>
                <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="tutorkai-body" style={{ 
                    fontWeight: 'var(--tutorkai-font-medium)', 
                    color: 'var(--tutorkai-secondary-900)' 
                  }}>{activity.title}</div>
                  <div className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                    {activity.description}
                  </div>
                  <div className="tutorkai-caption" style={{ 
                    color: 'var(--tutorkai-secondary-500)', 
                    marginTop: 'var(--tutorkai-space-1)'
                  }}>{activity.time}</div>
                </div>
                {activity.amount && (
                  <div className="tutorkai-body" style={{ 
                    color: 'var(--tutorkai-success-600)', 
                    fontWeight: 'var(--tutorkai-font-medium)'
                  }}>${activity.amount}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t grid grid-cols-5 text-center" style={{
        borderColor: 'var(--tutorkai-secondary-200)',
        padding: 'var(--tutorkai-space-4)',
        gap: 'var(--tutorkai-space-4)'
      }}>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--tutorkai-primary-600)' }}>
            <div className="w-3 h-3 bg-white rounded-sm"></div>
          </div>
          <span className="tutorkai-caption" style={{ 
            fontWeight: 'var(--tutorkai-font-medium)', 
            color: 'var(--tutorkai-primary-600)'
          }}>Today</span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <Calendar className="w-6 h-6" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>Schedule</span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <User className="w-6 h-6" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>Students</span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <MessageCircle className="w-6 h-6" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>Messages</span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <User className="w-6 h-6" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>Profile</span>
        </div>
      </div>
    </div>
  );
};

export default TutorMobileDashboard;