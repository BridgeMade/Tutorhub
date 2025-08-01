import React, { useState, useEffect } from 'react';
import { formatSADateTime, formatSATime } from '../../utils/saFormatting';

interface StudyGoal {
  id: string;
  title: string;
  subject: string;
  targetDate: string;
  progress: number;
  status: 'active' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
}

interface StudySession {
  id: string;
  subject: string;
  topic: string;
  plannedDuration: number;
  actualDuration?: number;
  date: string;
  status: 'planned' | 'completed' | 'missed';
  notes?: string;
}

interface StudyPlannerProps {
  studentId: string;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({ studentId }) => {
  const [activeView, setActiveView] = useState<'calendar' | 'goals' | 'sessions'>('calendar');
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadStudyData();
  }, [studentId]);

  const loadStudyData = async () => {
    // Mock data - in real app, would fetch from API
    const mockGoals: StudyGoal[] = [
      {
        id: '1',
        title: 'Master Quadratic Equations',
        subject: 'Mathematics',
        targetDate: '2024-02-15',
        progress: 75,
        status: 'active',
        priority: 'high'
      },
      {
        id: '2',
        title: 'Complete Chemistry Lab Report',
        subject: 'Science',
        targetDate: '2024-02-10',
        progress: 100,
        status: 'completed',
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Essay on Shakespeare',
        subject: 'English',
        targetDate: '2024-02-20',
        progress: 40,
        status: 'active',
        priority: 'high'
      }
    ];

    const mockSessions: StudySession[] = [
      {
        id: '1',
        subject: 'Mathematics',
        topic: 'Quadratic Equations',
        plannedDuration: 60,
        actualDuration: 55,
        date: new Date().toISOString(),
        status: 'completed',
        notes: 'Good progress on solving techniques'
      },
      {
        id: '2',
        subject: 'Science',
        topic: 'Chemical Reactions',
        plannedDuration: 45,
        date: new Date(Date.now() + 86400000).toISOString(),
        status: 'planned'
      }
    ];

    setGoals(mockGoals);
    setSessions(mockSessions);
  };

  const renderCalendarView = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calendarDays = [];
    for (let i = 0; i < startingDay; i++) {
      calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add Study Session
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`aspect-square p-2 border-r border-b border-gray-100 ${
                  day ? 'hover:bg-blue-50 cursor-pointer' : ''
                } ${day === today.getDate() ? 'bg-blue-100' : ''}`}
              >
                {day && (
                  <div className="h-full flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{day}</span>
                    <div className="flex-1 mt-1 space-y-1">
                      {sessions
                        .filter(session => new Date(session.date).getDate() === day)
                        .slice(0, 2)
                        .map(session => (
                          <div
                            key={session.id}
                            className={`text-xs p-1 rounded truncate ${
                              session.status === 'completed' ? 'bg-green-100 text-green-700' :
                              session.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}
                          >
                            {session.subject}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGoalsView = () => {
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Study Goals</h3>
          <button
            onClick={() => setShowGoalModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            New Goal
          </button>
        </div>

        {/* Active Goals */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Active Goals ({activeGoals.length})</h4>
          {activeGoals.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-600">No active goals yet</p>
              <p className="text-sm text-gray-500 mt-1">Set your first study goal to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map(goal => (
                <div key={goal.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">{goal.title}</h5>
                      <p className="text-sm text-gray-600">{goal.subject}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                      goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {goal.priority}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Due: {new Date(goal.targetDate).toLocaleDateString('en-ZA')}
                    </span>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-700">Edit</button>
                      <button className="text-green-600 hover:text-green-700">Complete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Completed Goals ({completedGoals.length})</h4>
            <div className="space-y-2">
              {completedGoals.map(goal => (
                <div key={goal.id} className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                    <div>
                      <h5 className="font-medium text-gray-900">{goal.title}</h5>
                      <p className="text-sm text-gray-600">{goal.subject}</p>
                    </div>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Completed</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSessionsView = () => {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const plannedSessions = sessions.filter(s => s.status === 'planned');
    const totalStudyTime = completedSessions.reduce((total, session) => total + (session.actualDuration || 0), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Study Sessions</h3>
          <div className="flex space-x-3">
            <div className="text-sm text-gray-600">
              Total study time: <span className="font-semibold">{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</span>
            </div>
          </div>
        </div>

        {/* Study Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{completedSessions.length}</div>
            <div className="text-sm text-gray-600">Sessions Completed</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{plannedSessions.length}</div>
            <div className="text-sm text-gray-600">Sessions Planned</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.floor(totalStudyTime / 60)}</div>
            <div className="text-sm text-gray-600">Hours Studied</div>
          </div>
        </div>

        {/* Session List */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Recent Sessions</h4>
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`w-3 h-3 rounded-full ${
                        session.status === 'completed' ? 'bg-green-500' :
                        session.status === 'planned' ? 'bg-blue-500' :
                        'bg-red-500'
                      }`}></span>
                      <div>
                        <h5 className="font-medium text-gray-900">{session.subject} - {session.topic}</h5>
                        <p className="text-sm text-gray-600">
                          {formatSADateTime(session.date)} • 
                          {session.actualDuration ? ` ${session.actualDuration} min` : ` ${session.plannedDuration} min planned`}
                        </p>
                      </div>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-gray-600 mt-2 ml-6">{session.notes}</p>
                    )}
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                    session.status === 'completed' ? 'bg-green-100 text-green-700' :
                    session.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Study Planner</h2>
            <p className="text-sm text-gray-600">Organize your learning journey</p>
          </div>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'calendar', label: 'Calendar', icon: '📅' },
              { id: 'goals', label: 'Goals', icon: '🎯' },
              { id: 'sessions', label: 'Sessions', icon: '📚' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === view.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{view.icon}</span>
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeView === 'calendar' && renderCalendarView()}
        {activeView === 'goals' && renderGoalsView()}
        {activeView === 'sessions' && renderSessionsView()}
      </div>

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Study Goal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Master Algebra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>English</option>
                    <option>History</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};