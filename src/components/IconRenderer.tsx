import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  iconName: string;
  size?: number;
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ iconName, size = 24, className }) => {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
  return <Icon size={size} className={className} />;
};
