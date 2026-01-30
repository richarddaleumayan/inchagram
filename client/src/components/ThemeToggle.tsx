/**
 * ThemeToggle Component
 * Toggle switch for dark/light mode
 */

import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 3V1M10 19V17M17 10H19M1 10H3M15.657 4.343L17.071 2.929M2.929 17.071L4.343 15.657M15.657 15.657L17.071 17.071M2.929 2.929L4.343 4.343M14 10C14 12.209 12.209 14 10 14C7.791 14 6 12.209 6 10C6 7.791 7.791 6 10 6C12.209 6 14 7.791 14 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 10.5C16.8 14.7 13.3 18 9 18C4.6 18 1 14.4 1 10C1 5.7 4.3 2.2 8.5 2C8.2 2.6 8 3.3 8 4C8 6.2 9.8 8 12 8C12.7 8 13.4 7.8 14 7.5C14.8 10.2 16.5 12.5 18.5 13.8C18.1 12.1 17.6 11.3 17 10.5Z" fill="currentColor"/>
        </svg>
      )}
    </button>
  );
}
