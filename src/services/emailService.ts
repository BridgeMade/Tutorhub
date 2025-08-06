import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandler';

// Email template types
export enum EmailTemplate {
  // Booking & Session Management
  SESSION_BOOKED = 'session_booked',
  SESSION_CONFIRMED = 'session_confirmed',
  SESSION_REMINDER = 'session_reminder',
  SESSION_CANCELLED = 'session_cancelled',
  SESSION_RESCHEDULED = 'session_rescheduled',
  RESCHEDULE_REQUEST = 'reschedule_request',
  RESCHEDULE_APPROVED = 'reschedule_approved',
  RESCHEDULE_DECLINED = 'reschedule_declined',
  
  // Authentication & Onboarding
  WELCOME_EMAIL = 'welcome_email',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_ACTIVATED = 'account_activated',
  
  // Resources & Assignments
  RESOURCE_ASSIGNED = 'resource_assigned',
  ASSIGNMENT_SUBMITTED = 'assignment_submitted',
  ASSIGNMENT_REVIEWED = 'assignment_reviewed',
  
  // Payments & Billing
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  INVOICE_GENERATED = 'invoice_generated',
  
  // System Notifications
  SYSTEM_MAINTENANCE = 'system_maintenance',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
  WEEKLY_SUMMARY = 'weekly_summary'
}

// Email priority levels
export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Email data interfaces
export interface EmailData {
  to: string;
  cc?: string[];
  bcc?: string[];
  template: EmailTemplate;
  templateData: Record<string, any>;
  priority?: EmailPriority;
  scheduledAt?: Date;
  userId?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface EmailLog {
  id: string;
  to_email: string;
  template_type: string;
  subject: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  user_id?: string;
  created_at: string;
}

interface EmailTemplateContent {
  subject: string;
  htmlBody: string;
  textBody: string;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private baseUrl: string;

  constructor() {
    // These should be set via environment variables
    this.apiKey = process.env.REACT_APP_EMAIL_API_KEY || '';
    this.fromEmail = process.env.REACT_APP_FROM_EMAIL || 'noreply@tutorhub.co.za';
    this.fromName = process.env.REACT_APP_FROM_NAME || 'TutorHub';
    this.baseUrl = process.env.REACT_APP_API_URL || '';
  }

  /**
   * Send email using template
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Generate email content from template
      const template = await this.getEmailTemplate(emailData.template, emailData.templateData);
      
      // Log email attempt
      const logId = await this.logEmailAttempt(emailData, template);

      // Send email via email service (Resend, SendGrid, etc.)
      const result = await this.sendViaEmailProvider({
        ...emailData,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        logId
      });

      // Update log with result
      await this.updateEmailLog(logId, result);

      return result;
    } catch (error) {
      const appError = handleError(error, {
        operation: 'sendEmail',
        template: emailData.template,
        recipient: emailData.to
      });
      
      return { success: false, error: appError.userMessage };
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail: string, userName: string, userRole: string): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      template: EmailTemplate.WELCOME_EMAIL,
      templateData: {
        userName,
        userRole,
        loginUrl: `${window.location.origin}/login`,
        supportEmail: 'support@tutorhub.co.za'
      },
      priority: EmailPriority.HIGH
    });
  }

  /**
   * Send session booking confirmation
   */
  async sendSessionBookedEmail(
    studentEmail: string,
    tutorEmail: string,
    sessionDetails: {
      subject: string;
      scheduledAt: string;
      duration: number;
      studentName: string;
      tutorName: string;
      notes?: string;
    }
  ): Promise<void> {
    const templateData = {
      ...sessionDetails,
      sessionDate: new Date(sessionDetails.scheduledAt).toLocaleDateString('en-ZA'),
      sessionTime: new Date(sessionDetails.scheduledAt).toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      dashboardUrl: `${window.location.origin}/dashboard`
    };

    // Send to student
    await this.sendEmail({
      to: studentEmail,
      template: EmailTemplate.SESSION_BOOKED,
      templateData: { ...templateData, recipientType: 'student' },
      priority: EmailPriority.HIGH
    });

    // Send to tutor
    await this.sendEmail({
      to: tutorEmail,
      template: EmailTemplate.SESSION_BOOKED,
      templateData: { ...templateData, recipientType: 'tutor' },
      priority: EmailPriority.HIGH
    });
  }

