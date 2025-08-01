import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, BookOpen } from 'lucide-react';

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

interface AdminCalendarViewProps {
  sessions: Session[];
  onSessionClick?: (session: Session) => void;
}

export const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({
  sessions,
  onSessionClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSessionsForDay = (day: number) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at);
      return sessionDate.getDate() === day &&
             sessionDate.getMonth() === currentDate.getMonth() &&
             sessionDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear();
  };

  const isPastDate = (day: number) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayDate < today;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'confirmed': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'completed': return 'bg-green-100 border-green-300 text-green-700';
      case 'cancelled': return 'bg-red-100 border-red-300 text-red-700';
      case 'rescheduled': return 'bg-blue-100 border-blue-300 text-blue-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const totalSessionsThisMonth = sessions.filter(session => {
    const sessionDate = new Date(session.scheduled_at);
    return sessionDate.getMonth() === currentDate.getMonth() &&
           sessionDate.getFullYear() === currentDate.getFullYear();
  }).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-gray-600 mt-1">
              {totalSessionsThisMonth} session{totalSessionsThisMonth !== 1 ? 's' : ''} this month
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={goToToday}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium bg-orange-50 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center space-x-1">
              <button
                onClick={goToPreviousMonth}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="h-32"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const daySessions = getSessionsForDay(day);
            const isCurrentDay = isToday(day);
            const isPast = isPastDate(day);

            return (
              <div
                key={day}
                className={`h-32 border border-gray-100 rounded-lg p-2 transition-colors ${
                  isCurrentDay ? 'bg-orange-50 border-orange-200' : ''
                } ${isPast ? 'bg-gray-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-medium ${
                    isCurrentDay ? 'text-orange-600' : isPast ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {day}
                  </span>
                  {isCurrentDay && (
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  )}
                </div>
                
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {daySessions.slice(0, 3).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => onSessionClick?.(session)}
                      className={`w-full text-left p-1 rounded text-xs font-medium transition-all hover:shadow-sm border ${getStatusColor(session.status)}`}
                      title={`${session.student_profile?.full_name || 'Unknown'} with ${session.tutor_profile?.full_name || 'Unknown'} - ${session.subject?.name || 'Unknown Subject'}`}
                    >
                      <div className="truncate flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(session.scheduled_at)}
                      </div>
                      <div className="truncate flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {session.student_profile?.full_name?.split(' ')[0] || 'Unknown'}
                      </div>
                      <div className="truncate flex items-center">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {session.subject?.name || 'Subject'}
                      </div>
                    </button>
                  ))}
                  
                  {/* Show "+X more" if there are more items */}
                  {daySessions.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium px-1">
                      +{daySessions.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Session Status Legend</h4>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-gray-600">Scheduled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-gray-600">Confirmed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-gray-600">Cancelled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-gray-600">Rescheduled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};