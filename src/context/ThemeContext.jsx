import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme as toggle } from '../store/themeSlice';
export const ThemeProvider = ({ children }) => { const isDark = useSelector((state) => state.theme.isDark); useEffect(() => { localStorage.setItem('app_theme', isDark ? 'dark' : 'light'); document.body.classList.toggle('light-mode', !isDark); }, [isDark]); return children; };
export const useTheme = () => { const dispatch = useDispatch(); const isDark = useSelector((state) => state.theme.isDark); return { isDark, toggleTheme: () => dispatch(toggle()) }; };
