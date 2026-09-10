import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme as toggle } from '../store/themeSlice';

export const ThemeProvider = ({ children }) => {
  const isDark = useSelector((state) => state.theme.isDark);

  useEffect(() => {
    const themeStr = isDark ? 'dark' : 'light';
    localStorage.setItem('app_theme', themeStr);
    
    if (isDark) {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDark]);

  return children;
};

export const useTheme = () => {
  const dispatch = useDispatch();
  const isDark = useSelector((state) => state.theme.isDark);
  return { isDark, toggleTheme: () => dispatch(toggle()) };
};

