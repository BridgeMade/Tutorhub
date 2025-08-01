import React, { useState, useEffect } from 'react';
import { Student, TutoringSession, DashboardStats } from '../../types';
import { BookSessionModal } from './BookSessionModal';
import { ProgressChart } from './ProgressChart';
import { RecentActivity } from './RecentActivity';
import { assignmentService, AssignmentWithDetails } from '../../services/assignmentService';
import { formatSADateTime } from '../../utils/saFormatting';

interface StudentDashboardContentProps {
  student: Student;
  upcomingSessions: TutoringSession[];
  stats: DashboardStats;
}

export const StudentDashboardContent: React.FC<StudentDashboardContentProps> = ({
  student,
  upcomingSessions,
  stats
}) => {
  const [showBookModal, setShowBookModal] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);

  useEffect(() => {
    loadStudentAssignments();
  }, [student.id]);

  const loadStudentAssignments = async () => {
    try {
      const assignmentsResponse = await assignmentService.getStudentAssignments(student.id);
      if (assignmentsResponse.data) {
        setAssignments(assignmentsResponse.data);
      }
    } catch (error) {
      console.error('Error loading student assignments:', error);
    }
  };

  const getTutorName = (tutorId: string) => {
    const assignment = assignments.find(a => a.tutor_id === tutorId);
    return assignment?.tutor_name || 'TBD';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-400 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {student.firstName}!
            </h1>
            <p className="text-orange-100 text-lg mb-4">
              Here's your learning progress and upcoming sessions.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Grade: {student.grade || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Subjects: {student.subjects?.join(', ') || 'None'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Book Session
          </button>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Sessions</h2>
              <p className="text-gray-600 mt-1">Your scheduled learning sessions</p>
            </div>
            <button 
              onClick={() => setShowBookModal(true)}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium bg-orange-50 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors"
            >
              + New Session
            </button>
          </div>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming sessions</h3>
            <p className="text-gray-500 mb-6">Schedule your first session to start learning!</p>
            <button
              onClick={() => setShowBookModal(true)}
              className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-500 hover:to-pink-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Book Your First Session
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tutor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcomingSessions.slice(0, 5).map((session, index) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatSADateTime(session.scheduledAt).split(',')[0]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatSADateTime(session.scheduledAt).split(',')[1]?.trim()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {session.subject}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getTutorName(session.tutorId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-500 hover:to-green-600 transition-all duration-200 shadow-sm hover:shadow-md">
                        Join Session
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {upcomingSessions.length > 5 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              View all {upcomingSessions.length} sessions →
            </button>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <ProgressChart studentId={student.id} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <RecentActivity studentId={student.id} />
        </div>
      </div>

      {showBookModal && (
        <BookSessionModal
          studentId={student.id}
          onClose={() => setShowBookModal(false)}
          preselectedSubject=""
        />
      )}
    </div>
  );
};