import React, { useState } from 'react';
import ParentDashboard from '../components/parent/ParentDashboard';
import StudentDashboardK7 from '../components/student/StudentDashboardK7';
import StudentDashboard812 from '../components/student/StudentDashboard812';
import TutorMobileDashboard from '../components/tutor/TutorMobileDashboard';

const DashboardDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'parent' | 'student-k7' | 'student-812' | 'tutor'>('parent');

  const DemoSelector = () => (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">TutorKai Dashboard Demos</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveDemo('parent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeDemo === 'parent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Parent Dashboard
          </button>
          <button
            onClick={() => setActiveDemo('student-k7')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeDemo === 'student-k7'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Student K-7
          </button>
          <button
            onClick={() => setActiveDemo('student-812')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeDemo === 'student-812'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Student 8-12
          </button>
          <button
            onClick={() => setActiveDemo('tutor')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeDemo === 'tutor'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutor Mobile
          </button>
        </div>
      </div>
    </div>
  );

  const renderActiveDemo = () => {
    switch (activeDemo) {
      case 'parent':
        return <ParentDashboard parentId="demo-parent" />;
      case 'student-k7':
        return (
          <StudentDashboardK7
            studentName="Emma"
            grade="3"
            streak={5}
            trophyCount={8}
          />
        );
      case 'student-812':
        return (
          <StudentDashboard812
            studentName="Alex"
            grade="10"
          />
        );
      case 'tutor':
        return (
          <TutorMobileDashboard
            tutorName="Dr. Williams"
            todayEarnings={175}
            weeklyEarnings={720}
          />
        );
      default:
        return <ParentDashboard parentId="demo-parent" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoSelector />
      <div className="demo-container">
        {renderActiveDemo()}
      </div>
      
      {/* Mobile Device Frame for Demo */}
      <style>{`
        .demo-container {
          max-width: 390px;
          margin: 20px auto;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
          border-radius: 20px;
          overflow: hidden;
          background: white;
        }
        
        @media (max-width: 768px) {
          .demo-container {
            max-width: 100%;
            margin: 0;
            border-radius: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardDemo;