import React, { useState, useEffect } from 'react';
import { Student, TutoringSession, DashboardStats } from '../../types';
import { BookSessionModal } from './BookSessionModal';
import { ProgressChart } from './ProgressChart';
import { RecentActivity } from './RecentActivity';
import { SubjectProgress } from './SubjectProgress';
import { StudyPlanner } from './StudyPlanner';
import { PerformanceAnalytics } from './PerformanceAnalytics';
import { ResourceLibrary } from './ResourceLibrary';
import { assignmentService, AssignmentWithDetails } from '../../services/assignmentService';
import { formatSADateTime } from '../../utils/saFormatting';

interface StudentDashboardProps {
  student: Student;
  upcomingSessions: TutoringSession[];
  stats: DashboardStats;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  upcomingSessions,
  stats
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'planner' | 'analytics' | 'resources' | 'progress'>('overview');
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    loadStudentAssignments();
  }, [student.id]);

  const loadStudentAssignments = async () => {
    try {
      console.log('🔍 StudentDashboard: Loading assignments for student ID:', student.id);
      console.log('🔍 StudentDashboard: Student object:', student);
      
      // Debug what's in the database
      await assignmentService.debugAllAssignments();
      
      const assignmentsResponse = await assignmentService.getStudentAssignments(student.id);
      console.log('🔍 StudentDashboard: Assignment service response:', assignmentsResponse);
      if (assignmentsResponse.data) {
        setAssignments(assignmentsResponse.data);
        console.log('🔍 StudentDashboard: Found assignments:', assignmentsResponse.data.length, assignmentsResponse.data);
      } else {
        console.log('🔍 StudentDashboard: No assignments found or data is null');
      }
    } catch (error) {
      console.error('Error loading student assignments:', error);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {student.firstName}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's your learning progress and upcoming sessions.
            </p>
            <div className="mt-3 flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Grade: <span className="font-medium">{student.grade || 'Not specified'}</span>
              </div>
              <div className="text-sm text-gray-500">
                Subjects: <span className="font-medium">{student.subjects?.join(', ') || 'None'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => setActiveView('analytics')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="p-2 bg-blue-100 rounded-lg mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Total Sessions</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => setActiveView('planner')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="p-2 bg-green-100 rounded-lg mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Upcoming</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessions}</p>
            </div>
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100 hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => setActiveView('progress')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="p-2 bg-purple-100 rounded-lg mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Completed</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
            </div>
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100 hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => setActiveView('resources')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="p-2 bg-yellow-100 rounded-lg mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Avg Rating</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating?.toFixed(1) || 'N/A'}</p>
            </div>
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Assigned Tutors Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Assigned Tutors</h2>
          {assignments.length > 0 && (
            <span className="text-sm text-gray-500">{assignments.length} active assignment{assignments.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        
        {assignmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading your tutors...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">No tutors assigned yet</p>
            <p className="text-sm text-gray-500">Contact your admin to get assigned to a tutor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{assignment.tutor_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{assignment.tutor_email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {assignment.subject_name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedSubject(assignment.subject_name);
                      setShowBookModal(true);
                    }}
                    className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 transition-colors"
                  >
                    Book Session
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 text-xs py-2 px-3 rounded hover:bg-gray-200 transition-colors">
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
            <button 
              onClick={() => setShowBookModal(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 mb-3">No upcoming sessions scheduled.</p>
              <button
                onClick={() => setShowBookModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Book your first session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{session.subject}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatSADateTime(session.scheduledAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">{session.duration} min</p>
                    <button className="text-xs text-gray-500 hover:text-gray-700 mt-1">
                      Join Session
                    </button>
                  </div>
                </div>
              ))}
              {upcomingSessions.length > 3 && (
                <div className="text-center pt-2">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View {upcomingSessions.length - 3} more sessions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <SubjectProgress subjects={student.subjects || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart studentId={student.id} />
        <RecentActivity studentId={student.id} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '🏠' },
              { id: 'planner', label: 'Study Planner', icon: '📅' },
              { id: 'analytics', label: 'Performance', icon: '📊' },
              { id: 'resources', label: 'Resources', icon: '📚' },
              { id: 'progress', label: 'Progress', icon: '🎯' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-screen">
        {activeView === 'overview' && renderOverviewContent()}
        {activeView === 'planner' && <StudyPlanner studentId={student.id} />}
        {activeView === 'analytics' && <PerformanceAnalytics studentId={student.id} />}
        {activeView === 'resources' && <ResourceLibrary studentId={student.id} />}
        {activeView === 'progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProgressChart studentId={student.id} />
            <RecentActivity studentId={student.id} />
            <div className="lg:col-span-2">
              <SubjectProgress subjects={student.subjects || []} />
            </div>
          </div>
        )}
      </div>

      {showBookModal && (
        <BookSessionModal
          studentId={student.id}
          onClose={() => setShowBookModal(false)}
          preselectedSubject={selectedSubject}
        />
      )}
    </div>
  );
};