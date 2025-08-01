import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Clock, Check, ChevronDown } from 'lucide-react';
import { notificationService, Notification } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import { sessionManagementService } from '../../services/sessionManagementService';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load notifications on mount and user change
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      subscribeToNotifications();
      loadNotificationCounts();
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const userNotifications = await notificationService.getUserNotifications(user.id, {
        limit: 20,
        unreadOnly: false
      });
      setNotifications(userNotifications);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCounts = async () => {
    if (!user?.id) return;
    
    try {
      const counts = await notificationService.getNotificationCounts(user.id);
      setUnreadCount(counts.unread);
    } catch (error) {
      console.error('❌ Error loading notification counts:', error);
    }
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return;

    const subscription = notificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        showToastNotification(newNotification);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  };

  const showToastNotification = (notification: Notification) => {
    // Create toast notification element
    const toast = document.createElement('div');
    toast.className = `
      fixed top-4 right-4 z-50 p-4 bg-white border border-gray-200 rounded-lg shadow-lg
      max-w-sm transform transition-all duration-300 ease-in-out
    `;
    
    toast.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          ${getNotificationIcon(notification.notification_type, notification.priority)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">${notification.title}</p>
          <p class="text-sm text-gray-500 mt-1">${notification.message}</p>
        </div>
        <button class="flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const result = await notificationService.markAsRead(notificationId, user.id);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const result = await notificationService.markAllAsRead(user.id);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const handleNotificationAction = async (notification: Notification, actionId: string) => {
    const action = notification.action_buttons?.find(btn => btn.id === actionId);
    if (!action) return;

    try {
      switch (action.action) {
        case 'approve_reschedule_request':
          if (action.data?.requestId) {
            const result = await sessionManagementService.respondToRescheduleRequest(
              action.data.requestId,
              'approved',
              'Request approved via notification'
            );
            if (result.success) {
              await markAsRead(notification.id);
              await loadNotifications(); // Refresh to show updated status
            }
          }
          break;

        case 'decline_reschedule_request':
          if (action.data?.requestId) {
            const result = await sessionManagementService.respondToRescheduleRequest(
              action.data.requestId,
              'declined',
              'Request declined via notification'
            );
            if (result.success) {
              await markAsRead(notification.id);
              await loadNotifications(); // Refresh to show updated status
            }
          }
          break;

        case 'accept_counter_proposal':
          if (action.data?.proposalId) {
            const result = await sessionManagementService.respondToCounterProposal(
              action.data.proposalId,
              'accepted',
              'Counter proposal accepted via notification'
            );
            if (result.success) {
              await markAsRead(notification.id);
              await loadNotifications(); // Refresh to show updated status
            }
          }
          break;

        case 'decline_counter_proposal':
          if (action.data?.proposalId) {
            const result = await sessionManagementService.respondToCounterProposal(
              action.data.proposalId,
              'declined',
              'Counter proposal declined via notification'
            );
            if (result.success) {
              await markAsRead(notification.id);
              await loadNotifications(); // Refresh to show updated status
            }
          }
          break;

        default:
          console.log('🔔 Unhandled notification action:', action.action);
      }
    } catch (error) {
      console.error('❌ Error handling notification action:', error);
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const baseClasses = "w-5 h-5";
    
    switch (type) {
      case 'reschedule_request':
      case 'counter_proposal':
        return <Clock className={`${baseClasses} text-blue-500`} />;
      case 'reschedule_approved':
      case 'counter_proposal_response':
        return <CheckCircle className={`${baseClasses} text-green-500`} />;
      case 'reschedule_declined':
        return <X className={`${baseClasses} text-red-500`} />;
      case 'admin_escalation':
        return <AlertCircle className={`${baseClasses} text-orange-500`} />;
      default:
        return <Bell className={`${baseClasses} text-gray-500`} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.notification_type, notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </p>

                        {/* Action Buttons */}
                        {notification.action_buttons && notification.action_buttons.length > 0 && !notification.is_read && (
                          <div className="flex space-x-2 mt-3">
                            {notification.action_buttons.map((button) => (
                              <button
                                key={button.id}
                                onClick={() => handleNotificationAction(notification, button.id)}
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                                  button.style === 'primary'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : button.style === 'danger'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {button.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to full notifications page
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};