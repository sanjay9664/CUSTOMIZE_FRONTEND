import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import theme from './themeSlice';
import deviceStatus from './deviceStatusSlice';

export const store = configureStore({ reducer: { auth, theme, deviceStatus }, devTools: import.meta.env.DEV });
