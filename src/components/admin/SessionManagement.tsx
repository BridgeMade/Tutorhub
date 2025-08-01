import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, Users, Search, Filter, Plus, Edit2, X, AlertCircle } from 'lucide-react';
import { AdminBookingModal } from './AdminBookingModal';
import { AdminCalendarView } from './AdminCalendarView';
import { BulkBookingModal } from './BulkBookingModal';

interface Session {
  id: string;
  student_id: string;
  tutor_id: string;
  subject_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  created_at: string;
  updated_at: string;
  student_profile?: {
    full_name: string;
    email: string;
  };
  tutor_profile?: {
    full_name: string;
    email: string;
  };
  subject?: {
    name: string;
  };
}

export const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBulkBookingModal, setShowBulkBookingModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchTerm, statusFilter, dateFilter]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          student_profile:profiles!lessons_student_id_fkey(full_name, email),
          tutor_profile:profiles!lessons_tutor_id_fkey(full_name, email),
          subject:subjects(name)
        `)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.student_profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.tutor_profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.subject?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const sessionDate = new Date();

      switch (dateFilter) {
        case 'today':
          sessionDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(session => {
            const scheduled = new Date(session.scheduled_at);
            return scheduled.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          sessionDate.setDate(now.getDate() + 7);
          filtered = filtered.filter(session => {
            const scheduled = new Date(session.scheduled_at);
            return scheduled >= now && scheduled <= sessionDate;
          });
          break;
        case 'month':
          sessionDate.setMonth(now.getMonth() + 1);
          filtered = filtered.filter(session => {
            const scheduled = new Date(session.scheduled_at);
            return scheduled >= now && scheduled <= sessionDate;
          });
          break;
      }
    }

    setFilteredSessions(filtered);
  };

  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Update local state
      setSessions(prev =>
        prev.map(session =>
          session.id === sessionId
            ? { ...session, status: newStatus as any, updated_at: new Date().toISOString() }
            : session
        )
      );

      alert(`Session status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating session status:', error);
      alert('Failed to update session status');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      alert('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'rescheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Loading sessions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600 mt-1">Manage all tutoring sessions across the platform</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setView(view === 'list' ? 'calendar' : 'list')}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {view === 'list' ? <Calendar className="w-4 h-4 mr-2" /> : <Users className="w-4 h-4 mr-2" />}
            {view === 'list' ? 'Calendar View' : 'List View'}
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBookingModal(true)}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Session
            </button>
            <button
              onClick={() => setShowBulkBookingModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Bulk Book
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Next 7 Days</option>
            <option value="month">Next Month</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            {filteredSessions.length} of {sessions.length} sessions
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <AdminCalendarView sessions={filteredSessions} onSessionClick={setSelectedSession} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-600">Try adjusting your filters or create a new session.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSessions.map((session) => {
                    const { date, time } = formatDateTime(session.scheduled_at);
                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {session.student_profile?.full_name || 'Unknown Student'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.student_profile?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {session.tutor_profile?.full_name || 'Unknown Tutor'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.tutor_profile?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.subject?.name || 'Unknown Subject'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{date}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.duration_minutes} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={session.status}
                            onChange={(e) => handleStatusChange(session.id, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}
                          >
                            <option value={session.status}>{session.status}</option>
                            {getStatusOptions(session.status).map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedSession(session);
                                setShowEditModal(true);
                              }}
                              className="text-orange-600 hover:text-orange-900"
                              title="Edit Session"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Session"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Admin Booking Modal */}
      {showBookingModal && (
        <AdminBookingModal
          onClose={() => setShowBookingModal(false)}
          onSessionBooked={() => {
            loadSessions();
            setShowBookingModal(false);
          }}
        />
      )}

      {/* Bulk Booking Modal */}
      {showBulkBookingModal && (
        <BulkBookingModal
          onClose={() => setShowBulkBookingModal(false)}
          onSessionsBooked={() => {
            loadSessions();
            setShowBulkBookingModal(false);
          }}
        />
      )}

      {/* Edit Session Modal */}
      {showEditModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Session</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <input
                    type="text"
                    value={selectedSession.student_profile?.full_name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutor</label>
                  <input
                    type="text"
                    value={selectedSession.tutor_profile?.full_name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={selectedSession.notes || ''}
                  onChange={(e) => {
                    setSelectedSession(prev => prev ? { ...prev, notes: e.target.value } : null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Session notes..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('lessons')
                        .update({ notes: selectedSession.notes })
                        .eq('id', selectedSession.id);
                      
                      if (error) throw error;
                      
                      setSessions(prev => 
                        prev.map(s => s.id === selectedSession.id ? { ...s, notes: selectedSession.notes } : s)
                      );
                      setShowEditModal(false);
                      alert('Session updated successfully');
                    } catch (error) {
                      alert('Failed to update session');
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};