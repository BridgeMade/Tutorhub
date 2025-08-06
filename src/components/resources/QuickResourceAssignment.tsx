import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Clock, Target, BookMarked, PenTool, RotateCcw } from 'lucide-react';
import { resourceRecommendationService } from '../../services/resourceRecommendationService';
import { sessionResourceService } from '../../services/sessionResourceService';
import { supabase } from '../../lib/supabase';

interface QuickResourceAssignmentProps {
  sessionId: string;
  sessionDetails: {
    subject_name: string;
    student_id: string;
    scheduled_at: string;
  };
  tutorId: string;
  onAssignmentComplete?: () => void;
}

interface QuickResource {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_time_minutes: number;
  category: string;
  subject: string;
  grade_level: string;
}

export const QuickResourceAssignment: React.FC<QuickResourceAssignmentProps> = ({
  sessionId,
  sessionDetails,
  tutorId,
  onAssignmentComplete
}) => {
  const [suggestions, setSuggestions] = useState<QuickResource[]>([]);
  const [searchResults, setSearchResults] = useState<QuickResource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<'preparation' | 'reference' | 'homework' | 'follow_up'>('preparation');

  useEffect(() => {
    loadSuggestions();
  }, [sessionId]);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchResources();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      // Get personalized recommendations
      const recommendations = await resourceRecommendationService.getPersonalizedRecommendations(
        sessionDetails.student_id,
        {
          maxRecommendations: 6,
          minRating: 3.0,
          excludeDownloaded: false
        }
      );

      const quickResources = recommendations.map(rec => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        difficulty_level: rec.difficulty_level,
        estimated_time_minutes: rec.estimated_time_minutes,
        category: rec.category.name,
        subject: rec.subject.name,
        grade_level: rec.grade_level.grade_name
      }));

      setSuggestions(quickResources);
    } catch (error) {
      console.error('Error loading resource suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          id,
          title,
          description,
          difficulty_level,
          estimated_time_minutes,
          category:resource_categories(name),
          subject:subjects(name),
          grade_level:grade_levels(grade_name)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(8);

      if (error) {
        console.error('Error searching resources:', error);
        return;
      }

      const searchQuickResources = (data || []).map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        difficulty_level: resource.difficulty_level,
        estimated_time_minutes: resource.estimated_time_minutes || 0,
        category: resource.category?.name || 'Unknown',
        subject: resource.subject?.name || 'Unknown',
        grade_level: resource.grade_level?.grade_name || 'Unknown'
      }));

      setSearchResults(searchQuickResources);
    } catch (error) {
      console.error('Error searching resources:', error);
    }
  };

  const handleAssignResource = async (resourceId: string, isRequired: boolean = false) => {
    const newAssigning = new Set(assigning);
    newAssigning.add(resourceId);
    setAssigning(newAssigning);

    try {
      const sessionDate = new Date(sessionDetails.scheduled_at);
      const now = new Date();
      const effectiveType = sessionDate > now ? selectedType : 'follow_up';

      const result = await sessionResourceService.assignResourceToSession(
        sessionId,
        resourceId,
        tutorId,
        effectiveType,
        isRequired,
        `Quick assignment for ${sessionDetails.subject_name} session`
      );

      if (result.success) {
        // Remove from suggestions/search results
        setSuggestions(prev => prev.filter(r => r.id !== resourceId));
        setSearchResults(prev => prev.filter(r => r.id !== resourceId));
        onAssignmentComplete?.();
      } else {
        alert(result.error || 'Failed to assign resource');
      }
    } catch (error) {
      console.error('Error assigning resource:', error);
      alert('Failed to assign resource');
    } finally {
      const newAssigning = new Set(assigning);
      newAssigning.delete(resourceId);
      setAssigning(newAssigning);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preparation': return <Target className="h-4 w-4" />;
      case 'reference': return <BookMarked className="h-4 w-4" />;
      case 'homework': return <PenTool className="h-4 w-4" />;
      case 'follow_up': return <RotateCcw className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
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

  const displayResources = searchTerm.trim() ? searchResults : suggestions;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Quick Resource Assignment</h3>
        <div className="flex items-center space-x-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="preparation">Preparation</option>
            <option value="reference">Reference</option>
            <option value="homework">Homework</option>
            <option value="follow_up">Follow-up</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search resources to assign..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
      </div>

      {/* Assignment Type Info */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-md p-2">
        {getTypeIcon(selectedType)}
        <span>
          Assigning as <strong>{selectedType}</strong> resources for {sessionDetails.subject_name} session
        </span>
      </div>

      {/* Resource List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
        </div>
      ) : displayResources.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <BookOpen className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm">
            {searchTerm.trim() ? 'No resources found for your search' : 'No suggestions available'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {displayResources.map((resource) => (
            <div key={resource.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900">{resource.title}</h4>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${getDifficultyColor(resource.difficulty_level)}`}>
                    {resource.difficulty_level}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1 line-clamp-2">{resource.description}</p>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span>{resource.subject}</span>
                  <span>•</span>
                  <span>{resource.grade_level}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{resource.estimated_time_minutes}m</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-3">
                <button
                  onClick={() => handleAssignResource(resource.id, false)}
                  disabled={assigning.has(resource.id)}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  {assigning.has(resource.id) ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  <span>Assign</span>
                </button>
                
                <button
                  onClick={() => handleAssignResource(resource.id, true)}
                  disabled={assigning.has(resource.id)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs border border-orange-600 text-orange-600 rounded hover:bg-orange-50 disabled:opacity-50"
                  title="Assign as required"
                >
                  <span>Req</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        💡 Resources assigned here will be available to the student immediately
      </div>
    </div>
  );
};