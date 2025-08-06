import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandler';
import { useEmailNotifications } from './useEmailNotifications';

export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'tutor';
  gradeLevel?: string;
  subjects?: string[];
  qualifications?: string[];
  phoneNumber?: string;
}

export interface RegistrationResult {
  success: boolean;
  userId?: string;
  error?: string;
  requiresEmailVerification?: boolean;
}

export const useUserRegistration = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  
  const { sendWelcomeEmail } = useEmailNotifications();

  const registerUser = useCallback(async (registrationData: RegistrationData): Promise<RegistrationResult> => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            full_name: registrationData.fullName,
            role: registrationData.role
          }
        }
      });

      if (authError) {
        throw new Error('Registration failed: ' + authError.message);
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      const userId = authData.user.id;

      // Create user profile
      const profileData: any = {
        id: userId,
        email: registrationData.email,
        full_name: registrationData.fullName,
        role: registrationData.role,
        phone_number: registrationData.phoneNumber,
        profile_complete: true,
        email_verified: false,
        created_at: new Date().toISOString()
      };

      // Add role-specific data
      if (registrationData.role === 'student') {
        profileData.grade_level = registrationData.gradeLevel;
        profileData.subjects_of_interest = registrationData.subjects || [];
      } else if (registrationData.role === 'tutor') {
        profileData.subjects_can_teach = registrationData.subjects || [];
        profileData.qualifications = registrationData.qualifications || [];
        profileData.hourly_rate = null; // To be set later
        profileData.bio = '';
        profileData.experience_years = 0;
        profileData.availability_status = 'available';
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        throw new Error('Profile creation failed: ' + profileError.message);
      }

      // Send welcome email
      try {
        await sendWelcomeEmail({
          userEmail: registrationData.email,
          userName: registrationData.fullName,
          userRole: registrationData.role
        });
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
        // Don't fail registration if welcome email fails
      }

      // Create initial email preferences
      try {
        await supabase
          .from('email_preferences')
          .insert({
            user_id: userId,
            email_notifications_enabled: true,
            marketing_emails_enabled: true,
            session_reminders: true,
            session_confirmations: true,
            reschedule_notifications: true,
            resource_assignments: true,
            system_announcements: true,
            weekly_summaries: false,
            reminder_hours_before: 24,
            digest_frequency: 'weekly'
          });
      } catch (prefsError) {
        console.warn('Failed to create email preferences:', prefsError);
        // Don't fail registration if preferences creation fails
      }

      // Create initial notification preferences
      try {
        await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            push_notifications_enabled: true,
            email_notifications_enabled: true,
            sms_notifications_enabled: false,
            in_app_notifications_enabled: true,
            session_reminders: true,
            booking_confirmations: true,
            reschedule_requests: true,
            resource_updates: true,
            system_updates: true,
            marketing_communications: true
          });
      } catch (notifError) {
        console.warn('Failed to create notification preferences:', notifError);
        // Don't fail registration if notification preferences creation fails
      }

      // For tutors, create initial availability schedule
      if (registrationData.role === 'tutor') {
        try {
          // Create default availability (9 AM - 5 PM, Monday to Friday)
          const defaultAvailability = [];
          for (let day = 1; day <= 5; day++) { // Monday to Friday
            defaultAvailability.push({
              tutor_id: userId,
              day_of_week: day,
              start_time: '09:00',
              end_time: '17:00',
              is_available: true,
              created_at: new Date().toISOString()
            });
          }

          await supabase
            .from('tutor_availability')
            .insert(defaultAvailability);
        } catch (availabilityError) {
          console.warn('Failed to create default availability:', availabilityError);
          // Don't fail registration if availability creation fails
        }
      }

      // Log the registration event
      try {
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: userId,
            activity_type: 'user_registered',
            details: {
              role: registrationData.role,
              registration_method: 'email',
              email_verified: false
            },
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.warn('Failed to log registration event:', logError);
        // Don't fail registration if logging fails
      }

      return {
        success: true,
        userId,
        requiresEmailVerification: !authData.user.email_confirmed_at
      };

    } catch (error) {
      const appError = handleError(error, {
        operation: 'registerUser',
        email: registrationData.email,
        role: registrationData.role
      });

      setRegistrationError(appError.userMessage);
      return {
        success: false,
        error: appError.userMessage
      };
    } finally {
      setIsRegistering(false);
    }
  }, [sendWelcomeEmail]);

  const resendVerificationEmail = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        throw new Error('Failed to resend verification email: ' + error.message);
      }

      return { success: true };
    } catch (error) {
      const appError = handleError(error, {
        operation: 'resendVerificationEmail',
        email
      });
      
      return {
        success: false,
        error: appError.userMessage
      };
    }
  }, []);

  const completeProfile = useCallback(async (
    userId: string,
    additionalData: {
      bio?: string;
      hourlyRate?: number;
      experienceYears?: number;
      qualifications?: string[];
      subjects?: string[];
      profilePicture?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: additionalData.bio,
          hourly_rate: additionalData.hourlyRate,
          experience_years: additionalData.experienceYears,
          qualifications: additionalData.qualifications,
          subjects_can_teach: additionalData.subjects,
          profile_picture: additionalData.profilePicture,
          profile_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw new Error('Failed to update profile: ' + error.message);
      }

      return { success: true };
    } catch (error) {
      const appError = handleError(error, {
        operation: 'completeProfile',
        userId
      });
      
      return {
        success: false,
        error: appError.userMessage
      };
    }
  }, []);

  const clearError = useCallback(() => {
    setRegistrationError(null);
  }, []);

  return {
    registerUser,
    resendVerificationEmail,
    completeProfile,
    isRegistering,
    registrationError,
    clearError
  };
};

export default useUserRegistration;