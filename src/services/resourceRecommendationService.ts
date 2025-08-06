import { supabase } from '../lib/supabase';

export interface RecommendedResource {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  file_size: number;
  download_count: number;
  rating_average: number;
  difficulty_level: string;
  estimated_time_minutes: number;
  category: {
    name: string;
    icon: string;
    color: string;
  };
  subject: {
    name: string;
  };
  grade_level: {
    grade_name: string;
    grade_number: number;
  };
  topic?: {
    topic_name: string;
  };
  uploader: {
    full_name: string;
    role: string;
  };
  recommendation_score: number;
  recommendation_reason: string;
  keywords: string[];
  tags: string[];
}

export interface StudentLearningProfile {
  userId: string;
  gradeLevel: number;
  subjects: string[];
  weakSubjects: string[];
  strongSubjects: string[];
  preferredDifficulty: string;
  learningStyle: string;
  recentTopics: string[];
  downloadHistory: string[];
  sessionHistory: {
    subjectId: string;
    topicsCovered: string[];
    performanceScore?: number;
  }[];
}

export interface RecommendationFilters {
  excludeDownloaded?: boolean;
  includeOnlyNewResources?: boolean;
  maxRecommendations?: number;
  minRating?: number;
  preferredCategories?: string[];
  timeConstraint?: number; // minutes
}

class ResourceRecommendationService {
  /**
   * Get personalized resource recommendations for a student
   */
  async getPersonalizedRecommendations(
    userId: string,
    filters: RecommendationFilters = {}
  ): Promise<RecommendedResource[]> {
    try {
      console.log('🎯 Getting personalized recommendations for user:', userId);

      // Get student learning profile
      const profile = await this.getStudentLearningProfile(userId);
      if (!profile) {
        console.log('❌ No profile found, using fallback recommendations');
        return this.getFallbackRecommendations(userId, filters);
      }

      // Get recommendations using the database function
      const { data, error } = await supabase
        .rpc('get_recommended_resources', {
          p_user_id: userId,
          p_limit: filters.maxRecommendations || 10
        });

      if (error) {
        console.error('❌ Error getting recommendations:', error);
        return this.getFallbackRecommendations(userId, filters);
      }

      // Enhance recommendations with additional scoring
      const enhancedRecommendations = await this.enhanceRecommendations(
        data || [],
        profile,
        filters
      );

      console.log('✅ Generated recommendations:', enhancedRecommendations.length);
      return enhancedRecommendations;
    } catch (error) {
      console.error('❌ Error in getPersonalizedRecommendations:', error);
      return this.getFallbackRecommendations(userId, filters);
    }
  }

