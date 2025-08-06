import { supabase } from '../lib/supabase';

export interface CancellationResult {
  cancellation_id: string;
  session_lost: boolean;
  loss_id: string | null;
  hours_before: number;
  cancellation_type: string;
}

export interface CancellationWarning {
  will_lose_session: boolean;
  hours_remaining: number;
  warning_message: string;
}

export interface SessionLossStats {
  total_losses: number;
  late_cancellations: number;
  no_shows: number;
  admin_penalties: number;
  recoverable_losses: number;
  financial_impact: number;
}

export const sessionCancellationService = {
  /**
   * Check if cancelling a session will result in session loss
   */
  async checkCancellationWarning(lessonId: string, userId: string): Promise<CancellationWarning | null> {
    try {
      console.log('🔍 Checking cancellation warning for lesson:', lessonId, 'user:', userId);

      const { data, error } = await supabase
        .rpc('will_cancellation_result_in_loss', {
          p_lesson_id: lessonId,
          p_user_id: userId
        });

      if (error) {
        console.error('❌ Error checking cancellation warning:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('✅ Cancellation warning result:', data[0]);
        return data[0];
      }

      return null;
    } catch (error) {
      console.error('❌ Error in checkCancellationWarning:', error);
      throw error;
    }
  },

  /**
   * Cancel a session with automatic loss tracking
   */
  async cancelSessionWithLossTracking(
    lessonId: string,
    cancelledBy: string,
    reason: string,
    isEmergency: boolean = false,
    verifiedBy: string | null = null
  ): Promise<CancellationResult> {
    try {
      console.log('🚫 Cancelling session:', {
        lessonId,
        cancelledBy,
        reason,
        isEmergency,
        verifiedBy
      });

      const { data, error } = await supabase
        .rpc('cancel_session_with_loss_tracking', {
          p_lesson_id: lessonId,
          p_cancelled_by: cancelledBy,
          p_reason: reason,
          p_is_emergency: isEmergency,
          p_verified_by: verifiedBy
        });

      if (error) {
        console.error('❌ Error cancelling session:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const result = data[0];
        console.log('✅ Session cancelled successfully:', result);

        // Create notification for the affected parties
        await this.createCancellationNotifications(lessonId, cancelledBy, result);

        return result;
      }

      throw new Error('No result returned from cancellation function');
    } catch (error) {
      console.error('❌ Error in cancelSessionWithLossTracking:', error);
      throw error;
    }
  },

  /**
   * Get session loss statistics for a user
   */
  async getUserSessionLossStats(userId: string, monthsBack: number = 6): Promise<SessionLossStats | null> {
    try {
      console.log('📊 Getting session loss stats for user:', userId);

      const { data, error } = await supabase
        .rpc('get_user_session_loss_stats', {
          p_user_id: userId,
          p_months_back: monthsBack
        });

      if (error) {
        console.error('❌ Error getting session loss stats:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('✅ Session loss stats:', data[0]);
        return data[0];
      }

      return null;
    } catch (error) {
      console.error('❌ Error in getUserSessionLossStats:', error);
      throw error;
    }
  },

  /**
   * Get all session cancellations for a user
   */
  async getUserCancellations(userId: string): Promise<any[]> {
    try {
      console.log('🔍 Getting cancellations for user:', userId);

      const { data, error } = await supabase
        .from('session_cancellations')
        .select(`
          *,
          lesson:lessons(
            *,
            student_profile:profiles!lessons_student_id_fkey(full_name, email),
            tutor_profile:profiles!lessons_tutor_id_fkey(full_name, email),
            subject:subjects(name)
          )
        `)
        .or(`cancelled_by.eq.${userId},lesson.student_id.eq.${userId},lesson.tutor_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting user cancellations:', error);
        throw error;
      }

      console.log('✅ Found cancellations:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserCancellations:', error);
      throw error;
    }
  },

  /**
   * Get all session losses for a user
   */
  async getUserSessionLosses(userId: string): Promise<any[]> {
    try {
      console.log('🔍 Getting session losses for user:', userId);

      const { data, error } = await supabase
        .from('session_losses')
        .select(`
          *,
          lesson:lessons(
            *,
            tutor_profile:profiles!lessons_tutor_id_fkey(full_name, email),
            subject:subjects(name)
          ),
          cancellation:session_cancellations(*)
        `)
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting session losses:', error);
        throw error;
      }

      console.log('✅ Found session losses:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserSessionLosses:', error);
      throw error;
    }
  },

  /**
   * Admin function to verify emergency cancellation
   */
  async verifyEmergencyCancellation(cancellationId: string, adminId: string, verified: boolean): Promise<boolean> {
    try {
      console.log('🔐 Admin verifying emergency cancellation:', cancellationId, verified);

      const { error } = await supabase
        .from('session_cancellations')
        .update({
          emergency_verified: verified,
          verified_by: verified ? adminId : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', cancellationId)
        .eq('cancellation_type', 'emergency');

      if (error) {
        console.error('❌ Error verifying emergency cancellation:', error);
        throw error;
      }

      // If emergency is verified, update or remove the session loss
      if (verified) {
        await this.removeSessionLossForEmergency(cancellationId);
      }

      console.log('✅ Emergency cancellation verification updated');
      return true;
    } catch (error) {
      console.error('❌ Error in verifyEmergencyCancellation:', error);
      throw error;
    }
  },

  /**
   * Remove session loss for verified emergency cancellation
   */
  async removeSessionLossForEmergency(cancellationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('session_losses')
        .delete()
        .eq('cancellation_id', cancellationId);

      if (error) {
        console.error('❌ Error removing session loss for emergency:', error);
        throw error;
      }

      console.log('✅ Session loss removed for verified emergency');
    } catch (error) {
      console.error('❌ Error in removeSessionLossForEmergency:', error);
      throw error;
    }
  },

  /**
   * Create notifications for session cancellation
   */
  async createCancellationNotifications(lessonId: string, cancelledBy: string, result: CancellationResult): Promise<void> {
    try {
      // Get lesson details to determine affected parties
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          student_profile:profiles!lessons_student_id_fkey(full_name, email),
          tutor_profile:profiles!lessons_tutor_id_fkey(full_name, email),
          subject:subjects(name)
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError || !lesson) {
        console.error('❌ Error getting lesson for notifications:', lessonError);
        return;
      }

      // Determine notification recipients
      const recipients = [];
      if (lesson.student_id !== cancelledBy) {
        recipients.push(lesson.student_id);
      }
      if (lesson.tutor_id !== cancelledBy) {
        recipients.push(lesson.tutor_id);
      }

      // Create notifications for affected parties
      const notifications = recipients.map(recipientId => ({
        user_id: recipientId,
        title: 'Session Cancelled',
        message: `Your session on ${new Date(lesson.scheduled_at).toLocaleDateString()} has been cancelled.${
          result.session_lost ? ' This cancellation resulted in session loss due to short notice.' : ''
        }`,
        type: result.session_lost ? 'session_loss' : 'session_cancelled',
        related_id: lessonId,
        metadata: {
          cancellation_type: result.cancellation_type,
          session_lost: result.session_lost,
          hours_before: result.hours_before
        }
      }));

      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('❌ Error creating cancellation notifications:', notificationError);
        } else {
          console.log('✅ Created cancellation notifications:', notifications.length);
        }
      }
    } catch (error) {
      console.error('❌ Error in createCancellationNotifications:', error);
    }
  }
};