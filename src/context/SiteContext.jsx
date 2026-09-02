import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SiteContext = createContext();

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('sochiot_token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const normalizeList = (data, key) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.data && data.data.data && Array.isArray(data.data.data)) return data.data.data;
  if (key && data[key] && Array.isArray(data[key])) return data[key];
  if (data.results && Array.isArray(data.results)) return data.results;
  return [];
};

export const SiteProvider = ({ children }) => {
  const [sites, setSites] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('scada_sites_db') || '[]');
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    return [];
  });
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sites`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const list = normalizeList(json, 'sites');
        if (list && list.length > 0) {
          setSites(list);
          try { 
            localStorage.setItem('scada_sites_db', JSON.stringify(list));
            localStorage.setItem('tb_sites', JSON.stringify(list));
          } catch(e) {}
          window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: list }));
          setLoading(false);
          return list;
        }
      }
    } catch (err) {
      console.warn('SiteContext fetchSites notice:', err);
    }

    // Fallback to local storage
    try {
      const stored = JSON.parse(localStorage.getItem('scada_sites_db') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        setSites(stored);
        setLoading(false);
        return stored;
      }
    } catch (e) {}
    setLoading(false);
    return [];
  }, []);

  // Broadcast and update state when a site is added
  const addSite = useCallback((newSite) => {
    if (!newSite) return;
    setSites(prev => {
      const updated = [newSite, ...prev.filter(s => String(s.id) !== String(newSite.id))];
      try {
        localStorage.setItem('scada_sites_db', JSON.stringify(updated));
        localStorage.setItem('tb_sites', JSON.stringify(updated));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: updated }));
      window.dispatchEvent(new CustomEvent('bms_site_created', { detail: newSite }));
      return updated;
    });
  }, []);

  // Update existing site
  const updateSite = useCallback((siteId, updates) => {
    if (!siteId) return;
    setSites(prev => {
      const updated = prev.map(s => String(s.id) === String(siteId) ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s);
      try {
        localStorage.setItem('scada_sites_db', JSON.stringify(updated));
        localStorage.setItem('tb_sites', JSON.stringify(updated));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: updated }));
      return updated;
    });
  }, []);

  // Delete site
  const deleteSite = useCallback((siteId) => {
    if (!siteId) return;
    setSites(prev => {
      const updated = prev.filter(s => String(s.id) !== String(siteId));
      try {
        localStorage.setItem('scada_sites_db', JSON.stringify(updated));
        localStorage.setItem('tb_sites', JSON.stringify(updated));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: updated }));
      return updated;
    });
  }, []);

  // Initial fetch and global event listeners
  useEffect(() => {
    fetchSites();

    const handleSitesUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSites(e.detail);
      }
    };

    const handleSiteCreated = (e) => {
      if (e.detail && e.detail.id) {
        setSites(prev => {
          if (prev.some(s => String(s.id) === String(e.detail.id))) return prev;
          const next = [e.detail, ...prev];
          try { localStorage.setItem('scada_sites_db', JSON.stringify(next)); } catch(err) {}
          return next;
        });
      }
    };

    const handleStorage = (e) => {
      if ((e.key === 'scada_sites_db' || e.key === 'tb_sites') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSites(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener('bms_sites_updated', handleSitesUpdated);
    window.addEventListener('bms_site_created', handleSiteCreated);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('bms_sites_updated', handleSitesUpdated);
      window.removeEventListener('bms_site_created', handleSiteCreated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchSites]);

  const activeSites = sites.filter(s => s && s.status !== 'INACTIVE' && s.status !== 'DISABLED' && s.isActive !== false && !s.deletedAt);

  return (
    <SiteContext.Provider
      value={{
        sites,
        setSites,
        activeSites,
        selectedSite,
        setSelectedSite,
        loading,
        fetchSites,
        addSite,
        updateSite,
        deleteSite
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteStore = () => {
  const context = useContext(SiteContext);
  if (!context) {
    // Graceful fallback if called outside provider
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('scada_sites_db') || '[]'); } catch(e) { return []; }
    })();
    return {
      sites: stored,
      activeSites: stored.filter(s => s && s.status !== 'INACTIVE' && s.status !== 'DISABLED' && !s.deletedAt),
      selectedSite: stored[0] || null,
      setSelectedSite: () => {},
      loading: false,
      fetchSites: async () => stored,
      addSite: (site) => {
        const updated = [site, ...stored.filter(s => String(s.id) !== String(site.id))];
        try { 
          localStorage.setItem('scada_sites_db', JSON.stringify(updated));
          localStorage.setItem('tb_sites', JSON.stringify(updated));
        } catch(e) {}
        window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: updated }));
        window.dispatchEvent(new CustomEvent('bms_site_created', { detail: site }));
      },
      updateSite: (siteId, updates) => {
        const updated = stored.map(s => String(s.id) === String(siteId) ? { ...s, ...updates } : s);
        try { localStorage.setItem('scada_sites_db', JSON.stringify(updated)); } catch(e) {}
        window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: updated }));
      },
      deleteSite: (siteId) => {
        const updated = stored.filter(s => String(s.id) !== String(siteId));
        try { localStorage.setItem('scada_sites_db', JSON.stringify(updated)); } catch(e) {}
        window.dispatchEvent(new CustomEvent('bms_sites_updated', { detail: updated }));
      }
    };
  }
  return context;
};

export default SiteContext;
