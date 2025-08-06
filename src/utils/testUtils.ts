import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ===========================================
// TEST UTILITIES AND PROVIDERS
// ===========================================

/**
 * Mock users for testing
 */
export const mockUsers = {
  student: {
    id: 'student-1',
    email: 'student@test.com',
    full_name: 'Test Student',
    user_role: 'student',
    grade_level: 10,
    created_at: '2024-01-01T00:00:00Z'
  },
  tutor: {
    id: 'tutor-1', 
    email: 'tutor@test.com',
    full_name: 'Test Tutor',
    user_role: 'tutor',
    subjects: ['mathematics', 'physics'],
    created_at: '2024-01-01T00:00:00Z'
  },
  admin: {
    id: 'admin-1',
    email: 'admin@test.com', 
    full_name: 'Test Admin',
    user_role: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  }
};

/**
 * Mock sessions for testing
 */
export const mockSessions = [
  {
    id: 'session-1',
    student_id: 'student-1',
    tutor_id: 'tutor-1',
    subject_id: 'math-1',
    scheduled_at: '2024-02-01T10:00:00Z',
    duration_minutes: 60,
    status: 'scheduled',
    session_notes: 'Algebra review',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'session-2',
    student_id: 'student-1',
    tutor_id: 'tutor-1', 
    subject_id: 'physics-1',
    scheduled_at: '2024-02-02T14:00:00Z',
    duration_minutes: 90,
    status: 'completed',
    session_notes: 'Mechanics fundamentals',
    created_at: '2024-01-16T00:00:00Z'
  }
];

/**
 * Mock resources for testing
 */
export const mockResources = [
  {
    id: 'resource-1',
    title: 'Algebra Basics',
    description: 'Introduction to algebra concepts',
    file_name: 'algebra-basics.pdf',
    file_size: 1024000,
    category: 'worksheet',
    subject_id: 'math-1',
    grade_level: 10,
    difficulty_level: 'beginner',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'resource-2',
    title: 'Physics Lab Manual',
    description: 'Laboratory experiments for physics',
    file_name: 'physics-lab.pdf', 
    file_size: 2048000,
    category: 'lab_manual',
    subject_id: 'physics-1',
    grade_level: 11,
    difficulty_level: 'intermediate',
    created_at: '2024-01-02T00:00:00Z'
  }
];

/**
 * Mock subjects for testing
 */
export const mockSubjects = [
  {
    id: 'math-1',
    name: 'Mathematics',
    code: 'MATH',
    description: 'Mathematics curriculum',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'physics-1', 
    name: 'Physics',
    code: 'PHYS',
    description: 'Physics curriculum',
    created_at: '2024-01-01T00:00:00Z'
  }
];

/**
 * Mock Supabase client for testing
 */
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  from: jest.fn(),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn()
    }))
  }
};

/**
 * Test wrapper with providers
 */
interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(BrowserRouter, {}, children)
  );
};

/**
 * Custom render function with providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

/**
 * Wait for element helper
 */
export const waitForElement = async (getElement: () => Element | null, timeout = 5000): Promise<Element> => {
  return new Promise<Element>((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = getElement();
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error('Element not found within timeout'));
      } else {
        setTimeout(checkElement, 100);
      }
    };
    
    checkElement();
  });
};

/**
 * Create mock API response
 */
export const createMockApiResponse = <T>(
  data: T,
  error: any = null,
  status = 200
) => ({
  data: error ? null : data,
  error,
  status,
  statusText: error ? 'Error' : 'OK'
});

/**
 * Generate test ID for elements
 */
export const testId = (id: string): string => `[data-testid="${id}"]`;

/**
 * Mock form submission
 */
export const mockFormSubmission = (shouldSucceed = true) => {
  return jest.fn().mockImplementation(() => {
    if (shouldSucceed) {
      return Promise.resolve({ success: true });
    } else {
      return Promise.reject(new Error('Form submission failed'));
    }
  });
};

/**
 * Mock async operation with delay
 */
export const mockAsyncOperation = <T>(
  result: T,
  delay = 100,
  shouldSucceed = true
) => {
  return jest.fn().mockImplementation(() =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldSucceed) {
          resolve(result);
        } else {
          reject(new Error('Async operation failed'));
        }
      }, delay);
    })
  );
};

/**
 * Create mock file for file upload testing
 */
export const createMockFile = (
  name = 'test.pdf',
  size = 1024,
  type = 'application/pdf'
): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

/**
 * Mock window.matchMedia for responsive testing
 */
export const mockMatchMedia = (matches = false): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

/**
 * Mock console methods for testing
 */
export const mockConsole = (): void => {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.info = jest.fn();
  });
  
  afterEach(() => {
    Object.assign(console, originalConsole);
  });
};

/**
 * Create test user session
 */
export const createTestSession = (userType: 'student' | 'tutor' | 'admin' = 'student') => {
  const user = mockUsers[userType];
  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user,
      app_metadata: { user_role: user.user_role }
    },
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email
      }
    }
  };
};

/**
 * Mock Supabase responses for common queries
 */
export const setupSupabaseMocks = () => {
  // Mock auth responses
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: mockUsers.student },
    error: null
  });

  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: createTestSession().session },
    error: null
  });

  // Mock table queries
  const mockFrom = (table: string) => {
    const mockData: Record<string, any> = {
      profiles: [mockUsers.student, mockUsers.tutor],
      sessions: mockSessions,
      resources: mockResources,
      subjects: mockSubjects
    };

    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockData[table as keyof typeof mockData]?.[0] || null,
        error: null
      }),
      then: jest.fn().mockResolvedValue({
        data: mockData[table as keyof typeof mockData] || [],
        error: null
      })
    };
  };

  mockSupabaseClient.from.mockImplementation(mockFrom);
  
  return mockSupabaseClient;
};