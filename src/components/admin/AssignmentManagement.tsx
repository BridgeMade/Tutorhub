import React, { useState, useEffect } from 'react';
import { assignmentService, AssignmentWithDetails, CreateAssignmentData } from '../../services/assignmentService';

interface AssignmentManagementProps {}

interface AvailableTutor {
  id: string;
  name: string;
  email: string;
  specializations: string[];
}

interface AvailableStudent {
  id: string;
  name: string;
  email: string;
  grade_level?: string;
}

interface Subject {
  id: string;
  name: string;
  description?: string;
}

export const AssignmentManagement: React.FC<AssignmentManagementProps> = () => {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [tutors, setTutors] = useState<AvailableTutor[]>([]);
  const [students, setStudents] = useState<AvailableStudent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Form state for creating new assignment
  const [newAssignment, setNewAssignment] = useState<CreateAssignmentData & { notes: string }>({
    tutor_id: '',
    student_id: '',
    subject_id: '',
    notes: '',
    start_date: new Date().toISOString().split('T')[0], // Today's date
    end_date: ''
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed' | 'cancelled'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 AssignmentManagement: Starting data load...');
      
      const [assignmentsRes, tutorsRes, studentsRes, subjectsRes] = await Promise.all([
        assignmentService.getAllAssignments(),
        assignmentService.getAvailableTutors(),
        assignmentService.getAvailableStudents(),
        assignmentService.getSubjects()
      ]);

      console.log('🔍 AssignmentManagement: Data loaded:', {
        assignments: assignmentsRes.data?.length || 0,
        tutors: tutorsRes.data?.length || 0,
        students: studentsRes.data?.length || 0,
        subjects: subjectsRes.data?.length || 0
      });
      
      console.log('🔍 AssignmentManagement: Students data:', studentsRes.data);
      console.log('🔍 AssignmentManagement: Students error:', studentsRes.error);
      console.log('🔍 AssignmentManagement: Tutors data:', tutorsRes.data);
      console.log('🔍 AssignmentManagement: Tutors error:', tutorsRes.error);

      if (assignmentsRes.data) setAssignments(assignmentsRes.data);
      if (tutorsRes.data) setTutors(tutorsRes.data);
      if (studentsRes.data) setStudents(studentsRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('❌ AssignmentManagement: Error loading assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.tutor_id || !newAssignment.student_id || !newAssignment.subject_id) {
      alert('Please select tutor, student, and subject');
      return;
    }

    setCreateLoading(true);
    try {
      const result = await assignmentService.createAssignment({
        tutor_id: newAssignment.tutor_id,
        student_id: newAssignment.student_id,
        subject_id: newAssignment.subject_id,
        notes: newAssignment.notes || undefined,
        start_date: newAssignment.start_date || undefined,
        end_date: newAssignment.end_date || undefined
      });

      if (result.data) {
        alert('Assignment created successfully!');
        setShowCreateModal(false);
        setNewAssignment({
          tutor_id: '',
          student_id: '',
          subject_id: '',
          notes: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: ''
        });
        loadData(); // Refresh the list
      } else {
        console.error('Assignment creation failed:', result.error);
        const errorMessage = result.error?.message || 'Unknown error';
        alert(`Failed to create assignment: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('An error occurred while creating the assignment.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (assignmentId: string, newStatus: AssignmentWithDetails['status']) => {
    try {
      const result = await assignmentService.updateAssignment(assignmentId, { status: newStatus });
      if (result.data) {
        setAssignments(assignments.map(a => 
          a.id === assignmentId ? { ...a, status: newStatus } : a
        ));
      } else {
        alert('Failed to update assignment status');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const result = await assignmentService.deleteAssignment(assignmentId);
      if (!result.error) {
        setAssignments(assignments.filter(a => a.id !== assignmentId));
        alert('Assignment deleted successfully');
      } else {
        alert('Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const getStatusColor = (status: AssignmentWithDetails['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (statusFilter !== 'all' && assignment.status !== statusFilter) return false;
    if (subjectFilter !== 'all' && assignment.subject_id !== subjectFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading assignments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Assignment Management</h2>
          <p className="text-gray-600 mt-1">Assign students to tutors for specific subjects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Assignment
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
      </div>

      {/* Assignments Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.map(assignment => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{assignment.tutor_name}</div>
                      <div className="text-sm text-gray-500">{assignment.tutor_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{assignment.student_name}</div>
                      <div className="text-sm text-gray-500">{assignment.student_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.subject_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(assignment.assigned_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <select
                        value={assignment.status}
                        onChange={(e) => handleStatusChange(assignment.id, e.target.value as any)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No assignments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Assignment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutor</label>
                <select
                  value={newAssignment.tutor_id}
                  onChange={(e) => setNewAssignment({ ...newAssignment, tutor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a tutor</option>
                  {tutors.map(tutor => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.name} ({tutor.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={newAssignment.student_id}
                  onChange={(e) => setNewAssignment({ ...newAssignment, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email}) {student.grade_level && `- Grade ${student.grade_level}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={newAssignment.subject_id}
                  onChange={(e) => setNewAssignment({ ...newAssignment, subject_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newAssignment.start_date}
                  onChange={(e) => setNewAssignment({ ...newAssignment, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  value={newAssignment.end_date}
                  onChange={(e) => setNewAssignment({ ...newAssignment, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={newAssignment.notes}
                  onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add any notes about this assignment..."
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={createLoading || !newAssignment.tutor_id || !newAssignment.student_id || !newAssignment.subject_id}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {createLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Assignment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};