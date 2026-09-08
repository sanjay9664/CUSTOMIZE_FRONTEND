import { createSlice } from '@reduxjs/toolkit';

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const isValidKey = (key) => {
  if (key === null || key === undefined) return false;
  const str = String(key).trim();
  return str.length > 0 && !DANGEROUS_KEYS.has(str);
};

const initialState = {
  deviceStatuses: {},
  gatewayStatuses: {}
};

const slice = createSlice({
  name: 'deviceStatus',
  initialState,
  reducers: {
    setDeviceStatus: (state, action) => {
      const { id, online } = action.payload || {};
      if (isValidKey(id)) {
        state.deviceStatuses[String(id)] = Boolean(online);
      }
    },
    setGatewayStatus: (state, action) => {
      const { id, online } = action.payload || {};
      if (isValidKey(id)) {
        state.gatewayStatuses[String(id)] = Boolean(online);
      }
    },
    resetDeviceStatuses: (state) => {
      state.deviceStatuses = {};
      state.gatewayStatuses = {};
    }
  },
  extraReducers: (builder) => {
    // Purge operational device status data on session logout to prevent cross-tenant/user leaks
    builder.addCase('auth/logout', (state) => {
      state.deviceStatuses = {};
      state.gatewayStatuses = {};
    });
  }
});

export const { setDeviceStatus, setGatewayStatus, resetDeviceStatuses } = slice.actions;
export default slice.reducer;
