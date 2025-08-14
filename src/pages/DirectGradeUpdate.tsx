import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const DirectGradeUpdate: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [grade, setGrade] = useState('10');
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<string>('');

  const gradeOptions = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const updateGrade = async () => {
    if (!userId.trim() || !grade) {
      setResult('❌ Please enter both User ID and Grade');
      return;
    }

    setIsUpdating(true);
    setResult('🔄 Updating grade...');

    try {
      console.log(`Updating user ${userId} to grade ${grade}`);

      // Method 1: Direct update
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          grade_level: grade,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Update error:', error);
        
        // Method 2: Try with upsert
        console.log('Trying upsert method...');
        const { data: upsertData, error: upsertError } = await supabase
          .from('profiles')
          .upsert({ 
            id: userId,
            grade_level: grade,
            updated_at: new Date().toISOString()
          })
          .select();

        if (upsertError) {
          throw new Error(`Both methods failed. Update: ${error.message}, Upsert: ${upsertError.message}`);
        }

        setResult(`✅ Grade updated to ${grade} (via upsert)\nUpdated profile: ${JSON.stringify(upsertData, null, 2)}`);
      } else {
        setResult(`✅ Grade updated to ${grade} successfully!\nUpdated profile: ${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMsg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const checkUserProfile = async () => {
    if (!userId.trim()) {
      setResult('❌ Please enter a User ID');
      return;
    }

    setResult('🔍 Checking user profile...');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        setResult(`❌ Error fetching profile: ${error.message}`);
        return;
      }

      if (data) {
        setResult(`👤 User Profile Found:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult('❌ User not found');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMsg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Direct Grade Update Tool</h1>
          <p className="text-gray-600 mt-2">
            Directly update a user's grade with detailed logging
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g., 2cb80c00-04d5-45a7-b180-30278adf8dc9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {gradeOptions.map(g => (
                  <option key={g} value={g}>
                    {g === 'K' ? 'Kindergarten' : `Grade ${g}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={checkUserProfile}
              disabled={isUpdating}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isUpdating
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Check User Profile
            </button>

            <button
              onClick={updateGrade}
              disabled={isUpdating}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isUpdating
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isUpdating ? 'Updating...' : 'Update Grade'}
            </button>
          </div>

          {result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Current Session User IDs</h4>
            <div className="space-y-1 text-sm text-blue-800 font-mono">
              <div>2cb80c00-04d5-45a7-b180-30278adf8dc9 (Current active user)</div>
              <div>639e5f42-5fc9-4013-a3ac-bb35feb972d7</div>
              <div>f6df866e-c5a4-49e1-a4dd-3c9d45d8ef3e</div>
              <div>e589e14b-6160-4fab-93b6-e060d35633b3</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <strong className="text-yellow-800">Dashboard Assignment:</strong>
                <p className="text-yellow-700 text-sm mt-1">
                  • Grades K-7: Simple K-7 dashboard<br/>
                  • Grades 8-12: Advanced Grade 8-12 dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectGradeUpdate;