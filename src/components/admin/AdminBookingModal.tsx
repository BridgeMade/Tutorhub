import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { X, Search, Calendar, Clock, User, BookOpen } from 'lucide-react';
import { AvailabilityCalendar } from '../calendar/AvailabilityCalendar';
import { availabilityService, TimeSlot } from '../../services/availabilityService';

const adminBookingSchema = z.object({
  student_id: z.string().min(1, 'Student is required'),
  tutor_id: z.string().min(1, 'Tutor is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  duration_minutes: z.number().min(30, 'Duration must be at least 30 minutes'),
  notes: z.string().optional(),
  admin_override: z.boolean().default(false)
});

type AdminBookingFormData = z.infer<typeof adminBookingSchema>;

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

interface AdminBookingModalProps {
  onClose: () => void;
  onSessionBooked: () => void;
}

export const AdminBookingModal: React.FC<AdminBookingModalProps> = ({
  onClose,
  onSessionBooked
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [tutorSearch, setTutorSearch] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ slot: TimeSlot; date: Date } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<AdminBookingFormData>({
    resolver: zodResolver(adminBookingSchema),
    defaultValues: {
      duration_minutes: 60,
      admin_override: false
    }
  });

  const selectedTutorId = watch('tutor_id');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, studentSearch]);

  useEffect(() => {
    filterTutors();
  }, [tutors, tutorSearch]);

  useEffect(() => {
    if (selectedTutorId) {
      setShowCalendar(true);
      setSelectedSlot(null);
    } else {
      setShowCalendar(false);
    }
  }, [selectedTutorId]);

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

  const filterStudents = () => {
    if (!studentSearch) {
      setFilteredStudents(students.slice(0, 10));
    } else {
      const filtered = students.filter(student =>
        student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.email.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 10);
      setFilteredStudents(filtered);
    }
  };

  const filterTutors = () => {
    if (!tutorSearch) {
      setFilteredTutors(tutors.slice(0, 10));
    } else {
      const filtered = tutors.filter(tutor =>
        tutor.full_name.toLowerCase().includes(tutorSearch.toLowerCase()) ||
        tutor.email.toLowerCase().includes(tutorSearch.toLowerCase())
      ).slice(0, 10);
      setFilteredTutors(filtered);
    }
  };

  const handleSlotClick = (slot: TimeSlot, date: Date) => {
    console.log('Admin selected slot:', slot, 'on date:', date);
    setSelectedSlot({ slot, date });
  };

  const onSubmit = async (data: AdminBookingFormData) => {
    if (!selectedSlot) {
      alert('Please select an available time slot from the calendar');
      return;
    }

    setLoading(true);
    try {
      // Create scheduled date from selected slot and date
      const scheduledAt = new Date(selectedSlot.date);
      const [hours, minutes] = selectedSlot.slot.startTime.split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // If admin override is not enabled, validate booking
      if (!data.admin_override) {
        const validation = await availabilityService.validateBooking(
          data.tutor_id,
          scheduledAt,
          data.duration_minutes
        );

        if (!validation.isValid) {
          if (confirm(`Booking validation failed: ${validation.message}\\n\\nDo you want to override as admin?`)) {
            setValue('admin_override', true);
          } else {
            setLoading(false);
            return;
          }
        }
      }

      // Create the lesson
      const { error } = await supabase
        .from('lessons')
        .insert({
          student_id: data.student_id,
          tutor_id: data.tutor_id,
          subject_id: data.subject_id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: data.duration_minutes,
          status: 'scheduled',
          notes: data.notes ? `[ADMIN BOOKING] ${data.notes}` : '[ADMIN BOOKING]'
        });

      if (error) throw error;

      alert('Session booked successfully by admin!');
      onSessionBooked();
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Failed to book session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Admin Session Booking</h2>
            <p className="text-sm text-gray-600 mt-1">Book sessions for any student-tutor pair</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Select Student
              </label>
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
              />
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="radio"
                      {...register('student_id')}
                      value={student.id}
                      className="mr-3 text-orange-500 focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{student.full_name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.student_id && (
                <p className="text-red-500 text-sm mt-1">{errors.student_id.message}</p>
              )}
            </div>

            {/* Tutor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Select Tutor
              </label>
              <input
                type="text"
                placeholder="Search tutors..."
                value={tutorSearch}
                onChange={(e) => setTutorSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
              />
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {filteredTutors.map((tutor) => (
                  <label
                    key={tutor.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="radio"
                      {...register('tutor_id')}
                      value={tutor.id}
                      className="mr-3 text-orange-500 focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{tutor.full_name}</div>
                      <div className="text-sm text-gray-500">{tutor.email}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.tutor_id && (
                <p className="text-red-500 text-sm mt-1">{errors.tutor_id.message}</p>
              )}
            </div>
          </div>

          {/* Subject and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Duration (minutes)
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
              {errors.duration_minutes && (
                <p className="text-red-500 text-sm mt-1">{errors.duration_minutes.message}</p>
              )}
            </div>
          </div>

          {/* Calendar */}
          {showCalendar && selectedTutorId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-1" />
                Select Available Time Slot
              </label>
              <div className="border border-gray-300 rounded-lg">
                <AvailabilityCalendar
                  tutorId={selectedTutorId}
                  sessions={[]}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  onSlotClick={handleSlotClick}
                  showBookingOptions={true}
                  userRole="admin"
                />
              </div>
              {selectedSlot ? (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    ✅ Selected: {selectedSlot.date.toLocaleDateString()} at {selectedSlot.slot.startTime} - {selectedSlot.slot.endTime}
                  </p>
                  <p className="text-xs text-green-600">
                    {selectedSlot.slot.sessionType} session - R{selectedSlot.slot.rate}/hr
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📅 Please select an available time slot from the calendar above.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Optional notes about this admin booking..."
            />
          </div>

          {/* Admin Override */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('admin_override')}
              className="mr-2 text-orange-500 focus:ring-orange-500"
            />
            <label className="text-sm text-gray-700">
              Admin Override (bypass availability and conflict checks)
            </label>
          </div>

          {/* Actions */}
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
              {loading ? 'Booking...' : 'Book Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};