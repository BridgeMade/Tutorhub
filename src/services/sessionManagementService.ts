import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';
import { timeoutService } from './timeoutService';
import { auditTrailService } from './auditTrailService';

export interface RescheduleRequest {
  id: string;
  lesson_id: string;
  requested_by: string;
  request_type: 'reschedule' | 'cancel';
  reason: string;
  original_date: string;
  original_duration: number;
  proposed_date?: string;
  proposed_duration?: number;
  status: 'pending' | 'approved' | 'declined' | 'counter_proposed' | 'expired' | 'admin_required';
  approver_response?: string;
  approved_by?: string;
  approved_at?: string;
  response_deadline: string;
  admin_escalated: boolean;
  admin_escalated_at?: string;
  admin_decision?: 'approved' | 'declined' | 'pending';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RescheduleRequestWithDetails extends RescheduleRequest {
  lesson_details?: {
    student_name: string;
    tutor_name: string;
    subject_name: string;
  };
  requester_name?: string;
}

export interface CounterProposal {
  id: string;
  original_request_id: string;
  proposed_by: string;
  proposed_date: string;
  proposed_duration: number;
  reason?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  response_deadline: string;
  responded_by?: string;
  responded_at?: string;
  response_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionChangeHistory {
  id: string;
  lesson_id: string;
  reschedule_request_id?: string;
  change_type: 'created' | 'rescheduled' | 'cancelled' | 'status_changed' | 'reschedule_requested' | 'approved' | 'declined';
  changed_by: string;
  old_values?: any;
  new_values?: any;
  reason?: string;
  notes?: string;
  created_at: string;
}

export const sessionManagementService = {
  // Create a reschedule request
  async createRescheduleRequest(requestData: {
    lessonId: string;
    requestType: 'reschedule' | 'cancel';
    reason: string;
    proposedDate?: Date;
    proposedDuration?: number;
  }): Promise<{ success: boolean; request?: RescheduleRequest; error?: string }> {
    try {
      console.log('📝 Creating reschedule request:', requestData);

      // Get lesson details first
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', requestData.lessonId)
        .single();

      if (lessonError || !lesson) {
        return { success: false, error: 'Lesson not found' };
      }

      // Get current user
      const currentUser = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;
      
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if reschedule is within 24 hours (requires admin approval)
      const lessonDate = new Date(lesson.scheduled_at);
      const hoursUntilLesson = (lessonDate.getTime() - Date.now()) / (1000 * 60 * 60);
      const requiresAdminApproval = hoursUntilLesson <= 24;

      // Create the reschedule request
      const { data: request, error } = await supabase
        .from('session_reschedule_requests')
        .insert({
          lesson_id: requestData.lessonId,
          requested_by: userId,
          request_type: requestData.requestType,
          reason: requestData.reason,
          original_date: lesson.scheduled_at,
          original_duration: lesson.duration_minutes,
          proposed_date: requestData.proposedDate?.toISOString(),
          proposed_duration: requestData.proposedDuration,
          status: requiresAdminApproval ? 'admin_required' : 'pending',
          admin_escalated: requiresAdminApproval
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating reschedule request:', error);
        return { success: false, error: error.message };
      }

      // Update lesson status
      await supabase
        .from('lessons')
        .update({ 
          detailed_status: requestData.requestType === 'cancel' ? 'cancelled' : 'reschedule_requested',
          last_modified_by: userId
        })
        .eq('id', requestData.lessonId);

      // Send notification to the other party
      try {
        
        // Get participant details
        const { data: participants } = await supabase
          .from('lessons')
          .select(`
            *,
            student:profiles!lessons_student_id_fkey(id, full_name),
            tutor:profiles!lessons_tutor_id_fkey(id, full_name),
            subject:subjects(name)
          `)
          .eq('id', requestData.lessonId)
          .single();

        if (participants) {
          const isStudent = participants.student_id === userId;
          const recipientId = isStudent ? participants.tutor_id : participants.student_id;
          const requesterName = isStudent ? participants.student?.full_name : participants.tutor?.full_name;
          const recipientName = isStudent ? participants.tutor?.full_name : participants.student?.full_name;

          await notificationService.notifyRescheduleRequest({
            requestId: request.id,
            lessonId: requestData.lessonId,
            requesterId: userId!,
            recipientId,
            requesterName: requesterName || 'Unknown User',
            recipientName: recipientName || 'Unknown User',
            subject: participants.subject?.name || 'Unknown Subject',
            requestType: requestData.requestType,
            originalDate: lesson.scheduled_at,
            proposedDate: requestData.proposedDate?.toISOString(),
            reason: requestData.reason
          });

          console.log('📧 Reschedule notification sent successfully');
        }
      } catch (notificationError) {
        console.error('❌ Error sending reschedule notification:', notificationError);
        // Don't fail the request if notification fails
      }

      // Start monitoring for 4-hour timeout if not admin required
      if (!requiresAdminApproval) {
        timeoutService.monitorRequest(request.id, request.response_deadline);
        console.log(`⏰ Started 4-hour timeout monitoring for request ${request.id}`);
      }

      // Create audit trail entry
      try {
        await auditTrailService.auditRescheduleRequest(
          requestData.lessonId,
          request.id,
          request,
          userId!,
          {
            requires_admin_approval: requiresAdminApproval,
            hours_until_lesson: hoursUntilLesson,
            timeout_monitoring: !requiresAdminApproval
          }
        );
      } catch (auditError) {
        console.error('❌ Error creating audit trail entry:', auditError);
        // Don't fail the request if audit fails
      }

      console.log('✅ Reschedule request created successfully');
      return { success: true, request };
    } catch (error) {
      console.error('❌ Unexpected error creating reschedule request:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Respond to a reschedule request
  async respondToRescheduleRequest(
    requestId: string,
    response: 'approved' | 'declined',
    responseNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Responding to reschedule request:', { requestId, response, responseNotes });

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the reschedule request
      const { data: request, error: requestError } = await supabase
        .from('session_reschedule_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) {
        return { success: false, error: 'Reschedule request not found' };
      }

      // Update the request
      const { error: updateError } = await supabase
        .from('session_reschedule_requests')
        .update({
          status: response,
          approver_response: responseNotes,
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ Error updating reschedule request:', updateError);
        return { success: false, error: updateError.message };
      }

      // If approved, update the lesson
      if (response === 'approved') {
        const updateData: any = {
          detailed_status: request.request_type === 'cancel' ? 'cancelled' : 'rescheduled',
          last_modified_by: currentUser.id
        };

        // Update lesson date if it's a reschedule
        if (request.request_type === 'reschedule' && request.proposed_date) {
          updateData.scheduled_at = request.proposed_date;
          updateData.duration_minutes = request.proposed_duration || request.original_duration;
        }

        await supabase
          .from('lessons')
          .update(updateData)
          .eq('id', request.lesson_id);

        // Check if cancellation is within 4 hours (mark as lost)
        if (request.request_type === 'cancel') {
          const lessonDate = new Date(request.original_date);
          const hoursUntilLesson = (lessonDate.getTime() - Date.now()) / (1000 * 60 * 60);
          
          if (hoursUntilLesson <= 4) {
            await supabase
              .from('lessons')
              .update({ detailed_status: 'lost' })
              .eq('id', request.lesson_id);
          }
        }
      } else {
        // If declined, revert lesson status
        await supabase
          .from('lessons')
          .update({ 
            detailed_status: 'scheduled',
            last_modified_by: currentUser.id
          })
          .eq('id', request.lesson_id);
      }

      // Send notification to the requester
      try {
        // Get participant details
        const { data: participants } = await supabase
          .from('lessons')
          .select(`
            *,
            student:profiles!lessons_student_id_fkey(id, full_name),
            tutor:profiles!lessons_tutor_id_fkey(id, full_name),
            subject:subjects(name)
          `)
          .eq('id', request.lesson_id)
          .single();

        if (participants) {
          const templateKey = response === 'approved' ? 'reschedule_request_approved' : 'reschedule_request_declined';
          const isStudent = participants.student_id === request.requested_by;
          const recipientName = isStudent ? participants.student?.full_name : participants.tutor?.full_name;

          await notificationService.createNotification({
            templateKey,
            recipientId: request.requested_by,
            senderId: currentUser.id,
            variables: {
              recipient_name: recipientName || 'Unknown User',
              subject: participants.subject?.name || 'Unknown Subject',
              original_date: new Date(request.original_date).toLocaleString(),
              new_date: request.proposed_date ? new Date(request.proposed_date).toLocaleString() : '',
              decline_reason: responseNotes || 'No reason provided'
            },
            relatedLessonId: request.lesson_id,
            relatedRequestId: requestId,
            customPriority: 'medium'
          });

          console.log('📧 Response notification sent successfully');
        }
      } catch (notificationError) {
        console.error('❌ Error sending response notification:', notificationError);
        // Don't fail the response if notification fails
      }

      // Stop timeout monitoring since request has been responded to
      timeoutService.clearMonitor(requestId);
      console.log(`⏹️ Stopped timeout monitoring for request ${requestId}`);

      // Create audit trail entry
      try {
        await auditTrailService.auditRescheduleResponse(
          request.lesson_id,
          requestId,
          response,
          currentUser.id,
          responseNotes,
          {
            response_time_hours: (Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60),
            was_within_24h: (new Date(request.original_date).getTime() - Date.now()) / (1000 * 60 * 60) <= 24
          }
        );
      } catch (auditError) {
        console.error('❌ Error creating audit trail entry:', auditError);
        // Don't fail the response if audit fails
      }

      console.log('✅ Reschedule request response recorded successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error responding to reschedule request:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Create a counter proposal
  async createCounterProposal(requestData: {
    originalRequestId: string;
    proposedDate: Date;
    proposedDuration: number;
    reason?: string;
  }): Promise<{ success: boolean; proposal?: CounterProposal; error?: string }> {
    try {
      console.log('📝 Creating counter proposal:', requestData);

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: proposal, error } = await supabase
        .from('counter_proposals')
        .insert({
          original_request_id: requestData.originalRequestId,
          proposed_by: currentUser.id,
          proposed_date: requestData.proposedDate.toISOString(),
          proposed_duration: requestData.proposedDuration,
          reason: requestData.reason
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating counter proposal:', error);
        return { success: false, error: error.message };
      }

      // Update original request status
      await supabase
        .from('session_reschedule_requests')
        .update({ status: 'counter_proposed' })
        .eq('id', requestData.originalRequestId);

      console.log('✅ Counter proposal created successfully');
      return { success: true, proposal };
    } catch (error) {
      console.error('❌ Unexpected error creating counter proposal:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Get reschedule requests for a user
  async getUserRescheduleRequests(userId: string, userRole: 'student' | 'tutor' | 'admin'): Promise<RescheduleRequestWithDetails[]> {
    try {
      console.log('🔍 Fetching reschedule requests for user:', userId, userRole);

      let query = supabase
        .from('session_reschedule_requests')
        .select(`
          *,
          lessons!inner(
            student_id,
            tutor_id,
            subject_id,
            subjects(name),
            student:profiles!lessons_student_id_fkey(full_name),
            tutor:profiles!lessons_tutor_id_fkey(full_name)
          ),
          requester:profiles!session_reschedule_requests_requested_by_fkey(full_name)
        `);

      // Filter based on user role
      if (userRole === 'student') {
        query = query.eq('lessons.student_id', userId);
      } else if (userRole === 'tutor') {
        query = query.eq('lessons.tutor_id', userId);
      }
      // Admin can see all requests (no filter)

      query = query.order('created_at', { ascending: false });

      const { data: requests, error } = await query;

      if (error) {
        console.error('❌ Error fetching reschedule requests:', error);
        return [];
      }

      if (!requests || requests.length === 0) {
        console.log('🔍 No reschedule requests found');
        return [];
      }

      // Transform data
      const transformedRequests = requests.map((request: any) => ({
        ...request,
        lesson_details: {
          student_name: request.lessons?.student?.full_name || 'Unknown Student',
          tutor_name: request.lessons?.tutor?.full_name || 'Unknown Tutor',
          subject_name: request.lessons?.subjects?.name || 'Unknown Subject'
        },
        requester_name: request.requester?.full_name || 'Unknown User'
      }));

      console.log('✅ Found reschedule requests:', transformedRequests.length);
      return transformedRequests;
    } catch (error) {
      console.error('❌ Unexpected error fetching reschedule requests:', error);
      return [];
    }
  },

  // Get session change history
  async getSessionChangeHistory(lessonId: string): Promise<SessionChangeHistory[]> {
    try {
      const { data: history, error } = await supabase
        .from('session_change_history')
        .select(`
          *,
          changer:profiles!session_change_history_changed_by_fkey(full_name)
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching change history:', error);
        return [];
      }

      return history || [];
    } catch (error) {
      console.error('❌ Unexpected error fetching change history:', error);
      return [];
    }
  },

  // Check for expired requests and escalate to admin
  async processExpiredRequests(): Promise<{ escalatedCount: number }> {
    try {
      console.log('🔍 Processing expired reschedule requests...');

      // Call the database function to escalate expired requests
      const { error } = await supabase.rpc('escalate_expired_requests');

      if (error) {
        console.error('❌ Error escalating expired requests:', error);
        return { escalatedCount: 0 };
      }

      // Get count of escalated requests
      const { data: escalatedRequests } = await supabase
        .from('session_reschedule_requests')
        .select('id')
        .eq('admin_escalated', true)
        .eq('status', 'admin_required');

      const escalatedCount = escalatedRequests?.length || 0;
      console.log('✅ Escalated expired requests:', escalatedCount);

      return { escalatedCount };
    } catch (error) {
      console.error('❌ Unexpected error processing expired requests:', error);
      return { escalatedCount: 0 };
    }
  },

  // Respond to a counter proposal
  async respondToCounterProposal(
    proposalId: string,
    response: 'accepted' | 'declined',
    responseNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Responding to counter proposal:', { proposalId, response, responseNotes });

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the counter proposal
      const { data: proposal, error: proposalError } = await supabase
        .from('counter_proposals')
        .select('*, original_request:session_reschedule_requests(*)')
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposal) {
        return { success: false, error: 'Counter proposal not found' };
      }

      // Update the counter proposal
      const { error: updateError } = await supabase
        .from('counter_proposals')
        .update({
          status: response,
          responded_by: currentUser.id,
          responded_at: new Date().toISOString(),
          response_notes: responseNotes
        })
        .eq('id', proposalId);

      if (updateError) {
        console.error('❌ Error updating counter proposal:', updateError);
        return { success: false, error: updateError.message };
      }

      // If accepted, update the original lesson and request
      if (response === 'accepted') {
        // Update the lesson with the counter-proposed time
        await supabase
          .from('lessons')
          .update({
            scheduled_at: proposal.proposed_date,
            duration_minutes: proposal.proposed_duration,
            detailed_status: 'rescheduled',
            last_modified_by: currentUser.id
          })
          .eq('id', proposal.original_request.lesson_id);

        // Update the original reschedule request
        await supabase
          .from('session_reschedule_requests')
          .update({
            status: 'approved',
            approved_by: currentUser.id,
            approved_at: new Date().toISOString(),
            approver_response: `Counter proposal accepted: ${responseNotes || 'No additional notes'}`
          })
          .eq('id', proposal.original_request_id);
      }

      console.log('✅ Counter proposal response recorded successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error responding to counter proposal:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Get counter proposals for a user
  async getUserCounterProposals(userId: string, userRole: 'student' | 'tutor' | 'admin'): Promise<CounterProposal[]> {
    try {
      console.log('🔍 Fetching counter proposals for user:', userId, userRole);

      let query = supabase
        .from('counter_proposals')
        .select(`
          *,
          original_request:session_reschedule_requests!inner(
            *,
            lessons!inner(
              student_id,
              tutor_id,
              subject_id,
              subjects(name),
              student:profiles!lessons_student_id_fkey(full_name),
              tutor:profiles!lessons_tutor_id_fkey(full_name)
            )
          ),
          proposer:profiles!counter_proposals_proposed_by_fkey(full_name)
        `);

      // Filter based on user role and involvement
      if (userRole === 'student') {
        query = query.or('original_request.lessons.student_id.eq.' + userId + ',proposed_by.eq.' + userId);
      } else if (userRole === 'tutor') {
        query = query.or('original_request.lessons.tutor_id.eq.' + userId + ',proposed_by.eq.' + userId);
      }
      // Admin can see all proposals (no filter)

      query = query.order('created_at', { ascending: false });

      const { data: proposals, error } = await query;

      if (error) {
        console.error('❌ Error fetching counter proposals:', error);
        return [];
      }

      return proposals || [];
    } catch (error) {
      console.error('❌ Unexpected error fetching counter proposals:', error);
      return [];
    }
  },

  // Admin functions
  async adminRespondToRequest(
    requestId: string,
    decision: 'approved' | 'declined',
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('👨‍💼 Admin responding to request:', { requestId, decision, adminNotes });

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the reschedule request
      const { data: request, error: requestError } = await supabase
        .from('session_reschedule_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) {
        return { success: false, error: 'Reschedule request not found' };
      }

      // Update the request
      const { error } = await supabase
        .from('session_reschedule_requests')
        .update({
          admin_decision: decision,
          admin_notes: adminNotes,
          status: decision,
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Error updating admin decision:', error);
        return { success: false, error: error.message };
      }

      // If approved, update the lesson
      if (decision === 'approved') {
        const updateData: any = {
          detailed_status: request.request_type === 'cancel' ? 'cancelled' : 'rescheduled',
          last_modified_by: currentUser.id
        };

        // Update lesson date if it's a reschedule
        if (request.request_type === 'reschedule' && request.proposed_date) {
          updateData.scheduled_at = request.proposed_date;
          updateData.duration_minutes = request.proposed_duration || request.original_duration;
        }

        await supabase
          .from('lessons')
          .update(updateData)
          .eq('id', request.lesson_id);

        // Check if cancellation is within 4 hours (mark as lost)
        if (request.request_type === 'cancel') {
          const lessonDate = new Date(request.original_date);
          const hoursUntilLesson = (lessonDate.getTime() - Date.now()) / (1000 * 60 * 60);
          
          if (hoursUntilLesson <= 4) {
            await supabase
              .from('lessons')
              .update({ detailed_status: 'lost' })
              .eq('id', request.lesson_id);
          }
        }
      } else {
        // If declined, revert lesson status
        await supabase
          .from('lessons')
          .update({ 
            detailed_status: 'scheduled',
            last_modified_by: currentUser.id
          })
          .eq('id', request.lesson_id);
      }

      // Stop timeout monitoring since admin has responded
      timeoutService.clearMonitor(requestId);
      console.log(`⏹️ Stopped timeout monitoring for admin request ${requestId}`);

      // Send notification to the original requester
      try {
        // Get participant details
        const { data: participants } = await supabase
          .from('lessons')
          .select(`
            *,
            student:profiles!lessons_student_id_fkey(id, full_name),
            tutor:profiles!lessons_tutor_id_fkey(id, full_name),
            subject:subjects(name)
          `)
          .eq('id', request.lesson_id)
          .single();

        if (participants) {
          const templateKey = decision === 'approved' ? 'reschedule_request_approved' : 'reschedule_request_declined';
          const isStudent = participants.student_id === request.requested_by;
          const recipientName = isStudent ? participants.student?.full_name : participants.tutor?.full_name;

          await notificationService.createNotification({
            templateKey,
            recipientId: request.requested_by,
            senderId: currentUser.id,
            variables: {
              recipient_name: recipientName || 'Unknown User',
              subject: participants.subject?.name || 'Unknown Subject',
              original_date: new Date(request.original_date).toLocaleString(),
              new_date: request.proposed_date ? new Date(request.proposed_date).toLocaleString() : '',
              decline_reason: adminNotes || 'Admin decision - no additional reason provided'
            },
            relatedLessonId: request.lesson_id,
            relatedRequestId: requestId,
            customPriority: 'high'
          });

          console.log('📧 Admin decision notification sent successfully');
        }
      } catch (notificationError) {
        console.error('❌ Error sending admin decision notification:', notificationError);
        // Don't fail the admin response if notification fails
      }

      // Create audit trail entry for admin override
      try {
        await auditTrailService.auditAdminOverride(
          request.lesson_id,
          requestId,
          decision,
          currentUser.id,
          adminNotes,
          {
            escalated_from_timeout: request.admin_escalated,
            hours_until_lesson: (new Date(request.original_date).getTime() - Date.now()) / (1000 * 60 * 60),
            override_timestamp: new Date().toISOString()
          }
        );
      } catch (auditError) {
        console.error('❌ Error creating audit trail entry:', auditError);
        // Don't fail admin response if audit fails
      }

      console.log('✅ Admin decision recorded successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error recording admin decision:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
};