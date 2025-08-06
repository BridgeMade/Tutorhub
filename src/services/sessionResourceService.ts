import { supabase } from '../lib/supabase';
import { resourceRecommendationService } from './resourceRecommendationService';
import { handleError } from '../utils/errorHandler';
import { emailService } from './emailService';

export interface SessionResource {
  id: string;
  session_id: string;
  resource_id: string;
  assigned_by: string;
  assignment_type: 'preparation' | 'reference' | 'homework' | 'follow_up';
  is_required: boolean;
  assigned_at: string;
  notes?: string;
  resource: {
    id: string;
    title: string;
    description: string;
    file_name: string;
    file_path: string;
    file_size: number;
    difficulty_level: string;
    estimated_time_minutes: number;
    category: {
      name: string;
      icon: string;
      color: string;
    };
    subject: {
      name: string;
    };
    grade_level: {
      grade_name: string;
    };
  };
}

export interface SessionResourceSuggestion {
  resource_id: string;
  reason: string;
  relevance_score: number;
  resource: {
    title: string;
    description: string;
    difficulty_level: string;
    estimated_time_minutes: number;
  };
}

class SessionResourceService {
  /**
   * Get resources assigned to a specific session
   */
  async getSessionResources(sessionId: string): Promise<SessionResource[]> {
    try {
      const { data, error } = await supabase
        .from('session_resources')
        .select(`
          *,
          resource:resources(
            id,
            title,
            description,
            file_name,
            file_path,
            file_size,
            difficulty_level,
            estimated_time_minutes,
            category:resource_categories(name, icon, color),
            subject:subjects(name),
            grade_level:grade_levels(grade_name)
          )
        `)
        .eq('session_id', sessionId)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error loading session resources:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSessionResources:', error);
      return [];
    }
  }

  /**
   * Assign a resource to a session
   */
  async assignResourceToSession(
    sessionId: string,
    resourceId: string,
    assignedBy: string,
    assignmentType: 'preparation' | 'reference' | 'homework' | 'follow_up',
    isRequired: boolean = false,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if resource is already assigned to this session
      const { data: existing } = await supabase
        .from('session_resources')
        .select('id')
        .eq('session_id', sessionId)
        .eq('resource_id', resourceId)
        .single();

      if (existing) {
        return { success: false, error: 'Resource is already assigned to this session' };
      }

      const { error } = await supabase
        .from('session_resources')
        .insert({
          session_id: sessionId,
          resource_id: resourceId,
          assigned_by: assignedBy,
          assignment_type: assignmentType,
          is_required: isRequired,
          notes: notes
        });

      if (error) {
        const appError = handleError(error, {
          operation: 'assignResourceToSession',
          sessionId,
          resourceId,
          assignedBy
        });
        return { success: false, error: appError.userMessage };
      }

      // Send email notification to student about resource assignment
      try {
        const { data: sessionDetails } = await supabase
          .from('lessons')
          .select(`
            student_id,
            scheduled_at,
            student:profiles!lessons_student_id_fkey(email, full_name),
            tutor:profiles!lessons_tutor_id_fkey(full_name),
            subject:subjects(name)
          `)
          .eq('id', sessionId)
          .single();

        const { data: resourceDetails } = await supabase
          .from('resources')
          .select('title')
          .eq('id', resourceId)
          .single();

        if (sessionDetails?.student?.email && resourceDetails) {
          await emailService.sendResourceAssignedEmail(
            sessionDetails.student.email,
            {
              resourceTitle: resourceDetails.title,
              assignmentType: assignmentType,
              sessionSubject: sessionDetails.subject?.name || 'Unknown Subject',
              sessionDate: sessionDetails.scheduled_at,
              tutorName: sessionDetails.tutor?.full_name || 'Unknown Tutor',
              isRequired: isRequired,
              notes: notes
            }
          );
        }
      } catch (emailError) {
        // Don't fail the assignment if email fails
        console.warn('Failed to send resource assignment email:', emailError);
      }

      return { success: true };
    } catch (error) {
      const appError = handleError(error, {
        operation: 'assignResourceToSession',
        sessionId,
        resourceId,
        assignedBy
      });
      return { success: false, error: appError.userMessage };
    }
  }

  /**
   * Remove a resource assignment from a session
   */
  async removeResourceFromSession(
    sessionResourceId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify the user can remove this assignment (must be the one who assigned it or admin)
      const { data: sessionResource, error: fetchError } = await supabase
        .from('session_resources')
        .select('assigned_by')
        .eq('id', sessionResourceId)
        .single();

      if (fetchError || !sessionResource) {
        return { success: false, error: 'Session resource not found' };
      }

      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (sessionResource.assigned_by !== userId && userProfile?.role !== 'admin') {
        return { success: false, error: 'You can only remove resources you assigned' };
      }

      const { error } = await supabase
        .from('session_resources')
        .delete()
        .eq('id', sessionResourceId);

      if (error) {
        console.error('Error removing resource from session:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in removeResourceFromSession:', error);
      return { success: false, error: 'Failed to remove resource' };
    }
  }

  /**
   * Get resource suggestions for a session based on subject, grade, and student profile
   */
  async getSessionResourceSuggestions(
    sessionId: string,
    suggestionsType: 'preparation' | 'follow_up' = 'preparation'
  ): Promise<SessionResourceSuggestion[]> {
    try {
      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('lessons')
        .select(`
          student_id,
          subject_id,
          duration_minutes,
          notes,
          subjects(name),
          student_profile:profiles!lessons_student_id_fkey(grade_level)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Error loading session for suggestions:', sessionError);
        return [];
      }

      // Get student's learning profile for personalized suggestions
      const recommendations = await resourceRecommendationService.getPersonalizedRecommendations(
        session.student_id,
        {
          maxRecommendations: 8,
          minRating: 3.0,
          excludeDownloaded: false,
          timeConstraint: suggestionsType === 'preparation' ? session.duration_minutes * 2 : undefined
        }
      );

      // Convert recommendations to suggestions with session context
      const suggestions: SessionResourceSuggestion[] = recommendations.map(rec => ({
        resource_id: rec.id,
        reason: this.getSessionSpecificReason(rec, session, suggestionsType),
        relevance_score: rec.recommendation_score,
        resource: {
          title: rec.title,
          description: rec.description,
          difficulty_level: rec.difficulty_level,
          estimated_time_minutes: rec.estimated_time_minutes
        }
      }));

      // Sort by relevance score
      suggestions.sort((a, b) => b.relevance_score - a.relevance_score);

      return suggestions.slice(0, 6); // Return top 6 suggestions
    } catch (error) {
      console.error('Error in getSessionResourceSuggestions:', error);
      return [];
    }
  }

  /**
   * Get all resources assigned to sessions by a specific tutor
   */
  async getTutorSessionResources(
    tutorId: string,
    limit: number = 20
  ): Promise<SessionResource[]> {
    try {
      const { data, error } = await supabase
        .from('session_resources')
        .select(`
          *,
          resource:resources(
            id,
            title,
            description,
            file_name,
            file_path,
            file_size,
            difficulty_level,
            estimated_time_minutes,
            category:resource_categories(name, icon, color),
            subject:subjects(name),
            grade_level:grade_levels(grade_name)
          ),
          session:lessons(
            id,
            scheduled_at,
            student_profile:profiles!lessons_student_id_fkey(full_name),
            subject:subjects(name)
          )
        `)
        .eq('assigned_by', tutorId)
        .order('assigned_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error loading tutor session resources:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTutorSessionResources:', error);
      return [];
    }
  }

  /**
   * Get resource usage analytics for sessions
   */
  async getSessionResourceAnalytics(sessionId: string): Promise<{
    totalResources: number;
    byType: { [key: string]: number };
    completionRate: number;
    averageTimeSpent: number;
  }> {
    try {
      const resources = await this.getSessionResources(sessionId);
      
      const analytics = {
        totalResources: resources.length,
        byType: resources.reduce((acc, resource) => {
          acc[resource.assignment_type] = (acc[resource.assignment_type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }),
        completionRate: 0, // TODO: Track resource completion
        averageTimeSpent: resources.reduce((total, resource) => 
          total + (resource.resource.estimated_time_minutes || 0), 0
        ) / (resources.length || 1)
      };

      return analytics;
    } catch (error) {
      console.error('Error in getSessionResourceAnalytics:', error);
      return {
        totalResources: 0,
        byType: {},
        completionRate: 0,
        averageTimeSpent: 0
      };
    }
  }

  /**
   * Bulk assign multiple resources to a session
   */
  async bulkAssignResources(
    sessionId: string,
    assignments: {
      resourceId: string;
      assignmentType: 'preparation' | 'reference' | 'homework' | 'follow_up';
      isRequired: boolean;
      notes?: string;
    }[],
    assignedBy: string
  ): Promise<{ success: boolean; error?: string; assignedCount: number }> {
    try {
      let assignedCount = 0;
      
      for (const assignment of assignments) {
        const result = await this.assignResourceToSession(
          sessionId,
          assignment.resourceId,
          assignedBy,
          assignment.assignmentType,
          assignment.isRequired,
          assignment.notes
        );
        
        if (result.success) {
          assignedCount++;
        }
      }

      return {
        success: assignedCount > 0,
        assignedCount,
        error: assignedCount === 0 ? 'No resources were assigned' : undefined
      };
    } catch (error) {
      console.error('Error in bulkAssignResources:', error);
      return { success: false, error: 'Failed to assign resources', assignedCount: 0 };
    }
  }

  /**
   * Helper method to generate session-specific resource recommendation reasons
   */
  private getSessionSpecificReason(
    recommendation: any,
    session: any,
    suggestionsType: 'preparation' | 'follow_up'
  ): string {
    const reasons = [];

    if (suggestionsType === 'preparation') {
      if (recommendation.estimated_time_minutes <= session.duration_minutes) {
        reasons.push('Good for session preparation');
      }
      if (recommendation.difficulty_level === 'beginner') {
        reasons.push('Great foundation material');
      }
    } else {
      if (recommendation.difficulty_level === 'intermediate' || recommendation.difficulty_level === 'advanced') {
        reasons.push('Perfect for follow-up learning');
      }
      reasons.push('Reinforces session concepts');
    }

    if (recommendation.subject.name === session.subjects?.name) {
      reasons.push('Matches session subject');
    }

    if (recommendation.rating_average > 4.0) {
      reasons.push('Highly rated by students');
    }

    return reasons.length > 0 ? reasons[0] : 'Recommended for this session';
  }
}

export const sessionResourceService = new SessionResourceService();