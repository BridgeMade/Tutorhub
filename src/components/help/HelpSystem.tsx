import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// ===========================================
// HELP SYSTEM COMPONENTS
// ===========================================

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  userRole?: 'student' | 'tutor' | 'both';
  lastUpdated: string;
  views: number;
  helpful: number;
  notHelpful: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  userRole?: 'student' | 'tutor' | 'both';
  popular: boolean;
}

export interface ContextualTip {
  id: string;
  trigger: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  showOnce?: boolean;
  userRole?: 'student' | 'tutor' | 'both';
  page?: string;
}

// ===========================================
// HELP CENTER MODAL
// ===========================================

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'student' | 'tutor';
  initialQuery?: string;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({
  isOpen,
  onClose,
  userRole,
  initialQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'articles' | 'faq' | 'contact'>('articles');
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in production, fetch from API
  const mockArticles: HelpArticle[] = [
    {
      id: '1',
      title: 'How to Book Your First Session',
      content: `
        <h3>Getting Started with Session Booking</h3>
        <p>Booking your first tutoring session is easy! Follow these steps:</p>
        <ol>
          <li><strong>Browse Tutors:</strong> Use the "Find Tutors" section to browse available tutors for your subject.</li>
          <li><strong>Filter Results:</strong> Use filters to narrow down tutors by subject, price range, rating, and availability.</li>
          <li><strong>View Profiles:</strong> Click on a tutor's profile to see their qualifications, reviews, and available time slots.</li>
          <li><strong>Select Time:</strong> Choose your preferred date and time from the tutor's availability calendar.</li>
          <li><strong>Add Details:</strong> Provide any specific requirements or topics you'd like to focus on.</li>
          <li><strong>Confirm Booking:</strong> Review your booking details and confirm. Payment is processed securely.</li>
        </ol>
        <h4>Tips for Success:</h4>
        <ul>
          <li>Book sessions at least 24 hours in advance for better availability</li>
          <li>Be specific about your learning goals in the session notes</li>
          <li>Check your email for session confirmation and meeting links</li>
        </ul>
      `,
      category: 'Getting Started',
      tags: ['booking', 'first-time', 'sessions'],
      userRole: 'student',
      lastUpdated: '2024-01-15',
      views: 1250,
      helpful: 95,
      notHelpful: 5
    },
    {
      id: '2',
      title: 'Setting Up Your Tutor Profile',
      content: `
        <h3>Create an Attractive Tutor Profile</h3>
        <p>Your profile is the first thing students see. Make it compelling!</p>
        <h4>Essential Elements:</h4>
        <ul>
          <li><strong>Professional Photo:</strong> Upload a clear, friendly headshot</li>
          <li><strong>Compelling Bio:</strong> Highlight your experience, teaching style, and passion</li>
          <li><strong>Qualifications:</strong> Add your degrees, certifications, and achievements</li>
          <li><strong>Subjects:</strong> List all subjects you can teach with confidence levels</li>
          <li><strong>Availability:</strong> Keep your calendar updated with accurate availability</li>
        </ul>
        <h4>Writing Your Bio:</h4>
        <ol>
          <li>Start with your teaching experience and qualifications</li>
          <li>Describe your teaching style and approach</li>
          <li>Mention specific achievements or specializations</li>
          <li>End with what students can expect from your sessions</li>
        </ol>
      `,
      category: 'Profile Setup',
      tags: ['profile', 'tutor', 'setup'],
      userRole: 'tutor',
      lastUpdated: '2024-01-20',
      views: 890,
      helpful: 78,
      notHelpful: 3
    },
    {
      id: '3',
      title: 'Payment and Refund Policy',
      content: `
        <h3>Understanding Payments</h3>
        <p>TutorHub ensures secure and fair payment processing for all users.</p>
        <h4>Payment Process:</h4>
        <ul>
          <li>Payment is captured when booking is confirmed</li>
          <li>Funds are held securely until session completion</li>
          <li>Tutors receive payment after successful session delivery</li>
        </ul>
        <h4>Refund Policy:</h4>
        <ul>
          <li><strong>24+ hours before:</strong> Full refund available</li>
          <li><strong>2-24 hours before:</strong> 50% refund (tutor discretion)</li>
          <li><strong>Less than 2 hours:</strong> No refund (tutor discretion for emergencies)</li>
        </ul>
      `,
      category: 'Payments',
      tags: ['payment', 'refund', 'policy'],
      userRole: 'both',
      lastUpdated: '2024-01-10',
      views: 2100,
      helpful: 156,
      notHelpful: 12
    }
  ];

  const mockFAQs: FAQ[] = [
    {
      id: '1',
      question: 'How do I cancel a session?',
      answer: 'You can cancel a session by going to your "My Sessions" page, clicking on the session, and selecting "Cancel Session". Please note our cancellation policy for refunds.',
      category: 'Sessions',
      userRole: 'both',
      popular: true
    },
    {
      id: '2',
      question: 'What if my tutor doesn\'t show up?',
      answer: 'If your tutor doesn\'t show up within 10 minutes of the scheduled time, please contact our support team immediately. You will receive a full refund and we will help you reschedule.',
      category: 'Support',
      userRole: 'student',
      popular: true
    },
    {
      id: '3',
      question: 'How do I get paid as a tutor?',
      answer: 'Payments are processed automatically after each completed session. Funds are transferred to your bank account within 2-3 business days. You can track your earnings in the "Earnings" section.',
      category: 'Payments',
      userRole: 'tutor',
      popular: true
    }
  ];

  // Initialize data
  useEffect(() => {
    setArticles(mockArticles);
    setFaqs(mockFAQs);
    setIsLoading(false);
  }, []);

  // Filter content based on search and category
  useEffect(() => {
    let filtered = articles.filter(article => 
      (article.userRole === userRole || article.userRole === 'both') &&
      (selectedCategory === 'all' || article.category === selectedCategory)
    );

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);

    // Filter FAQs
    let filteredFAQsResult = faqs.filter(faq => 
      (faq.userRole === userRole || faq.userRole === 'both') &&
      (selectedCategory === 'all' || faq.category === selectedCategory)
    );

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredFAQsResult = filteredFAQsResult.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    setFilteredFAQs(filteredFAQsResult);
  }, [searchQuery, selectedCategory, articles, faqs, userRole]);

  const categories = ['all', 'Getting Started', 'Profile Setup', 'Sessions', 'Payments', 'Support'];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-orange-600 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Help Center</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-orange-200 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Search */}
            <div className="mt-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help articles..."
                className="w-full px-4 py-2 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          <div className="flex h-[calc(90vh-200px)]">
            {/* Sidebar */}
            <div className="w-1/4 bg-gray-50 border-r">
              {/* Tabs */}
              <div className="border-b">
                {(['articles', 'faq', 'contact'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full px-4 py-3 text-left font-medium ${
                      activeTab === tab
                        ? 'bg-white text-orange-600 border-r-2 border-orange-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'articles' ? 'Articles' : tab === 'faq' ? 'FAQ' : 'Contact'}
                  </button>
                ))}
              </div>

              {/* Categories */}
              {(activeTab === 'articles' || activeTab === 'faq') && (
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedCategory === category
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {category === 'all' ? 'All Categories' : category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'articles' && (
                <div className="p-6">
                  {selectedArticle ? (
                    <ArticleView
                      article={selectedArticle}
                      onBack={() => setSelectedArticle(null)}
                    />
                  ) : (
                    <ArticleList
                      articles={filteredArticles}
                      onSelectArticle={setSelectedArticle}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="p-6">
                  <FAQList faqs={filteredFAQs} isLoading={isLoading} />
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="p-6">
                  <ContactForm userRole={userRole} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ===========================================
// ARTICLE COMPONENTS
// ===========================================

interface ArticleListProps {
  articles: HelpArticle[];
  onSelectArticle: (article: HelpArticle) => void;
  isLoading: boolean;
}

const ArticleList: React.FC<ArticleListProps> = ({ articles, onSelectArticle, isLoading }) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading articles...</div>;
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No articles found. Try adjusting your search or category filter.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Help Articles</h3>
      
      {articles.map(article => (
        <div
          key={article.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 cursor-pointer transition-colors"
          onClick={() => onSelectArticle(article)}
        >
          <h4 className="font-semibold text-gray-900 mb-2">{article.title}</h4>
          <p className="text-gray-600 text-sm mb-3">
            {article.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">{article.category}</span>
            <div className="flex items-center space-x-4">
              <span>{article.views} views</span>
              <span>👍 {article.helpful}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface ArticleViewProps {
  article: HelpArticle;
  onBack: () => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack }) => {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);

  const handleFeedback = (helpful: boolean) => {
    setIsHelpful(helpful);
    // In production, send feedback to API
    console.log(`Article ${article.id} marked as ${helpful ? 'helpful' : 'not helpful'}`);
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={onBack}
        className="flex items-center text-orange-600 hover:text-orange-700 mb-4"
      >
        ← Back to articles
      </button>
      
      <article className="prose prose-orange max-w-none">
        <h1>{article.title}</h1>
        <div 
          className="text-gray-700"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      {/* Feedback */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Was this article helpful?</h4>
        
        {isHelpful === null ? (
          <div className="flex space-x-4">
            <button
              onClick={() => handleFeedback(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              <span>👍</span>
              <span>Yes, helpful</span>
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              <span>👎</span>
              <span>Not helpful</span>
            </button>
          </div>
        ) : (
          <div className="text-gray-600">
            Thank you for your feedback! {isHelpful ? '✅' : '❌'}
          </div>
        )}
      </div>
    </div>
  );
};

// ===========================================
// FAQ COMPONENT
// ===========================================

interface FAQListProps {
  faqs: FAQ[];
  isLoading: boolean;
}

const FAQList: React.FC<FAQListProps> = ({ faqs, isLoading }) => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center py-8">Loading FAQs...</div>;
  }

  if (faqs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No FAQs found. Try adjusting your search or category filter.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h3>
      
      {faqs.map(faq => (
        <div key={faq.id} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
            className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 pr-4">{faq.question}</h4>
              <span className="text-gray-400">
                {expandedFAQ === faq.id ? '−' : '+'}
              </span>
            </div>
          </button>
          
          {expandedFAQ === faq.id && (
            <div className="px-4 pb-4">
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ===========================================
// CONTACT FORM
// ===========================================

interface ContactFormProps {
  userRole: 'student' | 'tutor';
}

const ContactForm: React.FC<ContactFormProps> = ({ userRole }) => {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
    urgent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: 'general', label: 'General Question' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'account', label: 'Account Issues' },
    { value: 'report', label: 'Report a Problem' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-600">
          We've received your message and will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Support</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Please describe your issue or question in detail..."
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="urgent"
            checked={formData.urgent}
            onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
            className="h-4 w-4 text-orange-600 border-gray-300 rounded"
          />
          <label htmlFor="urgent" className="ml-2 text-sm text-gray-700">
            This is urgent
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md transition-colors"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

// ===========================================
// CONTEXTUAL TOOLTIP
// ===========================================

interface ContextualTooltipProps {
  tip: ContextualTip;
  onDismiss: () => void;
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({ tip, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = document.querySelector(tip.trigger) as HTMLElement;
    if (!element) return;

    const calculatePosition = () => {
      const rect = element.getBoundingClientRect();
      const tooltipWidth = 280;
      const tooltipHeight = 120;
      
      let x = 0;
      let y = 0;

      switch (tip.position) {
        case 'top':
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.top - tooltipHeight - 10;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.bottom + 10;
          break;
        case 'left':
          x = rect.left - tooltipWidth - 10;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
          break;
        case 'right':
          x = rect.right + 10;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
          break;
      }

      // Ensure tooltip stays within viewport
      x = Math.max(10, Math.min(x, window.innerWidth - tooltipWidth - 10));
      y = Math.max(10, Math.min(y, window.innerHeight - tooltipHeight - 10));

      setPosition({ x, y });
    };

    calculatePosition();
    setIsVisible(true);

    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [tip]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
    
    if (tip.showOnce) {
      localStorage.setItem(`tip_${tip.id}_shown`, 'true');
    }
  };

  if (!isVisible) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-lg p-4 max-w-sm transition-opacity duration-300"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{tip.title}</h4>
          <p className="text-xs text-gray-300">{tip.content}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <button
        onClick={handleDismiss}
        className="mt-3 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
      >
        Got it
      </button>

      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 border-solid ${
          tip.position === 'top' ? 'border-t-gray-900 border-t-4 border-x-transparent border-x-4 top-full left-1/2 transform -translate-x-1/2' :
          tip.position === 'bottom' ? 'border-b-gray-900 border-b-4 border-x-transparent border-x-4 bottom-full left-1/2 transform -translate-x-1/2' :
          tip.position === 'left' ? 'border-l-gray-900 border-l-4 border-y-transparent border-y-4 left-full top-1/2 transform -translate-y-1/2' :
          'border-r-gray-900 border-r-4 border-y-transparent border-y-4 right-full top-1/2 transform -translate-y-1/2'
        }`}
      />
    </div>,
    document.body
  );
};

// ===========================================
// HELP SYSTEM HOOK
// ===========================================

export const useHelpSystem = () => {
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [activeTips, setActiveTips] = useState<ContextualTip[]>([]);

  const openHelpCenter = useCallback((initialQuery?: string) => {
    setIsHelpCenterOpen(true);
  }, []);

  const closeHelpCenter = useCallback(() => {
    setIsHelpCenterOpen(false);
  }, []);

  const showTip = useCallback((tip: ContextualTip) => {
    // Check if tip should only be shown once
    if (tip.showOnce && localStorage.getItem(`tip_${tip.id}_shown`)) {
      return;
    }

    // Check if element exists
    if (!document.querySelector(tip.trigger)) {
      return;
    }

    setActiveTips(prev => [...prev, tip]);
  }, []);

  const dismissTip = useCallback((tipId: string) => {
    setActiveTips(prev => prev.filter(tip => tip.id !== tipId));
  }, []);

  const dismissAllTips = useCallback(() => {
    setActiveTips([]);
  }, []);

  return {
    isHelpCenterOpen,
    openHelpCenter,
    closeHelpCenter,
    activeTips,
    showTip,
    dismissTip,
    dismissAllTips
  };
};

export default HelpCenter;