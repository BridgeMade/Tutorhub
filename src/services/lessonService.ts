import { supabase } from '../lib/supabase';
import { TutoringSession } from '../types';

export interface Lesson {
  id: string;
  student_id: string;
  tutor_id: string;
  subject_id: string;
  topic_id?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  detailed_status?: string; // More granular status from our session management system
  lesson_type: 'regular' | 'mock_exam' | 'assessment';
  notes?: string;
  last_modified_by?: string;
  last_modified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonWithDetails extends Lesson {
  student_name?: string;
  tutor_name?: string;
  subject_name?: string;
  topic_name?: string;
}

export const lessonService = {
  // Get lessons for a specific user
  async getUserLessons(userId: string, userRole: 'student' | 'tutor' | 'admin'): Promise<LessonWithDetails[]> {
    console.log('🔍 Fetching lessons for user:', userId, userRole);
    
    try {
      let query = supabase.from('lessons').select(`
        *,
        subjects(name),
        topics(name),
        student:profiles!lessons_student_id_fkey(id, full_name),
        tutor:profiles!lessons_tutor_id_fkey(id, full_name)
      `);

      // Filter based on user role
      if (userRole === 'student') {
        query = query.eq('student_id', userId);
      } else if (userRole === 'tutor') {
        query = query.eq('tutor_id', userId);
      }
      // Admin can see all lessons (no filter)

      query = query.order('scheduled_at', { ascending: true });

      const { data: lessons, error } = await query;

      if (error) {
        console.error('❌ Error fetching lessons:', error);
        return [];
      }

      if (!lessons || lessons.length === 0) {
        console.log('🔍 No lessons found for user');
        return [];
      }

      // Transform lessons with profile names from joined data
      const transformedLessons = lessons.map((lesson: any) => {
        const studentProfile = lesson.student;
        const tutorProfile = lesson.tutor;

        return {
          ...lesson,
          student_name: studentProfile?.full_name || 'Unknown Student',
          tutor_name: tutorProfile?.full_name || 'Unknown Tutor',
          subject_name: lesson.subjects?.name || 'Unknown Subject',
          topic_name: lesson.topics?.name || undefined
        };
      });

      console.log('🔍 Found lessons:', transformedLessons.length);
      return transformedLessons;

    } catch (error) {
      console.error('❌ Unexpected error fetching lessons:', error);
      return [];
    }
  },

  // Get upcoming lessons
  async getUpcomingLessons(userId: string, userRole: 'student' | 'tutor' | 'admin', limit: number = 10): Promise<LessonWithDetails[]> {
    console.log('🔍 Fetching upcoming lessons for user:', userId, userRole);
    
    try {
      const now = new Date().toISOString();
      
      let query = supabase.from('lessons').select(`
        *,
        subjects(name),
        topics(name)
      `);

      // Filter based on user role
      if (userRole === 'student') {
        query = query.eq('student_id', userId);
      } else if (userRole === 'tutor') {
        query = query.eq('tutor_id', userId);
      }

      query = query
        .gte('scheduled_at', now)
        .in('status', ['scheduled', 'confirmed'])
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      const { data: lessons, error } = await query;

      if (error) {
        console.error('❌ Error fetching upcoming lessons:', error);
        return [];
      }

      if (!lessons || lessons.length === 0) {
        console.log('🔍 No upcoming lessons found');
        return [];
      }

      // Get profile information for names
      const studentIds = Array.from(new Set(lessons.map((l: any) => l.student_id)));
      const tutorIds = Array.from(new Set(lessons.map((l: any) => l.tutor_id)));
      const allProfileIds = Array.from(new Set([...studentIds, ...tutorIds]));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', allProfileIds);

      // Transform lessons with profile names
      const transformedLessons = lessons.map((lesson: any) => {
        const studentProfile = profiles?.find((p: any) => p.id === lesson.student_id);
        const tutorProfile = profiles?.find((p: any) => p.id === lesson.tutor_id);

        return {
          ...lesson,
          student_name: studentProfile?.full_name || 'Unknown Student',
          tutor_name: tutorProfile?.full_name || 'Unknown Tutor',
          subject_name: lesson.subjects?.name || 'Unknown Subject',
          topic_name: lesson.topics?.name || undefined
        };
      });

      console.log('🔍 Found upcoming lessons:', transformedLessons.length);
      return transformedLessons;

    } catch (error) {
      console.error('❌ Unexpected error fetching upcoming lessons:', error);
      return [];
    }
  },

  // Create a new lesson
  async createLesson(lessonData: Partial<Lesson>): Promise<Lesson | null> {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson:', error);
      return null;
    }

    return data;
  },

