import { createSlice } from '@reduxjs/toolkit';
const slice = createSlice({ name: 'theme', initialState: { isDark: localStorage.getItem('app_theme') !== 'light' }, reducers: { toggleTheme: (s) => { s.isDark = !s.isDark; } } });
export const { toggleTheme } = slice.actions;
export default slice.reducer;
