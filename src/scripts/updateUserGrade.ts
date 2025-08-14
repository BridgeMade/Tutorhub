import { supabase } from '../lib/supabase';

export const updateUserGrade = async (userId: string, newGrade: string) => {
  try {
    console.log(`🔄 Updating user ${userId} grade to ${newGrade}...`);

    // Update the profile table
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        grade_level: newGrade,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (error) {
      throw new Error('Database update failed: ' + error.message);
    }

    if (data && data.length > 0) {
      console.log('✅ User grade updated successfully!');
      console.log('📊 Updated profile:', data[0]);
      return {
        success: true,
        message: `Grade updated to ${newGrade}`,
        profile: data[0]
      };
    } else {
      throw new Error('No profile found for user ID: ' + userId);
    }

  } catch (error) {
    console.error('❌ Error updating user grade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Update specific user to Grade 10
export const updateUserToGrade10 = async () => {
  const userId = 'e589e14b-6160-4fab-93b6-e060d35633b3';
  const result = await updateUserGrade(userId, '10');
  
  if (result.success) {
    console.log('🎓 User successfully updated to Grade 10!');
    console.log('🔄 Please refresh the dashboard to see Grade 8-12 features');
  } else {
    console.log('❌ Failed to update user grade:', result.error);
  }

  return result;
};