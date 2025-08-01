import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Check, X, RefreshCw } from 'lucide-react';
import { sessionManagementService, RescheduleRequestWithDetails } from '../../services/sessionManagementService';
import { timeoutService } from '../../services/timeoutService';
import { useAuth } from '../../hooks/useAuth';

export const TimeoutManagement: React.FC = () => {
  const { profile } = useAuth();
  const [escalatedRequests, setEscalatedRequests] = useState<RescheduleRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [stats, setStats] = useState({ activeMonitors: 0, isInitialized: false });

  // Only show for admin users
  if (profile?.role !== 'admin') {
    return null;
  }

  useEffect(() => {
    loadEscalatedRequests();
    loadStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadEscalatedRequests();
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadEscalatedRequests = async () => {
    setLoading(true);
    try {
      const requests = await sessionManagementService.getUserRescheduleRequests('admin', 'admin');
      const escalated = requests.filter(req => req.status === 'admin_required');
      setEscalatedRequests(escalated);
    } catch (error) {
      console.error('❌ Error loading escalated requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = () => {
    const monitorStats = timeoutService.getMonitoringStats();
    setStats(monitorStats);
  };

  const handleAdminDecision = async (requestId: string, decision: 'approved' | 'declined') => {
    setProcessing(requestId);
    try {
      const result = await sessionManagementService.adminRespondToRequest(
        requestId,
        decision,
        `Admin ${decision} due to timeout escalation`
      );

      if (result.success) {
        await loadEscalatedRequests(); // Refresh the list
        console.log(`✅ Request ${requestId} ${decision} by admin`);
      } else {
        console.error(`❌ Failed to ${decision} request:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error ${decision} request:`, error);
    } finally {
      setProcessing(null);
    }
  };

  const processExpiredRequests = async () => {
    setLoading(true);
    try {
      const escalatedCount = await timeoutService.processExpiredRequests();
      console.log(`✅ Processed ${escalatedCount} expired requests`);
      await loadEscalatedRequests();
    } catch (error) {
      console.error('❌ Error processing expired requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m ago`;
    } else {
      return `${diffMins}m ago`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Clock className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900">Timeout Management</h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            {stats.activeMonitors} active monitors | Service: {stats.isInitialized ? '✅' : '❌'}
          </div>
          <button
            onClick={processExpiredRequests}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Check Expired</span>
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Escalated Requests</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-1">{escalatedRequests.length}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Active Monitors</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.activeMonitors}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Service Status</span>
          </div>
          <p className="text-sm font-medium text-green-600 mt-1">
            {stats.isInitialized ? 'Running' : 'Stopped'}
          </p>
        </div>
      </div>

      {/* Escalated Requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Requests Requiring Admin Decision</h3>
        
        {loading && escalatedRequests.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading escalated requests...</p>
          </div>
        ) : escalatedRequests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No escalated requests at this time</p>
            <p className="text-sm text-gray-400 mt-1">All requests are being handled within the 4-hour window</p>
          </div>
        ) : (
          <div className="space-y-4">
            {escalatedRequests.map((request) => (
              <div key={request.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-orange-900">
                        {request.request_type === 'reschedule' ? 'Reschedule Request' : 'Cancellation Request'}
                      </span>
                      <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                        ESCALATED
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Subject:</strong> {request.lesson_details?.subject_name || 'Unknown'}</p>
                        <p><strong>Student:</strong> {request.lesson_details?.student_name || 'Unknown'}</p>
                        <p><strong>Tutor:</strong> {request.lesson_details?.tutor_name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p><strong>Original Date:</strong> {new Date(request.original_date).toLocaleString()}</p>
                        {request.proposed_date && (
                          <p><strong>Proposed Date:</strong> {new Date(request.proposed_date).toLocaleString()}</p>
                        )}
                        <p><strong>Escalated:</strong> {formatTimeAgo(request.admin_escalated_at || request.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm"><strong>Reason:</strong> {request.reason}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleAdminDecision(request.id, 'approved')}
                      disabled={processing === request.id}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    
                    <button
                      onClick={() => handleAdminDecision(request.id, 'declined')}
                      disabled={processing === request.id}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
                
                {processing === request.id && (
                  <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing decision...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};