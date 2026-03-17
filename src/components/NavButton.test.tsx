import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrendingUp } from 'lucide-react';
import { NavButton } from './NavButton';

describe('NavButton', () => {
  const mockOnClick = vi.fn();
  const icon = <TrendingUp />;

  afterEach(() => {
    mockOnClick.mockClear();
  });

  it('renders button with label and icon', () => {
    render(<NavButton active={false} onClick={mockOnClick} icon={icon} label="Dashboard" />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('applies active styles when active is true', () => {
    render(<NavButton active={true} onClick={mockOnClick} icon={icon} label="Dashboard" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-emerald-600');
  });

  it('applies inactive styles when active is false', () => {
    render(<NavButton active={false} onClick={mockOnClick} icon={icon} label="Dashboard" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-slate-400');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    render(<NavButton active={false} onClick={mockOnClick} icon={icon} label="Dashboard" />);

    await user.click(screen.getByRole('button'));

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
