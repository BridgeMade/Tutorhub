import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Edit3, Save, X, Users, GraduationCap } from 'lucide-react';

interface Student {
  id: string;
  email: string;
  full_name: string;
  grade_level: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface StudentGradeManagementProps {
  adminId?: string;
}

export const StudentGradeManagement: React.FC<StudentGradeManagementProps> = ({ adminId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'K' | '1-7' | '8-12'>('all');
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const gradeOptions = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, gradeFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by grade
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(student => {
        const grade = student.grade_level;
        switch (gradeFilter) {
          case 'K':
            return grade === 'K';
          case '1-7':
            const numeric = parseInt(grade);
            return !isNaN(numeric) && numeric >= 1 && numeric <= 7;
          case '8-12':
            const highGrade = parseInt(grade);
            return !isNaN(highGrade) && highGrade >= 8 && highGrade <= 12;
          default:
            return true;
        }
      });
    }

    setFilteredStudents(filtered);
  };

  const startEditing = (student: Student) => {
    setEditingStudent(student.id);
    setEditGrade(student.grade_level || 'K');
  };

  const cancelEditing = () => {
    setEditingStudent(null);
    setEditGrade('');
  };

  const saveGrade = async (studentId: string) => {
    if (!editGrade.trim()) {
      setMessage({ type: 'error', text: 'Please select a valid grade' });
      return;
    }

    try {
      setUpdating(true);
      console.log(`🔄 Updating student ${studentId} grade to ${editGrade}...`);

      // Try different approaches for the update
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          grade_level: editGrade,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        // Try alternative approach if primary fails
        const { error: altError } = await supabase
          .from('profiles')
          .upsert({ 
            id: studentId,
            grade_level: editGrade,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (altError) {
          throw new Error(`Database update failed: ${altError.message}`);
        }
        console.log('✅ Updated using upsert approach');
      } else {
        console.log('✅ Updated successfully:', data);
      }

      // Update local state
      setStudents(prev => 
        prev.map(student => 
          student.id === studentId 
            ? { ...student, grade_level: editGrade, updated_at: new Date().toISOString() }
            : student
        )
      );

      setEditingStudent(null);
      setEditGrade('');
      setMessage({ type: 'success', text: `Grade updated to ${editGrade} successfully!` });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error updating grade:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage({ type: 'error', text: `Failed to update grade: ${errorMessage}` });
    } finally {
      setUpdating(false);
    }
  };

  const getDashboardType = (grade: string) => {
    if (grade === 'K') return 'K-7 Dashboard';
    const numeric = parseInt(grade);
    if (isNaN(numeric)) return 'K-7 Dashboard';
    return numeric <= 7 ? 'K-7 Dashboard' : 'Grade 8-12 Dashboard';
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'K') return 'bg-purple-100 text-purple-800';
    const numeric = parseInt(grade);
    if (isNaN(numeric)) return 'bg-gray-100 text-gray-800';
    if (numeric <= 7) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const stats = {
    total: students.length,
    k7: students.filter(s => {
      const grade = s.grade_level;
      if (grade === 'K') return true;
      const numeric = parseInt(grade);
      return !isNaN(numeric) && numeric <= 7;
    }).length,
    grade812: students.filter(s => {
      const grade = s.grade_level;
      const numeric = parseInt(grade);
      return !isNaN(numeric) && numeric >= 8 && numeric <= 12;
    }).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6" />
          Student Grade Management
        </h2>
        <p className="text-gray-600 mt-1">Manage student grade levels and dashboard access</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">K-7 Students</p>
              <p className="text-2xl font-bold text-purple-900">{stats.k7}</p>
            </div>
            <div className="text-purple-600 text-2xl">🧮</div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Grade 8-12 Students</p>
              <p className="text-2xl font-bold text-green-900">{stats.grade812}</p>
            </div>
            <div className="text-green-600 text-2xl">🎓</div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Grades</option>
          <option value="K">Kindergarten</option>
          <option value="1-7">Grade 1-7</option>
          <option value="8-12">Grade 8-12</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dashboard Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.full_name || 'Unnamed Student'}
                      </div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingStudent === student.id ? (
                      <select
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        {gradeOptions.map(grade => (
                          <option key={grade} value={grade}>
                            {grade === 'K' ? 'Kindergarten' : `Grade ${grade}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(student.grade_level || 'K')}`}>
                        {student.grade_level === 'K' ? 'Kindergarten' : `Grade ${student.grade_level || 'K'}`}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getDashboardType(student.grade_level || 'K')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.updated_at ? new Date(student.updated_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingStudent === student.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveGrade(student.id)}
                          disabled={updating}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={updating}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(student)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Grade"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No students found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Dashboard Types</h3>
        <div className="space-y-1 text-sm text-blue-800">
          <div><strong>K-7 Dashboard:</strong> Simple, gamified interface with trophies and streaks for younger students</div>
          <div><strong>Grade 8-12 Dashboard:</strong> Advanced features with complex assignment tracking, material downloads, and mature UI</div>
        </div>
      </div>
    </div>
  );
};

export default StudentGradeManagement;