// Debug script to test availability system
import { supabase } from '../lib/supabase';
import { availabilityService } from '../services/availabilityService';

export const testAvailabilitySystem = async () => {
  console.log('🔍 Testing availability system...');
  
  try {
    // Test 1: Check if tutor_availability table exists
    console.log('Test 1: Checking tutor_availability table...');
    const { data: tableTest, error: tableError } = await supabase
      .from('tutor_availability')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError);
    } else {
      console.log('✅ Table exists and is accessible');
    }
    
    // Test 2: Check all availability records
    console.log('Test 2: Checking all availability records...');
    const { data: allAvailability, error: allError } = await supabase
      .from('tutor_availability')
      .select('*');
    
    if (allError) {
      console.error('❌ Error fetching all availability:', allError);
    } else {
      console.log('✅ Found', allAvailability?.length || 0, 'total availability records');
      console.log('📊 Records:', allAvailability);
    }
    
    // Test 3: Test availabilityService
    console.log('Test 3: Testing availabilityService...');
    try {
      // Use a sample tutor ID (this should be replaced with actual tutor ID)
      const testTutorId = 'test-tutor-id';
      const serviceResult = await availabilityService.getTutorAvailability(testTutorId);
      console.log('✅ AvailabilityService returned:', serviceResult.length, 'slots');
    } catch (serviceError) {
      console.error('❌ AvailabilityService error:', serviceError);
    }
    
  } catch (error) {
    console.error('❌ Overall test error:', error);
  }
};

// Call the test (remove this in production)
// testAvailabilitySystem();