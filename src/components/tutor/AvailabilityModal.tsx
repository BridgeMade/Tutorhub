import React, { useState } from 'react';
import { availabilityService } from '../../services/availabilityService';

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

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAvailability?: TimeSlot[];
  onSave: (availability: TimeSlot[]) => void;
  tutorId: string;
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  initialAvailability = [],
  onSave,
  tutorId
}) => {
  const [availability, setAvailability] = useState<TimeSlot[]>(initialAvailability);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [newSlot, setNewSlot] = useState({
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'individual' as 'individual' | 'group' | 'online',
    maxStudents: 1,
    rate: 150
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const addTimeSlot = () => {
    const id = `${selectedDay}-${newSlot.startTime}-${Date.now()}`;
    const slot: TimeSlot = {
      id,
      day: selectedDay,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      isAvailable: true,
      isRecurring: true,
      sessionType: newSlot.sessionType,
      maxStudents: newSlot.sessionType === 'group' ? newSlot.maxStudents : undefined,
      rate: newSlot.rate
    };

    setAvailability(prev => [...prev, slot]);
  };

  const removeTimeSlot = (id: string) => {
    setAvailability(prev => prev.filter(slot => slot.id !== id));
  };

  const toggleSlotAvailability = (id: string) => {
    setAvailability(prev =>
      prev.map(slot =>
        slot.id === id ? { ...slot, isAvailable: !slot.isAvailable } : slot
      )
    );
  };

  const updateSlot = (id: string, updates: Partial<TimeSlot>) => {
    setAvailability(prev =>
      prev.map(slot =>
        slot.id === id ? { ...slot, ...updates } : slot
      )
    );
  };

  const handleSave = async () => {
    try {
      console.log('💾 Saving tutor availability to database...');
      console.log('📊 Number of availability slots to save:', availability.length);
      
      // Check if user has added any availability slots
      if (availability.length === 0) {
        alert('Please add at least one time slot before saving. Use the "Add Time Slot" button to set your available times.');
        return;
      }
      
      // Add tutor_id to all availability slots
      const availabilityWithTutorId = availability.map(slot => ({
        ...slot,
        tutor_id: tutorId
      }));
      
      console.log('📅 Availability slots to save:', availabilityWithTutorId);
      
      const success = await availabilityService.saveTutorAvailability(tutorId, availabilityWithTutorId);
      
      if (success) {
        console.log('✅ Availability saved successfully');
        onSave(availability);
        onClose();
        alert(`Availability settings saved successfully! Added ${availability.length} time slot${availability.length !== 1 ? 's' : ''}.`);
      } else {
        console.error('❌ Failed to save availability');
        alert('Failed to save availability settings. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving availability:', error);
      alert('An error occurred while saving availability settings.');
    }
  };

  const getAvailabilityForDay = (day: string) => {
    return availability.filter(slot => slot.day === day);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Availability</h2>
            <p className="text-gray-600 text-sm">Set your teaching schedule and preferences</p>
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>📝 Instructions:</strong> Use the form on the left to add time slots. Students will only be able to book during these times.
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Add New Slot Form */}
          <div className="lg:w-1/3 p-6 border-r border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Time Slot</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <select
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <select
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                <select
                  value={newSlot.sessionType}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, sessionType: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {newSlot.sessionType === 'group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={newSlot.maxStudents}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate (R/hour)</label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={newSlot.rate}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, rate: parseInt(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <button
                onClick={addTimeSlot}
                className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-500 hover:to-pink-500 transition-all duration-200"
              >
                Add Time Slot
              </button>
            </div>
          </div>

          {/* Weekly Schedule View */}
          <div className="lg:w-2/3 p-6 overflow-y-auto flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
            
            <div className="space-y-6">
              {daysOfWeek.map(day => {
                const daySlots = getAvailabilityForDay(day);
                return (
                  <div key={day} className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{day}</h4>
                    
                    {daySlots.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">No time slots for {day}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {daySlots
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(slot => (
                            <div
                              key={slot.id}
                              className={`p-4 rounded-lg border transition-all duration-200 ${
                                slot.isAvailable 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className="font-medium text-gray-900">
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      slot.sessionType === 'individual' ? 'bg-blue-100 text-blue-800' :
                                      slot.sessionType === 'group' ? 'bg-purple-100 text-purple-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {slot.sessionType}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span>R{slot.rate}/hr</span>
                                    {slot.maxStudents && (
                                      <span>Max {slot.maxStudents} students</span>
                                    )}
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={slot.isAvailable}
                                        onChange={() => toggleSlotAvailability(slot.id)}
                                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                      />
                                      <span>Available</span>
                                    </label>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={slot.rate}
                                    onChange={(e) => updateSlot(slot.id, { rate: parseInt(e.target.value) })}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                  >
                                    <option value={100}>R100</option>
                                    <option value={150}>R150</option>
                                    <option value={200}>R200</option>
                                    <option value={250}>R250</option>
                                    <option value={300}>R300</option>
                                  </select>
                                  
                                  <button
                                    onClick={() => removeTimeSlot(slot.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer - Always visible */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm">
            {availability.filter(slot => slot.isAvailable).length > 0 ? (
              <span className="text-green-600 font-medium">
                ✅ {availability.filter(slot => slot.isAvailable).length} active time slot{availability.filter(slot => slot.isAvailable).length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-orange-600 font-medium">
                ⚠️ No time slots added yet. Add slots using the form on the left.
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                availability.length > 0
                  ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white hover:from-orange-500 hover:to-pink-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Changes {availability.length > 0 && `(${availability.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};