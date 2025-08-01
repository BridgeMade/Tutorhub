import React from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const ReschedulePolicy: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">24-Hour Reschedule Policy</h2>
      </div>

      {/* Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Policy Overview</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            To ensure fair scheduling and minimize disruption, session changes requested within 24 hours 
            of the scheduled time require administrative approval. This policy protects both students and 
            tutors from last-minute cancellations while allowing flexibility for genuine emergencies.
          </p>
        </div>
      </div>

      {/* Time Restrictions */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Time-Based Restrictions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Normal Window */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Normal Window</span>
            </div>
            <p className="text-sm text-green-800 mb-2"><strong>More than 24 hours before session</strong></p>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Automatic approval</li>
              <li>• No penalties</li>
              <li>• Full flexibility</li>
            </ul>
          </div>

          {/* 24-Hour Override */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-900">24-Hour Override</span>
            </div>
            <p className="text-sm text-orange-800 mb-2"><strong>24 hours to 4 hours before session</strong></p>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>• Requires admin approval</li>
              <li>• Case-by-case evaluation</li>
              <li>• Usually processed within 2-4 hours</li>
            </ul>
          </div>

          {/* Emergency Window */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">Emergency Window</span>
            </div>
            <p className="text-sm text-red-800 mb-2"><strong>Less than 4 hours before session</strong></p>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• Requires admin approval</li>
              <li>• Cancellations = session loss</li>
              <li>• Only for true emergencies</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Approval Guidelines */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Approval Guidelines</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Approve Scenarios */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Typically APPROVE for:</span>
            </div>
            <ul className="text-sm text-gray-700 space-y-2 bg-green-50 p-4 rounded-lg">
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Medical emergencies:</strong> Illness, injury, medical appointments</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Family emergencies:</strong> Death, serious illness, urgent family matters</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Transportation issues:</strong> Car breakdown, public transport delays</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Work/school conflicts:</strong> Unexpected work requirements, exam schedule changes</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 mt-1">•</span>
                <span><strong>Technical issues:</strong> Internet outage, equipment failure</span>
              </li>
            </ul>
          </div>

          {/* Decline Scenarios */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">Typically DECLINE for:</span>
            </div>
            <ul className="text-sm text-gray-700 space-y-2 bg-red-50 p-4 rounded-lg">
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">•</span>
                <span><strong>Social conflicts:</strong> Parties, social events, non-essential activities</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">•</span>
                <span><strong>Poor planning:</strong> Forgot about other commitments, scheduling conflicts</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">•</span>
                <span><strong>Convenience changes:</strong> Want to sleep in, changed mind, prefer different time</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">•</span>
                <span><strong>Repeated offenses:</strong> Pattern of last-minute changes without valid reasons</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-600 mt-1">•</span>
                <span><strong>Vague reasons:</strong> "Something came up", no specific explanation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Impact Assessment */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Impact Assessment Checklist</h3>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-3">Consider these factors when making decisions:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-gray-600 space-y-1">
              <li>☐ Is the reason genuine and unavoidable?</li>
              <li>☐ How will this affect the other party's schedule?</li>
              <li>☐ What is the user's history with cancellations?</li>
              <li>☐ Is there a pattern of abuse?</li>
            </ul>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>☐ Can the session be rescheduled to mutual benefit?</li>
              <li>☐ Will this create financial impact (session loss)?</li>
              <li>☐ Are there extenuating circumstances?</li>
              <li>☐ Does the request include adequate documentation?</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Session Loss Policy */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Loss Policy</h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-900">Important: 4-Hour Cancellation Rule</span>
          </div>
          <p className="text-sm text-red-800 mb-3">
            Sessions cancelled within 4 hours of the scheduled time are automatically marked as "lost" regardless of the reason. 
            This policy applies even with admin approval.
          </p>
          <ul className="text-xs text-red-700 space-y-1">
            <li>• Student loses the session credit (if prepaid)</li>
            <li>• Tutor may still receive partial compensation (platform policy)</li>
            <li>• Session counts toward monthly limits</li>
            <li>• Only true emergencies should be approved in this window</li>
          </ul>
        </div>
      </div>

      {/* Response Time Expectations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Admin Response Time Expectations</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Standard requests:</strong> 2-4 hours during business hours (8 AM - 6 PM)</p>
          <p><strong>Emergency requests:</strong> Within 1 hour when possible</p>
          <p><strong>After hours:</strong> By next business day morning</p>
          <p><strong>Auto-escalation:</strong> All unanswered requests after 4 hours</p>
        </div>
      </div>
    </div>
  );
};