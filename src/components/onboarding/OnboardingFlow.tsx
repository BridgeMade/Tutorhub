import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUserRegistration } from '../../hooks/useUserRegistration';
import { SecureForm, SecureInput, SecureSelect, SecureTextarea, SecureCheckbox } from '../forms/SecureForm';
import { validationSchemas } from '../../utils/validation';
import { LoadingState } from '../common/LoadingState';
import { z } from 'zod';

// ===========================================
// ONBOARDING FLOW COMPONENT
// ===========================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  required: boolean;
  role?: 'student' | 'tutor' | 'both';
}

export interface OnboardingStepProps {
  onNext: (data?: any) => void;
  onPrevious: () => void;
  onSkip?: () => void;
  data: any;
  updateData: (newData: any) => void;
  isFirst: boolean;
  isLast: boolean;
}

export interface OnboardingFlowProps {
  userRole: 'student' | 'tutor';
  onComplete: (userData: any) => void;
  initialData?: any;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  userRole,
  onComplete,
  initialData = {}
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Define onboarding steps based on user role
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to TutorHub!',
      description: 'Let\'s get you set up for success',
      component: WelcomeStep,
      required: true,
      role: 'both'
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Tell us a bit about yourself',
      component: ProfileStep,
      required: true,
      role: 'both'
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      description: 'Customize your TutorHub experience',
      component: PreferencesStep,
      required: false,
      role: 'both'
    },
    ...(userRole === 'student' ? [
      {
        id: 'subjects',
        title: 'Select Your Subjects',
        description: 'Choose the subjects you want to learn',
        component: StudentSubjectsStep,
        required: true,
        role: 'student' as const
      },
      {
        id: 'goals',
        title: 'Set Learning Goals',
        description: 'What do you want to achieve?',
        component: StudentGoalsStep,
        required: false,
        role: 'student' as const
      }
    ] : []),
    ...(userRole === 'tutor' ? [
      {
        id: 'qualifications',
        title: 'Add Your Qualifications',
        description: 'Showcase your expertise',
        component: TutorQualificationsStep,
        required: true,
        role: 'tutor' as const
      },
      {
        id: 'subjects-teach',
        title: 'Subjects You Teach',
        description: 'Select subjects you can teach',
        component: TutorSubjectsStep,
        required: true,
        role: 'tutor' as const
      },
      {
        id: 'availability',
        title: 'Set Your Availability',
        description: 'When are you available to teach?',
        component: TutorAvailabilityStep,
        required: true,
        role: 'tutor' as const
      },
      {
        id: 'pricing',
        title: 'Set Your Rates',
        description: 'Define your teaching rates',
        component: TutorPricingStep,
        required: true,
        role: 'tutor' as const
      }
    ] : []),
    {
      id: 'tutorial',
      title: 'Quick Tutorial',
      description: 'Learn how to use TutorHub',
      component: TutorialStep,
      required: false,
      role: 'both'
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Welcome to the TutorHub community',
      component: CompleteStep,
      required: true,
      role: 'both'
    }
  ];

  // Filter steps based on user role
  const filteredSteps = steps.filter(step => 
    step.role === 'both' || step.role === userRole
  );

  const currentStepData = filteredSteps[currentStep];
  const StepComponent = currentStepData?.component;

  const handleNext = useCallback((stepData?: any) => {
    if (stepData) {
      setOnboardingData((prev: any) => ({ ...prev, ...stepData }));
    }

    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      handleComplete();
    }
  }, [currentStep, filteredSteps.length, onboardingData]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const updateData = useCallback((newData: any) => {
    setOnboardingData((prev: any) => ({ ...prev, ...newData }));
  }, []);

  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      // Save onboarding completion status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            ...onboardingData
          })
          .eq('id', user.id);

        // Log onboarding completion
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            activity_type: 'onboarding_completed',
            details: {
              role: userRole,
              steps_completed: filteredSteps.length,
              completion_time: new Date().toISOString()
            }
          });
      }

      onComplete(onboardingData);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onboardingData, onComplete, userRole, filteredSteps.length]);

  if (isLoading) {
    return <LoadingState text="Completing your setup..." />;
  }

  if (!StepComponent) {
    return <div>Error: Step not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Getting Started</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {filteredSteps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / filteredSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600">
                {currentStepData.description}
              </p>
            </div>

            <StepComponent
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={!currentStepData.required ? handleSkip : undefined}
              data={onboardingData}
              updateData={updateData}
              isFirst={currentStep === 0}
              isLast={currentStep === filteredSteps.length - 1}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {filteredSteps.map((step, index) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                index <= currentStep
                  ? 'bg-orange-600'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ===========================================
// ONBOARDING STEPS
// ===========================================

const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext, data }) => {
  const userRole = data.role || 'student';

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">👋</span>
      </div>
      
      <div className="space-y-4">
        <p className="text-lg text-gray-700">
          Welcome to TutorHub! We're excited to help you {userRole === 'student' ? 'learn and grow' : 'share your knowledge'}.
        </p>
        
        <p className="text-gray-600">
          Let's get you set up with a quick onboarding process. This will only take a few minutes and will help us personalize your experience.
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800 mb-2">What you'll set up:</h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>✓ Complete your profile</li>
            <li>✓ Set your preferences</li>
            {userRole === 'student' ? (
              <>
                <li>✓ Choose your subjects</li>
                <li>✓ Set learning goals</li>
              </>
            ) : (
              <>
                <li>✓ Add qualifications</li>
                <li>✓ Set availability</li>
                <li>✓ Configure pricing</li>
              </>
            )}
            <li>✓ Quick tutorial</li>
          </ul>
        </div>
      </div>

      <button
        onClick={() => onNext()}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
      >
        Let's Get Started
      </button>
    </div>
  );
};

const ProfileStep: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, data, isFirst }) => {
  const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    phoneNumber: z.string().optional(),
    bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
    gradeLevel: data.role === 'student' ? z.string().min(1, 'Please select your grade level') : z.string().optional()
  });

  const handleSubmit = (formData: any) => {
    onNext(formData);
  };

  // Get available grade levels
  const gradeLevels = [
    { value: 'grade-1', label: 'Grade 1' },
    { value: 'grade-2', label: 'Grade 2' },
    { value: 'grade-3', label: 'Grade 3' },
    { value: 'grade-4', label: 'Grade 4' },
    { value: 'grade-5', label: 'Grade 5' },
    { value: 'grade-6', label: 'Grade 6' },
    { value: 'grade-7', label: 'Grade 7' },
    { value: 'grade-8', label: 'Grade 8' },
    { value: 'grade-9', label: 'Grade 9' },
    { value: 'grade-10', label: 'Grade 10' },
    { value: 'grade-11', label: 'Grade 11' },
    { value: 'grade-12', label: 'Grade 12' },
    { value: 'university', label: 'University/College' },
    { value: 'adult', label: 'Adult Learner' }
  ];

  return (
    <SecureForm
      schema={profileSchema}
      onSubmit={handleSubmit}
      submitText="Continue"
      className="space-y-6"
    >
      <SecureInput
        name="fullName"
        label="Full Name"
        placeholder="Enter your full name"
        required
        autoComplete="name"
      />

      <SecureInput
        name="phoneNumber"
        label="Phone Number"
        type="tel"
        placeholder="Enter your phone number"
        autoComplete="tel"
      />

      {data.role === 'student' && (
        <SecureSelect
          name="gradeLevel"
          label="Grade Level"
          options={gradeLevels}
          placeholder="Select your grade level"
          required
        />
      )}

      <SecureTextarea
        name="bio"
        label="Bio"
        placeholder={`Tell us a bit about yourself${data.role === 'tutor' ? ' and your teaching experience' : ''}...`}
        rows={4}
        maxLength={500}
      />

      <div className="flex justify-between pt-4">
        {!isFirst && (
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
        )}
      </div>
    </SecureForm>
  );
};

