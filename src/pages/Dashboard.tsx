import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { StudentDashboard } from '../components/student/StudentDashboard';
import { StudentDashboardContent } from '../components/student/StudentDashboardContent';
import { StudentSessions } from '../components/student/StudentSessions';
import { MobileStudentDashboard } from '../components/student/MobileStudentDashboard';
import { TutorDashboard } from '../components/tutor/TutorDashboard';
import { TutorDashboardContent } from '../components/tutor/TutorDashboardContent';
import { TutorSessions } from '../components/tutor/TutorSessions';
import { MobileTutorDashboard } from '../components/tutor/MobileTutorDashboard';
import { StudentManagement } from '../components/tutor/StudentManagement';
import { EarningsAnalytics } from '../components/tutor/comprehensive/EarningsAnalytics';
import { StudyPlanner } from '../components/student/StudyPlanner';
import { PerformanceAnalytics } from '../components/student/PerformanceAnalytics';
import { ResourceLibrary } from '../components/student/ResourceLibrary';
import { ProgressChart } from '../components/student/ProgressChart';
import { SubjectProgress } from '../components/student/SubjectProgress';
import { RecentActivity } from '../components/student/RecentActivity';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { MobileAdminDashboard } from '../components/admin/MobileAdminDashboard';
import { SessionCalendar } from '../components/calendar/SessionCalendar';
import { ScheduleManagement } from '../components/tutor/comprehensive/ScheduleManagement';
import { Navbar } from '../components/layout/Navbar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Student, Tutor, Admin, TutoringSession, DashboardStats } from '../types';
import { userService } from '../services/userService';
import { lessonService } from '../services/lessonService';
import { paymentService } from '../services/paymentService';


