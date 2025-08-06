import { useCallback } from 'react';
import { emailService, EmailTemplate } from '../services/emailService';
import { handleError } from '../utils/errorHandler';
import { supabase } from '../lib/supabase';

export interface SessionBookingData {
  sessionId: string;
  studentEmail: string;
  tutorEmail: string;
  subject: string;
  scheduledAt: string;
  duration: number;
  studentName: string;
  tutorName: string;
  notes?: string;
}

export interface UserRegistrationData {
  userEmail: string;
  userName: string;
  userRole: string;
}

export interface ResourceAssignmentData {
  studentEmail: string;
  resourceTitle: string;
  assignmentType: string;
  sessionSubject: string;
  sessionDate: string;
  tutorName: string;
  isRequired: boolean;
  notes?: string;
}

export interface RescheduleRequestData {
  recipientEmail: string;
  recipientType: 'student' | 'tutor';
  sessionSubject: string;
  originalDate: string;
  requestedDate: string;
  reason: string;
  requesterName: string;
}

export const useEmailNotifications = () => {
  /**
   * Send welcome email to new users
   */
  const sendWelcomeEmail = useCallback(async (userData: UserRegistrationData) => {
    try {
      await emailService.sendWelcomeEmail(
        userData.userEmail,
        userData.userName,
        userData.userRole
      );
      console.log('Welcome email sent successfully');
    } catch (error) {
      handleError(error, {
        operation: 'sendWelcomeEmail',
        userEmail: userData.userEmail
      });
    }
  }, []);

  /**
   * Send session booking confirmation emails
   */
  const sendSessionBookingEmails = useCallback(async (sessionData: SessionBookingData) => {
    try {
      await emailService.sendSessionBookedEmail(
        sessionData.studentEmail,
        sessionData.tutorEmail,
        {
          subject: sessionData.subject,
          scheduledAt: sessionData.scheduledAt,
          duration: sessionData.duration,
          studentName: sessionData.studentName,
          tutorName: sessionData.tutorName,
          notes: sessionData.notes
        }
      );
      console.log('Session booking emails sent successfully');
    } catch (error) {
      handleError(error, {
        operation: 'sendSessionBookingEmails',
        sessionId: sessionData.sessionId
      });
    }
  }, []);

  /**
   * Send session reminder emails (24 hours before)
   */
  const sendSessionReminders = useCallback(async (sessionData: SessionBookingData & { meetingLink?: string }) => {
    try {
      // Send reminder to student
      await emailService.sendSessionReminder(
        sessionData.studentEmail,
        'student',
        {
          subject: sessionData.subject,
          scheduledAt: sessionData.scheduledAt,
          duration: sessionData.duration,
          studentName: sessionData.studentName,
          tutorName: sessionData.tutorName,
          meetingLink: sessionData.meetingLink
        }
      );

      // Send reminder to tutor
      await emailService.sendSessionReminder(
        sessionData.tutorEmail,
        'tutor',
        {
          subject: sessionData.subject,
          scheduledAt: sessionData.scheduledAt,
          duration: sessionData.duration,
          studentName: sessionData.studentName,
          tutorName: sessionData.tutorName,
          meetingLink: sessionData.meetingLink
        }
      );

      console.log('Session reminder emails sent successfully');
    } catch (error) {
      handleError(error, {
        operation: 'sendSessionReminders',
        sessionId: sessionData.sessionId
      });
    }
  }, []);

  /**
   * Send resource assignment notification
   */
  const sendResourceAssignmentEmail = useCallback(async (resourceData: ResourceAssignmentData) => {
    try {
      await emailService.sendResourceAssignedEmail(
        resourceData.studentEmail,
        resourceData
      );
      console.log('Resource assignment email sent successfully');
    } catch (error) {
      handleError(error, {
        operation: 'sendResourceAssignmentEmail',
        studentEmail: resourceData.studentEmail,
        resourceTitle: resourceData.resourceTitle
      });
    }
  }, []);

  /**
   * Send reschedule request notification
   */
  const sendRescheduleRequestEmail = useCallback(async (rescheduleData: RescheduleRequestData) => {
    try {
      await emailService.sendRescheduleRequestEmail(
        rescheduleData.recipientEmail,
        rescheduleData.recipientType,
        rescheduleData
      );
      console.log('Reschedule request email sent successfully');
    } catch (error) {
      handleError(error, {
        operation: 'sendRescheduleRequestEmail',
        recipientEmail: rescheduleData.recipientEmail
      });
    }
  }, []);

  /**
   * Check user's email preferences before sending
   */
  const checkEmailPreferences = useCallback(async (
    userId: string,
    notificationType: 'session_reminders' | 'session_confirmations' | 'reschedule_notifications' | 'resource_assignments'
  ): Promise<boolean> => {
    try {
      const { data: preferences, error } = await supabase
        .from('email_preferences')
        .select(`email_notifications_enabled, ${notificationType}`)
        .eq('user_id', userId)
        .single();

      if (error || !preferences) {
        // If no preferences found, default to enabled
        return true;
      }

      return preferences.email_notifications_enabled && preferences[notificationType];
    } catch (error) {
      console.error('Error checking email preferences:', error);
      // Default to enabled if we can't check preferences
      return true;
    }
  }, []);

  /**
   * Send session booking emails with preference checking
   */
  const sendSessionBookingEmailsWithPreferences = useCallback(async (
    sessionData: SessionBookingData,
    studentId: string,
    tutorId: string
  ) => {
    try {
      // Check student preferences
      const studentCanReceive = await checkEmailPreferences(studentId, 'session_confirmations');
      // Check tutor preferences  
      const tutorCanReceive = await checkEmailPreferences(tutorId, 'session_confirmations');

      if (studentCanReceive || tutorCanReceive) {
        // Only send to those who have enabled notifications
        const modifiedSessionData = {
          ...sessionData,
          studentEmail: studentCanReceive ? sessionData.studentEmail : '',
          tutorEmail: tutorCanReceive ? sessionData.tutorEmail : ''
        };

        if (modifiedSessionData.studentEmail || modifiedSessionData.tutorEmail) {
          await sendSessionBookingEmails(modifiedSessionData);
        }
      }
    } catch (error) {
      handleError(error, {
        operation: 'sendSessionBookingEmailsWithPreferences',
        sessionId: sessionData.sessionId
      });
    }
  }, [sendSessionBookingEmails, checkEmailPreferences]);

  /**
   * Send resource assignment email with preference checking
   */
  const sendResourceAssignmentEmailWithPreferences = useCallback(async (
    resourceData: ResourceAssignmentData,
    studentId: string
  ) => {
    try {
      const canReceive = await checkEmailPreferences(studentId, 'resource_assignments');
      
      if (canReceive) {
        await sendResourceAssignmentEmail(resourceData);
      }
    } catch (error) {
      handleError(error, {
        operation: 'sendResourceAssignmentEmailWithPreferences',
        studentEmail: resourceData.studentEmail
      });
    }
  }, [sendResourceAssignmentEmail, checkEmailPreferences]);

  /**
   * Schedule session reminder emails
   */
  const scheduleSessionReminders = useCallback(async (sessionData: SessionBookingData & { meetingLink?: string }) => {
    try {
      // Calculate reminder time (24 hours before session)
      const sessionTime = new Date(sessionData.scheduledAt);
      const reminderTime = new Date(sessionTime.getTime() - 24 * 60 * 60 * 1000);

      // Only schedule if reminder time is in the future
      if (reminderTime > new Date()) {
        // In a real implementation, you would queue these emails
        // For now, we'll log that they should be scheduled
        console.log(`Session reminder scheduled for ${reminderTime.toISOString()}`);
        
        // You could integrate with a job queue like Bull, Agenda, or use Supabase Edge Functions
        // For now, we'll store in email_queue table
        await supabase.from('email_queue').insert([
          {
            to_email: sessionData.studentEmail,
            template_type: EmailTemplate.SESSION_REMINDER,
            template_data: {
              recipientType: 'student',
              subject: sessionData.subject,
              scheduledAt: sessionData.scheduledAt,
              duration: sessionData.duration,
              studentName: sessionData.studentName,
              tutorName: sessionData.tutorName,
              meetingLink: sessionData.meetingLink
            },
            scheduled_at: reminderTime.toISOString(),
            priority: 'normal'
          },
          {
            to_email: sessionData.tutorEmail,
            template_type: EmailTemplate.SESSION_REMINDER,
            template_data: {
              recipientType: 'tutor',
              subject: sessionData.subject,
              scheduledAt: sessionData.scheduledAt,
              duration: sessionData.duration,
              studentName: sessionData.studentName,
              tutorName: sessionData.tutorName,
              meetingLink: sessionData.meetingLink
            },
            scheduled_at: reminderTime.toISOString(),
            priority: 'normal'
          }
        ]);
      }
    } catch (error) {
      handleError(error, {
        operation: 'scheduleSessionReminders',
        sessionId: sessionData.sessionId
      });
    }
  }, []);

  return {
    sendWelcomeEmail,
    sendSessionBookingEmails,
    sendSessionReminders,
    sendResourceAssignmentEmail,
    sendRescheduleRequestEmail,
    sendSessionBookingEmailsWithPreferences,
    sendResourceAssignmentEmailWithPreferences,
    scheduleSessionReminders,
    checkEmailPreferences
  };
};

export default useEmailNotifications;