  /**
   * Send session reminder (24 hours before)
   */
  async sendSessionReminder(
    recipientEmail: string,
    recipientType: 'student' | 'tutor',
    sessionDetails: {
      subject: string;
      scheduledAt: string;
      duration: number;
      studentName: string;
      tutorName: string;
      meetingLink?: string;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      template: EmailTemplate.SESSION_REMINDER,
      templateData: {
        ...sessionDetails,
        recipientType,
        sessionDate: new Date(sessionDetails.scheduledAt).toLocaleDateString('en-ZA'),
        sessionTime: new Date(sessionDetails.scheduledAt).toLocaleTimeString('en-ZA', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        hoursUntilSession: Math.round(
          (new Date(sessionDetails.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60 * 60)
        ),
        dashboardUrl: `${window.location.origin}/dashboard`
      },
      priority: EmailPriority.NORMAL,
      scheduledAt: new Date(new Date(sessionDetails.scheduledAt).getTime() - 24 * 60 * 60 * 1000)
    });
  }

  /**
   * Send reschedule request notification
   */
  async sendRescheduleRequestEmail(
    recipientEmail: string,
    recipientType: 'student' | 'tutor',
    rescheduleDetails: {
      sessionSubject: string;
      originalDate: string;
      requestedDate: string;
      reason: string;
      requesterName: string;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      template: EmailTemplate.RESCHEDULE_REQUEST,
      templateData: {
        ...rescheduleDetails,
        recipientType,
        originalDateFormatted: new Date(rescheduleDetails.originalDate).toLocaleDateString('en-ZA'),
        requestedDateFormatted: new Date(rescheduleDetails.requestedDate).toLocaleDateString('en-ZA'),
        dashboardUrl: `${window.location.origin}/dashboard`,
        respondUrl: `${window.location.origin}/sessions/reschedule-requests`
      },
      priority: EmailPriority.HIGH
    });
  }

  /**
   * Send resource assignment notification
   */
  async sendResourceAssignedEmail(
    studentEmail: string,
    resourceDetails: {
      resourceTitle: string;
      assignmentType: string;
      sessionSubject: string;
      sessionDate: string;
      tutorName: string;
      isRequired: boolean;
      notes?: string;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: studentEmail,
      template: EmailTemplate.RESOURCE_ASSIGNED,
      templateData: {
        ...resourceDetails,
        sessionDateFormatted: new Date(resourceDetails.sessionDate).toLocaleDateString('en-ZA'),
        resourceUrl: `${window.location.origin}/resources`,
        dashboardUrl: `${window.location.origin}/dashboard`
      },
      priority: EmailPriority.NORMAL
    });
  }

  /**
   * Get email template with populated data
   */
  private async getEmailTemplate(templateType: EmailTemplate, data: Record<string, any>): Promise<EmailTemplateContent> {
    // In a real implementation, you might fetch templates from a database or external service
    // For now, we'll use predefined templates
    const templates = this.getBuiltInTemplates();
    const template = templates[templateType];
    
    if (!template) {
      throw new Error(`Email template not found: ${templateType}`);
    }

    // Replace template variables with actual data
    const subject = this.replaceTemplateVariables(template.subject, data);
    const htmlBody = this.replaceTemplateVariables(template.htmlBody, data);
    const textBody = this.replaceTemplateVariables(template.textBody, data);

    return { subject, htmlBody, textBody };
  }

