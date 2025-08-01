import React, { useState, useEffect } from 'react';
import { formatSADateTime } from '../../utils/saFormatting';

interface StudyResource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'audio' | 'link' | 'image';
  subject: string;
  description: string;
  uploadedBy: string;
  uploadedDate: string;
  fileSize?: string;
  downloadCount: number;
  rating: number;
  tags: string[];
  url: string;
  thumbnail?: string;
}

interface SessionRecording {
  id: string;
  sessionId: string;
  subject: string;
  tutor: string;
  date: string;
  duration: number;
  description: string;
  thumbnail: string;
  fileSize: string;
  topics: string[];
}

interface ResourceLibraryProps {
  studentId: string;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ studentId }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'recordings' | 'uploads'>('resources');
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent');

  useEffect(() => {
    loadLibraryData();
  }, [studentId]);

  const loadLibraryData = async () => {
    // Mock data - in real app, would fetch from API
    const mockResources: StudyResource[] = [
      {
        id: '1',
        title: 'Quadratic Equations Study Guide',
        type: 'document',
        subject: 'Mathematics',
        description: 'Comprehensive guide covering all aspects of quadratic equations with examples and practice problems.',
        uploadedBy: 'Dr. Sarah Johnson',
        uploadedDate: '2024-01-15',
        fileSize: '2.4 MB',
        downloadCount: 245,
        rating: 4.8,
        tags: ['algebra', 'equations', 'practice'],
        url: '/resources/quadratic-guide.pdf'
      },
      {
        id: '2',
        title: 'Chemical Reactions Overview',
        type: 'video',
        subject: 'Science',
        description: 'Visual explanation of different types of chemical reactions with real-world examples.',
        uploadedBy: 'Prof. Michael Chen',
        uploadedDate: '2024-01-20',
        fileSize: '156 MB',
        downloadCount: 189,
        rating: 4.6,
        tags: ['chemistry', 'reactions', 'visual'],
        url: '/resources/chemical-reactions.mp4',
        thumbnail: '/thumbnails/chemistry-vid.jpg'
      },
      {
        id: '3',
        title: 'Essay Writing Techniques',
        type: 'document',
        subject: 'English',
        description: 'Step-by-step guide to writing compelling essays with structure and style tips.',
        uploadedBy: 'Ms. Lisa Williams',
        uploadedDate: '2024-01-18',
        fileSize: '1.8 MB',
        downloadCount: 167,
        rating: 4.7,
        tags: ['writing', 'essays', 'structure'],
        url: '/resources/essay-guide.pdf'
      },
      {
        id: '4',
        title: 'Physics Formula Reference',
        type: 'image',
        subject: 'Science',
        description: 'Quick reference sheet with all essential physics formulas and constants.',
        uploadedBy: 'Dr. James Wilson',
        uploadedDate: '2024-01-12',
        fileSize: '890 KB',
        downloadCount: 312,
        rating: 4.9,
        tags: ['physics', 'formulas', 'reference'],
        url: '/resources/physics-formulas.png',
        thumbnail: '/thumbnails/physics-thumb.jpg'
      },
      {
        id: '5',
        title: 'Historical Timeline Interactive',
        type: 'link',
        subject: 'History',
        description: 'Interactive timeline of major historical events with detailed information.',
        uploadedBy: 'Dr. Emma Davis',
        uploadedDate: '2024-01-22',
        downloadCount: 98,
        rating: 4.5,
        tags: ['history', 'timeline', 'interactive'],
        url: 'https://timeline.tutorhub.com/history'
      }
    ];

    const mockRecordings: SessionRecording[] = [
      {
        id: '1',
        sessionId: 'sess_001',
        subject: 'Mathematics',
        tutor: 'Dr. Sarah Johnson',
        date: '2024-02-01',
        duration: 60,
        description: 'Introduction to quadratic equations and solving techniques',
        thumbnail: '/thumbnails/math-session.jpg',
        fileSize: '248 MB',
        topics: ['Quadratic Equations', 'Factoring', 'Completing the Square']
      },
      {
        id: '2',
        sessionId: 'sess_002',
        subject: 'Science',
        tutor: 'Prof. Michael Chen',
        date: '2024-01-28',
        duration: 45,
        description: 'Chemical bonding and molecular structures',
        thumbnail: '/thumbnails/science-session.jpg',
        fileSize: '187 MB',
        topics: ['Chemical Bonds', 'Molecular Geometry', 'Lewis Structures']
      },
      {
        id: '3',
        sessionId: 'sess_003',
        subject: 'English',
        tutor: 'Ms. Lisa Williams',
        date: '2024-01-25',
        duration: 50,
        description: 'Essay structure and argumentative writing techniques',
        thumbnail: '/thumbnails/english-session.jpg',
        fileSize: '201 MB',
        topics: ['Essay Structure', 'Thesis Statements', 'Supporting Arguments']
      }
    ];

    setResources(mockResources);
    setRecordings(mockRecordings);
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || resource.subject === selectedSubject;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    
    return matchesSearch && matchesSubject && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloadCount - a.downloadCount;
      case 'rating':
        return b.rating - a.rating;
      case 'recent':
      default:
        return new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime();
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return '📄';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'link':
        return '🔗';
      case 'image':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const renderResourceCard = (resource: StudyResource) => (
    <div key={resource.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {resource.thumbnail ? (
            <img 
              src={resource.thumbnail} 
              alt={resource.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
              {getTypeIcon(resource.type)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>By {resource.uploadedBy}</span>
                <span>{new Date(resource.uploadedDate).toLocaleDateString('en-ZA')}</span>
                {resource.fileSize && <span>{resource.fileSize}</span>}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium">{resource.rating}</span>
              </div>
              <span className="text-sm text-gray-500">({resource.downloadCount} downloads)</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {resource.subject}
              </span>
              {resource.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {tag}
                </span>
              ))}
              {resource.tags.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  +{resource.tags.length - 2} more
                </span>
              )}
            </div>
            
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              {resource.type === 'link' ? 'Open' : 'Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecordingCard = (recording: SessionRecording) => (
    <div key={recording.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 relative">
          <img 
            src={recording.thumbnail} 
            alt={`${recording.subject} session`}
            className="w-20 h-14 rounded-lg object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
            {recording.duration}min
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{recording.subject} Session</h3>
              <p className="text-sm text-gray-600 mt-1">with {recording.tutor}</p>
              <p className="text-sm text-gray-600 mt-1">{recording.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>{formatSADateTime(recording.date)}</span>
                <span>{recording.fileSize}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {recording.subject}
              </span>
              {recording.topics.slice(0, 2).map((topic, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {topic}
                </span>
              ))}
              {recording.topics.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  +{recording.topics.length - 2} more
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                Watch
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUploadArea = () => (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Upload Study Materials</h3>
            <p className="text-gray-600 mt-1">Share resources with your tutors and classmates</p>
          </div>
          <div className="flex justify-center space-x-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Choose Files
            </button>
            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Add Link
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Supported formats: PDF, DOC, PPT, MP4, MP3, JPG, PNG (Max 100MB)
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Uploads</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600">No uploads yet</p>
          <p className="text-sm text-gray-500 mt-1">Your uploaded files will appear here</p>
        </div>
      </div>
    </div>
  );

  const subjects = Array.from(new Set(resources.map(r => r.subject)));
  const types = Array.from(new Set(resources.map(r => r.type)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Library</h2>
          <p className="text-gray-600">Access study materials and session recordings</p>
        </div>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'resources', label: 'Resources', icon: '📚' },
            { id: 'recordings', label: 'Recordings', icon: '🎥' },
            { id: 'uploads', label: 'My Uploads', icon: '☁️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters and Search (for resources and recordings) */}
      {(activeTab === 'resources' || activeTab === 'recordings') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-3">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              {activeTab === 'resources' && (
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  {types.map(type => (
                    <option key={type} value={type} className="capitalize">{type}</option>
                  ))}
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'resources' && (
          <>
            {filteredResources.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">No resources found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredResources.map(renderResourceCard)
            )}
          </>
        )}

        {activeTab === 'recordings' && (
          <>
            {recordings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600">No session recordings available</p>
                <p className="text-sm text-gray-500 mt-1">Recordings from your sessions will appear here</p>
              </div>
            ) : (
              recordings.map(renderRecordingCard)
            )}
          </>
        )}

        {activeTab === 'uploads' && renderUploadArea()}
      </div>
    </div>
  );
};