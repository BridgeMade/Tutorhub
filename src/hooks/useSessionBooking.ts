import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandler';
import { useEmailNotifications } from './useEmailNotifications';

export interface SessionBookingData {
  studentId: string;
  tutorId: string;
  subjectId: string;
  scheduledAt: Date;
  duration: number;
  notes?: string;
  sessionType?: 'one-time' | 'recurring';
}

export interface BookingResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export const useSessionBooking = () => {
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  const {
    sendSessionBookingEmailsWithPreferences,
    scheduleSessionReminders
  } = useEmailNotifications();

  const bookSession = useCallback(async (bookingData: SessionBookingData): Promise<BookingResult> => {
    setIsBooking(true);
    setBookingError(null);

    try {
      // Get student and tutor details for email notifications
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', [bookingData.studentId, bookingData.tutorId]);

      if (profilesError) {
        throw new Error('Failed to load user profiles');
      }

      const student = profiles?.find((p: any) => p.id === bookingData.studentId);
      const tutor = profiles?.find((p: any) => p.id === bookingData.tutorId);

      if (!student || !tutor) {
        throw new Error('Student or tutor profile not found');
      }

      // Get subject details
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', bookingData.subjectId)
        .single();

      if (subjectError) {
        throw new Error('Failed to load subject details');
      }

      // Create the session
      const { data: session, error: sessionError } = await supabase
        .from('lessons')
        .insert({
          student_id: bookingData.studentId,
          tutor_id: bookingData.tutorId,
          subject_id: bookingData.subjectId,
          scheduled_at: bookingData.scheduledAt.toISOString(),
          duration_minutes: bookingData.duration,
          notes: bookingData.notes,
          status: 'scheduled',
          detailed_status: 'scheduled',
          created_by: bookingData.studentId,
          last_modified_by: bookingData.studentId
        })
        .select('id')
        .single();

      if (sessionError) {
        throw new Error('Failed to create session: ' + sessionError.message);
      }

      // Prepare email notification data
      const emailData = {
        sessionId: session.id,
        studentEmail: student.email,
        tutorEmail: tutor.email,
        subject: subject.name,
        scheduledAt: bookingData.scheduledAt.toISOString(),
        duration: bookingData.duration,
        studentName: student.full_name,
        tutorName: tutor.full_name,
        notes: bookingData.notes
      };

      // Send booking confirmation emails (with preference checking)
      try {
        await sendSessionBookingEmailsWithPreferences(
          emailData,
          bookingData.studentId,
          bookingData.tutorId
        );
      } catch (emailError) {
        console.warn('Failed to send booking confirmation emails:', emailError);
        // Don't fail the booking if email fails
      }

      // Schedule reminder emails (24 hours before)
      try {
        await scheduleSessionReminders(emailData);
      } catch (reminderError) {
        console.warn('Failed to schedule reminder emails:', reminderError);
        // Don't fail the booking if reminder scheduling fails
      }

      // Create notification records (in-app notifications)
      try {
        await Promise.all([
          // Notification to student
          supabase.from('notification_queue').insert({
            user_id: bookingData.studentId,
            template_key: 'session_booked_student',
            variables: {
              subject: subject.name,
              tutor_name: tutor.full_name,
              session_date: bookingData.scheduledAt.toLocaleDateString(),
              session_time: bookingData.scheduledAt.toLocaleTimeString()
            },
            priority: 'medium',
            delivery_method: 'in_app'
          }),
          // Notification to tutor
          supabase.from('notification_queue').insert({
            user_id: bookingData.tutorId,
            template_key: 'session_booked_tutor',
            variables: {
              subject: subject.name,
              student_name: student.full_name,
              session_date: bookingData.scheduledAt.toLocaleDateString(),
              session_time: bookingData.scheduledAt.toLocaleTimeString()
            },
            priority: 'medium',
            delivery_method: 'in_app'
          })
        ]);
      } catch (notificationError) {
        console.warn('Failed to create in-app notifications:', notificationError);
        // Don't fail the booking if notifications fail
      }

      return {
        success: true,
        sessionId: session.id
      };

    } catch (error) {
      const appError = handleError(error, {
        operation: 'bookSession',
        studentId: bookingData.studentId,
        tutorId: bookingData.tutorId,
        subjectId: bookingData.subjectId
      });

      setBookingError(appError.userMessage);
      return {
        success: false,
        error: appError.userMessage
      };
    } finally {
      setIsBooking(false);
    }
  }, [sendSessionBookingEmailsWithPreferences, scheduleSessionReminders]);

