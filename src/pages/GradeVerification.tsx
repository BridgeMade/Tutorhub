import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const GradeVerification: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const verifyCurrentState = async () => {
    setResult('🔍 Checking current database state...\n');
    setIsLoading(true);

    try {
      // Get all profiles with detailed info
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, grade_level, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        setResult(prev => prev + `❌ Error: ${error.message}\n`);
        return;
      }

      setResult(prev => prev + `📊 Found ${allProfiles?.length || 0} total profiles:\n\n`);

      allProfiles?.forEach((profile: any, index: number) => {
        setResult(prev => prev + `${index + 1}. ${profile.full_name || 'Unnamed'}\n`);
        setResult(prev => prev + `   📧 Email: ${profile.email}\n`);
        setResult(prev => prev + `   👤 Role: ${profile.role}\n`);
        setResult(prev => prev + `   🎓 Grade: ${profile.grade_level || 'NULL'}\n`);
        setResult(prev => prev + `   🆔 ID: ${profile.id}\n`);
        setResult(prev => prev + `   📅 Updated: ${profile.updated_at}\n\n`);
      });

      // Count by grade level
      const gradeCounts = allProfiles?.reduce((acc: Record<string, number>, profile: any) => {
        const grade = profile.grade_level || 'NULL';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      }, {});

      setResult(prev => prev + `📈 Grade Distribution:\n`);
      Object.entries(gradeCounts || {}).forEach(([grade, count]) => {
        setResult(prev => prev + `   ${grade}: ${count} users\n`);
      });

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificUpdate = async () => {
    setResult('🔧 Testing specific user update with detailed tracking...\n');
    setIsLoading(true);

    const testUserId = 'f6df866e-c5a4-49e1-a4dd-3c9d45d8ef3e'; // Student from previous logs

    try {
      // Step 1: Check current state
      setResult(prev => prev + '📋 Step 1: Current state\n');
      const { data: beforeData, error: beforeError } = await supabase
        .from('profiles')
        .select('id, grade_level, updated_at')
        .eq('id', testUserId)
        .single();

      if (beforeError) {
        setResult(prev => prev + `❌ Before check failed: ${beforeError.message}\n`);
        return;
      }

      setResult(prev => prev + `   Before: Grade=${beforeData.grade_level}, Updated=${beforeData.updated_at}\n`);

      // Step 2: Perform update
      setResult(prev => prev + '🔄 Step 2: Performing update\n');
      const newGrade = '10';
      const newTimestamp = new Date().toISOString();

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          grade_level: newGrade,
          updated_at: newTimestamp
        })
        .eq('id', testUserId)
        .select('id, grade_level, updated_at');

      if (updateError) {
        setResult(prev => prev + `❌ Update failed: ${updateError.message}\n`);
        return;
      }

      setResult(prev => prev + `   Update result: ${JSON.stringify(updateData)}\n`);

      // Step 3: Wait and verify
      setResult(prev => prev + '⏳ Step 3: Waiting 1 second then verifying...\n');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: afterData, error: afterError } = await supabase
        .from('profiles')
        .select('id, grade_level, updated_at')
        .eq('id', testUserId)
        .single();

      if (afterError) {
        setResult(prev => prev + `❌ After check failed: ${afterError.message}\n`);
        return;
      }

      setResult(prev => prev + `   After: Grade=${afterData.grade_level}, Updated=${afterData.updated_at}\n`);

      // Step 4: Compare
      if (afterData.grade_level === newGrade) {
        setResult(prev => prev + '✅ SUCCESS: Grade was updated correctly!\n');
      } else {
        setResult(prev => prev + `❌ FAILED: Expected ${newGrade}, got ${afterData.grade_level}\n`);
      }

      if (afterData.updated_at !== beforeData.updated_at) {
        setResult(prev => prev + '✅ SUCCESS: Timestamp was updated!\n');
      } else {
        setResult(prev => prev + '❌ FAILED: Timestamp was not updated\n');
      }

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAllStudentsToGrade10 = async () => {
    setResult('🚀 Updating all students to Grade 10...\n');
    setIsLoading(true);

    try {
      // First, get all students
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, grade_level')
        .eq('role', 'student');

      if (studentsError) {
        setResult(prev => prev + `❌ Error getting students: ${studentsError.message}\n`);
        return;
      }

      setResult(prev => prev + `📊 Found ${students?.length || 0} students\n\n`);

      // Update each student individually for better tracking
      for (const student of students || []) {
        setResult(prev => prev + `🔄 Updating ${student.full_name || student.email}...\n`);
        
        const { data: updateResult, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            grade_level: '10',
            updated_at: new Date().toISOString()
          })
          .eq('id', student.id)
          .select('grade_level');

        if (updateError) {
          setResult(prev => prev + `   ❌ Failed: ${updateError.message}\n`);
        } else {
          setResult(prev => prev + `   ✅ Success: ${JSON.stringify(updateResult)}\n`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setResult(prev => prev + '\n🔍 Verifying all updates...\n');
      
      // Verify all students
      const { data: verifyStudents, error: verifyError } = await supabase
        .from('profiles')
        .select('id, full_name, grade_level')
        .eq('role', 'student');

      if (verifyError) {
        setResult(prev => prev + `❌ Verification failed: ${verifyError.message}\n`);
      } else {
        const grade10Count = verifyStudents?.filter((s: any) => s.grade_level === '10').length || 0;
        setResult(prev => prev + `📈 Results: ${grade10Count}/${verifyStudents?.length} students now have Grade 10\n`);
        
        verifyStudents?.forEach((student: any) => {
          setResult(prev => prev + `   ${student.full_name}: ${student.grade_level}\n`);
        });
      }

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error instanceof Error ? error.message : 'Unknown'}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Grade Verification & Fix</h1>
          <p className="text-gray-600 mt-2">
            Detailed verification and fixing of grade updates
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={verifyCurrentState}
            disabled={isLoading}
            className={`p-6 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            🔍 Check Current State
          </button>

          <button
            onClick={testSpecificUpdate}
            disabled={isLoading}
            className={`p-6 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            🔧 Test Specific Update
          </button>

          <button
            onClick={updateAllStudentsToGrade10}
            disabled={isLoading}
            className={`p-6 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            🚀 Fix All Students → Grade 10
          </button>
        </div>

        {result && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Previous Findings:</h4>
          <div className="space-y-1 text-sm text-yellow-800">
            <div>✅ Updates report success but verification shows null</div>
            <div>✅ You have admin permissions</div>
            <div>✅ Some users already have Grade K (not NULL anymore)</div>
            <div>🎯 Goal: Get all students set to Grade 10 for dashboard testing</div>
          </div>
        </div>

        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">Expected Result:</h4>
          <div className="space-y-1 text-sm text-green-800">
            <div>📊 Students with Grade 10 → See Grade 8-12 dashboard</div>
            <div>📊 Students with Grade K-7 → See K-7 dashboard</div>
            <div>🔄 Admin grade management will work properly</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeVerification;