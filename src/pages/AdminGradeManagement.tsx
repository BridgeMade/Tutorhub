import React from 'react';
import StudentGradeManagement from '../components/admin/StudentGradeManagement';

const AdminGradeManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <StudentGradeManagement />
      </div>
    </div>
  );
};

export default AdminGradeManagement;