import { supabase } from '../lib/supabase';

export interface TutorStudentAssignment {
  id: string;
  tutor_id: string;
  student_id: string;
  subject_id: string;
  assigned_by: string;
  assigned_at: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  notes?: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentWithDetails extends TutorStudentAssignment {
  tutor_name: string;
  tutor_email: string;
  student_name: string;
  student_email: string;
  subject_name: string;
  assigned_by_name: string;
}

export interface CreateAssignmentData {
  tutor_id: string;
  student_id: string;
  subject_id: string;
  notes?: string;
  start_date?: string;
  end_date?: string;
}

export const assignmentService = {
  // Debug function to check what's in the assignments table
  async debugAllAssignments(): Promise<{ data: any[] | null; error: any }> {
    try {
      console.log('🔍 DEBUG: Fetching all assignments from database...');
      const { data, error } = await supabase
        .from('tutor_student_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('🔍 DEBUG: Error fetching assignments:', error);
        console.error('🔍 DEBUG: Error details:', error.message, error.details, error.hint);
        console.error('🔍 DEBUG: Error code:', error.code);
        return { data: null, error };
      }
      
      console.log('🔍 DEBUG: All assignments in database:', data);
      return { data, error: null };
    } catch (error) {
      console.error('🔍 DEBUG: Unexpected error:', error);
      return { data: null, error };
    }
  },

  // Debug function to test assignment creation
  async debugCreateTestAssignment(): Promise<{ data: any | null; error: any }> {
    try {
      console.log('🔍 DEBUG: Testing assignment creation...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('🔍 DEBUG: No authenticated user');
        return { data: null, error: 'No authenticated user' };
      }
      
      console.log('🔍 DEBUG: Current user:', user.id);
      
      // Try to insert a simple test assignment
      const testData = {
        tutor_id: user.id, // Use current user as both tutor and student for testing
        student_id: user.id,
        subject_id: 'test-subject-id',
        assigned_by: user.id,
        status: 'active',
        notes: 'Test assignment'
      };
      
      console.log('🔍 DEBUG: Test insert data:', testData);
      
      const { data, error } = await supabase
        .from('tutor_student_assignments')
        .insert(testData)
        .select()
        .single();
      
      if (error) {
        console.error('🔍 DEBUG: Insert failed:', error);
        return { data: null, error };
      }
      
      console.log('🔍 DEBUG: Insert successful:', data);
      return { data, error: null };
      
    } catch (error) {
      console.error('🔍 DEBUG: Unexpected error:', error);
      return { data: null, error };
    }
  },
  // Get all assignments with details (admin only) - simplified version without complex joins
  async getAllAssignments(): Promise<{ data: AssignmentWithDetails[] | null; error: any }> {
    console.log('🔍 Getting all assignments...');
    
    try {
      // First get all assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('tutor_student_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });
      
      if (assignmentsError) {
        console.error('❌ Error fetching assignments:', assignmentsError);
        return { data: null, error: assignmentsError };
      }
      
      if (!assignments || assignments.length === 0) {
        console.log('🔍 No assignments found');
        return { data: [], error: null };
      }
      
      console.log('🔍 Found assignments:', assignments.length);
      
      // Get all profiles and subjects we need
      const tutorIds = Array.from(new Set(assignments.map((a: any) => a.tutor_id)));
      const studentIds = Array.from(new Set(assignments.map((a: any) => a.student_id)));
      const subjectIds = Array.from(new Set(assignments.map((a: any) => a.subject_id)));
      const assignedByIds = Array.from(new Set(assignments.map((a: any) => a.assigned_by)));
      
      const allProfileIds = Array.from(new Set([...tutorIds, ...studentIds, ...assignedByIds]));
      
      // Fetch profiles and subjects in parallel
      const [profilesResponse, subjectsResponse] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', allProfileIds),
        supabase.from('subjects').select('id, name').in('id', subjectIds)
      ]);
      
      const profiles = profilesResponse.data || [];
      const subjects = subjectsResponse.data || [];
      
      // Transform assignments with profile and subject data
      const transformedData = assignments.map((assignment: any) => {
        const tutorProfile = profiles.find((p: any) => p.id === assignment.tutor_id);
        const studentProfile = profiles.find((p: any) => p.id === assignment.student_id);
        const subject = subjects.find((s: any) => s.id === assignment.subject_id);
        const assignedByProfile = profiles.find((p: any) => p.id === assignment.assigned_by);
        
        return {
          id: assignment.id,
          tutor_id: assignment.tutor_id,
          student_id: assignment.student_id,
          subject_id: assignment.subject_id,
          assigned_by: assignment.assigned_by,
          assigned_at: assignment.assigned_at,
          status: assignment.status,
          notes: assignment.notes,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          created_at: assignment.created_at,
          updated_at: assignment.updated_at,
          tutor_name: tutorProfile?.full_name || 'Unknown Tutor',
          tutor_email: tutorProfile?.email || '',
          student_name: studentProfile?.full_name || 'Unknown Student',
          student_email: studentProfile?.email || '',
          subject_name: subject?.name || 'Unknown Subject',
          assigned_by_name: assignedByProfile?.full_name || 'Unknown Admin'
        };
      });
      
      console.log('🔍 Transformed assignments:', transformedData.length);
      return { data: transformedData, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error in getAllAssignments:', error);
      return { data: null, error };
    }
  },

