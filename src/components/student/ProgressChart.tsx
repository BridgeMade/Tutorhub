import React, { useState, useEffect } from 'react';
import { lessonService, type LessonWithDetails } from '../../services/lessonService';

interface ProgressChartProps {
  studentId: string;
}

interface ProgressData {
  week: string;
  sessionsCompleted: number;
  hoursStudied: number;
  averageScore: number;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ studentId }) => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealProgressData();
  }, [timeRange, studentId]);

  const loadRealProgressData = async () => {
    try {
      const lessons = await lessonService.getUserLessons(studentId, 'student');
      const completedLessons = lessons.filter((lesson: LessonWithDetails) => lesson.status === 'completed');
      
      const weeks = timeRange === 'week' ? 1 : timeRange === 'month' ? 4 : 12;
      const data: ProgressData[] = [];
      
      for (let i = weeks; i >= 1; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const weekLessons = completedLessons.filter((lesson: LessonWithDetails) => {
          const lessonDate = new Date(lesson.scheduled_at);
          return lessonDate >= weekStart && lessonDate < weekEnd;
        });
        
        const sessionsCompleted = weekLessons.length;
        const hoursStudied = weekLessons.reduce((sum: number, lesson: LessonWithDetails) => sum + (lesson.duration_minutes / 60), 0);
        const averageScore = 75; // Default score since we don't have ratings in the lesson model yet
        
        data.push({
          week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sessionsCompleted,
          hoursStudied: Math.round(hoursStudied * 10) / 10,
          averageScore
        });
      }
      
      setProgressData(data);
    } catch (error) {
      console.error('Error loading progress data:', error);
      setProgressData([]);
    } finally {
      setLoading(false);
    }
  };

  const maxSessions = Math.max(...progressData.map(d => d.sessionsCompleted));
  const maxHours = Math.max(...progressData.map(d => d.hoursStudied));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Progress</h2>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Learning Progress</h2>
        <div className="flex space-x-2">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range === 'week' ? '1W' : range === 'month' ? '1M' : '3M'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {progressData.reduce((sum, d) => sum + d.sessionsCompleted, 0)}
            </p>
            <p className="text-sm text-gray-500">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {progressData.reduce((sum, d) => sum + d.hoursStudied, 0)}h
            </p>
            <p className="text-sm text-gray-500">Study Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(progressData.reduce((sum, d) => sum + d.averageScore, 0) / progressData.length)}%
            </p>
            <p className="text-sm text-gray-500">Avg Score</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Sessions per Week</span>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-500">Sessions</span>
            </div>
          </div>
          <div className="flex items-end space-x-2 h-16">
            {progressData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{
                    height: `${(data.sessionsCompleted / maxSessions) * 100}%`,
                    minHeight: '4px'
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-1">{data.week}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Study Hours per Week</span>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-500">Hours</span>
            </div>
          </div>
          <div className="flex items-end space-x-2 h-16">
            {progressData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-500 rounded-t"
                  style={{
                    height: `${(data.hoursStudied / maxHours) * 100}%`,
                    minHeight: '4px'
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-1">{data.hoursStudied}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Improvement this {timeRange}</span>
            </p>
            <p className="text-xs text-gray-500">
              Based on completed sessions
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-600">
              {progressData.length > 1 && progressData[progressData.length - 1].sessionsCompleted > 0 ? '↑ Active learning' : 'Start your journey!'}
            </p>
            <p className="text-xs text-gray-500">
              {progressData.length > 0 && progressData.reduce((sum, d) => sum + d.sessionsCompleted, 0) > 0 ? 'Keep it up!' : 'Book your first session'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};