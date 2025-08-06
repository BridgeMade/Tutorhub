import React, { useState, useEffect } from 'react';
import { Star, Download, Clock, TrendingUp, BookOpen, Target, Lightbulb, RefreshCw } from 'lucide-react';
import { resourceRecommendationService, RecommendedResource, RecommendationFilters } from '../../services/resourceRecommendationService';
import { fileUploadService } from '../../services/fileUploadService';

interface ResourceRecommendationsProps {
  userId: string;
  className?: string;
  showTitle?: boolean;
  maxRecommendations?: number;
  context?: 'dashboard' | 'browse' | 'subject';
  subjectId?: string;
  topicId?: string;
}

export const ResourceRecommendations: React.FC<ResourceRecommendationsProps> = ({
  userId,
  className = '',
  showTitle = true,
  maxRecommendations = 6,
  context = 'dashboard',
  subjectId,
  topicId
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedResource[]>([]);
  const [trendingResources, setTrendingResources] = useState<RecommendedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'personal' | 'trending'>('personal');
  const [filters, setFilters] = useState<RecommendationFilters>({
    excludeDownloaded: true,
    maxRecommendations: maxRecommendations,
    minRating: 3.0
  });

  useEffect(() => {
    loadRecommendations();
  }, [userId, subjectId, topicId, filters]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      let personalRecommendations: RecommendedResource[] = [];
      
      if (context === 'subject' && subjectId) {
        // Get subject-specific recommendations
        personalRecommendations = await resourceRecommendationService.getSubjectRecommendations(
          userId,
          subjectId,
          topicId,
          maxRecommendations
        );
      } else {
        // Get personalized recommendations
        personalRecommendations = await resourceRecommendationService.getPersonalizedRecommendations(
          userId,
          filters
        );
      }

      // Get trending resources
      const trending = await resourceRecommendationService.getTrendingResources(6);

      setRecommendations(personalRecommendations);
      setTrendingResources(trending);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource: RecommendedResource) => {
    setDownloading(prev => ({ ...prev, [resource.id]: true }));

    try {
      const result = await fileUploadService.downloadResource(resource.id, userId);

      if (result.success && result.url) {
        window.open(result.url, '_blank');
        
        // Update local download count
        setRecommendations(prev =>
          prev.map(r =>
            r.id === resource.id
              ? { ...r, download_count: r.download_count + 1 }
              : r
          )
        );
      } else {
        alert(result.error || 'Failed to download resource');
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      alert('Failed to download resource');
    } finally {
      setDownloading(prev => ({ ...prev, [resource.id]: false }));
    }
  };

  const getDifficultyColor = (level: string): string => {
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

  const getRecommendationIcon = (reason: string) => {
    if (reason.includes('weak') || reason.includes('practice')) return <Target className="h-4 w-4 text-orange-500" />;
    if (reason.includes('trending') || reason.includes('popular')) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (reason.includes('grade') || reason.includes('level')) return <BookOpen className="h-4 w-4 text-blue-500" />;
    return <Lightbulb className="h-4 w-4 text-purple-500" />;
  };

  const displayRecommendations = activeTab === 'personal' ? recommendations : trendingResources;

  if (loading) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended for You</h3>
        )}
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {context === 'subject' ? 'Subject Resources' : 'Recommended for You'}
          </h3>
          <button
            onClick={loadRecommendations}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      {context !== 'subject' && (
        <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'personal'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Target className="h-4 w-4" />
              <span>For You</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'trending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </div>
          </button>
        </div>
      )}

      {/* Filter Options */}
      {context === 'dashboard' && activeTab === 'personal' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.excludeDownloaded}
                onChange={(e) => setFilters(prev => ({ ...prev, excludeDownloaded: e.target.checked }))}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span>Hide downloaded</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <span>Min rating:</span>
              <select
                value={filters.minRating || 0}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value={0}>Any</option>
                <option value={3}>3+ stars</option>
                <option value={4}>4+ stars</option>
                <option value={4.5}>4.5+ stars</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {displayRecommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm">
            {activeTab === 'personal' ? 'No personalized recommendations available' : 'No trending resources found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayRecommendations.map(resource => (
            <div key={resource.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                    {resource.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{resource.subject.name}</span>
                    <span>•</span>
                    <span>{resource.grade_level.grade_name}</span>
                  </div>
                </div>
                <div 
                  className="p-1 rounded"
                  style={{ backgroundColor: resource.category.color + '20' }}
                >
                  <BookOpen className="h-3 w-3" style={{ color: resource.category.color }} />
                </div>
              </div>

              {/* Recommendation Reason */}
              <div className="flex items-center space-x-2 mb-3 p-2 bg-orange-50 rounded-md">
                {getRecommendationIcon(resource.recommendation_reason)}
                <span className="text-xs text-orange-700 font-medium">
                  {resource.recommendation_reason}
                </span>
              </div>

              {/* Metadata */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded ${getDifficultyColor(resource.difficulty_level)}`}>
                    {resource.difficulty_level}
                  </span>
                  {resource.rating_average > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-gray-600">{resource.rating_average.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Download className="h-3 w-3" />
                    <span>{resource.download_count}</span>
                  </div>
                  {resource.estimated_time_minutes > 0 && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{resource.estimated_time_minutes}m</span>
                    </div>
                  )}
                  <span>{formatFileSize(resource.file_size)}</span>
                </div>
              </div>

              {/* Description */}
              {resource.description && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                  {resource.description}
                </p>
              )}

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {resource.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  by {resource.uploader.full_name}
                </div>
                <button
                  onClick={() => handleDownload(resource)}
                  disabled={downloading[resource.id]}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  {downloading[resource.id] ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  <span>{downloading[resource.id] ? 'Downloading...' : 'Download'}</span>
                </button>
              </div>

              {/* Recommendation Score (for debugging) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-400">
                  Score: {resource.recommendation_score.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {displayRecommendations.length > 0 && displayRecommendations.length >= maxRecommendations && (
        <div className="text-center mt-4">
          <button
            onClick={() => {
              setFilters(prev => ({ 
                ...prev, 
                maxRecommendations: (prev.maxRecommendations || maxRecommendations) + 6 
              }));
            }}
            className="px-4 py-2 text-sm text-orange-600 border border-orange-600 rounded-md hover:bg-orange-50"
          >
            Load More Recommendations
          </button>
        </div>
      )}
    </div>
  );
};