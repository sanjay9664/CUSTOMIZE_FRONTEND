import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  try {
    return typeof window !== 'undefined' && localStorage.getItem('app_theme') !== 'light';
  } catch {
    return true; // Fallback to dark theme if storage access is denied
  }
};

const slice = createSlice({
  name: 'theme',
  initialState: {
    isDark: getInitialTheme()
  },
  reducers: {
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
    },
    setTheme: (state, action) => {
      state.isDark = Boolean(action.payload);
    }
  }
});

export const { toggleTheme, setTheme } = slice.actions;
export default slice.reducer;
