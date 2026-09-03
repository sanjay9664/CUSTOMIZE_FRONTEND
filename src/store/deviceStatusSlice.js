import { createSlice } from '@reduxjs/toolkit';
const slice = createSlice({ name: 'deviceStatus', initialState: { deviceStatuses: {}, gatewayStatuses: {} }, reducers: { setDeviceStatus: (s, a) => { s.deviceStatuses[a.payload.id] = a.payload.online; }, setGatewayStatus: (s, a) => { s.gatewayStatuses[a.payload.id] = a.payload.online; } } });
export const { setDeviceStatus, setGatewayStatus } = slice.actions;
export default slice.reducer;