  // Get assignments for a specific tutor (using profile IDs) - simplified version
  async getTutorAssignments(tutorId: string): Promise<{ data: AssignmentWithDetails[] | null; error: any }> {
    console.log('🔍 Getting assignments for tutor profile ID:', tutorId);
    
    try {
      // Get assignments for this tutor
      const { data: assignments, error: assignmentsError } = await supabase
        .from('tutor_student_assignments')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false });
      
      if (assignmentsError) {
        console.error('❌ Error fetching tutor assignments:', assignmentsError);
        return { data: null, error: assignmentsError };
      }
      
      if (!assignments || assignments.length === 0) {
        console.log('🔍 No assignments found for tutor');
        return { data: [], error: null };
      }
      
      // Get student profiles and subjects
      const studentIds = Array.from(new Set(assignments.map((a: any) => a.student_id)));
      const subjectIds = Array.from(new Set(assignments.map((a: any) => a.subject_id)));
      
      const [profilesResponse, subjectsResponse] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', studentIds),
        supabase.from('subjects').select('id, name').in('id', subjectIds)
      ]);
      
      const profiles = profilesResponse.data || [];
      const subjects = subjectsResponse.data || [];
      
      const transformedData = assignments.map((assignment: any) => {
        const studentProfile = profiles.find((p: any) => p.id === assignment.student_id);
        const subject = subjects.find((s: any) => s.id === assignment.subject_id);
        
        return {
          ...assignment,
          student_name: studentProfile?.full_name || 'Unknown Student',
          student_email: studentProfile?.email || '',
          subject_name: subject?.name || 'Unknown Subject',
          tutor_name: '', // Not needed for tutor view
          tutor_email: '',
          assigned_by_name: ''
        };
      });
      
      console.log('🔍 Transformed tutor assignments:', transformedData.length);
      return { data: transformedData, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error in getTutorAssignments:', error);
      return { data: null, error };
    }
  },

  // Get assignments for a specific student (using profile IDs) - simplified version
  async getStudentAssignments(studentId: string): Promise<{ data: AssignmentWithDetails[] | null; error: any }> {
    console.log('🔍 Getting assignments for student profile ID:', studentId);
    
    try {
      // Get assignments for this student
      const { data: assignments, error: assignmentsError } = await supabase
        .from('tutor_student_assignments')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false });
      
      if (assignmentsError) {
        console.error('❌ Error fetching student assignments:', assignmentsError);
        return { data: null, error: assignmentsError };
      }
      
      if (!assignments || assignments.length === 0) {
        console.log('🔍 No assignments found for student');
        return { data: [], error: null };
      }
      
      // Get tutor profiles and subjects
      const tutorIds = Array.from(new Set(assignments.map((a: any) => a.tutor_id)));
      const subjectIds = Array.from(new Set(assignments.map((a: any) => a.subject_id)));
      
      const [profilesResponse, subjectsResponse] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', tutorIds),
        supabase.from('subjects').select('id, name').in('id', subjectIds)
      ]);
      
      const profiles = profilesResponse.data || [];
      const subjects = subjectsResponse.data || [];
      
      const transformedData = assignments.map((assignment: any) => {
        const tutorProfile = profiles.find((p: any) => p.id === assignment.tutor_id);
        const subject = subjects.find((s: any) => s.id === assignment.subject_id);
        
        return {
          ...assignment,
          tutor_name: tutorProfile?.full_name || 'Unknown Tutor',
          tutor_email: tutorProfile?.email || '',
          subject_name: subject?.name || 'Unknown Subject',
          student_name: '', // Not needed for student view
          student_email: '',
          assigned_by_name: ''
        };
      });
      
      console.log('🔍 Transformed student assignments:', transformedData.length);
      return { data: transformedData, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error in getStudentAssignments:', error);
      return { data: null, error };
    }
  },

  // Create a new assignment (admin only)
  async createAssignment(assignmentData: CreateAssignmentData): Promise<{ data: TutorStudentAssignment | null; error: any }> {
    console.log('🔍 Creating assignment with data:', assignmentData);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ User not authenticated');
      return { data: null, error: 'Not authenticated' };
    }

    console.log('🔍 Authenticated user:', user.id);

    // Extract actual profile IDs from prefixed IDs
    const tutorProfileId = assignmentData.tutor_id.startsWith('tutor_') 
      ? assignmentData.tutor_id.replace('tutor_', '') 
      : assignmentData.tutor_id;
    const studentProfileId = assignmentData.student_id.startsWith('student_') 
      ? assignmentData.student_id.replace('student_', '') 
      : assignmentData.student_id;
    
    console.log('🔍 Extracted profile IDs:', { tutorProfileId, studentProfileId });
    
    // For now, let's use profile IDs directly in the assignment table
    // This is a temporary solution until we properly set up the students/tutors tables
    const insertData = {
      tutor_id: tutorProfileId, // Using profile ID directly
      student_id: studentProfileId, // Using profile ID directly
      subject_id: assignmentData.subject_id,
      notes: assignmentData.notes,
      start_date: assignmentData.start_date,
      end_date: assignmentData.end_date,
      assigned_by: user.id,
      status: 'active' as const
    };
    
    console.log('🔍 Insert data:', insertData);

    const { data, error } = await supabase
      .from('tutor_student_assignments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error creating assignment:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { data: null, error };
    }

    console.log('✅ Assignment created successfully:', data);
    
    // Verify the assignment was actually stored by fetching it back
    const { data: verifyData, error: verifyError } = await supabase
      .from('tutor_student_assignments')
      .select('*')
      .eq('id', data.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed - assignment was not actually stored:', verifyError);
    } else {
      console.log('✅ Verification successful - assignment found in database:', verifyData);
    }
    
    return { data, error: null };
  },

  // Update assignment status or details (admin only)
  async updateAssignment(assignmentId: string, updates: Partial<TutorStudentAssignment>): Promise<{ data: TutorStudentAssignment | null; error: any }> {
    const { data, error } = await supabase
      .from('tutor_student_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  // Delete assignment (admin only)
  async deleteAssignment(assignmentId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('tutor_student_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting assignment:', error);
    }

    return { error };
  },

  // Get available tutors for assignment (simplified approach using profiles directly)
  async getAvailableTutors(): Promise<{ data: Array<{id: string, name: string, email: string, specializations: string[]}> | null; error: any }> {
    console.log('🔍 Fetching available tutors (simplified approach)...');
    
    try {
      // Get all tutor profiles directly
      const { data: tutorProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tutor');

      if (profileError) {
        console.error('❌ Error fetching tutor profiles:', profileError);
        return { data: null, error: profileError };
      }

      console.log('🔍 Found tutor profiles:', tutorProfiles?.length || 0, tutorProfiles);

      // Use profile data directly without trying to create tutor records
      const result = (tutorProfiles || []).map((profile: any) => ({
        id: `tutor_${profile.id}`, // Prefix to indicate this is a profile-based ID
        name: profile.full_name || `${profile.email.split('@')[0]} (Tutor)` || 'Unknown Tutor',
        email: profile.email || '',
        specializations: ['General'] // Default specialization
      }));

      console.log('🔍 Final tutor list (using profiles):', result.length, result);
      return { data: result, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error in getAvailableTutors:', error);
      return { data: null, error };
    }
  },

  // Get available students for assignment (simplified approach using profiles directly)
  async getAvailableStudents(): Promise<{ data: Array<{id: string, name: string, email: string, grade_level?: string}> | null; error: any }> {
    console.log('🔍 Fetching available students (simplified approach)...');
    
    try {
      // Get all student profiles directly
      const { data: studentProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (profileError) {
        console.error('❌ Error fetching student profiles:', profileError);
        return { data: null, error: profileError };
      }

      console.log('🔍 Found student profiles:', studentProfiles?.length || 0, studentProfiles);

      // Use profile data directly without trying to create student records
      const result = (studentProfiles || []).map((profile: any) => ({
        id: `student_${profile.id}`, // Prefix to indicate this is a profile-based ID
        name: profile.full_name || `${profile.email.split('@')[0]} (Student)` || 'Unknown Student',
        email: profile.email || '',
        grade_level: 'Not specified'
      }));

      console.log('🔍 Final student list (using profiles):', result.length, result);
      return { data: result, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error in getAvailableStudents:', error);
      return { data: null, error };
    }
  },

  // Get available subjects
  async getSubjects(): Promise<{ data: Array<{id: string, name: string, description?: string}> | null; error: any }> {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, description')
      .order('name');

    if (error) {
      console.error('Error fetching subjects:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }
};