const Dashboard: React.FC = () => {
  const { user, loading, signOut } = useAuthContext();
  const [userData, setUserData] = useState<Student | Tutor | Admin | null>(null);
  const [sessions, setSessions] = useState<TutoringSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [realAdminStats, setRealAdminStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [profileData, setProfileData] = useState({ fullName: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateRealAdminStats = async () => {
    try {
      const [usersResponse, payments] = await Promise.all([
        userService.getAllUsers(),
        paymentService.getAllPayments()
      ]);

      const users = usersResponse.data || [];
      const totalUsers = users.length;
      const totalTutors = users.filter((u: any) => u.role === 'tutor').length;
      const totalStudents = users.filter((u: any) => u.role === 'student').length;
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

      return {
        totalUsers,
        totalTutors,
        totalStudents,
        totalRevenue
      };
    } catch (error) {
      console.error('Error calculating real admin stats:', error);
      return {
        totalUsers: 0,
        totalTutors: 0,
        totalStudents: 0,
        totalRevenue: 0
      };
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    
    setDataLoading(true);
    try {
      const fullUserData = await userService.getFullUserData(user.id);
      if (fullUserData) {
        const { profile, roleData } = fullUserData;
        console.log('Debug - Raw profile from database:', profile);
        console.log('Debug - Profile id:', profile?.id);
        console.log('Debug - Profile structure:', Object.keys(profile || {}));
        console.log('Debug - Role data:', roleData);
        
        const convertedUser = userService.profileToUser(profile, roleData);
        console.log('Debug - Converted user:', convertedUser);
        console.log('Debug - Converted user ID:', convertedUser?.id);
        
        if (convertedUser.role === 'student' || convertedUser.role === 'tutor' || convertedUser.role === 'admin') {
          setUserData(convertedUser as Student | Tutor | Admin);
        }
        
        // Initialize profile data for editing
        setProfileData({ 
          fullName: profile.full_name || `${convertedUser.firstName} ${convertedUser.lastName}`.trim() || '' 
        });
        
        const userRole = profile.role;
        if (userRole === 'admin') {
          setSessions([]);
          setStats({ totalSessions: 0, upcomingSessions: 0, completedSessions: 0, avgRating: 0 });
          
          // Calculate real admin stats
          const realStats = await calculateRealAdminStats();
          setRealAdminStats(realStats);
        } else {
          const [userSessions, userStats] = await Promise.all([
            lessonService.getLessonsForCalendar(user.id, userRole),
            lessonService.getLessonStats(user.id, userRole)
          ]);
          setSessions(userSessions);
          setStats(userStats);
        }
        
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user || !profileData.fullName.trim()) {
      alert('Please enter a valid full name');
      return;
    }

    setProfileLoading(true);
    try {
      const updatedProfile = await userService.updateUserProfile(user.id, {
        full_name: profileData.fullName.trim()
      });

      if (updatedProfile) {
        // Reload user data to reflect changes
        await loadUserData();
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const defaultStats: DashboardStats = {
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    avgRating: 0
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        if (userData.role === 'student') {
          return (
            <StudentDashboard 
              student={userData as Student}
              upcomingSessions={sessions}
              stats={stats || defaultStats}
            />
          );
        } else if (userData.role === 'tutor') {
          return (
            <TutorDashboard 
              tutor={userData as Tutor}
              upcomingSessions={sessions}
              stats={stats || defaultStats}
            />
          );
        } else if (userData.role === 'admin') {
          return (
            <AdminDashboard 
              admin={userData as Admin}
              stats={{
                ...stats || defaultStats,
                ...realAdminStats
              }}
            />
          );
        }
        break;
      
      case 'sessions':
        if (userData.role === 'student') {
          return (
            <StudentSessions 
              student={userData as Student}
              upcomingSessions={sessions}
              stats={stats || defaultStats}
            />
          );
        } else if (userData.role === 'tutor') {
          return (
            <TutorSessions 
              tutor={userData as Tutor}
              upcomingSessions={sessions}
              stats={stats || defaultStats}
            />
          );
        }
        // For admins, show calendar
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
              <p className="text-gray-600">Manage your sessions and schedule</p>
            </div>
            <SessionCalendar 
              sessions={sessions}
              onSelectSession={(session) => console.log('Selected session:', session)}
              onSelectSlot={(slotInfo) => console.log('Selected slot:', slotInfo)}
            />
          </div>
        );
        
      case 'calendar':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600">Manage your sessions and schedule</p>
            </div>
            <SessionCalendar 
              sessions={sessions}
              onSelectSession={(session) => console.log('Selected session:', session)}
              onSelectSlot={(slotInfo) => console.log('Selected slot:', slotInfo)}
            />
          </div>
        );
        
      case 'schedule':
        if (userData.role === 'tutor') {
          return (
            <ScheduleManagement 
              tutorId={userData.id}
              sessions={sessions}
            />
          );
        }
        // For students and admins, fall back to calendar view
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              <p className="text-gray-600">Manage your sessions and schedule</p>
            </div>
            <SessionCalendar 
              sessions={sessions}
              onSelectSession={(session) => console.log('Selected session:', session)}
              onSelectSlot={(slotInfo) => console.log('Selected slot:', slotInfo)}
            />
          </div>
        );
      
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account information</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900 capitalize">{userData.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Full Name</label>
                  <p className="text-sm text-gray-900">{profileData.fullName || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                    disabled={profileLoading}
                  />
                </div>
                <button 
                  onClick={updateProfile}
                  disabled={profileLoading || !profileData.fullName.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {profileLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {profileLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'students':
        if (userData.role === 'tutor') {
          return (
            <StudentManagement tutorId={userData.id} />
          );
        }
        break;
        
      case 'earnings':
        if (userData.role === 'tutor') {
          return (
            <EarningsAnalytics tutorId={userData.id} hourlyRate={(userData as Tutor).hourlyRate} />
          );
        }
        break;
        
      case 'performance':
        if (userData.role === 'student') {
          return <PerformanceAnalytics studentId={userData.id} />;
        }
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
              <p className="text-gray-600">Track your teaching performance and student progress</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-blue-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Performance Metrics</h2>
              <p className="text-gray-600">
                Detailed analytics and performance insights coming soon!
              </p>
            </div>
          </div>
        );
        
      case 'resources':
        if (userData.role === 'student') {
          return <ResourceLibrary studentId={userData.id} />;
        }
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teaching Resources</h1>
              <p className="text-gray-600">Manage your teaching materials and resources</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-green-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Resource Library</h2>
              <p className="text-gray-600">
                Upload and organize your teaching materials, worksheets, and resources.
              </p>
            </div>
          </div>
        );
        
      case 'progress':
        if (userData.role === 'student') {
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Learning Progress</h1>
                <p className="text-gray-600">Track your academic progress and achievements</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProgressChart studentId={userData.id} />
                <RecentActivity studentId={userData.id} />
                <div className="lg:col-span-2">
                  <SubjectProgress subjects={userData.subjects || []} />
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Progress</h1>
              <p className="text-gray-600">Track student learning progress and performance</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-green-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h2>
              <p className="text-gray-600">
                This feature is available for students only.
              </p>
            </div>
          </div>
        );
        
      case 'planner':
        if (userData.role === 'student') {
          return <StudyPlanner studentId={userData.id} />;
        }
        // For non-students, fall back to default
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Study Planner</h1>
              <p className="text-gray-600">Plan and organize your study schedule</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-purple-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Study Planning</h2>
              <p className="text-gray-600">
                This feature is available for students only.
              </p>
            </div>
          </div>
        );
      
      // Add other views based on user role
      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentView.charAt(0).toUpperCase() + currentView.slice(1)}</h1>
              <p className="text-gray-600">This section is coming soon!</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-yellow-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Under Construction</h2>
              <p className="text-gray-600">
                The {currentView} section will be available in a future update.
              </p>
            </div>
          </div>
        );
    }
  };

  // For students, show mobile dashboard on mobile devices
  if (userData.role === 'student') {
    if (isMobile) {
      return (
        <MobileStudentDashboard 
          student={userData as Student}
          upcomingSessions={sessions}
          stats={stats || defaultStats}
        />
      );
    }

    return (
      <DashboardLayout 
        userRole={userData.role} 
        defaultActiveTab={currentView}
        onTabChange={setCurrentView}
      >
        {renderCurrentView()}
      </DashboardLayout>
    );
  }

  // For tutors, show mobile dashboard on mobile devices
  if (userData.role === 'tutor') {
    if (isMobile) {
      return (
        <MobileTutorDashboard 
          tutor={userData as Tutor}
          upcomingSessions={sessions}
          stats={stats || defaultStats}
        />
      );
    }

    return (
      <DashboardLayout 
        userRole={userData.role} 
        defaultActiveTab={currentView}
        onTabChange={setCurrentView}
      >
        {renderCurrentView()}
      </DashboardLayout>
    );
  }

  // For admins, show mobile dashboard on mobile devices
  if (userData.role === 'admin') {
    if (isMobile) {
      return (
        <MobileAdminDashboard 
          admin={userData as Admin}
          stats={realAdminStats || {
            totalUsers: 0,
            totalTutors: 0,
            totalStudents: 0,
            totalRevenue: 0,
            totalSessions: 0,
            completedSessions: 0,
            avgRating: 0,
            totalEarnings: 0
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          currentView={currentView}
          onViewChange={setCurrentView}
          userRole={userData.role}
        />
        <div className="container mx-auto px-4 py-8">
          {renderCurrentView()}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Loading</h1>
        <p className="text-gray-600">Please wait while we load your dashboard...</p>
      </div>
    </div>
  );
};

export default Dashboard;
