/**
 * Unit tests for AanmeldForm component
 * Tests rendering, validation, form submission, loading states,
 * success/error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AanmeldForm from '@/components/AanmeldForm';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AanmeldForm Component', () => {
  const defaultProps = {
    taakId: 'task-1',
    taakNaam: 'Test Task',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    test('1. Renders all form fields', () => {
      render(<AanmeldForm {...defaultProps} />);

      expect(screen.getByLabelText(/naam/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/telefoon/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/opmerking/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /aanmelden/i })).toBeInTheDocument();
    });

    test('2. All required fields are marked as required', () => {
      render(<AanmeldForm {...defaultProps} />);

      const naamInput = screen.getByLabelText(/naam/i);
      const emailInput = screen.getByLabelText(/email/i);
      const telefoonInput = screen.getByLabelText(/telefoon/i);
      const opmerkingInput = screen.getByLabelText(/opmerking/i);

      expect(naamInput).toBeRequired();
      expect(emailInput).toBeRequired();
      expect(telefoonInput).toBeRequired();
      expect(opmerkingInput).not.toBeRequired();
    });

    test('3. Phone field has correct placeholder and pattern', () => {
      render(<AanmeldForm {...defaultProps} />);

      const telefoonInput = screen.getByLabelText(/telefoon/i) as HTMLInputElement;

      expect(telefoonInput.placeholder).toBe('06-12345678');
      expect(telefoonInput.pattern).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    test('4. Validates email format using HTML5 validation', () => {
      render(<AanmeldForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      expect(emailInput.type).toBe('email');
    });

    test('5. Shows error message when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Deze taak is vol' }),
      });

      render(<AanmeldForm {...defaultProps} />);

      const naamInput = screen.getByLabelText(/naam/i);
      const emailInput = screen.getByLabelText(/email/i);
      const telefoonInput = screen.getByLabelText(/telefoon/i);
      const submitButton = screen.getByRole('button', { name: /aanmelden/i });

      await userEvent.type(naamInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(telefoonInput, '0612345678');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/deze taak is vol/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('6. Submits form with correct data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Aanmelding succesvol' }),
      });

      render(<AanmeldForm {...defaultProps} />);

      const naamInput = screen.getByLabelText(/naam/i);
      const emailInput = screen.getByLabelText(/email/i);
      const telefoonInput = screen.getByLabelText(/telefoon/i);
      const opmerkingInput = screen.getByLabelText(/opmerking/i);
      const submitButton = screen.getByRole('button', { name: /aanmelden/i });

      await userEvent.type(naamInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(telefoonInput, '0612345678');
      await userEvent.type(opmerkingInput, 'Test opmerking');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/aanmelden', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taakId: 'task-1',
            naam: 'John Doe',
            email: 'john@example.com',
            telefoon: '0612345678',
            opmerking: 'Test opmerking',
          }),
        });
      });
    });

    test('7. Redirects to confirmation page on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Aanmelding succesvol' }),
      });

      render(<AanmeldForm {...defaultProps} />);

      const naamInput = screen.getByLabelText(/naam/i);
      const emailInput = screen.getByLabelText(/email/i);
      const telefoonInput = screen.getByLabelText(/telefoon/i);
      const submitButton = screen.getByRole('button', { name: /aanmelden/i });

      await userEvent.type(naamInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(telefoonInput, '0612345678');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/bevestiging');
      });
    });
  });

  describe('Loading State', () => {
    test('8. Shows loading state during submission', async () => {
      // Create a promise we can control
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

      render(<AanmeldForm {...defaultProps} />);

      const naamInput = screen.getByLabelText(/naam/i);
      const emailInput = screen.getByLabelText(/email/i);
      const telefoonInput = screen.getByLabelText(/telefoon/i);
      const submitButton = screen.getByRole('button', { name: /aanmelden/i });

      await userEvent.type(naamInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(telefoonInput, '0612345678');
      await userEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/bezig met aanmelden/i)).toBeInTheDocument();
      });

      // Button should be disabled
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true }),
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test('9. Disables submit button during loading', async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

      render(<AanmeldForm {...defaultProps} />);

      const naamInput = screen.getByLabelText(/naam/i);
      const emailInput = screen.getByLabelText(/email/i);
      const telefoonInput = screen.getByLabelText(/telefoon/i);
      const submitButton = screen.getByRole('button', { name: /aanmelden/i });

      await userEvent.type(naamInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(telefoonInput, '0612345678');

      // Initially enabled
      expect(submitButton).not.toBeDisabled();

      await userEvent.click(submitButton);

      // Should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });

  describe('Error Handling', () => {
    test('10. Displays error message from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Je bent al aangemeld voor deze taak' }),
      });

      render(<AanmeldForm {...defaultProps} />);

      const naamInput = screen.getByLabelText(/naam/i);
      const emailInput = screen.getByLabelText(/email/i);
      const telefoonInput = screen.getByLabelText(/telefoon/i);
      const submitButton = screen.getByRole('button', { name: /aanmelden/i });

      await userEvent.type(naamInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(telefoonInput, '0612345678');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/je bent al aangemeld/i)).toBeInTheDocument();
      });

      // Error should have alert role
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });

    test('11. Handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<AanmeldForm {...defaultProps} />);

      const naamInput = screen.getByLabelText(/naam/i);
      const emailInput = screen.getByLabelText(/email/i);
      const telefoonInput = screen.getByLabelText(/telefoon/i);
      const submitButton = screen.getByRole('button', { name: /aanmelden/i });

      await userEvent.type(naamInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(telefoonInput, '0612345678');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('12. Clears previous error when submitting again', async () => {
      // First submission fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Error 1' }),
      });

      render(<AanmeldForm {...defaultProps} />);

      const naamInput = screen.getByLabelText(/naam/i);
      const emailInput = screen.getByLabelText(/email/i);
      const telefoonInput = screen.getByLabelText(/telefoon/i);
      const submitButton = screen.getByRole('button', { name: /aanmelden/i });

      await userEvent.type(naamInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(telefoonInput, '0612345678');
      await userEvent.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Error 1')).toBeInTheDocument();
      });

      // Second submission succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Submit again
      await userEvent.click(submitButton);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Error 1')).not.toBeInTheDocument();
      });
    });
  });
});
