import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSitesThunk,
  setSelectedSiteAction,
  setSitesAction,
  addSiteAction,
  updateSiteAction,
  deleteSiteAction,
  setCurrentLocationScopeAction,
  setSochiotUserLocationAction,
  loadSochiotHierarchyThunk
} from '../store/siteSlice.js';

export const useSiteStore = () => {
  const dispatch = useDispatch();
  const siteState = useSelector((state) => state.site);
  const {
    sites = [],
    selectedSite = null,
    loading = false,
    sochiotUserLocation = null,
    currentLocation = null,
    locationHierarchy = [],
    preferredLocation = null
  } = siteState || {};

  const activeSites = useMemo(() => {
    return (sites || []).filter(
      (s) => s && s.status !== 'INACTIVE' && s.status !== 'DISABLED' && s.isActive !== false && !s.deletedAt
    );
  }, [sites]);

  const setSelectedSite = useCallback((site) => {
    dispatch(setSelectedSiteAction(site));
  }, [dispatch]);

  const setSites = useCallback((siteList) => {
    dispatch(setSitesAction(siteList));
  }, [dispatch]);

  const fetchSites = useCallback(async () => {
    const result = await dispatch(fetchSitesThunk()).unwrap().catch(() => []);
    return result;
  }, [dispatch]);

  const addSite = useCallback((newSite) => {
    dispatch(addSiteAction(newSite));
  }, [dispatch]);

  const updateSite = useCallback((siteId, updates) => {
    dispatch(updateSiteAction({ siteId, updates }));
  }, [dispatch]);

  const deleteSite = useCallback((siteId) => {
    dispatch(deleteSiteAction(siteId));
  }, [dispatch]);

  const loadSochiotHierarchy = useCallback(async (forceRefresh = false) => {
    return dispatch(loadSochiotHierarchyThunk(forceRefresh)).unwrap().catch(() => null);
  }, [dispatch]);

  const setCurrentLocationScope = useCallback((loc) => {
    dispatch(setCurrentLocationScopeAction(loc));
  }, [dispatch]);

  const setSochiotUserLocation = useCallback((loc) => {
    dispatch(setSochiotUserLocationAction(loc));
  }, [dispatch]);

  return {
    sites,
    setSites,
    activeSites,
    selectedSite,
    setSelectedSite,
    loading,
    fetchSites,
    addSite,
    updateSite,
    deleteSite,
    sochiotUserLocation,
    setSochiotUserLocation,
    currentLocation,
    locationHierarchy,
    preferredLocation,
    loadSochiotHierarchy,
    setCurrentLocationScope
  };
};

export const useLocationScope = () => {
  const store = useSiteStore();
  return {
    sochiotUserLocation: store.sochiotUserLocation,
    currentLocation: store.currentLocation,
    locationHierarchy: store.locationHierarchy,
    preferredLocation: store.preferredLocation,
    loadSochiotHierarchy: store.loadSochiotHierarchy,
    setCurrentLocationScope: store.setCurrentLocationScope
  };
};

export default useSiteStore;
