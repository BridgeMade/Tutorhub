import { supabase } from '../lib/supabase';
import { User, Student, Tutor, Admin } from '../types';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'student' | 'tutor' | 'admin';
  phone?: string;
  grade_level?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  grade_level?: string;
  school?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  created_at: string;
}

export interface TutorProfile {
  id: string;
  user_id: string;
  specializations?: string[];
  hourly_rate?: number;
  bio?: string;
  experience_years?: number;
  qualifications?: string[];
  created_at: string;
}

export const userService = {
  // Get user profile
  async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user by email:', error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  // Get all users (admin only)
  async getAllUsers(): Promise<{ data: Profile[] | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all users:', error);
      return { data: null, error };
    }

    return { data, error: null };
  },

  // Get student profile
  async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching student profile:', error);
      return null;
    }

    return data;
  },

  // Create student profile
  async createStudentProfile(userId: string, studentData: Partial<StudentProfile>): Promise<StudentProfile | null> {
    const { data, error } = await supabase
      .from('students')
      .insert({ user_id: userId, ...studentData })
      .select()
      .single();

    if (error) {
      console.error('Error creating student profile:', error);
      return null;
    }

    return data;
  },

  // Get tutor profile
  async getTutorProfile(userId: string): Promise<TutorProfile | null> {
    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching tutor profile:', error);
      return null;
    }

    return data;
  },

  // Create tutor profile
  async createTutorProfile(userId: string, tutorData: Partial<TutorProfile>): Promise<TutorProfile | null> {
    const { data, error } = await supabase
      .from('tutors')
      .insert({ user_id: userId, ...tutorData })
      .select()
      .single();

    if (error) {
      console.error('Error creating tutor profile:', error);
      return null;
    }

    return data;
  },

  // Get full user data with role-specific profile
  async getFullUserData(userId: string): Promise<{ profile: Profile; roleData?: StudentProfile | TutorProfile } | null> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return null;

    // Skip role-specific data to avoid infinite recursion in RLS policies
    // The profiles table has all the data we need for basic functionality
    return { profile, roleData: undefined };
  },

  // Convert database profile to our User types
  profileToUser(profile: Profile, roleData?: StudentProfile | TutorProfile): User {
    const baseUser = {
      id: profile.id,
      email: profile.email,
      firstName: profile.full_name?.split(' ')[0] || '',
      lastName: profile.full_name?.split(' ').slice(1).join(' ') || '',
      avatar: profile.avatar_url,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
      role: profile.role as 'student' | 'tutor' | 'admin'
    };

    if (profile.role === 'student') {
      const studentData = roleData as StudentProfile | undefined;
      return {
        ...baseUser,
        role: 'student',
        grade: profile.grade_level || studentData?.grade_level || 'K',
        subjects: [], // TODO: Get from lessons/subjects
        parentContact: studentData?.parent_name ? {
          name: studentData.parent_name,
          email: studentData.parent_email || '',
          phone: studentData.parent_phone || ''
        } : undefined
      } as Student;
    }

    if (profile.role === 'tutor') {
      const tutorData = roleData as TutorProfile | undefined;
      return {
        ...baseUser,
        role: 'tutor',
        subjects: tutorData?.specializations || [],
        qualifications: tutorData?.qualifications || [],
        hourlyRate: tutorData?.hourly_rate || 0,
        availability: [], // TODO: Implement availability system
        rating: 0, // TODO: Calculate from reviews
        totalSessions: 0 // TODO: Count from lessons
      } as Tutor;
    }

    if (profile.role === 'admin') {
      return {
        ...baseUser,
        role: 'admin',
        permissions: ['manage_users', 'view_reports'] // TODO: Implement permission system
      } as Admin;
    }

    return baseUser;
  }
};