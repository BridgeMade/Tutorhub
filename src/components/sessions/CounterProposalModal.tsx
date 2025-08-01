import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sessionManagementService, RescheduleRequestWithDetails } from '../../services/sessionManagementService';
import { getSACurrentTime } from '../../utils/saFormatting';

const counterProposalSchema = z.object({
  proposedDate: z.string().min(1, 'Date is required'),
  proposedTime: z.string().min(1, 'Time is required'),
  proposedDuration: z.number().min(30, 'Duration must be at least 30 minutes'),
  reason: z.string().optional()
});

type CounterProposalFormData = z.infer<typeof counterProposalSchema>;

interface CounterProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalRequest: RescheduleRequestWithDetails;
  onSuccess?: () => void;
}

export const CounterProposalModal: React.FC<CounterProposalModalProps> = ({
  isOpen,
  onClose,
  originalRequest,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CounterProposalFormData>({
    resolver: zodResolver(counterProposalSchema),
    defaultValues: {
      proposedDuration: originalRequest.proposed_duration || originalRequest.original_duration
    }
  });

  // Get current date for minimum date input
  const saToday = getSACurrentTime().toISOString().split('T')[0];

  const onSubmit = async (data: CounterProposalFormData) => {
    setLoading(true);
    try {
      console.log('🔄 Submitting counter proposal:', data);

      const proposedDate = new Date(`${data.proposedDate}T${data.proposedTime}`);

      const result = await sessionManagementService.createCounterProposal({
        originalRequestId: originalRequest.id,
        proposedDate,
        proposedDuration: data.proposedDuration,
        reason: data.reason
      });

      if (result.success) {
        console.log('✅ Counter proposal created successfully');
        alert('Counter proposal submitted successfully! The requester will be notified of your alternative suggestion.');
        onSuccess?.();
        onClose();
      } else {
        console.error('❌ Failed to create counter proposal:', result.error);
        alert(`Failed to submit counter proposal: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error submitting counter proposal:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Counter Proposal</h2>
            <p className="text-gray-600 text-sm">
              Suggest an alternative time for this session
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

        {/* Original Request Details */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Original Request Details</h3>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Session:</p>
                <p className="font-medium text-gray-900">
                  {originalRequest.lesson_details?.subject_name}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Requested by:</p>
                <p className="font-medium text-gray-900">
                  {originalRequest.requester_name}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-gray-600">Original Time:</p>
                <p className="font-medium text-gray-900">
                  {new Date(originalRequest.original_date).toLocaleString()}
                </p>
              </div>
              {originalRequest.proposed_date && (
                <div>
                  <p className="text-gray-600">Their Proposed Time:</p>
                  <p className="font-medium text-gray-900">
                    {new Date(originalRequest.proposed_date).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3">
              <p className="text-gray-600">Their Reason:</p>
              <p className="text-gray-900 bg-white p-2 rounded border text-sm">
                {originalRequest.reason}
              </p>
            </div>
          </div>
        </div>

        {/* Counter Proposal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Your Counter Proposal</h3>
            
            {/* Proposed Date and Time */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Date
                </label>
                <input
                  type="date"
                  {...register('proposedDate')}
                  min={saToday}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.proposedDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.proposedDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Time
                </label>
                <input
                  type="time"
                  {...register('proposedTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.proposedTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.proposedTime.message}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                {...register('proposedDuration', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
              {errors.proposedDuration && (
                <p className="text-red-500 text-sm mt-1">{errors.proposedDuration.message}</p>
              )}
            </div>

            {/* Optional Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Counter Proposal (Optional)
              </label>
              <textarea
                {...register('reason')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Explain why this alternative time works better for you..."
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-blue-800">About Counter Proposals</p>
                <p className="text-blue-700">
                  Your counter proposal will be sent to the original requester. They have 4 hours to accept or decline your suggestion.
                  The admin will be notified of this interaction.
                </p>
              </div>
            </div>
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Send Counter Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};