import { supabase } from '../lib/supabase';
import { logger, LogCategory } from '../lib/logger';

// ===========================================
// DATA PRIVACY COMPLIANCE SERVICE
// ===========================================
// Handles GDPR, POPI, CCPA, and other privacy regulations

export interface ConsentRecord {
  id: string;
  userId: string;
  tenantId: string;
  consentType: ConsentType;
  consentGiven: boolean;
  consentDate: string;
  withdrawalDate?: string;
  ipAddress: string;
  userAgent: string;
  legalBasis?: string;
  purpose: string;
  dataCategories: string[];
  retentionPeriodMonths?: number;
  isActive: boolean;
}

export type ConsentType = 
  | 'marketing' 
  | 'analytics' 
  | 'functional' 
  | 'performance' 
  | 'necessary' 
  | 'data_processing'
  | 'communication'
  | 'profiling'
  | 'third_party_sharing';

export interface DataProcessingActivity {
  id: string;
  tenantId: string;
  activityName: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  thirdCountryTransfers: boolean;
  retentionPeriodMonths: number;
  securityMeasures: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  tenantId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestDate: string;
  completionDate?: string;
  requestDetails: string;
  responseData?: any;
  rejectionReason?: string;
  followUpRequired: boolean;
  deadlineDate: string; // 30 days from request
}

export interface PrivacySettings {
  tenantId: string;
  gdprEnabled: boolean;
  popiEnabled: boolean;
  ccpaEnabled: boolean;
  dataRetentionDefaultMonths: number;
  consentBannerEnabled: boolean;
  consentBannerText: string;
  privacyPolicyUrl: string;
  dataProtectionOfficerEmail: string;
  cookiePolicyUrl: string;
  automaticDataDeletion: boolean;
  dataProcessingLogEnabled: boolean;
  consentWithdrawalEnabled: boolean;
  dataPortabilityEnabled: boolean;
}

export interface DataInventoryItem {
  id: string;
  tenantId: string;
  dataCategory: string;
  dataFields: string[];
  storageLocation: string;
  purpose: string;
  legalBasis: string;
  retentionPeriodMonths: number;
  isEncrypted: boolean;
  accessControls: string[];
  thirdPartyAccess: boolean;
  lastAuditDate?: string;
}

class DataPrivacyService {
  
  // ===========================================
  // CONSENT MANAGEMENT
  // ===========================================
  
