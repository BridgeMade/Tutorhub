import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ===========================================
// INTERACTIVE TUTORIAL SYSTEM
// ===========================================

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'focus' | 'none';
  nextButton?: string;
  skipButton?: string;
  showNextButton?: boolean;
  showSkipButton?: boolean;
  autoNext?: boolean;
  delay?: number;
}

export interface TutorialProps {
  steps: TutorialStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  tutorialId: string;
  userRole?: 'student' | 'tutor';
}

export const InteractiveTutorial: React.FC<TutorialProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip,
  tutorialId,
  userRole = 'student'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const currentStepData = steps[currentStep];

  // Calculate tooltip position based on target element
  const calculateTooltipPosition = useCallback((element: HTMLElement, position: string) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    
    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - 20;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + 20;
        break;
      case 'left':
        x = rect.left - tooltipWidth - 20;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = rect.right + 20;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'center':
        x = window.innerWidth / 2 - tooltipWidth / 2;
        y = window.innerHeight / 2 - tooltipHeight / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    x = Math.max(20, Math.min(x, window.innerWidth - tooltipWidth - 20));
    y = Math.max(20, Math.min(y, window.innerHeight - tooltipHeight - 20));

    return { x, y };
  }, []);

  // Highlight target element
  const highlightElement = useCallback((selector: string, position: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    
    if (element) {
      setHighlightedElement(element);
      
      // Calculate tooltip position
      const pos = calculateTooltipPosition(element, position);
      setTooltipPosition(pos);
      
      // Add highlight styles
      element.style.position = 'relative';
      element.style.zIndex = '9999';
      element.style.outline = '3px solid #ea580c';
      element.style.outlineOffset = '2px';
      element.style.borderRadius = '8px';
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      return element;
    } else {
      console.warn(`Tutorial target element not found: ${selector}`);
      return null;
    }
  }, [calculateTooltipPosition]);

  // Remove highlight from element
  const removeHighlight = useCallback(() => {
    if (highlightedElement) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.outline = '';
      highlightedElement.style.outlineOffset = '';
      highlightedElement.style.borderRadius = '';
      setHighlightedElement(null);
    }
  }, [highlightedElement]);

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Complete tutorial
  const handleComplete = useCallback(() => {
    removeHighlight();
    setIsVisible(false);
    
    // Save completion status
    localStorage.setItem(`tutorial_${tutorialId}_completed`, 'true');
    localStorage.setItem(`tutorial_${tutorialId}_completed_at`, new Date().toISOString());
    
    onComplete();
  }, [removeHighlight, tutorialId, onComplete]);

  // Skip tutorial
  const handleSkip = useCallback(() => {
    removeHighlight();
    setIsVisible(false);
    
    // Save skip status
    localStorage.setItem(`tutorial_${tutorialId}_skipped`, 'true');
    localStorage.setItem(`tutorial_${tutorialId}_skipped_at`, new Date().toISOString());
    
    onSkip();
  }, [removeHighlight, tutorialId, onSkip]);

  // Handle step changes
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    removeHighlight();

    const timer = setTimeout(() => {
      if (currentStepData.target !== 'none') {
        const element = highlightElement(currentStepData.target, currentStepData.position);
        
        if (element && currentStepData.action && currentStepData.action !== 'none') {
          // Add action listeners
          const handleAction = () => {
            if (currentStepData.autoNext) {
              nextStep();
            }
          };

          if (currentStepData.action === 'click') {
            element.addEventListener('click', handleAction);
            return () => element.removeEventListener('click', handleAction);
          } else if (currentStepData.action === 'hover') {
            element.addEventListener('mouseenter', handleAction);
            return () => element.removeEventListener('mouseenter', handleAction);
          } else if (currentStepData.action === 'focus') {
            element.addEventListener('focus', handleAction);
            return () => element.removeEventListener('focus', handleAction);
          }
        }
      } else {
        // Center position for no target
        setTooltipPosition({
          x: window.innerWidth / 2 - 160,
          y: window.innerHeight / 2 - 100
        });
      }
      
      setIsVisible(true);
    }, currentStepData.delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [currentStep, currentStepData, isActive, highlightElement, removeHighlight, nextStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeHighlight();
    };
  }, [removeHighlight]);

  // Don't render if inactive or no steps
  if (!isActive || !currentStepData || !isVisible) {
    return null;
  }

  const tooltip = (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm pointer-events-auto"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y
        }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={previousStep}
            disabled={currentStep === 0}
            className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex space-x-2">
            {currentStepData.showSkipButton !== false && (
              <button
                onClick={handleSkip}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                {currentStepData.skipButton || 'Skip'}
              </button>
            )}
            
            {currentStepData.showNextButton !== false && (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md transition-colors"
              >
                {currentStep === steps.length - 1 
                  ? 'Finish' 
                  : currentStepData.nextButton || 'Next'
                }
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-orange-600 h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(tooltip, document.body);
};

// ===========================================
// PREDEFINED TUTORIALS
// ===========================================

export const dashboardTutorial: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Dashboard!',
    content: 'This is your central hub where you can manage all your tutoring activities. Let\'s take a quick tour!',
    target: 'none',
    position: 'center',
    nextButton: 'Start Tour'
  },
  {
    id: 'sidebar',
    title: 'Navigation Menu',
    content: 'Use this sidebar to navigate between different sections of TutorHub. You can access sessions, resources, messages, and more.',
    target: '[data-tutorial="sidebar"]',
    position: 'right'
  },
  {
    id: 'upcoming-sessions',
    title: 'Upcoming Sessions',
    content: 'This section shows your upcoming tutoring sessions. You can see session details, join meetings, and manage your schedule.',
    target: '[data-tutorial="upcoming-sessions"]',
    position: 'bottom'
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    content: 'These buttons give you quick access to common actions like booking a session or sending a message.',
    target: '[data-tutorial="quick-actions"]',
    position: 'top'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    content: 'Click here to see your latest notifications and updates from TutorHub.',
    target: '[data-tutorial="notifications"]',
    position: 'left'
  },
  {
    id: 'profile',
    title: 'Your Profile',
    content: 'Access your profile settings, preferences, and account information from here.',
    target: '[data-tutorial="profile-menu"]',
    position: 'left'
  }
];

