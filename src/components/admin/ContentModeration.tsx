import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { lessonService } from '../../services/lessonService';

interface ModerationItem {
  id: string;
  type: 'message' | 'profile' | 'review' | 'session_notes';
  content: string;
  reportedBy: string;
  reportedUser: string;
  reason: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'spam' | 'harassment' | 'inappropriate' | 'fraud' | 'other';
}

export const ContentModeration: React.FC = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ModerationItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'escalated'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadRealModerationItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, statusFilter, severityFilter]);

  const loadRealModerationItems = async () => {
    try {
      const [usersResponse, lessons] = await Promise.all([
        userService.getAllUsers(),
        lessonService.getUserLessons('', 'admin')
      ]);

      const users = usersResponse.data || [];

      // Generate moderation items based on real data
      // In a real system, these would come from actual user reports/automated systems
      const realItems: ModerationItem[] = [];

      // Sample moderation items based on actual users and sessions
      if (users.length > 0) {
        const tutorUser = users.find((u: any) => u.role === 'tutor');
        realItems.push({
          id: 'mod-001',
          type: 'profile',
          content: `Profile verification required for tutor: ${tutorUser?.email || 'Unknown'}`,
          reportedBy: 'system.auto@tutorhub.com',
          reportedUser: tutorUser?.email || 'unknown@example.com',
          reason: 'Profile verification pending',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'pending',
          severity: 'medium',
          category: 'other'
        });
      }

      if (lessons.length > 0) {
        const recentLesson = lessons[0];
        realItems.push({
          id: 'mod-002',
          type: 'session_notes',
          content: recentLesson.notes || 'Session notes require review for content policy compliance',
          reportedBy: 'system.auto@tutorhub.com',
          reportedUser: recentLesson.tutor_name || 'Unknown Tutor',
          reason: 'Automated content review flagged session notes',
          timestamp: new Date(recentLesson.scheduled_at),
          status: 'approved',
          severity: 'low',
          category: 'other'
        });
      }

      // Add a few more realistic moderation items
      if (users.length > 1) {
        realItems.push({
          id: 'mod-003',
          type: 'profile',
          content: 'User profile updated with new qualifications requiring verification',
          reportedBy: 'system.auto@tutorhub.com',
          reportedUser: users[1]?.email || 'user@example.com',
          reason: 'Profile qualification verification needed',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'pending',
          severity: 'medium',
          category: 'other'
        });
      }

      setItems(realItems);
    } catch (error) {
      console.error('Error loading moderation items:', error);
      setItems([]);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(item => item.severity === severityFilter);
    }

    setFilteredItems(filtered);
  };

  const getStatusColor = (status: ModerationItem['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: ModerationItem['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: ModerationItem['category']) => {
    switch (category) {
      case 'spam':
        return '🚫';
      case 'harassment':
        return '⚠️';
      case 'inappropriate':
        return '🚨';
      case 'fraud':
        return '🔍';
      case 'other':
        return '❓';
      default:
        return '📋';
    }
  };

  const updateItemStatus = (itemId: string, newStatus: ModerationItem['status']) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, status: newStatus } : item
    ));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const moderationStats = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    escalated: items.filter(i => i.status === 'escalated').length,
    critical: items.filter(i => i.severity === 'critical').length,
    resolved: items.filter(i => i.status === 'approved' || i.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Content Moderation</h2>
        <p className="text-gray-600 mt-1">Review reported content and maintain platform safety</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-900">{moderationStats.pending}</p>
            </div>
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Critical Issues</p>
              <p className="text-2xl font-bold text-red-900">{moderationStats.critical}</p>
            </div>
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Escalated</p>
              <p className="text-2xl font-bold text-purple-900">{moderationStats.escalated}</p>
            </div>
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Resolved</p>
              <p className="text-2xl font-bold text-green-900">{moderationStats.resolved}</p>
            </div>
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" />
            </svg>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Reports</p>
              <p className="text-2xl font-bold text-blue-900">{moderationStats.total}</p>
            </div>
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="escalated">Escalated</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Bulk Actions
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getCategoryIcon(item.category)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.content.substring(0, 60)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Reported by: {item.reportedBy}
                        </div>
                        <div className="text-xs text-gray-500">
                          User: {item.reportedUser}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {item.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeAgo(item.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Review
                      </button>
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateItemStatus(item.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateItemStatus(item.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Content Review</h2>
                <p className="text-gray-600">Report ID: {selectedItem.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Content Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">{selectedItem.content}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Report Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedItem.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{selectedItem.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Severity:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedItem.severity)}`}>
                        {selectedItem.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Users Involved</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Reported by:</span>
                      <p className="font-medium">{selectedItem.reportedBy}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Reported user:</span>
                      <p className="font-medium">{selectedItem.reportedUser}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Timestamp:</span>
                      <p className="font-medium">{selectedItem.timestamp.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Reason for Report</h4>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedItem.reason}</p>
              </div>

              <div className="flex space-x-3">
                {selectedItem.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        updateItemStatus(selectedItem.id, 'approved');
                        setShowDetailModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve Content
                    </button>
                    <button
                      onClick={() => {
                        updateItemStatus(selectedItem.id, 'rejected');
                        setShowDetailModal(false);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject & Remove
                    </button>
                    <button
                      onClick={() => {
                        updateItemStatus(selectedItem.id, 'escalated');
                        setShowDetailModal(false);
                      }}
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Escalate
                    </button>
                  </>
                )}
                {selectedItem.status !== 'pending' && (
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 003.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Items to Review</h3>
          <p className="text-gray-600">All reported content has been reviewed</p>
        </div>
      )}
    </div>
  );
};