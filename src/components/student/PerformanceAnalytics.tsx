import React, { useState, useEffect } from 'react';
import { formatZAR } from '../../utils/saFormatting';

interface SubjectPerformance {
  subject: string;
  averageScore: number;
  improvement: number;
  sessionsCompleted: number;
  totalSessions: number;
  strengths: string[];
  areas_for_improvement: string[];
  lastSessionDate: string;
}

interface LearningStreak {
  current: number;
  longest: number;
  lastActiveDate: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedDate?: string;
  progress?: number;
  target?: number;
}

interface PerformanceAnalyticsProps {
  studentId: string;
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ studentId }) => {
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [learningStreak, setLearningStreak] = useState<LearningStreak>({ current: 0, longest: 0, lastActiveDate: '' });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    loadPerformanceData();
  }, [studentId, selectedTimeframe]);

  const loadPerformanceData = async () => {
    // Mock data - in real app, would fetch from API
    const mockSubjectPerformance: SubjectPerformance[] = [
      {
        subject: 'Mathematics',
        averageScore: 78,
        improvement: 12,
        sessionsCompleted: 15,
        totalSessions: 18,
        strengths: ['Algebra', 'Problem-solving'],
        areas_for_improvement: ['Geometry', 'Word problems'],
        lastSessionDate: '2024-02-05'
      },
      {
        subject: 'Science',
        averageScore: 85,
        improvement: 8,
        sessionsCompleted: 12,
        totalSessions: 14,
        strengths: ['Chemistry', 'Lab work'],
        areas_for_improvement: ['Physics concepts', 'Scientific writing'],
        lastSessionDate: '2024-02-03'
      },
      {
        subject: 'English',
        averageScore: 82,
        improvement: 15,
        sessionsCompleted: 10,
        totalSessions: 12,
        strengths: ['Grammar', 'Creative writing'],
        areas_for_improvement: ['Literary analysis', 'Essay structure'],
        lastSessionDate: '2024-02-01'
      }
    ];

    const mockAchievements: Achievement[] = [
      {
        id: '1',
        title: 'First Session',
        description: 'Complete your first tutoring session',
        icon: '🎯',
        unlockedDate: '2024-01-15'
      },
      {
        id: '2',
        title: 'Week Warrior',
        description: 'Study for 7 consecutive days',
        icon: '🔥',
        unlockedDate: '2024-01-22'
      },
      {
        id: '3',
        title: 'Math Master',
        description: 'Score 90% or higher in mathematics',
        icon: '🧮',
        progress: 78,
        target: 90
      },
      {
        id: '4',
        title: 'Consistency Champion',
        description: 'Complete 20 sessions',
        icon: '⭐',
        progress: 15,
        target: 20
      },
      {
        id: '5',
        title: 'Subject Specialist',
        description: 'Excel in all three subjects',
        icon: '🏆',
        progress: 2,
        target: 3
      }
    ];

    setSubjectPerformance(mockSubjectPerformance);
    setLearningStreak({
      current: 5,
      longest: 12,
      lastActiveDate: '2024-02-05'
    });
    setAchievements(mockAchievements);
  };

  const renderPerformanceChart = (performance: SubjectPerformance) => {
    const completionRate = (performance.sessionsCompleted / performance.totalSessions) * 100;
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">{performance.subject}</h3>
            <p className="text-sm text-gray-600">
              {performance.sessionsCompleted}/{performance.totalSessions} sessions completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{performance.averageScore}%</div>
            <div className={`text-sm font-medium ${
              performance.improvement > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {performance.improvement > 0 ? '+' : ''}{performance.improvement}% improvement
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Average Score</span>
              <span>{performance.averageScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${performance.averageScore}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Session Completion</span>
              <span>{Math.round(completionRate)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Strengths and Areas for Improvement */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
            <div className="flex flex-wrap gap-2">
              {performance.strengths.map((strength, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Areas for Improvement</h4>
            <div className="flex flex-wrap gap-2">
              {performance.areas_for_improvement.map((area, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverallStats = () => {
    const totalSessions = subjectPerformance.reduce((sum, perf) => sum + perf.sessionsCompleted, 0);
    const averageScore = Math.round(
      subjectPerformance.reduce((sum, perf) => sum + perf.averageScore, 0) / subjectPerformance.length
    );
    const averageImprovement = Math.round(
      subjectPerformance.reduce((sum, perf) => sum + perf.improvement, 0) / subjectPerformance.length
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Overall Average</p>
              <p className="text-xl font-bold text-gray-900">{averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Improvement</p>
              <p className="text-xl font-bold text-gray-900">+{averageImprovement}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Sessions</p>
              <p className="text-xl font-bold text-gray-900">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-xl font-bold text-gray-900">{learningStreak.current} days</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAchievements = () => {
    const unlockedAchievements = achievements.filter(a => a.unlockedDate);
    const lockedAchievements = achievements.filter(a => !a.unlockedDate);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
          <div className="text-sm text-gray-600">
            {unlockedAchievements.length} of {achievements.length} unlocked
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Unlocked ({unlockedAchievements.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlockedAchievements.map(achievement => (
              <div key={achievement.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{achievement.title}</h5>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Unlocked on {new Date(achievement.unlockedDate!).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">In Progress ({lockedAchievements.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedAchievements.map(achievement => (
              <div key={achievement.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl grayscale">{achievement.icon}</div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{achievement.title}</h5>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    {achievement.progress && achievement.target && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(achievement.progress! / achievement.target!) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
          <p className="text-gray-600">Track your learning progress and achievements</p>
        </div>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
            { id: 'quarter', label: 'Quarter' }
          ].map(timeframe => (
            <button
              key={timeframe.id}
              onClick={() => setSelectedTimeframe(timeframe.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Stats */}
      {renderOverallStats()}

      {/* Subject Performance Charts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Subject Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {subjectPerformance.map(performance => renderPerformanceChart(performance))}
        </div>
      </div>

      {/* Learning Streak */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Learning Streak 🔥</h3>
            <p className="text-orange-100">Keep up the great work!</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{learningStreak.current} days</div>
            <div className="text-sm text-orange-100">
              Best streak: {learningStreak.longest} days
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {renderAchievements()}
      </div>
    </div>
  );
};