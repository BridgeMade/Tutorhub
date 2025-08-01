import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('Current session:', data.session ? 'Logged in' : 'Not logged in');
    
    // Test 2: Try to query profiles table (will fail if not set up)
    const { count, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profileError) {
      console.warn('⚠️ Profiles table not found or not accessible:', profileError.message);
      console.log('Please run the database setup script in Supabase SQL Editor');
      return false;
    }
    
    console.log('✅ Database tables accessible');
    return true;
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return false;
  }
};

// Auto-run the test when this module is imported
testSupabaseConnection();