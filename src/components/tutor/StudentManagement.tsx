import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { lessonService } from '../../services/lessonService';
import { assignmentService } from '../../services/assignmentService';

interface StudentManagementProps {
  tutorId: string;
}

interface StudentInfo {
  id: string;
  name: string;
  grade: string;
  subjects: string[];
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  lastSession: Date;
  status: 'active' | 'inactive' | 'new';
  contactInfo: {
    email: string;
    parentName?: string;
    parentEmail?: string;
  };
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ tutorId }) => {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'new'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealStudents();
  }, [tutorId]);

  const loadRealStudents = async () => {
    setLoading(true);
    try {
      console.log('🔍 StudentManagement: Loading assigned students for tutor ID:', tutorId);
      console.log('🔍 StudentManagement: Tutor ID type:', typeof tutorId);
      
      // Get students assigned to this tutor
      const assignmentsResponse = await assignmentService.getTutorAssignments(tutorId);
      console.log('🔍 StudentManagement: Assignment service response:', assignmentsResponse);
      
      if (assignmentsResponse.error) {
        console.error('Error loading tutor assignments:', assignmentsResponse.error);
        setStudents([]);
        setLoading(false);
        return;
      }

      const assignments = assignmentsResponse.data || [];
      console.log('🔍 StudentManagement: Found assignments:', assignments.length);
      console.log('🔍 StudentManagement: Raw assignments data:', assignments.map(a => ({ 
        student_id: a.student_id, 
        student_name: a.student_name, 
        subject_name: a.subject_name 
      })));
      
      // Group assignments by student to avoid duplicates
      const studentMap = new Map<string, StudentInfo>();
      
      assignments.forEach(assignment => {
        const studentId = assignment.student_id;
        
        if (studentMap.has(studentId)) {
          // Add subject to existing student
          const existingStudent = studentMap.get(studentId)!;
          if (!existingStudent.subjects.includes(assignment.subject_name)) {
            existingStudent.subjects.push(assignment.subject_name);
          }
        } else {
          // Create new student entry
          studentMap.set(studentId, {
            id: assignment.student_id,
            name: assignment.student_name || 'Unknown Student',
            grade: 'Not specified',
            subjects: [assignment.subject_name],
            totalSessions: 0,
            completedSessions: 0,
            averageScore: 0,
            lastSession: new Date(),
            status: assignment.status === 'active' ? 'active' : 'inactive',
            contactInfo: {
              email: assignment.student_email,
              parentName: undefined,
              parentEmail: undefined
            }
          });
        }
      });

      const studentInfoList = Array.from(studentMap.values());
      console.log('🔍 StudentManagement: Unique students after grouping:', studentInfoList.length);
      console.log('🔍 StudentManagement: Final student list with IDs:', studentInfoList.map(s => ({ id: s.id, name: s.name })));
      
      // Additional check for duplicate IDs in the final array
      const studentIds = studentInfoList.map(s => s.id);
      const uniqueIds = new Set(studentIds);
      if (studentIds.length !== uniqueIds.size) {
        console.error('❌ DUPLICATE STUDENT IDs DETECTED in final array!');
        console.error('❌ Student IDs:', studentIds);
        console.error('❌ Unique IDs:', Array.from(uniqueIds));
      }
      
      setStudents(studentInfoList);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: StudentInfo['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastSession = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Student Management</h2>
        <p className="text-gray-600 mt-1">Track your students' progress and manage relationships</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search students by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          {(['all', 'active', 'new', 'inactive'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filterStatus === status
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredStudents.map(student => (
          <div
            key={student.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedStudent(student)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                    {student.status}
                  </span>
                  <span className="text-sm text-gray-500">Grade {student.grade}</span>
                </div>
                
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Subjects: {student.subjects?.join(', ') || 'None'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Sessions: {student.completedSessions}/{student.totalSessions}</span>
                  </div>
                  
                  {student.averageScore > 0 && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Avg Score: {student.averageScore}%</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Session</p>
                <p className="text-sm font-medium text-gray-900">{formatLastSession(student.lastSession)}</p>
                <div className="mt-2 flex space-x-2">
                  <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                    Message
                  </button>
                  <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h2>
                <p className="text-gray-600">Grade {selectedStudent.grade} Student</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Progress Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Sessions</span>
                    <span className="text-sm font-medium">{selectedStudent.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium">{selectedStudent.completedSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="text-sm font-medium">{selectedStudent.averageScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subjects</span>
                    <span className="text-sm font-medium">{selectedStudent.subjects?.join(', ') || 'None'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Email</span>
                    <p className="text-sm font-medium">{selectedStudent.contactInfo.email}</p>
                  </div>
                  {selectedStudent.contactInfo.parentName && (
                    <>
                      <div>
                        <span className="text-sm text-gray-600">Parent Name</span>
                        <p className="text-sm font-medium">{selectedStudent.contactInfo.parentName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Parent Email</span>
                        <p className="text-sm font-medium">{selectedStudent.contactInfo.parentEmail}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Send Message
              </button>
              <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                Schedule Session
              </button>
              <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                View History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};