  /**
   * Replace template variables like {{variable}} with actual values
   */
  private replaceTemplateVariables(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Send email via external email provider
   */
  private async sendViaEmailProvider(emailData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Example using Resend API (you can replace with SendGrid, Mailgun, etc.)
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [emailData.to],
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          html: emailData.htmlBody,
          text: emailData.textBody,
          tags: [
            { name: 'template', value: emailData.template },
            { name: 'priority', value: emailData.priority || 'normal' }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      const result = await response.json();
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Log email attempt to database
   */
  private async logEmailAttempt(emailData: EmailData, template: EmailTemplateContent): Promise<string> {
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        to_email: emailData.to,
        template_type: emailData.template,
        subject: template.subject,
        status: 'pending',
        user_id: emailData.userId
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log email attempt:', error);
      return 'unknown';
    }

    return data.id;
  }

  /**
   * Update email log with sending result
   */
  private async updateEmailLog(logId: string, result: { success: boolean; messageId?: string; error?: string }): Promise<void> {
    const updateData: any = {
      status: result.success ? 'sent' : 'failed',
      sent_at: result.success ? new Date().toISOString() : null,
      error_message: result.error || null
    };

    if (result.messageId) {
      updateData.external_id = result.messageId;
    }

    await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', logId);
  }

  /**
   * Get recent email logs for monitoring
   */
  async getEmailLogs(limit: number = 50): Promise<EmailLog[]> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      handleError(error, { operation: 'getEmailLogs' });
      return [];
    }

    return data || [];
  }

  /**
   * Get email delivery statistics
   */
  async getEmailStats(days: number = 7): Promise<{
    totalSent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('email_logs')
      .select('status')
      .gte('created_at', startDate.toISOString());

    if (error) {
      handleError(error, { operation: 'getEmailStats' });
      return { totalSent: 0, delivered: 0, failed: 0, deliveryRate: 0 };
    }

    const logs = data || [];
    const totalSent = logs.filter((log: any) => log.status !== 'pending').length;
    const delivered = logs.filter((log: any) => ['sent', 'delivered'].includes(log.status)).length;
    const failed = logs.filter((log: any) => ['failed', 'bounced'].includes(log.status)).length;
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;

    return { totalSent, delivered, failed, deliveryRate };
  }

