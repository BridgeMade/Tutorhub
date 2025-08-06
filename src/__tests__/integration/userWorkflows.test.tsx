import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { setupSupabaseMocks, createTestSession, mockUsers, mockSessions } from '../../utils/testUtils';
import App from '../../App';

// ===========================================
// USER WORKFLOW INTEGRATION TESTS
// ===========================================

describe('User Workflow Integration Tests', () => {
  beforeEach(() => {
    setupSupabaseMocks();
    
    // Mock window.location for navigation
    delete (window as any).location;
    window.location = {
      ...window.location,
      pathname: '/',
      search: '',
      hash: '',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Student Workflows', () => {
    beforeEach(() => {
      // Setup student session
      const studentSession = createTestSession('student');
      jest.mocked(require('../../lib/supabase').supabase.auth.getUser).mockResolvedValue({
        data: { user: studentSession.user },
        error: null
      });
    });

    test('Student can complete onboarding flow', async () => {
      render(<App />);

      // Should show onboarding for new users
      await waitFor(() => {
        expect(screen.getByText(/getting started/i)).toBeInTheDocument();
      });

      // Complete profile step
      const nameInput = screen.getByLabelText(/full name/i);
      fireEvent.change(nameInput, { target: { value: 'John Student' } });
      
      const gradeSelect = screen.getByLabelText(/grade level/i);
      fireEvent.change(gradeSelect, { target: { value: 'grade-11' } });

      const continueButton = screen.getByText(/continue/i);
      fireEvent.click(continueButton);

      // Should progress to next step
      await waitFor(() => {
        expect(screen.getByText(/preferences/i)).toBeInTheDocument();
      });

      // Complete preferences
      const emailNotifications = screen.getByLabelText(/email notifications/i);
      fireEvent.click(emailNotifications);

      fireEvent.click(screen.getByText(/continue/i));

      // Should progress to subject selection
      await waitFor(() => {
        expect(screen.getByText(/subjects/i)).toBeInTheDocument();
      });

      // Select subjects
      const mathSubject = screen.getByText(/mathematics/i);
      fireEvent.click(mathSubject);

      fireEvent.click(screen.getByText(/continue/i));

      // Should complete onboarding
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    test('Student can search and book a tutoring session', async () => {
      render(<App />);

      // Navigate to find tutors
      await waitFor(() => {
        const findTutorsLink = screen.getByText(/find tutors/i);
        fireEvent.click(findTutorsLink);
      });

      // Should show tutor search interface
      await waitFor(() => {
        expect(screen.getByText(/available tutors/i)).toBeInTheDocument();
      });

      // Search for math tutors
      const subjectFilter = screen.getByLabelText(/subject/i);
      fireEvent.change(subjectFilter, { target: { value: 'Math' } });

      const searchButton = screen.getByText(/search/i);
      fireEvent.click(searchButton);

      // Should show filtered results
      await waitFor(() => {
        expect(screen.getByText(/jane tutor/i)).toBeInTheDocument();
      });

      // Click on a tutor to view profile
      const tutorCard = screen.getByText(/jane tutor/i).closest('.tutor-card');
      fireEvent.click(tutorCard!);

      // Should show tutor profile
      await waitFor(() => {
        expect(screen.getByText(/tutor profile/i)).toBeInTheDocument();
        expect(screen.getByText(/book session/i)).toBeInTheDocument();
      });

      // Book a session
      const bookButton = screen.getByText(/book session/i);
      fireEvent.click(bookButton);

      // Should show booking form
      await waitFor(() => {
        expect(screen.getByText(/schedule session/i)).toBeInTheDocument();
      });

      // Fill booking form
      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-02-15' } });

      const timeInput = screen.getByLabelText(/time/i);
      fireEvent.change(timeInput, { target: { value: '14:00' } });

      const notesInput = screen.getByLabelText(/notes/i);
      fireEvent.change(notesInput, { target: { value: 'Need help with algebra' } });

      const confirmButton = screen.getByText(/confirm booking/i);
      fireEvent.click(confirmButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/session booked successfully/i)).toBeInTheDocument();
      });
    });

    test('Student can access and download learning resources', async () => {
      render(<App />);

      // Navigate to resources
      const resourcesLink = screen.getByText(/resources/i);
      fireEvent.click(resourcesLink);

      // Should show resources library
      await waitFor(() => {
        expect(screen.getByText(/learning resources/i)).toBeInTheDocument();
      });

      // Filter resources by subject
      const subjectFilter = screen.getByLabelText(/filter by subject/i);
      fireEvent.change(subjectFilter, { target: { value: 'Math' } });

      // Should show filtered resources
      await waitFor(() => {
        expect(screen.getByText(/algebra basics/i)).toBeInTheDocument();
      });

      // Download a resource
      const downloadButton = screen.getByText(/download/i);
      fireEvent.click(downloadButton);

      // Should initiate download
      await waitFor(() => {
        expect(screen.getByText(/downloading/i)).toBeInTheDocument();
      });
    });

    test('Student can view and manage their sessions', async () => {
      render(<App />);

      // Navigate to dashboard
      const dashboardLink = screen.getByText(/dashboard/i);
      fireEvent.click(dashboardLink);

      // Should show dashboard with sessions
      await waitFor(() => {
        expect(screen.getByText(/my sessions/i)).toBeInTheDocument();
        expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
      });

      // View session details
      const sessionCard = screen.getByText(/math session/i).closest('.session-card');
      fireEvent.click(sessionCard!);

      // Should show session details
      await waitFor(() => {
        expect(screen.getByText(/session details/i)).toBeInTheDocument();
        expect(screen.getByText(/reschedule/i)).toBeInTheDocument();
        expect(screen.getByText(/cancel/i)).toBeInTheDocument();
      });

      // Reschedule session
      const rescheduleButton = screen.getByText(/reschedule/i);
      fireEvent.click(rescheduleButton);

      // Should show reschedule form
      await waitFor(() => {
        expect(screen.getByText(/reschedule session/i)).toBeInTheDocument();
      });

      const newDateInput = screen.getByLabelText(/new date/i);
      fireEvent.change(newDateInput, { target: { value: '2024-02-20' } });

      const reasonInput = screen.getByLabelText(/reason/i);
      fireEvent.change(reasonInput, { target: { value: 'Schedule conflict' } });

      const submitButton = screen.getByText(/submit request/i);
      fireEvent.click(submitButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/reschedule request sent/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tutor Workflows', () => {
    beforeEach(() => {
      // Setup tutor session
      const tutorSession = createTestSession('tutor');
      jest.mocked(require('../../lib/supabase').supabase.auth.getUser).mockResolvedValue({
        data: { user: tutorSession.user },
        error: null
      });
    });

    test('Tutor can manage their availability and rates', async () => {
      render(<App />);

      // Navigate to tutor dashboard
      await waitFor(() => {
        expect(screen.getByText(/tutor dashboard/i)).toBeInTheDocument();
      });

      // Navigate to availability settings
      const availabilityLink = screen.getByText(/availability/i);
      fireEvent.click(availabilityLink);

      // Should show availability calendar
      await waitFor(() => {
        expect(screen.getByText(/set your availability/i)).toBeInTheDocument();
      });

      // Set availability for a day
      const mondaySlot = screen.getByText(/monday/i).closest('.day-column');
      const timeSlot = mondaySlot?.querySelector('.time-slot[data-time="10:00"]');
      fireEvent.click(timeSlot!);

      // Should mark slot as available
      expect(timeSlot).toHaveClass('available');

      // Save availability
      const saveButton = screen.getByText(/save availability/i);
      fireEvent.click(saveButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/availability saved/i)).toBeInTheDocument();
      });

      // Navigate to rates settings
      const ratesLink = screen.getByText(/rates/i);
      fireEvent.click(ratesLink);

      // Should show rates form
      await waitFor(() => {
        expect(screen.getByText(/hourly rates/i)).toBeInTheDocument();
      });

      // Update rate for Math
      const mathRateInput = screen.getByLabelText(/mathematics rate/i);
      fireEvent.change(mathRateInput, { target: { value: '75' } });

      const updateRatesButton = screen.getByText(/update rates/i);
      fireEvent.click(updateRatesButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/rates updated/i)).toBeInTheDocument();
      });
    });

    test('Tutor can respond to session requests and reschedule requests', async () => {
      render(<App />);

      // Navigate to session requests
      const requestsLink = screen.getByText(/session requests/i);
      fireEvent.click(requestsLink);

      // Should show pending requests
      await waitFor(() => {
        expect(screen.getByText(/pending requests/i)).toBeInTheDocument();
      });

      // Approve a session request
      const approveButton = screen.getByText(/approve/i);
      fireEvent.click(approveButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/confirm session/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/confirm/i);
      fireEvent.click(confirmButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/session approved/i)).toBeInTheDocument();
      });

      // Navigate to reschedule requests
      const rescheduleTab = screen.getByText(/reschedule requests/i);
      fireEvent.click(rescheduleTab);

      // Should show reschedule requests
      await waitFor(() => {
        expect(screen.getByText(/reschedule request from/i)).toBeInTheDocument();
      });

      // Approve reschedule request
      const approveRescheduleButton = screen.getByText(/approve/i);
      fireEvent.click(approveRescheduleButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/reschedule approved/i)).toBeInTheDocument();
      });
    });

    test('Tutor can create and manage learning resources', async () => {
      render(<App />);

      // Navigate to resources management
      const resourcesLink = screen.getByText(/my resources/i);
      fireEvent.click(resourcesLink);

      // Should show resource management interface
      await waitFor(() => {
        expect(screen.getByText(/manage resources/i)).toBeInTheDocument();
      });

      // Create new resource
      const createButton = screen.getByText(/create resource/i);
      fireEvent.click(createButton);

      // Should show resource creation form
      await waitFor(() => {
        expect(screen.getByText(/create learning resource/i)).toBeInTheDocument();
      });

      // Fill resource form
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Calculus Fundamentals' } });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Introduction to calculus concepts' } });

      const subjectSelect = screen.getByLabelText(/subject/i);
      fireEvent.change(subjectSelect, { target: { value: 'Math' } });

      const fileInput = screen.getByLabelText(/upload file/i);
      const file = new File(['test content'], 'calculus.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const saveButton = screen.getByText(/save resource/i);
      fireEvent.click(saveButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/resource created successfully/i)).toBeInTheDocument();
      });

      // Should show resource in list
      expect(screen.getByText(/calculus fundamentals/i)).toBeInTheDocument();
    });
  });

  describe('Admin Workflows', () => {
    beforeEach(() => {
      // Setup admin session
      const adminSession = createTestSession('admin');
      jest.mocked(require('../../lib/supabase').supabase.auth.getUser).mockResolvedValue({
        data: { user: adminSession.user },
        error: null
      });
    });

    test('Admin can view system dashboard and monitor performance', async () => {
      render(<App />);

      // Navigate to admin dashboard
      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });

      // Should show system overview
      expect(screen.getByText(/system overview/i)).toBeInTheDocument();
      expect(screen.getByText(/active users/i)).toBeInTheDocument();
      expect(screen.getByText(/total sessions/i)).toBeInTheDocument();

      // Navigate to performance monitoring
      const performanceLink = screen.getByText(/performance/i);
      fireEvent.click(performanceLink);

      // Should show performance dashboard
      await waitFor(() => {
        expect(screen.getByText(/performance dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/core web vitals/i)).toBeInTheDocument();
      });

      // Check performance metrics
      expect(screen.getByText(/page load time/i)).toBeInTheDocument();
      expect(screen.getByText(/memory usage/i)).toBeInTheDocument();
      expect(screen.getByText(/cache hit rate/i)).toBeInTheDocument();
    });

    test('Admin can manage users and handle support requests', async () => {
      render(<App />);

      // Navigate to user management
      const usersLink = screen.getByText(/users/i);
      fireEvent.click(usersLink);

      // Should show user management interface
      await waitFor(() => {
        expect(screen.getByText(/user management/i)).toBeInTheDocument();
      });

      // Search for users
      const searchInput = screen.getByPlaceholderText(/search users/i);
      fireEvent.change(searchInput, { target: { value: 'john' } });

      // Should filter users
      await waitFor(() => {
        expect(screen.getByText(/john student/i)).toBeInTheDocument();
      });

      // View user details
      const userRow = screen.getByText(/john student/i).closest('tr');
      fireEvent.click(userRow!);

      // Should show user profile
      await waitFor(() => {
        expect(screen.getByText(/user profile/i)).toBeInTheDocument();
      });

      // Navigate to support requests
      const supportLink = screen.getByText(/support/i);
      fireEvent.click(supportLink);

      // Should show support tickets
      await waitFor(() => {
        expect(screen.getByText(/support tickets/i)).toBeInTheDocument();
      });

      // Respond to a ticket
      const ticketRow = screen.getByText(/login issue/i).closest('.ticket-row');
      const respondButton = ticketRow?.querySelector('button[data-action="respond"]');
      fireEvent.click(respondButton!);

      // Should show response form
      await waitFor(() => {
        expect(screen.getByText(/respond to ticket/i)).toBeInTheDocument();
      });

      const responseInput = screen.getByLabelText(/response/i);
      fireEvent.change(responseInput, { target: { value: 'Please try clearing your browser cache and cookies.' } });

      const sendButton = screen.getByText(/send response/i);
      fireEvent.click(sendButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/response sent/i)).toBeInTheDocument();
      });
    });

    test('Admin can configure system settings and backup policies', async () => {
      render(<App />);

      // Navigate to system settings
      const settingsLink = screen.getByText(/settings/i);
      fireEvent.click(settingsLink);

      // Should show settings interface
      await waitFor(() => {
        expect(screen.getByText(/system settings/i)).toBeInTheDocument();
      });

      // Update email settings
      const emailTab = screen.getByText(/email settings/i);
      fireEvent.click(emailTab);

      const smtpInput = screen.getByLabelText(/smtp server/i);
      fireEvent.change(smtpInput, { target: { value: 'smtp.example.com' } });

      const saveEmailButton = screen.getByText(/save email settings/i);
      fireEvent.click(saveEmailButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/email settings saved/i)).toBeInTheDocument();
      });

      // Navigate to backup settings
      const backupTab = screen.getByText(/backup/i);
      fireEvent.click(backupTab);

      // Should show backup dashboard
      await waitFor(() => {
        expect(screen.getByText(/backup dashboard/i)).toBeInTheDocument();
      });

      // Create manual backup
      const createBackupButton = screen.getByText(/create backup/i);
      fireEvent.click(createBackupButton);

      // Should show backup progress
      await waitFor(() => {
        expect(screen.getByText(/creating backup/i)).toBeInTheDocument();
      });

      // Should complete backup
      await waitFor(() => {
        expect(screen.getByText(/backup completed successfully/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Cross-User Interactions', () => {
    test('Complete session booking flow between student and tutor', async () => {
      // This test simulates the full flow from student booking to tutor approval
      
      // Start as student
      const studentSession = createTestSession('student');
      jest.mocked(require('../../lib/supabase').supabase.auth.getUser).mockResolvedValue({
        data: { user: studentSession.user },
        error: null
      });

      const { rerender } = render(<App />);

      // Student books session
      const findTutorsLink = screen.getByText(/find tutors/i);
      fireEvent.click(findTutorsLink);

      await waitFor(() => {
        const bookButton = screen.getByText(/book session/i);
        fireEvent.click(bookButton);
      });

      // Fill booking form
      await waitFor(() => {
        const dateInput = screen.getByLabelText(/date/i);
        fireEvent.change(dateInput, { target: { value: '2024-02-15' } });
        
        const confirmButton = screen.getByText(/confirm booking/i);
        fireEvent.click(confirmButton);
      });

      // Should show booking confirmation
      await waitFor(() => {
        expect(screen.getByText(/booking request sent/i)).toBeInTheDocument();
      });

      // Switch to tutor view
      const tutorSession = createTestSession('tutor');
      jest.mocked(require('../../lib/supabase').supabase.auth.getUser).mockResolvedValue({
        data: { user: tutorSession.user },
        error: null
      });

      rerender(<App />);

      // Tutor sees and approves request
      await waitFor(() => {
        const requestsLink = screen.getByText(/session requests/i);
        fireEvent.click(requestsLink);
      });

      await waitFor(() => {
        const approveButton = screen.getByText(/approve/i);
        fireEvent.click(approveButton);
      });

      // Should confirm session
      await waitFor(() => {
        expect(screen.getByText(/session approved/i)).toBeInTheDocument();
      });

      // Both users should receive confirmation (tested via email service mock)
      expect(jest.mocked(require('../../services/emailService').emailService.sendSessionBookedEmail))
        .toHaveBeenCalledWith(
          expect.stringContaining('@'),
          expect.stringContaining('@'),
          expect.any(Object)
        );
    });
  });
});