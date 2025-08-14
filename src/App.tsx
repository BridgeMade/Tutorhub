import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DashboardDemo from './pages/DashboardDemo';
import K7Home from './pages/K7Home';
import HomeScreen from './pages/HomeScreen';
import CreateTestAccount from './pages/CreateTestAccount';
import SimpleTestLogin from './pages/SimpleTestLogin';
import CurrentUserTest from './pages/CurrentUserTest';
import UpdateUserGrade from './pages/UpdateUserGrade';
import AdminGradeManagement from './pages/AdminGradeManagement';
import DirectGradeUpdate from './pages/DirectGradeUpdate';
import DatabaseSchemaSetup from './pages/DatabaseSchemaSetup';
import FixGradeUpdates from './pages/FixGradeUpdates';
import GradeVerification from './pages/GradeVerification';
import { Toaster } from 'react-hot-toast';
import { appInitService } from './services/appInitService';
import './utils/testSupabase'; // Test Supabase connection on app start

function App() {
  // Initialize app services on mount
  useEffect(() => {
    appInitService.initialize();

    // Cleanup on unmount
    return () => {
      appInitService.cleanup();
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/demo" element={<DashboardDemo />} />
          <Route path="/create-test-account" element={<CreateTestAccount />} />
          <Route path="/simple-test" element={<SimpleTestLogin />} />
          <Route path="/current-user" element={<CurrentUserTest />} />
          <Route path="/update-grade" element={<UpdateUserGrade />} />
          <Route path="/admin/grades" element={<AdminGradeManagement />} />
          <Route path="/direct-update" element={<DirectGradeUpdate />} />
          <Route path="/schema-setup" element={<DatabaseSchemaSetup />} />
          <Route path="/fix-grades" element={<FixGradeUpdates />} />
          <Route path="/verify-grades" element={<GradeVerification />} />
          <Route path="/k7-new" element={
            <div className="min-h-screen flex justify-center items-start py-6">
              <div className="w-[420px]">
                <K7Home />
              </div>
            </div>
          } />
          <Route path="/k7-clean" element={
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
              <div className="w-[375px] h-[812px] bg-white rounded-[40px] border-8 border-gray-800 overflow-hidden shadow-2xl">
                {/* Status Bar */}
                <div className="bg-white flex justify-between items-center px-6 py-2 text-sm font-medium">
                  <span>9:30</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-3 border border-black rounded-sm relative">
                      <div className="w-4 h-2 bg-black rounded-sm absolute top-0.5 left-0.5"></div>
                    </div>
                  </div>
                </div>
                {/* Main Content */}
                <div className="h-full overflow-y-auto bg-gray-50">
                  <HomeScreen />
                </div>
              </div>
            </div>
          } />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-gray-600">Page not found</p>
            </div>
          </div>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
