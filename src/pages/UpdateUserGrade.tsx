import React, { useState } from 'react';
import { updateUserToGrade10 } from '../scripts/updateUserGrade';

const UpdateUserGrade: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleUpdateGrade = async () => {
    setIsUpdating(true);
    setResult(null);

    try {
      const updateResult = await updateUserToGrade10();
      setResult(updateResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Update User Grade</h1>
          <p className="text-gray-600 mt-2">
            Update user grade to test Grade 8-12 dashboard features
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">User Update Details</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div><strong>User ID:</strong> e589e14b-6160-4fab-93b6-e060d35633b3</div>
              <div><strong>New Grade:</strong> Grade 10</div>
              <div><strong>Purpose:</strong> Enable Grade 8-12 dashboard testing</div>
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
                    <span className="text-sm font-medium text-green-900">Grade Updated Successfully!</span>
                  </div>
                  <div className="text-sm text-green-800">
                    <div>{result.message}</div>
                    <div className="mt-3 p-3 bg-green-100 rounded border">
                      <strong>Next Steps:</strong>
                      <ol className="mt-1 ml-4 list-decimal">
                        <li>Go to <a href="/dashboard" className="text-green-700 underline">Dashboard</a></li>
                        <li>You should now see the Grade 8-12 dashboard</li>
                        <li>Test all the advanced features</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm font-medium text-red-900">Update Failed</span>
                  </div>
                  <div className="text-sm text-red-800">{result.error}</div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleUpdateGrade}
            disabled={isUpdating}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isUpdating
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isUpdating ? 'Updating Grade...' : 'Update User to Grade 10'}
          </button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <strong className="text-yellow-800">Important:</strong>
                <p className="text-yellow-700 text-sm mt-1">
                  This will permanently update the user's grade level in the database. After updating, the dashboard will automatically show Grade 8-12 features instead of K-7 features.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div><strong>What changes after update:</strong></div>
            <div>• Complex lesson management with reschedule options</div>
            <div>• Advanced assignment tracking with grades</div>
            <div>• Material downloads (PDFs, videos, links)</div>
            <div>• Activity feed with detailed session history</div>
            <div>• Assignment upload functionality</div>
            <div>• Mature UI appropriate for older students</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateUserGrade;