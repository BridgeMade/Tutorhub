import { supabase } from '../lib/supabase';

export interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isRecurring: boolean;
  sessionType: 'individual' | 'group' | 'online';
  maxStudents?: number;
  rate?: number;
  tutor_id: string;
  isSubSlot?: boolean; // Indicates if this is a sub-slot generated from a larger availability block
}

export interface BookingConflict {
  hasConflict: boolean;
  conflictingLessons?: Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    student_name: string;
  }>;
  message?: string;
}

export const availabilityService = {
  // Save tutor availability to database
  async saveTutorAvailability(tutorId: string, availability: TimeSlot[]): Promise<boolean> {
    try {
      console.log('💾 Saving tutor availability for:', tutorId);
      
      // First, delete existing availability
      await supabase
        .from('tutor_availability')
        .delete()
        .eq('tutor_id', tutorId);

      // Insert new availability slots
      const availabilityData = availability.map(slot => ({
        tutor_id: tutorId,
        day_of_week: slot.day,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: slot.isAvailable,
        is_recurring: slot.isRecurring,
        session_type: slot.sessionType,
        max_students: slot.maxStudents,
        hourly_rate: slot.rate
      }));

      const { error } = await supabase
        .from('tutor_availability')
        .insert(availabilityData);

      if (error) {
        console.error('❌ Error saving availability:', error);
        return false;
      }

      console.log('✅ Tutor availability saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Unexpected error saving availability:', error);
      return false;
    }
  },

  // Get tutor availability from database
  async getTutorAvailability(tutorId: string): Promise<TimeSlot[]> {
    try {
      console.log('🔍 Fetching tutor availability for:', tutorId);

      const { data, error } = await supabase
        .from('tutor_availability')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('is_available', true);

      if (error) {
        console.error('❌ Error fetching availability:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('🔍 No availability found for tutor');
        return [];
      }

      // Convert database format to TimeSlot format
      const availability: TimeSlot[] = data.map((slot: any) => ({
        id: `${slot.day_of_week}-${slot.start_time}-${slot.tutor_id}`,
        day: slot.day_of_week,
        startTime: slot.start_time,
        endTime: slot.end_time,
        isAvailable: slot.is_available,
        isRecurring: slot.is_recurring,
        sessionType: slot.session_type,
        maxStudents: slot.max_students,
        rate: slot.hourly_rate,
        tutor_id: slot.tutor_id
      }));

      console.log('✅ Found availability slots:', availability.length);
      return availability;
    } catch (error) {
      console.error('❌ Unexpected error fetching availability:', error);
      return [];
    }
  },

  // Check if tutor is available at specific date/time (enhanced for granular booking)
  async checkTutorAvailability(
    tutorId: string, 
    dateTime: Date, 
    durationMinutes: number
  ): Promise<{ isAvailable: boolean; message?: string }> {
    try {
      console.log('🔍 Checking tutor availability:', { tutorId, dateTime, durationMinutes });

      const dayName = dateTime.toLocaleDateString('en-US', { weekday: 'long' });
      const requestedStartTime = dateTime.toTimeString().slice(0, 5); // HH:MM format
      const requestedEndTime = new Date(dateTime.getTime() + durationMinutes * 60000).toTimeString().slice(0, 5);

      console.log('🔍 Looking for availability on:', { dayName, requestedStartTime, requestedEndTime });

      // Get all availability blocks for this day
      const { data: availabilitySlots, error: availError } = await supabase
        .from('tutor_availability')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('day_of_week', dayName)
        .eq('is_available', true);

      if (availError) {
        console.error('❌ Error checking availability:', availError);
        return { isAvailable: false, message: 'Error checking availability' };
      }

      if (!availabilitySlots || availabilitySlots.length === 0) {
        console.log('❌ No available slots found for this day');
        return { 
          isAvailable: false, 
          message: `Tutor has no availability set for ${dayName}` 
        };
      }

      // Check if the requested time falls within any availability block
      const requestedStart = this.timeToMinutes(requestedStartTime);
      const requestedEnd = this.timeToMinutes(requestedEndTime);

      const hasAvailableSlot = availabilitySlots.some((slot: any) => {
        const slotStart = this.timeToMinutes(slot.start_time);
        const slotEnd = this.timeToMinutes(slot.end_time);
        
        // Check if requested time is completely within this availability slot
        const fitsInSlot = requestedStart >= slotStart && requestedEnd <= slotEnd;
        
        console.log('🔍 Checking slot:', {
          slotTime: `${slot.start_time}-${slot.end_time}`,
          slotStart,
          slotEnd,
          requestedStart,
          requestedEnd,
          fitsInSlot
        });
        
        return fitsInSlot;
      });

      if (!hasAvailableSlot) {
        console.log('❌ Requested time does not fit within any availability block');
        return { 
          isAvailable: false, 
          message: `Tutor is not available on ${dayName} from ${requestedStartTime} to ${requestedEndTime}. Please choose a time within their available blocks.` 
        };
      }

      console.log('✅ Tutor has availability for the requested time');
      return { isAvailable: true };
    } catch (error) {
      console.error('❌ Unexpected error checking availability:', error);
      return { isAvailable: false, message: 'Error checking availability' };
    }
  },

  // Helper function to convert time string to minutes
  timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Check for booking conflicts (double booking prevention) 
  async checkBookingConflicts(
    tutorId: string,
    dateTime: Date,
    durationMinutes: number
  ): Promise<BookingConflict> {
    try {
      console.log('🔍 Checking for booking conflicts:', { tutorId, dateTime, durationMinutes });

      const sessionStart = dateTime.toISOString();
      const sessionEnd = new Date(dateTime.getTime() + durationMinutes * 60000).toISOString();

      console.log('🔍 Session time range:', { sessionStart, sessionEnd });

      // Find overlapping lessons for this tutor
      const { data: conflictingLessons, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          student:profiles!lessons_student_id_fkey(full_name)
        `)
        .eq('tutor_id', tutorId)
        .in('status', ['scheduled', 'confirmed'])
        .or(`and(scheduled_at.lt.${sessionEnd},scheduled_at.gte.${sessionStart}),and(scheduled_at.lte.${sessionStart},scheduled_at.gt.${new Date(new Date(sessionStart).getTime() - 2 * 60 * 60 * 1000).toISOString()})`);

      if (error) {
        console.error('❌ Error checking conflicts:', error);
        return { 
          hasConflict: true, 
          message: 'Error checking for scheduling conflicts' 
        };
      }

      // Filter lessons that actually overlap
      const actualConflicts = conflictingLessons?.filter((lesson: any) => {
        const lessonStart = new Date(lesson.scheduled_at);
        const lessonEnd = new Date(lessonStart.getTime() + lesson.duration_minutes * 60000);
        
        // Check if there's any overlap
        const hasOverlap = (
          dateTime < lessonEnd && new Date(dateTime.getTime() + durationMinutes * 60000) > lessonStart
        );

        console.log('🔍 Checking lesson overlap:', {
          lessonId: lesson.id,
          lessonStart: lessonStart.toISOString(),
          lessonEnd: lessonEnd.toISOString(),
          requestedStart: dateTime.toISOString(),
          requestedEnd: new Date(dateTime.getTime() + durationMinutes * 60000).toISOString(),
          hasOverlap
        });

        return hasOverlap;
      }) || [];

      if (actualConflicts.length > 0) {
        console.log('❌ Booking conflicts found:', actualConflicts.length);
        
        const conflictMessages = actualConflicts.map((lesson: any) => {
          const lessonStart = new Date(lesson.scheduled_at);
          return `${lessonStart.toLocaleString()} with ${lesson.student?.full_name || 'Unknown Student'}`;
        });

        return {
          hasConflict: true,
          conflictingLessons: actualConflicts.map((lesson: any) => ({
            id: lesson.id,
            scheduled_at: lesson.scheduled_at,
            duration_minutes: lesson.duration_minutes,
            student_name: lesson.student?.full_name || 'Unknown Student'
          })),
          message: `Tutor already has sessions scheduled: ${conflictMessages.join(', ')}`
        };
      }

      console.log('✅ No booking conflicts found');
      return { hasConflict: false };
    } catch (error) {
      console.error('❌ Unexpected error checking conflicts:', error);
      return { 
        hasConflict: true, 
        message: 'Error checking for scheduling conflicts' 
      };
    }
  },

  // Comprehensive booking validation
  async validateBooking(
    tutorId: string,
    dateTime: Date,
    durationMinutes: number
  ): Promise<{ 
    isValid: boolean; 
    availabilityCheck?: { isAvailable: boolean; message?: string };
    conflictCheck?: BookingConflict;
    message?: string 
  }> {
    try {
      console.log('🔍 Validating booking:', { tutorId, dateTime, durationMinutes });

      // Check tutor availability
      const availabilityCheck = await this.checkTutorAvailability(tutorId, dateTime, durationMinutes);
      
      if (!availabilityCheck.isAvailable) {
        return {
          isValid: false,
          availabilityCheck,
          message: availabilityCheck.message
        };
      }

      // Check for booking conflicts
      const conflictCheck = await this.checkBookingConflicts(tutorId, dateTime, durationMinutes);
      
      if (conflictCheck.hasConflict) {
        return {
          isValid: false,
          availabilityCheck,
          conflictCheck,
          message: conflictCheck.message
        };
      }

      console.log('✅ Booking validation passed');
      return { 
        isValid: true, 
        availabilityCheck, 
        conflictCheck,
        message: 'Session can be booked successfully' 
      };
    } catch (error) {
      console.error('❌ Error validating booking:', error);
      return {
        isValid: false,
        message: 'Error validating booking request'
      };
    }
  }
};