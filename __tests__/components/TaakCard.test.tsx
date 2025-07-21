import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaakCard from '@/components/TaakCard';

const mockTaak = {
  id: '1',
  naam: 'Koffie schenken',
  beschrijving: 'Help met koffie schenken na de dienst',
  maxAantal: 5,
  categorie: 'Catering',
  _count: {
    aanmeldingen: 2
  }
};

describe('TaakCard Component', () => {
  test('renders task information correctly', () => {
    render(<TaakCard taak={mockTaak} />);
    
    expect(screen.getByText('Koffie schenken')).toBeInTheDocument();
    expect(screen.getByText('Help met koffie schenken na de dienst')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('2 van 5 plekken bezet')).toBeInTheDocument();
  });

  test('shows progress bar with correct percentage', () => {
    render(<TaakCard taak={mockTaak} />);
    
    const progressBar = screen.getByText('40%');
    expect(progressBar).toBeInTheDocument();
  });

  test('shows "Aanmelden" button when spots available', () => {
    render(<TaakCard taak={mockTaak} />);
    
    const button = screen.getByText('Aanmelden');
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveClass('cursor-not-allowed');
  });

  test('shows "Vol" button when task is full', () => {
    const fullTaak = {
      ...mockTaak,
      _count: {
        aanmeldingen: 5
      }
    };
    
    render(<TaakCard taak={fullTaak} />);
    
    const button = screen.getByText('Vol');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('cursor-not-allowed');
  });

  test('prevents click when task is full', async () => {
    const user = userEvent.setup();
    const fullTaak = {
      ...mockTaak,
      _count: {
        aanmeldingen: 5
      }
    };
    
    render(<TaakCard taak={fullTaak} />);
    
    const button = screen.getByText('Vol');
    await user.click(button);
    
    // Should not navigate (href="#")
    expect(window.location.hash).toBe('');
  });

  test('applies correct color based on capacity', () => {
    // Test different capacity levels
    const scenarios = [
      { count: 1, expected: 'bg-primary' }, // 20% - primary
      { count: 4, expected: 'bg-warning' }, // 80% - warning
      { count: 5, expected: 'bg-danger' },  // 100% - danger
    ];
    
    scenarios.forEach(({ count, expected }) => {
      const { container } = render(
        <TaakCard taak={{ ...mockTaak, _count: { aanmeldingen: count } }} />
      );
      
      const progressBar = container.querySelector('.transition-all');
      expect(progressBar).toHaveClass(expected);
    });
  });
});