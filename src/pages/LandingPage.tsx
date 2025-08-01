import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const { user } = useAuthContext();

  // Redirect authenticated users to their respective dashboards
  if (user) {
    const userRole = user.user_metadata?.role;
    switch (userRole) {
      case 'student':
        return <Navigate to="/student" replace />;
      case 'tutor':
        return <Navigate to="/tutor" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16 sm:py-20">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Welcome to TutorHub
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            A comprehensive platform for managing student lessons, progress tracking, and tutor coordination.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => window.location.href = '/auth'}
              className="btn-primary text-lg px-8 py-3"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
