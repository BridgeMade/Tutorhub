import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { getRateLimitStats } from '../../middleware/rateLimiting';

// ===========================================
// SECURITY DASHBOARD COMPONENT
// ===========================================

export interface SecurityMetrics {
  totalSecurityEvents: number;
  activeThreats: number;
  blockedIPs: number;
  failedLogins: number;
  rateLimitViolations: number;
  suspiciousActivity: number;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  ip_address: string;
  user_id?: string;
  user_agent?: string;
  resource_type?: string;
  action_attempted?: string;
  denial_reason?: string;
  metadata: Record<string, any>;
  created_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ThreatSummary {
  ip: string;
  eventCount: number;
  lastEvent: string;
  eventTypes: string[];
  riskScore: number;
  status: 'monitoring' | 'suspicious' | 'blocked';
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalSecurityEvents: 0,
    activeThreats: 0,
    blockedIPs: 0,
    failedLogins: 0,
    rateLimitViolations: 0,
    suspiciousActivity: 0
  });
  
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [threatSummary, setThreatSummary] = useState<ThreatSummary[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load security data
  const loadSecurityData = useCallback(async () => {
    try {
      setIsLoading(true);

      const timeRanges = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30
      };

      const hours = timeRanges[selectedTimeRange];
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      // Load security events
      const { data: events, error: eventsError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      // Load rate limit stats
      const rateLimitStats = await getRateLimitStats();

      // Calculate metrics
      const eventsByType = (events || []).reduce((acc: Record<string, number>, event: any) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const newMetrics: SecurityMetrics = {
        totalSecurityEvents: events?.length || 0,
        activeThreats: rateLimitStats.suspiciousIPs.length + rateLimitStats.blockedIPs.length,
        blockedIPs: rateLimitStats.blockedIPs.length,
        failedLogins: eventsByType['auth_failure'] || 0,
        rateLimitViolations: Object.values(rateLimitStats.ruleCounts).reduce((sum, count) => sum + count, 0),
        suspiciousActivity: eventsByType['suspicious_activity'] || 0
      };

      setMetrics(newMetrics);
      setRecentEvents((events || []).map((event: any) => ({
        ...event,
        severity: calculateSeverity(event)
      })));

      // Generate threat summary
      const threatMap = new Map<string, ThreatSummary>();
      
      (events || []).forEach((event: any) => {
        if (!event.ip_address) return;
        
        const existing = threatMap.get(event.ip_address) || {
          ip: event.ip_address,
          eventCount: 0,
          lastEvent: event.created_at,
          eventTypes: [] as string[],
          riskScore: 0,
          status: 'monitoring' as const
        };

        existing.eventCount++;
        existing.lastEvent = event.created_at;
        if (!existing.eventTypes.includes(event.event_type)) {
          existing.eventTypes.push(event.event_type);
        }
        existing.riskScore = calculateRiskScore(existing);
        existing.status = getIPStatus(event.ip_address, rateLimitStats);

        threatMap.set(event.ip_address, existing);
      });

      const threats = Array.from(threatMap.values())
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 20);

      setThreatSummary(threats);

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange]);

  // Auto-refresh functionality
  useEffect(() => {
    loadSecurityData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadSecurityData, autoRefresh]);

  const handleBlockIP = async (ip: string) => {
    try {
      await supabase
        .from('blocked_ips')
        .insert({
          ip_address: ip,
          reason: 'Manually blocked via security dashboard',
          blocked_at: new Date().toISOString(),
          blocked_by: 'admin' // Replace with actual admin user ID
        });

      // Log the blocking action
      await supabase
        .from('security_audit_logs')
        .insert({
          event_type: 'ip_blocked',
          ip_address: ip,
          metadata: { source: 'admin_dashboard', manual: true },
          created_at: new Date().toISOString()
        });

      loadSecurityData(); // Refresh data
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      await supabase
        .from('blocked_ips')
        .delete()
        .eq('ip_address', ip);

      // Log the unblocking action
      await supabase
        .from('security_audit_logs')
        .insert({
          event_type: 'ip_unblocked',
          ip_address: ip,
          metadata: { source: 'admin_dashboard', manual: true },
          created_at: new Date().toISOString()
        });

      loadSecurityData(); // Refresh data
    } catch (error) {
      console.error('Error unblocking IP:', error);
    }
  };

  if (isLoading && recentEvents.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
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
        <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="1h">Last Hour</option>
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
            onClick={loadSecurityData}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Events"
          value={metrics.totalSecurityEvents}
          icon="🛡️"
          color="blue"
        />
        <MetricCard
          title="Active Threats"
          value={metrics.activeThreats}
          icon="⚠️"
          color="yellow"
        />
        <MetricCard
          title="Blocked IPs"
          value={metrics.blockedIPs}
          icon="🚫"
          color="red"
        />
        <MetricCard
          title="Failed Logins"
          value={metrics.failedLogins}
          icon="🔒"
          color="orange"
        />
        <MetricCard
          title="Rate Limit Violations"
          value={metrics.rateLimitViolations}
          icon="⏱️"
          color="purple"
        />
        <MetricCard
          title="Suspicious Activity"
          value={metrics.suspiciousActivity}
          icon="🔍"
          color="pink"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Events */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Security Events</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No security events in the selected time range
              </div>
            ) : (
              <div className="divide-y">
                {recentEvents.map(event => (
                  <SecurityEventRow key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Threat Summary */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Top Threats</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {threatSummary.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No threats detected
              </div>
            ) : (
              <div className="divide-y">
                {threatSummary.map(threat => (
                  <ThreatRow
                    key={threat.ip}
                    threat={threat}
                    onBlock={() => handleBlockIP(threat.ip)}
                    onUnblock={() => handleUnblockIP(threat.ip)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Alert Status */}
      <div className="bg-white rounded-lg shadow border p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusIndicator
            label="Rate Limiting"
            status="operational"
            description="All rate limiting rules are active"
          />
          <StatusIndicator
            label="Threat Detection"
            status="operational"
            description="Monitoring for suspicious activity"
          />
          <StatusIndicator
            label="IP Blocking"
            status="operational"
            description={`${metrics.blockedIPs} IPs currently blocked`}
          />
        </div>
      </div>
    </div>
  );
};

// ===========================================
// COMPONENT HELPERS
// ===========================================

interface MetricCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'yellow' | 'red' | 'orange' | 'purple' | 'pink';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

interface SecurityEventRowProps {
  event: SecurityEvent;
}

const SecurityEventRow: React.FC<SecurityEventRowProps> = ({ event }) => {
  const severityColors = {
    low: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100'
  };

  const eventTypeLabels: Record<string, string> = {
    'auth_failure': 'Authentication Failed',
    'permission_denied': 'Permission Denied',
    'suspicious_activity': 'Suspicious Activity',
    'rate_limit_violation': 'Rate Limit Exceeded',
    'ip_blocked': 'IP Blocked',
    'data_breach_attempt': 'Data Breach Attempt'
  };

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[event.severity]}`}>
              {event.severity.toUpperCase()}
            </span>
            <span className="font-medium text-gray-900">
              {eventTypeLabels[event.event_type] || event.event_type}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-600">
            IP: {event.ip_address} • {event.denial_reason || 'No reason provided'}
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(event.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

interface ThreatRowProps {
  threat: ThreatSummary;
  onBlock: () => void;
  onUnblock: () => void;
}

const ThreatRow: React.FC<ThreatRowProps> = ({ threat, onBlock, onUnblock }) => {
  const statusColors = {
    monitoring: 'text-blue-600 bg-blue-100',
    suspicious: 'text-yellow-600 bg-yellow-100',
    blocked: 'text-red-600 bg-red-100'
  };

  const riskLevel = threat.riskScore >= 80 ? 'High' : threat.riskScore >= 50 ? 'Medium' : 'Low';
  const riskColor = threat.riskScore >= 80 ? 'text-red-600' : threat.riskScore >= 50 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-medium text-gray-900">{threat.ip}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[threat.status]}`}>
              {threat.status.charAt(0).toUpperCase() + threat.status.slice(1)}
            </span>
            <span className={`text-sm font-medium ${riskColor}`}>
              {riskLevel} Risk ({threat.riskScore})
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {threat.eventCount} events • Types: {threat.eventTypes.join(', ')}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Last seen: {new Date(threat.lastEvent).toLocaleString()}
          </div>
        </div>
        <div className="flex space-x-2">
          {threat.status !== 'blocked' ? (
            <button
              onClick={onBlock}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              Block
            </button>
          ) : (
            <button
              onClick={onUnblock}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
            >
              Unblock
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatusIndicatorProps {
  label: string;
  status: 'operational' | 'warning' | 'error';
  description: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ label, status, description }) => {
  const statusColors = {
    operational: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  const statusIcons = {
    operational: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-2xl">{statusIcons[status]}</span>
      <div>
        <p className={`font-medium ${statusColors[status]}`}>{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

const calculateSeverity = (event: any): 'low' | 'medium' | 'high' | 'critical' => {
  const criticalEvents = ['data_breach_attempt', 'ip_blocked'];
  const highEvents = ['suspicious_activity', 'multiple_auth_failures'];
  const mediumEvents = ['auth_failure', 'permission_denied'];

  if (criticalEvents.includes(event.event_type)) return 'critical';
  if (highEvents.includes(event.event_type)) return 'high';
  if (mediumEvents.includes(event.event_type)) return 'medium';
  return 'low';
};

const calculateRiskScore = (threat: ThreatSummary): number => {
  let score = 0;
  
  // Base score from event count
  score += Math.min(threat.eventCount * 5, 50);
  
  // Event type multipliers
  const eventTypeScores: Record<string, number> = {
    'data_breach_attempt': 30,
    'suspicious_activity': 20,
    'auth_failure': 10,
    'rate_limit_violation': 5,
    'permission_denied': 8
  };
  
  threat.eventTypes.forEach(type => {
    score += eventTypeScores[type] || 2;
  });
  
  // Recent activity multiplier
  const hoursSinceLastEvent = (Date.now() - new Date(threat.lastEvent).getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastEvent < 1) score *= 1.5;
  else if (hoursSinceLastEvent < 6) score *= 1.2;
  
  return Math.min(Math.round(score), 100);
};

const getIPStatus = (ip: string, rateLimitStats: any): ThreatSummary['status'] => {
  if (rateLimitStats.blockedIPs.includes(ip)) return 'blocked';
  if (rateLimitStats.suspiciousIPs.includes(ip)) return 'suspicious';
  return 'monitoring';
};

export default SecurityDashboard;