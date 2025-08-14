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
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-black">Progress</h1>
        <p className="text-gray-600 mt-1">Track your earnings and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-[20px] font-bold text-black">{formatZAR(earningsData.thisMonth)}</div>
          <div className="text-[14px] text-gray-600 font-semibold">This Month</div>
          <div className="text-[12px] text-gray-500 mt-1">
            <span className={monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-[20px] font-bold text-black">{formatZAR(earningsData.thisWeek)}</div>
          <div className="text-[14px] text-gray-600 font-semibold">This Week</div>
          <div className="text-[12px] text-gray-500 mt-1">Weekly avg: {formatZAR(earningsData.thisMonth / 4)}</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-[20px] font-bold text-black">{formatZAR(earningsData.totalEarnings)}</div>
          <div className="text-[14px] text-gray-600 font-semibold">Total</div>
          <div className="text-[12px] text-gray-500 mt-1">All time</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-[20px] font-bold text-black">{formatZAR(earningsData.projectedMonthly)}</div>
          <div className="text-[14px] text-gray-600 font-semibold">Projected</div>
          <div className="text-[12px] text-gray-500 mt-1">This month</div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold text-black">Earnings Trend</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${
                selectedPeriod === 'monthly' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${
                selectedPeriod === 'weekly' 
                  ? 'bg-white text-black shadow-sm' 
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
                <div className="w-16 text-[14px] font-medium text-gray-600">{'month' in item ? item.month : item.week}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                  <div 
                    className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="text-white text-[14px] font-medium">{formatZAR(item.earnings)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold text-black">Earnings Breakdown</h3>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-blue-600 hover:text-blue-700 text-[14px] font-medium"
          >
            {showBreakdown ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {showBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-[14px] font-semibold text-gray-700">By Subject</h4>
              <div className="space-y-2">
                {[
                  { subject: 'Mathematics', hours: 45, earnings: 1800 },
                  { subject: 'Physics', hours: 32, earnings: 1280 },
                  { subject: 'Chemistry', hours: 28, earnings: 1120 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-[14px] font-medium text-black">{item.subject}</p>
                      <p className="text-[12px] text-gray-500">{item.hours} hours</p>
                    </div>
                    <p className="text-[14px] font-semibold text-green-600">{formatZAR(item.earnings)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[14px] font-semibold text-gray-700">By Session Type</h4>
              <div className="space-y-2">
                {[
                  { type: 'Individual', sessions: 85, earnings: 3400 },
                  { type: 'Group (2-3)', sessions: 24, earnings: 1440 },
                  { type: 'Group (4+)', sessions: 12, earnings: 960 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-[14px] font-medium text-black">{item.type}</p>
                      <p className="text-[12px] text-gray-500">{item.sessions} sessions</p>
                    </div>
                    <p className="text-[14px] font-semibold text-green-600">{formatZAR(item.earnings)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[14px] font-semibold text-gray-700">Payment Status</h4>
              <div className="space-y-2">
                {[
                  { status: 'Paid', amount: 4850, color: 'green' },
                  { status: 'Pending', amount: 720, color: 'yellow' },
                  { status: 'Overdue', amount: 180, color: 'red' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${item.color === 'green' ? 'bg-green-400' : item.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                      <p className="text-[14px] font-medium text-black">{item.status}</p>
                    </div>
                    <p className="text-[14px] font-semibold text-black">{formatZAR(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-[18px] font-semibold text-black mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center justify-center bg-blue-600 text-white px-3 py-4 rounded-xl min-h-[80px] hover:bg-blue-700 transition-colors">
            <div className="w-6 h-6 flex items-center justify-center mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span className="text-[12px] font-medium">
              Payment
            </span>
          </button>
          
          <button className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="w-6 h-6 flex items-center justify-center mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-[12px] font-medium">
              Export
            </span>
          </button>
          
          <button className="flex flex-col items-center justify-center bg-white text-black px-3 py-4 rounded-xl min-h-[80px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="w-6 h-6 flex items-center justify-center mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-[12px] font-medium">
              Settings
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};