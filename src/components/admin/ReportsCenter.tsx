import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { lessonService } from '../../services/lessonService';
import { paymentService } from '../../services/paymentService';

interface Report {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'user' | 'performance' | 'compliance';
  lastGenerated: Date;
  format: 'pdf' | 'csv' | 'xlsx';
  status: 'ready' | 'generating' | 'error';
  size?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'user' | 'performance' | 'compliance';
  parameters: string[];
  estimatedTime: string;
}

export const ReportsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'scheduled'>('generate');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'financial' | 'user' | 'performance' | 'compliance'>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'user-activity',
      name: 'User Activity Report',
      description: 'Comprehensive overview of user engagement and activity patterns',
      category: 'user',
      parameters: ['Date Range', 'User Roles', 'Activity Types'],
      estimatedTime: '2-3 minutes'
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary',
      description: 'Revenue, payments, and financial performance metrics',
      category: 'financial',
      parameters: ['Date Range', 'Payment Status', 'Currency'],
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'session-analytics',
      name: 'Session Analytics',
      description: 'Detailed analysis of tutoring sessions and outcomes',
      category: 'performance',
      parameters: ['Date Range', 'Subjects', 'Session Status'],
      estimatedTime: '3-4 minutes'
    },
    {
      id: 'tutor-performance',
      name: 'Tutor Performance',
      description: 'Individual tutor metrics, ratings, and session statistics',
      category: 'performance',
      parameters: ['Date Range', 'Rating Threshold', 'Subject Areas'],
      estimatedTime: '2-3 minutes'
    },
    {
      id: 'compliance-audit',
      name: 'Compliance Audit',
      description: 'Platform compliance with educational and privacy regulations',
      category: 'compliance',
      parameters: ['Audit Type', 'Compliance Standards', 'Date Range'],
      estimatedTime: '5-10 minutes'
    },
    {
      id: 'revenue-analysis',
      name: 'Revenue Analysis',
      description: 'Deep dive into revenue streams and financial trends',
      category: 'financial',
      parameters: ['Date Range', 'Revenue Sources', 'Comparison Period'],
      estimatedTime: '3-5 minutes'
    }
  ];

  useEffect(() => {
    loadRealReports();
  }, []);

  const loadRealReports = async () => {
    try {
      // Generate reports based on real data
      const [usersResponse, lessons, payments] = await Promise.all([
        userService.getAllUsers(),
        lessonService.getUserLessons('', 'admin'),
        paymentService.getAllPayments()
      ]);

      const users = usersResponse.data || [];

      const realReports: Report[] = [
        {
          id: 'rpt-001',
          name: `User Activity Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          description: `Activity report for ${users.length} registered users`,
          category: 'user',
          lastGenerated: new Date(),
          format: 'pdf',
          status: 'ready',
          size: '1.2 MB'
        },
        {
          id: 'rpt-002',
          name: `Financial Summary - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          description: `Financial report covering ${payments.length} transactions`,
          category: 'financial',
          lastGenerated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          format: 'xlsx',
          status: 'ready',
          size: '1.8 MB'
        },
        {
          id: 'rpt-003',
          name: 'Session Analytics - Weekly',
          description: `Analysis of ${lessons.length} tutoring sessions`,
          category: 'performance',
          lastGenerated: new Date(),
          format: 'csv',
          status: 'ready',
          size: '980 KB'
        },
        {
          id: 'rpt-004',
          name: 'Platform Compliance Report',
          description: 'Platform compliance and data security audit',
          category: 'compliance',
          lastGenerated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          format: 'pdf',
          status: 'ready',
          size: '2.1 MB'
        }
      ];

      setReports(realReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(template => template.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-purple-100 text-purple-800';
      case 'compliance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateReport = (template: ReportTemplate) => {
    // Simulate report generation
    const newReport: Report = {
      id: `rpt-${Date.now()}`,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description,
      category: template.category,
      lastGenerated: new Date(),
      format: 'pdf',
      status: 'generating'
    };

    setReports(prev => [newReport, ...prev]);
    setShowGenerateModal(false);

    // Simulate completion after a delay
    setTimeout(() => {
      setReports(prev => prev.map(report => 
        report.id === newReport.id 
          ? { ...report, status: 'ready' as const, size: '2.1 MB' }
          : report
      ));
    }, 3000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Reports Center</h2>
        <p className="text-gray-600 mt-1">Generate, manage, and download platform reports</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'generate', label: 'Generate Reports', icon: '📊' },
              { id: 'history', label: 'Report History', icon: '📋' },
              { id: 'scheduled', label: 'Scheduled Reports', icon: '⏰' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Available Report Templates</h3>
                <div className="flex space-x-2">
                  {(['all', 'financial', 'user', 'performance', 'compliance'] as const).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getCategoryColor(template.category)}`}>
                          {template.category}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-xs text-gray-500">
                        <strong>Parameters:</strong> {template.parameters.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        <strong>Est. Time:</strong> {template.estimatedTime}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowGenerateModal(true);
                      }}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Generate Report
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Report History</h3>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  Clear Old Reports
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Generated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map(report => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{report.name}</div>
                            <div className="text-sm text-gray-500">{report.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(report.category)}`}>
                            {report.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(report.lastGenerated)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                            {report.status === 'generating' && (
                              <svg className="animate-spin -ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.size || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {report.status === 'ready' && (
                              <>
                                <button className="text-blue-600 hover:text-blue-900">
                                  Download
                                </button>
                                <button className="text-green-600 hover:text-green-900">
                                  View
                                </button>
                                <button className="text-gray-600 hover:text-gray-900">
                                  Share
                                </button>
                              </>
                            )}
                            <button className="text-red-600 hover:text-red-900">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Scheduled Reports</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Schedule New Report
                </button>
              </div>

              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Reports</h3>
                <p className="text-gray-600 mb-4">Set up automatic report generation to receive regular insights</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Create Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Generate Report</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Custom range</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Estimated time:</strong> {selectedTemplate.estimatedTime}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  You'll receive a notification when the report is ready for download.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => generateReport(selectedTemplate)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};