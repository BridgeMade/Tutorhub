import React, { useState, useEffect } from 'react';
import { lessonService, LessonWithDetails } from '../../services/lessonService';
import { sessionManagementService } from '../../services/sessionManagementService';
import { RescheduleRequestModal } from './RescheduleRequestModal';
import { RescheduleRequestsList } from './RescheduleRequestsList';
import { SessionResourceManager } from './SessionResourceManager';

interface SessionManagementDashboardProps {
  userId: string;
  userRole: 'student' | 'tutor' | 'admin';
}

export const SessionManagementDashboard: React.FC<SessionManagementDashboardProps> = ({
  userId,
  userRole
}) => {
  const [sessions, setSessions] = useState<LessonWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'requests'>('upcoming');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LessonWithDetails | null>(null);
  const [selectedSessionForResources, setSelectedSessionForResources] = useState<LessonWithDetails | null>(null);

  useEffect(() => {
    loadSessions();
    
    // Process expired requests periodically
    const interval = setInterval(() => {
      sessionManagementService.processExpiredRequests();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [userId, userRole]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const sessionsData = await lessonService.getUserLessons(userId, userRole);
      
      // Filter for upcoming sessions and those with active reschedule requests
      const upcomingSessions = sessionsData.filter(session => {
        const sessionDate = new Date(session.scheduled_at);
        const now = new Date();
        return sessionDate > now && ['scheduled', 'confirmed', 'reschedule_requested'].includes(session.status);
      });
      
      setSessions(upcomingSessions);
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleRequest = (session: LessonWithDetails) => {
    setSelectedSession(session);
    setShowRescheduleModal(true);
  };

  const getSessionStatusBadge = (status: string, detailedStatus?: string) => {
    const effectiveStatus = detailedStatus || status;
    
    const statusConfig = {
      scheduled: { color: 'bg-green-100 text-green-800', label: 'Scheduled' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      reschedule_requested: { color: 'bg-yellow-100 text-yellow-800', label: 'Reschedule Requested' },
      reschedule_pending: { color: 'bg-orange-100 text-orange-800', label: 'Pending Approval' },
      rescheduled: { color: 'bg-purple-100 text-purple-800', label: 'Rescheduled' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      lost: { color: 'bg-gray-100 text-gray-800', label: 'Lost Session' }
    };

    const config = statusConfig[effectiveStatus as keyof typeof statusConfig] || statusConfig.scheduled;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTimeUntilSession = (scheduledAt: string) => {
    const sessionDate = new Date(scheduledAt);
    const now = new Date();
    const hoursUntil = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursUntil <= 0) {
      return <span className="text-red-600 font-medium">Overdue</span>;
    } else if (hoursUntil <= 4) {
      return <span className="text-red-600 font-medium">In {hoursUntil}h</span>;
    } else if (hoursUntil <= 24) {
      return <span className="text-yellow-600 font-medium">In {hoursUntil}h</span>;
    } else {
      const daysUntil = Math.ceil(hoursUntil / 24);
      return <span className="text-gray-600">In {daysUntil}d</span>;
    }
  };

  const canReschedule = (session: LessonWithDetails) => {
    const sessionDate = new Date(session.scheduled_at);
    const now = new Date();
    const hoursUntil = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Can't reschedule if already has an active reschedule request
    if (session.detailed_status === 'reschedule_requested') {
      return false;
    }
    
    // Can't reschedule past sessions
    if (hoursUntil <= 0) {
      return false;
    }
    
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Loading sessions...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Session Management</h2>
        <p className="text-gray-600">Manage your upcoming sessions and reschedule requests</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reschedule Requests
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'upcoming' ? (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 5v6m-7-9a8 8 0 1114 0v7a8 8 0 01-16 0V8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
              <p className="text-gray-600">Your scheduled sessions will appear here</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                {/* Session Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {session.subject_name}
                      </h3>
                      {getSessionStatusBadge(session.status, session.detailed_status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">
                          {userRole === 'student' ? 'Tutor' : userRole === 'tutor' ? 'Student' : 'Participants'}:
                        </span>{' '}
                        {userRole === 'student' 
                          ? session.tutor_name 
                          : userRole === 'tutor' 
                          ? session.student_name 
                          : `${session.student_name} & ${session.tutor_name}`
                        }
                      </p>
                      <p>
                        <span className="font-medium">Duration:</span> {session.duration_minutes} minutes
                      </p>
                      {session.notes && (
                        <p>
                          <span className="font-medium">Notes:</span> {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(session.scheduled_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeUntilSession(session.scheduled_at)}
                    </p>
                  </div>
                </div>

                {/* Status-specific Information */}
                {session.detailed_status === 'reschedule_requested' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Reschedule Request Pending</p>
                        <p className="text-yellow-700">
                          A reschedule request has been submitted for this session. Check the "Reschedule Requests" tab for details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3">
                  {canReschedule(session) ? (
                    <button
                      onClick={() => handleRescheduleRequest(session)}
                      className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 font-medium"
                    >
                      Request Reschedule
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500 italic">
                      {session.detailed_status === 'reschedule_requested' 
                        ? 'Reschedule pending'
                        : 'Cannot reschedule'
                      }
                    </span>
                  )}
                  
                  <button
                    onClick={() => setSelectedSessionForResources(session)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Resources
                  </button>
                  
                  <button
                    onClick={() => {/* TODO: Implement session details view */}}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <RescheduleRequestsList
          userId={userId}
          userRole={userRole as 'student' | 'tutor'}
          onRequestUpdate={loadSessions}
        />
      )}

      {/* Reschedule Request Modal */}
      {showRescheduleModal && selectedSession && (
        <RescheduleRequestModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedSession(null);
          }}
          lesson={{
            id: selectedSession.id,
            student_name: selectedSession.student_name || 'Unknown Student',
            tutor_name: selectedSession.tutor_name || 'Unknown Tutor',
            subject_name: selectedSession.subject_name || 'Unknown Subject',
            scheduled_at: selectedSession.scheduled_at,
            duration_minutes: selectedSession.duration_minutes
          }}
          userRole={userRole as 'student' | 'tutor'}
          onSuccess={() => {
            loadSessions();
            setActiveTab('requests'); // Switch to requests tab to see the new request
          }}
        />
      )}

      {/* Session Resources Modal */}
      {selectedSessionForResources && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Session Resources - {selectedSessionForResources.subject_name}
              </h2>
              <button
                onClick={() => setSelectedSessionForResources(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <SessionResourceManager
                sessionId={selectedSessionForResources.id}
                sessionDetails={{
                  subject_name: selectedSessionForResources.subject_name || 'Unknown Subject',
                  student_name: selectedSessionForResources.student_name || 'Unknown Student',
                  tutor_name: selectedSessionForResources.tutor_name || 'Unknown Tutor',
                  scheduled_at: selectedSessionForResources.scheduled_at,
                  duration_minutes: selectedSessionForResources.duration_minutes
                }}
                currentUserId={userId}
                userRole={userRole}
                onResourceUpdate={loadSessions}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};