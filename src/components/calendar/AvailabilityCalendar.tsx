import React, { useState, useEffect } from 'react';
import { availabilityService, TimeSlot, BookingConflict } from '../../services/availabilityService';
import { TutoringSession } from '../../types';
import { formatSADate, formatSATime } from '../../utils/saFormatting';

interface AvailabilityCalendarProps {
  tutorId: string;
  sessions: TutoringSession[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  onSlotClick?: (slot: TimeSlot, date: Date) => void;
  onSessionClick?: (session: TutoringSession) => void;
  showBookingOptions?: boolean;
  userRole?: 'student' | 'tutor' | 'admin';
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  tutorId,
  sessions,
  selectedMonth,
  onMonthChange,
  onSlotClick,
  onSessionClick,
  showBookingOptions = false,
  userRole = 'student'
}) => {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    loadAvailability();
  }, [tutorId]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      console.log('🔍 AvailabilityCalendar: Loading availability for tutor:', tutorId);
      console.log('🔍 AvailabilityCalendar: Tutor ID type:', typeof tutorId, 'value:', tutorId);
      
      if (!tutorId) {
        console.warn('⚠️ AvailabilityCalendar: No tutorId provided');
        setAvailability([]);
        return;
      }
      
      const availabilityData = await availabilityService.getTutorAvailability(tutorId);
      setAvailability(availabilityData);
      console.log('✅ AvailabilityCalendar: Loaded availability slots:', availabilityData.length);
      
      if (availabilityData.length === 0) {
        console.log('📅 AvailabilityCalendar: No availability found for tutor. They may need to set their schedule.');
      }
    } catch (error) {
      console.error('❌ AvailabilityCalendar: Error loading availability:', error);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
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

  const generateSubSlots = (slot: TimeSlot, date: Date, sessions: TutoringSession[]): TimeSlot[] => {
    const subSlots: TimeSlot[] = [];
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const slotDuration = 60; // Default 1-hour slots, could be made configurable
    
    // Generate sub-slots within the availability block
    for (let currentMinutes = startTotalMinutes; currentMinutes < endTotalMinutes; currentMinutes += slotDuration) {
      const subSlotEndMinutes = Math.min(currentMinutes + slotDuration, endTotalMinutes);
      
      const subStartHour = Math.floor(currentMinutes / 60);
      const subStartMinute = currentMinutes % 60;
      const subEndHour = Math.floor(subSlotEndMinutes / 60);
      const subEndMinute = subSlotEndMinutes % 60;
      
      const subStartTime = `${subStartHour.toString().padStart(2, '0')}:${subStartMinute.toString().padStart(2, '0')}`;
      const subEndTime = `${subEndHour.toString().padStart(2, '0')}:${subEndMinute.toString().padStart(2, '0')}`;
      
      // Check if this sub-slot conflicts with existing sessions
      const subSlotDate = new Date(date);
      subSlotDate.setHours(subStartHour, subStartMinute, 0, 0);
      
      const hasConflict = sessions.some(session => {
        const sessionDate = new Date(session.scheduledAt);
        const sessionEnd = new Date(sessionDate.getTime() + (session.duration || 60) * 60000);
        
        return (
          sessionDate.toDateString() === subSlotDate.toDateString() &&
          (
            (subSlotDate >= sessionDate && subSlotDate < sessionEnd) ||
            (new Date(subSlotDate.getTime() + slotDuration * 60000) > sessionDate && 
             new Date(subSlotDate.getTime() + slotDuration * 60000) <= sessionEnd)
          )
        );
      });
      
      if (!hasConflict) {
        subSlots.push({
          ...slot,
          id: `${slot.id}-sub-${currentMinutes}`,
          startTime: subStartTime,
          endTime: subEndTime,
          isSubSlot: true
        });
      }
    }
    
    return subSlots;
  };

  const getAvailabilityForDay = (day: number) => {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    const availableSlots = availability.filter(slot => 
      slot.day === dayName && slot.isAvailable
    );
    
    // Generate sub-slots for each availability block
    const allSubSlots: TimeSlot[] = [];
    
    availableSlots.forEach(slot => {
      const subSlots = generateSubSlots(slot, date, sessions);
      allSubSlots.push(...subSlots);
    });
    
    return allSubSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
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

  const getSlotTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'individual':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'group':
        return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'online':
        return 'bg-green-100 border-green-300 text-green-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getSessionColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'confirmed':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'completed':
        return 'bg-gray-100 border-gray-300 text-gray-600';
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Loading availability...</span>
        </div>
      </div>
    );
  }

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
              {availability.length} availability slot{availability.length !== 1 ? 's' : ''} • 
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} this month
            </p>
            {availability.length === 0 && (
              <div className="text-orange-600 text-sm mt-2 p-2 bg-orange-50 rounded">
                <p className="font-medium">⚠️ No availability found</p>
                <p className="text-xs mt-1">This tutor hasn't set their available times yet. They need to:</p>
                <ol className="text-xs mt-1 ml-4 list-decimal">
                  <li>Go to their dashboard</li>
                  <li>Click "Set Availability" or "Manage Availability"</li>
                  <li>Add their available time slots</li>
                </ol>
              </div>
            )}
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
            <div key={`empty-${i}`} className="h-32"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const daySessions = getSessionsForDay(day);
            const dayAvailability = getAvailabilityForDay(day);
            const isCurrentDay = isToday(day);
            const isPast = isPastDate(day);
            const currentDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);

            return (
              <div
                key={day}
                className={`h-32 border border-gray-100 rounded-lg p-2 transition-colors hover:bg-gray-50 ${
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
                  {/* Show scheduled sessions first */}
                  {daySessions.slice(0, 2).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => onSessionClick?.(session)}
                      className={`w-full text-left p-1 rounded text-xs font-medium transition-all hover:shadow-sm border ${getSessionColor(session.status)}`}
                      title={`${session.subject} - ${session.status} at ${formatSATime(session.scheduledAt)}`}
                    >
                      <div className="truncate font-semibold">
                        📅 {formatSATime(session.scheduledAt)}
                      </div>
                      <div className="truncate">
                        {session.subject}
                      </div>
                    </button>
                  ))}

                  {/* Show available slots */}
                  {dayAvailability.slice(0, isPast ? 0 : 6 - daySessions.length).map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => showBookingOptions && onSlotClick?.(slot, currentDate)}
                      className={`w-full text-left p-1 rounded text-xs font-medium transition-all hover:shadow-sm border ${getSlotTypeColor(slot.sessionType)} ${
                        showBookingOptions && !isPast ? 'hover:bg-opacity-80 cursor-pointer hover:ring-2 hover:ring-orange-300' : 'cursor-default'
                      } ${slot.isSubSlot ? 'border-dashed' : ''}`}
                      title={`${slot.sessionType} session - R${slot.rate}/hr - ${slot.startTime} to ${slot.endTime}${slot.isSubSlot ? ' (1-hour slot)' : ''}`}
                      disabled={isPast}
                    >
                      <div className="truncate flex items-center">
                        <span className="mr-1">{slot.isSubSlot ? '🕐' : '⏰'}</span>
                        {slot.startTime}-{slot.endTime}
                      </div>
                      <div className="truncate text-xs">
                        {slot.sessionType} - R{slot.rate}
                        {slot.isSubSlot && <span className="text-orange-600 ml-1">• 1hr</span>}
                      </div>
                    </button>
                  ))}
                  
                  {/* Show "+X more" if there are more items */}
                  {(daySessions.length + dayAvailability.length) > 6 && (
                    <div className="text-xs text-gray-500 font-medium px-1">
                      +{(daySessions.length + dayAvailability.length) - 6} more
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Session Status */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Sessions</h5>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span className="text-gray-600">Scheduled</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                <span className="text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-gray-600">Completed</span>
              </div>
            </div>

            {/* Availability Types */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Available</h5>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span className="text-gray-600">Individual</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
                <span className="text-gray-600">Group</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-gray-600">Online</span>
              </div>
            </div>

            {/* Slot Types */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Slot Types</h5>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 border-dashed rounded"></div>
                <span className="text-gray-600">1-hour slots 🕐</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span className="text-gray-600">Full blocks ⏰</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};