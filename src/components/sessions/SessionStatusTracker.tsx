import React, { useState, useEffect } from 'react';
import { Clock, Activity, TrendingUp, Calendar, Filter, RefreshCw } from 'lucide-react';
import { sessionStatusService, SessionStatus, SessionStatusHistory } from '../../services/sessionStatusService';
import { useAuth } from '../../hooks/useAuth';

interface StatusCard {
  status: SessionStatus;
  count: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
}

interface SessionStatusTrackerProps {
  lessonId?: string; // If provided, shows history for specific lesson
  className?: string;
}

export const SessionStatusTracker: React.FC<SessionStatusTrackerProps> = ({
  lessonId,
  className = ''
}) => {
  const { user, profile } = useAuth();
  const [statusStats, setStatusStats] = useState<Record<SessionStatus, number>>({} as Record<SessionStatus, number>);
  const [statusHistory, setStatusHistory] = useState<SessionStatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SessionStatus | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, lessonId, selectedStatus, timeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (lessonId) {
        // Load history for specific lesson
        const history = await sessionStatusService.getSessionStatusHistory(lessonId);
        setStatusHistory(history);
      } else {
        // Load statistics for user
        const stats = await sessionStatusService.getStatusStatistics(
          user?.id,
          profile?.role as 'student' | 'tutor' | 'admin'
        );
        setStatusStats(stats);
      }
    } catch (error) {
      console.error('❌ Error loading status data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCards = (): StatusCard[] => {
    const total = Object.values(statusStats).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(statusStats)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        status: status as SessionStatus,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const StatusBadge: React.FC<{ status: SessionStatus }> = ({ status }) => {
    const config = sessionStatusService.getStatusDisplay(status);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (lessonId) {
    // Lesson-specific status history view
    return (
      <div className={`bg-white rounded-lg shadow-lg ${className}`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Session Status Timeline</h3>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading status history...</p>
            </div>
          ) : statusHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No status history available for this session</p>
            </div>
          ) : (
            <div className="space-y-4">
              {statusHistory.map((record, index) => (
                <div key={record.id} className="flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                    }`}></div>
                    {index < statusHistory.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Status change details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={record.status as SessionStatus} />
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(record.changed_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      Changed by <strong>{record.user_name}</strong>
                      {record.previous_status && (
                        <span> from <StatusBadge status={record.previous_status as SessionStatus} /></span>
                      )}
                    </p>
                    
                    {record.change_reason && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        "{record.change_reason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard overview with statistics
  const statusCards = getStatusCards();

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Session Status Overview</h3>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Statistics */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading status statistics...</p>
          </div>
        ) : statusCards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No session data available</p>
            <p className="text-sm mt-1">Book some sessions to see status tracking</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {statusCards.map(({ status, count, percentage }) => {
              const config = sessionStatusService.getStatusDisplay(status);
              return (
                <div
                  key={status}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedStatus === status 
                      ? config.bgColor + ' border-current' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{config.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${config.bgColor} ${config.color}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm font-medium text-gray-700">{config.label}</p>
                    <p className="text-xs text-gray-500">{config.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Validation Info */}
      <div className="px-6 pb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Status Transitions</span>
          </div>
          <p className="text-xs text-blue-800">
            Session statuses automatically update based on user actions and system rules. 
            Each status change is tracked with timestamps and reasons for full audit trail.
          </p>
        </div>
      </div>
    </div>
  );
};