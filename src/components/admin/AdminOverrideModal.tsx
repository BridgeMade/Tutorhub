import React, { useState } from 'react';
import { AlertTriangle, Clock, Shield, Check, X } from 'lucide-react';
import { sessionManagementService, RescheduleRequestWithDetails } from '../../services/sessionManagementService';
import { useAuth } from '../../hooks/useAuth';

interface AdminOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RescheduleRequestWithDetails;
  onSuccess?: () => void;
}

export const AdminOverrideModal: React.FC<AdminOverrideModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'declined' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Only show for admin users
  if (!isOpen || profile?.role !== 'admin') {
    return null;
  }

  const lessonDate = new Date(request.original_date);
  const now = new Date();
  const hoursUntilLesson = (lessonDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isEmergency = hoursUntilLesson <= 4;
  const isWithin24Hours = hoursUntilLesson <= 24;

  const handleSubmit = async () => {
    if (!decision) return;

    setLoading(true);
    try {
      const result = await sessionManagementService.adminRespondToRequest(
        request.id,
        decision,
        adminNotes || `Admin ${decision} - 24-hour override`
      );

      if (result.success) {
        console.log(`✅ Request ${decision} by admin override`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        console.error(`❌ Failed to ${decision} request:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error ${decision} request:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = () => {
    if (isEmergency) return { level: 'HIGH', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700' };
    if (isWithin24Hours) return { level: 'MEDIUM', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-700' };
    return { level: 'LOW', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700' };
  };

  const risk = getRiskLevel();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Admin Override Required</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Risk Alert */}
        <div className={`${risk.bgColor} border border-${risk.color}-200 rounded-lg p-4 mb-6`}>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className={`w-5 h-5 text-${risk.color}-600`} />
            <span className={`font-medium ${risk.textColor}`}>
              {risk.level} PRIORITY - 24-Hour Override Request
            </span>
          </div>
          <p className={`text-sm ${risk.textColor}`}>
            This request is within the 24-hour restriction window and requires admin approval.
            {isEmergency && ' WARNING: This is within 4 hours - may result in session loss if cancelled.'}
          </p>
        </div>

        {/* Request Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Request Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Type:</strong> {request.request_type === 'reschedule' ? 'Reschedule' : 'Cancellation'}</p>
              <p><strong>Subject:</strong> {request.lesson_details?.subject_name || 'Unknown'}</p>
              <p><strong>Student:</strong> {request.lesson_details?.student_name || 'Unknown'}</p>
              <p><strong>Tutor:</strong> {request.lesson_details?.tutor_name || 'Unknown'}</p>
            </div>
            <div>
              <p><strong>Original Date:</strong> {new Date(request.original_date).toLocaleString()}</p>
              {request.proposed_date && (
                <p><strong>Proposed Date:</strong> {new Date(request.proposed_date).toLocaleString()}</p>
              )}
              <p><strong>Requested By:</strong> {request.requester_name || 'Unknown'}</p>
              <p><strong>Time Alert:</strong> 
                <span className={`ml-1 font-medium ${risk.textColor}`}>
                  {Math.round(hoursUntilLesson)}h {Math.round((hoursUntilLesson % 1) * 60)}m until session
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Reason for Request</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">{request.reason}</p>
          </div>
        </div>

        {/* Admin Decision */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Admin Decision</h3>
          
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setDecision('approved')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                decision === 'approved'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 text-gray-700'
              }`}
            >
              <Check className="w-5 h-5" />
              <span className="font-medium">Approve Override</span>
            </button>
            
            <button
              onClick={() => setDecision('declined')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                decision === 'declined'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300 text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
              <span className="font-medium">Decline Override</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add any additional notes about this decision..."
            />
          </div>
        </div>

        {/* Impact Warning */}
        {decision === 'approved' && request.request_type === 'cancel' && isEmergency && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-700">Session Loss Warning</span>
            </div>
            <p className="text-sm text-red-700">
              Approving this cancellation within 4 hours will mark the session as "lost" and may affect payment/credit policies.
            </p>
          </div>
        )}

        {/* Decision Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Decision Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Approve</strong> for genuine emergencies, illness, or unavoidable circumstances</li>
            <li>• <strong>Decline</strong> for convenience requests or poor planning</li>
            <li>• Consider the impact on both student and tutor schedules</li>
            <li>• Emergency cancellations within 4 hours will result in session loss</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!decision || loading}
            className={`px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${
              decision === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : decision === 'declined'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-400'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `${decision === 'approved' ? 'Approve' : decision === 'declined' ? 'Decline' : 'Select'} Request`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};