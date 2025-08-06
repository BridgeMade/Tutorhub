import React, { useState, useEffect } from 'react';
import { Shield, FileText, Users, TrendingUp, Download, Eye, AlertTriangle, CheckCircle, Clock, Search, Filter, BarChart3, Activity, BookOpen, Upload, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminResourceDashboardProps {
  adminId: string;
}

interface PlatformStats {
  totalResources: number;
  totalSubmissions: number;
  pendingReviews: number;
  totalUsers: number;
  downloadsThisWeek: number;
  uploadsThisWeek: number;
  activeUsers: number;
  storageUsed: number;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_size: number;
  download_count: number;
  view_count: number;
  rating_average: number;
  status: string;
  visibility: string;
  created_at: string;
  category: {
    name: string;
    icon: string;
  };
  subject: {
    name: string;
  };
  grade_level: {
    grade_name: string;
  };
  uploader: {
    full_name: string;
    role: string;
  };
}

interface Submission {
  id: string;
  title: string;
  submission_type: string;
  status: string;
  needs_review: boolean;
  created_at: string;
  student: {
    full_name: string;
    email: string;
  };
  assigned_tutor?: {
    full_name: string;
  };
  subject: {
    name: string;
  };
}

interface UsageMetrics {
  date: string;
  downloads: number;
  uploads: number;
  views: number;
}

export const AdminResourceDashboard: React.FC<AdminResourceDashboardProps> = ({ adminId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'submissions' | 'analytics'>('overview');
  const [stats, setStats] = useState<PlatformStats>({
    totalResources: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    totalUsers: 0,
    downloadsThisWeek: 0,
    uploadsThisWeek: 0,
    activeUsers: 0,
    storageUsed: 0
  });
  const [resources, setResources] = useState<Resource[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [resourceFilter, setResourceFilter] = useState({
    search: '',
    status: 'all',
    category: 'all',
    uploader: 'all'
  });

  const [submissionFilter, setSubmissionFilter] = useState({
    search: '',
    status: 'all',
    needsReview: 'all'
  });

  useEffect(() => {
    loadDashboardData();
  }, [adminId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadResources(),
        loadSubmissions(),
        loadUsageMetrics()
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
        resourcesResult,
        submissionsResult,
        pendingReviewsResult,
        usersResult,
        downloadsResult,
        uploadsResult,
        activeUsersResult
      ] = await Promise.all([
        supabase.from('resources').select('id', { count: 'exact' }),
        supabase.from('student_submissions').select('id', { count: 'exact' }),
        supabase.from('student_submissions').select('id', { count: 'exact' }).eq('needs_review', true),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase
          .from('resource_access_logs')
          .select('id', { count: 'exact' })
          .eq('access_type', 'download')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('resources')
          .select('id', { count: 'exact' })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('resource_access_logs')
          .select('user_id')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .then((result: any) => ({
            ...result,
            count: result.data ? new Set(result.data.map((item: any) => item.user_id)).size : 0
          }))
      ]);

      setStats({
        totalResources: resourcesResult.count || 0,
        totalSubmissions: submissionsResult.count || 0,
        pendingReviews: pendingReviewsResult.count || 0,
        totalUsers: usersResult.count || 0,
        downloadsThisWeek: downloadsResult.count || 0,
        uploadsThisWeek: uploadsResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        storageUsed: 0 // TODO: Calculate from file sizes
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          category:resource_categories(name, icon),
          subject:subjects(name),
          grade_level:grade_levels(grade_name),
          uploader:profiles!resources_uploaded_by_fkey(full_name, role)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading resources:', error);
        return;
      }

      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('student_submissions')
        .select(`
          *,
          student:profiles!student_submissions_student_id_fkey(full_name, email),
          assigned_tutor:profiles!student_submissions_assigned_tutor_fkey(full_name),
          subject:subjects(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading submissions:', error);
        return;
      }

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const loadUsageMetrics = async () => {
    try {
      // Get usage data for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const { data: accessLogs, error } = await supabase
        .from('resource_access_logs')
        .select('created_at, access_type')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error loading usage metrics:', error);
        return;
      }

      // Group by date
      const metricsByDate: { [key: string]: UsageMetrics } = {};
      
      accessLogs?.forEach((log: any) => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        if (!metricsByDate[date]) {
          metricsByDate[date] = { date, downloads: 0, uploads: 0, views: 0 };
        }
        
        if (log.access_type === 'download') {
          metricsByDate[date].downloads++;
        } else if (log.access_type === 'view') {
          metricsByDate[date].views++;
        }
      });

      // Convert to array and sort by date
      const metricsArray = Object.values(metricsByDate).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setUsageMetrics(metricsArray);
    } catch (error) {
      console.error('Error loading usage metrics:', error);
    }
  };

  const handleResourceStatusChange = async (resourceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ status: newStatus })
        .eq('id', resourceId);

      if (error) {
        console.error('Error updating resource status:', error);
        alert('Failed to update resource status');
        return;
      }

      // Update local state
      setResources(prev =>
        prev.map(resource =>
          resource.id === resourceId ? { ...resource, status: newStatus } : resource
        )
      );

      alert('Resource status updated successfully');
    } catch (error) {
      console.error('Error updating resource status:', error);
      alert('Failed to update resource status');
    }
  };

  const getStatusColor = (status: string, needsReview?: boolean) => {
    if (needsReview) return 'bg-yellow-100 text-yellow-800';
    
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'graded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = !resourceFilter.search || 
      resource.title.toLowerCase().includes(resourceFilter.search.toLowerCase()) ||
      resource.uploader.full_name.toLowerCase().includes(resourceFilter.search.toLowerCase());
    
    const matchesStatus = resourceFilter.status === 'all' || resource.status === resourceFilter.status;
    const matchesCategory = resourceFilter.category === 'all' || resource.category.name === resourceFilter.category;
    const matchesUploader = resourceFilter.uploader === 'all' || resource.uploader.role === resourceFilter.uploader;

    return matchesSearch && matchesStatus && matchesCategory && matchesUploader;
  });

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = !submissionFilter.search || 
      submission.title.toLowerCase().includes(submissionFilter.search.toLowerCase()) ||
      submission.student.full_name.toLowerCase().includes(submissionFilter.search.toLowerCase());
    
    const matchesStatus = submissionFilter.status === 'all' || submission.status === submissionFilter.status;
    const matchesNeedsReview = submissionFilter.needsReview === 'all' || 
      (submissionFilter.needsReview === 'true' && submission.needs_review) ||
      (submissionFilter.needsReview === 'false' && !submission.needs_review);

    return matchesSearch && matchesStatus && matchesNeedsReview;
  });

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
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resource Administration</h1>
            <p className="text-gray-600">
              Monitor and manage all platform resources, submissions, and user activity.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Submissions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingReviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Downloads This Week</p>
              <p className="text-xl font-semibold text-gray-900">{stats.downloadsThisWeek}</p>
            </div>
            <Download className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Uploads This Week</p>
              <p className="text-xl font-semibold text-gray-900">{stats.uploadsThisWeek}</p>
            </div>
            <Upload className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'resources'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Resources</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submissions'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Submissions</span>
                {stats.pendingReviews > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {stats.pendingReviews}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>
              
              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Recent Resources</h3>
                  <div className="space-y-3">
                    {resources.slice(0, 5).map(resource => (
                      <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                          <p className="text-xs text-gray-500">
                            by {resource.uploader.full_name} • {new Date(resource.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(resource.status)}`}>
                          {resource.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Recent Submissions</h3>
                  <div className="space-y-3">
                    {submissions.slice(0, 5).map(submission => (
                      <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{submission.title}</p>
                          <p className="text-xs text-gray-500">
                            by {submission.student.full_name} • {new Date(submission.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status, submission.needs_review)}`}>
                          {submission.needs_review ? 'Needs Review' : submission.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Resources</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={resourceFilter.search}
                      onChange={(e) => setResourceFilter(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <select
                    value={resourceFilter.status}
                    onChange={(e) => setResourceFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="under_review">Under Review</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredResources.map(resource => (
                  <div key={resource.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{resource.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(resource.status)}`}>
                            {resource.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div><strong>Uploader:</strong> {resource.uploader.full_name} ({resource.uploader.role})</div>
                          <div><strong>Subject:</strong> {resource.subject.name}</div>
                          <div><strong>Grade:</strong> {resource.grade_level.grade_name}</div>
                          <div><strong>Category:</strong> {resource.category.name.replace('_', ' ')}</div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Download className="h-3 w-3" />
                            <span>{resource.download_count} downloads</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{resource.view_count} views</span>
                          </div>
                          <div><strong>Size:</strong> {formatFileSize(resource.file_size)}</div>
                          <div><strong>Created:</strong> {new Date(resource.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <select
                          value={resource.status}
                          onChange={(e) => handleResourceStatusChange(resource.id, e.target.value)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="active">Active</option>
                          <option value="under_review">Under Review</option>
                          <option value="rejected">Rejected</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Submissions</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search submissions..."
                      value={submissionFilter.search}
                      onChange={(e) => setSubmissionFilter(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <select
                    value={submissionFilter.needsReview}
                    onChange={(e) => setSubmissionFilter(prev => ({ ...prev, needsReview: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Reviews</option>
                    <option value="true">Needs Review</option>
                    <option value="false">Reviewed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredSubmissions.map(submission => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{submission.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status, submission.needs_review)}`}>
                            {submission.needs_review ? 'Needs Review' : submission.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div><strong>Student:</strong> {submission.student.full_name}</div>
                          <div><strong>Subject:</strong> {submission.subject.name}</div>
                          <div><strong>Type:</strong> {submission.submission_type}</div>
                          <div><strong>Submitted:</strong> {new Date(submission.created_at).toLocaleDateString()}</div>
                        </div>

                        {submission.assigned_tutor && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Assigned Tutor:</strong> {submission.assigned_tutor.full_name}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {submission.needs_review && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        {submission.status === 'graded' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Platform Analytics</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600">
                  Detailed usage analytics, trends, and reporting dashboard coming soon.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>This will include:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Resource download trends over time</li>
                    <li>• User engagement metrics</li>
                    <li>• Subject and grade-level analytics</li>
                    <li>• Performance dashboards</li>
                    <li>• Custom reporting tools</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};