export const studentBookingTutorial: TutorialStep[] = [
  {
    id: 'browse-tutors',
    title: 'Find Your Perfect Tutor',
    content: 'Browse through our qualified tutors. You can filter by subject, rating, price, and availability.',
    target: '[data-tutorial="tutor-grid"]',
    position: 'top'
  },
  {
    id: 'tutor-filters',
    title: 'Use Filters',
    content: 'Use these filters to narrow down tutors based on your specific needs and preferences.',
    target: '[data-tutorial="tutor-filters"]',
    position: 'right'
  },
  {
    id: 'tutor-profile',
    title: 'View Tutor Details',
    content: 'Click on any tutor to view their profile, qualifications, reviews, and available time slots.',
    target: '[data-tutorial="tutor-card"]',
    position: 'bottom',
    action: 'click',
    autoNext: true
  },
  {
    id: 'book-session',
    title: 'Book a Session',
    content: 'Select your preferred date and time, add any special requirements, and confirm your booking.',
    target: '[data-tutorial="book-button"]',
    position: 'top'
  },
  {
    id: 'payment',
    title: 'Secure Payment',
    content: 'Complete your booking with our secure payment system. You only pay after your session is confirmed.',
    target: '[data-tutorial="payment-section"]',
    position: 'top'
  }
];

export const tutorTutorial: TutorialStep[] = [
  {
    id: 'availability',
    title: 'Set Your Availability',
    content: 'Keep your availability calendar updated so students can book sessions when you\'re free.',
    target: '[data-tutorial="availability-calendar"]',
    position: 'top'
  },
  {
    id: 'session-requests',
    title: 'Manage Session Requests',
    content: 'Review and respond to session requests from students. You can accept, decline, or suggest alternative times.',
    target: '[data-tutorial="session-requests"]',
    position: 'bottom'
  },
  {
    id: 'resources',
    title: 'Share Resources',
    content: 'Upload and share learning materials with your students to enhance their learning experience.',
    target: '[data-tutorial="resources-section"]',
    position: 'right'
  },
  {
    id: 'earnings',
    title: 'Track Your Earnings',
    content: 'Monitor your tutoring income, view payment history, and manage your payout preferences.',
    target: '[data-tutorial="earnings-dashboard"]',
    position: 'left'
  },
  {
    id: 'student-progress',
    title: 'Student Progress',
    content: 'Track your students\' progress, add notes after sessions, and provide feedback.',
    target: '[data-tutorial="student-progress"]',
    position: 'bottom'
  }
];

// ===========================================
// TUTORIAL HOOKS
// ===========================================

export const useTutorial = (tutorialId: string) => {
  const [isActive, setIsActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(`tutorial_${tutorialId}_completed`);
    const skipped = localStorage.getItem(`tutorial_${tutorialId}_skipped`);
    
    setHasCompleted(!!completed);
    setHasSkipped(!!skipped);
  }, [tutorialId]);

  const startTutorial = useCallback(() => {
    setIsActive(true);
  }, []);

  const completeTutorial = useCallback(() => {
    setIsActive(false);
    setHasCompleted(true);
  }, []);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setHasSkipped(true);
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(`tutorial_${tutorialId}_completed`);
    localStorage.removeItem(`tutorial_${tutorialId}_skipped`);
    localStorage.removeItem(`tutorial_${tutorialId}_completed_at`);
    localStorage.removeItem(`tutorial_${tutorialId}_skipped_at`);
    setHasCompleted(false);
    setHasSkipped(false);
  }, [tutorialId]);

  return {
    isActive,
    hasCompleted,
    hasSkipped,
    startTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial
  };
};

// ===========================================
// TUTORIAL PROVIDER
// ===========================================

interface TutorialContextValue {
  startTutorial: (tutorialId: string) => void;
  isTutorialActive: (tutorialId: string) => boolean;
  hasCompletedTutorial: (tutorialId: string) => boolean;
}

const TutorialContext = React.createContext<TutorialContextValue | null>(null);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTutorials, setActiveTutorials] = useState<Set<string>>(new Set());

  const startTutorial = useCallback((tutorialId: string) => {
    setActiveTutorials(prev => new Set(prev).add(tutorialId));
  }, []);

  const isTutorialActive = useCallback((tutorialId: string) => {
    return activeTutorials.has(tutorialId);
  }, [activeTutorials]);

  const hasCompletedTutorial = useCallback((tutorialId: string) => {
    return !!localStorage.getItem(`tutorial_${tutorialId}_completed`);
  }, []);

  return (
    <TutorialContext.Provider value={{
      startTutorial,
      isTutorialActive,
      hasCompletedTutorial
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorialContext = () => {
  const context = React.useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorialContext must be used within a TutorialProvider');
  }
  return context;
};

export default InteractiveTutorial;