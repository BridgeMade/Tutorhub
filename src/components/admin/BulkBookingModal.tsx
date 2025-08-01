import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { X, Calendar, Clock, User, BookOpen, Plus, Trash2, Download } from 'lucide-react';
import { availabilityService } from '../../services/availabilityService';

const bulkBookingSchema = z.object({
  student_id: z.string().min(1, 'Student is required'),
  tutor_id: z.string().min(1, 'Tutor is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  duration_minutes: z.number().min(30, 'Duration must be at least 30 minutes'),
  sessions_per_week: z.number().min(1, 'At least 1 session per week').max(7, 'Maximum 7 sessions per week'),
  total_weeks: z.number().min(1, 'At least 1 week').max(12, 'Maximum 12 weeks'),
  preferred_days: z.array(z.string()).min(1, 'Select at least one day'),
  preferred_time: z.string().min(1, 'Preferred time is required'),
  notes: z.string().optional()
});

type BulkBookingFormData = z.infer<typeof bulkBookingSchema>;

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Tutor {
  id: string;
  full_name: string;
  email: string;
}

interface Subject {
  id: string;
  name: string;
}

interface GeneratedSession {
  date: string;
  time: string;
  dayOfWeek: string;
  status: 'pending' | 'conflict' | 'success';
  message?: string;
}

interface BulkBookingModalProps {
  onClose: () => void;
  onSessionsBooked: () => void;
}

export const BulkBookingModal: React.FC<BulkBookingModalProps> = ({
  onClose,
  onSessionsBooked
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [generatedSessions, setGeneratedSessions] = useState<GeneratedSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'preview' | 'booking'>('form');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<BulkBookingFormData>({
    resolver: zodResolver(bulkBookingSchema),
    defaultValues: {
      duration_minutes: 60,
      sessions_per_week: 2,
      total_weeks: 4,
      preferred_days: [],
      preferred_time: '14:00'
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load students
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'student')
        .order('full_name');

      // Load tutors
      const { data: tutorsData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'tutor')
        .order('full_name');

      // Load subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      setStudents(studentsData || []);
      setTutors(tutorsData || []);
      setSubjects(subjectsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateSessionSchedule = (data: BulkBookingFormData): GeneratedSession[] => {
    const sessions: GeneratedSession[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start from tomorrow
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDayNumbers = data.preferred_days.map(day => dayNames.indexOf(day));
    
    let currentDate = new Date(startDate);
    let sessionCount = 0;
    const totalSessions = data.sessions_per_week * data.total_weeks;
    let weeksProcessed = 0;
    let sessionsThisWeek = 0;

    while (sessionCount < totalSessions && weeksProcessed < data.total_weeks) {
      const dayOfWeek = currentDate.getDay();
      
      // Check if current day is in selected days and we haven't exceeded sessions per week
      if (selectedDayNumbers.includes(dayOfWeek) && sessionsThisWeek < data.sessions_per_week) {
        sessions.push({
          date: currentDate.toISOString().split('T')[0],
          time: data.preferred_time,
          dayOfWeek: dayNames[dayOfWeek],
          status: 'pending'
        });
        sessionCount++;
        sessionsThisWeek++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Reset weekly counter on Sunday
      if (currentDate.getDay() === 0) {
        if (sessionsThisWeek > 0) {
          weeksProcessed++;
        }
        sessionsThisWeek = 0;
      }
    }

    return sessions;
  };

  const validateSessions = async (sessions: GeneratedSession[], data: BulkBookingFormData) => {
    const validatedSessions = [...sessions];
    
    for (let i = 0; i < validatedSessions.length; i++) {
      const session = validatedSessions[i];
      const sessionDateTime = new Date(`${session.date}T${session.time}:00`);
      
      try {
        const validation = await availabilityService.validateBooking(
          data.tutor_id,
          sessionDateTime,
          data.duration_minutes
        );
        
        if (validation.isValid) {
          validatedSessions[i] = { ...session, status: 'success' };
        } else {
          validatedSessions[i] = { 
            ...session, 
            status: 'conflict', 
            message: validation.message 
          };
        }
      } catch (error) {
        validatedSessions[i] = { 
          ...session, 
          status: 'conflict', 
          message: 'Error validating session' 
        };
      }
    }
    
    return validatedSessions;
  };

  const onSubmit = async (data: BulkBookingFormData) => {
    setLoading(true);
    try {
      // Generate session schedule
      const sessions = generateSessionSchedule(data);
      
      // Validate sessions against tutor availability
      const validatedSessions = await validateSessions(sessions, data);
      
      setGeneratedSessions(validatedSessions);
      setStep('preview');
    } catch (error) {
      console.error('Error generating sessions:', error);
      alert('Error generating session schedule');
    } finally {
      setLoading(false);
    }
  };

  const bookValidSessions = async () => {
    const validSessions = generatedSessions.filter(session => session.status === 'success');
    
    if (validSessions.length === 0) {
      alert('No valid sessions to book');
      return;
    }

    setLoading(true);
    setStep('booking');
    
    try {
      const bookingPromises = validSessions.map(session => {
        const scheduledAt = new Date(`${session.date}T${session.time}:00`);
        
        return supabase
          .from('lessons')
          .insert({
            student_id: watchedValues.student_id,
            tutor_id: watchedValues.tutor_id,
            subject_id: watchedValues.subject_id,
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: watchedValues.duration_minutes,
            status: 'scheduled',
            notes: `[BULK BOOKING] ${watchedValues.notes || ''}`
          });
      });

      const results = await Promise.allSettled(bookingPromises);
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      if (successful > 0) {
        alert(`Successfully booked ${successful} sessions!${failed > 0 ? ` ${failed} sessions failed.` : ''}`);
        onSessionsBooked();
      } else {
        alert('Failed to book any sessions. Please try again.');
      }
    } catch (error) {
      console.error('Error booking sessions:', error);
      alert('Error booking sessions');
    } finally {
      setLoading(false);
    }
  };

  const exportSchedule = () => {
    const csv = [
      'Date,Day,Time,Status,Message',
      ...generatedSessions.map(session => 
        `${session.date},${session.dayOfWeek},${session.time},${session.status},${session.message || ''}`
      )
    ].join('\\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-booking-schedule.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Session Booking</h2>
            <p className="text-sm text-gray-600 mt-1">Create multiple sessions for recurring lessons</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Student
                </label>
                <select
                  {...register('student_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </option>
                  ))}
                </select>
                {errors.student_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.student_id.message}</p>
                )}
              </div>

              {/* Tutor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Tutor
                </label>
                <select
                  {...register('tutor_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a tutor</option>
                  {tutors.map((tutor) => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.full_name} ({tutor.email})
                    </option>
                  ))}
                </select>
                {errors.tutor_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.tutor_id.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Subject
                </label>
                <select
                  {...register('subject_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {errors.subject_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.subject_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration
                </label>
                <select
                  {...register('duration_minutes', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time
                </label>
                <input
                  type="time"
                  {...register('preferred_time')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sessions per Week
                </label>
                <select
                  {...register('sessions_per_week', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <option key={num} value={num}>{num} session{num !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Weeks
                </label>
                <select
                  {...register('total_weeks', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {[1, 2, 3, 4, 6, 8, 10, 12].map(num => (
                    <option key={num} value={num}>{num} week{num !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Days
              </label>
              <div className="grid grid-cols-7 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <label key={day} className="flex items-center p-2 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      {...register('preferred_days')}
                      value={day}
                      className="mr-2 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
              {errors.preferred_days && (
                <p className="text-red-500 text-sm mt-1">{errors.preferred_days.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Additional notes for bulk booking..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Schedule'}
              </button>
            </div>
          </form>
        )}

        {step === 'preview' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generated Session Schedule</h3>
              <p className="text-sm text-gray-600">
                {generatedSessions.filter(s => s.status === 'success').length} of {generatedSessions.length} sessions can be booked
              </p>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <div className="flex space-x-4 text-sm">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                  Available ({generatedSessions.filter(s => s.status === 'success').length})
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-2"></div>
                  Conflicts ({generatedSessions.filter(s => s.status === 'conflict').length})
                </span>
              </div>
              <button
                onClick={exportSchedule}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Day</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {generatedSessions.map((session, index) => (
                    <tr key={index} className={session.status === 'conflict' ? 'bg-red-25' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(session.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{session.dayOfWeek}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{session.time}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {session.status === 'success' ? 'Available' : 'Conflict'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{session.message || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={() => setStep('form')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Form
              </button>
              <button
                onClick={bookValidSessions}
                disabled={loading || generatedSessions.filter(s => s.status === 'success').length === 0}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
              >
                Book Available Sessions ({generatedSessions.filter(s => s.status === 'success').length})
              </button>
            </div>
          </div>
        )}

        {step === 'booking' && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Sessions...</h3>
            <p className="text-gray-600">Please wait while we create your sessions.</p>
          </div>
        )}
      </div>
    </div>
  );
};