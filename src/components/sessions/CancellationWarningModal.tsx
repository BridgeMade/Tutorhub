import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CancellationWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, isEmergency: boolean) => void;
  lessonId: string;
  currentUserId: string;
  lessonDetails: {
    scheduled_at: string;
    student_name?: string;
    tutor_name?: string;
    subject_name?: string;
    duration_minutes: number;
  };
}

interface CancellationWarning {
  will_lose_session: boolean;
  hours_remaining: number;
  warning_message: string;
}

export const CancellationWarningModal: React.FC<CancellationWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lessonId,
  currentUserId,
  lessonDetails
}) => {
  const [warningData, setWarningData] = useState<CancellationWarning | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkCancellationWarning();
    }
  }, [isOpen, lessonId, currentUserId]);

  const checkCancellationWarning = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .rpc('will_cancellation_result_in_loss', {
          p_lesson_id: lessonId,
          p_user_id: currentUserId
        });

      if (error) {
        console.error('Error checking cancellation warning:', error);
        return;
      }

      if (data && data.length > 0) {
        setWarningData(data[0]);
      }
    } catch (error) {
      console.error('Error checking cancellation warning:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setSubmitting(true);
    
    try {
      onConfirm(reason, isEmergency);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${hours.toFixed(1)} hour${hours !== 1 ? 's' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cancel Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Session Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Session Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Date:</strong> {new Date(lessonDetails.scheduled_at).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(lessonDetails.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Duration:</strong> {lessonDetails.duration_minutes} minutes</p>
                {lessonDetails.subject_name && (
                  <p><strong>Subject:</strong> {lessonDetails.subject_name}</p>
                )}
              </div>
            </div>

            {/* Warning Message */}
            {warningData && (
              <div className={`rounded-lg p-4 ${
                warningData.will_lose_session 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    warningData.will_lose_session ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                  <div>
                    <h4 className={`font-medium ${
                      warningData.will_lose_session ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {warningData.will_lose_session ? 'Session Loss Warning' : 'Cancellation Notice'}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      warningData.will_lose_session ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {warningData.warning_message}
                    </p>
                    <div className={`flex items-center text-xs mt-2 ${
                      warningData.will_lose_session ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      <Clock className="w-3 h-3 mr-1" />
                      Time remaining: {formatTime(warningData.hours_remaining)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Option */}
            {warningData?.will_lose_session && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-blue-900">
                      Emergency Cancellation
                    </span>
                    <p className="text-xs text-blue-700 mt-1">
                      Check this if you have a genuine emergency. Admin verification required to avoid session loss.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a detailed reason for cancelling this session..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={submitting}
              >
                Keep Session
              </button>
              <button
                onClick={handleConfirm}
                disabled={!reason.trim() || submitting}
                className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                  warningData?.will_lose_session && !isEmergency
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  warningData?.will_lose_session && !isEmergency ? 'Cancel & Lose Session' : 'Cancel Session'
                )}
              </button>
            </div>

            {/* Additional Warning for Session Loss */}
            {warningData?.will_lose_session && !isEmergency && (
              <div className="text-xs text-red-600 text-center">
                ⚠️ This action cannot be undone. You will lose this session permanently.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};