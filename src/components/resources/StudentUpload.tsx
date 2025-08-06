import React, { useState, useEffect, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fileUploadService, StudentSubmissionMetadata } from '../../services/fileUploadService';

interface Subject {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  grade_number: number;
  grade_name: string;
}

interface Topic {
  id: string;
  topic_name: string;
}

interface Tutor {
  id: string;
  full_name: string;
  email: string;
}

interface StudentUploadProps {
  studentId: string;
  onUploadComplete?: (submissionId: string) => void;
}

interface FileWithPreview extends File {
  preview?: string;
}

export const StudentUpload: React.FC<StudentUploadProps> = ({
  studentId,
  onUploadComplete
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [studentGrade, setStudentGrade] = useState<number | null>(null);

  // Form state
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    submissionType: 'homework' as 'homework' | 'assignment' | 'test' | 'project' | 'essay',
    subjectId: '',
    gradeLevelId: '',
    topicId: '',
    dueDate: '',
    instructions: '',
    assignedTutor: ''
  });

  // UI state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.subjectId && formData.gradeLevelId) {
      loadTopics();
    }
  }, [formData.subjectId, formData.gradeLevelId]);

  const loadInitialData = async () => {
    try {
      // Load student's grade level
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('id', studentId)
        .single();

      if (profile?.grade_level) {
        setStudentGrade(profile.grade_level);
      }

      // Load subjects, grades, and tutors
      const [subjectsData, gradesData, tutorsData] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('grade_levels').select('*').order('grade_number'),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'tutor')
          .order('full_name')
      ]);

      if (subjectsData.data) setSubjects(subjectsData.data);
      if (gradesData.data) {
        setGrades(gradesData.data);
        // Auto-select student's grade if available
        if (profile?.grade_level) {
          const grade = gradesData.data.find((g: any) => g.grade_number === profile.grade_level);
          if (grade) {
            setFormData(prev => ({ ...prev, gradeLevelId: grade.id }));
          }
        }
      }
      if (tutorsData.data) setTutors(tutorsData.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('subject_topics')
        .select('*')
        .eq('subject_id', formData.subjectId)
        .eq('grade_level_id', formData.gradeLevelId)
        .order('topic_name');

      if (error) {
        console.error('Error loading topics:', error);
        return;
      }

      setTopics(data || []);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (fileList: File[]) => {
    const newFiles: FileWithPreview[] = [];
    const newErrors: { [key: string]: string } = {};

    fileList.forEach((file, index) => {
      // Validate file
      const validation = fileUploadService.validateFile(file);
      if (!validation.valid) {
        newErrors[`file_${index}`] = validation.error || 'Invalid file';
        return;
      }

      // Create preview for images
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      newFiles.push(fileWithPreview);
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setErrors(prev => ({ ...prev, ...newErrors }));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.submissionType) {
      newErrors.submissionType = 'Submission type is required';
    }

    if (!formData.subjectId) {
      newErrors.subjectId = 'Subject is required';
    }

    if (!formData.gradeLevelId) {
      newErrors.gradeLevelId = 'Grade level is required';
    }

    if (selectedFiles.length === 0) {
      newErrors.files = 'At least one file is required';
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setUploading(true);

    try {
      // Upload each file as a separate submission
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const metadata: StudentSubmissionMetadata = {
          title: selectedFiles.length > 1 ? `${formData.title} - Part ${index + 1}` : formData.title,
          description: formData.description,
          submissionType: formData.submissionType,
          subjectId: formData.subjectId,
          gradeLevelId: formData.gradeLevelId,
          topicId: formData.topicId || undefined,
          dueDate: formData.dueDate || undefined,
          instructions: formData.instructions || undefined,
          assignedTutor: formData.assignedTutor || undefined
        };

        // Track upload progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const result = await fileUploadService.uploadStudentSubmission(
          file,
          metadata,
          studentId
        );

        if (result.success) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          return result.submissionId;
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      });

      const submissionIds = await Promise.all(uploadPromises);

      // Clear form
      setSelectedFiles([]);
      setFormData({
        title: '',
        description: '',
        submissionType: 'homework',
        subjectId: '',
        gradeLevelId: studentGrade ? grades.find(g => g.grade_number === studentGrade)?.id || '' : '',
        topicId: '',
        dueDate: '',
        instructions: '',
        assignedTutor: ''
      });
      setUploadProgress({});
      setErrors({});

      // Notify parent component
      if (onUploadComplete && submissionIds[0]) {
        onUploadComplete(submissionIds[0]);
      }

      // Show success message
      alert(`Successfully uploaded ${submissionIds.length} submission${submissionIds.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Error uploading submissions:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload submissions');
    } finally {
      setUploading(false);
    }
  };

  const getSupportedFileTypes = () => {
    const types = fileUploadService.getSupportedFileTypes();
    return Object.entries(types).map(([category, extensions]) => 
      `${category}: ${extensions.join(', ')}`
    ).join(' | ');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Homework/Assignment</h2>
        <p className="text-sm text-gray-600">
          Submit your homework, assignments, tests, or projects for tutor review.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Math Homework Chapter 5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Submission Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.submissionType}
              onChange={(e) => setFormData(prev => ({ ...prev, submissionType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="homework">Homework</option>
              <option value="assignment">Assignment</option>
              <option value="test">Test</option>
              <option value="project">Project</option>
              <option value="essay">Essay</option>
            </select>
            {errors.submissionType && <p className="text-red-500 text-xs mt-1">{errors.submissionType}</p>}
          </div>
        </div>

        {/* Academic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value, topicId: '' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            {errors.subjectId && <p className="text-red-500 text-xs mt-1">{errors.subjectId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gradeLevelId}
              onChange={(e) => setFormData(prev => ({ ...prev, gradeLevelId: e.target.value, topicId: '' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select Grade</option>
              {grades.map(grade => (
                <option key={grade.id} value={grade.id}>{grade.grade_name}</option>
              ))}
            </select>
            {errors.gradeLevelId && <p className="text-red-500 text-xs mt-1">{errors.gradeLevelId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic (Optional)
            </label>
            <select
              value={formData.topicId}
              onChange={(e) => setFormData(prev => ({ ...prev, topicId: e.target.value }))}
              disabled={!formData.subjectId || !formData.gradeLevelId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
            >
              <option value="">Select Topic</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.topic_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Tutor (Optional)
            </label>
            <select
              value={formData.assignedTutor}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedTutor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select Tutor</option>
              {tutors.map(tutor => (
                <option key={tutor.id} value={tutor.id}>{tutor.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description and Instructions */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the work..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions/Notes (Optional)
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Any specific instructions or notes for the tutor..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Files <span className="text-red-500">*</span>
          </label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-orange-400 bg-orange-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-3">
              {getSupportedFileTypes()}
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mp3,.wav"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 cursor-pointer"
            >
              Choose Files
            </label>
          </div>
          
          {errors.files && <p className="text-red-500 text-xs mt-1">{errors.files}</p>}
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadProgress[file.name] !== undefined && (
                      <div className="flex items-center space-x-2">
                        {uploadProgress[file.name] === 100 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : uploading ? (
                          <div className="flex items-center space-x-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                            <span className="text-xs text-gray-500">{uploadProgress[file.name]}%</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setSelectedFiles([]);
              setFormData({
                title: '',
                description: '',
                submissionType: 'homework',
                subjectId: '',
                gradeLevelId: studentGrade ? grades.find(g => g.grade_number === studentGrade)?.id || '' : '',
                topicId: '',
                dueDate: '',
                instructions: '',
                assignedTutor: ''
              });
              setErrors({});
            }}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Clear Form
          </button>
          
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
                <span>Submit Work</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};