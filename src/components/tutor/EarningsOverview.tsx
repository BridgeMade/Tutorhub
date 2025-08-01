import React, { useState, useEffect } from 'react';
import { TutoringSession } from '../../types';
import { lessonService, type LessonWithDetails } from '../../services/lessonService';
import { paymentService } from '../../services/paymentService';
import { formatZAR, formatSADate } from '../../utils/saFormatting';

interface EarningsOverviewProps {
  tutorId: string;
  sessions: TutoringSession[];
  hourlyRate: number;
}

interface EarningsData {
  period: string;
  earnings: number;
  sessions: number;
  hours: number;
}

interface PaymentInfo {
  id: string;
  date: Date;
  amount: number;
  status: 'pending' | 'paid' | 'processing';
  sessions: number;
  period: string;
}

export const EarningsOverview: React.FC<EarningsOverviewProps> = ({
  tutorId,
  sessions,
  hourlyRate
}) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    thisMonth: 0,
    lastMonth: 0
  });

  useEffect(() => {
    loadRealEarningsData();
    loadRealPaymentHistory();
  }, [timeRange, tutorId, hourlyRate]);

  const loadRealEarningsData = async () => {
    try {
      const lessons = await lessonService.getUserLessons(tutorId, 'tutor');
      const completedLessons = lessons.filter((lesson: LessonWithDetails) => lesson.status === 'completed');
      
      const periods = timeRange === 'week' ? 4 : timeRange === 'month' ? 6 : timeRange === 'quarter' ? 4 : 12;
      const data: EarningsData[] = [];

      for (let i = periods - 1; i >= 0; i--) {
        const periodStart = new Date();
        const periodEnd = new Date();
        
        if (timeRange === 'week') {
          periodStart.setDate(periodStart.getDate() - ((i + 1) * 7));
          periodEnd.setDate(periodEnd.getDate() - (i * 7));
        } else if (timeRange === 'month') {
          periodStart.setMonth(periodStart.getMonth() - (i + 1));
          periodEnd.setMonth(periodEnd.getMonth() - i);
        } else if (timeRange === 'quarter') {
          periodStart.setMonth(periodStart.getMonth() - ((i + 1) * 3));
          periodEnd.setMonth(periodEnd.getMonth() - (i * 3));
        } else {
          periodStart.setFullYear(periodStart.getFullYear() - (i + 1));
          periodEnd.setFullYear(periodEnd.getFullYear() - i);
        }

        const periodLessons = completedLessons.filter((lesson: LessonWithDetails) => {
          const lessonDate = new Date(lesson.scheduled_at);
          return lessonDate >= periodStart && lessonDate < periodEnd;
        });

        const sessionCount = periodLessons.length;
        const hoursWorked = periodLessons.reduce((sum: number, lesson: LessonWithDetails) => sum + (lesson.duration_minutes / 60), 0);
        const earnings = periodLessons.reduce((sum: number, lesson: LessonWithDetails) => sum + (hourlyRate * (lesson.duration_minutes / 60)), 0);

        const displayDate = new Date();
        if (timeRange === 'week') {
          displayDate.setDate(displayDate.getDate() - (i * 7));
        } else if (timeRange === 'month') {
          displayDate.setMonth(displayDate.getMonth() - i);
        } else if (timeRange === 'quarter') {
          displayDate.setMonth(displayDate.getMonth() - (i * 3));
        } else {
          displayDate.setFullYear(displayDate.getFullYear() - i);
        }

        data.push({
          period: timeRange === 'week' 
            ? `Week of ${displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : timeRange === 'month'
            ? displayDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            : timeRange === 'quarter'
            ? `Q${Math.floor(displayDate.getMonth() / 3) + 1} ${displayDate.getFullYear()}`
            : displayDate.getFullYear().toString(),
          earnings: Math.round(earnings),
          sessions: sessionCount,
          hours: Math.round(hoursWorked * 10) / 10
        });
      }

      setEarningsData(data);
      calculateTotalStats(data);
    } catch (error) {
      console.error('Error loading earnings data:', error);
      setEarningsData([]);
    }
  };

  const loadRealPaymentHistory = async () => {
    try {
      const allPayments = await paymentService.getAllPayments();
      const tutorPayments = allPayments.filter(payment => 
        payment.payment_type === 'tutor_payout' && 
        payment.user_id === tutorId
      );

      const paymentHistory: PaymentInfo[] = tutorPayments.map(payment => ({
        id: payment.id,
        date: new Date(payment.payment_date),
        amount: payment.amount,
        status: payment.status as PaymentInfo['status'],
        sessions: 0, // This would need to be calculated based on the period
        period: formatSADate(payment.payment_date).split(' ').slice(1).join(' ')
      }));

      paymentHistory.sort((a, b) => b.date.getTime() - a.date.getTime());
      setPayments(paymentHistory.slice(0, 5)); // Show last 5 payments
    } catch (error) {
      console.error('Error loading payment history:', error);
      setPayments([]);
    }
  };

  const calculateTotalStats = (data: EarningsData[] = earningsData) => {
    const total = data.reduce((sum, item) => sum + item.earnings, 0);
    const pending = payments
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0);

    setTotalStats({
      totalEarnings: total,
      pendingPayments: pending,
      thisMonth: data[data.length - 1]?.earnings || 0,
      lastMonth: data[data.length - 2]?.earnings || 0
    });
  };

  const getStatusColor = (status: PaymentInfo['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const maxEarnings = Math.max(...earningsData.map(d => d.earnings));
  const growthRate = totalStats.lastMonth > 0 
    ? Math.round(((totalStats.thisMonth - totalStats.lastMonth) / totalStats.lastMonth) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Earnings Overview</h2>
        <p className="text-gray-600 mt-1">Track your income and payment history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
              <p className="text-2xl font-bold text-gray-900">{formatZAR(totalStats.totalEarnings)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-2xl font-bold text-gray-900">{formatZAR(totalStats.pendingPayments)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">This Month</h3>
              <p className="text-2xl font-bold text-gray-900">{formatZAR(totalStats.thisMonth)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${growthRate >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <svg className={`w-6 h-6 ${growthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={growthRate >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Growth</h3>
              <p className={`text-2xl font-bold ${growthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {growthRate >= 0 ? '+' : ''}{growthRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Earnings Trend</h3>
            <div className="flex space-x-2">
              {(['week', 'month', 'quarter', 'year'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {earningsData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{data.period}</span>
                    <span className="text-gray-600">{formatZAR(data.earnings)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(data.earnings / maxEarnings) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{data.sessions} sessions</span>
                    <span>{data.hours.toFixed(1)} hours</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {payments.map(payment => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{payment.period}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {payment.sessions} sessions • {formatSADate(payment.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatZAR(payment.amount)}</p>
                  {payment.status === 'pending' && (
                    <button className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                      Request Payment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Hourly Rate</span>
              <span className="font-medium text-gray-900">{formatZAR(hourlyRate)}/hour</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Next Payment</span>
              <span className="font-medium text-gray-900">End of month</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Earnings Tips</h3>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Maintain consistent session quality to earn higher ratings</li>
              <li>• Consider offering package deals for regular students</li>
              <li>• Update your hourly rate based on demand and experience</li>
              <li>• Payments are processed automatically at the end of each month</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};