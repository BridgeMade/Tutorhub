// Jest setup file
import '@testing-library/jest-dom';
import { mockLocalStorage, mockPerformance, mockIntersectionObserver, mockMatchMedia } from './utils/testUtils';

// ===========================================
// GLOBAL TEST SETUP
// ===========================================

// Mock global objects
global.localStorage = mockLocalStorage() as any;
global.performance = mockPerformance() as any;

// Mock browser APIs
mockIntersectionObserver();
mockMatchMedia();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock crypto.getRandomValues for CSRF tokens
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockReturnValue(new Uint32Array([1, 2, 3, 4])),
  },
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
