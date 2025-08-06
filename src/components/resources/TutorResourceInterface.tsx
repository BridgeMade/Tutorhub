import React, { useState, useEffect } from 'react';
import { Upload, BookOpen, FileText, Search, Filter, Eye, Download, MessageSquare, Star, Clock, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fileUploadService, ResourceMetadata } from '../../services/fileUploadService';

interface TutorResourceInterfaceProps {
  tutorId: string;
}

interface StudentSubmission {
  id: string;
  title: string;
  description: string;
  submission_type: string;
  status: string;
  created_at: string;
  submitted_at: string;
  due_date?: string;
  needs_review: boolean;
  grade_received?: string;
  tutor_feedback?: string;
  resource: {
    file_name: string;
    file_size: number;
    file_type: string;
    file_path: string;
  };
  student: {
    full_name: string;
    email: string;
  };
  subject: {
    name: string;
  };
  grade_level: {
    grade_name: string;
  };
  topic?: {
    topic_name: string;
  };
}

interface Subject {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  grade_number: number;
  grade_name: string;
}

interface Category {
  id: string;
  name: string;
}

export const TutorResourceInterface: React.FC<TutorResourceInterfaceProps> = ({ tutorId }) => {
  const [activeTab, setActiveTab] = useState<'review' | 'upload' | 'resources'>('review');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<StudentSubmission[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    subjectId: '',
    gradeLevelId: '',
    visibility: 'public' as 'public' | 'private' | 'restricted',
    targetAudience: ['student'] as string[],
    difficultyLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimatedTimeMinutes: '',
    keywords: '',
    tags: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Review state
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [reviewForm, setReviewForm] = useState({
    grade: '',
    feedback: '',
    status: 'reviewed' as 'reviewed' | 'graded' | 'returned'
  });
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [tutorId]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, statusFilter, subjectFilter]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSubmissions(),
        loadSubjects(),
        loadGrades(),
        loadCategories()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('student_submissions')
        .select(`
          *,
          resource:resources(file_name, file_size, file_type, file_path),
          student:profiles!student_submissions_student_id_fkey(full_name, email),
          subject:subjects(name),
          grade_level:grade_levels(grade_name),
          topic:subject_topics(topic_name)
        `)
        .or(`assigned_tutor.eq.${tutorId},assigned_tutor.is.null`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading submissions:', error);
        return;
      }

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading subjects:', error);
        return;
      }

      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('grade_levels')
        .select('*')
        .order('grade_number');

      if (error) {
        console.error('Error loading grades:', error);
        return;
      }

      setGrades(data || []);
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(submission =>
        submission.title.toLowerCase().includes(search) ||
        submission.student.full_name.toLowerCase().includes(search) ||
        submission.subject.name.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'needs_review') {
        filtered = filtered.filter(submission => submission.needs_review);
      } else {
        filtered = filtered.filter(submission => submission.status === statusFilter);
      }
    }

    if (subjectFilter !== 'all') {
      filtered = filtered.filter(submission => submission.subject.name === subjectFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const metadata: ResourceMetadata = {
          title: selectedFiles.length > 1 ? `${uploadForm.title} - Part ${index + 1}` : uploadForm.title,
          description: uploadForm.description,
          categoryId: uploadForm.categoryId,
          subjectId: uploadForm.subjectId,
          gradeLevelId: uploadForm.gradeLevelId,
          visibility: uploadForm.visibility,
          targetAudience: uploadForm.targetAudience,
          difficultyLevel: uploadForm.difficultyLevel,
          estimatedTimeMinutes: uploadForm.estimatedTimeMinutes ? parseInt(uploadForm.estimatedTimeMinutes) : undefined,
          keywords: uploadForm.keywords ? uploadForm.keywords.split(',').map(k => k.trim()) : [],
          tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()) : []
        };

        return fileUploadService.uploadStudentResource(file, metadata, tutorId);
      });

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(r => r.success).length;

      if (successCount === results.length) {
        alert(`Successfully uploaded ${successCount} resource${successCount > 1 ? 's' : ''}!`);
        // Reset form
        setUploadForm({
          title: '',
          description: '',
          categoryId: '',
          subjectId: '',
          gradeLevelId: '',
          visibility: 'public',
          targetAudience: ['student'],
          difficultyLevel: 'beginner',
          estimatedTimeMinutes: '',
          keywords: '',
          tags: ''
        });
        setSelectedFiles([]);
      } else {
        alert(`Uploaded ${successCount} of ${results.length} files. Some uploads failed.`);
      }
    } catch (error) {
      console.error('Error uploading resources:', error);
      alert('Failed to upload resources');
    } finally {
      setUploading(false);
    }
  };

  const handleReviewSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubmission) return;

    setReviewing(true);

    try {
      const { error } = await supabase
        .from('student_submissions')
        .update({
          grade_received: reviewForm.grade || null,
          tutor_feedback: reviewForm.feedback,
          status: reviewForm.status,
          needs_review: false,
          reviewed_by: tutorId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id);

      if (error) {
        console.error('Error updating submission:', error);
        alert('Failed to update submission');
        return;
      }

      // Create notification for student
      await supabase
        .from('notifications')
        .insert({
          user_id: (selectedSubmission.student as any).id || selectedSubmission.id,
          title: 'Submission Reviewed',
          message: `Your submission "${selectedSubmission.title}" has been reviewed.`,
          type: 'submission_reviewed',
          related_id: selectedSubmission.id
        });

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === selectedSubmission.id
            ? {
                ...sub,
                grade_received: reviewForm.grade || undefined,
                tutor_feedback: reviewForm.feedback,
                status: reviewForm.status,
                needs_review: false
              }
            : sub
        )
      );

      setSelectedSubmission(null);
      setReviewForm({ grade: '', feedback: '', status: 'reviewed' });
      alert('Submission reviewed successfully!');
    } catch (error) {
      console.error('Error reviewing submission:', error);
      alert('Failed to review submission');
    } finally {
      setReviewing(false);
    }
  };

  const downloadSubmission = async (submission: StudentSubmission) => {
    try {
      const result = await fileUploadService.downloadResource(
        (submission.resource as any).id || submission.id,
        tutorId
      );

      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        alert(result.error || 'Failed to download submission');
      }
    } catch (error) {
      console.error('Error downloading submission:', error);
      alert('Failed to download submission');
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tutor Resource Center</h1>
        <p className="text-gray-600">
          Review student submissions and upload learning resources for your students.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('review')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'review'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Review Submissions</span>
                {filteredSubmissions.filter(s => s.needs_review).length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {filteredSubmissions.filter(s => s.needs_review).length}
                  </span>
                )}
              </div>
            </button>

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
                <span>Upload Resources</span>
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
                <span>My Resources</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Review Submissions Tab */}
          {activeTab === 'review' && (
            <div>
              {/* Filters */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Student Submissions</h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Filter Controls */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="all">All Status</option>
                        <option value="needs_review">Needs Review</option>
                        <option value="submitted">Submitted</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="graded">Graded</option>
                        <option value="returned">Returned</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="all">All Subjects</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.name}>{subject.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setSubjectFilter('all');
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submissions List */}
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No student submissions match your current filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
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

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Student:</span> {submission.student.full_name}
                            </div>
                            <div>
                              <span className="font-medium">Subject:</span> {submission.subject.name}
                            </div>
                            <div>
                              <span className="font-medium">Grade:</span> {submission.grade_level.grade_name}
                            </div>
                            <div>
                              <span className="font-medium">Type:</span> {submission.submission_type}
                            </div>
                            <div>
                              <span className="font-medium">Submitted:</span> {new Date(submission.submitted_at).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">File:</span> {submission.resource.file_name} ({formatFileSize(submission.resource.file_size)})
                            </div>
                          </div>

                          {submission.description && (
                            <p className="text-sm text-gray-600 mb-3">{submission.description}</p>
                          )}

                          {submission.grade_received && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span className="text-sm font-medium text-green-800">
                                  Grade: {submission.grade_received}
                                </span>
                              </div>
                              {submission.tutor_feedback && (
                                <p className="text-sm text-green-700 mt-1">{submission.tutor_feedback}</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => downloadSubmission(submission)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </button>

                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Review</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Resources Tab */}
          {activeTab === 'upload' && (
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Learning Resource</h2>
                
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Algebra Worksheet - Linear Equations"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={uploadForm.categoryId}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Academic Classification */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={uploadForm.subjectId}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, subjectId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={uploadForm.gradeLevelId}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, gradeLevelId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select Grade</option>
                      {grades.map(grade => (
                        <option key={grade.id} value={grade.id}>{grade.grade_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={uploadForm.difficultyLevel}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, difficultyLevel: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this resource covers and how it should be used..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Files <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mp3,.wav"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Selected files:</p>
                      <ul className="text-sm text-gray-500">
                        {selectedFiles.map((file, index) => (
                          <li key={index}>• {file.name} ({formatFileSize(file.size)})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={uploadForm.estimatedTimeMinutes}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, estimatedTimeMinutes: e.target.value }))}
                      placeholder="e.g., 30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility
                    </label>
                    <select
                      value={uploadForm.visibility}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, visibility: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="public">Public (All Students)</option>
                      <option value="restricted">My Students Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                {/* Keywords and Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={uploadForm.keywords}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="e.g., algebra, equations, practice"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., homework, test-prep, review"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading || selectedFiles.length === 0}
                    className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload Resource</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* My Resources Tab */}
          {activeTab === 'resources' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My Uploaded Resources</h2>
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Resource management interface coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Review Submission</h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Submission Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">{selectedSubmission.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><strong>Student:</strong> {selectedSubmission.student.full_name}</div>
                  <div><strong>Subject:</strong> {selectedSubmission.subject.name}</div>
                  <div><strong>Grade:</strong> {selectedSubmission.grade_level.grade_name}</div>
                  <div><strong>Type:</strong> {selectedSubmission.submission_type}</div>
                  <div><strong>Submitted:</strong> {new Date(selectedSubmission.submitted_at).toLocaleDateString()}</div>
                  <div><strong>File:</strong> {selectedSubmission.resource.file_name}</div>
                </div>
                {selectedSubmission.description && (
                  <div className="mt-2">
                    <strong>Description:</strong> {selectedSubmission.description}
                  </div>
                )}
              </div>

              {/* Review Form */}
              <form onSubmit={handleReviewSubmission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewForm.grade}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, grade: e.target.value }))}
                    placeholder="e.g., A+, 85%, 8/10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    value={reviewForm.feedback}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, feedback: e.target.value }))}
                    placeholder="Provide feedback on the student's work..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={reviewForm.status}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="reviewed">Reviewed</option>
                    <option value="graded">Graded</option>
                    <option value="returned">Needs Revision</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewing}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {reviewing ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};