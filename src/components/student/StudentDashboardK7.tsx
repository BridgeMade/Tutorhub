import React, { useState } from 'react';
import { Bell, MoreHorizontal, BookOpen, Upload, Download, FileText, Calculator, Trophy, Star, Target, Calendar, TrendingUp, Award, CheckCircle, Grid3X3, Microscope, Clock, Flame, Brain, Heart, Zap } from "lucide-react";
import IconButton from "../IconButton";
import LessonCard from "../LessonCard";
import QuickActionButton from "../QuickActionButton";
import WorkCard from "../WorkCard";
import { BottomNavigation, getStudentNavigationTabs } from '../common/BottomNavigation';
import { MobileMessaging } from '../messaging/MobileMessaging';
import { AppHeader } from '../common/AppHeader';
import { SessionCalendarView } from './SessionCalendarView';
import { TutoringSession, DashboardStats, Student } from '../../types';

interface StudentDashboardK7Props {
  studentName?: string;
  grade?: string;
  streak?: number;
  trophyCount?: number;
  student?: Student;
  upcomingSessions?: TutoringSession[];
  stats?: DashboardStats;
}

const StudentDashboardK7: React.FC<StudentDashboardK7Props> = ({
  studentName = 'Karabo',
  student,
  upcomingSessions = [],
  stats
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Handler functions
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // Navigate to settings or show settings menu
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    switch (action) {
      case 'Book':
        // Navigate to booking page
        break;
      case 'Upload':
        // Show file upload
        break;
      case 'Download':
        // Show downloads page
        break;
      case 'More':
        // Show more actions menu
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

  const handleWorkAction = (action: string, workId?: string) => {
    console.log('Work action:', action, workId);
    switch (action) {
      case 'view':
        // Open work details
        break;
      case 'mark-done':
        // Mark work as completed
        break;
      default:
        break;
    }
  };

  // Convert sessions to lesson format for K-7 display
  const getDisplayLessons = () => {
    if (upcomingSessions && upcomingSessions.length > 0) {
      return upcomingSessions.slice(0, 3).map(session => ({
        id: session.id,
        subject: session.subject,
        topic: session.notes || 'General lesson',
        tutor: `Tutor ${session.tutorId.slice(0, 8)}`,
        time: new Date(session.scheduledAt).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        }),
        icon: session.subject === 'Mathematics' ? <Grid3X3 size={20} /> : 
              session.subject === 'Science' ? <Microscope size={20} /> :
              <BookOpen size={20} />
      }));
    }
    
    // Fallback to mock data
    return [
      {
        id: 'mock-1',
        subject: 'Mathematics',
        topic: 'Exponents',
        tutor: 'Natsisana',
        time: '2:00 PM',
        icon: <Grid3X3 size={20} />
      },
      {
        id: 'mock-2',
        subject: 'Science',
        topic: 'Biology',
        tutor: 'Sarah',
        time: '4:00 PM',
        icon: <Microscope size={20} />
      },
      {
        id: 'mock-3',
        subject: 'English',
        topic: 'Reading',
        tutor: 'John',
        time: '6:00 PM',
        icon: <BookOpen size={20} />
      }
    ];
  };

  const displayLessons = getDisplayLessons();

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
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <div className="bg-[--tk-surface] min-h-full pb-20">
      {/* App Header */}
      <AppHeader 
        firstName={studentName}
        userRole="student"
        notificationCount={3}
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
                <p className="text-xs text-gray-600">Today at 2:00 PM with Natsisana</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium">Great work!</p>
                <p className="text-xs text-gray-600">You completed your math worksheet!</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium">Homework due soon</p>
                <p className="text-xs text-gray-600">Math homework due tomorrow</p>
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
              onClick={handleSettingsClick}
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
      )}
      
      <div className="px-6 space-y-6">
        {/* Achievement badges */}
        <div className="flex items-center gap-2">
          {/* Trophy pill */}
          <div className="w-10 h-10 rounded-xl bg-[--tk-yellow-400] flex items-center justify-center shadow-[0_4px_12px_rgba(23,42,92,0.12)]">
            <Trophy size={20} className="text-orange-800" />
          </div>
          
          {/* Streak pill */}
          <div className="px-3 py-2 rounded-2xl bg-[--tk-blue-50] flex items-center gap-1 shadow-[0_4px_12px_rgba(23,42,92,0.12)]">
            <Star size={16} className="text-[--tk-blue-600]" />
            <span className="text-[14px] font-bold text-[--tk-blue-600] tracking-tight">3 days</span>
          </div>
        </div>

        {/* Upcoming Lessons with scroll layout */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[18px] leading-tight font-bold text-[--tk-text] tracking-tight">Upcoming Lessons</h2>
            <button 
              onClick={() => setActiveTab('lessons')}
              className="text-blue-600 text-[14px] font-medium hover:text-blue-700 transition-colors"
            >
              View Calendar
            </button>
          </div>
          <div className="overflow-x-auto snap-x snap-mandatory pr-6 -mr-6 scrollbar-hide pb-2">
            <div className="flex gap-4">
              {displayLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  subject={lesson.subject}
                  topic={lesson.topic}
                  tutor={lesson.tutor}
                  time={lesson.time}
                  icon={lesson.icon}
                  onView={() => handleLessonAction('view', lesson.id)}
                  onMessage={() => handleLessonAction('message', lesson.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-[18px] leading-tight font-bold text-[--tk-text] mb-2 tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-4 mt-6">
            <QuickActionButton 
              label="Book" 
              icon={<BookOpen size={20} />} 
              onClick={() => handleQuickAction('Book')}
            />
            <QuickActionButton 
              label="Upload" 
              icon={<Upload size={20} />} 
              onClick={() => handleQuickAction('Upload')}
            />
            <QuickActionButton 
              label="Download" 
              icon={<Download size={20} />} 
              onClick={() => handleQuickAction('Download')}
            />
            <QuickActionButton 
              label="More" 
              icon={<MoreHorizontal size={20} />} 
              onClick={() => handleQuickAction('More')}
            />
          </div>
        </section>

        {/* My Work */}
        <section>
          <h2 className="text-[18px] leading-tight font-bold text-[--tk-text] mb-2 tracking-tight">My Work</h2>
          <div className="space-y-3">
            <WorkCard
              title="School"
              subtitle="Homework"
              subject="Math: Integers"
              due="Tomorrow"
              icon={<Calculator size={20} />}
              cardType="school"
              onView={() => handleWorkAction('view', 'school-hw-1')}
              onMarkDone={() => handleWorkAction('mark-done', 'school-hw-1')}
            />
            <WorkCard
              title="Tutoring"
              subtitle="worksheet"
              subject="Math: Integers"
              due="Friday"
              icon={<FileText size={20} />}
              cardType="tutoring"
              onView={() => handleWorkAction('view', 'tutor-ws-1')}
              onMarkDone={() => handleWorkAction('mark-done', 'tutor-ws-1')}
            />
            <WorkCard
              title="School"
              subtitle="Assignment"
              subject="Math: Integers"
              due="Next week"
              icon={<BookOpen size={20} />}
              cardType="assignment"
              onView={() => handleWorkAction('view', 'school-assign-1')}
              onMarkDone={() => handleWorkAction('mark-done', 'school-assign-1')}
            />
          </div>
        </section>

        {/* My Progress */}
        <section>
          <h2 className="text-[16px] leading-6 font-semibold text-[--tk-text] mb-5 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[--tk-yellow-400]" />
            My Progress
          </h2>
          <div className="bg-[--tk-card] rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-tk-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] text-[--tk-muted] font-medium">This week:</span>
              <span className="text-[15px] font-bold text-[--tk-green-500] tracking-tight">
                {stats ? `${Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100)}% (${stats.completedSessions}/${stats.totalSessions} tasks completed!)` : '80% (4/5 tasks completed!)'}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-[--tk-border] rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-[--tk-green-500] to-[--tk-blue-600] h-3 rounded-full transition-all duration-500" 
                style={{ width: `${stats ? Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100) : 80}%` }}
              ></div>
            </div>

            {/* Achievement badges */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[--tk-yellow-400]" />
                <span className="text-[16px] font-bold text-[--tk-text] tracking-tight">
                  {stats?.completedSessions || 5}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[--tk-orange-500]" />
                <span className="text-[16px] font-bold text-[--tk-text] tracking-tight">
                  {stats?.upcomingSessions || 3} lessons
                </span>
              </div>
            </div>

            {/* Recent Achievements */}
            <div>
              <h4 className="text-[15px] font-bold text-[--tk-text] mb-3 flex items-center gap-2 tracking-tight">
                <Award className="w-5 h-5 text-[--tk-blue-600]" />
                Recent Achievements
              </h4>
              <div className="space-y-2 text-[13px] text-[--tk-muted]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Tutoring: Achieved 80% in your integers mock test</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-blue-500" />
                  <span>Schedule: Always on time (attended all lessons this month)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-orange-500" />
                  <span>School: 90% for maths semester 2 assignment</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Next Goals */}
        <section>
          <h2 className="text-[18px] leading-7 font-bold text-[--tk-text] mb-5 tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-tk-blue" />
            Next Goals
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-tk-border shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-6 h-6 text-tk-blue" />
              <span className="text-[16px] font-bold text-[--tk-text] tracking-tight">Complete 10 homework assignments</span>
            </div>
            <p className="text-[14px] text-tk-muted ml-9 font-medium">You're doing great! Just 6 more to go.</p>
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-[18px] leading-7 font-bold text-[--tk-text] mb-5 tracking-tight">Recent Activity</h2>
          <div className="space-y-4">
            <div className="bg-[--tk-card] rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-tk-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-bold text-[--tk-text] tracking-tight">You completed the math integers worksheet</p>
                  <p className="text-[14px] text-tk-muted mt-1 font-medium">2 hours ago</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[--tk-card] rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-tk-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-bold text-[--tk-text] tracking-tight">You earned a gold star for reading!</p>
                  <p className="text-[14px] text-tk-muted mt-1 font-medium">Yesterday</p>
                </div>
              </div>
            </div>

            <div className="bg-[--tk-card] rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-tk-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-tk-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-bold text-[--tk-text] tracking-tight">Attended Math lesson with Ms. Sarah</p>
                  <p className="text-[14px] text-tk-muted mt-1 font-medium">Yesterday at 3:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom spacing */}
        <div className="pb-6"></div>
      </div>
    </div>
  );

  const renderLessonsContent = () => (
    <div className="bg-[--tk-surface] min-h-full pb-20">
      {/* Header with padding */}
      <div className="px-6 py-6">
        <h1 className="text-[28px] font-bold text-[--tk-text] mb-2">Lessons</h1>
        <p className="text-gray-600">View your lesson schedule</p>
      </div>

      {/* Calendar - no side padding for full width */}
      <SessionCalendarView
        sessions={upcomingSessions}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onSessionClick={(session) => {
          console.log('Session clicked:', session);
          // Could navigate to lesson details or show lesson modal
        }}
      />

      {/* Upcoming Lessons List */}
      <div className="px-6 py-6 space-y-4">
        <h2 className="text-[20px] font-semibold text-[--tk-text]">Upcoming Lessons</h2>
        {displayLessons.length > 0 ? (
          <div className="space-y-3">
            {displayLessons.map((lesson) => (
              <div key={lesson.id} className="bg-[--tk-card] rounded-xl p-4 shadow-sm border border-tk-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    {lesson.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold text-[--tk-text]">{lesson.subject}</h3>
                    <p className="text-[14px] text-gray-600">{lesson.topic} • {lesson.time}</p>
                    <p className="text-[12px] text-gray-500">with {lesson.tutor}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleLessonAction('view', lesson.id)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-[12px] font-medium hover:bg-blue-700 transition-colors"
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
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No upcoming lessons</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProgressContent = () => {
    // Calculate subject progress based on stats
    const getSubjectProgress = () => {
      const subjects = [
        { name: 'Mathematics', progress: stats?.completedSessions ? Math.min(Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100), 100) : 75, color: 'bg-blue-500', icon: '🔢' },
        { name: 'Science', progress: stats?.avgRating ? Math.round(stats.avgRating * 20) : 60, color: 'bg-green-500', icon: '🔬' },
        { name: 'English', progress: 85, color: 'bg-purple-500', icon: '📚' },
        { name: 'Reading', progress: 90, color: 'bg-orange-500', icon: '📖' }
      ];
      return subjects;
    };

    const subjectProgress = getSubjectProgress();
    const attendanceRate = stats ? Math.round((stats.completedSessions / (stats.totalSessions || 1)) * 100) : 85;
    const currentStreak = stats?.upcomingSessions || 5;

    return (
      <div className="bg-[--tk-surface] min-h-full pb-20">
        {/* Header */}
        <div className="px-6 py-6">
          <h1 className="text-[28px] font-bold text-[--tk-text] mb-2">My Progress</h1>
          <p className="text-gray-600">See how you're doing this week!</p>
        </div>

        <div className="px-6 space-y-6">
          {/* Weekly Overview Card */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-tk-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                <Trophy className="w-7 h-7 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-[--tk-text] tracking-tight">This Week</h3>
                <p className="text-[14px] text-gray-600">You're doing great!</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-[24px] font-bold text-green-600">{attendanceRate}%</div>
                <div className="text-[12px] text-gray-600">Lessons Attended</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-[24px] font-bold text-blue-600">{currentStreak}</div>
                <div className="text-[12px] text-gray-600">Day Streak 🔥</div>
              </div>
            </div>
          </div>

          {/* Subject Progress */}
          <section>
            <h2 className="text-[20px] font-bold text-[--tk-text] mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Subject Progress
            </h2>
            
            <div className="space-y-4">
              {subjectProgress.map((subject, index) => (
                <div key={index} className="bg-[--tk-card] rounded-xl p-4 border border-tk-border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{subject.icon}</span>
                      <span className="text-[16px] font-semibold text-[--tk-text]">{subject.name}</span>
                    </div>
                    <span className="text-[16px] font-bold text-[--tk-text]">{subject.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${subject.color} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Achievement Badges */}
          <section>
            <h2 className="text-[20px] font-bold text-[--tk-text] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              My Badges
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[--tk-card] rounded-xl p-4 text-center border border-tk-border">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-[12px] font-semibold text-[--tk-text]">Perfect Week</div>
              </div>
              
              <div className="bg-[--tk-card] rounded-xl p-4 text-center border border-tk-border">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-[12px] font-semibold text-[--tk-text]">Math Star</div>
              </div>
              
              <div className="bg-[--tk-card] rounded-xl p-4 text-center border border-tk-border">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-[12px] font-semibold text-[--tk-text]">On Time</div>
              </div>
            </div>
          </section>

          {/* This Week's Goals */}
          <section>
            <h2 className="text-[20px] font-bold text-[--tk-text] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              This Week's Goals
            </h2>
            
            <div className="space-y-3">
              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-[14px] text-[--tk-text] line-through">Complete 3 math lessons</span>
                </div>
              </div>
              
              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-[14px] text-[--tk-text]">Read 2 story books</span>
                </div>
              </div>
              
              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-[14px] text-[--tk-text]">Practice writing letters</span>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 2: Study Time Tracker */}
          <section>
            <h2 className="text-[20px] font-bold text-[--tk-text] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Time Learning Today
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-tk-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-[24px] font-bold text-[--tk-text]">2h 15m</div>
                    <div className="text-[12px] text-gray-600">Total study time</div>
                  </div>
                </div>
                <div className="text-[48px]">⏰</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔢</span>
                    <span className="text-[14px] font-medium text-[--tk-text]">Math</span>
                  </div>
                  <span className="text-[14px] font-bold text-blue-600">45 minutes</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔬</span>
                    <span className="text-[14px] font-medium text-[--tk-text]">Science</span>
                  </div>
                  <span className="text-[14px] font-bold text-green-600">30 minutes</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📚</span>
                    <span className="text-[14px] font-medium text-[--tk-text]">Reading</span>
                  </div>
                  <span className="text-[14px] font-bold text-purple-600">60 minutes</span>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 2: Subject Learning Streaks */}
          <section>
            <h2 className="text-[20px] font-bold text-[--tk-text] mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Learning Streaks
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border text-center">
                <div className="text-[32px] mb-2">🔥</div>
                <div className="text-[18px] font-bold text-orange-600 mb-1">5 days</div>
                <div className="text-[12px] text-gray-600">Math streak!</div>
              </div>
              
              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border text-center">
                <div className="text-[32px] mb-2">⚡</div>
                <div className="text-[18px] font-bold text-blue-600 mb-1">3 days</div>
                <div className="text-[12px] text-gray-600">Reading streak!</div>
              </div>
              
              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border text-center">
                <div className="text-[32px] mb-2">🌟</div>
                <div className="text-[18px] font-bold text-green-600 mb-1">2 days</div>
                <div className="text-[12px] text-gray-600">Science streak!</div>
              </div>
              
              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border text-center">
                <div className="text-[32px] mb-2">💎</div>
                <div className="text-[18px] font-bold text-purple-600 mb-1">Perfect</div>
                <div className="text-[12px] text-gray-600">All subjects!</div>
              </div>
            </div>
          </section>

          {/* Phase 2: Skill Mastery Levels */}
          <section>
            <h2 className="text-[20px] font-bold text-[--tk-text] mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              My Learning Levels
            </h2>
            
            <div className="space-y-4">
              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔢</span>
                    <div>
                      <div className="text-[16px] font-semibold text-[--tk-text]">Mathematics</div>
                      <div className="text-[12px] text-gray-600">Addition & Subtraction</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-gray-300" />
                    <Star className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div className="bg-yellow-100 rounded-lg px-3 py-1 inline-block">
                  <span className="text-[12px] font-bold text-yellow-700">Good Job! 🌟</span>
                </div>
              </div>

              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📖</span>
                    <div>
                      <div className="text-[16px] font-semibold text-[--tk-text]">Reading</div>
                      <div className="text-[12px] text-gray-600">Story comprehension</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                </div>
                <div className="bg-green-100 rounded-lg px-3 py-1 inline-block">
                  <span className="text-[12px] font-bold text-green-700">Excellent! 🏆</span>
                </div>
              </div>

              <div className="bg-[--tk-card] rounded-xl p-4 border border-tk-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔬</span>
                    <div>
                      <div className="text-[16px] font-semibold text-[--tk-text]">Science</div>
                      <div className="text-[12px] text-gray-600">Plants & Animals</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-gray-300" />
                    <Star className="w-4 h-4 text-gray-300" />
                    <Star className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div className="bg-blue-100 rounded-lg px-3 py-1 inline-block">
                  <span className="text-[12px] font-bold text-blue-700">Learning! 💪</span>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 2: Parent Update Notification */}
          <section>
            <h2 className="text-[20px] font-bold text-[--tk-text] mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Message for Mom & Dad
            </h2>
            
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-5 border border-tk-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-[48px]">💌</div>
                <div>
                  <div className="text-[16px] font-bold text-[--tk-text]">Great week!</div>
                  <div className="text-[12px] text-gray-600">Ready to share with parents</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="text-[14px] text-[--tk-text] mb-2">
                  "Hi Mom and Dad! 👋 This week I completed 4 lessons, learned about addition, and read 2 story books! My favorite was learning about butterflies in Science. Can't wait to show you my math worksheet! 🦋📚"
                </div>
              </div>
              
              <button className="bg-pink-500 text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-pink-600 transition-colors w-full">
                Send Update to Parents 📱
              </button>
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
    <div className="px-6 py-6 space-y-6 bg-[--tk-surface] min-h-full pb-20">
      <h1 className="text-[28px] font-bold text-[--tk-text] mb-6">Profile</h1>
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[--tk-blue-600] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">{studentName[0]}</span>
        </div>
        <p className="text-[--tk-text] font-semibold text-lg">{studentName}</p>
        <p className="text-gray-600">K-7 Student</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[--tk-surface]">
      {renderContent()}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={getStudentNavigationTabs()}
      />
    </div>
  );
};

export default StudentDashboardK7;