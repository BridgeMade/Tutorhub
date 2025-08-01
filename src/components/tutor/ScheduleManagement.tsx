import React, { useState, useEffect } from 'react';
import { TutoringSession } from '../../types';
import { lessonService, type LessonWithDetails } from '../../services/lessonService';

interface ScheduleManagementProps {
  tutorId: string;
  sessions: TutoringSession[];
}

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  duration: number;
  isBooked: boolean;
  studentName?: string;
  subject?: string;
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
  tutorId,
  sessions
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklySchedule, setWeeklySchedule] = useState<TimeSlot[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadRealSchedule();
  }, [currentWeek, tutorId]);

  const loadRealSchedule = async () => {
    try {
      const lessons = await lessonService.getUserLessons(tutorId, 'tutor');
      const schedule: TimeSlot[] = [];
      const startOfWeek = new Date(currentWeek);
      startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());

      const timeSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
      ];

      for (let day = 0; day < 7; day++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + day);
        
        for (const time of timeSlots) {
          const slotDateTime = new Date(`${currentDay.toDateString()} ${time}`);
          const bookedLesson = lessons.find((lesson: LessonWithDetails) => {
            const lessonDate = new Date(lesson.scheduled_at);
            return lessonDate.toDateString() === currentDay.toDateString() &&
                   lessonDate.getHours() === parseInt(time.split(':')[0]);
          });

          schedule.push({
            id: `${day}-${time}`,
            day: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
            time,
            duration: bookedLesson?.duration_minutes || 60,
            isBooked: !!bookedLesson,
            studentName: bookedLesson?.student_name || undefined,
            subject: bookedLesson?.subject_name || undefined
          });
        }
      }

      setWeeklySchedule(schedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setWeeklySchedule([]);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getWeekRange = () => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Schedule Management</h2>
          <p className="text-gray-600 mt-1">Manage your availability and upcoming sessions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{getWeekRange()}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 min-w-[800px]">
            <div className="p-3 bg-gray-50 border-r border-gray-200">
              <span className="text-sm font-medium text-gray-600">Time</span>
            </div>
            {days.map(day => (
              <div key={day} className="p-3 bg-gray-50 border-r border-gray-200 text-center">
                <span className="text-sm font-medium text-gray-900">{day}</span>
              </div>
            ))}

            {timeSlots.map(time => (
              <React.Fragment key={time}>
                <div className="p-3 border-r border-gray-200 border-t border-gray-200 bg-gray-50">
                  <span className="text-sm text-gray-600">{time}</span>
                </div>
                {days.map((day, dayIndex) => {
                  const slot = weeklySchedule.find(s => 
                    s.day === day && s.time === time
                  );
                  
                  return (
                    <div
                      key={`${day}-${time}`}
                      className={`p-2 border-r border-gray-200 border-t border-gray-200 min-h-[60px] cursor-pointer transition-colors ${
                        slot?.isBooked 
                          ? 'bg-blue-50 hover:bg-blue-100' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {slot?.isBooked ? (
                        <div className="bg-blue-600 text-white p-2 rounded text-xs">
                          <div className="font-medium">{slot.subject}</div>
                          <div className="opacity-75">{slot.studentName}</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <button className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
                            + Available
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Block Time Slot
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Set Recurring Availability
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Request Time Off
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sessions This Week</span>
              <span className="text-sm font-medium text-gray-900">{weeklySchedule.filter(slot => slot.isBooked).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Available Hours</span>
              <span className="text-sm font-medium text-gray-900">{(7 * 11) - weeklySchedule.filter(slot => slot.isBooked).length} hrs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Utilization Rate</span>
              <span className="text-sm font-medium text-green-600">
                {Math.round((weeklySchedule.filter(slot => slot.isBooked).length / (7 * 11)) * 100)}%
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-gray-600">Booked Sessions</span>
              </div>
              <div className="flex items-center space-x-2 text-sm mt-2">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <span className="text-gray-600">Available Slots</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};