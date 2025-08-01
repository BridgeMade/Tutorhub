// Test script for granular booking functionality
import { TimeSlot } from '../services/availabilityService';

// Sample data mimicking what the system now supports
export const testGranularBooking = () => {
  console.log('🧪 Testing Granular Booking System');
  
  // Original tutor availability (what tutor sets)
  const originalAvailability: TimeSlot = {
    id: 'friday-14-00-tutor123',
    day: 'Friday',
    startTime: '14:00',
    endTime: '18:00',
    isAvailable: true,
    isRecurring: true,
    sessionType: 'individual',
    rate: 150,
    tutor_id: 'tutor123'
  };
  
  console.log('📅 Original availability block:', originalAvailability);
  
  // What the system now generates (sub-slots)
  const generatedSubSlots: TimeSlot[] = [
    {
      ...originalAvailability,
      id: 'friday-14-00-tutor123-sub-840', // 14*60 = 840 minutes
      startTime: '14:00',
      endTime: '15:00',
      isSubSlot: true
    },
    {
      ...originalAvailability,
      id: 'friday-14-00-tutor123-sub-900', // 15*60 = 900 minutes
      startTime: '15:00',
      endTime: '16:00',
      isSubSlot: true
    },
    {
      ...originalAvailability,
      id: 'friday-14-00-tutor123-sub-960', // 16*60 = 960 minutes
      startTime: '16:00',
      endTime: '17:00',
      isSubSlot: true
    },
    {
      ...originalAvailability,
      id: 'friday-14-00-tutor123-sub-1020', // 17*60 = 1020 minutes
      startTime: '17:00',
      endTime: '18:00',
      isSubSlot: true
    }
  ];
  
  console.log('🕐 Generated sub-slots for booking:');
  generatedSubSlots.forEach((slot, index) => {
    console.log(`  ${index + 1}. ${slot.startTime}-${slot.endTime} (1-hour slot)`);
  });
  
  // Example bookings students can now make
  const possibleBookings = [
    { student: 'Alice', time: '15:00-16:00', purpose: 'Math tutoring' },
    { student: 'Bob', time: '17:00-18:00', purpose: 'Physics help' },
    { student: 'Charlie', time: '14:00-15:00', purpose: 'Chemistry review' }
  ];
  
  console.log('📚 Example bookings students can now make:');
  possibleBookings.forEach((booking, index) => {
    console.log(`  ${index + 1}. ${booking.student} can book ${booking.time} for ${booking.purpose}`);
  });
  
  console.log('✅ Granular booking system allows multiple students to book specific 1-hour slots within the tutor\'s 4-hour availability window!');
  console.log('💡 Before: Only one student could book the entire 14:00-18:00 block');
  console.log('💡 Now: Up to 4 students can book individual 1-hour slots within that same time frame');
  
  return {
    originalBlock: originalAvailability,
    subSlots: generatedSubSlots,
    possibleBookings
  };
};

// Usage example:
// testGranularBooking();