  // Update lesson
  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<Lesson | null> {
    const { data, error } = await supabase
      .from('lessons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson:', error);
      return null;
    }

    return data;
  },

  // Cancel lesson with loss tracking
  async cancelLesson(lessonId: string, userId: string, reason: string, isEmergency: boolean = false): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('cancel_session_with_loss_tracking', {
          p_lesson_id: lessonId,
          p_cancelled_by: userId,
          p_reason: reason,
          p_is_emergency: isEmergency,
          p_verified_by: null
        });

      if (error) {
        console.error('Error cancelling lesson:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error in cancelLesson:', error);
      throw error;
    }
  },

  // Get lesson statistics
  async getLessonStats(userId: string, userRole: 'student' | 'tutor' | 'admin') {
    console.log('🔍 Calculating lesson stats for user:', userId, userRole);
    
    try {
      const lessons = await this.getUserLessons(userId, userRole);
      
      if (!lessons || lessons.length === 0) {
        console.log('🔍 No lessons found for stats calculation');
        return {
          totalSessions: 0,
          completedSessions: 0,
          upcomingSessions: 0,
          avgRating: 0
        };
      }

      const now = new Date();
      const totalSessions = lessons.length;
      const completedSessions = lessons.filter(l => l.status === 'completed').length;
      const upcomingSessions = lessons.filter(l => 
        new Date(l.scheduled_at) > now && 
        ['scheduled', 'confirmed'].includes(l.status)
      ).length;

      console.log('🔍 Calculated stats:', { totalSessions, completedSessions, upcomingSessions });
      
      return {
        totalSessions,
        completedSessions,
        upcomingSessions,
        avgRating: 4.5 // Default rating
      };
    } catch (error) {
      console.error('❌ Error calculating lesson stats:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        avgRating: 0
      };
    }
  },

  // Convert database lesson to our TutoringSession type
  lessonToSession(lesson: LessonWithDetails): TutoringSession {
    return {
      id: lesson.id,
      studentId: lesson.student_id,
      tutorId: lesson.tutor_id,
      subject: lesson.subject_name || 'Unknown Subject',
      scheduledAt: new Date(lesson.scheduled_at),
      duration: lesson.duration_minutes,
      status: lesson.status as TutoringSession['status'],
      notes: lesson.notes,
      createdAt: new Date(lesson.created_at),
      updatedAt: new Date(lesson.updated_at)
    };
  },

  // Get lessons in calendar format
  async getLessonsForCalendar(userId: string, userRole: 'student' | 'tutor' | 'admin'): Promise<TutoringSession[]> {
    console.log('🔍 Getting lessons for calendar for user:', userId, userRole);
    
    try {
      const lessons = await this.getUserLessons(userId, userRole);
      
      if (!lessons || lessons.length === 0) {
        console.log('🔍 No lessons found for calendar');
        return [];
      }

      // Convert lessons to TutoringSession format for calendar
      const sessions = lessons.map(lesson => this.lessonToSession(lesson));
      
      console.log('🔍 Converted lessons to sessions for calendar:', sessions.length);
      return sessions;
    } catch (error) {
      console.error('❌ Error getting lessons for calendar:', error);
      return [];
    }
  }
};