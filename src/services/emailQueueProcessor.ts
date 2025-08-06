import { supabase } from '../lib/supabase';
import { emailService, EmailTemplate } from './emailService';
import { handleError } from '../utils/errorHandler';

export interface QueuedEmail {
  id: string;
  to_email: string;
  cc_emails?: string[];
  bcc_emails?: string[];
  template_type: string;
  template_data: Record<string, any>;
  scheduled_at: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'queued' | 'processing' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  last_attempt_at?: string;
  email_log_id?: string;
  error_message?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

class EmailQueueProcessor {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly batchSize = 10;
  private readonly processingIntervalMs = 30000; // 30 seconds

  /**
   * Start the email queue processor
   */
  public start(): void {
    if (this.processingInterval) {
      console.warn('Email queue processor is already running');
      return;
    }

    console.log('Starting email queue processor...');
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.processingIntervalMs);

    // Process immediately on start
    this.processQueue();
  }

  /**
   * Stop the email queue processor
   */
  public stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Email queue processor stopped');
    }
  }

  /**
   * Process queued emails in batches
   */
  public async processQueue(): Promise<{ processed: number; failed: number }> {
    if (this.isProcessing) {
      console.log('Email queue processing already in progress, skipping...');
      return { processed: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let failed = 0;

    try {
      console.log('Processing email queue...');

      // Get queued emails ready to be sent
      const { data: queuedEmails, error: fetchError } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'queued')
        .lte('scheduled_at', new Date().toISOString())
        .lt('attempts', 'max_attempts')
        .order('priority', { ascending: false }) // High priority first
        .order('scheduled_at', { ascending: true }) // Older emails first
        .limit(this.batchSize);

      if (fetchError) {
        console.error('Error fetching queued emails:', fetchError);
        return { processed: 0, failed: 0 };
      }

      if (!queuedEmails || queuedEmails.length === 0) {
        console.log('No emails in queue to process');
        return { processed: 0, failed: 0 };
      }

      console.log(`Processing ${queuedEmails.length} queued emails...`);

      // Process each email
      for (const queuedEmail of queuedEmails) {
        try {
          await this.processQueuedEmail(queuedEmail);
          processed++;
        } catch (error) {
          console.error(`Failed to process email ${queuedEmail.id}:`, error);
          await this.markEmailFailed(queuedEmail.id, (error as Error).message);
          failed++;
        }
      }

      console.log(`Email queue processing complete. Processed: ${processed}, Failed: ${failed}`);

    } catch (error) {
      console.error('Error in email queue processing:', error);
    } finally {
      this.isProcessing = false;
    }

    return { processed, failed };
  }

  /**
   * Process a single queued email
   */
  private async processQueuedEmail(queuedEmail: QueuedEmail): Promise<void> {
    console.log(`Processing email ${queuedEmail.id} to ${queuedEmail.to_email}`);

    // Mark as processing
    await this.updateQueueStatus(queuedEmail.id, 'processing');

    try {
      // Check user's email preferences if user_id is provided
      if (queuedEmail.user_id) {
        const canSend = await this.checkEmailPreferences(
          queuedEmail.user_id,
          queuedEmail.template_type
        );

        if (!canSend) {
          console.log(`User ${queuedEmail.user_id} has disabled notifications for ${queuedEmail.template_type}`);
          await this.updateQueueStatus(queuedEmail.id, 'cancelled');
          return;
        }
      }

      // Send the email
      const result = await emailService.sendEmail({
        to: queuedEmail.to_email,
        cc: queuedEmail.cc_emails,
        bcc: queuedEmail.bcc_emails,
        template: queuedEmail.template_type as EmailTemplate,
        templateData: queuedEmail.template_data,
        priority: queuedEmail.priority as any,
        userId: queuedEmail.user_id
      });

      if (result.success) {
        await this.markEmailSent(queuedEmail.id, result.messageId);
        console.log(`Email ${queuedEmail.id} sent successfully`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }

    } catch (error) {
      console.error(`Error processing email ${queuedEmail.id}:`, error);
      
      // Check if we should retry
      if (queuedEmail.attempts + 1 < queuedEmail.max_attempts) {
        await this.markEmailForRetry(queuedEmail.id, (error as Error).message);
      } else {
        await this.markEmailFailed(queuedEmail.id, (error as Error).message);
      }
      
      throw error;
    }
  }

  /**
   * Check user's email preferences
   */
  private async checkEmailPreferences(userId: string, templateType: string): Promise<boolean> {
    try {
      const { data: prefs, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !prefs) {
        // Default to allowing emails if preferences not found
        return true;
      }

      // If user has unsubscribed globally
      if (!prefs.email_notifications_enabled) {
        return false;
      }

      // Check specific notification type preferences
      const notificationMap: { [key: string]: string } = {
        'session_reminder': 'session_reminders',
        'session_booked': 'session_confirmations',
        'session_cancelled': 'session_confirmations',
        'session_rescheduled': 'reschedule_notifications',
        'reschedule_request': 'reschedule_notifications',
        'reschedule_approved': 'reschedule_notifications',
        'reschedule_declined': 'reschedule_notifications',
        'resource_assigned': 'resource_assignments',
        'system_maintenance': 'system_announcements',
        'feature_announcement': 'system_announcements',
        'weekly_summary': 'weekly_summaries'
      };

      const prefKey = notificationMap[templateType];
      if (prefKey && prefs[prefKey] === false) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking email preferences:', error);
      // Default to allowing emails if we can't check preferences
      return true;
    }
  }

  /**
   * Update queue item status
   */
  private async updateQueueStatus(queueId: string, status: string): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'processing') {
      updateData.attempts = (supabase as any).raw('attempts + 1');
      updateData.last_attempt_at = new Date().toISOString();
    }

    await supabase
      .from('email_queue')
      .update(updateData)
      .eq('id', queueId);
  }

  /**
   * Mark email as sent successfully
   */
  private async markEmailSent(queueId: string, messageId?: string): Promise<void> {
    await supabase
      .from('email_queue')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId);
  }

  /**
   * Mark email for retry
   */
  private async markEmailForRetry(queueId: string, errorMessage: string): Promise<void> {
    // Calculate delay for exponential backoff
    const { data: queueItem } = await supabase
      .from('email_queue')
      .select('attempts')
      .eq('id', queueId)
      .single();

    const attempts = queueItem?.attempts || 0;
    const delayMinutes = Math.min(Math.pow(2, attempts) * 5, 60); // Max 60 minutes
    const retryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    await supabase
      .from('email_queue')
      .update({
        status: 'queued', // Back to queued for retry
        scheduled_at: retryAt.toISOString(),
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId);

    console.log(`Email ${queueId} scheduled for retry in ${delayMinutes} minutes`);
  }

  /**
   * Mark email as permanently failed
   */
  private async markEmailFailed(queueId: string, errorMessage: string): Promise<void> {
    await supabase
      .from('email_queue')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId);

    console.log(`Email ${queueId} marked as permanently failed`);
  }

  /**
   * Add email to queue
   */
  public async queueEmail(emailData: {
    to: string;
    cc?: string[];
    bcc?: string[];
    template: EmailTemplate;
    templateData: Record<string, any>;
    scheduledAt?: Date;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    userId?: string;
    maxAttempts?: number;
  }): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .insert({
          to_email: emailData.to,
          cc_emails: emailData.cc,
          bcc_emails: emailData.bcc,
          template_type: emailData.template,
          template_data: emailData.templateData,
          scheduled_at: (emailData.scheduledAt || new Date()).toISOString(),
          priority: emailData.priority || 'normal',
          user_id: emailData.userId,
          max_attempts: emailData.maxAttempts || 3
        })
        .select('id')
        .single();

      if (error) {
        throw new Error('Failed to queue email: ' + error.message);
      }

      return { success: true, queueId: data.id };
    } catch (error) {
      const appError = handleError(error, {
        operation: 'queueEmail',
        template: emailData.template,
        recipient: emailData.to
      });

      return { success: false, error: appError.userMessage };
    }
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<{
    queued: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        console.error('Error fetching queue stats:', error);
        return { queued: 0, processing: 0, sent: 0, failed: 0, cancelled: 0 };
      }

      const stats = { queued: 0, processing: 0, sent: 0, failed: 0, cancelled: 0 };
      
      data?.forEach((item: any) => {
        stats[item.status as keyof typeof stats]++;
      });

      return stats;
    } catch (error) {
      console.error('Error calculating queue stats:', error);
      return { queued: 0, processing: 0, sent: 0, failed: 0, cancelled: 0 };
    }
  }

  /**
   * Purge old completed emails from queue
   */
  public async purgeOldEmails(olderThanDays: number = 7): Promise<{ deleted: number }> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

      const { error, count } = await supabase
        .from('email_queue')
        .delete({ count: 'exact' })
        .in('status', ['sent', 'failed', 'cancelled'])
        .lt('updated_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error purging old emails:', error);
        return { deleted: 0 };
      }

      console.log(`Purged ${count || 0} old emails from queue`);
      return { deleted: count || 0 };
    } catch (error) {
      console.error('Error in email purge operation:', error);
      return { deleted: 0 };
    }
  }
}

// Export singleton instance
export const emailQueueProcessor = new EmailQueueProcessor();
export default emailQueueProcessor;