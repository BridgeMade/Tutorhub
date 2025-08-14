import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const SimpleTestLogin: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<string>('');

  const createSimpleAccount = async () => {
    setIsCreating(true);
    setResult('Creating account...');

    try {
      // Try to sign up with minimal data
      const { data, error } = await supabase.auth.signUp({
        email: 'charmerthabs@gmail.com',
        password: 'TestPass123!',
        options: {
          data: {
            full_name: 'Test Grade 8-12 Student'
          }
        }
      });

      if (error) {
        setResult(`❌ Error: ${error.message}`);
      } else if (data.user) {
        setResult(`✅ Account created! User ID: ${data.user.id}
        
📧 Email: charmerthabs@gmail.com
🔐 Password: TestPass123!
        
You can now login at /auth`);
      } else {
        setResult('❌ No user returned from signup');
      }
    } catch (err) {
      setResult(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const testLogin = async () => {
    setIsCreating(true);
    setResult('Testing login...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'charmerthabs@gmail.com',
        password: 'TestPass123!'
      });

      if (error) {
        setResult(`❌ Login failed: ${error.message}`);
      } else if (data.user) {
        setResult(`✅ Login successful! User: ${data.user.email}
        
You can now access the Grade 8-12 dashboard.`);
      }
    } catch (err) {
      setResult(`❌ Login error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Simple Test Account Setup</h1>
          <p className="text-gray-600 mt-2">
            Create a basic test account for Grade 8-12 dashboard testing
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Test Account Details</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div><strong>Email:</strong> charmerthabs@gmail.com</div>
              <div><strong>Password:</strong> TestPass123!</div>
              <div><strong>Purpose:</strong> Test Grade 8-12 dashboard</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={createSimpleAccount}
              disabled={isCreating}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isCreating
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isCreating ? 'Creating...' : 'Create Test Account'}
            </button>

            <button
              onClick={testLogin}
              disabled={isCreating}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isCreating
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isCreating ? 'Testing...' : 'Test Login'}
            </button>
          </div>

          {result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-2">
            <div><strong>Step 1:</strong> Click "Create Test Account" to set up the account</div>
            <div><strong>Step 2:</strong> If successful, click "Test Login" to verify it works</div>
            <div><strong>Step 3:</strong> Navigate to /auth to login with the credentials</div>
            <div><strong>Step 4:</strong> Access the Grade 8-12 dashboard to test the new styling</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTestLogin;