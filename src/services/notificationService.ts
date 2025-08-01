import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  title: string;
  message: string;
  notification_type: 'reschedule_request' | 'reschedule_approved' | 'reschedule_declined' | 
                    'counter_proposal' | 'counter_proposal_response' | 'admin_escalation' |
                    'session_reminder' | 'session_cancelled' | 'session_confirmed' |
                    'message_received' | 'assignment_created' | 'payment_reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  related_lesson_id?: string;
  related_request_id?: string;
  related_message_id?: string;
  is_read: boolean;
  read_at?: string;
  in_app_sent: boolean;
  in_app_sent_at?: string;
  email_sent: boolean;
  email_sent_at?: string;
  email_address?: string;
  action_buttons?: ActionButton[];
  expires_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ActionButton {
  id: string;
  label: string;
  action: string;
  style: 'primary' | 'secondary' | 'danger';
  data?: any;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  in_app_enabled: boolean;
  in_app_sound: boolean;
  email_enabled: boolean;
  email_address?: string;
  reschedule_notifications: boolean;
  message_notifications: boolean;
  reminder_notifications: boolean;
  admin_notifications: boolean;
  email_digest_frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  template_key: string;
  notification_type: string;
  title_template: string;
  message_template: string;
  email_subject_template?: string;
  email_body_template?: string;
  variables: string[];
  default_priority: string;
  requires_action: boolean;
  auto_expire_hours: number;
}

