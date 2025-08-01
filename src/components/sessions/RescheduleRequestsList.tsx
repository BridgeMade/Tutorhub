import React, { useState, useEffect } from 'react';
import { sessionManagementService, RescheduleRequestWithDetails } from '../../services/sessionManagementService';
import { CounterProposalModal } from './CounterProposalModal';

interface RescheduleRequestsListProps {
  userId: string;
  userRole: 'student' | 'tutor' | 'admin';
  onRequestUpdate?: () => void;
}

export const RescheduleRequestsList: React.FC<RescheduleRequestsListProps> = ({
  userId,
  userRole,
  onRequestUpdate
}) => {
  const [requests, setRequests] = useState<RescheduleRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCounterProposal, setShowCounterProposal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequestWithDetails | null>(null);

  useEffect(() => {
    loadRequests();
  }, [userId, userRole]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const requestsData = await sessionManagementService.getUserRescheduleRequests(userId, userRole);
      
      // Filter to show only pending requests that need user action
      const actionableRequests = requestsData.filter(request => {
        if (userRole === 'admin') {
          return request.status === 'admin_required' || request.admin_escalated;
        }
        
        // Show requests that need the current user's response
        return request.status === 'pending' && request.requested_by !== userId;
      });
      
      setRequests(actionableRequests);
    } catch (error) {
      console.error('❌ Error loading reschedule requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const result = await sessionManagementService.respondToRescheduleRequest(
        requestId,
        'approved',
        'Request approved'
      );

      if (result.success) {
        alert('Request approved successfully!');
        loadRequests();
        onRequestUpdate?.();
      } else {
        alert(`Failed to approve request: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error approving request:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string, reason?: string) => {
    setProcessingId(requestId);
    try {
      const result = await sessionManagementService.respondToRescheduleRequest(
        requestId,
        'declined',
        reason || 'Request declined'
      );

      if (result.success) {
        alert('Request declined. The requester will be notified.');
        loadRequests();
        onRequestUpdate?.();
      } else {
        alert(`Failed to decline request: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error declining request:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCounterProposal = (request: RescheduleRequestWithDetails) => {
    setSelectedRequest(request);
    setShowCounterProposal(true);
  };

  const handleAdminResponse = async (requestId: string, decision: 'approved' | 'declined', notes?: string) => {
    setProcessingId(requestId);
    try {
      const result = await sessionManagementService.adminRespondToRequest(requestId, decision, notes);

      if (result.success) {
        alert(`Request ${decision} by admin.`);
        loadRequests();
        onRequestUpdate?.();
      } else {
        alert(`Failed to process admin decision: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error processing admin response:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string, isAdminEscalated: boolean) => {
    if (isAdminEscalated || status === 'admin_required') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Admin Required
        </span>
      );
    }

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      counter_proposed: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getTimeUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft <= 0) {
      return <span className="text-red-600 font-medium">Overdue</span>;
    } else if (hoursLeft <= 1) {
      return <span className="text-red-600 font-medium">{hoursLeft}h left</span>;
    } else if (hoursLeft <= 4) {
      return <span className="text-yellow-600 font-medium">{hoursLeft}h left</span>;
    } else {
      return <span className="text-gray-600">{hoursLeft}h left</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Loading requests...</span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600">No pending reschedule requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Pending Reschedule Requests ({requests.length})
        </h3>
        <button
          onClick={loadRequests}
          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {requests.map((request) => (
        <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h4 className="font-medium text-gray-900">
                  {request.lesson_details?.subject_name} Session
                </h4>
                {getStatusBadge(request.status, request.admin_escalated)}
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Requested by:</span> {request.requester_name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Student:</span> {request.lesson_details?.student_name} | 
                <span className="font-medium"> Tutor:</span> {request.lesson_details?.tutor_name}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Response needed: {getTimeUntilDeadline(request.response_deadline)}</p>
              <p>{new Date(request.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Request Type</p>
                <p className="text-sm text-gray-900 capitalize">{request.request_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Original Date & Time</p>
                <p className="text-sm text-gray-900">
                  {new Date(request.original_date).toLocaleString()}
                </p>
              </div>
              {request.request_type === 'reschedule' && request.proposed_date && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Proposed Date & Time</p>
                    <p className="text-sm text-gray-900">
                      {new Date(request.proposed_date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Duration</p>
                    <p className="text-sm text-gray-900">{request.proposed_duration} minutes</p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Reason</p>
              <p className="text-sm text-gray-900">{request.reason}</p>
            </div>
          </div>

          {/* Admin Escalation Notice */}
          {(request.admin_escalated || request.status === 'admin_required') && userRole !== 'admin' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-red-800">Admin Intervention Required</p>
                  <p className="text-red-700">
                    This request requires admin approval due to timing constraints or no response within the deadline.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            {userRole === 'admin' ? (
              // Admin Actions
              <>
                <button
                  onClick={() => handleAdminResponse(request.id, 'declined', 'Admin declined request')}
                  disabled={processingId === request.id}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
                >
                  {processingId === request.id ? 'Processing...' : 'Decline'}
                </button>
                <button
                  onClick={() => handleAdminResponse(request.id, 'approved', 'Admin approved request')}
                  disabled={processingId === request.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {processingId === request.id ? 'Processing...' : 'Approve'}
                </button>
              </>
            ) : (
              // Student/Tutor Actions
              <>
                {request.request_type === 'reschedule' && (
                  <button
                    onClick={() => handleCounterProposal(request)}
                    disabled={processingId === request.id}
                    className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium disabled:opacity-50"
                  >
                    Counter Propose
                  </button>
                )}
                <button
                  onClick={() => handleDecline(request.id)}
                  disabled={processingId === request.id}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
                >
                  {processingId === request.id ? 'Processing...' : 'Decline'}
                </button>
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={processingId === request.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {processingId === request.id ? 'Processing...' : 'Approve'}
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Counter Proposal Modal */}
      {showCounterProposal && selectedRequest && (
        <CounterProposalModal
          isOpen={showCounterProposal}
          onClose={() => {
            setShowCounterProposal(false);
            setSelectedRequest(null);
          }}
          originalRequest={selectedRequest}
          onSuccess={() => {
            loadRequests();
            onRequestUpdate?.();
          }}
        />
      )}
    </div>
  );
};