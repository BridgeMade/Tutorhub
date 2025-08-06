import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, FolderOpen, Star, TrendingUp, Download, Eye } from 'lucide-react';
import { ResourceBrowser } from './ResourceBrowser';
import { StudentUpload } from './StudentUpload';
import { ResourceRecommendations } from './ResourceRecommendations';
import { supabase } from '../../lib/supabase';

interface ResourcesDashboardProps {
  currentUserId: string;
  userRole: 'student' | 'tutor' | 'admin';
}

interface DashboardStats {
  totalResources: number;
  mySubmissions: number;
  downloadsThisWeek: number;
  favoriteResources: number;
  recentActivity: number;
}

interface RecentSubmission {
  id: string;
  title: string;
  submission_type: string;
  status: string;
  created_at: string;
  needs_review: boolean;
  subject_name: string;
  tutor_name?: string;
}

export const ResourcesDashboard: React.FC<ResourcesDashboardProps> = ({
  currentUserId,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'upload' | 'submissions'>('browse');
  const [stats, setStats] = useState<DashboardStats>({
    totalResources: 0,
    mySubmissions: 0,
    downloadsThisWeek: 0,
    favoriteResources: 0,
    recentActivity: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUserId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      setUserProfile(profile);

      // Load dashboard stats in parallel
      await Promise.all([
        loadStats(),
        loadRecentSubmissions()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [
        totalResourcesResult,
        mySubmissionsResult,
        downloadsResult,
        recentActivityResult
      ] = await Promise.all([
        // Total public resources
        supabase
          .from('resources')
          .select('id', { count: 'exact' })
          .eq('status', 'active')
          .eq('visibility', 'public'),

        // My submissions (for students)
        userRole === 'student' 
          ? supabase
              .from('student_submissions')
              .select('id', { count: 'exact' })
              .eq('student_id', currentUserId)
          : Promise.resolve({ count: 0 }),

        // My downloads this week
        supabase
          .from('resource_access_logs')
          .select('id', { count: 'exact' })
          .eq('user_id', currentUserId)
          .eq('access_type', 'download')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

        // Recent activity (views + downloads) in last 7 days
        supabase
          .from('resource_access_logs')
          .select('id', { count: 'exact' })
          .eq('user_id', currentUserId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      setStats({
        totalResources: totalResourcesResult.count || 0,
        mySubmissions: mySubmissionsResult.count || 0,
        downloadsThisWeek: downloadsResult.count || 0,
        favoriteResources: 0, // TODO: Implement favorites
        recentActivity: recentActivityResult.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentSubmissions = async () => {
    if (userRole !== 'student') return;

    try {
      const { data, error } = await supabase
        .from('student_submissions')
        .select(`
          id,
          title,
          submission_type,
          status,
          created_at,
          needs_review,
          subject:subjects(name),
          assigned_tutor_profile:profiles!student_submissions_assigned_tutor_fkey(full_name)
        `)
        .eq('student_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading recent submissions:', error);
        return;
      }

      const formattedSubmissions = data?.map((submission: any) => ({
        id: submission.id,
        title: submission.title,
        submission_type: submission.submission_type,
        status: submission.status,
        created_at: submission.created_at,
        needs_review: submission.needs_review,
        subject_name: submission.subject?.name || 'Unknown',
        tutor_name: submission.assigned_tutor_profile?.full_name
      })) || [];

      setRecentSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('Error loading recent submissions:', error);
    }
  };

  const getStatusColor = (status: string, needsReview: boolean) => {
    if (needsReview) return 'bg-yellow-100 text-yellow-800';
    
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, needsReview: boolean) => {
    if (needsReview) return 'Needs Review';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Resources</h1>
            <p className="text-gray-600 mt-1">
              {userRole === 'student' 
                ? 'Access learning materials and submit your homework'
                : userRole === 'tutor'
                ? 'Manage resources and review student submissions'
                : 'Oversee all platform resources and submissions'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Grade Level</p>
              <p className="text-lg font-semibold text-gray-900">
                {userProfile?.grade_level ? `Grade ${userProfile.grade_level}` : 'Not Set'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Resources</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalResources}</p>
            </div>
          </div>
        </div>

        {userRole === 'student' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">My Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.mySubmissions}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Download className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Downloads This Week</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.downloadsThisWeek}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Recent Activity</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.recentActivity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-3">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'browse'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Browse Resources</span>
                  </div>
                </button>

                {userRole === 'student' && (
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'upload'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>Submit Work</span>
                    </div>
                  </button>
                )}

                {userRole === 'student' && (
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'submissions'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="h-4 w-4" />
                      <span>My Submissions</span>
                    </div>
                  </button>
                )}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'browse' && (
                <ResourceBrowser
                  userGrade={userProfile?.grade_level}
                  userSubjects={userProfile?.subjects || []}
                  currentUserId={currentUserId}
                />
              )}

              {activeTab === 'upload' && userRole === 'student' && (
                <div className="p-6">
                  <StudentUpload
                    studentId={currentUserId}
                    onUploadComplete={() => {
                      loadRecentSubmissions();
                      loadStats();
                      setActiveTab('submissions');
                    }}
                  />
                </div>
              )}

              {activeTab === 'submissions' && userRole === 'student' && (
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">My Submissions</h3>
                    <p className="text-sm text-gray-500">Track your submitted homework and assignments</p>
                  </div>

                  {recentSubmissions.length === 0 ? (
                    <div className="text-center py-8">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start by uploading your first homework or assignment.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                        >
                          <Upload className="-ml-1 mr-2 h-4 w-4" />
                          Submit Work
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentSubmissions.map(submission => (
                        <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900">{submission.title}</h4>
                              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                <span>{submission.subject_name}</span>
                                <span>•</span>
                                <span className="capitalize">{submission.submission_type}</span>
                                <span>•</span>
                                <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                              </div>
                              {submission.tutor_name && (
                                <div className="mt-1 text-sm text-gray-500">
                                  Assigned to: {submission.tutor_name}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status, submission.needs_review)}`}>
                                {getStatusText(submission.status, submission.needs_review)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {recentSubmissions.length >= 5 && (
                        <div className="text-center">
                          <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                            View All Submissions
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Personalized Recommendations */}
          {userRole === 'student' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <ResourceRecommendations
                userId={currentUserId}
                context="dashboard"
                maxRecommendations={6}
                showTitle={true}
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {userRole === 'student' && (
                <button
                  onClick={() => setActiveTab('upload')}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <Upload className="h-4 w-4" />
                  <span>Submit New Work</span>
                </button>
              )}
              
              <button
                onClick={() => setActiveTab('browse')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
              >
                <BookOpen className="h-4 w-4" />
                <span>Browse Resources</span>
              </button>

              <button
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
              >
                <Star className="h-4 w-4" />
                <span>My Favorites</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          {userRole === 'student' && recentSubmissions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Submissions</h3>
              <div className="space-y-3">
                {recentSubmissions.slice(0, 3).map(submission => (
                  <div key={submission.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Upload className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {submission.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status, submission.needs_review)}`}>
                        {submission.needs_review ? 'Review' : submission.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};