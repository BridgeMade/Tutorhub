import React, { useState, useEffect } from 'react';
import { lessonService } from '../../services/lessonService';

interface SubjectProgressProps {
  subjects: string[];
}

interface SubjectStats {
  subject: string;
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  progress: number;
}

export const SubjectProgress: React.FC<SubjectProgressProps> = ({ subjects }) => {
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subjects.length > 0) {
      loadRealSubjectStats();
    } else {
      setLoading(false);
    }
  }, [subjects]);

  const loadRealSubjectStats = async () => {
    try {
      // For now, we'll create basic stats based on subjects
      // In a real implementation, this would fetch from lessons data
      const stats = subjects.map(subject => {
        // This is a simplified version - in reality you'd fetch actual lesson data
        // and calculate these stats from the database
        return {
          subject,
          totalSessions: 0, // Would be calculated from actual lessons
          completedSessions: 0, // Would be calculated from completed lessons
          averageRating: 0, // Would be calculated from lesson ratings
          progress: 0 // Would be calculated based on learning objectives
        };
      });
      
      setSubjectStats(stats);
    } catch (error) {
      console.error('Error loading subject stats:', error);
      setSubjectStats([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subject Progress</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subject Progress</h2>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-500">No subjects enrolled yet</p>
          <p className="text-sm text-gray-400 mt-1">Book a session to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Subject Progress</h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View Details
        </button>
      </div>
      
      <div className="space-y-4">
        {subjectStats.map((stat) => (
          <div key={stat.subject} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{stat.subject}</h3>
                <p className="text-sm text-gray-500">
                  {stat.completedSessions} of {stat.totalSessions} sessions completed
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{stat.averageRating}</span>
                </div>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{stat.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stat.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Completion Rate: {Math.round((stat.completedSessions / stat.totalSessions) * 100)}%</span>
              <span>Next: Continue learning</span>
            </div>
          </div>
        ))}
      </div>
      
      {subjectStats.length > 3 && (
        <div className="text-center pt-4">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Subjects
          </button>
        </div>
      )}
    </div>
  );
};