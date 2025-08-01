import React, { useState, useEffect } from 'react';
import { Bell, Mail, Volume2, VolumeX, Clock, Save, Check, X } from 'lucide-react';
import { notificationService, NotificationPreferences as NotificationPrefs } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

interface NotificationPreferencesProps {
  className?: string;
  onClose?: () => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ 
  className = '', 
  onClose 
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const userPrefs = await notificationService.getUserPreferences(user.id);
      if (userPrefs) {
        setPreferences(userPrefs);
      } else {
        // Set default preferences
        setPreferences({
          id: '',
          user_id: user.id,
          in_app_enabled: true,
          in_app_sound: true,
          email_enabled: true,
          email_address: user.email || '',
          reschedule_notifications: true,
          message_notifications: true,
          reminder_notifications: true,
          admin_notifications: true,
          email_digest_frequency: 'instant',
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
          timezone: 'Africa/Johannesburg',
          created_at: '',
          updated_at: ''
        });
      }
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !preferences) return;

    setSaving(true);
    try {
      const result = await notificationService.updateUserPreferences(user.id, preferences);
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onClose) {
          setTimeout(onClose, 1000);
        }
      }
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPrefs, value: any) => {
    if (!preferences) return;
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <p className="text-gray-500">Unable to load notification preferences.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* In-App Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>In-App Notifications</span>
          </h3>
          
          <div className="space-y-3 ml-7">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Enable in-app notifications</span>
              <input
                type="checkbox"
                checked={preferences.in_app_enabled}
                onChange={(e) => updatePreference('in_app_enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {preferences.in_app_sound ? (
                  <Volume2 className="w-4 h-4 text-gray-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-700">Notification sounds</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.in_app_sound}
                onChange={(e) => updatePreference('in_app_sound', e.target.checked)}
                disabled={!preferences.in_app_enabled}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span>Email Notifications</span>
          </h3>
          
          <div className="space-y-3 ml-7">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Enable email notifications</span>
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={(e) => updatePreference('email_enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">Email address</label>
              <input
                type="email"
                value={preferences.email_address || ''}
                onChange={(e) => updatePreference('email_address', e.target.value)}
                disabled={!preferences.email_enabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                placeholder="your@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">Email frequency</label>
              <select
                value={preferences.email_digest_frequency}
                onChange={(e) => updatePreference('email_digest_frequency', e.target.value)}
                disabled={!preferences.email_enabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
              >
                <option value="instant">Instant</option>
                <option value="hourly">Hourly digest</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Categories */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Notification Types</h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Session reschedule requests</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.reschedule_notifications}
                onChange={(e) => updatePreference('reschedule_notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">New messages</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.message_notifications}
                onChange={(e) => updatePreference('message_notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Session reminders</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.reminder_notifications}
                onChange={(e) => updatePreference('reminder_notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Admin notifications</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.admin_notifications}
                onChange={(e) => updatePreference('admin_notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Quiet Hours</h3>
          <p className="text-sm text-gray-600">
            Notifications will be silenced during these hours (still visible, but no sounds or emails)
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">Start time</label>
              <input
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">End time</label>
              <input
                type="time"
                value={preferences.quiet_hours_end}
                onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Timezone</h3>
          
          <div className="space-y-2">
            <select
              value={preferences.timezone}
              onChange={(e) => updatePreference('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Africa/Johannesburg">South Africa (SAST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (EST/EDT)</option>
              <option value="America/Chicago">Central Time (CST/CDT)</option>
              <option value="America/Denver">Mountain Time (MST/MDT)</option>
              <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Paris">Central Europe (CET/CEST)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Preferences saved!</span>
            </>
          )}
        </div>
        
        <div className="flex space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};