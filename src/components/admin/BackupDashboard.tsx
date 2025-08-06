import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { backupService, BackupJob, RestorePoint } from '../../services/backupService';
import { logger, LogCategory } from '../../lib/logger';

// ===========================================
// BACKUP MANAGEMENT DASHBOARD COMPONENT
// ===========================================

interface BackupStats {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalDataSize: number;
  averageBackupTime: number;
  successRate: number;
}

interface BackupNotification {
  id: string;
  notification_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

const BackupDashboard: React.FC = () => {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [backupStats, setBackupStats] = useState<BackupStats>({
    totalBackups: 0,
    successfulBackups: 0,
    failedBackups: 0,
    totalDataSize: 0,
    averageBackupTime: 0,
    successRate: 0
  });
  const [notifications, setNotifications] = useState<BackupNotification[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadBackupData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [jobsResult, restorePointsResult, statsResult, notificationsResult] = await Promise.all([
        backupService.getBackupJobs(50),
        backupService.getRestorePoints(30),
        getBackupStatistics(selectedTimeRange),
        getBackupNotifications()
      ]);

      setBackupJobs(jobsResult);
      setRestorePoints(restorePointsResult);
      setBackupStats(statsResult);
      setNotifications(notificationsResult);

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to load backup data', error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange]);

  const getBackupStatistics = async (timeRange: string): Promise<BackupStats> => {
    try {
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const { data, error } = await supabase
        .rpc('get_backup_statistics', { time_range_hours: hours });

      if (error) throw error;

      return data[0] || {
        totalBackups: 0,
        successfulBackups: 0,
        failedBackups: 0,
        totalDataSize: 0,
        averageBackupTime: 0,
        successRate: 0
      };
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get backup statistics', error as Error);
      return {
        totalBackups: 0,
        successfulBackups: 0,
        failedBackups: 0,
        totalDataSize: 0,
        averageBackupTime: 0,
        successRate: 0
      };
    }
  };

  const getBackupNotifications = async (): Promise<BackupNotification[]> => {
    try {
      const { data, error } = await supabase
        .from('backup_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get backup notifications', error as Error);
      return [];
    }
  };

  const handleCreateFullBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const result = await backupService.createFullBackup('Manual full backup from dashboard');
      
      if (result.success) {
        logger.info(LogCategory.SYSTEM, 'Manual backup initiated successfully', { backupId: result.backupId });
        loadBackupData(); // Refresh data
      } else {
        logger.error(LogCategory.SYSTEM, 'Failed to create backup', undefined, { error: result.error });
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error creating backup', error as Error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleCreateIncrementalBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const result = await backupService.createIncrementalBackup();
      
      if (result.success) {
        logger.info(LogCategory.SYSTEM, 'Incremental backup initiated successfully', { backupId: result.backupId });
        loadBackupData();
      } else {
        logger.error(LogCategory.SYSTEM, 'Failed to create incremental backup', undefined, { error: result.error });
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error creating incremental backup', error as Error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreFromBackup = async (restorePointId: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
      return;
    }

    try {
      const result = await backupService.restoreFromBackup(restorePointId, {
        restoreDatabase: true,
        restoreFiles: true,
        restoreConfiguration: true,
        confirmDestruction: true
      });

      if (result.success) {
        logger.info(LogCategory.SYSTEM, 'Restore operation completed successfully', { restorePointId });
        loadBackupData();
      } else {
        logger.error(LogCategory.SYSTEM, 'Restore operation failed', undefined, { 
          restorePointId,
          error: result.error 
        });
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error during restore operation', error as Error, { restorePointId });
    }
  };

  const handleVerifyBackup = async (restorePointId: string) => {
    try {
      const result = await backupService.verifyBackupIntegrity(restorePointId);
      
      if (result.valid) {
        logger.info(LogCategory.SYSTEM, 'Backup verification successful', { restorePointId });
      } else {
        logger.warn(LogCategory.SYSTEM, 'Backup verification failed', { 
          restorePointId,
          error: result.error 
        });
      }
      
      loadBackupData(); // Refresh to show updated verification status
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error verifying backup', error as Error, { restorePointId });
    }
  };

  const handleCleanupOldBackups = async () => {
    if (!confirm('Are you sure you want to clean up old backups based on retention policy?')) {
      return;
    }

    try {
      const result = await backupService.cleanupOldBackups();
      
      if (result.success) {
        logger.info(LogCategory.SYSTEM, 'Backup cleanup completed', { deletedCount: result.deletedCount });
        loadBackupData();
      } else {
        logger.error(LogCategory.SYSTEM, 'Backup cleanup failed', undefined, { error: result.error });
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error during backup cleanup', error as Error);
    }
  };

  const handleAcknowledgeNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('backup_notifications')
        .update({
          acknowledged: true,
          acknowledged_by: 'admin', // Replace with actual user ID
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      loadBackupData(); // Refresh notifications
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Error acknowledging notification', error as Error);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    loadBackupData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadBackupData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadBackupData, autoRefresh]);

  if (isLoading && backupJobs.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Backup & Recovery</h1>
          {notifications.filter(n => !n.acknowledged && n.severity === 'critical').length > 0 && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              {notifications.filter(n => !n.acknowledged && n.severity === 'critical').length} Critical Alert{notifications.filter(n => !n.acknowledged && n.severity === 'critical').length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          {/* Auto-refresh Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>

          {/* Manual Refresh */}
          <button
            onClick={loadBackupData}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Backup Actions */}
      <div className="bg-white rounded-lg shadow border p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateFullBackup}
            disabled={isCreatingBackup}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isCreatingBackup ? 'Creating...' : 'Create Full Backup'}
          </button>
          <button
            onClick={handleCreateIncrementalBackup}
            disabled={isCreatingBackup}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isCreatingBackup ? 'Creating...' : 'Create Incremental Backup'}
          </button>
          <button
            onClick={handleCleanupOldBackups}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Cleanup Old Backups
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Backups"
          value={backupStats.totalBackups}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="Success Rate"
          value={`${backupStats.successRate.toFixed(1)}%`}
          icon="✅"
          color={backupStats.successRate >= 95 ? "green" : backupStats.successRate >= 80 ? "yellow" : "red"}
        />
        <StatCard
          title="Failed Backups"
          value={backupStats.failedBackups}
          icon="❌"
          color={backupStats.failedBackups === 0 ? "green" : "red"}
        />
        <StatCard
          title="Data Backed Up"
          value={formatBytes(backupStats.totalDataSize)}
          icon="💾"
          color="purple"
        />
        <StatCard
          title="Avg Backup Time"
          value={`${Math.round(backupStats.averageBackupTime)}s`}
          icon="⏱️"
          color="orange"
        />
        <StatCard
          title="Active Alerts"
          value={notifications.filter(n => !n.acknowledged).length}
          icon="🔔"
          color={notifications.filter(n => !n.acknowledged).length === 0 ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Backup Jobs */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Backup Jobs</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {backupJobs.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No backup jobs found
              </div>
            ) : (
              <div className="divide-y">
                {backupJobs.map(job => (
                  <BackupJobRow key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Restore Points */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Available Restore Points</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {restorePoints.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No restore points available
              </div>
            ) : (
              <div className="divide-y">
                {restorePoints.map(point => (
                  <RestorePointRow
                    key={point.id}
                    restorePoint={point}
                    onRestore={() => handleRestoreFromBackup(point.id)}
                    onVerify={() => handleVerifyBackup(point.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Backup Notifications</h2>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <div className="divide-y">
              {notifications.map(notification => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onAcknowledge={() => handleAcknowledgeNotification(notification.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================================
// COMPONENT HELPERS
// ===========================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

interface BackupJobRowProps {
  job: BackupJob;
}

const BackupJobRow: React.FC<BackupJobRowProps> = ({ job }) => {
  const statusColors = {
    pending: 'text-blue-600 bg-blue-100',
    running: 'text-yellow-600 bg-yellow-100',
    completed: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100'
  };

  const typeLabels = {
    full: 'Full Backup',
    incremental: 'Incremental',
    differential: 'Differential'
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
              {job.status.toUpperCase()}
            </span>
            <span className="font-medium text-gray-900">
              {typeLabels[job.type]}
            </span>
            {job.size && (
              <span className="text-sm text-gray-600">
                ({formatBytes(job.size)})
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Started: {new Date(job.startTime).toLocaleString()}
            {job.endTime && (
              <span> • Duration: {Math.round((new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 1000)}s</span>
            )}
          </div>
          {job.errorMessage && (
            <div className="mt-1 text-sm text-red-600">
              Error: {job.errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface RestorePointRowProps {
  restorePoint: RestorePoint;
  onRestore: () => void;
  onVerify: () => void;
}

const RestorePointRow: React.FC<RestorePointRowProps> = ({ restorePoint, onRestore, onVerify }) => {
  const typeColors = {
    automatic: 'text-blue-600 bg-blue-100',
    manual: 'text-green-600 bg-green-100'
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[restorePoint.type]}`}>
              {restorePoint.type.toUpperCase()}
            </span>
            <span className="font-medium text-gray-900">
              {restorePoint.description}
            </span>
            {restorePoint.verified && (
              <span className="text-green-600 text-sm">✓ Verified</span>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Created: {new Date(restorePoint.timestamp).toLocaleString()} • 
            Size: {formatBytes(restorePoint.dataSize + restorePoint.fileSize)}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onVerify}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            Verify
          </button>
          <button
            onClick={onRestore}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
};

interface NotificationRowProps {
  notification: BackupNotification;
  onAcknowledge: () => void;
}

const NotificationRow: React.FC<NotificationRowProps> = ({ notification, onAcknowledge }) => {
  const severityColors = {
    info: 'text-blue-600 bg-blue-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100'
  };

  return (
    <div className={`p-4 hover:bg-gray-50 ${notification.acknowledged ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[notification.severity]}`}>
              {notification.severity.toUpperCase()}
            </span>
            <span className="font-medium text-gray-900">
              {notification.title}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {notification.message}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {new Date(notification.created_at).toLocaleString()}
          </div>
        </div>
        {!notification.acknowledged && (
          <button
            onClick={onAcknowledge}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default BackupDashboard;