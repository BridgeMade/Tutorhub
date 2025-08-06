import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { assignmentService, AssignmentWithDetails } from '../../services/assignmentService';
import { availabilityService, TimeSlot } from '../../services/availabilityService';
import { resourceRecommendationService } from '../../services/resourceRecommendationService';
import { getSACurrentTime, formatZAR } from '../../utils/saFormatting';
import { AvailabilityCalendar } from '../calendar/AvailabilityCalendar';
import { BookOpen, Clock, Download, Lightbulb } from 'lucide-react';

const bookSessionSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  tutor: z.string().min(1, 'Tutor is required'),
  duration: z.number().min(30, 'Duration must be at least 30 minutes'),
  notes: z.string().optional()
});

type BookSessionFormData = z.infer<typeof bookSessionSchema>;

interface BookSessionModalProps {
  studentId: string;
  onClose: () => void;
  preselectedSubject?: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Tutor {
  id: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
  hourly_rate?: number;
  specializations?: string[];
}

export const BookSessionModal: React.FC<BookSessionModalProps> = ({
  studentId,
  onClose,
  preselectedSubject = ''
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(preselectedSubject);
  const [selectedTutor, setSelectedTutor] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ slot: TimeSlot; date: Date } | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resourceRecommendations, setResourceRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<BookSessionFormData>({
    resolver: zodResolver(bookSessionSchema),
    defaultValues: {
      subject: preselectedSubject,
      duration: 60
    }
  });

  const watchedSubject = watch('subject');
  const watchedTutor = watch('tutor');

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (watchedSubject) {
      setSelectedSubject(watchedSubject);
      fetchTutorsForSubject(watchedSubject);
      setSelectedTutor('');
      setShowCalendar(false);
      setSelectedSlot(null);
      loadResourceRecommendations(watchedSubject);
    }
  }, [watchedSubject]);

  useEffect(() => {
    if (watchedTutor) {
      console.log('📅 BookSessionModal: Tutor selected:', watchedTutor);
      setSelectedTutor(watchedTutor);
      setShowCalendar(true);
      setSelectedSlot(null);
      console.log('📅 BookSessionModal: Calendar should now show for tutor:', watchedTutor);
    } else {
      console.log('📅 BookSessionModal: No tutor selected, hiding calendar');
      setShowCalendar(false);
    }
  }, [watchedTutor]);

  const fetchAssignments = async () => {
    console.log('🔍 BookSessionModal: Loading assignments for student:', studentId);
    try {
      const assignmentsResponse = await assignmentService.getStudentAssignments(studentId);
      if (assignmentsResponse.data) {
        setAssignments(assignmentsResponse.data);
        console.log('🔍 BookSessionModal: Found assignments:', assignmentsResponse.data.length);
        
        // Extract unique subjects from assignments
        const assignedSubjects = assignmentsResponse.data.map(assignment => ({
          id: assignment.subject_id,
          name: assignment.subject_name
        }));
        
        // Remove duplicates
        const uniqueSubjects = assignedSubjects.filter((subject, index, self) => 
          index === self.findIndex(s => s.id === subject.id)
        );
        
        setSubjects(uniqueSubjects);
        console.log('🔍 BookSessionModal: Available subjects:', uniqueSubjects);
      }
    } catch (error) {
      console.error('Error loading assignments in BookSessionModal:', error);
    }
  };

  const fetchTutorsForSubject = async (subjectName: string) => {
    console.log('🔍 BookSessionModal: Finding tutors for subject:', subjectName);
    
    // Filter assignments by the selected subject
    const subjectAssignments = assignments.filter(
      assignment => assignment.subject_name === subjectName
    );
    
    console.log('🔍 BookSessionModal: Assignments for subject:', subjectAssignments);
    
    // Convert assignments to tutor format expected by the form
    const assignedTutors = subjectAssignments.map(assignment => ({
      id: assignment.tutor_id, // Use tutor profile ID from assignment
      user_id: assignment.tutor_id,
      profiles: {
        full_name: assignment.tutor_name
      },
      hourly_rate: 25, // Default rate - could be fetched from tutor profile if needed
      specializations: [assignment.subject_name]
    }));
    
    setTutors(assignedTutors);
    console.log('🔍 BookSessionModal: Available tutors:', assignedTutors);
  };

  const loadResourceRecommendations = async (subjectName: string) => {
    try {
      // Get subject ID for recommendations
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', subjectName)
        .single();

      if (subjectData) {
        const recommendations = await resourceRecommendationService.getSubjectRecommendations(
          studentId,
          subjectData.id,
          undefined,
          4
        );
        setResourceRecommendations(recommendations);
        setShowRecommendations(recommendations.length > 0);
      }
    } catch (error) {
      console.error('Error loading resource recommendations:', error);
    }
  };

  const handleSlotClick = (slot: TimeSlot, date: Date) => {
    console.log('📅 Selected slot:', slot, 'on date:', date);
    setSelectedSlot({ slot, date });
  };

  const onSubmit = async (data: BookSessionFormData) => {
    if (!selectedSlot) {
      alert('Please select an available time slot from the calendar');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 BookSessionModal: Booking session with data:', data);
      console.log('🔍 BookSessionModal: Selected slot:', selectedSlot);
      
      // Get subject ID
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', data.subject)
        .single();

      console.log('🔍 BookSessionModal: Subject data:', subjectData);

      if (subjectData) {
        // Create scheduled date from selected slot and date
        const scheduledAt = new Date(selectedSlot.date);
        const [hours, minutes] = selectedSlot.slot.startTime.split(':').map(Number);
        scheduledAt.setHours(hours, minutes, 0, 0);
        
        console.log('🔍 BookSessionModal: Validating booking availability and conflicts...');
        
        // Validate booking before creating lesson
        const validation = await availabilityService.validateBooking(
          data.tutor,
          scheduledAt,
          data.duration
        );

        if (!validation.isValid) {
          console.error('❌ Booking validation failed:', validation.message);
          alert(`Cannot book session: ${validation.message}`);
          return;
        }

        console.log('✅ Booking validation passed, creating lesson...');
        console.log('🔍 Student profile ID:', studentId);
        console.log('🔍 Tutor profile ID:', data.tutor);
        console.log('🔍 Subject ID:', subjectData.id);
        
        // Use profile IDs directly instead of querying tutors/students tables
        const { error } = await supabase
          .from('lessons')
          .insert({
            student_id: studentId, // Use profile ID directly
            tutor_id: data.tutor,  // Use profile ID directly
            subject_id: subjectData.id,
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: data.duration,
            status: 'scheduled',
            notes: data.notes
          });

        if (error) {
          console.error('❌ Error booking session:', error);
          console.error('❌ Error details:', error.message, error.details, error.hint);
          alert('Failed to book session. Please try again.');
        } else {
          console.log('✅ Session booked successfully!');
          alert('Session booked successfully! The tutor has been notified and will confirm the session.');
          onClose();
        }
      } else {
        console.error('❌ Subject not found:', data.subject);
        alert('Subject not found. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error booking session:', error);
      alert('Failed to book session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get current date in South African timezone  
  const saToday = getSACurrentTime().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Book a Tutoring Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              {...register('subject')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tutor
            </label>
            <select
              {...register('tutor')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedSubject}
            >
              <option value="">Select a tutor</option>
              {tutors.map((tutor) => (
                <option key={tutor.id} value={tutor.user_id}>
                  {tutor.profiles.full_name} 
                  {tutor.hourly_rate && ` - ${formatZAR(tutor.hourly_rate)}/hr`}
                </option>
              ))}
            </select>
            {errors.tutor && (
              <p className="text-red-500 text-sm mt-1">{errors.tutor.message}</p>
            )}
          </div>

          {/* Availability Calendar */}
          {showCalendar && selectedTutor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Available Time Slot
              </label>
              <div className="border border-gray-300 rounded-lg">
                <AvailabilityCalendar
                  tutorId={selectedTutor}
                  sessions={[]} // Pass existing sessions if needed
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  onSlotClick={handleSlotClick}
                  showBookingOptions={true}
                  userRole="student"
                />
              </div>
              {selectedSlot ? (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    ✅ Selected: {selectedSlot.date.toLocaleDateString()} at {selectedSlot.slot.startTime} - {selectedSlot.slot.endTime}
                  </p>
                  <p className="text-xs text-green-600">
                    {selectedSlot.slot.sessionType} session - R{selectedSlot.slot.rate}/hr
                    {selectedSlot.slot.isSubSlot && ' • 1-hour booking slot'}
                  </p>
                  {selectedSlot.slot.isSubSlot && (
                    <p className="text-xs text-green-600 mt-1">
                      💡 This is a 1-hour slot within the tutor's larger availability block. Perfect for focused learning!
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📅 Please select an available time slot from the calendar above.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    💡 <strong>New:</strong> You can now book specific 1-hour slots within the tutor's availability! 
                    Look for slots marked with 🕐 for precise scheduling.
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              {...register('duration', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
            {errors.duration && (
              <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any specific topics or questions you'd like to focus on..."
            />
          </div>

          {/* Resource Recommendations */}
          {showRecommendations && resourceRecommendations.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="h-5 w-5 text-orange-600" />
                <h4 className="text-sm font-medium text-orange-900">
                  Recommended Resources for {selectedSubject}
                </h4>
              </div>
              <p className="text-xs text-orange-700 mb-3">
                Here are some resources that might help you prepare for this session:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resourceRecommendations.slice(0, 4).map((resource) => (
                  <div key={resource.id} className="bg-white rounded-md p-3 border border-orange-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900 mb-1">
                          {resource.title}
                        </h5>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {resource.description}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className={`px-1.5 py-0.5 rounded ${
                            resource.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                            resource.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {resource.difficulty_level}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{resource.estimated_time_minutes}m</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-orange-600">
                💡 Your tutor can assign specific resources when confirming the session
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Book Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};