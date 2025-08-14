import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const DatabaseSchemaSetup: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<string>('');

  const checkSchema = async () => {
    setResult('🔍 Checking current database schema...\n');
    
    try {
      // Check if grade_level column exists
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'profiles')
        .eq('column_name', 'grade_level');

      if (columnsError) {
        setResult(prev => prev + `❌ Error checking columns: ${columnsError.message}\n`);
        return;
      }

      if (columns && columns.length > 0) {
        setResult(prev => prev + `✅ grade_level column exists:\n${JSON.stringify(columns[0], null, 2)}\n\n`);
        
        // Show sample profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, grade_level')
          .limit(5);

        if (profilesError) {
          setResult(prev => prev + `❌ Error fetching profiles: ${profilesError.message}\n`);
        } else {
          setResult(prev => prev + `📊 Sample profiles:\n${JSON.stringify(profiles, null, 2)}\n`);
        }
      } else {
        setResult(prev => prev + `❌ grade_level column does NOT exist in profiles table\n\n`);
        setResult(prev => prev + `🔧 You need to run the SQL schema update in Supabase.\n`);
      }

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  };

  const addGradeLevelColumn = async () => {
    setIsUpdating(true);
    setResult('🔧 Adding grade_level column to profiles table...\n');

    try {
      // Use Supabase RPC or direct SQL execution
      const { data, error } = await supabase.rpc('exec', {
        query: `
        -- Add the grade_level column if it doesn't exist
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS grade_level VARCHAR(10) DEFAULT 'K';
        
        -- Update any existing students to have a default grade
        UPDATE profiles 
        SET grade_level = 'K' 
        WHERE role = 'student' AND (grade_level IS NULL OR grade_level = '');
        
        -- Create an index for faster queries
        CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);
        `
      });

      if (error) {
        setResult(prev => prev + `❌ Error adding column: ${error.message}\n`);
        setResult(prev => prev + `\n💡 You may need to run the SQL manually in Supabase SQL Editor.\n`);
      } else {
        setResult(prev => prev + `✅ Successfully added grade_level column!\n`);
        setResult(prev => prev + `📊 Result: ${JSON.stringify(data, null, 2)}\n`);
        
        // Verify the change
        setTimeout(checkSchema, 1000);
      }

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      setResult(prev => prev + `\n💡 Please run the SQL manually in Supabase.\n`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Schema Setup</h1>
          <p className="text-gray-600 mt-2">
            Set up the grade_level column for student grade management
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Manual SQL Instructions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📋 Manual SQL Setup (Recommended)
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Steps:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Copy and paste the SQL below</li>
                  <li>Run the query</li>
                  <li>Come back and test grade management</li>
                </ol>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm whitespace-pre-wrap">
{`-- Add grade_level column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS grade_level VARCHAR(10) DEFAULT 'K';

-- Add comment for documentation
COMMENT ON COLUMN profiles.grade_level IS 
'Student grade level (K, 1-12). Determines dashboard type.';

-- Set default grades for existing students
UPDATE profiles 
SET grade_level = 'K' 
WHERE role = 'student' AND (grade_level IS NULL OR grade_level = '');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level 
ON profiles(grade_level);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'grade_level';`}
                </pre>
              </div>
            </div>
          </div>

          {/* Automatic Setup Tool */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🤖 Automatic Setup Tool
            </h2>
            
            <div className="space-y-4">
              <button
                onClick={checkSchema}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Check Current Schema
              </button>

              <button
                onClick={addGradeLevelColumn}
                disabled={isUpdating}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isUpdating
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isUpdating ? 'Adding Column...' : 'Add Grade Level Column'}
              </button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This tool may not work due to database permissions. 
                  The manual SQL approach is more reliable.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 After Schema Update</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div>✅ <strong>Admin Grade Management:</strong> http://localhost:3001/admin/grades</div>
            <div>✅ <strong>Direct Update Tool:</strong> http://localhost:3001/direct-update</div>
            <div>✅ <strong>Test Dashboards:</strong> Students will see appropriate dashboards based on grade</div>
            <div>✅ <strong>Dashboard Logic:</strong> K-7 → Simple dashboard, 8-12 → Advanced dashboard</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchemaSetup;