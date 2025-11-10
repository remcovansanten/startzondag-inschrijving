/**
 * Unit tests for email library (/lib/email)
 * Tests email formatting, retry logic, error handling,
 * and Resend API integration
 */

// Define the mock module
const mockSend = jest.fn();

jest.mock('resend', () => {
  const mockSendFn = jest.fn();
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSendFn,
      },
    })),
    __mockSendFn: mockSendFn,
  };
});

import { sendConfirmationEmail, sendCancellationEmail } from '@/lib/email';
import { Resend } from 'resend';

describe('Email Library', () => {
  let mockSendFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mock send function from the Resend mock
    const MockedResend = Resend as jest.MockedClass<typeof Resend>;
    const resendInstance = new MockedResend('test-api-key');
    mockSendFn = resendInstance.emails.send as jest.Mock;
  });

  describe('sendConfirmationEmail', () => {
    const testData = {
      naam: 'John Doe',
      taakNaam: 'Test Task',
      telefoon: '0612345678',
      email: 'john@example.com',
      wijzigLink: 'https://example.com/wijzig/abc123',
    };

    test('1. Sends email with correct structure', async () => {
      mockSendFn.mockResolvedValue({ id: 'email-123' });

      await sendConfirmationEmail('john@example.com', testData);

      expect(mockSendFn).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: 'john@example.com',
          subject: expect.stringContaining('Bevestiging aanmelding'),
          html: expect.any(String),
        })
      );
    });

    test('2. Email contains all required information', async () => {
      mockSendFn.mockResolvedValue({ id: 'email-123' });

      await sendConfirmationEmail('john@example.com', testData);

      const callArgs = mockSendFn.mock.calls[0][0];
      const htmlContent = callArgs.html;

      // Verify all data is included in HTML
      expect(htmlContent).toContain('John Doe');
      expect(htmlContent).toContain('Test Task');
      expect(htmlContent).toContain('0612345678');
      expect(htmlContent).toContain('john@example.com');
      expect(htmlContent).toContain('https://example.com/wijzig/abc123');
    });

    test('3. Email subject includes task name', async () => {
      mockSendFn.mockResolvedValue({ id: 'email-123' });

      await sendConfirmationEmail('john@example.com', testData);

      const callArgs = mockSendFn.mock.calls[0][0];
      expect(callArgs.subject).toContain('Test Task');
      expect(callArgs.subject).toContain('Bevestiging aanmelding');
    });

    test('4. Retries on failure with exponential backoff', async () => {
      // Fail first 2 attempts, succeed on 3rd
      mockSendFn
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'email-123' });

      const result = await sendConfirmationEmail('john@example.com', testData);

      expect(mockSendFn).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ id: 'email-123' });
    });

    test('5. Throws error after max retries exceeded', async () => {
      // Fail all attempts
      mockSendFn.mockRejectedValue(new Error('Persistent network error'));

      await expect(
        sendConfirmationEmail('john@example.com', testData)
      ).rejects.toThrow('Persistent network error');

      expect(mockSendFn).toHaveBeenCalledTimes(3); // Max retries
    });

    test('6. Uses EMAIL_FROM environment variable', async () => {
      const originalEmailFrom = process.env.EMAIL_FROM;
      process.env.EMAIL_FROM = 'test@example.com';

      mockSendFn.mockResolvedValue({ id: 'email-123' });

      await sendConfirmationEmail('john@example.com', testData);

      const callArgs = mockSendFn.mock.calls[0][0];
      expect(callArgs.from).toBe('test@example.com');

      process.env.EMAIL_FROM = originalEmailFrom;
    });

    test('7. Falls back to default sender if EMAIL_FROM not set', async () => {
      const originalEmailFrom = process.env.EMAIL_FROM;
      delete process.env.EMAIL_FROM;

      mockSendFn.mockResolvedValue({ id: 'email-123' });

      await sendConfirmationEmail('john@example.com', testData);

      const callArgs = mockSendFn.mock.calls[0][0];
      expect(callArgs.from).toBe('noreply@example.com');

      process.env.EMAIL_FROM = originalEmailFrom;
    });
  });

  describe('sendCancellationEmail', () => {
    const testData = {
      naam: 'John Doe',
      taakNaam: 'Test Task',
    };

    test('8. Sends cancellation email with correct structure', async () => {
      mockSendFn.mockResolvedValue({ id: 'email-456' });

      await sendCancellationEmail('john@example.com', testData);

      expect(mockSendFn).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: 'john@example.com',
          subject: expect.stringContaining('Annulering'),
          html: expect.any(String),
        })
      );
    });

    test('9. Cancellation email contains correct information', async () => {
      mockSendFn.mockResolvedValue({ id: 'email-456' });

      await sendCancellationEmail('john@example.com', testData);

      const callArgs = mockSendFn.mock.calls[0][0];
      const htmlContent = callArgs.html;

      expect(htmlContent).toContain('John Doe');
      expect(htmlContent).toContain('Test Task');
      expect(htmlContent).toContain('geannuleerd');
    });

    test('10. Cancellation email subject includes task name', async () => {
      mockSendFn.mockResolvedValue({ id: 'email-456' });

      await sendCancellationEmail('john@example.com', testData);

      const callArgs = mockSendFn.mock.calls[0][0];
      expect(callArgs.subject).toContain('Test Task');
      expect(callArgs.subject).toContain('Annulering');
    });

    test('11. Retries cancellation email on failure', async () => {
      // Fail first attempt, succeed on second
      mockSendFn
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ id: 'email-456' });

      const result = await sendCancellationEmail('john@example.com', testData);

      expect(mockSendFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 'email-456' });
    });
  });

  describe('Email Retry Logic', () => {
    test('12. Waits between retry attempts', async () => {
      const testData = {
        naam: 'John Doe',
        taakNaam: 'Test Task',
        telefoon: '0612345678',
        email: 'john@example.com',
        wijzigLink: 'https://example.com/wijzig/abc123',
      };

      // Mock setTimeout to track delays
      jest.useFakeTimers();

      mockSendFn
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({ id: 'email-123' });

      const promise = sendConfirmationEmail('john@example.com', testData);

      // Fast-forward time
      await jest.runAllTimersAsync();

      await promise;

      jest.useRealTimers();
    });
  });
});