export const notificationService = {
  // Create a notification from template
  async createNotification(data: {
    templateKey: string;
    recipientId: string;
    senderId?: string;
    variables: Record<string, string>;
    relatedLessonId?: string;
    relatedRequestId?: string;
    relatedMessageId?: string;
    actionButtons?: ActionButton[];
    customPriority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      console.log('📧 Creating notification from template:', data.templateKey);

      // Get the template
      const { data: template, error: templateError } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('template_key', data.templateKey)
        .single();

      if (templateError || !template) {
        return { success: false, error: 'Notification template not found' };
      }

      // Replace template variables
      let title = template.title_template;
      let message = template.message_template;
      
      Object.entries(data.variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        title = title.replace(new RegExp(placeholder, 'g'), value);
        message = message.replace(new RegExp(placeholder, 'g'), value);
      });

      // Get user preferences
      const preferences = await this.getUserPreferences(data.recipientId);
      
      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + template.auto_expire_hours);

      // Create the notification
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: data.recipientId,
          sender_id: data.senderId,
          title,
          message,
          notification_type: template.notification_type,
          priority: data.customPriority || template.default_priority,
          related_lesson_id: data.relatedLessonId,
          related_request_id: data.relatedRequestId,
          related_message_id: data.relatedMessageId,
          action_buttons: data.actionButtons,
          expires_at: expiresAt.toISOString(),
          email_address: preferences?.email_address,
          metadata: { template_key: data.templateKey, variables: data.variables }
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating notification:', error);
        return { success: false, error: error.message };
      }

      // Send in-app notification immediately
      await this.sendInAppNotification(notification.id);

      // Send email if enabled and appropriate
      if (preferences?.email_enabled && preferences?.email_digest_frequency === 'instant') {
        await this.sendEmailNotification(notification.id, template, data.variables);
      }

      console.log('✅ Notification created successfully');
      return { success: true, notification };
    } catch (error) {
      console.error('❌ Unexpected error creating notification:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Send reschedule request notification
  async notifyRescheduleRequest(data: {
    requestId: string;
    lessonId: string;
    requesterId: string;
    recipientId: string;
    requesterName: string;
    recipientName: string;
    subject: string;
    requestType: 'reschedule' | 'cancel';
    originalDate: string;
    proposedDate?: string;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const actionButtons: ActionButton[] = [
        {
          id: 'approve',
          label: 'Approve',
          action: 'approve_reschedule_request',
          style: 'primary',
          data: { requestId: data.requestId }
        },
        {
          id: 'decline',
          label: 'Decline',
          action: 'decline_reschedule_request',
          style: 'secondary',
          data: { requestId: data.requestId }
        }
      ];

      if (data.requestType === 'reschedule') {
        actionButtons.push({
          id: 'counter_propose',
          label: 'Counter Propose',
          action: 'create_counter_proposal',
          style: 'secondary',
          data: { requestId: data.requestId }
        });
      }

      const result = await this.createNotification({
        templateKey: 'reschedule_request_created',
        recipientId: data.recipientId,
        senderId: data.requesterId,
        variables: {
          requester_name: data.requesterName,
          recipient_name: data.recipientName,
          subject: data.subject,
          request_type: data.requestType,
          original_date: new Date(data.originalDate).toLocaleString(),
          proposed_date: data.proposedDate ? new Date(data.proposedDate).toLocaleString() : '',
          reason: data.reason
        },
        relatedLessonId: data.lessonId,
        relatedRequestId: data.requestId,
        actionButtons,
        customPriority: 'high'
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('❌ Error sending reschedule notification:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Send counter proposal notification
  async notifyCounterProposal(data: {
    proposalId: string;
    originalRequestId: string;
    lessonId: string;
    proposerId: string;
    recipientId: string;
    proposerName: string;
    recipientName: string;
    subject: string;
    proposedDate: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const actionButtons: ActionButton[] = [
        {
          id: 'accept',
          label: 'Accept',
          action: 'accept_counter_proposal',
          style: 'primary',
          data: { proposalId: data.proposalId }
        },
        {
          id: 'decline',
          label: 'Decline',
          action: 'decline_counter_proposal',
          style: 'secondary',
          data: { proposalId: data.proposalId }
        }
      ];

      const result = await this.createNotification({
        templateKey: 'counter_proposal_created',
        recipientId: data.recipientId,
        senderId: data.proposerId,
        variables: {
          proposer_name: data.proposerName,
          recipient_name: data.recipientName,
          subject: data.subject,
          proposed_date: new Date(data.proposedDate).toLocaleString(),
          reason: data.reason || 'No additional reason provided'
        },
        relatedLessonId: data.lessonId,
        relatedRequestId: data.originalRequestId,
        actionButtons,
        customPriority: 'high'
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('❌ Error sending counter proposal notification:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Send admin escalation notification
  async notifyAdminEscalation(data: {
    requestId: string;
    lessonId: string;
    adminIds: string[];
    subject: string;
    studentName: string;
    tutorName: string;
    requestType: 'reschedule' | 'cancel';
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const actionButtons: ActionButton[] = [
        {
          id: 'admin_approve',
          label: 'Approve Request',
          action: 'admin_approve_request',
          style: 'primary',
          data: { requestId: data.requestId }
        },
        {
          id: 'admin_decline',
          label: 'Decline Request',
          action: 'admin_decline_request',
          style: 'danger',
          data: { requestId: data.requestId }
        }
      ];

      // Send notification to all admins
      for (const adminId of data.adminIds) {
        await this.createNotification({
          templateKey: 'admin_escalation_timeout',
          recipientId: adminId,
          variables: {
            subject: data.subject,
            student_name: data.studentName,
            tutor_name: data.tutorName,
            request_type: data.requestType
          },
          relatedLessonId: data.lessonId,
          relatedRequestId: data.requestId,
          actionButtons,
          customPriority: 'urgent'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error sending admin escalation notification:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Get user notifications
  async getUserNotifications(
    userId: string, 
    options: { 
      unreadOnly?: boolean; 
      limit?: number; 
      offset?: number;
      types?: string[];
    } = {}
  ): Promise<Notification[]> {
    try {
      console.log('🔍 Fetching notifications for user:', userId);

      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles(full_name)
        `)
        .eq('recipient_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (options.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options.types && options.types.length > 0) {
        query = query.in('notification_type', options.types);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data: notifications, error } = await query;

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return [];
      }

      return notifications || [];
    } catch (error) {
      console.error('❌ Unexpected error fetching notifications:', error);
      return [];
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('mark_notification_as_read', {
        notification_id: notificationId,
        user_id: userId
      });

      if (error) {
        console.error('❌ Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error marking notification as read:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data: count, error } = await supabase.rpc('mark_all_notifications_as_read', {
        user_id: userId
      });

      if (error) {
        console.error('❌ Error marking all notifications as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count };
    } catch (error) {
      console.error('❌ Unexpected error marking all notifications as read:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Get notification counts
  async getNotificationCounts(userId: string): Promise<{
    total: number;
    unread: number;
    urgent: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_notification_count', {
        user_id: userId
      });

      if (error) {
        console.error('❌ Error getting notification counts:', error);
        return { total: 0, unread: 0, urgent: 0 };
      }

      const counts = data[0] || { total_count: 0, unread_count: 0, urgent_count: 0 };
      return {
        total: parseInt(counts.total_count),
        unread: parseInt(counts.unread_count),
        urgent: parseInt(counts.urgent_count)
      };
    } catch (error) {
      console.error('❌ Unexpected error getting notification counts:', error);
      return { total: 0, unread: 0, urgent: 0 };
    }
  },

  // Get user preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('❌ Error fetching notification preferences:', error);
        return null;
      }

      return preferences;
    } catch (error) {
      console.error('❌ Unexpected error fetching notification preferences:', error);
      return null;
    }
  },

  // Update user preferences
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error updating notification preferences:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error updating notification preferences:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Send in-app notification (mark as sent)
  async sendInAppNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          in_app_sent: true,
          in_app_sent_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error marking in-app notification as sent:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error sending in-app notification:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Send email notification (placeholder - to be implemented with email service)
  async sendEmailNotification(
    notificationId: string, 
    template: NotificationTemplate, 
    variables: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Email notification would be sent for:', notificationId);
      
      // TODO: Implement actual email sending with service like SendGrid, Mailgun, etc.
      // For now, just mark as sent
      const { error } = await supabase
        .from('notifications')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error marking email notification as sent:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Email notification marked as sent (placeholder)');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error sending email notification:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(
    userId: string, 
    onNewNotification: (notification: Notification) => void
  ) {
    console.log('🔔 Subscribing to real-time notifications for user:', userId);

    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          console.log('🆕 New notification received:', payload.new);
          onNewNotification(payload.new as Notification);
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification subscription status:', status);
      });

    return subscription;
  },

  // Clean up expired notifications
  async cleanupExpiredNotifications(): Promise<{ deletedCount: number }> {
    try {
      const { data: deletedCount, error } = await supabase.rpc('cleanup_expired_notifications');

      if (error) {
        console.error('❌ Error cleaning up expired notifications:', error);
        return { deletedCount: 0 };
      }

      console.log('🗑️ Cleaned up expired notifications:', deletedCount);
      return { deletedCount: deletedCount || 0 };
    } catch (error) {
      console.error('❌ Unexpected error cleaning up notifications:', error);
      return { deletedCount: 0 };
    }
  }
};