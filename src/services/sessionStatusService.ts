import { supabase } from '../lib/supabase';

export type SessionStatus = 
  | 'scheduled'        // Initial state - session is booked
  | 'confirmed'        // Both parties have confirmed attendance  
  | 'reschedule_requested' // Reschedule request submitted
  | 'rescheduled'      // Successfully rescheduled
  | 'cancelled'        // Cancelled (more than 4 hours notice)
  | 'lost'             // Cancelled with less than 4 hours notice
  | 'completed'        // Session finished successfully
  | 'missed'           // Student didn't attend
  | 'no_show_tutor'    // Tutor didn't attend
  | 'pending_approval' // Waiting for admin approval
  | 'disputed'         // Under dispute resolution
  | 'refunded';        // Refunded to student

export interface SessionStatusUpdate {
  lesson_id: string;
  previous_status: SessionStatus;
  new_status: SessionStatus;
  changed_by: string;
  change_reason?: string;
  metadata?: any;
}

export interface SessionStatusHistory {
  id: string;
  lesson_id: string;
  status: SessionStatus;
  previous_status?: SessionStatus;
  changed_by: string;
  changed_at: string;
  change_reason?: string;
  metadata?: any;
  user_name?: string;
}

export const sessionStatusService = {
  // Update session status with tracking
  async updateSessionStatus(update: SessionStatusUpdate): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📊 Updating session status:', update);

      // Start a transaction to update both lesson and create history record
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('detailed_status')
        .eq('id', update.lesson_id)
        .single();

      if (lessonError) {
        return { success: false, error: 'Lesson not found' };
      }

      // Update the lesson status
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          detailed_status: update.new_status,
          last_modified_by: update.changed_by,
          last_modified_at: new Date().toISOString()
        })
        .eq('id', update.lesson_id);

      if (updateError) {
        console.error('❌ Error updating lesson status:', updateError);
        return { success: false, error: updateError.message };
      }

      // Create history record
      const { error: historyError } = await supabase
        .from('session_status_history')
        .insert({
          lesson_id: update.lesson_id,
          status: update.new_status,
          previous_status: update.previous_status,
          changed_by: update.changed_by,
          change_reason: update.change_reason,
          metadata: update.metadata
        });

      if (historyError) {
        console.error('❌ Error creating status history:', historyError);
        // Don't fail the update if history fails
      }

      console.log(`✅ Session status updated: ${update.previous_status} → ${update.new_status}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error updating session status:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Get session status history
  async getSessionStatusHistory(lessonId: string): Promise<SessionStatusHistory[]> {
    try {
      const { data: history, error } = await supabase
        .from('session_status_history')
        .select(`
          *,
          user:profiles!session_status_history_changed_by_fkey(full_name)
        `)
        .eq('lesson_id', lessonId)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching status history:', error);
        return [];
      }

      return (history || []).map((record: any) => ({
        ...record,
        user_name: record.user?.full_name || 'Unknown User'
      }));
    } catch (error) {
      console.error('❌ Unexpected error fetching status history:', error);
      return [];
    }
  },

  // Get sessions by status
  async getSessionsByStatus(
    status: SessionStatus | SessionStatus[], 
    userId?: string,
    userRole?: 'student' | 'tutor' | 'admin'
  ): Promise<any[]> {
    try {
      console.log('🔍 Fetching sessions by status:', { status, userId, userRole });

      let query = supabase
        .from('lessons')
        .select(`
          *,
          student:profiles!lessons_student_id_fkey(id, full_name, email),
          tutor:profiles!lessons_tutor_id_fkey(id, full_name, email),
          subject:subjects(name, category)
        `);

      // Filter by status
      if (Array.isArray(status)) {
        query = query.in('detailed_status', status);
      } else {
        query = query.eq('detailed_status', status);
      }

      // Filter by user role
      if (userId && userRole) {
        if (userRole === 'student') {
          query = query.eq('student_id', userId);
        } else if (userRole === 'tutor') {
          query = query.eq('tutor_id', userId);
        }
        // Admin sees all sessions
      }

      query = query.order('scheduled_at', { ascending: true });

      const { data: sessions, error } = await query;

      if (error) {
        console.error('❌ Error fetching sessions by status:', error);
        return [];
      }

      return sessions || [];
    } catch (error) {
      console.error('❌ Unexpected error fetching sessions by status:', error);
      return [];
    }
  },

  // Get status statistics
  async getStatusStatistics(
    userId?: string, 
    userRole?: 'student' | 'tutor' | 'admin'
  ): Promise<Record<SessionStatus, number>> {
    try {
      let query = supabase
        .from('lessons')
        .select('detailed_status');

      // Filter by user role
      if (userId && userRole) {
        if (userRole === 'student') {
          query = query.eq('student_id', userId);
        } else if (userRole === 'tutor') {
          query = query.eq('tutor_id', userId);
        }
        // Admin sees all sessions
      }

      const { data: sessions, error } = await query;

      if (error) {
        console.error('❌ Error fetching status statistics:', error);
        return {} as Record<SessionStatus, number>;
      }

      // Count sessions by status
      const stats: Record<SessionStatus, number> = {
        scheduled: 0,
        confirmed: 0,
        reschedule_requested: 0,
        rescheduled: 0,
        cancelled: 0,
        lost: 0,
        completed: 0,
        missed: 0,
        no_show_tutor: 0,
        pending_approval: 0,
        disputed: 0,
        refunded: 0
      };

      (sessions || []).forEach((session: any) => {
        const status = session.detailed_status as SessionStatus;
        if (stats.hasOwnProperty(status)) {
          stats[status]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('❌ Unexpected error fetching status statistics:', error);
      return {} as Record<SessionStatus, number>;
    }
  },

  // Mark session as confirmed
  async confirmSession(lessonId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateSessionStatus({
      lesson_id: lessonId,
      previous_status: 'scheduled',
      new_status: 'confirmed',
      changed_by: userId,
      change_reason: 'Session confirmed by user'
    });
  },

  // Mark session as completed
  async completeSession(
    lessonId: string, 
    userId: string, 
    completionNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateSessionStatus({
      lesson_id: lessonId,
      previous_status: 'confirmed',
      new_status: 'completed',
      changed_by: userId,
      change_reason: 'Session completed',
      metadata: { completion_notes: completionNotes }
    });
  },

  // Mark session as missed (student no-show)
  async markAsMissed(
    lessonId: string, 
    reportedBy: string, 
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateSessionStatus({
      lesson_id: lessonId,
      previous_status: 'confirmed',
      new_status: 'missed',
      changed_by: reportedBy,
      change_reason: reason || 'Student did not attend session',
      metadata: { reported_by: reportedBy }
    });
  },

  // Mark session as tutor no-show
  async markTutorNoShow(
    lessonId: string, 
    reportedBy: string, 
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateSessionStatus({
      lesson_id: lessonId,
      previous_status: 'confirmed',
      new_status: 'no_show_tutor',
      changed_by: reportedBy,
      change_reason: reason || 'Tutor did not attend session',
      metadata: { reported_by: reportedBy }
    });
  },

  // Get status display information
  getStatusDisplay(status: SessionStatus): {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
    description: string;
  } {
    const statusConfig = {
      scheduled: {
        label: 'Scheduled',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200',
        icon: '📅',
        description: 'Session is booked and confirmed'
      },
      confirmed: {
        label: 'Confirmed',
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200',
        icon: '✅',
        description: 'Both parties have confirmed attendance'
      },
      reschedule_requested: {
        label: 'Reschedule Requested',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200',
        icon: '🔄',
        description: 'Waiting for reschedule approval'
      },
      rescheduled: {
        label: 'Rescheduled',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50 border-purple-200',
        icon: '📆',
        description: 'Session has been moved to new time'
      },
      cancelled: {
        label: 'Cancelled',
        color: 'text-gray-700',
        bgColor: 'bg-gray-50 border-gray-200',
        icon: '❌',
        description: 'Session cancelled with adequate notice'
      },
      lost: {
        label: 'Lost',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
        icon: '⚠️',
        description: 'Session cancelled within 4 hours - marked as lost'
      },
      completed: {
        label: 'Completed',
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200',
        icon: '🎉',
        description: 'Session finished successfully'
      },
      missed: {
        label: 'Student Missed',
        color: 'text-red-700',  
        bgColor: 'bg-red-50 border-red-200',
        icon: '👻',
        description: 'Student did not attend the session'
      },
      no_show_tutor: {
        label: 'Tutor No-Show',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
        icon: '🚫',
        description: 'Tutor did not attend the session'
      },
      pending_approval: {
        label: 'Pending Approval',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200',
        icon: '⏳',
        description: 'Waiting for administrative approval'
      },
      disputed: {
        label: 'Disputed',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
        icon: '⚡',
        description: 'Session outcome is under dispute'
      },
      refunded: {
        label: 'Refunded',  
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200',
        icon: '💰',
        description: 'Session fee has been refunded'
      }
    };

    return statusConfig[status] || statusConfig.scheduled;
  },

  // Validate status transition
  validateStatusTransition(currentStatus: SessionStatus, newStatus: SessionStatus): {
    valid: boolean;
    reason?: string;
  } {
    const validTransitions: Record<SessionStatus, SessionStatus[]> = {
      scheduled: ['confirmed', 'reschedule_requested', 'cancelled', 'lost', 'missed', 'no_show_tutor'],
      confirmed: ['completed', 'missed', 'no_show_tutor', 'reschedule_requested', 'cancelled', 'lost'],
      reschedule_requested: ['scheduled', 'rescheduled', 'cancelled', 'pending_approval'],
      rescheduled: ['confirmed', 'completed', 'missed', 'no_show_tutor'],
      cancelled: ['refunded'],
      lost: ['refunded', 'disputed'],
      completed: ['disputed'],
      missed: ['disputed', 'refunded'],
      no_show_tutor: ['disputed', 'refunded'],
      pending_approval: ['scheduled', 'cancelled', 'rescheduled'],
      disputed: ['completed', 'refunded', 'cancelled'],
      refunded: [] // Terminal state
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    const valid = allowedTransitions.includes(newStatus);

    return {
      valid,
      reason: valid ? undefined : `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }
};