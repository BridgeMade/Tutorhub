import React, { useState } from 'react';
import { Calendar, BookOpen, MessageCircle, TrendingUp, User, Clock, FileText, Download, Upload } from 'lucide-react';
import { 
  MdPictureAsPdf, 
  MdVideoLibrary, 
  MdLink, 
  MdRefresh, 
  MdMoreHoriz 
} from 'react-icons/md';

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
}

const StudentDashboard812: React.FC<StudentDashboard812Props> = ({
  studentName = 'Sophia',
  grade = '8'
}) => {
  const [upcomingLessons] = useState<UpcomingLesson[]>([
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
    },
    {
      id: '3',
      subject: 'English Literature',
      time: 'Friday 4:00 PM',
      tutor: 'Mr. Thompson',
      duration: '1.5 hours',
      type: 'online'
    }
  ]);

  const [assignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Cell Structure Report',
      subject: 'Biology',
      dueDate: 'Tomorrow',
      status: 'pending'
    },
    {
      id: '2',
      title: 'Algebra Problem Set 5',
      subject: 'Mathematics',
      dueDate: 'Friday',
      status: 'submitted'
    },
    {
      id: '3',
      title: 'Shakespeare Essay',
      subject: 'English',
      dueDate: 'Next Week',
      status: 'graded',
      grade: 'A-'
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

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'session',
      title: 'Biology session completed',
      description: 'Excellent understanding of cellular respiration!',
      time: '2 hours ago',
      subject: 'Biology'
    },
    {
      id: '2',
      type: 'assignment',
      title: 'Math homework submitted',
      description: 'Algebra Problem Set 4 turned in on time',
      time: '1 day ago',
      subject: 'Mathematics'
    },
    {
      id: '3',
      type: 'message',
      title: 'Message from Dr. Williams',
      description: 'Great progress on the biology project! Keep it up.',
      time: '1 day ago',
      subject: 'Biology'
    },
    {
      id: '4',
      type: 'material',
      title: 'New study materials shared',
      description: 'Cell Biology Notes.pdf uploaded by Dr. Williams',
      time: '2 days ago',
      subject: 'Biology'
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
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'assignment':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-purple-600" />;
      case 'material':
        return <BookOpen className="w-4 h-4 text-orange-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <MdPictureAsPdf size={20} color='var(--tutorkai-error-600)' />;
      case 'video':
        return <MdVideoLibrary size={20} color='var(--tutorkai-primary-600)' />;
      case 'link':
        return <MdLink size={20} color='var(--tutorkai-success-600)' />;
      default:
        return <MdPictureAsPdf size={20} color='var(--tutorkai-error-600)' />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--tutorkai-neutral-50)' }}>
      {/* Header */}
      <div className="bg-white border-b" style={{
        borderColor: 'var(--tutorkai-secondary-200)',
        padding: 'var(--tutorkai-space-4)'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="tutorkai-heading-2" style={{ color: 'var(--tutorkai-secondary-900)' }}>
              {studentName} (Grade {grade})
            </h1>
            <div className="flex items-center" style={{
              gap: 'var(--tutorkai-space-4)',
              marginTop: 'var(--tutorkai-space-1)'
            }}>
              <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--tutorkai-primary-600)' }} />
                <span className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                  Next: Biology in 3 hours
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
            <div className="relative">
              <MessageCircle className="w-6 h-6" style={{ color: 'var(--tutorkai-secondary-600)' }} />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{
                backgroundColor: 'var(--tutorkai-error-500)'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        padding: 'var(--tutorkai-space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--tutorkai-space-6)'
      }}>
        {/* Upcoming Lessons */}
        <div className="tutorkai-card">
          <div className="border-b" style={{
            padding: 'var(--tutorkai-space-4) var(--tutorkai-space-4) var(--tutorkai-space-3)',
            borderColor: 'var(--tutorkai-secondary-200)'
          }}>
            <h2 className="tutorkai-heading-4" style={{ color: 'var(--tutorkai-secondary-900)' }}>
              Upcoming Lessons
            </h2>
          </div>
          
          <div style={{
            padding: 'var(--tutorkai-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--tutorkai-space-3)'
          }}>
            {upcomingLessons.map((lesson) => (
              <div key={lesson.id} className="rounded-lg" style={{
                backgroundColor: 'var(--tutorkai-secondary-50)',
                borderRadius: 'var(--tutorkai-radius-lg)',
                padding: 'var(--tutorkai-space-4)'
              }}>
                <div className="flex items-start justify-between" style={{ marginBottom: 'var(--tutorkai-space-2)' }}>
                  <div>
                    <div className="tutorkai-body" style={{
                      fontWeight: 'var(--tutorkai-font-medium)',
                      color: 'var(--tutorkai-secondary-900)'
                    }}>
                      {lesson.subject}
                    </div>
                    <div className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                      {lesson.tutor} • {lesson.duration}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tutorkai-body-sm" style={{
                      fontWeight: 'var(--tutorkai-font-medium)',
                      color: 'var(--tutorkai-primary-600)'
                    }}>
                      {lesson.time}
                    </div>
                    <div className="tutorkai-caption" style={{
                      color: 'var(--tutorkai-secondary-500)',
                      textTransform: 'capitalize'
                    }}>
                      {lesson.type}
                    </div>
                  </div>
                </div>
                
                <div className="flex" style={{ gap: 'var(--tutorkai-space-2)' }}>
                  {lesson.type === 'online' ? (
                    <button className="tutorkai-btn tutorkai-btn-success tutorkai-body-sm">
                      Join Session
                    </button>
                  ) : (
                    <button className="tutorkai-btn tutorkai-btn-primary tutorkai-body-sm">
                      View Details
                    </button>
                  )}
                  <button className="tutorkai-btn tutorkai-btn-secondary tutorkai-body-sm">
                    Reschedule
                  </button>
                  <button className="tutorkai-btn tutorkai-btn-secondary tutorkai-body-sm">
                    Message Tutor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3" style={{ gap: 'var(--tutorkai-space-4)' }}>
          <button className="tutorkai-card flex flex-col items-center" style={{
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <Calendar className="w-8 h-8" style={{ color: 'var(--tutorkai-primary-600)' }} />
            <span className="tutorkai-body-sm" style={{
              fontWeight: 'var(--tutorkai-font-medium)',
              color: 'var(--tutorkai-secondary-900)'
            }}>
              Book Session
            </span>
          </button>
          <button className="tutorkai-card flex flex-col items-center" style={{
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
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
          <button className="tutorkai-card flex flex-col items-center" style={{
            padding: 'var(--tutorkai-space-4)',
            gap: 'var(--tutorkai-space-2)',
            cursor: 'pointer',
            transition: 'transform var(--tutorkai-duration-fast) var(--tutorkai-ease-out)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
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

        {/* Assignments & Materials */}
        <div className="tutorkai-card">
          <div className="border-b" style={{
            padding: 'var(--tutorkai-space-4) var(--tutorkai-space-4) var(--tutorkai-space-3)',
            borderColor: 'var(--tutorkai-secondary-200)'
          }}>
            <h2 className="tutorkai-heading-4" style={{ color: 'var(--tutorkai-secondary-900)' }}>
              Assignments & Materials
            </h2>
          </div>
          
          {/* Assignments Tab */}
          <div style={{ padding: 'var(--tutorkai-space-4)' }}>
            <div style={{ marginBottom: 'var(--tutorkai-space-4)' }}>
              <h3 className="tutorkai-body" style={{
                fontWeight: 'var(--tutorkai-font-medium)',
                color: 'var(--tutorkai-secondary-900)',
                marginBottom: 'var(--tutorkai-space-3)'
              }}>
                Assignments
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--tutorkai-space-3)'
              }}>
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between rounded-lg" style={{
                    padding: 'var(--tutorkai-space-3)',
                    backgroundColor: 'var(--tutorkai-secondary-50)',
                    borderRadius: 'var(--tutorkai-radius-lg)'
                  }}>
                    <div className="flex-1">
                      <div className="tutorkai-body" style={{
                        fontWeight: 'var(--tutorkai-font-medium)',
                        color: 'var(--tutorkai-secondary-900)'
                      }}>
                        {assignment.title}
                      </div>
                      <div className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                        {assignment.subject} • Due: {assignment.dueDate}
                      </div>
                    </div>
                    <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-3)' }}>
                      {assignment.grade && (
                        <span className="tutorkai-body-sm" style={{
                          fontWeight: 'var(--tutorkai-font-medium)',
                          color: 'var(--tutorkai-success-600)'
                        }}>
                          {assignment.grade}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full tutorkai-caption ${getStatusColor(assignment.status)}`} style={{
                        fontWeight: 'var(--tutorkai-font-medium)'
                      }}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials Section */}
            <div>
              <h3 className="tutorkai-body" style={{
                fontWeight: 'var(--tutorkai-font-medium)',
                color: 'var(--tutorkai-secondary-900)',
                marginBottom: 'var(--tutorkai-space-3)'
              }}>
                Materials
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--tutorkai-space-2)'
              }}>
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between rounded-lg" style={{
                    padding: 'var(--tutorkai-space-3)',
                    backgroundColor: 'var(--tutorkai-secondary-50)',
                    borderRadius: 'var(--tutorkai-radius-lg)'
                  }}>
                    <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-3)' }}>
                      <div>{getMaterialIcon(material.type)}</div>
                      <div>
                        <div className="tutorkai-body" style={{
                          fontWeight: 'var(--tutorkai-font-medium)',
                          color: 'var(--tutorkai-secondary-900)'
                        }}>
                          {material.name}
                        </div>
                        <div className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                          {material.subject} • {material.uploadedBy}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center" style={{ gap: 'var(--tutorkai-space-2)' }}>
                      <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-500)' }}>
                        {material.date}
                      </span>
                      <Download className="w-4 h-4 cursor-pointer" style={{ color: 'var(--tutorkai-primary-600)' }} />
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="flex items-center tutorkai-body-sm" style={{
                marginTop: 'var(--tutorkai-space-3)',
                gap: 'var(--tutorkai-space-2)',
                color: 'var(--tutorkai-primary-600)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}>
                <Upload className="w-4 h-4" />
                <span>Upload Assignment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="tutorkai-card">
          <div className="flex items-center justify-between border-b" style={{
            padding: 'var(--tutorkai-space-4) var(--tutorkai-space-4) var(--tutorkai-space-3)',
            borderColor: 'var(--tutorkai-secondary-200)'
          }}>
            <h2 className="tutorkai-heading-4" style={{ color: 'var(--tutorkai-secondary-900)' }}>
              Recent Activity
            </h2>
            <div className="flex" style={{ gap: 'var(--tutorkai-space-2)' }}>
              <button className="tutorkai-body-sm rounded-full" style={{
                padding: 'var(--tutorkai-space-1) var(--tutorkai-space-3)',
                backgroundColor: 'var(--tutorkai-primary-100)',
                color: 'var(--tutorkai-primary-700)',
                border: 'none',
                cursor: 'pointer'
              }}>
                All
              </button>
              <button className="tutorkai-body-sm rounded-full" style={{
                padding: 'var(--tutorkai-space-1) var(--tutorkai-space-3)',
                color: 'var(--tutorkai-secondary-500)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}>
                Sessions
              </button>
              <button className="tutorkai-body-sm rounded-full" style={{
                padding: 'var(--tutorkai-space-1) var(--tutorkai-space-3)',
                color: 'var(--tutorkai-secondary-500)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}>
                Assignments
              </button>
            </div>
          </div>
          
          <div style={{
            padding: 'var(--tutorkai-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--tutorkai-space-4)'
          }}>
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start" style={{ gap: 'var(--tutorkai-space-3)' }}>
                <div className="flex-shrink-0" style={{ marginTop: 'var(--tutorkai-space-1)' }}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="tutorkai-body" style={{
                    fontWeight: 'var(--tutorkai-font-medium)',
                    color: 'var(--tutorkai-secondary-900)'
                  }}>
                    {activity.title}
                  </div>
                  <div className="tutorkai-body-sm" style={{ color: 'var(--tutorkai-secondary-600)' }}>
                    {activity.description}
                  </div>
                  {activity.subject && (
                    <div className="tutorkai-caption" style={{
                      color: 'var(--tutorkai-primary-600)',
                      marginTop: 'var(--tutorkai-space-1)'
                    }}>
                      {activity.subject}
                    </div>
                  )}
                </div>
                <div className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-500)' }}>
                  {activity.time}
                </div>
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
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{
            backgroundColor: 'var(--tutorkai-primary-600)'
          }}>
            <div className="w-3 h-3 bg-white rounded-sm"></div>
          </div>
          <span className="tutorkai-caption" style={{
            fontWeight: 'var(--tutorkai-font-medium)',
            color: 'var(--tutorkai-primary-600)'
          }}>
            Home
          </span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <Calendar className="w-6 h-6" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>
            Sessions
          </span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <TrendingUp className="w-6 h-6" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>
            Progress
          </span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <MessageCircle className="w-6 h-6" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>
            Messages
          </span>
        </div>
        <div className="flex flex-col items-center" style={{ gap: 'var(--tutorkai-space-1)' }}>
          <User className="w-6 h-6" style={{ color: 'var(--tutorkai-secondary-400)' }} />
          <span className="tutorkai-caption" style={{ color: 'var(--tutorkai-secondary-400)' }}>
            Profile
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard812;