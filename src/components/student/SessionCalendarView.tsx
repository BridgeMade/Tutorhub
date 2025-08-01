import React, { useState } from 'react';
import { TutoringSession } from '../../types';
import { formatSADate, formatSATime } from '../../utils/saFormatting';

interface SessionCalendarViewProps {
  sessions: TutoringSession[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  onSessionClick?: (session: TutoringSession) => void;
}

export const SessionCalendarView: React.FC<SessionCalendarViewProps> = ({
  sessions,
  selectedMonth,
  onMonthChange,
  onSessionClick
}) => {
  const [currentDate] = useState(new Date());

  const getSessionColor = (subject: string, status: string) => {
    const baseColors = {
      'Mathematics': 'bg-blue-100 border-blue-300 text-blue-800',
      'Physics': 'bg-green-100 border-green-300 text-green-800',
      'Chemistry': 'bg-purple-100 border-purple-300 text-purple-800',
      'Biology': 'bg-orange-100 border-orange-300 text-orange-800',
      'English': 'bg-pink-100 border-pink-300 text-pink-800',
    };
    
    // If session is completed, make it more muted
    if (status === 'completed') {
      return baseColors[subject as keyof typeof baseColors]?.replace('100', '50').replace('800', '600') || 'bg-gray-50 border-gray-200 text-gray-600';
    }
    
    return baseColors[subject as keyof typeof baseColors] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSessionsForDay = (day: number) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduledAt);
      return sessionDate.getDate() === day &&
             sessionDate.getMonth() === selectedMonth.getMonth() &&
             sessionDate.getFullYear() === selectedMonth.getFullYear();
    });
  };

  const isToday = (day: number) => {
    return currentDate.getDate() === day &&
           currentDate.getMonth() === selectedMonth.getMonth() &&
           currentDate.getFullYear() === selectedMonth.getFullYear();
  };

  const isPastDate = (day: number) => {
    const dayDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayDate < today;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedMonth);

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const goToToday = () => {
    onMonthChange(new Date());
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
            </h2>
            <p className="text-gray-600 mt-1">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} this month
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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
            <div key={`empty-${i}`} className="h-24"></div>
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
                className={`h-24 border border-gray-100 rounded-lg p-2 transition-colors hover:bg-gray-50 ${
                  isCurrentDay ? 'bg-orange-50 border-orange-200' : ''
                } ${isPast ? 'bg-gray-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    isCurrentDay ? 'text-orange-600' : isPast ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {day}
                  </span>
                  {isCurrentDay && (
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  )}
                </div>
                
                {/* Sessions for this day */}
                <div className="space-y-1">
                  {daySessions.slice(0, 2).map((session, index) => (
                    <button
                      key={session.id}
                      onClick={() => onSessionClick?.(session)}
                      className={`w-full text-left p-1 rounded text-xs font-medium transition-all hover:shadow-sm ${getSessionColor(session.subject, session.status)}`}
                      title={`${session.subject} at ${formatSATime(session.scheduledAt)}`}
                    >
                      <div className="truncate">
                        {formatSATime(session.scheduledAt)}
                      </div>
                      <div className="truncate font-semibold">
                        {session.subject}
                      </div>
                    </button>
                  ))}
                  
                  {/* Show "+X more" if there are more than 2 sessions */}
                  {daySessions.length > 2 && (
                    <div className="text-xs text-gray-500 font-medium px-1">
                      +{daySessions.length - 2} more
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
          <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-gray-600">Mathematics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">Physics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
              <span className="text-gray-600">Chemistry</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-gray-600">Biology</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-gray-600">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};