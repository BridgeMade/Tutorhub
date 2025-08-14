import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const FixGradeUpdates: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<string>('');

  const testDirectUpdate = async () => {
    setResult('🔧 Testing direct grade updates...\n');
    setIsUpdating(true);

    try {
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setResult(prev => prev + '❌ Not authenticated\n');
        return;
      }

      setResult(prev => prev + `✅ Current user: ${user.id}\n\n`);

      // Test different update approaches
      const testUserId = 'cc69cc70-29a0-418e-b7af-356bd93eb713'; // From your screenshot

      // Method 1: Simple update
      setResult(prev => prev + '🔄 Method 1: Simple update\n');
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ grade_level: '10' })
        .eq('id', testUserId)
        .select();

      if (updateError) {
        setResult(prev => prev + `❌ Method 1 failed: ${updateError.message}\n`);
        
        // Method 2: Try with single row update
        setResult(prev => prev + '🔄 Method 2: Single row update\n');
        const { data: singleData, error: singleError } = await supabase
          .from('profiles')
          .update({ grade_level: '10' })
          .eq('id', testUserId)
          .single();

        if (singleError) {
          setResult(prev => prev + `❌ Method 2 failed: ${singleError.message}\n`);
          
          // Method 3: Raw SQL approach
          setResult(prev => prev + '🔄 Method 3: Raw SQL approach\n');
          const { data: sqlData, error: sqlError } = await supabase.rpc('update_user_grade', {
            user_id: testUserId,
            new_grade: '10'
          });

          if (sqlError) {
            setResult(prev => prev + `❌ Method 3 failed: ${sqlError.message}\n`);
            setResult(prev => prev + '\n🔍 Let me try a different approach...\n');
            
            // Method 4: Check permissions
            await checkPermissions();
          } else {
            setResult(prev => prev + `✅ Method 3 success: ${JSON.stringify(sqlData)}\n`);
          }
        } else {
          setResult(prev => prev + `✅ Method 2 success: ${JSON.stringify(singleData)}\n`);
        }
      } else {
        setResult(prev => prev + `✅ Method 1 success: ${JSON.stringify(updateData)}\n`);
      }

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    } finally {
      setIsUpdating(false);
    }
  };

  const checkPermissions = async () => {
    setResult(prev => prev + '\n🔍 Checking database permissions...\n');
    
    try {
      // Try to read profiles
      const { data: profiles, error: readError } = await supabase
        .from('profiles')
        .select('id, grade_level, role')
        .limit(3);

      if (readError) {
        setResult(prev => prev + `❌ Can't read profiles: ${readError.message}\n`);
      } else {
        setResult(prev => prev + `✅ Can read profiles: ${profiles?.length} records\n`);
        setResult(prev => prev + `📊 Sample: ${JSON.stringify(profiles, null, 2)}\n\n`);
      }

      // Try to check current user's role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setResult(prev => prev + `❌ Can't read current profile: ${profileError.message}\n`);
        } else {
          setResult(prev => prev + `✅ Current user profile: ${JSON.stringify(currentProfile)}\n`);
          
          if (currentProfile.role === 'admin') {
            setResult(prev => prev + '✅ You have admin role - should have permissions\n');
            await tryAdminUpdate();
          } else {
            setResult(prev => prev + '❌ You need admin role to update grades\n');
          }
        }
      }

    } catch (error) {
      setResult(prev => prev + `❌ Permission check error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
    }
  };

  const tryAdminUpdate = async () => {
    setResult(prev => prev + '\n🔄 Trying admin-level update...\n');
    
    const testUserId = 'cc69cc70-29a0-418e-b7af-356bd93eb713';
    
    try {
      // Simple direct update with admin user
      const { data, error } = await supabase
        .from('profiles')
        .update({ grade_level: '10' })
        .eq('id', testUserId);

      if (error) {
        setResult(prev => prev + `❌ Admin update failed: ${error.message}\n`);
        
        // Try with explicit select
        const { data: explicitData, error: explicitError } = await supabase
          .from('profiles')
          .update({ grade_level: '10' })
          .eq('id', testUserId)
          .select('id, grade_level');

        if (explicitError) {
          setResult(prev => prev + `❌ Explicit select failed: ${explicitError.message}\n`);
        } else {
          setResult(prev => prev + `✅ Update with select worked: ${JSON.stringify(explicitData)}\n`);
        }
      } else {
        setResult(prev => prev + `✅ Admin update successful!\n`);
        
        // Verify the update
        const { data: verifyData } = await supabase
          .from('profiles')
          .select('id, grade_level')
          .eq('id', testUserId)
          .single();
        
        setResult(prev => prev + `📊 Verification: ${JSON.stringify(verifyData)}\n`);
      }

    } catch (error) {
      setResult(prev => prev + `❌ Admin update error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
    }
  };

  const fixAllNullGrades = async () => {
    setResult('🔧 Setting default grades for all NULL entries...\n');
    setIsUpdating(true);

    try {
      // Update all NULL grade_level entries to 'K'
      const { data, error } = await supabase
        .from('profiles')
        .update({ grade_level: 'K' })
        .is('grade_level', null)
        .select('id, grade_level, role');

      if (error) {
        setResult(prev => prev + `❌ Bulk update failed: ${error.message}\n`);
      } else {
        setResult(prev => prev + `✅ Updated ${data?.length || 0} records to grade K\n`);
        setResult(prev => prev + `📊 Updated records: ${JSON.stringify(data, null, 2)}\n`);
      }

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fix Grade Updates</h1>
          <p className="text-gray-600 mt-2">
            Diagnose and fix the grade update issues in Supabase
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={testDirectUpdate}
            disabled={isUpdating}
            className={`p-6 rounded-lg font-medium transition-colors ${
              isUpdating
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            🔧 Test Direct Update
          </button>

          <button
            onClick={checkPermissions}
            disabled={isUpdating}
            className={`p-6 rounded-lg font-medium transition-colors ${
              isUpdating
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            🔍 Check Permissions
          </button>

          <button
            onClick={fixAllNullGrades}
            disabled={isUpdating}
            className={`p-6 rounded-lg font-medium transition-colors ${
              isUpdating
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            🛠️ Fix NULL Grades
          </button>
        </div>

        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Status from Screenshot</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div>✅ <code>grade_level</code> column exists in profiles table</div>
              <div>❌ All grade_level values are NULL</div>
              <div>🔍 User IDs found:</div>
              <div className="ml-4 font-mono text-xs">
                <div>cc69cc70-29a0-418e-b7af-356bd93eb713</div>
                <div>e589e14b-6160-4fab-93b6-e060d35633b3</div>
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic Results</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">What This Tool Does:</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div>🔧 <strong>Test Direct Update:</strong> Tries different methods to update grades</div>
            <div>🔍 <strong>Check Permissions:</strong> Verifies database permissions and user roles</div>
            <div>🛠️ <strong>Fix NULL Grades:</strong> Sets default grades for all NULL entries</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixGradeUpdates;