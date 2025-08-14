import React, { useState } from 'react';
import { createGrade812TestAccount } from '../../scripts/createTestAccount';

interface TestAccountCreatorProps {}

export const TestAccountCreator: React.FC<TestAccountCreatorProps> = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; userId?: string } | null>(null);

  const handleCreateTestAccount = async () => {
    setIsCreating(true);
    setResult(null);

    try {
      const createResult = await createGrade812TestAccount();
      setResult(createResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Parent Test Account Creator</h3>
        <p className="text-sm text-gray-600 mt-1">
          Create a parent test account for Grade 8-12 dashboard testing
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Account Details</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div><strong>Email:</strong> charmerthabs@gmail.com</div>
            <div><strong>Password:</strong> TestPass123!</div>
            <div><strong>Name:</strong> Test Parent - Grade 8-12</div>
            <div><strong>Role:</strong> Student (Grade 10 level for testing)</div>
            <div><strong>Purpose:</strong> Test Grade 8-12 dashboard features</div>
          </div>
        </div>

        {result && (
          <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.success ? (
              <div>
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-900">Account Created Successfully!</span>
                </div>
                <div className="text-sm text-green-800">
                  <div>User ID: {result.userId}</div>
                  <div className="mt-2">
                    You can now test the Grade 8-12 dashboard by logging in with the credentials above.
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm font-medium text-red-900">Account Creation Failed</span>
                </div>
                <div className="text-sm text-red-800">{result.error}</div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleCreateTestAccount}
          disabled={isCreating}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isCreating
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isCreating ? 'Creating Account...' : 'Create Test Account'}
        </button>

        <div className="text-xs text-gray-500">
          <strong>Note:</strong> This will create a test account that can be used to access the Grade 8-12 dashboard.
          The account will be created with verified email status to skip email verification.
        </div>
      </div>
    </div>
  );
};

export default TestAccountCreator;