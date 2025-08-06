import { supabase } from '../lib/supabase';

export interface FileUploadOptions {
  bucket: string;
  path: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResult {
  success: boolean;
  data?: {
    id: string;
    path: string;
    fullPath: string;
    publicUrl: string;
  };
  error?: string;
}

export interface ResourceMetadata {
  title: string;
  description?: string;
  categoryId: string;
  subjectId: string;
  gradeLevelId: string;
  topicId?: string;
  visibility: 'public' | 'private' | 'restricted';
  targetAudience: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeMinutes?: number;
  keywords?: string[];
  tags?: string[];
  lessonId?: string;
  assignmentId?: string;
}

export interface StudentSubmissionMetadata {
  title: string;
  description?: string;
  submissionType: 'homework' | 'assignment' | 'test' | 'project' | 'essay';
  subjectId: string;
  gradeLevelId: string;
  topicId?: string;
  dueDate?: string;
  instructions?: string;
  assignedTutor?: string;
}

class FileUploadService {
  private readonly ALLOWED_FILE_TYPES = {
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    image: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    video: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov'
    ],
    audio: [
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/m4a'
    ]
  };

  private readonly MAX_FILE_SIZES = {
    document: 25 * 1024 * 1024, // 25MB
    image: 10 * 1024 * 1024,    // 10MB
    video: 100 * 1024 * 1024,   // 100MB
    audio: 25 * 1024 * 1024,    // 25MB
    default: 25 * 1024 * 1024   // 25MB
  };

  private readonly STORAGE_BUCKETS = {
    resources: 'student-resources',
    submissions: 'student-submissions',
    temp: 'temp-uploads'
  };

