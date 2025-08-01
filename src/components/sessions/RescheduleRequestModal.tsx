import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sessionManagementService } from '../../services/sessionManagementService';
import { getSACurrentTime } from '../../utils/saFormatting';

const rescheduleSchema = z.object({
  requestType: z.enum(['reschedule', 'cancel']),
  reason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)'),
  proposedDate: z.string().optional(),
  proposedTime: z.string().optional(),
  proposedDuration: z.number().min(30).optional()
});

type RescheduleFormData = z.infer<typeof rescheduleSchema>;

interface RescheduleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    student_name: string;
    tutor_name: string;
    subject_name: string;
    scheduled_at: string;
    duration_minutes: number;
  };
  userRole: 'student' | 'tutor';
  onSuccess?: () => void;
}

export const RescheduleRequestModal: React.FC<RescheduleRequestModalProps> = ({
  isOpen,
  onClose,
  lesson,
  userRole,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      requestType: 'reschedule',
      proposedDuration: lesson.duration_minutes
    }
  });

  const watchedRequestType = watch('requestType');
  const lessonDate = new Date(lesson.scheduled_at);
  const now = new Date();
  const hoursUntilLesson = (lessonDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isWithin24Hours = hoursUntilLesson <= 24;
  const isWithin4Hours = hoursUntilLesson <= 4;

  // Get current date for minimum date input
  const saToday = getSACurrentTime().toISOString().split('T')[0];
  const currentTime = getSACurrentTime().toTimeString().slice(0, 5);

  const onSubmit = async (data: RescheduleFormData) => {
    setLoading(true);
    try {
      console.log('🔄 Submitting reschedule request:', data);

      // Show warning for last-minute changes
      if (isWithin4Hours && data.requestType === 'cancel' && !showWarning) {
        setShowWarning(true);
        setLoading(false);
        return;
      }

      let proposedDate: Date | undefined;
      if (data.requestType === 'reschedule' && data.proposedDate && data.proposedTime) {
        proposedDate = new Date(`${data.proposedDate}T${data.proposedTime}`);
      }

      const result = await sessionManagementService.createRescheduleRequest({
        lessonId: lesson.id,
        requestType: data.requestType,
        reason: data.reason,
        proposedDate,
        proposedDuration: data.proposedDuration
      });

      if (result.success) {
        console.log('✅ Reschedule request created successfully');
        
        let message = '';
        if (data.requestType === 'cancel') {
          if (isWithin4Hours) {
            message = 'Cancellation request submitted. Note: This session will be marked as lost due to short notice.';
          } else {
            message = 'Cancellation request submitted successfully. You will be notified when it\'s processed.';
          }
        } else {
          if (isWithin24Hours) {
            message = 'Reschedule request submitted. Admin approval is required for changes within 24 hours.';
          } else {
            message = 'Reschedule request submitted successfully. You will be notified when the other party responds.';
          }
        }
        
        alert(message);
        onSuccess?.();
        onClose();
      } else {
        console.error('❌ Failed to create reschedule request:', result.error);
        alert(`Failed to submit request: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error submitting reschedule request:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWarning = () => {
    setShowWarning(false);
    handleSubmit(onSubmit)();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Session Request</h2>
            <p className="text-gray-600 text-sm">
              {lesson.subject_name} with {userRole === 'student' ? lesson.tutor_name : lesson.student_name}
            </p>
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

        {/* Warning Banner */}
        {(isWithin24Hours || isWithin4Hours) && (
          <div className={`p-4 ${isWithin4Hours ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border-l-4`}>
            <div className="flex items-start">
              <svg className={`w-5 h-5 mt-0.5 mr-2 ${isWithin4Hours ? 'text-red-400' : 'text-yellow-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                {isWithin4Hours ? (
                  <div>
                    <p className="font-medium text-red-800">Warning: Last-minute change</p>
                    <p className="text-red-700">Cancellations within 4 hours will result in session loss.</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-yellow-800">24-Hour Override Required</p>
                    <p className="text-yellow-700">
                      Changes within 24 hours require admin approval. Your request will be escalated to administrators who will review and make a decision based on the circumstances.
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Processing time: Usually within 2-4 hours during business hours.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Session Details */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Current Session Details</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Date:</span> {lessonDate.toLocaleDateString()}</p>
            <p><span className="font-medium">Time:</span> {lessonDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            <p><span className="font-medium">Duration:</span> {lesson.duration_minutes} minutes</p>
          </div>
        </div>

        {/* Warning Modal */}
        {showWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div className="text-center">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Session Will Be Lost</h3>
                <p className="text-gray-600 mb-4">
                  Cancelling within 4 hours means this session cannot be rescheduled and will be marked as lost. Are you sure you want to continue?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowWarning(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmWarning}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Request Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="reschedule"
                  {...register('requestType')}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Reschedule</p>
                  <p className="text-sm text-gray-600">Move to different date/time</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="cancel"
                  {...register('requestType')}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Cancel</p>
                  <p className="text-sm text-gray-600">Cancel this session</p>
                </div>
              </label>
            </div>
          </div>

          {/* Proposed New Time (only for reschedule) */}
          {watchedRequestType === 'reschedule' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Proposed New Time</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    {...register('proposedDate', { required: watchedRequestType === 'reschedule' })}
                    min={saToday}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  {errors.proposedDate && (
                    <p className="text-red-500 text-xs mt-1">Date is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Time</label>
                  <input
                    type="time"
                    {...register('proposedTime', { required: watchedRequestType === 'reschedule' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  {errors.proposedTime && (
                    <p className="text-red-500 text-xs mt-1">Time is required</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Duration (only for reschedule) */}
          {watchedRequestType === 'reschedule' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                {...register('proposedDuration', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
            <textarea
              {...register('reason')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Please provide a detailed reason for this request..."
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-lg hover:from-orange-500 hover:to-pink-500 font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};