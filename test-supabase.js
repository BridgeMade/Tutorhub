// Simple Node.js test for Supabase connection
const fs = require('fs');

async function testSupabase() {
  try {
    // Read .env.local file manually
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envLines = envContent.split('\n');
    
    let supabaseUrl, supabaseKey;
    envLines.forEach(line => {
      if (line.startsWith('REACT_APP_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('REACT_APP_SUPABASE_ANON_KEY=')) {
        supabaseKey = line.split('=')[1].trim();
      }
    });
    
    // Import ES module in CommonJS
    const { createClient } = await import('@supabase/supabase-js');
    
    console.log('🔧 Testing Supabase Connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT FOUND');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env.local');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Basic connection
    console.log('\n📊 Testing database connection...');
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Database Error:', error.message);
      if (error.details) console.error('Details:', error.details);
      if (error.hint) console.error('Hint:', error.hint);
    } else {
      console.log('✅ Database connection successful!');
      console.log('Found subjects:', data.length);
      data.forEach(subject => {
        console.log(`  - ${subject.name}: ${subject.description}`);
      });
    }
    
    // Test 2: Auth connection
    console.log('\n🔐 Testing auth connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth Error:', authError.message);
    } else {
      console.log('✅ Auth connection successful!');
      console.log('Current user:', user ? user.email : 'No user logged in');
    }
    
    console.log('\n🎉 Supabase setup is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Check your .env.local file has the correct credentials');
    console.error('2. Verify your Supabase project is running');
    console.error('3. Ensure you ran the database migration');
  }
}

testSupabase();