  const cancelSession = useCallback(async (
    sessionId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsBooking(true);
    setBookingError(null);

    try {
      // Get session details first
      const { data: session, error: sessionError } = await supabase
        .from('lessons')
        .select(`
          *,
          student:profiles!lessons_student_id_fkey(id, full_name, email),
          tutor:profiles!lessons_tutor_id_fkey(id, full_name, email),
          subject:subjects(name)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      // Calculate if cancellation is within 4 hours
      const sessionDate = new Date(session.scheduled_at);
      const hoursUntil = (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60);
      const isLateCancel = hoursUntil <= 4;

      // Update session status
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          status: 'cancelled',
          detailed_status: isLateCancel ? 'lost' : 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        throw new Error('Failed to cancel session: ' + updateError.message);
      }

      // Send cancellation email notifications
      try {
        const emailData = {
          sessionId,
          studentEmail: session.student.email,
          tutorEmail: session.tutor.email,
          subject: session.subject.name,
          scheduledAt: session.scheduled_at,
          duration: session.duration_minutes,
          studentName: session.student.full_name,
          tutorName: session.tutor.full_name,
          cancellationReason: reason || 'No reason provided',
          isLateCancel
        };

        // Send to both parties
        await Promise.all([
          supabase.from('email_queue').insert({
            to_email: session.student.email,
            template_type: 'SESSION_CANCELLED',
            template_data: {
              ...emailData,
              recipientType: 'student',
              recipientName: session.student.full_name
            },
            priority: 'high',
            user_id: session.student_id
          }),
          supabase.from('email_queue').insert({
            to_email: session.tutor.email,
            template_type: 'SESSION_CANCELLED',
            template_data: {
              ...emailData,
              recipientType: 'tutor',
              recipientName: session.tutor.full_name
            },
            priority: 'high',
            user_id: session.tutor_id
          })
        ]);
      } catch (emailError) {
        console.warn('Failed to send cancellation emails:', emailError);
      }

      return { success: true };

    } catch (error) {
      const appError = handleError(error, {
        operation: 'cancelSession',
        sessionId
      });

      setBookingError(appError.userMessage);
      return {
        success: false,
        error: appError.userMessage
      };
    } finally {
      setIsBooking(false);
    }
  }, []);

  const rescheduleSession = useCallback(async (
    sessionId: string,
    newDate: Date,
    newDuration?: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsBooking(true);
    setBookingError(null);

    try {
      // Get session details first
      const { data: session, error: sessionError } = await supabase
        .from('lessons')
        .select(`
          *,
          student:profiles!lessons_student_id_fkey(id, full_name, email),
          tutor:profiles!lessons_tutor_id_fkey(id, full_name, email),
          subject:subjects(name)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      const oldDate = session.scheduled_at;
      const oldDuration = session.duration_minutes;

      // Update session
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          scheduled_at: newDate.toISOString(),
          duration_minutes: newDuration || session.duration_minutes,
          detailed_status: 'rescheduled',
          reschedule_reason: reason
        })
        .eq('id', sessionId);

      if (updateError) {
        throw new Error('Failed to reschedule session: ' + updateError.message);
      }

      // Send reschedule confirmation emails
      try {
        const emailData = {
          sessionId,
          studentEmail: session.student.email,
          tutorEmail: session.tutor.email,
          subject: session.subject.name,
          scheduledAt: newDate.toISOString(),
          duration: newDuration || session.duration_minutes,
          studentName: session.student.full_name,
          tutorName: session.tutor.full_name,
          oldDate,
          oldDuration,
          rescheduleReason: reason || 'No reason provided'
        };

        // Send to both parties
        await Promise.all([
          supabase.from('email_queue').insert({
            to_email: session.student.email,
            template_type: 'SESSION_RESCHEDULED',
            template_data: {
              ...emailData,
              recipientType: 'student',
              recipientName: session.student.full_name
            },
            priority: 'high',
            user_id: session.student_id
          }),
          supabase.from('email_queue').insert({
            to_email: session.tutor.email,
            template_type: 'SESSION_RESCHEDULED',
            template_data: {
              ...emailData,
              recipientType: 'tutor',
              recipientName: session.tutor.full_name
            },
            priority: 'high',
            user_id: session.tutor_id
          })
        ]);

        // Schedule new reminder emails
        await scheduleSessionReminders(emailData);
      } catch (emailError) {
        console.warn('Failed to send reschedule emails:', emailError);
      }

      return { success: true };

    } catch (error) {
      const appError = handleError(error, {
        operation: 'rescheduleSession',
        sessionId
      });

      setBookingError(appError.userMessage);
      return {
        success: false,
        error: appError.userMessage
      };
    } finally {
      setIsBooking(false);
    }
  }, [scheduleSessionReminders]);

  const clearError = useCallback(() => {
    setBookingError(null);
  }, []);

  return {
    bookSession,
    cancelSession,
    rescheduleSession,
    isBooking,
    bookingError,
    clearError
  };
};

export default useSessionBooking;