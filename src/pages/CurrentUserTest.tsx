import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

const CurrentUserTest: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }

      if (session?.user) {
        setCurrentUser(session.user);
        console.log('Current user:', session.user);

        // Try to get user profile
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.log('No profile found:', profileError.message);
          } else {
            setUserProfile(profile);
            console.log('User profile:', profile);
          }
        } catch (err) {
          console.log('Profile fetch error:', err);
        }
      } else {
        console.log('No current session');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    } else {
      setCurrentUser(null);
      setUserProfile(null);
      console.log('Signed out successfully');
    }
  };

  const goToDashboard = () => {
    // Navigate to the Grade 8-12 dashboard route
    window.location.href = '/dashboard';
  };

  const goToK7Dashboard = () => {
    // Navigate to K-7 dashboard
    window.location.href = '/k7-new';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking current session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Current Session Status</h1>
          <p className="text-gray-600 mt-2">
            Check if you're already logged in and test the dashboards
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {currentUser ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 font-medium">You are currently logged in!</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">User Information</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Email:</strong> {currentUser.email}</div>
                      <div><strong>User ID:</strong> {currentUser.id}</div>
                      <div><strong>Created:</strong> {new Date(currentUser.created_at).toLocaleDateString()}</div>
                      <div><strong>Last Sign In:</strong> {currentUser.last_sign_in_at ? new Date(currentUser.last_sign_in_at).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>

                  {userProfile && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Profile Information</h3>
                      <div className="space-y-1 text-sm">
                        <div><strong>Name:</strong> {userProfile.full_name || 'N/A'}</div>
                        <div><strong>Role:</strong> {userProfile.role || 'N/A'}</div>
                        <div><strong>Grade Level:</strong> {userProfile.grade_level || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Test Dashboards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={goToDashboard}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      🎓 Test Grade 8-12 Dashboard
                    </button>
                    <button
                      onClick={goToK7Dashboard}
                      className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      🧮 Test K-7 Dashboard
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <button
                    onClick={signOut}
                    className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-800 font-medium">No active session found</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  You're not currently logged in. You can still test the dashboards in demo mode:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={goToK7Dashboard}
                    className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    🧮 Test K-7 Dashboard (Demo)
                  </button>
                  <a
                    href="/auth"
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center block"
                  >
                    🔐 Go to Login Page
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Grade 8-12 Dashboard Features</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div>✅ Native iOS color scheme</div>
              <div>✅ Inter font with antialiased smoothing</div>
              <div>✅ Touch-friendly interactions (44px minimum height)</div>
              <div>✅ Refined shadows and spacing</div>
              <div>✅ Consistent with K-7 dashboard styling</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentUserTest;