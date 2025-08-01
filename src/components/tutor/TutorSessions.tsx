import React, { useState, useEffect } from 'react';
import { Tutor, TutoringSession, DashboardStats } from '../../types';
import { SessionCalendarView } from '../student/SessionCalendarView';
import { assignmentService, AssignmentWithDetails } from '../../services/assignmentService';
import { formatSADateTime, formatSADate, formatSATime } from '../../utils/saFormatting';

interface TutorSessionsProps {
  tutor: Tutor;
  upcomingSessions: TutoringSession[];
  stats: DashboardStats;
}

export const TutorSessions: React.FC<TutorSessionsProps> = ({
  tutor,
  upcomingSessions,
  stats
}) => {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadTutorAssignments();
  }, [tutor.id]);

  const loadTutorAssignments = async () => {
    try {
      const assignmentsResponse = await assignmentService.getTutorAssignments(tutor.id);
      if (assignmentsResponse.data) {
        setAssignments(assignmentsResponse.data);
      }
    } catch (error) {
      console.error('Error loading tutor assignments:', error);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const getSessionColor = (subject: string, status: string) => {
    const baseColors: { [key: string]: string } = {
      'Mathematics': 'bg-blue-100 border-blue-300 text-blue-800',
      'Physics': 'bg-green-100 border-green-300 text-green-800',
      'Chemistry': 'bg-purple-100 border-purple-300 text-purple-800',
      'Biology': 'bg-orange-100 border-orange-300 text-orange-800',
      'English': 'bg-pink-100 border-pink-300 text-pink-800',
    };
    
    if (status === 'completed') {
      return baseColors[subject]?.replace('100', '50').replace('800', '600') || 'bg-gray-50';
    }
    return baseColors[subject] || 'bg-gray-100';
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-400 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Teaching Sessions</h1>
            <p className="text-orange-100 text-lg mb-4">
              Manage your tutoring sessions and track your teaching progress
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>{upcomingSessions.length} Upcoming</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <span>{stats.completedSessions} Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span>{stats.totalStudents || assignments.length} Students</span>
              </div>
            </div>
          </div>
          <button className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Set Availability
          </button>
        </div>
      </div>

      {/* Main Calendar/Sessions Section */}
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Session Calendar</h2>
            <p className="text-gray-600 mt-1">View and manage your teaching sessions</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Calendar or List View */}
        {viewMode === 'calendar' ? (
          <SessionCalendarView
            sessions={upcomingSessions}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onSessionClick={(session) => {
              console.log('Session clicked:', session);
              // You can add session details modal here
            }}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions scheduled</h3>
                <p className="text-gray-500 mb-6">Your students haven't booked any sessions yet.</p>
                <button className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-500 hover:to-pink-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Set Availability
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingSessions.map((session, index) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-12 rounded-full ${getSessionColor(session.subject, session.status).replace('bg-', 'bg-').replace('100', '400')}`}></div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{session.subject}</h3>
                          <p className="text-sm text-gray-600">
                            {formatSADate(session.scheduledAt)} at {formatSATime(session.scheduledAt)}
                          </p>
                          <p className="text-xs text-gray-500">Student {session.studentId.slice(0, 8)} • {session.duration} minutes</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSessionColor(session.subject, session.status)}`}>
                          {session.status}
                        </span>
                        <div className="flex space-x-2">
                          <button className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:from-green-500 hover:to-green-600 transition-all duration-200 shadow-sm hover:shadow-md">
                            Start
                          </button>
                          <button className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:from-gray-500 hover:to-gray-600 transition-all duration-200 shadow-sm hover:shadow-md">
                            Reschedule
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Your Students Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Students</h2>
              <p className="text-gray-600 mt-1">Manage your teaching relationships</p>
            </div>
            {assignments.length > 0 && (
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {assignments.length} active assignment{assignments.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        {assignmentsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">Loading your students...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students assigned yet</h3>
            <p className="text-gray-500 mb-6">Contact your admin to get assigned students</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-md transition-all duration-200 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {assignment.student_name?.charAt(0) || 'S'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{assignment.student_name}</h3>
                          <p className="text-sm text-gray-600">{assignment.student_email}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSessionColor(assignment.subject_name, 'active')}`}>
                          {assignment.subject_name}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-gradient-to-r from-orange-400 to-pink-400 text-white text-sm py-2 px-4 rounded-lg hover:from-orange-500 hover:to-pink-500 transition-all duration-200 font-medium">
                      View Progress
                    </button>
                    <button className="flex-1 bg-white text-gray-700 text-sm py-2 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium">
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};