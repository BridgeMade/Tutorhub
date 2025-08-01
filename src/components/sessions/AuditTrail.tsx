import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Calendar, User, Activity, 
  Eye, Download, RefreshCw, ChevronDown, ChevronUp,
  Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import { auditTrailService, AuditTrailEntryWithDetails, AuditFilter } from '../../services/auditTrailService';
import { useAuth } from '../../hooks/useAuth';

interface AuditTrailProps {
  lessonId?: string; // If provided, shows audit trail for specific lesson
  showFilters?: boolean;
  showStats?: boolean;
  className?: string;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  lessonId,
  showFilters = true,
  showStats = true,
  className = ''
}) => {
  const { user, profile } = useAuth();
  const [auditEntries, setAuditEntries] = useState<AuditTrailEntryWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [statistics, setStatistics] = useState<any>(null);
  
  // Filters
  const [filters, setFilters] = useState<AuditFilter>({
    lessonId,
    limit: 50,
    offset: 0
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadAuditTrail();
      if (showStats) {
        loadStatistics();
      }
    }
  }, [user?.id, filters, lessonId]);

  const loadAuditTrail = async () => {
    setLoading(true);
    try {
      let entries: AuditTrailEntryWithDetails[];
      
      if (lessonId) {
        entries = await auditTrailService.getLessonAuditTrail(lessonId);
      } else {
        entries = await auditTrailService.getAuditTrail({
          ...filters,
          userId: profile?.role === 'admin' ? undefined : user?.id
        });
      }

      // Apply search filter on frontend if needed
      if (searchTerm) {
        entries = entries.filter(entry => 
          entry.changes_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.user_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setAuditEntries(entries);
    } catch (error) {
      console.error('❌ Error loading audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await auditTrailService.getAuditStatistics({
        lessonId,
        userId: profile?.role === 'admin' ? undefined : user?.id,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });
      setStatistics(stats);
    } catch (error) {
      console.error('❌ Error loading audit statistics:', error);
    }
  };

  const toggleEntryExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
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

  const ActionBadge: React.FC<{ actionType: string }> = ({ actionType }) => {
    const config = auditTrailService.getActionTypeDisplay(actionType);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ 
    title, value, icon, color 
  }) => (
    <div className={`p-4 rounded-lg border-l-4 ${color} bg-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {lessonId ? 'Session Audit Trail' : 'Audit Trail'}
            </h3>
          </div>
          
          <div className="flex items-center space-x-3">
            {showFilters && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md border transition-colors ${
                  showFilterPanel 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilterPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
            
            <button
              onClick={loadAuditTrail}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {showStats && statistics && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <StatCard
              title="Total Entries"
              value={statistics.totalEntries}
              icon={<Activity className="w-6 h-6" />}
              color="border-l-blue-500"
            />
            <StatCard
              title="Actions Today"
              value={Object.keys(statistics.actionBreakdown).length}
              icon={<Clock className="w-6 h-6" />}
              color="border-l-green-500"
            />
            <StatCard
              title="Active Users"
              value={Object.keys(statistics.userBreakdown).length}
              icon={<User className="w-6 h-6" />}
              color="border-l-orange-500"
            />
            <StatCard
              title="Time Span"
              value={Math.ceil((new Date().getTime() - new Date(statistics.timeRange.earliest).getTime()) / (1000 * 60 * 60 * 24))}
              icon={<Calendar className="w-6 h-6" />}
              color="border-l-purple-500"
            />
          </div>
          
          {/* Action Breakdown */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(statistics.actionBreakdown).map(([action, count]) => (
              <ActionBadge key={action} actionType={action} />
            ))}
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilterPanel && showFilters && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search changes, reasons, users..."
                />
              </div>
            </div>

            {/* Action Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action Types</label>
              <select
                value={filters.actionTypes?.[0] || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  actionTypes: e.target.value ? [e.target.value] : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="status_changed">Status Changed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  const now = new Date();
                  let dateFrom: Date | undefined;
                  
                  switch (value) {
                    case '24h':
                      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                      break;
                    case '7d':
                      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      break;
                    case '30d':
                      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                      break;
                    case '90d':
                      dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                      break;
                    default:
                      dateFrom = undefined;
                  }
                  
                  setFilters(prev => ({ ...prev, dateFrom, dateTo: undefined }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Entries */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading audit trail...</p>
          </div>
        ) : auditEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No audit trail entries found</p>
            <p className="text-sm mt-1">Changes will appear here as they happen</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditEntries.map((entry, index) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleEntryExpansion(entry.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center mt-1">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                        }`}></div>
                        {index < auditEntries.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>

                      {/* Entry content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <ActionBadge actionType={entry.action_type} />
                          <span className="text-sm text-gray-500">
                            {entry.entity_type}
                          </span>
                        </div>
                        
                        <p className="text-sm font-medium text-gray-900">
                          {entry.changes_summary}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{entry.user_name}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(entry.performed_at)}</span>
                            </span>
                            {!lessonId && entry.lesson_subject && (
                              <span className="flex items-center space-x-1">
                                <span>📚 {entry.lesson_subject}</span>
                              </span>
                            )}
                          </div>
                          
                          <button className="text-gray-400 hover:text-gray-600">
                            {expandedEntries.has(entry.id) ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedEntries.has(entry.id) && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                    <div className="mt-4 space-y-4">
                      {/* Reason */}
                      {entry.reason && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Reason</h4>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                            {entry.reason}
                          </p>
                        </div>
                      )}

                      {/* Session Details */}
                      {!lessonId && (entry.lesson_student || entry.lesson_tutor) && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Session Details</h4>
                          <div className="bg-white p-3 rounded border text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              {entry.lesson_subject && (
                                <p><strong>Subject:</strong> {entry.lesson_subject}</p>
                              )}
                              {entry.lesson_student && (
                                <p><strong>Student:</strong> {entry.lesson_student}</p>
                              )}
                              {entry.lesson_tutor && (
                                <p><strong>Tutor:</strong> {entry.lesson_tutor}</p>
                              )}
                              <p><strong>User Role:</strong> {entry.user_role}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Technical Details */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Technical Details</h4>
                        <div className="bg-white p-3 rounded border text-xs text-gray-600 font-mono">
                          <p><strong>Entry ID:</strong> {entry.id}</p>
                          <p><strong>Entity ID:</strong> {entry.entity_id}</p>
                          <p><strong>Timestamp:</strong> {new Date(entry.performed_at).toLocaleString()}</p>
                          <p><strong>User ID:</strong> {entry.performed_by}</p>
                        </div>
                      </div>
                    </div>
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