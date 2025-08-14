import { supabase } from '../lib/supabase';

interface TestAccountData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'tutor' | 'admin';
  gradeLevel?: string;
}

export const createTestAccount = async (accountData: TestAccountData) => {
  try {
    console.log('Creating test account for:', accountData.email);
    
    // Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: accountData.email,
      password: accountData.password,
      options: {
        data: {
          full_name: accountData.fullName,
          role: accountData.role
        }
      }
    });

    if (authError) {
      throw new Error('Auth signup failed: ' + authError.message);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    const userId = authData.user.id;
    console.log('User created with ID:', userId);

    // Create user profile
    const profileData: any = {
      id: userId,
      email: accountData.email,
      full_name: accountData.fullName,
      role: accountData.role,
      profile_complete: true,
      email_verified: true, // Skip email verification for test account
      created_at: new Date().toISOString()
    };

    // Add role-specific data
    if (accountData.role === 'student') {
      profileData.grade_level = accountData.gradeLevel || '8';
      profileData.subjects_of_interest = ['Mathematics', 'Science', 'English'];
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error('Profile creation failed: ' + profileError.message);
    }

    console.log('Profile created successfully');

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
          marketing_communications: false
        });
    } catch (notifError) {
      console.warn('Failed to create notification preferences:', notifError);
    }

    // Log the registration event
    try {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          activity_type: 'test_account_created',
          details: {
            role: accountData.role,
            grade_level: accountData.gradeLevel,
            created_by: 'admin_script'
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('Failed to log registration event:', logError);
    }

    return {
      success: true,
      userId,
      email: accountData.email,
      message: 'Test account created successfully'
    };

  } catch (error) {
    console.error('Error creating test account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Create Parent test account (parents add students, not students directly)
export const createParentTestAccount = async () => {
  const testAccountData: TestAccountData = {
    email: 'charmerthabs@gmail.com',
    password: 'TestPass123!',
    fullName: 'Test Parent - Grade 8-12',
    role: 'student', // Will act as parent but using student role to access student dashboard
    gradeLevel: '10'
  };

  const result = await createTestAccount(testAccountData);
  
  if (result.success) {
    console.log('✅ Parent test account created successfully!');
    console.log('📧 Email:', testAccountData.email);
    console.log('🔐 Password:', testAccountData.password);
    console.log('👤 Role:', testAccountData.role);
    console.log('👨‍👩‍👧‍👦 Purpose: Parent account to test Grade 8-12 dashboard');
    console.log('🆔 User ID:', result.userId);
  } else {
    console.error('❌ Failed to create test account:', result.error);
  }

  return result;
};

// Create Grade 8-12 test account (legacy - now use parent account)
export const createGrade812TestAccount = async () => {
  return await createParentTestAccount();
};