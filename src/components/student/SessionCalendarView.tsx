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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayPopup, setShowDayPopup] = useState(false);

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

  const getDotColor = (subject: string, status: string) => {
    const dotColors = {
      'Mathematics': status === 'completed' ? 'bg-blue-300' : 'bg-blue-500',
      'Physics': status === 'completed' ? 'bg-green-300' : 'bg-green-500',
      'Chemistry': status === 'completed' ? 'bg-purple-300' : 'bg-purple-500',
      'Biology': status === 'completed' ? 'bg-orange-300' : 'bg-orange-500',
      'English': status === 'completed' ? 'bg-pink-300' : 'bg-pink-500',
    };
    
    return dotColors[subject as keyof typeof dotColors] || (status === 'completed' ? 'bg-gray-300' : 'bg-gray-500');
  };

  const handleDayClick = (day: number) => {
    const daySessions = getSessionsForDay(day);
    if (daySessions.length > 0) {
      setSelectedDay(day);
      setShowDayPopup(true);
    }
  };

  const closeDayPopup = () => {
    setShowDayPopup(false);
    setSelectedDay(null);
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
                onClick={() => handleDayClick(day)}
                className={`h-24 border border-gray-100 rounded-lg p-2 transition-colors hover:bg-gray-50 cursor-pointer ${
                  isCurrentDay ? 'bg-blue-50 border-blue-200' : ''
                } ${isPast ? 'bg-gray-50' : ''} ${daySessions.length > 0 ? 'hover:shadow-md' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    isCurrentDay ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {day}
                  </span>
                  {isCurrentDay && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </div>
                
                {/* Session dots */}
                {daySessions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {daySessions.slice(0, 6).map((session, index) => (
                      <div
                        key={session.id}
                        className={`w-2 h-2 rounded-full ${getDotColor(session.subject, session.status)}`}
                        title={`${session.subject} at ${formatSATime(session.scheduledAt)}`}
                      />
                    ))}
                    {daySessions.length > 6 && (
                      <div className="text-xs text-gray-500 font-medium ml-1">
                        +{daySessions.length - 6}
                      </div>
                    )}
                  </div>
                )}
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
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Mathematics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Physics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Chemistry</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Biology</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-gray-600">Completed</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Click on any day with dots to see session details</p>
        </div>
      </div>

      {/* Day Details Popup */}
      {showDayPopup && selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {monthNames[selectedMonth.getMonth()]} {selectedDay}, {selectedMonth.getFullYear()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getSessionsForDay(selectedDay).length} session{getSessionsForDay(selectedDay).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={closeDayPopup}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {getSessionsForDay(selectedDay).map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      session.subject === 'Mathematics' ? 'border-l-blue-500 bg-blue-50' :
                      session.subject === 'Physics' ? 'border-l-green-500 bg-green-50' :
                      session.subject === 'Chemistry' ? 'border-l-purple-500 bg-purple-50' :
                      session.subject === 'Biology' ? 'border-l-orange-500 bg-orange-50' :
                      session.subject === 'English' ? 'border-l-pink-500 bg-pink-50' :
                      'border-l-gray-500 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{session.subject}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatSATime(session.scheduledAt)} • {session.duration} minutes
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          onSessionClick?.(session);
                          closeDayPopup();
                        }}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      {session.status === 'scheduled' && (
                        <>
                          <button className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                            Join
                          </button>
                          <button className="text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200">
                            Reschedule
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};