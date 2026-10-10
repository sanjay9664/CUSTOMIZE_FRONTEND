import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bmsService } from '../services/bmsService.js';
import { normalizeList } from '../services/apiClient.js';
import { getAuthToken } from '../utils/cookieUtils.js';
import { fetchUserLocationHierarchy } from '../services/sochiotLocationService.js';

const getInitialSites = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('scada_sites_db') || '[]');
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch (e) {}
  return [];
};

const getInitialSelectedSite = () => {
  try {
    const stored = localStorage.getItem('scada_selected_site');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.id ?? parsed.siteId ?? parsed._id)) return parsed;
    }
  } catch (e) {}
  return null;
};

const getInitialLocationScope = () => {
  try {
    const stored = localStorage.getItem('global_location_scope');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export const fetchSitesThunk = createAsyncThunk('site/fetchSites', async (_, { rejectWithValue }) => {
  const token = getAuthToken();
  if (!token) return [];
  try {
    const res = await bmsService.getSites().catch(() => null);
    const list = normalizeList(res, 'sites');
    if (list && list.length > 0) {
      try {
        localStorage.setItem('scada_sites_db', JSON.stringify(list));
        localStorage.setItem('tb_sites', JSON.stringify(list));
      } catch (e) {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: list }));
      }
      return list;
    }
  } catch (err) {
    console.warn('[siteSlice] fetchSitesThunk notice:', err);
  }

  // Fallback to local storage
  try {
    const stored = JSON.parse(localStorage.getItem('scada_sites_db') || '[]');
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
  } catch (e) {}
  return [];
});

export const loadSochiotHierarchyThunk = createAsyncThunk('site/loadHierarchy', async (forceRefresh = false) => {
  try {
    const data = await fetchUserLocationHierarchy(forceRefresh);
    return data;
  } catch (err) {
    console.warn('[siteSlice] loadSochiotHierarchyThunk error:', err);
    return null;
  }
});

const initialState = {
  sites: getInitialSites(),
  selectedSite: getInitialSelectedSite(),
  loading: false,
  error: null,
  sochiotUserLocation: null,
  currentLocation: getInitialLocationScope(),
  locationHierarchy: [],
  preferredLocation: null
};

const siteSlice = createSlice({
  name: 'site',
  initialState,
  reducers: {
    setSelectedSiteAction: (state, action) => {
      const site = action.payload;
      state.selectedSite = site;
      try {
        if (site) {
          localStorage.setItem('scada_selected_site', JSON.stringify(site));
          const siteId = String(site.id ?? site.siteId ?? site._id ?? '');
          if (siteId) {
            localStorage.setItem('selected_main_meter_site_id', siteId);
            localStorage.setItem('selected_sub_meter_site_id', siteId);
            localStorage.setItem('selected_energy_overview_site_id', siteId);
            localStorage.setItem('selected_dg_site_id', siteId);
            localStorage.setItem('motors_selected_site', siteId);
            localStorage.setItem('selected_site_id', siteId);
          }
        } else {
          localStorage.removeItem('scada_selected_site');
        }
      } catch (e) {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bms_site_changed', { detail: site }));
      }
    },
    setSitesAction: (state, action) => {
      state.sites = action.payload || [];
      try {
        localStorage.setItem('scada_sites_db', JSON.stringify(state.sites));
        localStorage.setItem('tb_sites', JSON.stringify(state.sites));
      } catch (e) {}
    },
    addSiteAction: (state, action) => {
      const newSite = action.payload;
      if (!newSite) return;
      state.sites = [newSite, ...state.sites.filter(s => String(s.id) !== String(newSite.id))];
      try {
        localStorage.setItem('scada_sites_db', JSON.stringify(state.sites));
        localStorage.setItem('tb_sites', JSON.stringify(state.sites));
      } catch (e) {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: state.sites }));
        window.dispatchEvent(new CustomEvent('bms_site_created', { detail: newSite }));
      }
    },
    updateSiteAction: (state, action) => {
      const { siteId, updates } = action.payload || {};
      if (!siteId) return;
      state.sites = state.sites.map(s => String(s.id) === String(siteId) ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s);
      try {
        localStorage.setItem('scada_sites_db', JSON.stringify(state.sites));
        localStorage.setItem('tb_sites', JSON.stringify(state.sites));
      } catch (e) {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: state.sites }));
      }
    },
    deleteSiteAction: (state, action) => {
      const siteId = action.payload;
      if (!siteId) return;
      state.sites = state.sites.filter(s => String(s.id) !== String(siteId));
      try {
        localStorage.setItem('scada_sites_db', JSON.stringify(state.sites));
        localStorage.setItem('tb_sites', JSON.stringify(state.sites));
      } catch (e) {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: state.sites }));
      }
    },
    setCurrentLocationScopeAction: (state, action) => {
      const locationObj = action.payload;
      state.currentLocation = locationObj;
      if (locationObj?.path) {
        state.locationHierarchy = locationObj.path;
      }
      try {
        if (locationObj) {
          localStorage.setItem('global_location_scope', JSON.stringify(locationObj));
        } else {
          localStorage.removeItem('global_location_scope');
        }
      } catch (e) {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bms_location_scope_changed', { detail: locationObj }));
      }
    },
    setSochiotUserLocationAction: (state, action) => {
      state.sochiotUserLocation = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSitesThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSitesThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.sites = action.payload;
          // Synchronize selectedSite if not set or invalid
          const active = state.sites.filter(s => s && s.status !== 'INACTIVE' && s.status !== 'DISABLED' && s.isActive !== false && !s.deletedAt);
          if (active.length > 0) {
            const currentId = state.selectedSite ? String(state.selectedSite.id ?? state.selectedSite.siteId ?? state.selectedSite._id ?? '') : '';
            const match = active.find(s => String(s.id ?? s.siteId ?? s._id ?? '') === currentId);
            if (!match) {
              state.selectedSite = active[0];
              try {
                localStorage.setItem('scada_selected_site', JSON.stringify(active[0]));
              } catch (e) {}
            }
          }
        }
      })
      .addCase(fetchSitesThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(loadSochiotHierarchyThunk.fulfilled, (state, action) => {
        const data = action.payload;
        if (data?.userZoneLocationVO) {
          state.sochiotUserLocation = data.userZoneLocationVO;
          if (data.preferredZoneNodeId && data.preferredZoneNodeType) {
            state.preferredLocation = {
              nodeType: data.preferredZoneNodeType,
              nodeId: data.preferredZoneNodeId,
              parentHierarchy: data.preferredLocationParentHierarchy
            };
          }
        }
      });
  }
});

export const {
  setSelectedSiteAction,
  setSitesAction,
  addSiteAction,
  updateSiteAction,
  deleteSiteAction,
  setCurrentLocationScopeAction,
  setSochiotUserLocationAction
} = siteSlice.actions;

export default siteSlice.reducer;