const PreferencesStep: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, onSkip, data }) => {
  const preferencesSchema = z.object({
    emailNotifications: z.boolean().default(true),
    sessionReminders: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
    language: z.string().default('en'),
    timezone: z.string().default('Africa/Johannesburg')
  });

  const handleSubmit = (formData: any) => {
    onNext({
      preferences: formData
    });
  };

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'af', label: 'Afrikaans' },
    { value: 'zu', label: 'Zulu' },
    { value: 'xh', label: 'Xhosa' }
  ];

  const timezones = [
    { value: 'Africa/Johannesburg', label: 'South Africa (GMT+2)' },
    { value: 'Africa/Cairo', label: 'Egypt (GMT+2)' },
    { value: 'Europe/London', label: 'UK (GMT)' },
    { value: 'America/New_York', label: 'US Eastern (GMT-5)' }
  ];

  return (
    <SecureForm
      schema={preferencesSchema}
      onSubmit={handleSubmit}
      submitText="Continue"
      className="space-y-6"
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
        
        <SecureCheckbox
          name="emailNotifications"
          label="Email notifications for important updates"
        />
        
        <SecureCheckbox
          name="sessionReminders"
          label="Session reminders (24 hours before)"
        />
        
        <SecureCheckbox
          name="marketingEmails"
          label="Marketing emails and newsletters"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Regional Settings</h3>
        
        <SecureSelect
          name="language"
          label="Preferred Language"
          options={languages}
        />
        
        <SecureSelect
          name="timezone"
          label="Timezone"
          options={timezones}
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </SecureForm>
  );
};

const StudentSubjectsStep: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, data }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(data.subjectsOfInterest || []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { data: subjectsData, error } = await supabase
          .from('subjects')
          .select('*')
          .order('name');

        if (error) throw error;
        setSubjects(subjectsData || []);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubjects();
  }, []);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleContinue = () => {
    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }

    onNext({
      subjectsOfInterest: selectedSubjects
    });
  };

  if (isLoading) {
    return <LoadingState text="Loading subjects..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Which subjects would you like to learn?
        </h3>
        <p className="text-gray-600 mb-6">
          Select all subjects you're interested in. You can always change this later.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {subjects.map(subject => (
            <button
              key={subject.id}
              type="button"
              onClick={() => handleSubjectToggle(subject.id)}
              className={`
                p-3 rounded-lg border-2 text-left transition-all
                ${selectedSubjects.includes(subject.id)
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }
              `}
            >
              <div className="font-medium">{subject.name}</div>
              {subject.description && (
                <div className="text-xs opacity-75 mt-1">{subject.description}</div>
              )}
            </button>
          ))}
        </div>

        {selectedSubjects.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        
        <button
          onClick={handleContinue}
          disabled={selectedSubjects.length === 0}
          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const StudentGoalsStep: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, onSkip, data }) => {
  const goalsSchema = z.object({
    learningGoals: z.array(z.string()).min(1, 'Please select at least one goal'),
    targetGrade: z.string().optional(),
    preferredSessionLength: z.string().default('60'),
    studyHoursPerWeek: z.string().optional()
  });

  const handleSubmit = (formData: any) => {
    onNext({
      learningGoals: formData.learningGoals,
      targetGrade: formData.targetGrade,
      preferredSessionLength: parseInt(formData.preferredSessionLength),
      studyHoursPerWeek: formData.studyHoursPerWeek
    });
  };

  const goalOptions = [
    'Improve grades',
    'Prepare for exams',
    'Catch up on missed work',
    'Advanced learning',
    'Homework help',
    'Build confidence',
    'University preparation',
    'Career preparation'
  ];

  const sessionLengths = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' }
  ];

  return (
    <SecureForm
      schema={goalsSchema}
      onSubmit={handleSubmit}
      submitText="Continue"
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What are your learning goals?
        </h3>
        
        <div className="space-y-2">
          {goalOptions.map(goal => (
            <SecureCheckbox
              key={goal}
              name="learningGoals"
              label={goal}
            />
          ))}
        </div>
      </div>

      <SecureSelect
        name="preferredSessionLength"
        label="Preferred Session Length"
        options={sessionLengths}
      />

      <SecureInput
        name="studyHoursPerWeek"
        label="Study Hours Per Week"
        type="number"
        placeholder="How many hours do you plan to study per week?"
      />

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </SecureForm>
  );
};

// Tutor-specific steps would be implemented similarly...
const TutorQualificationsStep: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, data }) => {
  // Implementation for tutor qualifications
  return <div>Tutor Qualifications Step</div>;
};

const TutorSubjectsStep: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, data }) => {
  // Implementation for tutor subjects
  return <div>Tutor Subjects Step</div>;
};

const TutorAvailabilityStep: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, data }) => {
  // Implementation for tutor availability
  return <div>Tutor Availability Step</div>;
};

const TutorPricingStep: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, data }) => {
  // Implementation for tutor pricing
  return <div>Tutor Pricing Step</div>;
};

const TutorialStep: React.FC<OnboardingStepProps> = ({ onNext, onPrevious, onSkip }) => {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">🎓</span>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Quick Tutorial
        </h3>
        
        <p className="text-gray-600">
          Would you like a quick tutorial on how to use TutorHub? This will show you the main features and how to get started.
        </p>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => onNext({ tutorialCompleted: true })}
          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
        >
          Take Tutorial
        </button>
        
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Skip Tutorial
          </button>
        )}
      </div>

      <button
        onClick={onPrevious}
        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        ← Previous
      </button>
    </div>
  );
};

const CompleteStep: React.FC<OnboardingStepProps> = ({ onNext, data }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">🎉</span>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-2xl font-semibold text-gray-900">
          Welcome to TutorHub!
        </h3>
        
        <p className="text-lg text-gray-600">
          Your account is now set up and ready to go. You can start {data.role === 'student' ? 'booking sessions' : 'accepting students'} right away.
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-2">Next Steps:</h4>
          <ul className="text-sm text-orange-700 space-y-1 text-left">
            {data.role === 'student' ? (
              <>
                <li>• Browse available tutors</li>
                <li>• Book your first session</li>
                <li>• Upload your profile picture</li>
                <li>• Explore learning resources</li>
              </>
            ) : (
              <>
                <li>• Complete your tutor verification</li>
                <li>• Upload your profile picture</li>
                <li>• Create learning resources</li>
                <li>• Set your availability calendar</li>
              </>
            )}
          </ul>
        </div>
      </div>

      <button
        onClick={handleGetStarted}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default OnboardingFlow;