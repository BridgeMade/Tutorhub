import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [authTest, setAuthTest] = useState<string>('Testing auth...');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Basic connection with a simple query
        console.log('Testing basic connection...');
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .limit(5);

        if (error) {
          setError(`Database error: ${error.message}`);
          setConnectionStatus('❌ Database connection failed');
        } else {
          setSubjects(data || []);
          setConnectionStatus('✅ Database connection successful');
        }

        // Test 2: Auth connection
        console.log('Testing auth...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          setAuthTest(`Auth error: ${authError.message}`);
        } else {
          setAuthTest(user ? `✅ User logged in: ${user.email}` : '✅ Auth working (no user logged in)');
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setConnectionStatus('❌ Connection failed');
        console.error('Connection test error:', err);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="space-y-2 mb-4">
        <p><span className="font-semibold">Database:</span> {connectionStatus}</p>
        <p><span className="font-semibold">Auth:</span> {authTest}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-semibold">Error Details:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {subjects.length > 0 && (
        <div className="mb-4">
          <p className="font-semibold mb-2">Subjects found ({subjects.length}):</p>
          <ul className="list-disc list-inside space-y-1">
            {subjects.map((subject) => (
              <li key={subject.id} className="text-sm">
                <strong>{subject.name}</strong> - {subject.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>URL:</strong> {process.env.REACT_APP_SUPABASE_URL}</p>
        <p><strong>Key:</strong> {process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
      </div>
    </div>
  );
};

export default SupabaseTest;