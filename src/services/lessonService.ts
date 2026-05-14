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
  lesson_plan?: {
    topic: string;
    subtopic: string;
    student_preparation: string;
    tutor_notes: string;
  } | null;
}

export const lessonService = {
  // Get lessons for a specific user
  async getUserLessons(userId: string, userRole: 'student' | 'tutor' | 'admin'): Promise<LessonWithDetails[]> {
    console.log('🔍 Fetching lessons for user:', userId, userRole);
    
    try {
      // First, get the student/tutor ID if needed
      let studentId: string | null = null;
      let tutorId: string | null = null;

      if (userRole === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single();
        studentId = student?.id;
      } else if (userRole === 'tutor') {
        const { data: tutor } = await supabase
          .from('tutors')
          .select('id')
          .eq('user_id', userId)
          .single();
        tutorId = tutor?.id;
      }

      let query = supabase.from('lessons').select(`
        *,
        subjects(name),
        topics(name),
        lesson_plans(topic, subtopic, student_preparation, tutor_notes)
      `);

      // Filter based on user role
      if (userRole === 'student' && studentId) {
        query = query.eq('student_id', studentId);
      } else if (userRole === 'tutor' && tutorId) {
        query = query.eq('tutor_id', tutorId);
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

      // Get all unique student and tutor IDs
      const lessonStudentIds = Array.from(new Set(lessons.map((l: any) => l.student_id).filter(Boolean)));
      const lessonTutorIds = Array.from(new Set(lessons.map((l: any) => l.tutor_id).filter(Boolean)));

      // Fetch student profiles
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, profiles!inner(id, full_name)')
        .in('id', lessonStudentIds);

      // Fetch tutor profiles
      const { data: tutors } = await supabase
        .from('tutors')
        .select('id, user_id, profiles!inner(id, full_name)')
        .in('id', lessonTutorIds);

      // Transform lessons with profile names from joined data
      const transformedLessons = lessons.map((lesson: any) => {
        const student = students?.find((s: any) => s.id === lesson.student_id);
        const tutor = tutors?.find((t: any) => t.id === lesson.tutor_id);

        const plan = Array.isArray(lesson.lesson_plans) ? lesson.lesson_plans[0] : lesson.lesson_plans;
        return {
          ...lesson,
          student_name: student?.profiles?.full_name || 'Unknown Student',
          tutor_name: tutor?.profiles?.full_name || 'Unknown Tutor',
          subject_name: lesson.subjects?.name || 'Unknown Subject',
          topic_name: plan?.topic || lesson.topics?.name || undefined,
          lesson_plan: plan ? {
            topic: plan.topic || '',
            subtopic: plan.subtopic || '',
            student_preparation: plan.student_preparation || '',
            tutor_notes: plan.tutor_notes || '',
          } : null,
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

      // First, get the student/tutor ID if needed
      let studentId: string | null = null;
      let tutorId: string | null = null;

      if (userRole === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single();
        studentId = student?.id;
      } else if (userRole === 'tutor') {
        const { data: tutor } = await supabase
          .from('tutors')
          .select('id')
          .eq('user_id', userId)
          .single();
        tutorId = tutor?.id;
      }

      let query = supabase.from('lessons').select(`
        *,
        subjects(name),
        topics(name),
        lesson_plans(topic, subtopic, student_preparation, tutor_notes)
      `);

      // Filter based on user role
      if (userRole === 'student' && studentId) {
        query = query.eq('student_id', studentId);
      } else if (userRole === 'tutor' && tutorId) {
        query = query.eq('tutor_id', tutorId);
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

      // Get all unique student and tutor IDs
      const lessonStudentIds = Array.from(new Set(lessons.map((l: any) => l.student_id).filter(Boolean)));
      const lessonTutorIds = Array.from(new Set(lessons.map((l: any) => l.tutor_id).filter(Boolean)));

      // Fetch student profiles
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, profiles!inner(id, full_name)')
        .in('id', lessonStudentIds);

      // Fetch tutor profiles
      const { data: tutors } = await supabase
        .from('tutors')
        .select('id, user_id, profiles!inner(id, full_name)')
        .in('id', lessonTutorIds);

      // Transform lessons with profile names
      const transformedLessons = lessons.map((lesson: any) => {
        const student = students?.find((s: any) => s.id === lesson.student_id);
        const tutor = tutors?.find((t: any) => t.id === lesson.tutor_id);

        const plan = Array.isArray(lesson.lesson_plans) ? lesson.lesson_plans[0] : lesson.lesson_plans;
        return {
          ...lesson,
          student_name: student?.profiles?.full_name || 'Unknown Student',
          tutor_name: tutor?.profiles?.full_name || 'Unknown Tutor',
          subject_name: lesson.subjects?.name || 'Unknown Subject',
          topic_name: plan?.topic || lesson.topics?.name || undefined,
          lesson_plan: plan ? {
            topic: plan.topic || '',
            subtopic: plan.subtopic || '',
            student_preparation: plan.student_preparation || '',
            tutor_notes: plan.tutor_notes || '',
          } : null,
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