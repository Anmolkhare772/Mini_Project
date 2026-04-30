import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize from: localStorage → system preference → dark default
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#121318' : '#f4f7fa');
    }
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually overridden
      const userOverride = localStorage.getItem('theme_manual');
      if (!userOverride) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsTransitioning(true);
    // Mark that user manually chose a theme
    localStorage.setItem('theme_manual', 'true');
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    // Allow CSS transitions to complete
    setTimeout(() => setIsTransitioning(false), 600);
  }, []);

  const setSystemDefault = useCallback(() => {
    localStorage.removeItem('theme_manual');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isTransitioning, setSystemDefault }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
