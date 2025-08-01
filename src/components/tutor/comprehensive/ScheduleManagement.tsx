import React, { useState, useEffect } from 'react';
import { TutoringSession } from '../../../types';
import { formatSADateTime, formatSADate, formatSATime } from '../../../utils/saFormatting';
import { SessionCalendarView } from '../../student/SessionCalendarView';
import { userService } from '../../../services/userService';
import { availabilityService } from '../../../services/availabilityService';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isRecurring: boolean;
  sessionType: 'individual' | 'group' | 'online';
  maxStudents?: number;
  rate?: number;
}

interface ScheduleManagementProps {
  tutorId: string;
  sessions: TutoringSession[];
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ tutorId, sessions }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [selectedView, setSelectedView] = useState<'week' | 'month'>('week');
  const [studentNames, setStudentNames] = useState<{[key: string]: string}>({});

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadAvailability();
    fetchStudentNames();
  }, [tutorId, sessions]);

  const loadAvailability = async () => {
    try {
      console.log('📅 Loading tutor availability from database for:', tutorId);
      const availabilityData = await availabilityService.getTutorAvailability(tutorId);
      setAvailability(availabilityData);
      console.log('✅ Loaded availability slots:', availabilityData.length);
    } catch (error) {
      console.error('❌ Error loading tutor availability:', error);
      setAvailability([]);
    }
  };

  // Fetch student names for all sessions
  const fetchStudentNames = async () => {
    const studentIds = Array.from(new Set(sessions.map(session => session.studentId)));
    const nameMap: {[key: string]: string} = {};

    for (const studentId of studentIds) {
      const profile = await userService.getUserProfile(studentId);
      if (profile && profile.full_name) {
        nameMap[studentId] = profile.full_name;
      } else {
        nameMap[studentId] = 'Unknown Student';
      }
    }

    setStudentNames(nameMap);
  };

  const getWeekDates = (startDate: Date) => {
    const week = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
  };

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the first day of the calendar (may be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));
    
    // Generate 42 days (6 weeks)
    const dates = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return { dates, firstDay, lastDay };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date, monthDate: Date) => {
    return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
  };

  const getSessionsForDay = (day: string, date?: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduledAt);
      if (date) {
        return sessionDate.toDateString() === date.toDateString();
      }
      return sessionDate.toLocaleDateString('en-US', { weekday: 'long' }) === day;
    });
  };

  const getAvailabilityForDay = (day: string) => {
    return availability.filter(slot => slot.day === day);
  };

  // Filter sessions by status
  const scheduledSessions = sessions.filter(session => 
    ['scheduled', 'confirmed'].includes(session.status)
  );
  
  const completedSessions = sessions.filter(session => 
    session.status === 'completed'
  );

  const weekDates = getWeekDates(currentWeek);

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule Management</h2>
          <p className="text-gray-600">Manage your availability and view upcoming sessions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedView('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedView === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setSelectedView('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedView === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Month View
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">This Week</h3>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              <p className="text-xs text-gray-500">sessions scheduled</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Available Hours</h3>
              <p className="text-2xl font-bold text-gray-900">
                {availability.filter(slot => slot.isAvailable).reduce((total, slot) => {
                  const start = parseInt(slot.startTime.split(':')[0]);
                  const end = parseInt(slot.endTime.split(':')[0]);
                  return total + (end - start);
                }, 0)}
              </p>
              <p className="text-xs text-gray-500">per week</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Utilization</h3>
              <p className="text-2xl font-bold text-gray-900">78%</p>
              <p className="text-xs text-gray-500">of available time</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-xl">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Open Slots</h3>
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-xs text-gray-500">this week</p>
            </div>
          </div>
        </div>
      </div>

      {selectedView === 'week' ? (
        <>
          {/* Week Navigation */}
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              Week of {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekly Calendar Grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-4 bg-gray-50 border-r border-gray-200">
                <span className="text-sm font-medium text-gray-600">Time</span>
              </div>
              {weekDates.map((date, index) => (
                <div key={index} className="p-4 bg-gray-50 border-r border-gray-200 last:border-r-0 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {daysOfWeek[index]}
                  </div>
                  <div className="text-sm text-gray-600">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {Array.from({ length: 12 }, (_, hourIndex) => {
                const hour = hourIndex + 8; // Start from 8 AM
                const timeString = `${hour.toString().padStart(2, '0')}:00`;
                
                return (
                  <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[60px]">
                    <div className="p-3 border-r border-gray-200 bg-gray-50 flex items-center">
                      <span className="text-sm text-gray-600">{timeString}</span>
                    </div>
                    {weekDates.map((date, dayIndex) => {
                      const dayName = daysOfWeek[dayIndex];
                      const dayAvailability = getAvailabilityForDay(dayName);
                      const daySessions = getSessionsForDay(dayName, date);
                      
                      const isAvailable = dayAvailability.some(slot => {
                        const slotStart = parseInt(slot.startTime.split(':')[0]);
                        const slotEnd = parseInt(slot.endTime.split(':')[0]);
                        return hour >= slotStart && hour < slotEnd && slot.isAvailable;
                      });
                      
                      const hasSession = daySessions.some(session => {
                        const sessionHour = new Date(session.scheduledAt).getHours();
                        return sessionHour === hour;
                      });

                      return (
                        <div 
                          key={`${dayIndex}-${hour}`} 
                          className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[60px] ${
                            isAvailable ? 'bg-green-50' : ''
                          } ${hasSession ? 'bg-blue-50' : ''}`}
                        >
                          {hasSession && (
                            <div className="bg-blue-500 text-white text-xs p-1 rounded mb-1">
                              Session
                            </div>
                          )}
                          {isAvailable && !hasSession && (
                            <div className="bg-green-100 text-green-700 text-xs p-1 rounded">
                              Available
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Monthly Calendar Grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="p-4 bg-gray-50 border-r border-gray-200 last:border-r-0 text-center">
                  <span className="text-sm font-medium text-gray-900">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7">
              {(() => {
                const { dates } = getMonthDates(currentMonth);
                return dates.map((date, index) => {
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                  const daySessions = getSessionsForDay(dayName, date);
                  const dayAvailability = getAvailabilityForDay(dayName);
                  const isCurrentMonthDate = isCurrentMonth(date, currentMonth);
                  const isTodayDate = isToday(date);
                  
                  const hasAvailability = dayAvailability.some(slot => slot.isAvailable);
                  const hasSession = daySessions.length > 0;

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-r border-b border-gray-100 last:border-r-0 ${
                        !isCurrentMonthDate ? 'bg-gray-50 text-gray-400' : 'bg-white'
                      } ${isTodayDate ? 'bg-orange-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          isTodayDate ? 'text-orange-600' : isCurrentMonthDate ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {date.getDate()}
                        </span>
                        {isTodayDate && (
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        )}
                      </div>

                      <div className="space-y-1">
                        {/* Show sessions */}
                        {daySessions.slice(0, 2).map((session, sessionIndex) => (
                          <div
                            key={sessionIndex}
                            className={`text-xs p-1 rounded border ${
                              session.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                              session.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            <div className="font-medium truncate">
                              {formatSATime(session.scheduledAt)}
                            </div>
                            <div className="truncate">
                              {session.subject}
                            </div>
                          </div>
                        ))}

                        {/* Show more sessions indicator */}
                        {daySessions.length > 2 && (
                          <div className="text-xs text-gray-500 font-medium px-1">
                            +{daySessions.length - 2} more
                          </div>
                        )}

                        {/* Show availability indicator */}
                        {hasAvailability && !hasSession && isCurrentMonthDate && (
                          <div className="text-xs p-1 bg-green-50 text-green-600 border border-green-200 rounded">
                            Available
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Month View Legend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-gray-600">Scheduled Session</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-gray-600">Confirmed Session</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
                <span className="text-gray-600">Today</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Scheduled Lessons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Scheduled Lessons</h3>
            <p className="text-sm text-gray-600">Your upcoming tutoring sessions</p>
          </div>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {scheduledSessions.length} lessons
          </span>
        </div>

        <div className="space-y-4">
          {scheduledSessions.length > 0 ? (
            scheduledSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {formatSADateTime(session.scheduledAt).split(',')[1]?.trim().slice(0, 5)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{session.subject}</h4>
                    <p className="text-sm text-gray-600">{studentNames[session.studentId] || 'Loading...'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                      <span className="text-xs text-gray-500">{session.duration} min</span>
                      <span className="text-xs text-gray-500">{formatSADate(session.scheduledAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-500 hover:to-green-600 transition-all duration-200">
                    Start Session
                  </button>
                  <button className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
                    Reschedule
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Lessons</h4>
              <p className="text-gray-600">Your upcoming lessons will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Lessons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Completed Lessons</h3>
            <p className="text-sm text-gray-600">Your recent completed sessions</p>
          </div>
          <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
            {completedSessions.length} completed
          </span>
        </div>

        <div className="space-y-4">
          {completedSessions.length > 0 ? (
            completedSessions.slice(0, 10).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{session.subject}</h4>
                    <p className="text-sm text-gray-600">{studentNames[session.studentId] || 'Loading...'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                      <span className="text-xs text-gray-500">{session.duration} min</span>
                      <span className="text-xs text-gray-500">{formatSADate(session.scheduledAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {session.rating && (
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < session.rating! ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-sm text-gray-600 ml-1">{session.rating}</span>
                    </div>
                  )}
                  <button className="bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Completed Lessons</h4>
              <p className="text-gray-600">Your completed lessons will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};