import { render } from '@testing-library/react';
import { IconRenderer } from './IconRenderer';

describe('IconRenderer', () => {
  it('renders specified icon by name', () => {
    const { container } = render(<IconRenderer iconName="Wallet" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders HelpCircle icon for unknown icon name', () => {
    const { container } = render(<IconRenderer iconName="UnknownIcon" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom size', () => {
    const { container } = render(<IconRenderer iconName="Wallet" size={48} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('applies custom className', () => {
    const { container } = render(<IconRenderer iconName="Wallet" className="text-blue-500" />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-blue-500');
  });
});
