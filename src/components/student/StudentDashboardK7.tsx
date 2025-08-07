import React, { useState } from 'react';
import { Star, Trophy, Clock, BookOpen, User, Calendar, TrendingUp, MessageCircle } from 'lucide-react';
import { 
  MdSchool, 
  MdCalculate, 
  MdPalette, 
  MdLocalFireDepartment,
  MdEmojiEvents,
  MdAssignment,
  MdMenuBook,
  MdAccessTime,
  MdGpsFixed,
  MdRefresh,
  MdMoreHoriz
} from 'react-icons/md';

interface Lesson {
  id: string;
  subject: string;
  time: string;
  tutor: string;
  icon: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due: string;
  stars: number;
  completed?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Activity {
  id: string;
  type: 'lesson' | 'assignment' | 'achievement';
  title: string;
  description: string;
  time: string;
  feedback?: string;
}

interface StudentDashboardK7Props {
  studentName: string;
  grade: string;
  streak: number;
  trophyCount: number;
}

const StudentDashboardK7: React.FC<StudentDashboardK7Props> = ({
  studentName = 'Emma',
  grade = '3',
  streak = 3,
  trophyCount = 5
}) => {
  const [todaysLessons] = useState<Lesson[]>([
    {
      id: '1',
      subject: 'Reading',
      time: '2:00 PM',
      tutor: 'Ms. Smith',
icon: 'school'
    },
    {
      id: '2',
      subject: 'Math',
      time: '3:30 PM', 
      tutor: 'Mr. Jones',
icon: 'calculate'
    },
    {
      id: '3',
      subject: 'Art',
      time: '4:00 PM',
      tutor: 'Ms. Brown',
icon: 'palette'
    }
  ]);

  const [assignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Reading Worksheet',
      description: 'Read 3 pages about animals',
      due: 'Tomorrow',
      stars: 3
    },
    {
      id: '2',
      title: 'Math Practice',
      description: 'Practice addition with pictures',
      due: 'Friday',
      stars: 2
    }
  ]);

  const [weeklyProgress] = useState(100);

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Reading Star',
      description: 'finished 3 books this month',