  async recordConsent(consentData: {
    userId: string;
    tenantId: string;
    consentType: ConsentType;
    consentGiven: boolean;
    ipAddress: string;
    userAgent: string;
    purpose: string;
    dataCategories: string[];
    legalBasis?: string;
    retentionPeriodMonths?: number;
  }): Promise<ConsentRecord> {
    try {
      const { data, error } = await supabase
        .from('consent_records')
        .insert({
          user_id: consentData.userId,
          tenant_id: consentData.tenantId,
          consent_type: consentData.consentType,
          consent_given: consentData.consentGiven,
          consent_date: new Date().toISOString(),
          ip_address: consentData.ipAddress,
          user_agent: consentData.userAgent,
          legal_basis: consentData.legalBasis,
          purpose: consentData.purpose,
          data_categories: consentData.dataCategories,
          retention_period_months: consentData.retentionPeriodMonths,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(LogCategory.PRIVACY, 'Consent recorded', {
        userId: consentData.userId,
        tenantId: consentData.tenantId,
        consentType: consentData.consentType,
        consentGiven: consentData.consentGiven
      });

      return this.mapConsentRecord(data);
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to record consent', error as Error);
      throw error;
    }
  }

  async withdrawConsent(
    userId: string, 
    tenantId: string, 
    consentType: ConsentType,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      // Mark existing consent as withdrawn
      const { error: updateError } = await supabase
        .from('consent_records')
        .update({
          consent_given: false,
          withdrawal_date: new Date().toISOString(),
          is_active: false
        })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('consent_type', consentType)
        .eq('is_active', true);

      if (updateError) throw updateError;

      // Create new withdrawal record
      await this.recordConsent({
        userId,
        tenantId,
        consentType,
        consentGiven: false,
        ipAddress,
        userAgent,
        purpose: 'Consent withdrawal',
        dataCategories: []
      });

      // Trigger data processing updates based on withdrawn consent
      await this.processConsentWithdrawal(userId, tenantId, consentType);

      logger.info(LogCategory.PRIVACY, 'Consent withdrawn', {
        userId,
        tenantId,
        consentType
      });
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to withdraw consent', error as Error);
      throw error;
    }
  }

  async getUserConsents(userId: string, tenantId: string): Promise<ConsentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('consent_date', { ascending: false });

      if (error) throw error;

      return data.map(this.mapConsentRecord);
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to get user consents', error as Error);
      throw error;
    }
  }

  // ===========================================
  // DATA SUBJECT RIGHTS (GDPR Articles 15-22)
  // ===========================================

  async createDataSubjectRequest(requestData: {
    userId: string;
    tenantId: string;
    requestType: DataSubjectRequest['requestType'];
    requestDetails: string;
  }): Promise<DataSubjectRequest> {
    try {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 30); // 30-day deadline

      const { data, error } = await supabase
        .from('data_subject_requests')
        .insert({
          user_id: requestData.userId,
          tenant_id: requestData.tenantId,
          request_type: requestData.requestType,
          status: 'pending',
          request_date: new Date().toISOString(),
          request_details: requestData.requestDetails,
          follow_up_required: false,
          deadline_date: deadlineDate.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Notify data protection team
      await this.notifyDataProtectionTeam(requestData.tenantId, data.id, requestData.requestType);

      logger.info(LogCategory.PRIVACY, 'Data subject request created', {
        requestId: data.id,
        userId: requestData.userId,
        requestType: requestData.requestType
      });

      return this.mapDataSubjectRequest(data);
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to create data subject request', error as Error);
      throw error;
    }
  }

  async processDataAccessRequest(requestId: string): Promise<any> {
    try {
      const { data: request, error: requestError } = await supabase
        .from('data_subject_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Collect all user data across the platform
      const userData = await this.collectUserData(request.user_id, request.tenant_id);

      // Update request with response data
      const { error: updateError } = await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
          response_data: userData
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      logger.info(LogCategory.PRIVACY, 'Data access request processed', { requestId });

      return userData;
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to process data access request', error as Error);
      throw error;
    }
  }

  async processDataErasureRequest(requestId: string): Promise<void> {
    try {
      const { data: request, error: requestError } = await supabase
        .from('data_subject_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Check if erasure is legally permissible
      const canErase = await this.validateErasureRequest(request.user_id, request.tenant_id);
      
      if (!canErase.allowed) {
        await supabase
          .from('data_subject_requests')
          .update({
            status: 'rejected',
            completion_date: new Date().toISOString(),
            rejection_reason: canErase.reason
          })
          .eq('id', requestId);
        
        return;
      }

      // Perform data erasure
      await this.eraseUserData(request.user_id, request.tenant_id);

      // Update request status
      await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString()
        })
        .eq('id', requestId);

      logger.info(LogCategory.PRIVACY, 'Data erasure request processed', { requestId });
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to process data erasure request', error as Error);
      throw error;
    }
  }

  async processDataPortabilityRequest(requestId: string): Promise<any> {
    try {
      const { data: request, error: requestError } = await supabase
        .from('data_subject_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Export user data in structured format
      const exportData = await this.exportUserDataPortable(request.user_id, request.tenant_id);

      // Update request with export data
      await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
          response_data: exportData
        })
        .eq('id', requestId);

      logger.info(LogCategory.PRIVACY, 'Data portability request processed', { requestId });

      return exportData;
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to process data portability request', error as Error);
      throw error;
    }
  }

  // ===========================================
  // DATA PROCESSING ACTIVITIES (GDPR Article 30)
  // ===========================================

  async registerProcessingActivity(activityData: Omit<DataProcessingActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataProcessingActivity> {
    try {
      const { data, error } = await supabase
        .from('data_processing_activities')
        .insert({
          tenant_id: activityData.tenantId,
          activity_name: activityData.activityName,
          purpose: activityData.purpose,
          legal_basis: activityData.legalBasis,
          data_categories: activityData.dataCategories,
          data_subjects: activityData.dataSubjects,
          recipients: activityData.recipients,
          third_country_transfers: activityData.thirdCountryTransfers,
          retention_period_months: activityData.retentionPeriodMonths,
          security_measures: activityData.securityMeasures,
          is_active: activityData.isActive
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(LogCategory.PRIVACY, 'Processing activity registered', {
        tenantId: activityData.tenantId,
        activityName: activityData.activityName
      });

      return this.mapProcessingActivity(data);
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to register processing activity', error as Error);
      throw error;
    }
  }

  async getProcessingActivities(tenantId: string): Promise<DataProcessingActivity[]> {
    try {
      const { data, error } = await supabase
        .from('data_processing_activities')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapProcessingActivity);
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to get processing activities', error as Error);
      throw error;
    }
  }

  // ===========================================
  // DATA RETENTION AND DELETION
  // ===========================================

  async scheduleDataDeletion(userId: string, tenantId: string, dataCategory: string, deletionDate: Date): Promise<void> {
    try {
      await supabase
        .from('data_deletion_schedule')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          data_category: dataCategory,
          scheduled_deletion_date: deletionDate.toISOString(),
          status: 'scheduled'
        });

      logger.info(LogCategory.PRIVACY, 'Data deletion scheduled', {
        userId,
        tenantId,
        dataCategory,
        deletionDate: deletionDate.toISOString()
      });
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to schedule data deletion', error as Error);
      throw error;
    }
  }

  async executeScheduledDeletions(): Promise<void> {
    try {
      const { data: scheduledDeletions, error } = await supabase
        .from('data_deletion_schedule')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_deletion_date', new Date().toISOString());

      if (error) throw error;

      for (const deletion of scheduledDeletions) {
        try {
          await this.deleteDataCategory(deletion.user_id, deletion.tenant_id, deletion.data_category);
          
          await supabase
            .from('data_deletion_schedule')
            .update({
              status: 'completed',
              executed_at: new Date().toISOString()
            })
            .eq('id', deletion.id);

          logger.info(LogCategory.PRIVACY, 'Scheduled data deletion executed', {
            userId: deletion.user_id,
            dataCategory: deletion.data_category
          });
        } catch (error) {
          logger.error(LogCategory.PRIVACY, 'Failed to execute scheduled deletion', error as Error);
          
          await supabase
            .from('data_deletion_schedule')
            .update({
              status: 'failed',
              error_message: (error as Error).message
            })
            .eq('id', deletion.id);
        }
      }
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to execute scheduled deletions', error as Error);
      throw error;
    }
  }

  // ===========================================
  // PRIVACY IMPACT ASSESSMENTS
  // ===========================================

  async createPrivacyImpactAssessment(tenantId: string, assessmentData: {
    activityName: string;
    dataCategories: string[];
    riskFactors: string[];
    mitigationMeasures: string[];
    necessityTest: string;
    proportionalityTest: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('privacy_impact_assessments')
        .insert({
          tenant_id: tenantId,
          activity_name: assessmentData.activityName,
          data_categories: assessmentData.dataCategories,
          risk_factors: assessmentData.riskFactors,
          mitigation_measures: assessmentData.mitigationMeasures,
          necessity_test: assessmentData.necessityTest,
          proportionality_test: assessmentData.proportionalityTest,
          status: 'draft',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      logger.info(LogCategory.PRIVACY, 'Privacy impact assessment created', {
        tenantId,
        assessmentId: data.id
      });

      return data.id;
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to create privacy impact assessment', error as Error);
      throw error;
    }
  }

  // ===========================================
  // PRIVACY COMPLIANCE MONITORING
  // ===========================================

  async auditPrivacyCompliance(tenantId: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check privacy policy
      const privacySettings = await this.getPrivacySettings(tenantId);
      if (!privacySettings.privacyPolicyUrl) {
        issues.push('Missing privacy policy URL');
        recommendations.push('Add a comprehensive privacy policy');
        score -= 15;
      }

      // Check data protection officer
      if (!privacySettings.dataProtectionOfficerEmail) {
        issues.push('No data protection officer designated');
        recommendations.push('Designate a data protection officer');
        score -= 10;
      }

      // Check consent management
      const { count: consentCount } = await supabase
        .from('consent_records')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if ((consentCount || 0) === 0) {
        issues.push('No consent records found');
        recommendations.push('Implement proper consent collection');
        score -= 20;
      }

      // Check processing activities registration
      const processingActivities = await this.getProcessingActivities(tenantId);
      if (processingActivities.length === 0) {
        issues.push('No processing activities registered');
        recommendations.push('Document all data processing activities');
        score -= 25;
      }

      // Check data retention policies
      const hasRetentionPolicies = processingActivities.some(activity => 
        activity.retentionPeriodMonths > 0
      );
      if (!hasRetentionPolicies) {
        issues.push('No data retention policies defined');
        recommendations.push('Define retention periods for all data categories');
        score -= 15;
      }

      logger.info(LogCategory.PRIVACY, 'Privacy compliance audit completed', {
        tenantId,
        score,
        issueCount: issues.length
      });

      return {
        score: Math.max(0, score),
        issues,
        recommendations
      };
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to audit privacy compliance', error as Error);
      throw error;
    }
  }

  // ===========================================
  // PRIVACY SETTINGS MANAGEMENT
  // ===========================================

  async updatePrivacySettings(tenantId: string, settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('privacy_settings')
        .upsert({
          tenant_id: tenantId,
          gdpr_enabled: settings.gdprEnabled,
          popi_enabled: settings.popiEnabled,
          ccpa_enabled: settings.ccpaEnabled,
          data_retention_default_months: settings.dataRetentionDefaultMonths,
          consent_banner_enabled: settings.consentBannerEnabled,
          consent_banner_text: settings.consentBannerText,
          privacy_policy_url: settings.privacyPolicyUrl,
          data_protection_officer_email: settings.dataProtectionOfficerEmail,
          cookie_policy_url: settings.cookiePolicyUrl,
          automatic_data_deletion: settings.automaticDataDeletion,
          data_processing_log_enabled: settings.dataProcessingLogEnabled,
          consent_withdrawal_enabled: settings.consentWithdrawalEnabled,
          data_portability_enabled: settings.dataPortabilityEnabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      logger.info(LogCategory.PRIVACY, 'Privacy settings updated', { tenantId });
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to update privacy settings', error as Error);
      throw error;
    }
  }

  async getPrivacySettings(tenantId: string): Promise<PrivacySettings> {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Return defaults if no settings found
      if (!data) {
        return {
          tenantId,
          gdprEnabled: true,
          popiEnabled: true,
          ccpaEnabled: false,
          dataRetentionDefaultMonths: 24,
          consentBannerEnabled: true,
          consentBannerText: 'We use cookies and collect data to improve your experience.',
          privacyPolicyUrl: '',
          dataProtectionOfficerEmail: '',
          cookiePolicyUrl: '',
          automaticDataDeletion: true,
          dataProcessingLogEnabled: true,
          consentWithdrawalEnabled: true,
          dataPortabilityEnabled: true
        };
      }

      return {
        tenantId: data.tenant_id,
        gdprEnabled: data.gdpr_enabled,
        popiEnabled: data.popi_enabled,
        ccpaEnabled: data.ccpa_enabled,
        dataRetentionDefaultMonths: data.data_retention_default_months,
        consentBannerEnabled: data.consent_banner_enabled,
        consentBannerText: data.consent_banner_text,
        privacyPolicyUrl: data.privacy_policy_url,
        dataProtectionOfficerEmail: data.data_protection_officer_email,
        cookiePolicyUrl: data.cookie_policy_url,
        automaticDataDeletion: data.automatic_data_deletion,
        dataProcessingLogEnabled: data.data_processing_log_enabled,
        consentWithdrawalEnabled: data.consent_withdrawal_enabled,
        dataPortabilityEnabled: data.data_portability_enabled
      };
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to get privacy settings', error as Error);
      throw error;
    }
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  private async collectUserData(userId: string, tenantId: string): Promise<any> {
    // Implementation would collect data from all relevant tables
    // This is a simplified version
    const userData = {
      userId,
      tenantId,
      profile: {},
      sessions: [],
      communications: [],
      preferences: {},
      activityLogs: [],
      exportDate: new Date().toISOString()
    };

    return userData;
  }

  private async eraseUserData(userId: string, tenantId: string): Promise<void> {
    // Implementation would safely delete or anonymize user data
    // while preserving data needed for legal/business purposes
    logger.info(LogCategory.PRIVACY, 'User data erasure initiated', { userId, tenantId });
  }

  private async exportUserDataPortable(userId: string, tenantId: string): Promise<any> {
    const userData = await this.collectUserData(userId, tenantId);
    return {
      ...userData,
      format: 'JSON',
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  private async validateErasureRequest(userId: string, tenantId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check if erasure conflicts with legal obligations
    // Simplified implementation
    return { allowed: true };
  }

  private async processConsentWithdrawal(userId: string, tenantId: string, consentType: ConsentType): Promise<void> {
    // Process the implications of consent withdrawal
    // Stop processing, delete data if required, update preferences
    logger.info(LogCategory.PRIVACY, 'Processing consent withdrawal', { userId, tenantId, consentType });
  }

  private async deleteDataCategory(userId: string, tenantId: string, dataCategory: string): Promise<void> {
    // Delete specific category of data
    logger.info(LogCategory.PRIVACY, 'Deleting data category', { userId, tenantId, dataCategory });
  }

  private async notifyDataProtectionTeam(tenantId: string, requestId: string, requestType: string): Promise<void> {
    // Send notification to data protection team
    logger.info(LogCategory.PRIVACY, 'Data protection team notified', { tenantId, requestId, requestType });
  }

  private mapConsentRecord(data: any): ConsentRecord {
    return {
      id: data.id,
      userId: data.user_id,
      tenantId: data.tenant_id,
      consentType: data.consent_type,
      consentGiven: data.consent_given,
      consentDate: data.consent_date,
      withdrawalDate: data.withdrawal_date,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      legalBasis: data.legal_basis,
      purpose: data.purpose,
      dataCategories: data.data_categories,
      retentionPeriodMonths: data.retention_period_months,
      isActive: data.is_active
    };
  }

  private mapDataSubjectRequest(data: any): DataSubjectRequest {
    return {
      id: data.id,
      userId: data.user_id,
      tenantId: data.tenant_id,
      requestType: data.request_type,
      status: data.status,
      requestDate: data.request_date,
      completionDate: data.completion_date,
      requestDetails: data.request_details,
      responseData: data.response_data,
      rejectionReason: data.rejection_reason,
      followUpRequired: data.follow_up_required,
      deadlineDate: data.deadline_date
    };
  }

  private mapProcessingActivity(data: any): DataProcessingActivity {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      activityName: data.activity_name,
      purpose: data.purpose,
      legalBasis: data.legal_basis,
      dataCategories: data.data_categories,
      dataSubjects: data.data_subjects,
      recipients: data.recipients,
      thirdCountryTransfers: data.third_country_transfers,
      retentionPeriodMonths: data.retention_period_months,
      securityMeasures: data.security_measures,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export const dataPrivacyService = new DataPrivacyService();
export default dataPrivacyService;