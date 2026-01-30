/**
 * Logo Component
 * Displays the Inchagram logo with theme-aware switching
 */

import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Logo({ size = 'medium', className = '' }: LogoProps) {
  const { theme } = useTheme();

  const sizes = {
    small: { height: '32px' },
    medium: { height: '48px' },
    large: { height: '80px' }
  };

  return (
    <img
      src={theme === 'light' ? '/inchagram_logo_light.png' : '/inchagram_logo_dark.png'}
      alt="Inchagram"
      style={sizes[size]}
      className={className}
    />
  );
}
