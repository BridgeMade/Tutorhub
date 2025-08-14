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
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-black">Sessions</h1>
        <p className="text-gray-600 mt-1">Manage your tutoring sessions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-[20px] font-bold text-black">{upcomingSessions.length}</div>
          <div className="text-[14px] text-gray-600 font-semibold">Upcoming</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-[20px] font-bold text-black">{stats.completedSessions}</div>
          <div className="text-[14px] text-gray-600 font-semibold">Completed</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-[20px] font-bold text-black">{stats.totalStudents || assignments.length}</div>
          <div className="text-[14px] text-gray-600 font-semibold">Students</div>
        </div>
      </div>

      {/* Sessions Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-[20px] font-semibold text-black">
            Upcoming Sessions
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
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
          <div className="space-y-4">
            {upcomingSessions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-[20px] font-semibold text-black mb-2">No sessions scheduled</h3>
                <p className="text-gray-600 mb-6">Your students haven't booked any sessions yet.</p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors">
                  Set Availability
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((session, index) => (
                  <div key={session.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-[16px] font-semibold text-black">{session.subject}</span>
                        </div>
                        <div className="text-[14px] text-gray-600 mb-1">
                          {formatSADate(session.scheduledAt)} at {formatSATime(session.scheduledAt)} • {session.duration} minutes
                        </div>
                        <div className="text-[14px] text-gray-600">
                          Student ID: {session.studentId.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-blue-700 transition-colors">
                        Start Session
                      </button>
                      <button className="text-gray-700 px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors">
                        Reschedule
                      </button>
                      <button className="text-gray-700 px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Message Student
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Your Students Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-[20px] font-semibold text-black">
            Your Students {assignments.length > 0 && `(${assignments.length})`}
          </h2>
        </div>
        
        {assignmentsLoading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <span className="ml-3 text-gray-600">Loading your students...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-[20px] font-semibold text-black mb-2">No students assigned yet</h3>
            <p className="text-gray-600 mb-6">Contact your admin to get assigned students</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-[16px]">
                      {assignment.student_name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold text-black">{assignment.student_name}</h3>
                    <p className="text-[14px] text-gray-600">{assignment.subject_name}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white text-[14px] py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    View Progress
                  </button>
                  <button className="flex-1 text-gray-700 text-[14px] py-2 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium">
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};