import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Modal, InputGroup, Spinner, Alert, Nav } from 'react-bootstrap';
import {
  Building2, Building, MapPin, Globe, Shield, Plus, Search, Edit3, Trash2,
  CheckCircle, XCircle, RefreshCw, Eye, Layers, Settings, ChevronRight, Activity,
  Sliders, Calendar, Award, Zap, AlertTriangle, Phone, Mail, ArrowLeft
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  let token = localStorage.getItem('token') || 
              localStorage.getItem('sochiot_token') || 
              localStorage.getItem('auth_token') || 
              localStorage.getItem('access_token') || '';
              
  if (!token || token === 'undefined' || token === 'null') {
    token = 'bms-dev-token-admin';
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ManageOrganisation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab State: 'company' | 'tenant' | 'zone' | 'area'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (['company', 'tenant', 'zone', 'area'].includes(tabParam)) return tabParam;
    return 'company';
  });

  // Data States
  const [companies, setCompanies] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');

  // Modals state
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);

  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedTenantForFeatures, setSelectedTenantForFeatures] = useState(null);

  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedTenantForSub, setSelectedTenantForSub] = useState(null);

  const [showCompanyTenantsModal, setShowCompanyTenantsModal] = useState(false);
  const [companyTenantsList, setCompanyTenantsList] = useState([]);
  const [selectedCompanyForTenants, setSelectedCompanyForTenants] = useState(null);

  // Forms Data
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [tenantForm, setTenantForm] = useState({
    companyId: '',
    name: '',
    serverUrl: '',
    orgType: 'Company',
    description: '',
    email: '',
    phone: '',
    sochiotOrgId: '',
    subscription: 'BASIC',
    addAddress: false,
    addressLine: '',
    country: 'India',
    state: 'Uttar Pradesh',
    city: 'Noida',
    zipCode: ''
  });
  const [zoneForm, setZoneForm] = useState({
    tenantId: '', name: '', region: '', timezone: 'Asia/Kolkata', country: 'India', description: ''
  });
  const [areaForm, setAreaForm] = useState({ tenantId: '', zoneId: '', name: '', description: '' });

  const [featuresForm, setFeaturesForm] = useState({ alarm: true, reports: true, dpr: true, telemetry: true });
  const [subForm, setSubForm] = useState({ subscription: 'BASIC', subscriptionPeriod: 'ANNUALLY', licenseValidity: '' });

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Sync tab with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['company', 'tenant', 'zone', 'area'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Fetch Companies
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/companies`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setCompanies(json.data || json.companies || (Array.isArray(json) ? json : []));
      }
    } catch (err) {
      console.warn('Companies fetch err:', err);
    }
  }, []);

  // Fetch Tenants / Organizations
  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tenants`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTenants(json.data || json.tenants || (Array.isArray(json) ? json : []));
      }
    } catch (err) {
      console.warn('Tenants fetch err:', err);
    }
  }, []);

  // Fetch Geographic Zones
  const fetchZones = useCallback(async () => {
    try {
      const url = selectedTenantFilter !== 'ALL' 
        ? `${API_BASE_URL}/zones?tenantId=${selectedTenantFilter}` 
        : `${API_BASE_URL}/zones`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setZones(json.data || json.zones || (Array.isArray(json) ? json : []));
      }
    } catch (err) {
      console.warn('Zones fetch err:', err);
    }
  }, [selectedTenantFilter]);

  // Fetch Tenant Areas
  const fetchAreas = useCallback(async () => {
    try {
      let url = `${API_BASE_URL}/areas`;
      const query = [];
      if (selectedZoneFilter !== 'ALL') query.push(`zoneId=${selectedZoneFilter}`);
      if (selectedTenantFilter !== 'ALL') query.push(`tenantId=${selectedTenantFilter}`);
      if (query.length) url += `?${query.join('&')}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setAreas(json.data || json.areas || (Array.isArray(json) ? json : []));
      }
    } catch (err) {
      console.warn('Areas fetch err:', err);
    }
  }, [selectedZoneFilter, selectedTenantFilter]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCompanies(), fetchTenants(), fetchZones(), fetchAreas()]);
    setLoading(false);
  }, [fetchCompanies, fetchTenants, fetchZones, fetchAreas]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle Tab Switch
  const handleTabSelect = (key) => {
    setActiveTab(key);
    navigate(`/manage-organisation?tab=${key}`, { replace: true });
  };

  // ================= COMPANY ACTIONS =================
  const handleOpenCreateCompany = () => {
    setEditingCompany(null);
    setCompanyForm({ name: '', email: '', phone: '', address: '' });
    setShowCompanyModal(true);
  };

  const handleOpenEditCompany = (cmp) => {
    setEditingCompany(cmp);
    setCompanyForm({
      name: cmp.name || '',
      email: cmp.email || '',
      phone: cmp.phone || '',
      address: cmp.address || ''
    });
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.name) return showToast('danger', 'Company Name is required.');
    setLoading(true);

    try {
      const url = editingCompany ? `${API_BASE_URL}/companies/${editingCompany.id}` : `${API_BASE_URL}/companies`;
      const method = editingCompany ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(companyForm)
      });

      if (res.ok) {
        showToast('success', `Company ${editingCompany ? 'updated' : 'created'} successfully!`);
        setShowCompanyModal(false);
        fetchCompanies();
      } else {
        const errJson = await res.json();
        showToast('danger', errJson.message || 'Failed to save company');
      }
    } catch (err) {
      showToast('danger', 'Server error while saving company');
    }
    setLoading(false);
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/companies/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Company deleted successfully!');
        fetchCompanies();
      } else {
        const json = await res.json();
        showToast('danger', json.message || 'Failed to delete company');
      }
    } catch (err) {
      showToast('danger', 'Server error during deletion');
    }
    setLoading(false);
  };

  const handleViewCompanyTenants = async (cmp) => {
    setSelectedCompanyForTenants(cmp);
    try {
      const res = await fetch(`${API_BASE_URL}/companies/${cmp.id}/tenants`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setCompanyTenantsList(json.data || json.tenants || (Array.isArray(json) ? json : []));
        setShowCompanyTenantsModal(true);
      }
    } catch (err) {
      showToast('danger', 'Failed to fetch tenants for company');
    }
  };

  // ================= TENANT (ORGANIZATION) ACTIONS =================
  const handleOpenCreateTenant = () => {
    setEditingTenant(null);
    setTenantForm({
      companyId: companies[0]?.id || '',
      name: '',
      serverUrl: '',
      orgType: 'Company',
      description: '',
      email: '',
      phone: '',
      sochiotOrgId: '',
      subscription: 'BASIC',
      addAddress: false,
      addressLine: '',
      country: 'India',
      state: 'Uttar Pradesh',
      city: 'Noida',
      zipCode: ''
    });
    setShowTenantModal(true);
  };

  const handleOpenEditTenant = (tn) => {
    setEditingTenant(tn);
    setTenantForm({
      companyId: tn.companyId || companies[0]?.id || '',
      name: tn.name || '',
      serverUrl: tn.serverUrl || '',
      orgType: tn.orgType || 'Company',
      description: tn.description || '',
      email: tn.email || '',
      phone: tn.phone || '',
      sochiotOrgId: tn.sochiotOrgId || '',
      subscription: tn.subscription || 'BASIC',
      addAddress: Boolean(tn.address),
      addressLine: tn.address || '',
      country: tn.country || 'India',
      state: tn.state || 'Uttar Pradesh',
      city: tn.city || 'Noida',
      zipCode: tn.zipCode || ''
    });
    setShowTenantModal(true);
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    if (!tenantForm.name) return showToast('danger', 'Organization name is required');
    setLoading(true);

    try {
      const url = editingTenant ? `${API_BASE_URL}/tenants/${editingTenant.id}` : `${API_BASE_URL}/tenants`;
      const method = editingTenant ? 'PATCH' : 'POST';

      const computedEmail = tenantForm.email && tenantForm.email.includes('@') 
        ? tenantForm.email.trim() 
        : `admin_${Date.now().toString().slice(-6)}@${tenantForm.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'org'}.com`;

      const fullAddress = tenantForm.addAddress 
        ? [tenantForm.addressLine, tenantForm.city, tenantForm.state, tenantForm.country, tenantForm.zipCode].filter(Boolean).join(', ')
        : tenantForm.addressLine || '';

      let resolvedCompanyId = tenantForm.companyId;
      if (!resolvedCompanyId || resolvedCompanyId.trim() === '') {
        if (companies && companies.length > 0 && companies[0].id) {
          resolvedCompanyId = companies[0].id;
        } else {
          resolvedCompanyId = 'cmshedsjg0001zsvnof6omhaw';
        }
      }

      let resolvedSochiotOrgId = Number(tenantForm.sochiotOrgId);
      if (!tenantForm.sochiotOrgId || isNaN(resolvedSochiotOrgId) || resolvedSochiotOrgId <= 0) {
        resolvedSochiotOrgId = Math.floor(Math.random() * 900) + 100;
      }

      const payload = {
        companyId: resolvedCompanyId,
        name: tenantForm.name.trim(),
        email: computedEmail,
        phone: tenantForm.phone ? tenantForm.phone.trim() : '+91-1234567890',
        address: fullAddress || 'Sector 63, Noida',
        sochiotOrgId: resolvedSochiotOrgId,
        subscription: tenantForm.subscription || 'BASIC'
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('success', `Organization ${editingTenant ? 'updated' : 'created'} successfully!`);
        setEditingTenant(null);
        setShowTenantModal(false);
        fetchTenants();
      } else {
        let errorMsg = 'Failed to save organization';
        try {
          const errJson = await res.json();
          if (errJson.errors && Array.isArray(errJson.errors)) {
            errorMsg = errJson.errors.map(e => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', ');
          } else if (errJson.error?.message) {
            errorMsg = errJson.error.message;
          } else if (errJson.message) {
            errorMsg = errJson.message;
          }
        } catch (e) {}
        showToast('danger', errorMsg);
      }
    } catch (err) {
      showToast('danger', 'Server error while saving organization');
    }
    setLoading(false);
  };

  const handleDeleteTenant = async (id) => {
    if (!window.confirm('Soft delete this organization? Zones and Areas will be inactivated.')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Organization soft-deleted!');
        fetchTenants();
      } else {
        const json = await res.json();
        showToast('danger', json.message || 'Failed to delete tenant');
      }
    } catch (err) {
      showToast('danger', 'Error deleting tenant');
    }
    setLoading(false);
  };

  const handleReactivateTenant = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/${id}/reactivate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Organization reactivated!');
        fetchTenants();
      } else {
        const json = await res.json();
        showToast('danger', json.message || 'Failed to reactivate tenant');
      }
    } catch (err) {
      showToast('danger', 'Error reactivating tenant');
    }
    setLoading(false);
  };

  const handleOpenFeaturesModal = (tn) => {
    setSelectedTenantForFeatures(tn);
    const existing = typeof tn.features === 'object' ? tn.features : {};
    setFeaturesForm({
      alarm: existing.alarm !== false,
      reports: existing.reports !== false,
      dpr: existing.dpr !== false,
      telemetry: existing.telemetry !== false
    });
    setShowFeaturesModal(true);
  };

  const handleSaveFeatures = async (e) => {
    e.preventDefault();
    if (!selectedTenantForFeatures) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/${selectedTenantForFeatures.id}/features`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ features: featuresForm })
      });
      if (res.ok) {
        showToast('success', 'Tenant feature permissions updated!');
        setShowFeaturesModal(false);
        fetchTenants();
      } else {
        const json = await res.json();
        showToast('danger', json.message || 'Failed to update features');
      }
    } catch (err) {
      showToast('danger', 'Error updating features');
    }
    setLoading(false);
  };

  const handleOpenSubModal = (tn) => {
    setSelectedTenantForSub(tn);
    setSubForm({
      subscription: tn.subscription || 'BASIC',
      subscriptionPeriod: tn.subscriptionPeriod || 'YEARLY',
      licenseValidity: tn.licenseValidity ? tn.licenseValidity.substring(0, 10) : ''
    });
    setShowSubModal(true);
  };

  const handleSaveSub = async (e) => {
    e.preventDefault();
    if (!selectedTenantForSub) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/${selectedTenantForSub.id}/subscription`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(subForm)
      });
      if (res.ok) {
        showToast('success', 'Tenant subscription updated successfully!');
        setShowSubModal(false);
        fetchTenants();
      } else {
        const json = await res.json();
        showToast('danger', json.message || 'Failed to update subscription');
      }
    } catch (err) {
      showToast('danger', 'Error updating subscription');
    }
    setLoading(false);
  };

  // ================= ZONE ACTIONS =================
  const handleOpenCreateZone = () => {
    setEditingZone(null);
    setZoneForm({
      tenantId: tenants[0]?.id || '',
      name: '',
      region: '',
      timezone: 'Asia/Kolkata',
      country: 'India',
      description: ''
    });
    setShowZoneModal(true);
  };

  const handleOpenEditZone = (z) => {
    setEditingZone(z);
    setZoneForm({
      tenantId: z.tenantId || '',
      name: z.name || '',
      region: z.region || '',
      timezone: z.timezone || 'Asia/Kolkata',
      country: z.country || 'India',
      description: z.description || ''
    });
    setShowZoneModal(true);
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!zoneForm.name || !zoneForm.tenantId) return showToast('danger', 'Zone name and Tenant ID are required');
    setLoading(true);

    try {
      const url = editingZone 
        ? `${API_BASE_URL}/zones/${editingZone.id}` 
        : `${API_BASE_URL}/tenants/${zoneForm.tenantId}/zones`;
      const method = editingZone ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(zoneForm)
      });

      if (res.ok) {
        showToast('success', `Geographic Zone ${editingZone ? 'updated' : 'created'} successfully!`);
        setShowZoneModal(false);
        fetchZones();
      } else {
        const errJson = await res.json();
        showToast('danger', errJson.message || 'Failed to save zone');
      }
    } catch (err) {
      showToast('danger', 'Server error while saving zone');
    }
    setLoading(false);
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm('Delete this zone? Associated areas will also be inactivated.')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/zones/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Zone deleted!');
        fetchZones();
      } else {
        const json = await res.json();
        showToast('danger', json.message || 'Failed to delete zone');
      }
    } catch (err) {
      showToast('danger', 'Error deleting zone');
    }
    setLoading(false);
  };

  const handleReactivateZone = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/zones/${id}/reactivate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Zone reactivated!');
        fetchZones();
      } else {
        const json = await res.json();
        showToast('danger', json.message || 'Failed to reactivate zone');
      }
    } catch (err) {
      showToast('danger', 'Error reactivating zone');
    }
    setLoading(false);
  };

  // ================= AREA ACTIONS =================
  const handleOpenCreateArea = () => {
    setEditingArea(null);
    const initialTenant = tenants[0]?.id || '';
    const initialZone = zones.find(z => z.tenantId === initialTenant)?.id || zones[0]?.id || '';
    setAreaForm({
      tenantId: initialTenant,
      zoneId: initialZone,
      name: '',
      description: ''
    });
    setShowAreaModal(true);
  };

  const handleOpenEditArea = (a) => {
    setEditingArea(a);
    setAreaForm({
      tenantId: a.tenantId || '',
      zoneId: a.zoneId || '',
      name: a.name || '',
      description: a.description || ''
    });
    setShowAreaModal(true);
  };

  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!areaForm.name || !areaForm.zoneId) return showToast('danger', 'Area name and Zone are required');
    setLoading(true);

    try {
      const url = editingArea 
        ? `${API_BASE_URL}/areas/${editingArea.id}` 
        : `${API_BASE_URL}/tenants/${areaForm.tenantId}/zones/${areaForm.zoneId}/areas`;
      const method = editingArea ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(areaForm)
      });

      if (res.ok) {
        showToast('success', `Tenant Area ${editingArea ? 'updated' : 'created'} successfully!`);
        setShowAreaModal(false);
        fetchAreas();
      } else {
        const errJson = await res.json();
        showToast('danger', errJson.message || 'Failed to save area');
      }
    } catch (err) {
      showToast('danger', 'Server error while saving area');
    }
    setLoading(false);
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm('Delete this area?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Area deleted!');
        fetchAreas();
      } else {
        const json = await res.json();
        showToast('danger', json.message || 'Failed to delete area');
      }
    } catch (err) {
      showToast('danger', 'Error deleting area');
    }
    setLoading(false);
  };

  // Filtering helpers
  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredZones = zones.filter(z => 
    z.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    z.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAreas = areas.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="manage-organisation-page p-4">
      <style>{`
        .manage-organisation-page {
          min-height: 100vh;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* LIGHT MODE OVERRIDES */
        body.light-mode .manage-organisation-page {
          background-color: var(--scada-bg, #f1f5f9) !important;
          color: #0f172a !important;
        }
        body.light-mode .manage-organisation-page .org-header-title {
          color: #0f172a !important;
        }
        body.light-mode .manage-organisation-page .org-header-subtext {
          color: #475569 !important;
        }
        body.light-mode .manage-organisation-page .bg-dark-card {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05) !important;
          color: #0f172a !important;
        }
        body.light-mode .manage-organisation-page .org-nav-tabs {
          background: #e2e8f0 !important;
          border-radius: 12px;
        }
        body.light-mode .manage-organisation-page .org-nav-tabs .nav-link {
          color: #475569 !important;
        }
        body.light-mode .manage-organisation-page .org-nav-tabs .nav-link:hover {
          color: #0284c7 !important;
          background: rgba(2, 132, 199, 0.08) !important;
        }
        body.light-mode .manage-organisation-page .org-nav-tabs .nav-link.active {
          color: #ffffff !important;
          background: #0284c7 !important;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3) !important;
        }
        body.light-mode .manage-organisation-page .form-control,
        body.light-mode .manage-organisation-page .form-select {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
        }
        body.light-mode .manage-organisation-page .form-control::placeholder {
          color: #64748b !important;
        }
        body.light-mode .manage-organisation-page .table-custom {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        body.light-mode .manage-organisation-page .table-custom th {
          background-color: #f1f5f9 !important;
          color: #0369a1 !important;
          font-weight: 700;
          border-bottom: 2px solid #cbd5e1 !important;
        }
        body.light-mode .manage-organisation-page .table-custom td {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        body.light-mode .manage-organisation-page .table-custom tr:hover td {
          background-color: #f8fafc !important;
        }
        body.light-mode .manage-organisation-page .table-custom .row-title {
          color: #0f172a !important;
          font-weight: 600;
        }
        body.light-mode .manage-organisation-page .table-custom .row-muted {
          color: #475569 !important;
        }
        body.light-mode .manage-organisation-page .table-custom .empty-text {
          color: #64748b !important;
        }
        body.light-mode .glass-modal .modal-content {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
        }
        body.light-mode .glass-modal .form-control,
        body.light-mode .glass-modal .form-select {
          background-color: #f8fafc !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
        }
        body.light-mode .glass-modal .form-label {
          color: #1e293b !important;
        }

        /* DARK MODE OVERRIDES */
        body:not(.light-mode) .manage-organisation-page {
          background-color: #090d16 !important;
          color: #f8fafc !important;
        }
        body:not(.light-mode) .manage-organisation-page .org-header-title {
          color: #ffffff !important;
        }
        body:not(.light-mode) .manage-organisation-page .org-header-subtext {
          color: #94a3b8 !important;
        }
        body:not(.light-mode) .manage-organisation-page .bg-dark-card {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f8fafc !important;
        }
        body:not(.light-mode) .manage-organisation-page .org-nav-tabs {
          background: rgba(15, 23, 42, 0.8) !important;
        }
        body:not(.light-mode) .manage-organisation-page .org-nav-tabs .nav-link {
          color: #94a3b8 !important;
        }
        body:not(.light-mode) .manage-organisation-page .org-nav-tabs .nav-link:hover {
          color: #38bdf8 !important;
          background: rgba(56, 189, 248, 0.06) !important;
        }
        body:not(.light-mode) .manage-organisation-page .org-nav-tabs .nav-link.active {
          color: #38bdf8 !important;
          background: rgba(2, 132, 199, 0.2) !important;
          border-bottom: 2px solid #0284c7 !important;
        }
        body:not(.light-mode) .manage-organisation-page .form-control,
        body:not(.light-mode) .manage-organisation-page .form-select {
          background-color: #1e293b !important;
          color: #f8fafc !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        body:not(.light-mode) .manage-organisation-page .table-custom {
          background-color: #0f172a !important;
          color: #f8fafc !important;
        }
        body:not(.light-mode) .manage-organisation-page .table-custom th {
          background-color: #1e293b !important;
          color: #38bdf8 !important;
          border-bottom: 2px solid rgba(56, 189, 248, 0.2) !important;
        }
        body:not(.light-mode) .manage-organisation-page .table-custom td {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        body:not(.light-mode) .manage-organisation-page .table-custom tr:hover td {
          background-color: #1e293b !important;
        }
        body:not(.light-mode) .manage-organisation-page .table-custom .row-title {
          color: #ffffff !important;
          font-weight: 600;
        }
        body:not(.light-mode) .manage-organisation-page .table-custom .row-muted {
          color: #94a3b8 !important;
        }
        body:not(.light-mode) .manage-organisation-page .table-custom .empty-text {
          color: #94a3b8 !important;
        }
        body:not(.light-mode) .glass-modal .modal-content {
          background: #0f172a !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #f8fafc !important;
        }
        body:not(.light-mode) .glass-modal .form-control,
        body:not(.light-mode) .glass-modal .form-select {
          background-color: #1e293b !important;
          color: #f8fafc !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        body:not(.light-mode) .glass-modal .form-label {
          color: #cbd5e1 !important;
        }
      `}</style>

      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary border-opacity-25 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => navigate('/settings')}
            className="d-flex align-items-center gap-2 rounded-3 px-3 py-1-5 fw-semibold"
          >
            <ArrowLeft size={16} /> Back to Settings
          </Button>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Building2 className="text-info" size={28} />
              <h2 className="fw-bold mb-0 org-header-title tracking-wide">Organisation Management</h2>
            </div>
            <p className="org-header-subtext mb-0 fs-14">
              Multi-Tenant Administration Platform — Manage Companies, Organizations (Tenants), Geographic Zones & Areas
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={fetchAllData}
            className="d-flex align-items-center gap-2 rounded-3 text-slate-300"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            Refresh
          </Button>

          {activeTab === 'company' && (
            <Button variant="info" size="sm" onClick={handleOpenCreateCompany} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Company
            </Button>
          )}

          {activeTab === 'tenant' && (
            <Button variant="info" size="sm" onClick={handleOpenCreateTenant} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Organization
            </Button>
          )}

          {activeTab === 'zone' && (
            <Button variant="info" size="sm" onClick={handleOpenCreateZone} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Geographic Zone
            </Button>
          )}

          {activeTab === 'area' && (
            <Button variant="info" size="sm" onClick={handleOpenCreateArea} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Tenant Area
            </Button>
          )}
        </div>
      </div>

      {/* Premium Compact Floating Toast Popup */}
      {message && (
        <div 
          className="position-fixed top-0 end-0 p-4" 
          style={{ zIndex: 1056, pointerEvents: 'none' }}
        >
          <div 
            className={`toast-popup-premium d-flex align-items-center gap-3 px-3 py-2.5 rounded-4 shadow-lg ${
              message.type === 'success' 
                ? 'toast-popup-success' 
                : message.type === 'danger' 
                ? 'toast-popup-danger' 
                : 'toast-popup-info'
            }`}
            style={{
              pointerEvents: 'auto',
              minWidth: '280px',
              maxWidth: '380px',
              animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0 ${
              message.type === 'success' ? 'bg-success bg-opacity-20 text-success' : 'bg-danger bg-opacity-20 text-danger'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle size={18} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={18} className="text-rose-400" />
              )}
            </div>
            
            <div className="flex-grow-1 min-w-0">
              <div className="fs-11 fw-bold text-uppercase tracking-wider opacity-75 mb-0.5" style={{ letterSpacing: '0.6px' }}>
                {message.type === 'success' ? 'Success' : 'Notification'}
              </div>
              <div className="fs-13 fw-semibold toast-text text-truncate">
                {message.text}
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setMessage(null)}
              className="btn btn-sm text-slate-400 hover-text-white p-1 border-0 bg-transparent flex-shrink-0"
              aria-label="Close"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <Nav variant="pills" activeKey={activeTab} onSelect={handleTabSelect} className="org-nav-tabs mb-4 bg-dark-card p-2">
        <Nav.Item>
          <Nav.Link eventKey="company">
            <Building size={18} /> Companies ({companies.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="tenant">
            <Building2 size={18} /> Organizations / Tenants ({tenants.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="zone">
            <Globe size={18} /> Geographic Zones ({zones.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="area">
            <Layers size={18} /> Tenant Areas ({areas.length})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Search Bar & Filter Controls */}
      <Card className="bg-dark-card border-0 mb-4 p-3 shadow-sm">
        <Row className="g-3 align-items-center">
          <Col xs={12} md={5}>
            <InputGroup>
              <InputGroup.Text className="bg-transparent border-secondary border-opacity-25 text-slate-400">
                <Search size={18} />
              </InputGroup.Text>
              <Form.Control
                placeholder={`Search ${activeTab}s...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-secondary border-opacity-25 text-white"
              />
            </InputGroup>
          </Col>

          {(activeTab === 'zone' || activeTab === 'area') && (
            <Col xs={12} md={3}>
              <Form.Select
                value={selectedTenantFilter}
                onChange={(e) => setSelectedTenantFilter(e.target.value)}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="ALL">All Organizations</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
            </Col>
          )}

          {activeTab === 'area' && (
            <Col xs={12} md={3}>
              <Form.Select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="ALL">All Zones</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </Form.Select>
            </Col>
          )}
        </Row>
      </Card>

      {/* TAB CONTENT TABLES */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="info" />
          <p className="mt-2 text-muted">Loading organisation parameters...</p>
        </div>
      ) : (
        <Card className="bg-dark-card border-0 shadow-sm overflow-hidden">
          {/* TAB 1: COMPANY MANAGEMENT */}
          {activeTab === 'company' && (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Email Contact</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 empty-text fw-semibold">No companies found</td>
                    </tr>
                  ) : filteredCompanies.map(cmp => (
                    <tr key={cmp.id}>
                      <td className="fw-bold text-white">
                        <div className="d-flex align-items-center gap-2">
                          <Building className="text-info" size={18} />
                          {cmp.name}
                        </div>
                      </td>
                      <td className="text-slate-300">{cmp.email || 'N/A'}</td>
                      <td className="text-slate-300">{cmp.phone || 'N/A'}</td>
                      <td className="text-slate-400 fs-13">{cmp.address || 'N/A'}</td>
                      <td>
                        <Badge bg={cmp.status === 'ACTIVE' || !cmp.status ? 'success' : 'danger'} className="px-2 py-1">
                          {cmp.status || 'ACTIVE'}
                        </Badge>
                      </td>
                      <td className="text-slate-400 fs-12">{formatDate(cmp.createdAt)}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button variant="outline-info" size="sm" title="View Tenants under Company" onClick={() => handleViewCompanyTenants(cmp)}>
                            <Layers size={14} /> Tenants
                          </Button>
                          <Button variant="outline-light" size="sm" title="Edit" onClick={() => handleOpenEditCompany(cmp)}>
                            <Edit3 size={14} />
                          </Button>
                          <Button variant="outline-danger" size="sm" title="Delete" onClick={() => handleDeleteCompany(cmp.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: TENANT / ORGANIZATION MANAGEMENT */}
          {activeTab === 'tenant' && (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Organization / Tenant</th>
                    <th>Parent Company</th>
                    <th>Email / Phone</th>
                    <th>Subscription</th>
                    <th>Status</th>
                    <th>Features</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 empty-text fw-semibold">No organizations found</td>
                    </tr>
                  ) : filteredTenants.map(tn => {
                    const parentCmp = companies.find(c => c.id === tn.companyId);
                    const isInactive = tn.status === 'INACTIVE' || tn.deletedAt;
                    return (
                      <tr key={tn.id}>
                        <td className="fw-bold text-white">
                          <div className="d-flex align-items-center gap-2">
                            <Building2 className="text-cyan-400" size={18} />
                            <div>
                              <div>{tn.name}</div>
                              {tn.sochiotOrgId && <small className="text-muted">Org ID: {tn.sochiotOrgId}</small>}
                            </div>
                          </div>
                        </td>
                        <td className="text-slate-300 fs-13">{parentCmp ? parentCmp.name : (tn.companyId || 'Global')}</td>
                        <td className="text-slate-300 fs-13">
                          <div>{tn.email}</div>
                          <small className="text-muted">{tn.phone}</small>
                        </td>
                        <td>
                          <Badge bg="warning" text="dark" className="px-2 py-1 me-1">
                            {tn.subscription || 'BASIC'}
                          </Badge>
                          {tn.subscriptionPeriod && <small className="text-muted">({tn.subscriptionPeriod})</small>}
                        </td>
                        <td>
                          <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                            {isInactive ? 'INACTIVE' : 'ACTIVE'}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="outline-secondary" size="sm" className="fs-12 py-0 px-2" onClick={() => handleOpenFeaturesModal(tn)}>
                            <Sliders size={12} className="me-1" /> Features
                          </Button>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <Button variant="outline-warning" size="sm" title="Subscription Plan" onClick={() => handleOpenSubModal(tn)}>
                              <Award size={14} />
                            </Button>
                            <Button variant="outline-light" size="sm" title="Edit Details" onClick={() => handleOpenEditTenant(tn)}>
                              <Edit3 size={14} />
                            </Button>
                            {isInactive ? (
                              <Button variant="outline-success" size="sm" title="Reactivate" onClick={() => handleReactivateTenant(tn.id)}>
                                <Zap size={14} /> Reactivate
                              </Button>
                            ) : (
                              <Button variant="outline-danger" size="sm" title="Soft Delete" onClick={() => handleDeleteTenant(tn.id)}>
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: GEOGRAPHIC ZONES MANAGEMENT */}
          {activeTab === 'zone' && (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Assigned Organization</th>
                    <th>Region / Country</th>
                    <th>Timezone</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredZones.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 empty-text fw-semibold">No zones found</td>
                    </tr>
                  ) : filteredZones.map(z => {
                    const assignedTenant = tenants.find(t => t.id === z.tenantId);
                    const isInactive = z.status === 'INACTIVE' || z.deletedAt;
                    return (
                      <tr key={z.id}>
                        <td className="fw-bold text-white">
                          <div className="d-flex align-items-center gap-2">
                            <Globe className="text-amber-400" size={18} />
                            <div>
                              <div>{z.name}</div>
                              {z.description && <small className="text-muted fs-12">{z.description}</small>}
                            </div>
                          </div>
                        </td>
                        <td className="text-slate-300">{assignedTenant ? assignedTenant.name : z.tenantId}</td>
                        <td className="text-slate-300 fs-13">
                          {z.region || 'N/A'} {z.country ? `, ${z.country}` : ''}
                        </td>
                        <td className="text-slate-400 fs-12">{z.timezone || 'Asia/Kolkata'}</td>
                        <td>
                          <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                            {isInactive ? 'INACTIVE' : 'ACTIVE'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <Button variant="outline-light" size="sm" title="Edit" onClick={() => handleOpenEditZone(z)}>
                              <Edit3 size={14} />
                            </Button>
                            {isInactive ? (
                              <Button variant="outline-success" size="sm" title="Reactivate" onClick={() => handleReactivateZone(z.id)}>
                                Reactivate
                              </Button>
                            ) : (
                              <Button variant="outline-danger" size="sm" title="Delete Zone" onClick={() => handleDeleteZone(z.id)}>
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: TENANT AREA MANAGEMENT */}
          {activeTab === 'area' && (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Area Name</th>
                    <th>Parent Zone</th>
                    <th>Organization</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 empty-text fw-semibold">No tenant areas found</td>
                    </tr>
                  ) : filteredAreas.map(a => {
                    const parentZone = zones.find(z => z.id === a.zoneId);
                    const parentTenant = tenants.find(t => t.id === a.tenantId);
                    const isInactive = a.status === 'INACTIVE' || a.deletedAt;
                    return (
                      <tr key={a.id}>
                        <td className="fw-bold text-white">
                          <div className="d-flex align-items-center gap-2">
                            <Layers className="text-purple-400" size={18} />
                            {a.name}
                          </div>
                        </td>
                        <td className="text-slate-300 fs-13">{parentZone ? parentZone.name : a.zoneId}</td>
                        <td className="text-slate-300 fs-13">{parentTenant ? parentTenant.name : a.tenantId}</td>
                        <td className="text-slate-400 fs-12">{a.description || 'N/A'}</td>
                        <td>
                          <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                            {isInactive ? 'INACTIVE' : 'ACTIVE'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <Button variant="outline-light" size="sm" title="Edit" onClick={() => handleOpenEditArea(a)}>
                              <Edit3 size={14} />
                            </Button>
                            <Button variant="outline-danger" size="sm" title="Delete" onClick={() => handleDeleteArea(a.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ================= MODAL DIALOGS ================= */}

      {/* 1. COMPANY MODAL */}
      <Modal show={showCompanyModal} onHide={() => setShowCompanyModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Building className="text-info" /> {editingCompany ? 'Edit SAAS Company' : 'Add SAAS Company'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveCompany}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Company Name *</Form.Label>
              <Form.Control
                required
                placeholder="e.g. Sochiot Technologies Ltd"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="info@company.com"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Phone Number</Form.Label>
              <Form.Control
                placeholder="+91-1234567890"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Headquarters Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Sector 63, Noida..."
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowCompanyModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="text-dark fw-bold">
              {loading ? <Spinner size="sm" animation="border"/> : editingCompany ? 'Save Changes' : 'Create Company'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 2. TENANT / ORGANIZATION MODAL */}
      <Modal show={showTenantModal} onHide={() => { setEditingTenant(null); setShowTenantModal(false); }} size={tenantForm.addAddress ? "xl" : "lg"} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-white">
            <Building2 className="text-info" /> {editingTenant ? 'Edit Organization' : 'Add Organization'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveTenant}>
          <Modal.Body className="p-4">
            <Row className="g-4">
              {/* Left Main Column */}
              <Col xs={12} md={tenantForm.addAddress ? 6 : 12} className="d-flex flex-column gap-3">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-13 fw-semibold text-slate-200">Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        required
                        placeholder="Organization Name"
                        value={tenantForm.name}
                        onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 py-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-13 fw-semibold text-slate-200">Server URL</Form.Label>
                      <Form.Control
                        placeholder="Server URL"
                        value={tenantForm.serverUrl}
                        onChange={(e) => setTenantForm({ ...tenantForm, serverUrl: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 py-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-13 fw-semibold text-slate-200">Organization Type <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={tenantForm.orgType}
                        onChange={(e) => setTenantForm({ ...tenantForm, orgType: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 py-2"
                      >
                        <option value="Company">Company</option>
                        <option value="SAAS">SAAS</option>
                        <option value="CLIENT">CLIENT</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-13 fw-semibold text-slate-200">Parent Company</Form.Label>
                      <Form.Select
                        value={tenantForm.companyId}
                        onChange={(e) => setTenantForm({ ...tenantForm, companyId: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 py-2"
                      >
                        <option value="">-- Select Parent Company --</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-13 fw-semibold text-slate-200">Contact Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="admin@org.com"
                        value={tenantForm.email}
                        onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 py-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-13 fw-semibold text-slate-200">Phone</Form.Label>
                      <Form.Control
                        placeholder="+91-1234567890"
                        value={tenantForm.phone}
                        onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 py-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-200">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Enter organization description..."
                    value={tenantForm.description}
                    onChange={(e) => setTenantForm({ ...tenantForm, description: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2"
                  />
                </Form.Group>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-13 fw-semibold text-slate-200">Sochiot Org ID</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="e.g. 7"
                        value={tenantForm.sochiotOrgId}
                        onChange={(e) => setTenantForm({ ...tenantForm, sochiotOrgId: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 py-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-13 fw-semibold text-slate-200">Subscription Tier</Form.Label>
                      <Form.Select
                        value={tenantForm.subscription}
                        onChange={(e) => setTenantForm({ ...tenantForm, subscription: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 py-2"
                      >
                        <option value="BASIC">BASIC</option>
                        <option value="PREMIUM">PREMIUM</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {!tenantForm.addAddress && (
                  <Form.Group>
                    <Form.Label className="fs-13 fw-semibold text-slate-200">Address</Form.Label>
                    <Form.Control
                      placeholder="e.g. Sector 63, Noida"
                      value={tenantForm.addressLine}
                      onChange={(e) => setTenantForm({ ...tenantForm, addressLine: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 py-2"
                    />
                  </Form.Group>
                )}

                <div className="pt-2">
                  <Form.Check
                    type="switch"
                    id="add-address-toggle"
                    label="Detailed Address Builder (Country/State/City)"
                    checked={tenantForm.addAddress}
                    onChange={(e) => setTenantForm({ ...tenantForm, addAddress: e.target.checked })}
                    className="fw-bold text-info fs-14"
                  />
                </div>
              </Col>

              {/* Right Address Column - ONLY RENDERED WHEN addAddress IS TRUE */}
              {tenantForm.addAddress && (
                <Col xs={12} md={6} className="d-flex flex-column gap-3 border-start border-secondary border-opacity-25 ps-md-4">
                  <h6 className="fw-bold text-info mb-1">Organization Location / Address Details</h6>

                  <Form.Group>
                    <Form.Label className="fs-13 fw-semibold text-slate-200">Address Line <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      placeholder="Address"
                      value={tenantForm.addressLine}
                      onChange={(e) => setTenantForm({ ...tenantForm, addressLine: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 py-2"
                    />
                  </Form.Group>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fs-13 fw-semibold text-slate-200">Country <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={tenantForm.country}
                          onChange={(e) => setTenantForm({ ...tenantForm, country: e.target.value })}
                          className="bg-dark text-white border-secondary border-opacity-25 py-2"
                        >
                          <option value="">Please Select Country</option>
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="UAE">UAE</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Australia">Australia</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fs-13 fw-semibold text-slate-200">State <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={tenantForm.state}
                          onChange={(e) => setTenantForm({ ...tenantForm, state: e.target.value })}
                          className="bg-dark text-white border-secondary border-opacity-25 py-2"
                        >
                          <option value="">Please Select State</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Telangana">Telangana</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fs-13 fw-semibold text-slate-200">City <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          placeholder="Please enter City"
                          value={tenantForm.city}
                          onChange={(e) => setTenantForm({ ...tenantForm, city: e.target.value })}
                          className="bg-dark text-white border-secondary border-opacity-25 py-2"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fs-13 fw-semibold text-slate-200">Zip Code <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          placeholder="Please enter Zip Code"
                          value={tenantForm.zipCode}
                          onChange={(e) => setTenantForm({ ...tenantForm, zipCode: e.target.value })}
                          className="bg-dark text-white border-secondary border-opacity-25 py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              )}
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25 justify-content-start gap-2">
            <Button variant="primary" type="submit" disabled={loading} className="fw-bold px-4" style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}>
              {loading ? <Spinner size="sm" animation="border"/> : 'Save'}
            </Button>
            <Button variant="outline-light" onClick={() => setShowTenantModal(false)} className="px-4">
              Cancel
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 3. ZONE MODAL */}
      <Modal show={showZoneModal} onHide={() => setShowZoneModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Globe className="text-info" /> {editingZone ? 'Edit Geographic Zone' : 'Create Geographic Zone'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveZone}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Organization *</Form.Label>
              <Form.Select
                required
                value={zoneForm.tenantId}
                onChange={(e) => setZoneForm({ ...zoneForm, tenantId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="">-- Select Organization --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Zone Name *</Form.Label>
              <Form.Control
                required
                placeholder="e.g. North India Region"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Region</Form.Label>
                  <Form.Control
                    placeholder="e.g. NCR"
                    value={zoneForm.region}
                    onChange={(e) => setZoneForm({ ...zoneForm, region: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Timezone</Form.Label>
                  <Form.Control
                    placeholder="Asia/Kolkata"
                    value={zoneForm.timezone}
                    onChange={(e) => setZoneForm({ ...zoneForm, timezone: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Zone Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Zone coverage description..."
                value={zoneForm.description}
                onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowZoneModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="text-dark fw-bold">
              {loading ? <Spinner size="sm" animation="border"/> : editingZone ? 'Save Changes' : 'Create Zone'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 4. AREA MODAL */}
      <Modal show={showAreaModal} onHide={() => setShowAreaModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Layers className="text-info" /> {editingArea ? 'Edit Tenant Area' : 'Create Tenant Area'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveArea}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Organization *</Form.Label>
              <Form.Select
                required
                value={areaForm.tenantId}
                onChange={(e) => {
                  const tId = e.target.value;
                  const firstZ = zones.find(z => z.tenantId === tId)?.id || '';
                  setAreaForm({ ...areaForm, tenantId: tId, zoneId: firstZ });
                }}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="">-- Select Organization --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Parent Zone *</Form.Label>
              <Form.Select
                required
                value={areaForm.zoneId}
                onChange={(e) => setAreaForm({ ...areaForm, zoneId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="">-- Select Geographic Zone --</option>
                {zones
                  .filter(z => !areaForm.tenantId || z.tenantId === areaForm.tenantId)
                  .map(z => (
                    <option key={z.id} value={z.id}>{z.name} ({z.region || 'Zone'})</option>
                  ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Area Name *</Form.Label>
              <Form.Control
                required
                placeholder="e.g. Sector 63 Industrial Area"
                value={areaForm.name}
                onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Area description..."
                value={areaForm.description}
                onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowAreaModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="text-dark fw-bold">
              {loading ? <Spinner size="sm" animation="border"/> : editingArea ? 'Save Changes' : 'Create Area'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 5. TENANT FEATURES MODAL */}
      <Modal show={showFeaturesModal} onHide={() => setShowFeaturesModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Sliders className="text-info" /> Feature Permissions: {selectedTenantForFeatures?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveFeatures}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Check
              type="switch"
              id="feature-alarm"
              label="Real-time Alarm Monitoring & Notification"
              checked={featuresForm.alarm}
              onChange={(e) => setFeaturesForm({ ...featuresForm, alarm: e.target.checked })}
              className="fs-14 fw-medium text-slate-200"
            />
            <Form.Check
              type="switch"
              id="feature-reports"
              label="Automated PDF & Analytics Reports"
              checked={featuresForm.reports}
              onChange={(e) => setFeaturesForm({ ...featuresForm, reports: e.target.checked })}
              className="fs-14 fw-medium text-slate-200"
            />
            <Form.Check
              type="switch"
              id="feature-dpr"
              label="Daily Performance Record (DPR) Logs"
              checked={featuresForm.dpr}
              onChange={(e) => setFeaturesForm({ ...featuresForm, dpr: e.target.checked })}
              className="fs-14 fw-medium text-slate-200"
            />
            <Form.Check
              type="switch"
              id="feature-telemetry"
              label="Live Sensor Telemetry Streaming"
              checked={featuresForm.telemetry}
              onChange={(e) => setFeaturesForm({ ...featuresForm, telemetry: e.target.checked })}
              className="fs-14 fw-medium text-slate-200"
            />
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowFeaturesModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="text-dark fw-bold">
              Save Features
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 6. TENANT SUBSCRIPTION MODAL */}
      <Modal show={showSubModal} onHide={() => setShowSubModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Award className="text-warning" /> Subscription Plan: {selectedTenantForSub?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSub}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Subscription Tier</Form.Label>
              <Form.Select
                value={subForm.subscription}
                onChange={(e) => setSubForm({ ...subForm, subscription: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="BASIC">BASIC</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Billing Cycle</Form.Label>
              <Form.Select
                value={subForm.subscriptionPeriod}
                onChange={(e) => setSubForm({ ...subForm, subscriptionPeriod: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="MONTHLY">MONTHLY</option>
                <option value="QUARTERLY">QUARTERLY</option>
                <option value="YEARLY">YEARLY</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">License Expiration Date</Form.Label>
              <Form.Control
                type="date"
                value={subForm.licenseValidity}
                onChange={(e) => setSubForm({ ...subForm, licenseValidity: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowSubModal(false)}>Cancel</Button>
            <Button variant="warning" type="submit" disabled={loading} className="text-dark fw-bold">
              Update Plan
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 7. COMPANY TENANTS LIST MODAL */}
      <Modal show={showCompanyTenantsModal} onHide={() => setShowCompanyTenantsModal(false)} size="lg" centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Layers className="text-info" /> Tenants under {selectedCompanyForTenants?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {companyTenantsList.length === 0 ? (
            <p className="text-center py-4 text-muted">No organizations assigned under this company yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Tenant Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Subscription</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {companyTenantsList.map(t => (
                    <tr key={t.id}>
                      <td className="fw-bold text-white">{t.name}</td>
                      <td className="text-slate-300">{t.email || 'N/A'}</td>
                      <td className="text-slate-300">{t.phone || 'N/A'}</td>
                      <td><Badge bg="warning" text="dark">{t.subscription || 'BASIC'}</Badge></td>
                      <td>
                        <Badge bg={t.status === 'INACTIVE' ? 'secondary' : 'success'}>
                          {t.status || 'ACTIVE'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="secondary" onClick={() => setShowCompanyTenantsModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default ManageOrganisation;
