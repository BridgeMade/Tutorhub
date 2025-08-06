import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  X, 
  Clock, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Target,
  BookMarked,
  PenTool,
  RotateCcw,
  Lightbulb
} from 'lucide-react';
import { sessionResourceService, SessionResource, SessionResourceSuggestion } from '../../services/sessionResourceService';
import { fileUploadService } from '../../services/fileUploadService';

interface SessionResourceManagerProps {
  sessionId: string;
  sessionDetails: {
    subject_name: string;
    student_name: string;
    tutor_name: string;
    scheduled_at: string;
    duration_minutes: number;
  };
  currentUserId: string;
  userRole: 'student' | 'tutor' | 'admin';
  onResourceUpdate?: () => void;
}

interface ResourceToAssign {
  id: string;
  title: string;
  difficulty_level: string;
  estimated_time_minutes: number;
}

export const SessionResourceManager: React.FC<SessionResourceManagerProps> = ({
  sessionId,
  sessionDetails,
  currentUserId,
  userRole,
  onResourceUpdate
}) => {
  const [assignedResources, setAssignedResources] = useState<SessionResource[]>([]);
  const [suggestions, setSuggestions] = useState<SessionResourceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assigned' | 'suggestions'>('assigned');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSessionResources();
    if (userRole === 'tutor' || userRole === 'admin') {
      loadSuggestions();
    }
  }, [sessionId]);

  const loadSessionResources = async () => {
    try {
      const resources = await sessionResourceService.getSessionResources(sessionId);
      setAssignedResources(resources);
    } catch (error) {
      console.error('Error loading session resources:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const sessionDate = new Date(sessionDetails.scheduled_at);
      const now = new Date();
      const suggestionsType = sessionDate > now ? 'preparation' : 'follow_up';
      
      const suggestionList = await sessionResourceService.getSessionResourceSuggestions(
        sessionId,
        suggestionsType
      );
      setSuggestions(suggestionList);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignResource = async (
    resourceId: string,
    assignmentType: 'preparation' | 'reference' | 'homework' | 'follow_up',
    isRequired: boolean = false,
    notes?: string
  ) => {
    try {
      const result = await sessionResourceService.assignResourceToSession(
        sessionId,
        resourceId,
        currentUserId,
        assignmentType,
        isRequired,
        notes
      );

      if (result.success) {
        await loadSessionResources();
        onResourceUpdate?.();
        return true;
      } else {
        alert(result.error || 'Failed to assign resource');
        return false;
      }
    } catch (error) {
      console.error('Error assigning resource:', error);
      alert('Failed to assign resource');
      return false;
    }
  };

  const handleRemoveResource = async (sessionResourceId: string) => {
    if (!confirm('Are you sure you want to remove this resource from the session?')) {
      return;
    }

    try {
      const result = await sessionResourceService.removeResourceFromSession(
        sessionResourceId,
        currentUserId
      );

      if (result.success) {
        await loadSessionResources();
        onResourceUpdate?.();
      } else {
        alert(result.error || 'Failed to remove resource');
      }
    } catch (error) {
      console.error('Error removing resource:', error);
      alert('Failed to remove resource');
    }
  };

  const handleDownloadResource = async (resource: SessionResource) => {
    try {
      const result = await fileUploadService.downloadResource(
        resource.resource_id,
        currentUserId
      );

      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        alert(result.error || 'Failed to download resource');
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      alert('Failed to download resource');
    }
  };

  const handleBulkAssignSuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      alert('Please select resources to assign');
      return;
    }

    const sessionDate = new Date(sessionDetails.scheduled_at);
    const now = new Date();
    const defaultType = sessionDate > now ? 'preparation' : 'follow_up';

    const assignments = Array.from(selectedSuggestions).map(resourceId => ({
      resourceId,
      assignmentType: defaultType as 'preparation' | 'follow_up',
      isRequired: false,
      notes: `Suggested for session ${defaultType}`
    }));

    try {
      const result = await sessionResourceService.bulkAssignResources(
        sessionId,
        assignments,
        currentUserId
      );

      if (result.success) {
        alert(`Successfully assigned ${result.assignedCount} resources`);
        setSelectedSuggestions(new Set());
        await loadSessionResources();
        onResourceUpdate?.();
      } else {
        alert(result.error || 'Failed to assign resources');
      }
    } catch (error) {
      console.error('Error bulk assigning resources:', error);
      alert('Failed to assign resources');
    }
  };

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'preparation': return <Target className="h-4 w-4 text-blue-500" />;
      case 'reference': return <BookMarked className="h-4 w-4 text-green-500" />;
      case 'homework': return <PenTool className="h-4 w-4 text-orange-500" />;
      case 'follow_up': return <RotateCcw className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case 'preparation': return 'bg-blue-100 text-blue-800';
      case 'reference': return 'bg-green-100 text-green-800';
      case 'homework': return 'bg-orange-100 text-orange-800';
      case 'follow_up': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && userRole !== 'student') {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session Resources</h3>
            <p className="text-sm text-gray-600">
              Learning materials for {sessionDetails.subject_name} session
            </p>
          </div>
          
          {assignedResources.length > 0 && (
            <div className="text-sm text-gray-500">
              {assignedResources.length} resource{assignedResources.length !== 1 ? 's' : ''} assigned
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`py-3 px-1 border-b-2 font-medium text-sm mr-8 ${
              activeTab === 'assigned'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Assigned Resources ({assignedResources.length})</span>
            </div>
          </button>

          {(userRole === 'tutor' || userRole === 'admin') && (
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'suggestions'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Suggestions ({suggestions.length})</span>
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'assigned' ? (
          <div>
            {assignedResources.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No resources assigned</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {userRole === 'student' 
                    ? 'Your tutor will assign resources for this session'
                    : 'Assign resources to help your student prepare for this session'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedResources.map((sessionResource) => (
                  <div key={sessionResource.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {sessionResource.resource.title}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAssignmentTypeColor(sessionResource.assignment_type)}`}>
                            <span className="mr-1">{getAssignmentTypeIcon(sessionResource.assignment_type)}</span>
                            {sessionResource.assignment_type}
                          </span>
                          {sessionResource.is_required && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Required
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {sessionResource.resource.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded ${getDifficultyColor(sessionResource.resource.difficulty_level)}`}>
                            {sessionResource.resource.difficulty_level}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{sessionResource.resource.estimated_time_minutes}m</span>
                          </div>
                          <span>{formatFileSize(sessionResource.resource.file_size)}</span>
                          <span>{sessionResource.resource.subject.name}</span>
                          <span>{sessionResource.resource.grade_level.grade_name}</span>
                        </div>

                        {sessionResource.notes && (
                          <div className="bg-gray-50 rounded-md p-3 mb-3">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {sessionResource.notes}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Assigned on {new Date(sessionResource.assigned_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => handleDownloadResource(sessionResource)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </button>

                        {(userRole === 'tutor' || userRole === 'admin') && (
                          <button
                            onClick={() => handleRemoveResource(sessionResource.id)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Suggestions Header */}
            {suggestions.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Recommended resources for this session based on subject, grade level, and student profile
                </p>
                {selectedSuggestions.size > 0 && (
                  <button
                    onClick={handleBulkAssignSuggestions}
                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                  >
                    Assign Selected ({selectedSuggestions.size})
                  </button>
                )}
              </div>
            )}

            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No suggestions available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Suggestions will be generated based on the session details and student profile
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.resource_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedSuggestions.has(suggestion.resource_id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedSuggestions);
                              if (e.target.checked) {
                                newSelected.add(suggestion.resource_id);
                              } else {
                                newSelected.delete(suggestion.resource_id);
                              }
                              setSelectedSuggestions(newSelected);
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <h4 className="text-sm font-medium text-gray-900">
                            {suggestion.resource.title}
                          </h4>
                        </div>

                        <p className="text-xs text-gray-600 mb-2">
                          {suggestion.resource.description}
                        </p>

                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                          <span className={`px-2 py-0.5 rounded ${getDifficultyColor(suggestion.resource.difficulty_level)}`}>
                            {suggestion.resource.difficulty_level}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{suggestion.resource.estimated_time_minutes}m</span>
                          </div>
                        </div>

                        <div className="bg-orange-50 rounded-md p-2">
                          <p className="text-xs text-orange-700 font-medium">
                            💡 {suggestion.reason}
                          </p>
                        </div>
                      </div>

                      <div className="ml-3">
                        <div className="text-xs text-gray-500 text-right">
                          Score: {suggestion.relevance_score.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};