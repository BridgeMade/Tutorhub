import { supabase } from '../lib/supabase';

export interface AuditTrailEntry {
  id: string;
  lesson_id: string;
  action_type: 'created' | 'updated' | 'deleted' | 'status_changed' | 'rescheduled' | 'cancelled' | 'restored';
  entity_type: 'lesson' | 'reschedule_request' | 'counter_proposal' | 'notification' | 'user_action';
  entity_id: string;
  performed_by: string;
  performed_at: string;
  old_values?: any;
  new_values?: any;
  changes_summary: string;
  reason?: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditTrailEntryWithDetails extends AuditTrailEntry {
  user_name: string;
  user_role: string;
  lesson_subject?: string;
  lesson_student?: string;
  lesson_tutor?: string;
}

export interface AuditFilter {
  lessonId?: string;
  userId?: string;
  actionTypes?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export const auditTrailService = {
  // Create audit trail entry
  async createAuditEntry(entry: Omit<AuditTrailEntry, 'id' | 'performed_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Creating audit trail entry:', entry.action_type);

      const { error } = await supabase
        .from('session_audit_trail')
        .insert({
          lesson_id: entry.lesson_id,
          action_type: entry.action_type,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          performed_by: entry.performed_by,
          old_values: entry.old_values,
          new_values: entry.new_values,
          changes_summary: entry.changes_summary,
          reason: entry.reason,
          metadata: entry.metadata,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent
        });

      if (error) {
        console.error('❌ Error creating audit entry:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Audit trail entry created successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error creating audit entry:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  },

  // Get audit trail for a specific lesson
  async getLessonAuditTrail(lessonId: string, limit: number = 50): Promise<AuditTrailEntryWithDetails[]> {
    try {
      console.log('🔍 Fetching audit trail for lesson:', lessonId);

      const { data: entries, error } = await supabase
        .from('session_audit_trail')
        .select(`
          *,
          user:profiles!session_audit_trail_performed_by_fkey(full_name, role),
          lesson:lessons!session_audit_trail_lesson_id_fkey(
            subject:subjects(name),
            student:profiles!lessons_student_id_fkey(full_name),
            tutor:profiles!lessons_tutor_id_fkey(full_name)
          )
        `)
        .eq('lesson_id', lessonId)
        .order('performed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching lesson audit trail:', error);
        return [];
      }

      return (entries || []).map((entry: any) => ({
        ...entry,
        user_name: entry.user?.full_name || 'Unknown User',
        user_role: entry.user?.role || 'unknown',
        lesson_subject: entry.lesson?.subject?.name,
        lesson_student: entry.lesson?.student?.full_name,
        lesson_tutor: entry.lesson?.tutor?.full_name
      }));
    } catch (error) {
      console.error('❌ Unexpected error fetching lesson audit trail:', error);
      return [];
    }
  },

  // Get audit trail with advanced filtering
  async getAuditTrail(filter: AuditFilter = {}): Promise<AuditTrailEntryWithDetails[]> {
    try {
      console.log('🔍 Fetching audit trail with filter:', filter);

      let query = supabase
        .from('session_audit_trail')
        .select(`
          *,
          user:profiles!session_audit_trail_performed_by_fkey(full_name, role),
          lesson:lessons!session_audit_trail_lesson_id_fkey(
            subject:subjects(name),
            student:profiles!lessons_student_id_fkey(full_name),
            tutor:profiles!lessons_tutor_id_fkey(full_name)
          )
        `);

      // Apply filters
      if (filter.lessonId) {
        query = query.eq('lesson_id', filter.lessonId);
      }

      if (filter.userId) {
        query = query.eq('performed_by', filter.userId);
      }

      if (filter.actionTypes && filter.actionTypes.length > 0) {
        query = query.in('action_type', filter.actionTypes);
      }

      if (filter.dateFrom) {
        query = query.gte('performed_at', filter.dateFrom.toISOString());
      }

      if (filter.dateTo) {
        query = query.lte('performed_at', filter.dateTo.toISOString());
      }

      query = query.order('performed_at', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data: entries, error } = await query;

      if (error) {
        console.error('❌ Error fetching audit trail:', error);
        return [];
      }

      return (entries || []).map((entry: any) => ({
        ...entry,
        user_name: entry.user?.full_name || 'Unknown User',
        user_role: entry.user?.role || 'unknown',
        lesson_subject: entry.lesson?.subject?.name,
        lesson_student: entry.lesson?.student?.full_name,
        lesson_tutor: entry.lesson?.tutor?.full_name
      }));
    } catch (error) {
      console.error('❌ Unexpected error fetching audit trail:', error);
      return [];
    }
  },

  // Get audit statistics
  async getAuditStatistics(filter: Omit<AuditFilter, 'limit' | 'offset'> = {}): Promise<{
    totalEntries: number;
    actionBreakdown: Record<string, number>;
    userBreakdown: Record<string, number>;
    timeRange: { earliest: string; latest: string };
  }> {
    try {
      let query = supabase
        .from('session_audit_trail')
        .select(`
          action_type,
          performed_by,
          performed_at,
          user:profiles!session_audit_trail_performed_by_fkey(full_name)
        `);

      // Apply filters
      if (filter.lessonId) {
        query = query.eq('lesson_id', filter.lessonId);
      }

      if (filter.userId) {
        query = query.eq('performed_by', filter.userId);
      }

      if (filter.actionTypes && filter.actionTypes.length > 0) {
        query = query.in('action_type', filter.actionTypes);
      }

      if (filter.dateFrom) {
        query = query.gte('performed_at', filter.dateFrom.toISOString());
      }

      if (filter.dateTo) {
        query = query.lte('performed_at', filter.dateTo.toISOString());
      }

      const { data: entries, error } = await query;

      if (error) {
        console.error('❌ Error fetching audit statistics:', error);
        return {
          totalEntries: 0,
          actionBreakdown: {},
          userBreakdown: {},
          timeRange: { earliest: '', latest: '' }
        };
      }

      const stats = {
        totalEntries: entries?.length || 0,
        actionBreakdown: {} as Record<string, number>,
        userBreakdown: {} as Record<string, number>,
        timeRange: { earliest: '', latest: '' }
      };

      if (entries && entries.length > 0) {
        // Calculate action breakdown
        entries.forEach((entry: any) => {
          stats.actionBreakdown[entry.action_type] = (stats.actionBreakdown[entry.action_type] || 0) + 1;
          
          const userName = entry.user?.full_name || 'Unknown User';
          stats.userBreakdown[userName] = (stats.userBreakdown[userName] || 0) + 1;
        });

        // Calculate time range
        const dates = entries.map((e: any) => new Date(e.performed_at)).sort((a: Date, b: Date) => a.getTime() - b.getTime());
        stats.timeRange.earliest = dates[0].toISOString();
        stats.timeRange.latest = dates[dates.length - 1].toISOString();
      }

      return stats;
    } catch (error) {
      console.error('❌ Unexpected error fetching audit statistics:', error);
      return {
        totalEntries: 0,
        actionBreakdown: {},
        userBreakdown: {},
        timeRange: { earliest: '', latest: '' }
      };
    }
  },

  // Audit lesson creation
  async auditLessonCreated(
    lessonId: string,
    lessonData: any,
    createdBy: string,
    metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    return this.createAuditEntry({
      lesson_id: lessonId,
      action_type: 'created',
      entity_type: 'lesson',
      entity_id: lessonId,
      performed_by: createdBy,
      new_values: lessonData,
      changes_summary: `Lesson created: ${lessonData.subject} session scheduled for ${new Date(lessonData.scheduled_at).toLocaleString()}`,
      reason: 'New lesson booking',
      metadata
    });
  },

  // Audit lesson update
  async auditLessonUpdated(
    lessonId: string,
    oldValues: any,
    newValues: any,
    updatedBy: string,
    reason?: string,
    metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    // Generate changes summary
    const changes: string[] = [];
    
    for (const [key, newValue] of Object.entries(newValues)) {
      const oldValue = oldValues[key];
      if (oldValue !== newValue) {
        if (key === 'scheduled_at') {
          changes.push(`Date changed from ${new Date(oldValue as string).toLocaleString()} to ${new Date(newValue as string).toLocaleString()}`);
        } else if (key === 'detailed_status') {
          changes.push(`Status changed from ${oldValue} to ${newValue}`);
        } else {
          changes.push(`${key} changed from "${oldValue}" to "${newValue}"`);
        }
      }
    }

    return this.createAuditEntry({
      lesson_id: lessonId,
      action_type: 'updated',
      entity_type: 'lesson',
      entity_id: lessonId,
      performed_by: updatedBy,
      old_values: oldValues,
      new_values: newValues,
      changes_summary: changes.length > 0 ? changes.join(', ') : 'Lesson details updated',
      reason,
      metadata
    });
  },

  // Audit reschedule request
  async auditRescheduleRequest(
    lessonId: string,
    requestId: string,
    requestData: any,
    requestedBy: string,
    metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    return this.createAuditEntry({
      lesson_id: lessonId,
      action_type: 'created',
      entity_type: 'reschedule_request',
      entity_id: requestId,
      performed_by: requestedBy,
      new_values: requestData,
      changes_summary: `Reschedule request submitted: ${requestData.request_type} with reason "${requestData.reason}"`,
      reason: requestData.reason,
      metadata
    });
  },

  // Audit reschedule response
  async auditRescheduleResponse(
    lessonId: string,
    requestId: string,
    response: 'approved' | 'declined',
    respondedBy: string,
    responseNotes?: string,
    metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    return this.createAuditEntry({
      lesson_id: lessonId,
      action_type: 'updated',
      entity_type: 'reschedule_request',
      entity_id: requestId,
      performed_by: respondedBy,
      new_values: { response, response_notes: responseNotes },
      changes_summary: `Reschedule request ${response}${responseNotes ? ` with note: "${responseNotes}"` : ''}`,
      reason: responseNotes,
      metadata
    });
  },

  // Audit admin override
  async auditAdminOverride(
    lessonId: string,
    requestId: string,
    decision: 'approved' | 'declined',
    adminId: string,
    adminNotes?: string,
    metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    return this.createAuditEntry({
      lesson_id: lessonId,
      action_type: 'updated',
      entity_type: 'reschedule_request',
      entity_id: requestId,
      performed_by: adminId,
      new_values: { admin_decision: decision, admin_notes: adminNotes },
      changes_summary: `Admin ${decision} 24-hour override request${adminNotes ? ` with note: "${adminNotes}"` : ''}`,
      reason: `Admin override: ${adminNotes || 'No additional notes'}`,
      metadata: { ...metadata, admin_override: true }
    });
  },

  // Audit timeout escalation
  async auditTimeoutEscalation(
    lessonId: string,
    requestId: string,
    escalatedBy: string = 'system',
    metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    return this.createAuditEntry({
      lesson_id: lessonId,
      action_type: 'status_changed',
      entity_type: 'reschedule_request',
      entity_id: requestId,
      performed_by: escalatedBy,
      new_values: { status: 'admin_required', admin_escalated: true },
      changes_summary: 'Request escalated to admin due to 4-hour timeout',
      reason: '4-hour response deadline exceeded',
      metadata: { ...metadata, automatic_escalation: true, escalation_time: new Date().toISOString() }
    });
  },

  // Get action type display information
  getActionTypeDisplay(actionType: string): {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
  } {
    const actionConfig = {
      created: {
        label: 'Created',
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200',
        icon: '✨'
      },
      updated: {
        label: 'Updated',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200',
        icon: '✏️'
      },
      deleted: {
        label: 'Deleted',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
        icon: '❌'
      },
      status_changed: {
        label: 'Status Changed',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50 border-purple-200',
        icon: '🔄'
      },
      rescheduled: {
        label: 'Rescheduled',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200',
        icon: '📅'
      },
      cancelled: {
        label: 'Cancelled',
        color: 'text-gray-700',
        bgColor: 'bg-gray-50 border-gray-200',
        icon: '🚫'
      },
      restored: {
        label: 'Restored',
        color: 'text-teal-700',
        bgColor: 'bg-teal-50 border-teal-200',
        icon: '♻️'
      }
    };

    return actionConfig[actionType as keyof typeof actionConfig] || actionConfig.updated;
  }
};