  /**
   * Built-in email templates
   */
  private getBuiltInTemplates(): Record<EmailTemplate, { subject: string; htmlBody: string; textBody: string }> {
    return {
      [EmailTemplate.WELCOME_EMAIL]: {
        subject: 'Welcome to TutorHub! 🎉',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Welcome to TutorHub, {{userName}}!</h1>
            <p>We're excited to have you join our learning community as a {{userRole}}.</p>
            <p>Your account has been created successfully. You can now:</p>
            <ul>
              <li>Book tutoring sessions</li>
              <li>Access learning resources</li>
              <li>Connect with qualified tutors</li>
              <li>Track your progress</li>
            </ul>
            <a href="{{loginUrl}}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              Access Your Dashboard
            </a>
            <p>If you have any questions, don't hesitate to contact us at {{supportEmail}}.</p>
            <p>Happy learning!<br>The TutorHub Team</p>
          </div>
        `,
        textBody: `Welcome to TutorHub, {{userName}}! We're excited to have you join our learning community as a {{userRole}}. Access your dashboard at {{loginUrl}}. Contact us at {{supportEmail}} if you need help.`
      },

      [EmailTemplate.SESSION_BOOKED]: {
        subject: 'Session Booked: {{subject}} on {{sessionDate}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Session Booked Successfully! 📚</h1>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2>Session Details</h2>
              <p><strong>Subject:</strong> {{subject}}</p>
              <p><strong>Date:</strong> {{sessionDate}}</p>
              <p><strong>Time:</strong> {{sessionTime}}</p>
              <p><strong>Duration:</strong> {{duration}} minutes</p>
              <p><strong>Student:</strong> {{studentName}}</p>
              <p><strong>Tutor:</strong> {{tutorName}}</p>
              {{#if notes}}<p><strong>Notes:</strong> {{notes}}</p>{{/if}}
            </div>
            {{#if recipientType === 'student'}}
            <p>Your tutoring session has been booked! Your tutor will confirm the session soon.</p>
            {{else}}
            <p>A new session has been booked with you. Please confirm or reschedule if needed.</p>
            {{/if}}
            <a href="{{dashboardUrl}}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              View in Dashboard
            </a>
            <p>Questions? Contact us anytime!</p>
          </div>
        `,
        textBody: `Session booked for {{subject}} on {{sessionDate}} at {{sessionTime}}. Student: {{studentName}}, Tutor: {{tutorName}}. View details at {{dashboardUrl}}`
      },

      [EmailTemplate.SESSION_REMINDER]: {
        subject: 'Reminder: {{subject}} session in {{hoursUntilSession}} hours',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Session Reminder 🔔</h1>
            <p>This is a friendly reminder about your upcoming tutoring session.</p>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h2>Session in {{hoursUntilSession}} hours</h2>
              <p><strong>Subject:</strong> {{subject}}</p>
              <p><strong>Date:</strong> {{sessionDate}}</p>
              <p><strong>Time:</strong> {{sessionTime}}</p>
              {{#if recipientType === 'student'}}
              <p><strong>Tutor:</strong> {{tutorName}}</p>
              {{else}}
              <p><strong>Student:</strong> {{studentName}}</p>
              {{/if}}
            </div>
            {{#if meetingLink}}
            <a href="{{meetingLink}}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px;">
              Join Meeting
            </a>
            {{/if}}
            <a href="{{dashboardUrl}}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px;">
              View Dashboard
            </a>
            <p>Make sure you're prepared and ready to learn!</p>
          </div>
        `,
        textBody: `Reminder: {{subject}} session with {{tutorName}} starts in {{hoursUntilSession}} hours on {{sessionDate}} at {{sessionTime}}. View details at {{dashboardUrl}}`
      },

      [EmailTemplate.RESCHEDULE_REQUEST]: {
        subject: 'Reschedule Request: {{sessionSubject}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Session Reschedule Request 📅</h1>
            <p>{{requesterName}} has requested to reschedule your {{sessionSubject}} session.</p>
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2>Reschedule Details</h2>
              <p><strong>Original Date:</strong> {{originalDateFormatted}}</p>
              <p><strong>Requested New Date:</strong> {{requestedDateFormatted}}</p>
              <p><strong>Reason:</strong> {{reason}}</p>
            </div>
            <p>Please respond to this request as soon as possible.</p>
            <a href="{{respondUrl}}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              Respond to Request
            </a>
            <p>Questions? Contact us anytime!</p>
          </div>
        `,
        textBody: `{{requesterName}} requested to reschedule {{sessionSubject}} from {{originalDateFormatted}} to {{requestedDateFormatted}}. Reason: {{reason}}. Respond at {{respondUrl}}`
      },

      [EmailTemplate.RESOURCE_ASSIGNED]: {
        subject: 'New Resource Assigned: {{resourceTitle}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">New Learning Resource 📚</h1>
            <p>{{tutorName}} has assigned a new resource for your {{sessionSubject}} session.</p>
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2>{{resourceTitle}}</h2>
              <p><strong>Assignment Type:</strong> {{assignmentType}}</p>
              <p><strong>Session:</strong> {{sessionSubject}} on {{sessionDateFormatted}}</p>
              {{#if isRequired}}<p style="color: #dc2626;"><strong>⚠️ This resource is required</strong></p>{{/if}}
              {{#if notes}}<p><strong>Notes:</strong> {{notes}}</p>{{/if}}
            </div>
            <a href="{{resourceUrl}}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              Access Resource
            </a>
            <p>Good luck with your studies!</p>
          </div>
        `,
        textBody: `{{tutorName}} assigned "{{resourceTitle}}" for {{sessionSubject}} session on {{sessionDateFormatted}}. Access at {{resourceUrl}}`
      },

      // Add missing templates with basic content
      [EmailTemplate.SESSION_CONFIRMED]: {
        subject: 'Session Confirmed: {{subject}}',
        htmlBody: `<p>Your session for {{subject}} has been confirmed.</p>`,
        textBody: `Your session for {{subject}} has been confirmed.`
      },
      [EmailTemplate.SESSION_CANCELLED]: {
        subject: 'Session Cancelled: {{subject}}',
        htmlBody: `<p>Your session for {{subject}} has been cancelled.</p>`,
        textBody: `Your session for {{subject}} has been cancelled.`
      },
      [EmailTemplate.SESSION_RESCHEDULED]: {
        subject: 'Session Rescheduled: {{subject}}',
        htmlBody: `<p>Your session for {{subject}} has been rescheduled.</p>`,
        textBody: `Your session for {{subject}} has been rescheduled.`
      },
      [EmailTemplate.RESCHEDULE_APPROVED]: {
        subject: 'Reschedule Approved: {{subject}}',
        htmlBody: `<p>Your reschedule request for {{subject}} has been approved.</p>`,
        textBody: `Your reschedule request for {{subject}} has been approved.`
      },
      [EmailTemplate.RESCHEDULE_DECLINED]: {
        subject: 'Reschedule Declined: {{subject}}',
        htmlBody: `<p>Your reschedule request for {{subject}} has been declined.</p>`,
        textBody: `Your reschedule request for {{subject}} has been declined.`
      },
      [EmailTemplate.EMAIL_VERIFICATION]: {
        subject: 'Verify Your Email',
        htmlBody: `<p>Please verify your email address.</p>`,
        textBody: `Please verify your email address.`
      },
      [EmailTemplate.PASSWORD_RESET]: {
        subject: 'Password Reset',
        htmlBody: `<p>Reset your password.</p>`,
        textBody: `Reset your password.`
      },
      [EmailTemplate.ACCOUNT_ACTIVATED]: {
        subject: 'Account Activated',
        htmlBody: `<p>Your account has been activated.</p>`,
        textBody: `Your account has been activated.`
      },
      [EmailTemplate.ASSIGNMENT_SUBMITTED]: {
        subject: 'Assignment Submitted',
        htmlBody: `<p>Assignment has been submitted.</p>`,
        textBody: `Assignment has been submitted.`
      },
      [EmailTemplate.ASSIGNMENT_REVIEWED]: {
        subject: 'Assignment Reviewed',
        htmlBody: `<p>Your assignment has been reviewed.</p>`,
        textBody: `Your assignment has been reviewed.`
      },
      [EmailTemplate.PAYMENT_RECEIVED]: {
        subject: 'Payment Received',
        htmlBody: `<p>Your payment has been received.</p>`,
        textBody: `Your payment has been received.`
      },
      [EmailTemplate.PAYMENT_FAILED]: {
        subject: 'Payment Failed',
        htmlBody: `<p>Your payment has failed.</p>`,
        textBody: `Your payment has failed.`
      },
      [EmailTemplate.INVOICE_GENERATED]: {
        subject: 'Invoice Generated',
        htmlBody: `<p>Your invoice has been generated.</p>`,
        textBody: `Your invoice has been generated.`
      },
      [EmailTemplate.SYSTEM_MAINTENANCE]: {
        subject: 'System Maintenance',
        htmlBody: `<p>System maintenance notification.</p>`,
        textBody: `System maintenance notification.`
      },
      [EmailTemplate.FEATURE_ANNOUNCEMENT]: {
        subject: 'New Feature Announcement',
        htmlBody: `<p>New feature announcement.</p>`,
        textBody: `New feature announcement.`
      },
      [EmailTemplate.WEEKLY_SUMMARY]: {
        subject: 'Weekly Summary',
        htmlBody: `<p>Your weekly summary.</p>`,
        textBody: `Your weekly summary.`
      }
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();