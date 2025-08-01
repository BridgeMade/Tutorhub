import React, { useState, useEffect } from 'react';
import { formatZAR } from '../../../utils/saFormatting';

interface EarningsData {
  thisMonth: number;
  lastMonth: number;
  thisWeek: number;
  today: number;
  totalEarnings: number;
  projectedMonthly: number;
  monthlyData: { month: string; earnings: number }[];
  weeklyData: { week: string; earnings: number }[];
}

interface EarningsAnalyticsProps {
  tutorId: string;
  hourlyRate: number;
}

export const EarningsAnalytics: React.FC<EarningsAnalyticsProps> = ({ tutorId, hourlyRate }) => {
  const [earningsData, setEarningsData] = useState<EarningsData>({
    thisMonth: 2450,
    lastMonth: 3200,
    thisWeek: 680,
    today: 240,
    totalEarnings: 18500,
    projectedMonthly: 3100,
    monthlyData: [
      { month: 'Jan', earnings: 2800 },
      { month: 'Feb', earnings: 3200 },
      { month: 'Mar', earnings: 2900 },
      { month: 'Apr', earnings: 3400 },
      { month: 'May', earnings: 3100 },
      { month: 'Jun', earnings: 2450 },
    ],
    weeklyData: [
      { week: 'Week 1', earnings: 890 },
      { week: 'Week 2', earnings: 720 },
      { week: 'Week 3', earnings: 840 },
      { week: 'Week 4', earnings: 680 },
    ]
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const monthlyGrowth = calculateGrowth(earningsData.thisMonth, earningsData.lastMonth);

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${monthlyGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">This Month</h3>
          <p className="text-2xl font-bold text-gray-900">{formatZAR(earningsData.thisMonth)}</p>
          <p className="text-xs text-gray-500 mt-1">vs {formatZAR(earningsData.lastMonth)} last month</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">This Week</h3>
          <p className="text-2xl font-bold text-gray-900">{formatZAR(earningsData.thisWeek)}</p>
          <p className="text-xs text-gray-500 mt-1">Weekly average: {formatZAR(earningsData.thisMonth / 4)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Earnings</h3>
          <p className="text-2xl font-bold text-gray-900">{formatZAR(earningsData.totalEarnings)}</p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Projected Monthly</h3>
          <p className="text-2xl font-bold text-gray-900">{formatZAR(earningsData.projectedMonthly)}</p>
          <p className="text-xs text-gray-500 mt-1">Based on current rate</p>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Earnings Trend</h3>
            <p className="text-sm text-gray-600">Track your income over time</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedPeriod === 'monthly' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedPeriod === 'weekly' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="space-y-4">
          {(selectedPeriod === 'monthly' ? earningsData.monthlyData : earningsData.weeklyData).map((item, index) => {
            const maxEarnings = Math.max(...(selectedPeriod === 'monthly' ? earningsData.monthlyData : earningsData.weeklyData).map(d => d.earnings));
            const barWidth = (item.earnings / maxEarnings) * 100;
            
            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-600">{'month' in item ? item.month : item.week}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-pink-400 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="text-white text-sm font-medium">{formatZAR(item.earnings)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Earnings Breakdown</h3>
            <p className="text-sm text-gray-600">Detailed analysis of your income sources</p>
          </div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            {showBreakdown ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {showBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">By Subject</h4>
              <div className="space-y-3">
                {[
                  { subject: 'Mathematics', hours: 45, earnings: 1800 },
                  { subject: 'Physics', hours: 32, earnings: 1280 },
                  { subject: 'Chemistry', hours: 28, earnings: 1120 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.subject}</p>
                      <p className="text-xs text-gray-500">{item.hours} hours</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatZAR(item.earnings)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">By Session Type</h4>
              <div className="space-y-3">
                {[
                  { type: 'Individual', sessions: 85, earnings: 3400 },
                  { type: 'Group (2-3)', sessions: 24, earnings: 1440 },
                  { type: 'Group (4+)', sessions: 12, earnings: 960 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.type}</p>
                      <p className="text-xs text-gray-500">{item.sessions} sessions</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatZAR(item.earnings)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Payment Status</h4>
              <div className="space-y-3">
                {[
                  { status: 'Paid', amount: 4850, color: 'green' },
                  { status: 'Pending', amount: 720, color: 'yellow' },
                  { status: 'Overdue', amount: 180, color: 'red' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full bg-${item.color}-400`}></div>
                      <p className="font-medium text-gray-900">{item.status}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatZAR(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white p-4 rounded-xl font-semibold hover:from-green-500 hover:to-emerald-600 transition-all duration-200 text-left">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <div>
              <div className="font-semibold">Request Payment</div>
              <div className="text-sm text-green-100">Submit invoice</div>
            </div>
          </div>
        </button>

        <button className="bg-white text-gray-700 p-4 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-all duration-200 text-left">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <div className="font-semibold">Export Report</div>
              <div className="text-sm text-gray-500">Download earnings data</div>
            </div>
          </div>
        </button>

        <button className="bg-white text-gray-700 p-4 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-all duration-200 text-left">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <div className="font-semibold">Rate Settings</div>
              <div className="text-sm text-gray-500">Update hourly rates</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};