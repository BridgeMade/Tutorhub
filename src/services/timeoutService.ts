import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

export interface TimeoutMonitor {
  requestId: string;
  timeoutId: NodeJS.Timeout;
  escalated: boolean;
}

class TimeoutService {
  private activeMonitors: Map<string, TimeoutMonitor> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🕐 Initializing timeout monitoring service');
    
    // Process any existing expired requests on startup
    await this.processExpiredRequests();
    
    // Set up periodic cleanup (every 30 minutes)
    setInterval(() => {
      this.processExpiredRequests();
    }, 30 * 60 * 1000);

    this.isInitialized = true;
    console.log('✅ Timeout monitoring service initialized');
  }

  // Start monitoring a reschedule request for timeout
  monitorRequest(requestId: string, deadlineString: string) {
    // Remove existing monitor if any
    this.clearMonitor(requestId);

    const deadline = new Date(deadlineString);
    const now = new Date();
    const timeUntilDeadline = deadline.getTime() - now.getTime();

    console.log(`⏰ Monitoring request ${requestId} for ${Math.round(timeUntilDeadline / (1000 * 60))} minutes`);

    // Only set timeout if deadline is in the future
    if (timeUntilDeadline > 0) {
      const timeoutId = setTimeout(async () => {
        await this.handleRequestTimeout(requestId);
      }, timeUntilDeadline);

      this.activeMonitors.set(requestId, {
        requestId,
        timeoutId,
        escalated: false
      });
    } else {
      // Request is already expired, handle immediately
      this.handleRequestTimeout(requestId);
    }
  }

  // Clear monitoring for a request (when it's responded to)
  clearMonitor(requestId: string) {
    const monitor = this.activeMonitors.get(requestId);
    if (monitor) {
      clearTimeout(monitor.timeoutId);
      this.activeMonitors.delete(requestId);
      console.log(`⏹️ Stopped monitoring request ${requestId}`);
    }
  }

  // Handle when a request times out
  private async handleRequestTimeout(requestId: string) {
    try {
      console.log(`⚠️ Request ${requestId} has timed out - escalating to admin`);

      // Get the request details
      const { data: request, error } = await supabase
        .from('session_reschedule_requests')
        .select(`
          *,
          lesson:lessons!inner(
            *,
            student:profiles!lessons_student_id_fkey(id, full_name),
            tutor:profiles!lessons_tutor_id_fkey(id, full_name),
            subject:subjects(name)
          )
        `)
        .eq('id', requestId)
        .eq('status', 'pending')
        .single();

      if (error || !request) {
        console.log(`ℹ️ Request ${requestId} no longer pending - skipping escalation`);
        this.clearMonitor(requestId);
        return;
      }

      // Update request status to admin_required
      const { error: updateError } = await supabase
        .from('session_reschedule_requests')
        .update({
          status: 'admin_required',
          admin_escalated: true,
          admin_escalated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ Error updating request status:', updateError);
        return;
      }

      // Get all admin users
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'admin');

      if (adminError || !admins || admins.length === 0) {
        console.error('❌ No admin users found for escalation');
        return;
      }

      // Send escalation notifications to all admins
      const adminIds = admins.map((admin: any) => admin.id);
      
      await notificationService.notifyAdminEscalation({
        requestId,
        lessonId: request.lesson_id,
        adminIds,
        subject: request.lesson?.subject?.name || 'Unknown Subject',
        studentName: request.lesson?.student?.full_name || 'Unknown Student',
        tutorName: request.lesson?.tutor?.full_name || 'Unknown Tutor',
        requestType: request.request_type
      });

      // Clear the monitor
      this.clearMonitor(requestId);

      console.log(`✅ Request ${requestId} escalated to ${adminIds.length} admin(s)`);
    } catch (error) {
      console.error('❌ Error handling request timeout:', error);
    }
  }

  // Process all expired requests (runs periodically)
  async processExpiredRequests(): Promise<number> {
    try {
      console.log('🔍 Checking for expired reschedule requests...');

      const { data: expiredRequests, error } = await supabase
        .from('session_reschedule_requests')
        .select(`
          *,
          lesson:lessons!inner(
            *,
            student:profiles!lessons_student_id_fkey(id, full_name),
            tutor:profiles!lessons_tutor_id_fkey(id, full_name),
            subject:subjects(name)
          )
        `)
        .eq('status', 'pending')
        .lt('response_deadline', new Date().toISOString());

      if (error) {
        console.error('❌ Error fetching expired requests:', error);
        return 0;
      }

      if (!expiredRequests || expiredRequests.length === 0) {
        console.log('✅ No expired requests found');
        return 0;
      }

      console.log(`⚠️ Found ${expiredRequests.length} expired request(s) - escalating to admin`);

      // Get all admin users
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'admin');

      if (adminError || !admins || admins.length === 0) {
        console.error('❌ No admin users found for escalation');
        return 0;
      }

      const adminIds = admins.map((admin: any) => admin.id);
      let escalatedCount = 0;

      // Process each expired request
      for (const request of expiredRequests) {
        try {
          // Update request status
          const { error: updateError } = await supabase
            .from('session_reschedule_requests')
            .update({
              status: 'admin_required',
              admin_escalated: true,
              admin_escalated_at: new Date().toISOString()
            })
            .eq('id', request.id);

          if (updateError) {
            console.error(`❌ Error updating request ${request.id}:`, updateError);
            continue;
          }

          // Send escalation notifications
          await notificationService.notifyAdminEscalation({
            requestId: request.id,
            lessonId: request.lesson_id,
            adminIds,
            subject: request.lesson?.subject?.name || 'Unknown Subject',
            studentName: request.lesson?.student?.full_name || 'Unknown Student',
            tutorName: request.lesson?.tutor?.full_name || 'Unknown Tutor',
            requestType: request.request_type
          });

          escalatedCount++;
          console.log(`✅ Escalated request ${request.id} to admin`);
        } catch (requestError) {
          console.error(`❌ Error processing request ${request.id}:`, requestError);
        }
      }

      console.log(`✅ Successfully escalated ${escalatedCount} expired requests`);
      return escalatedCount;
    } catch (error) {
      console.error('❌ Error processing expired requests:', error);
      return 0;
    }
  }

  // Start monitoring all pending requests (called on app startup)
  async startMonitoringPendingRequests() {
    try {
      console.log('🔄 Starting monitoring for all pending requests...');

      const { data: pendingRequests, error } = await supabase
        .from('session_reschedule_requests')
        .select('id, response_deadline')
        .eq('status', 'pending');

      if (error) {
        console.error('❌ Error fetching pending requests:', error);
        return;
      }

      if (pendingRequests && pendingRequests.length > 0) {
        console.log(`📋 Found ${pendingRequests.length} pending request(s) to monitor`);
        
        for (const request of pendingRequests) {
          this.monitorRequest(request.id, request.response_deadline);
        }
      } else {
        console.log('✅ No pending requests to monitor');
      }
    } catch (error) {
      console.error('❌ Error starting pending request monitoring:', error);
    }
  }

  // Get monitoring statistics
  getMonitoringStats() {
    return {
      activeMonitors: this.activeMonitors.size,
      isInitialized: this.isInitialized,
      monitoredRequests: Array.from(this.activeMonitors.keys())
    };
  }

  // Clean up all monitors (for shutdown)
  cleanup() {
    console.log('🧹 Cleaning up timeout monitors...');
    this.activeMonitors.forEach(monitor => {
      clearTimeout(monitor.timeoutId);
    });
    this.activeMonitors.clear();
    this.isInitialized = false;
    console.log('✅ Timeout monitoring service cleaned up');
  }
}

// Export singleton instance
export const timeoutService = new TimeoutService();