  /**
   * Validate file type and size
   */
  validateFile(file: File): { valid: boolean; error?: string; category?: string } {
    // Determine file category
    let category = 'document';
    let allowedTypes = this.ALLOWED_FILE_TYPES.document;
    let maxSize = this.MAX_FILE_SIZES.document;

    if (this.ALLOWED_FILE_TYPES.image.includes(file.type)) {
      category = 'image';
      allowedTypes = this.ALLOWED_FILE_TYPES.image;
      maxSize = this.MAX_FILE_SIZES.image;
    } else if (this.ALLOWED_FILE_TYPES.video.includes(file.type)) {
      category = 'video';
      allowedTypes = this.ALLOWED_FILE_TYPES.video;
      maxSize = this.MAX_FILE_SIZES.video;
    } else if (this.ALLOWED_FILE_TYPES.audio.includes(file.type)) {
      category = 'audio';
      allowedTypes = this.ALLOWED_FILE_TYPES.audio;
      maxSize = this.MAX_FILE_SIZES.audio;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size (${Math.round(file.size / (1024 * 1024))}MB) exceeds maximum allowed size of ${maxSizeMB}MB`
      };
    }

    return { valid: true, category };
  }

  /**
   * Generate a unique file path
   */
  generateFilePath(
    bucket: string,
    userId: string,
    originalFileName: string,
    category?: string
  ): string {
    const timestamp = new Date().getTime();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase() || '';
    const sanitizedFileName = originalFileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();

    const basePath = category ? `${category}` : 'general';
    return `${basePath}/${userId}/${timestamp}_${randomId}_${sanitizedFileName}`;
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
    try {
      console.log('📤 Starting file upload:', {
        fileName: options.file.name,
        size: options.file.size,
        type: options.file.type,
        bucket: options.bucket,
        path: options.path
      });

      // Validate file
      const validation = this.validateFile(options.file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(options.path, options.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(options.path);

      const result = {
        success: true,
        data: {
          id: data.id || '',
          path: options.path,
          fullPath: data.path || options.path,
          publicUrl: urlData.publicUrl
        }
      };

      console.log('✅ File uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ File upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown upload error' 
      };
    }
  }

  /**
   * Upload student resource (tutor/admin uploads)
   */
  async uploadStudentResource(
    file: File,
    metadata: ResourceMetadata,
    uploadedBy: string
  ): Promise<{ success: boolean; resourceId?: string; error?: string }> {
    try {
      console.log('📚 Uploading student resource:', metadata.title);

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate file path
      const filePath = this.generateFilePath(
        this.STORAGE_BUCKETS.resources,
        uploadedBy,
        file.name,
        validation.category
      );

      // Upload file
      const uploadResult = await this.uploadFile({
        bucket: this.STORAGE_BUCKETS.resources,
        path: filePath,
        file
      });

      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      // Create resource record in database
      const { data: resource, error: dbError } = await supabase
        .from('resources')
        .insert({
          title: metadata.title,
          description: metadata.description,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          file_extension: file.name.split('.').pop()?.toLowerCase(),
          category_id: metadata.categoryId,
          subject_id: metadata.subjectId,
          grade_level_id: metadata.gradeLevelId,
          topic_id: metadata.topicId,
          uploaded_by: uploadedBy,
          uploader_role: await this.getUserRole(uploadedBy),
          visibility: metadata.visibility,
          target_audience: metadata.targetAudience,
          difficulty_level: metadata.difficultyLevel,
          estimated_time_minutes: metadata.estimatedTimeMinutes,
          keywords: metadata.keywords || [],
          tags: metadata.tags || [],
          lesson_id: metadata.lessonId,
          assignment_id: metadata.assignmentId,
          status: 'active'
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        // Clean up uploaded file
        await this.deleteFile(this.STORAGE_BUCKETS.resources, filePath);
        return { success: false, error: dbError.message };
      }

      console.log('✅ Student resource uploaded successfully:', resource.id);
      return { success: true, resourceId: resource.id };
    } catch (error) {
      console.error('❌ Error uploading student resource:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Upload student submission (homework, assignment, test)
   */
  async uploadStudentSubmission(
    file: File,
    metadata: StudentSubmissionMetadata,
    studentId: string
  ): Promise<{ success: boolean; submissionId?: string; error?: string }> {
    try {
      console.log('📝 Uploading student submission:', metadata.title);

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate file path
      const filePath = this.generateFilePath(
        this.STORAGE_BUCKETS.submissions,
        studentId,
        file.name,
        metadata.submissionType
      );

      // Upload file
      const uploadResult = await this.uploadFile({
        bucket: this.STORAGE_BUCKETS.submissions,
        path: filePath,
        file
      });

      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      // Create resource record first
      const { data: resource, error: resourceError } = await supabase
        .from('resources')
        .insert({
          title: metadata.title,
          description: metadata.description,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          file_extension: file.name.split('.').pop()?.toLowerCase(),
          category_id: await this.getCategoryIdByName(metadata.submissionType),
          subject_id: metadata.subjectId,
          grade_level_id: metadata.gradeLevelId,
          topic_id: metadata.topicId,
          uploaded_by: studentId,
          uploader_role: 'student',
          visibility: 'private',
          target_audience: ['tutor', 'admin'],
          difficulty_level: 'beginner',
          status: 'active'
        })
        .select()
        .single();

      if (resourceError) {
        console.error('❌ Resource creation error:', resourceError);
        await this.deleteFile(this.STORAGE_BUCKETS.submissions, filePath);
        return { success: false, error: resourceError.message };
      }

      // Create student submission record
      const { data: submission, error: submissionError } = await supabase
        .from('student_submissions')
        .insert({
          resource_id: resource.id,
          student_id: studentId,
          submission_type: metadata.submissionType,
          title: metadata.title,
          description: metadata.description,
          instructions: metadata.instructions,
          subject_id: metadata.subjectId,
          grade_level_id: metadata.gradeLevelId,
          topic_id: metadata.topicId,
          due_date: metadata.dueDate,
          assigned_tutor: metadata.assignedTutor,
          status: 'submitted',
          needs_review: true
        })
        .select()
        .single();

      if (submissionError) {
        console.error('❌ Submission creation error:', submissionError);
        // Clean up
        await supabase.from('resources').delete().eq('id', resource.id);
        await this.deleteFile(this.STORAGE_BUCKETS.submissions, filePath);
        return { success: false, error: submissionError.message };
      }

      console.log('✅ Student submission uploaded successfully:', submission.id);
      return { success: true, submissionId: submission.id };
    } catch (error) {
      console.error('❌ Error uploading student submission:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('❌ File deletion error:', error);
        return false;
      }

      console.log('✅ File deleted successfully:', filePath);
      return true;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file download URL
   */
  async getDownloadUrl(bucket: string, filePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('❌ Error getting download URL:', error);
      return null;
    }
  }

  /**
   * Download file and log access
   */
  async downloadResource(
    resourceId: string,
    userId: string,
    lessonContext?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Get resource details
      const { data: resource, error: resourceError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single();

      if (resourceError || !resource) {
        return { success: false, error: 'Resource not found' };
      }

      // Check permissions
      const hasAccess = await this.checkResourceAccess(resourceId, userId);
      if (!hasAccess) {
        return { success: false, error: 'Access denied' };
      }

      // Get download URL
      const bucket = resource.file_path.includes('submissions') 
        ? this.STORAGE_BUCKETS.submissions 
        : this.STORAGE_BUCKETS.resources;
      
      const downloadUrl = await this.getDownloadUrl(bucket, resource.file_path);
      if (!downloadUrl) {
        return { success: false, error: 'Could not generate download URL' };
      }

      // Log access
      await this.logResourceAccess(resourceId, userId, 'download', lessonContext);

      // Update download count
      await supabase.rpc('update_resource_access_stats', {
        p_resource_id: resourceId,
        p_access_type: 'download'
      });

      return { success: true, url: downloadUrl };
    } catch (error) {
      console.error('❌ Error downloading resource:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Download failed' 
      };
    }
  }

  /**
   * Check if user has access to resource
   */
  private async checkResourceAccess(resourceId: string, userId: string): Promise<boolean> {
    try {
      const { data: resource } = await supabase
        .from('resources')
        .select('visibility, uploaded_by')
        .eq('id', resourceId)
        .single();

      if (!resource) return false;

      // Public resources are accessible to all
      if (resource.visibility === 'public') return true;

      // Users can access their own resources
      if (resource.uploaded_by === userId) return true;

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role === 'admin') return true;

      // Check shared access for restricted resources
      if (resource.visibility === 'restricted') {
        const { data: share } = await supabase
          .from('resource_shares')
          .select('id')
          .eq('resource_id', resourceId)
          .eq('shared_with', userId)
          .eq('is_active', true)
          .single();

        return !!share;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking resource access:', error);
      return false;
    }
  }

  /**
   * Log resource access for analytics
   */
  private async logResourceAccess(
    resourceId: string,
    userId: string,
    accessType: 'view' | 'download' | 'share',
    lessonContext?: string
  ): Promise<void> {
    try {
      await supabase
        .from('resource_access_logs')
        .insert({
          resource_id: resourceId,
          user_id: userId,
          access_type: accessType,
          lesson_context: lessonContext
        });
    } catch (error) {
      console.error('❌ Error logging resource access:', error);
    }
  }

  /**
   * Helper function to get user role
   */
  private async getUserRole(userId: string): Promise<string> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return profile?.role || 'student';
    } catch (error) {
      console.error('❌ Error getting user role:', error);
      return 'student';
    }
  }

  /**
   * Helper function to get category ID by name
   */
  private async getCategoryIdByName(categoryName: string): Promise<string> {
    try {
      const { data: category } = await supabase
        .from('resource_categories')
        .select('id')
        .eq('name', categoryName)
        .single();

      return category?.id || '';
    } catch (error) {
      console.error('❌ Error getting category ID:', error);
      return '';
    }
  }

  /**
   * Get supported file types for UI display
   */
  getSupportedFileTypes(): { [key: string]: string[] } {
    return {
      Documents: ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'],
      Images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      Videos: ['.mp4', '.webm', '.ogg', '.avi', '.mov'],
      Audio: ['.mp3', '.wav', '.ogg', '.m4a']
    };
  }

  /**
   * Get maximum file size for category
   */
  getMaxFileSize(category: string): number {
    return this.MAX_FILE_SIZES[category as keyof typeof this.MAX_FILE_SIZES] || this.MAX_FILE_SIZES.default;
  }
}

export const fileUploadService = new FileUploadService();