  /**
   * Get student learning profile from various data sources
   */
  private async getStudentLearningProfile(userId: string): Promise<StudentLearningProfile | null> {
    try {
      // Get basic profile information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error getting profile:', profileError);
        return null;
      }

      // Get student's subjects from lessons/assignments
      const { data: lessons } = await supabase
        .from('lessons')
        .select(`
          subject_id,
          subjects(id, name)
        `)
        .eq('student_id', userId)
        .limit(50);

      // Get recent downloads
      const { data: downloads } = await supabase
        .from('resource_access_logs')
        .select('resource_id')
        .eq('user_id', userId)
        .eq('access_type', 'download')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get recent session history
      const { data: sessions } = await supabase
        .from('lessons')
        .select(`
          subject_id,
          subjects(id, name),
          status,
          scheduled_at
        `)
        .eq('student_id', userId)
        .order('scheduled_at', { ascending: false })
        .limit(10);

      // Build subjects list
      const subjectIds = Array.from(new Set(
        lessons?.map((l: any) => l.subject_id).filter(Boolean) || []
      ));

      const subjects = Array.from(new Set(
        lessons?.map((l: any) => l.subjects?.name).filter(Boolean) || []
      ));

      // Analyze performance to identify weak/strong subjects
      const subjectPerformance = this.analyzeSubjectPerformance(sessions || []);

      const learningProfile: StudentLearningProfile = {
        userId,
        gradeLevel: profile.grade_level || 1,
        subjects: subjectIds as string[],
        weakSubjects: subjectPerformance.weak,
        strongSubjects: subjectPerformance.strong,
        preferredDifficulty: this.inferPreferredDifficulty(profile.grade_level),
        learningStyle: 'mixed', // Could be enhanced with user preferences
        recentTopics: [], // Could be enhanced with topic tracking
        downloadHistory: downloads?.map((d: any) => d.resource_id) || [],
        sessionHistory: sessions?.map((s: any) => ({
          subjectId: s.subject_id,
          topicsCovered: [], // Could be enhanced
          performanceScore: this.getSessionPerformanceScore(s.status)
        })) || []
      };

      return learningProfile;
    } catch (error) {
      console.error('Error building learning profile:', error);
      return null;
    }
  }

  /**
   * Enhance recommendations with additional scoring and reasoning
   */
  private async enhanceRecommendations(
    baseRecommendations: any[],
    profile: StudentLearningProfile,
    filters: RecommendationFilters
  ): Promise<RecommendedResource[]> {
    const enhanced: RecommendedResource[] = [];

    for (const rec of baseRecommendations) {
      // Skip if already downloaded and filter is set
      if (filters.excludeDownloaded && profile.downloadHistory.includes(rec.resource_id)) {
        continue;
      }

      // Calculate enhanced recommendation score
      const enhancedScore = this.calculateEnhancedScore(rec, profile);
      
      // Determine recommendation reason
      const reason = this.getRecommendationReason(rec, profile);

      // Check if meets minimum rating
      if (filters.minRating && rec.rating_average < filters.minRating) {
        continue;
      }

      // Check time constraint
      if (filters.timeConstraint && rec.estimated_time_minutes > filters.timeConstraint) {
        continue;
      }

      // Check preferred categories
      if (filters.preferredCategories && filters.preferredCategories.length > 0) {
        if (!filters.preferredCategories.includes(rec.category_name)) {
          continue;
        }
      }

      enhanced.push({
        id: rec.resource_id,
        title: rec.title,
        description: rec.description,
        file_name: rec.file_name || 'Unknown',
        file_path: rec.file_path || '',
        file_size: rec.file_size || 0,
        download_count: rec.download_count,
        rating_average: rec.rating_average,
        difficulty_level: rec.difficulty_level,
        estimated_time_minutes: rec.estimated_time_minutes || 0,
        category: {
          name: rec.category_name,
          icon: rec.category_icon || 'FileText',
          color: rec.category_color || '#3B82F6'
        },
        subject: {
          name: rec.subject_name
        },
        grade_level: {
          grade_name: rec.grade_name,
          grade_number: rec.grade_number || profile.gradeLevel
        },
        topic: rec.topic_name ? {
          topic_name: rec.topic_name
        } : undefined,
        uploader: {
          full_name: rec.uploader_name || 'Unknown',
          role: rec.uploader_role || 'tutor'
        },
        recommendation_score: enhancedScore,
        recommendation_reason: reason,
        keywords: rec.keywords || [],
        tags: rec.tags || []
      });
    }

    // Sort by enhanced score
    enhanced.sort((a, b) => b.recommendation_score - a.recommendation_score);

    return enhanced.slice(0, filters.maxRecommendations || 10);
  }

  /**
   * Calculate enhanced recommendation score
   */
  private calculateEnhancedScore(rec: any, profile: StudentLearningProfile): number {
    let score = rec.recommendation_score || 0;

    // Boost score for weak subjects (student needs more help)
    if (profile.weakSubjects.includes(rec.subject_name)) {
      score += 2.0;
    }

    // Boost score for appropriate difficulty
    if (rec.difficulty_level === profile.preferredDifficulty) {
      score += 1.0;
    }

    // Boost score for high-quality resources
    if (rec.rating_average > 4.0) {
      score += 1.5;
    }

    // Boost score for popular resources
    if (rec.download_count > 50) {
      score += 1.0;
    }

    // Boost score for recent uploads (freshness)
    const daysSinceUpload = this.getDaysSinceUpload(rec.created_at);
    if (daysSinceUpload < 30) {
      score += 0.5;
    }

    // Penalty for resources that are too easy/hard
    const gradeDifference = Math.abs((rec.grade_number || profile.gradeLevel) - profile.gradeLevel);
    if (gradeDifference > 1) {
      score -= gradeDifference * 0.5;
    }

    return Math.max(0, score);
  }

  /**
   * Get recommendation reason text
   */
  private getRecommendationReason(rec: any, profile: StudentLearningProfile): string {
    const reasons: string[] = [];

    if (profile.weakSubjects.includes(rec.subject_name)) {
      reasons.push(`Additional practice in ${rec.subject_name}`);
    }

    if (rec.rating_average > 4.0) {
      reasons.push('Highly rated by other students');
    }

    if (rec.download_count > 100) {
      reasons.push('Popular resource');
    }

    if (rec.difficulty_level === profile.preferredDifficulty) {
      reasons.push(`Matches your ${rec.difficulty_level} level`);
    }

    const gradeDiff = (rec.grade_number || profile.gradeLevel) - profile.gradeLevel;
    if (gradeDiff === 0) {
      reasons.push('Perfect for your grade level');
    } else if (gradeDiff === 1) {
      reasons.push('Challenging next-level content');
    } else if (gradeDiff === -1) {
      reasons.push('Good for reviewing fundamentals');
    }

    if (rec.estimated_time_minutes <= 30) {
      reasons.push('Quick study session');
    }

    return reasons.length > 0 ? reasons[0] : 'Recommended for you';
  }

  /**
   * Get fallback recommendations when personalization fails
   */
  private async getFallbackRecommendations(
    userId: string,
    filters: RecommendationFilters
  ): Promise<RecommendedResource[]> {
    try {
      console.log('🔄 Getting fallback recommendations');

      const { data, error } = await supabase
        .from('resources')
        .select(`
          id,
          title,
          description,
          file_name,
          file_path,
          file_size,
          download_count,
          rating_average,
          difficulty_level,
          estimated_time_minutes,
          keywords,
          tags,
          category:resource_categories(name, icon, color),
          subject:subjects(name),
          grade_level:grade_levels(grade_name, grade_number),
          uploader:profiles!resources_uploaded_by_fkey(full_name, role)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .order('rating_average', { ascending: false })
        .order('download_count', { ascending: false })
        .limit(filters.maxRecommendations || 10);

      if (error) {
        console.error('Error getting fallback recommendations:', error);
        return [];
      }

      return (data || []).map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        file_name: resource.file_name,
        file_path: resource.file_path,
        file_size: resource.file_size,
        download_count: resource.download_count,
        rating_average: resource.rating_average,
        difficulty_level: resource.difficulty_level,
        estimated_time_minutes: resource.estimated_time_minutes,
        category: resource.category,
        subject: resource.subject,
        grade_level: resource.grade_level,
        uploader: resource.uploader,
        recommendation_score: resource.rating_average + (resource.download_count * 0.01),
        recommendation_reason: 'Popular resource',
        keywords: resource.keywords || [],
        tags: resource.tags || []
      }));
    } catch (error) {
      console.error('Error in getFallbackRecommendations:', error);
      return [];
    }
  }

  /**
   * Get recommendations for specific subject/topic
   */
  async getSubjectRecommendations(
    userId: string,
    subjectId: string,
    topicId?: string,
    limit: number = 5
  ): Promise<RecommendedResource[]> {
    try {
      let query = supabase
        .from('resources')
        .select(`
          id,
          title,
          description,
          file_name,
          file_path,
          file_size,
          download_count,
          rating_average,
          difficulty_level,
          estimated_time_minutes,
          keywords,
          tags,
          category:resource_categories(name, icon, color),
          subject:subjects(name),
          grade_level:grade_levels(grade_name, grade_number),
          uploader:profiles!resources_uploaded_by_fkey(full_name, role)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .eq('subject_id', subjectId);

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data, error } = await query
        .order('rating_average', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting subject recommendations:', error);
        return [];
      }

      return (data || []).map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        file_name: resource.file_name,
        file_path: resource.file_path,
        file_size: resource.file_size,
        download_count: resource.download_count,
        rating_average: resource.rating_average,
        difficulty_level: resource.difficulty_level,
        estimated_time_minutes: resource.estimated_time_minutes,
        category: resource.category,
        subject: resource.subject,
        grade_level: resource.grade_level,
        uploader: resource.uploader,
        recommendation_score: resource.rating_average,
        recommendation_reason: topicId ? 'Related to current topic' : 'Subject-specific resource',
        keywords: resource.keywords || [],
        tags: resource.tags || []
      }));
    } catch (error) {
      console.error('Error in getSubjectRecommendations:', error);
      return [];
    }
  }

  /**
   * Get trending resources
   */
  async getTrendingResources(limit: number = 10): Promise<RecommendedResource[]> {
    try {
      // Get resources with high recent activity
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('resources')
        .select(`
          id,
          title,
          description,
          file_name,
          file_path,
          file_size,
          download_count,
          rating_average,
          difficulty_level,
          estimated_time_minutes,
          keywords,
          tags,
          category:resource_categories(name, icon, color),
          subject:subjects(name),
          grade_level:grade_levels(grade_name, grade_number),
          uploader:profiles!resources_uploaded_by_fkey(full_name, role)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .gte('created_at', weekAgo.toISOString())
        .order('download_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting trending resources:', error);
        return [];
      }

      return (data || []).map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        file_name: resource.file_name,
        file_path: resource.file_path,
        file_size: resource.file_size,
        download_count: resource.download_count,
        rating_average: resource.rating_average,
        difficulty_level: resource.difficulty_level,
        estimated_time_minutes: resource.estimated_time_minutes,
        category: resource.category,
        subject: resource.subject,
        grade_level: resource.grade_level,
        uploader: resource.uploader,
        recommendation_score: resource.download_count,
        recommendation_reason: 'Trending this week',
        keywords: resource.keywords || [],
        tags: resource.tags || []
      }));
    } catch (error) {
      console.error('Error in getTrendingResources:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private analyzeSubjectPerformance(sessions: any[]): { weak: string[], strong: string[] } {
    const subjectStats: { [key: string]: { total: number, completed: number } } = {};

    sessions.forEach(session => {
      const subjectName = session.subjects?.name;
      if (!subjectName) return;

      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = { total: 0, completed: 0 };
      }

      subjectStats[subjectName].total++;
      if (session.status === 'completed') {
        subjectStats[subjectName].completed++;
      }
    });

    const weak: string[] = [];
    const strong: string[] = [];

    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const completionRate = stats.completed / stats.total;
      if (completionRate < 0.6) {
        weak.push(subject);
      } else if (completionRate > 0.8) {
        strong.push(subject);
      }
    });

    return { weak, strong };
  }

  private inferPreferredDifficulty(gradeLevel: number): string {
    if (gradeLevel <= 4) return 'beginner';
    if (gradeLevel <= 8) return 'intermediate';
    return 'advanced';
  }

  private getSessionPerformanceScore(status: string): number {
    switch (status) {
      case 'completed': return 1.0;
      case 'cancelled': return 0.0;
      default: return 0.5;
    }
  }

  private getDaysSinceUpload(uploadDate: string): number {
    const now = new Date();
    const upload = new Date(uploadDate);
    return Math.floor((now.getTime() - upload.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export const resourceRecommendationService = new ResourceRecommendationService();