icon: 'school'
    },
    {
      id: '2',
      title: 'Math Wizard',
      description: 'solved 20 problems in a row',
icon: 'calculate'
    },
    {
      id: '3',
      title: 'Always on Time',
      description: 'attended all lessons this week',
icon: 'schedule'
    }
  ]);

  const [recentActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'lesson',
      title: 'Math lesson with Mr. Jones',
      description: 'Great job!',
      time: 'Today',
      feedback: 'Great job!'
    },
    {
      id: '2',
      type: 'assignment',
      title: 'Finished reading worksheet',
      description: 'A+ work!',
      time: 'Today',
      feedback: 'A+ work!'
    },
    {
      id: '3',
      type: 'lesson',
      title: 'Art class with Ms. Brown',
      description: 'Loved your drawing!',
      time: 'Yesterday',
      feedback: 'Loved your drawing!'
    },
    {
      id: '4',
      title: 'Read 5 pages of "The Magic Tree"',
      description: '',
      time: 'Yesterday',
      type: 'assignment'
    }
  ]);

  const renderStars = (count: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(3)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < count ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, var(--tutorkai-primary-50), var(--tutorkai-secondary-50))'
    }}>
      {/* Header */}
      <div className="bg-white shadow-sm" style={{
        borderRadius: '0 0 var(--tutorkai-radius-3xl) var(--tutorkai-radius-3xl)',
        padding: 'var(--tutorkai-space-4)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-3)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, var(--tutorkai-primary-400), var(--tutorkai-secondary-400))'
            }}>
              <MdEmojiEvents size={20} color='white' />
            </div>
            <div>
              <h1 className="tutorkai-heading-3" style={{ color: 'var(--tutorkai-secondary-900)' }}>
                Hi {studentName}! (Grade {grade})
              </h1>
              <div className="flex items-center tutorkai-body-sm" style={{ gap: 'var(--tutorkai-space-4)' }}>
                <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
                  <Trophy className="w-4 h-4" style={{ color: 'var(--tutorkai-warning-500)' }} />
                  <span style={{ fontWeight: 'var(--tutorkai-font-medium)' }}>{trophyCount}</span>
                </div>
                <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{
                    backgroundColor: 'var(--tutorkai-warning-500)'
                  }}>
                    <MdLocalFireDepartment size={12} color='white' />
                  </div>
                  <span style={{ fontWeight: 'var(--tutorkai-font-medium)' }}>{streak} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl" style={{
          marginTop: 'var(--tutorkai-space-3)',
          backgroundColor: 'var(--tutorkai-primary-100)',
          borderRadius: 'var(--tutorkai-radius-xl)',
          padding: 'var(--tutorkai-space-3)'
        }}>
          <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
            <Clock className="w-5 h-5" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-body" style={{
              color: 'var(--tutorkai-primary-800)',
              fontWeight: 'var(--tutorkai-font-medium)'
            }}>
              Next: Math Fun Time in 2 hours
            </span>
          </div>
        </div>
      </div>

      <div style={{
        padding: 'var(--tutorkai-space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--tutorkai-space-6)'
      }}>
        {/* Today's Lessons */}
        <div className="tutorkai-card" style={{
          borderRadius: 'var(--tutorkai-radius-2xl)',
          padding: 'var(--tutorkai-space-4)'
        }}>
          <h2 className="tutorkai-heading-4" style={{
            marginBottom: 'var(--tutorkai-space-4)',
            color: 'var(--tutorkai-secondary-900)'
          }}>
            Today's Lessons
          </h2>
          
          <div className="flex overflow-x-auto" style={{
            gap: 'var(--tutorkai-space-4)',
            paddingBottom: 'var(--tutorkai-space-2)'
          }}>
            {todaysLessons.map((lesson) => (
              <div key={lesson.id} className="flex-shrink-0 rounded-xl text-center" style={{
                background: 'linear-gradient(135deg, var(--tutorkai-primary-50), var(--tutorkai-secondary-50))',
                borderRadius: 'var(--tutorkai-radius-xl)',
                padding: 'var(--tutorkai-space-4)',
                minWidth: '120px'
              }}>
                <div style={{ marginBottom: 'var(--tutorkai-space-2)' }}>
                  {lesson.icon === 'school' && <MdSchool size={32} color='var(--tutorkai-primary-600)' />}
                  {lesson.icon === 'calculate' && <MdCalculate size={32} color='var(--tutorkai-success-600)' />}
                  {lesson.icon === 'palette' && <MdPalette size={32} color='var(--tutorkai-secondary-600)' />}
                </div>
                <div className="tutorkai-body-sm" style={{
                  fontWeight: 'var(--tutorkai-font-medium)',
                  color: 'var(--tutorkai-secondary-900)'
                }}>
                  {lesson.subject}
                </div>
                <div className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                  {lesson.time}
                </div>
                <div className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                  {lesson.tutor}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Work */}
        <div className="tutorkai-card" style={{
          borderRadius: 'var(--tutorkai-radius-2xl)',
          padding: 'var(--tutorkai-space-4)'
        }}>
          <div className="flex items-center" style={{
            gap: 'var(--tutorkai-space-2)',
            marginBottom: 'var(--tutorkai-space-4)'
          }}>
            <BookOpen className="w-5 h-5" style={{ color: 'var(--tutorkai-success-600)' }} />
            <h2 className="tutorkai-heading-4" style={{ color: 'var(--tutorkai-secondary-900)' }}>
              📝 My Work
            </h2>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--tutorkai-space-3)'
          }}>
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl" style={{
                backgroundColor: 'var(--tutorkai-secondary-50)',
                borderRadius: 'var(--tutorkai-radius-xl)',
                padding: 'var(--tutorkai-space-4)'
              }}>
                <div className="flex items-start justify-between" style={{ marginBottom: 'var(--tutorkai-space-2)' }}>
                  <div className="flex-1">
                    <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
                      <span className="tutorkai-body" style={{
                        fontWeight: 'var(--tutorkai-font-medium)',
                        color: 'var(--tutorkai-secondary-900)'
                      }}>
                        {assignment.title}
                      </span>
                      {renderStars(assignment.stars)}
                    </div>
                    <div className="tutorkai-body-sm" style={{
                      color: 'var(--tutorkai-secondary-600)',
                      marginTop: 'var(--tutorkai-space-1)'
                    }}>
                      {assignment.description}
                    </div>
                  </div>
                  <div className="tutorkai-caption" style={{
                    color: 'var(--tutorkai-primary-600)',
                    fontWeight: 'var(--tutorkai-font-medium)'
                  }}>
                    Due: {assignment.due}
                  </div>
                </div>
                
                <div className="flex" style={{ gap: 'var(--tutorkai-space-2)' }}>
                  <button className="tutorkai-btn tutorkai-btn-primary tutorkai-body-sm flex items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
                    <MdMenuBook size={16} />
                    View
                  </button>
                  <button className="tutorkai-btn tutorkai-btn-success tutorkai-body-sm flex items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
                    <MdAssignment size={16} />
                    Mark Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3" style={{ gap: 'var(--tutorkai-space-3)' }}>
          <button className="tutorkai-card flex flex-col items-center justify-center" style={{
            borderRadius: 'var(--tutorkai-radius-2xl)',
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            minHeight: '100px',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <Calendar className="w-8 h-8" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-body-sm" style={{
              fontWeight: 'var(--tutorkai-font-medium)',
              color: 'var(--tutorkai-secondary-900)',
              textAlign: 'center'
            }}>
              Ask Parent to Book
            </span>
          </button>
          <button className="tutorkai-card flex flex-col items-center justify-center" style={{
            borderRadius: 'var(--tutorkai-radius-2xl)',
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            minHeight: '100px',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <MdRefresh size={32} color='var(--tutorkai-primary-600)' />
            <span className="tutorkai-body-sm" style={{
              fontWeight: 'var(--tutorkai-font-medium)',
              color: 'var(--tutorkai-secondary-900)'
            }}>
              Reschedule
            </span>
          </button>
          <button className="tutorkai-card flex flex-col items-center justify-center" style={{
            borderRadius: 'var(--tutorkai-radius-2xl)',
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            minHeight: '100px',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <MdMoreHoriz size={32} color='var(--tutorkai-secondary-600)' />
            <span className="tutorkai-body-sm" style={{
              fontWeight: 'var(--tutorkai-font-medium)',
              color: 'var(--tutorkai-secondary-900)'
            }}>
              More
            </span>
          </button>
        </div>

        {/* My Progress */}
        <div className="tutorkai-card" style={{
          borderRadius: 'var(--tutorkai-radius-2xl)',
          padding: 'var(--tutorkai-space-4)'
        }}>
          <div className="flex items-center" style={{
            gap: 'var(--tutorkai-space-2)',
            marginBottom: 'var(--tutorkai-space-4)'
          }}>
            <Trophy className="w-5 h-5" style={{ color: 'var(--tutorkai-warning-500)' }} />
            <h2 className="tutorkai-heading-4" style={{ color: 'var(--tutorkai-secondary-900)' }}>
              🏆 My Progress
            </h2>
          </div>
          
          <div style={{ marginBottom: 'var(--tutorkai-space-4)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--tutorkai-space-2)' }}>
              <span className="tutorkai-body-sm" style={{
                fontWeight: 'var(--tutorkai-font-medium)',
                color: 'var(--tutorkai-secondary-700)'
              }}>
                This Week:
              </span>
              <span className="tutorkai-body-sm" style={{
                fontWeight: 'var(--tutorkai-font-bold)',
                color: 'var(--tutorkai-success-600)'
              }}>
                {weeklyProgress}% (5/5 lessons completed!)
              </span>
            </div>
            <div className="w-full rounded-full h-3" style={{ backgroundColor: 'var(--tutorkai-secondary-200)' }}>
              <div 
                className="h-3 rounded-full transition-all"
                style={{
                  background: 'linear-gradient(90deg, var(--tutorkai-success-400), var(--tutorkai-primary-500))',
                  width: `${weeklyProgress}%`,
                  transitionDuration: 'var(--tutorkai-duration-slow)'
                }}
              ></div>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--tutorkai-space-4)' }}>
            <h3 className="tutorkai-body flex items-center" style={{
              fontWeight: 'var(--tutorkai-font-medium)',
              color: 'var(--tutorkai-secondary-900)',
              marginBottom: 'var(--tutorkai-space-2)'
            }}>
              <Star className="w-4 h-4" style={{
                color: 'var(--tutorkai-warning-500)',
                marginRight: 'var(--tutorkai-space-1)'
              }} />
              Recent Achievements:
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--tutorkai-space-2)'
            }}>
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center tutorkai-body-sm" style={{
                  gap: 'var(--tutorkai-space-2)'
                }}>
                  <span className="tutorkai-heading-5">{achievement.icon}</span>
                  <span style={{
                    fontWeight: 'var(--tutorkai-font-medium)',
                    color: 'var(--tutorkai-secondary-900)'
                  }}>
                    {achievement.title}
                  </span>
                  <span style={{ color: 'var(--tutorkai-secondary-600)' }}>
                    ({achievement.description})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl" style={{
            backgroundColor: 'var(--tutorkai-warning-50)',
            borderRadius: 'var(--tutorkai-radius-xl)',
            padding: 'var(--tutorkai-space-3)'
          }}>
            <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
              <MdGpsFixed size={20} color='var(--tutorkai-warning-600)' />
              <div className="tutorkai-body-sm">
                <span style={{
                  fontWeight: 'var(--tutorkai-font-medium)',
                  color: 'var(--tutorkai-secondary-900)'
                }}>
                  Next Goal:
                </span>
                <span style={{
                  color: 'var(--tutorkai-secondary-700)',
                  marginLeft: 'var(--tutorkai-space-1)'
                }}>
                  Complete 10 homework assignments → 🏅
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What I've Been Doing */}
        <div className="tutorkai-card" style={{
          borderRadius: 'var(--tutorkai-radius-2xl)',
          padding: 'var(--tutorkai-space-4)'
        }}>
          <h2 className="tutorkai-heading-4" style={{
            color: 'var(--tutorkai-secondary-900)',
            marginBottom: 'var(--tutorkai-space-4)'
          }}>
            📋 What I've Been Doing
          </h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--tutorkai-space-3)'
          }}>
            <div className="rounded-xl" style={{
              backgroundColor: 'var(--tutorkai-success-50)',
              borderRadius: 'var(--tutorkai-radius-xl)',
              padding: 'var(--tutorkai-space-3)'
            }}>
              <h3 className="tutorkai-body" style={{
                fontWeight: 'var(--tutorkai-font-medium)',
                color: 'var(--tutorkai-secondary-900)',
                marginBottom: 'var(--tutorkai-space-2)'
              }}>
                Today
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--tutorkai-space-2)'
              }}>
                <div className="flex items-start" style={{ gap: 'var(--tutorkai-space-2)' }}>
                  <div className="w-2 h-2 rounded-full" style={{
                    backgroundColor: 'var(--tutorkai-success-500)',
                    marginTop: 'var(--tutorkai-space-2)'
                  }}></div>
                  <div className="flex-1">
                    <div className="tutorkai-body-sm flex items-center" style={{
                      fontWeight: 'var(--tutorkai-font-medium)',
                      color: 'var(--tutorkai-secondary-900)',
                      gap: 'var(--tutorkai-space-1)'
                    }}>
                      <MdAssignment size={16} color='var(--tutorkai-success-600)' />
                      Math lesson with Mr. Jones (Great job!)
                    </div>
                    <div className="tutorkai-body-sm flex items-center" style={{
                      color: 'var(--tutorkai-secondary-900)',
                      gap: 'var(--tutorkai-space-1)'
                    }}>
                      <MdMenuBook size={16} color='var(--tutorkai-primary-600)' />
                      Finished reading worksheet (A+ work!)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl" style={{
              backgroundColor: 'var(--tutorkai-primary-50)',
              borderRadius: 'var(--tutorkai-radius-xl)',
              padding: 'var(--tutorkai-space-3)'
            }}>
              <h3 className="tutorkai-body" style={{
                fontWeight: 'var(--tutorkai-font-medium)',
                color: 'var(--tutorkai-secondary-900)',
                marginBottom: 'var(--tutorkai-space-2)'
              }}>
                Yesterday
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--tutorkai-space-2)'
              }}>
                <div className="flex items-start" style={{ gap: 'var(--tutorkai-space-2)' }}>
                  <div className="w-2 h-2 rounded-full" style={{
                    backgroundColor: 'var(--tutorkai-primary-500)',
                    marginTop: 'var(--tutorkai-space-2)'
                  }}></div>
                  <div className="flex-1">
                    <div className="tutorkai-body-sm flex items-center" style={{
                      fontWeight: 'var(--tutorkai-font-medium)',
                      color: 'var(--tutorkai-secondary-900)',
                      gap: 'var(--tutorkai-space-1)'
                    }}>
                      <MdPalette size={16} color='var(--tutorkai-secondary-600)' />
                      Art class with Ms. Brown (Loved your drawing!)
                    </div>
                    <div className="tutorkai-body-sm flex items-center" style={{
                      color: 'var(--tutorkai-secondary-900)',
                      gap: 'var(--tutorkai-space-1)'
                    }}>
                      <MdSchool size={16} color='var(--tutorkai-primary-600)' />
                      Read 5 pages of "The Magic Tree"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white shadow-lg grid grid-cols-5 text-center" style={{
        borderRadius: 'var(--tutorkai-radius-3xl) var(--tutorkai-radius-3xl) 0 0',
        padding: 'var(--tutorkai-space-4)',
        gap: 'var(--tutorkai-space-4)'
      }}>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            backgroundColor: 'var(--tutorkai-primary-600)',
            borderRadius: 'var(--tutorkai-radius-xl)'
          }}>
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="tutorkai-caption" style={{
            fontWeight: 'var(--tutorkai-font-medium)',
            color: 'var(--tutorkai-primary-600)'
          }}>
            Home
          </span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <Calendar className="w-8 h-8" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>
            Lessons
          </span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <TrendingUp className="w-8 h-8" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>
            Progress
          </span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <div className="w-8 h-8 flex items-center justify-center tutorkai-heading-5" style={{
            color: 'var(--tutorkai-secondary-400)'
          }}>
            👨‍👩‍👧
          </div>
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>
            Family
          </span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <User className="w-8 h-8" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>
            Profile
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardK7;