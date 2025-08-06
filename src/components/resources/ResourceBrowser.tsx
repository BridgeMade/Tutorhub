import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Star, Clock, BookOpen, FileText, Play, Settings, Library } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fileUploadService } from '../../services/fileUploadService';
import { ResourceRecommendations } from './ResourceRecommendations';

interface Resource {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: {
    name: string;
    icon: string;
    color: string;
  };
  subject: {
    name: string;
  };
  grade_level: {
    grade_name: string;
    grade_number: number;
  };
  topic?: {
    topic_name: string;
  };
  difficulty_level: string;
  rating_average: number;
  download_count: number;
  estimated_time_minutes: number;
  keywords: string[];
  tags: string[];
  created_at: string;
  uploaded_by: string;
  uploader_profile: {
    full_name: string;
    role: string;
  };
}

interface Grade {
  id: string;
  grade_number: number;
  grade_name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ResourceBrowserProps {
  userGrade?: number;
  userSubjects?: string[];
  currentUserId: string;
}

export const ResourceBrowser: React.FC<ResourceBrowserProps> = ({
  userGrade,
  userSubjects,
  currentUserId
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<number[]>(userGrade ? [userGrade] : []);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(userSubjects || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadResources();
  }, [selectedGrades, selectedSubjects, selectedCategories, selectedDifficulty, sortBy]);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm]);

  const loadInitialData = async () => {
    try {
      // Load grades, subjects, and categories
      const [gradesData, subjectsData, categoriesData] = await Promise.all([
        supabase.from('grade_levels').select('*').order('grade_number'),
        supabase.from('subjects').select('*').order('name'),
        supabase.from('resource_categories').select('*').eq('is_active', true).order('sort_order')
      ]);

      if (gradesData.data) setGrades(gradesData.data);
      if (subjectsData.data) setSubjects(subjectsData.data);
      if (categoriesData.data) setCategories(categoriesData.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadResources = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading resources with filters:', {
        grades: selectedGrades,
        subjects: selectedSubjects,
        categories: selectedCategories,
        difficulty: selectedDifficulty
      });

      let query = supabase
        .from('resources')
        .select(`
          *,
          category:resource_categories(name, icon, color),
          subject:subjects(name),
          grade_level:grade_levels(grade_name, grade_number),
          topic:subject_topics(topic_name),
          uploader_profile:profiles!resources_uploaded_by_fkey(full_name, role)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public');

      // Apply filters
      if (selectedGrades.length > 0) {
        const gradeIds = grades
          .filter(g => selectedGrades.includes(g.grade_number))
          .map(g => g.id);
        query = query.in('grade_level_id', gradeIds);
      }

      if (selectedSubjects.length > 0) {
        query = query.in('subject_id', selectedSubjects);
      }

      if (selectedCategories.length > 0) {
        const categoryIds = categories
          .filter(c => selectedCategories.includes(c.name))
          .map(c => c.id);
        query = query.in('category_id', categoryIds);
      }

      if (selectedDifficulty) {
        query = query.eq('difficulty_level', selectedDifficulty);
      }

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('download_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating_average', { ascending: false });
          break;
        case 'title':
          query = query.order('title');
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('❌ Error loading resources:', error);
        return;
      }

      console.log('✅ Loaded resources:', data?.length || 0);
      setResources(data || []);
    } catch (error) {
      console.error('❌ Error in loadResources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    if (!searchTerm.trim()) {
      setFilteredResources(resources);
      return;
    }

    const filtered = resources.filter(resource => {
      const searchLower = searchTerm.toLowerCase();
      return (
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description?.toLowerCase().includes(searchLower) ||
        resource.keywords.some(keyword => keyword.toLowerCase().includes(searchLower)) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        resource.subject.name.toLowerCase().includes(searchLower) ||
        resource.topic?.topic_name.toLowerCase().includes(searchLower)
      );
    });

    setFilteredResources(filtered);
  };

  const handleDownload = async (resource: Resource) => {
    setDownloading(prev => ({ ...prev, [resource.id]: true }));

    try {
      const result = await fileUploadService.downloadResource(
        resource.id,
        currentUserId
      );

      if (result.success && result.url) {
        // Open download in new tab
        window.open(result.url, '_blank');
        
        // Update local download count
        setResources(prev =>
          prev.map(r =>
            r.id === resource.id
              ? { ...r, download_count: r.download_count + 1 }
              : r
          )
        );
        setFilteredResources(prev =>
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

  const handlePreview = (resource: Resource) => {
    // Log view access
    supabase
      .from('resource_access_logs')
      .insert({
        resource_id: resource.id,
        user_id: currentUserId,
        access_type: 'view'
      });

    // Update view count
    supabase.rpc('update_resource_access_stats', {
      p_resource_id: resource.id,
      p_access_type: 'view'
    });

    // Open preview (this could be enhanced with a modal viewer)
    alert('Preview functionality coming soon! Click download to access the file.');
  };

  const getIconForCategory = (categoryName: string, iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'FileText': <FileText className="w-4 h-4" />,
      'BookOpen': <BookOpen className="w-4 h-4" />,
      'FileCheck': <FileText className="w-4 h-4" />,
      'Upload': <FileText className="w-4 h-4" />,
      'Folder': <FileText className="w-4 h-4" />,
      'FileX': <FileText className="w-4 h-4" />,
      'Bookmark': <BookOpen className="w-4 h-4" />,
      'Play': <Play className="w-4 h-4" />,
      'Settings': <Settings className="w-4 h-4" />,
      'Library': <Library className="w-4 h-4" />
    };
    return iconMap[iconName] || <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const displayResources = filteredResources;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Learning Resources</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center space-x-1"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search resources by title, description, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Grade Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade Levels</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {grades.map(grade => (
                  <label key={grade.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedGrades.includes(grade.grade_number)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGrades(prev => [...prev, grade.grade_number]);
                        } else {
                          setSelectedGrades(prev => prev.filter(g => g !== grade.grade_number));
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{grade.grade_name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {subjects.map(subject => (
                  <label key={subject.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubjects(prev => [...prev, subject.id]);
                        } else {
                          setSelectedSubjects(prev => prev.filter(s => s !== subject.id));
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{subject.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource Types</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories(prev => [...prev, category.name]);
                        } else {
                          setSelectedCategories(prev => prev.filter(c => c !== category.name));
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{category.name.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty and Sort */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Downloaded</option>
                  <option value="rating">Highest Rated</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSelectedGrades(userGrade ? [userGrade] : []);
                setSelectedSubjects(userSubjects || []);
                setSelectedCategories([]);
                setSelectedDifficulty('');
                setSearchTerm('');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
        Showing {displayResources.length} of {resources.length} resources
      </div>

      {/* Resources Grid/List */}
      <div className="p-6">
        {/* Recommendations Section */}
        {!searchTerm && selectedGrades.length === 0 && selectedSubjects.length === 0 && selectedCategories.length === 0 && (
          <div className="mb-8">
            <ResourceRecommendations
              userId={currentUserId}
              context="browse"
              maxRecommendations={8}
              showTitle={true}
              className="mb-6"
            />
            <hr className="border-gray-200 mb-6" />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : displayResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          <div>
            {/* Section Title for Regular Resources */}
            {!searchTerm && selectedGrades.length === 0 && selectedSubjects.length === 0 && selectedCategories.length === 0 && (
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Resources</h3>
            )}
            
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
            {displayResources.map(resource => (
              <div
                key={resource.id}
                className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex items-center space-x-4' : ''
                }`}
              >
                {/* Resource Icon and Category */}
                <div className={`flex items-center ${viewMode === 'list' ? 'flex-shrink-0' : 'mb-3'}`}>
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: resource.category.color + '20' }}
                  >
                    {getIconForCategory(resource.category.name, resource.category.icon)}
                  </div>
                  {viewMode === 'grid' && (
                    <div className="ml-2">
                      <span className="text-xs font-medium text-gray-600 capitalize">
                        {resource.category.name.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Resource Content */}
                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className={`${viewMode === 'list' ? 'flex items-start justify-between' : ''}`}>
                    <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {resource.title}
                      </h3>
                      
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {resource.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {resource.subject.name}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                          {resource.grade_level.grade_name}
                        </span>
                        <span className={`px-2 py-1 rounded ${getDifficultyColor(resource.difficulty_level)}`}>
                          {resource.difficulty_level}
                        </span>
                        {resource.topic && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            {resource.topic.topic_name}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Download className="w-3 h-3" />
                          <span>{resource.download_count}</span>
                        </div>
                        {resource.rating_average > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span>{resource.rating_average.toFixed(1)}</span>
                          </div>
                        )}
                        {resource.estimated_time_minutes > 0 && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{resource.estimated_time_minutes}m</span>
                          </div>
                        )}
                        <span>{formatFileSize(resource.file_size)}</span>
                      </div>

                      {/* Uploader Info */}
                      <div className="text-xs text-gray-500">
                        By {resource.uploader_profile.full_name} ({resource.uploader_profile.role})
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={`flex ${viewMode === 'list' ? 'flex-col space-y-2 ml-4' : 'justify-between items-center mt-3'}`}>
                      <button
                        onClick={() => handlePreview(resource)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                      
                      <button
                        onClick={() => handleDownload(resource)}
                        disabled={downloading[resource.id]}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                      >
                        {downloading[resource.id] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>{downloading[resource.id] ? 'Downloading...' : 'Download'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};