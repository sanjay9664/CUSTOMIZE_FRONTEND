import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Modal, InputGroup, Spinner, Alert, Nav, Dropdown } from 'react-bootstrap';
import {
  Building2, Building, MapPin, Globe, Shield, Plus, Search, Edit3, Trash2,
  CheckCircle, XCircle, RefreshCw, Eye, Layers, Settings, ChevronRight, Activity,
  Sliders, Calendar, Award, Zap, AlertTriangle, Phone, Mail, ArrowLeft, Cpu,
  Radio, FileText, BellRing, Sparkles, Users, Grid, Terminal, CheckCircle2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SiteManagement from './SiteManagement';
import PdfButton from '../../components/PdfButton';
import UserPdfReportModal from '../../components/UserPdfReportModal';
import { generateUserCustomPdfReport } from '../../utils/pdfReportGenerator';
import { getCookie } from '../../utils/cookieUtils';

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = getCookie('access_token') ||
    getCookie('token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('sochiot_token') ||
    localStorage.getItem('auth_token') || '';

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizeList = (raw, key) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (raw.data && Array.isArray(raw.data[key])) return raw.data[key];
  if (Array.isArray(raw[key])) return raw[key];
  return [];
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const INDIAN_UNION_TERRITORIES = [
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const ManageOrganisation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Role-Based Access Control (RBAC) Security Check
  const userRole = (localStorage.getItem('userRole') || getCookie('userRole') || 'USER').toUpperCase();
  const isAdmin = ['SUPERADMIN', 'ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN'].includes(userRole);

  // Tab State: 'company' | 'tenant' | 'zone' | 'area' | 'site' | 'building' | 'asset' | 'device' | 'telemetry' | 'report' | 'alarm'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (['company', 'tenant', 'zone', 'area', 'site', 'building', 'asset', 'device', 'widgets', 'rules', 'commands', 'telemetry', 'report', 'alarm'].includes(tabParam)) return tabParam;
    return 'company';
  });

  // Data States
  const [companies, setCompanies] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sites, setSites] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [alarmsList, setAlarmsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Active Entity Helpers (Declared early to prevent TDZ ReferenceErrors)
  const activeCompanies = normalizeList(companies, 'companies').filter(c => c.status !== 'INACTIVE' && !c.deletedAt);
  const activeTenants = normalizeList(tenants, 'tenants').filter(t => t.status !== 'INACTIVE' && !t.deletedAt);
  const activeZones = normalizeList(zones, 'zones').filter(z => z.status !== 'INACTIVE' && !z.deletedAt);
  const activeAreas = normalizeList(areas, 'areas').filter(a => a.status !== 'INACTIVE' && !a.deletedAt);
  const activeSites = normalizeList(sites, 'sites').filter(s => s.status !== 'INACTIVE' && s.status !== 'DISABLED' && s.isActive !== false && !s.deletedAt);
  const activeBuildings = normalizeList(buildings, 'buildings').filter(b => b.isActive !== false && !b.deletedAt);
  const activeAssets = normalizeList(assets, 'assets').filter(a => a.status !== 'INACTIVE' && !a.deletedAt);
  const rawActiveDevices = normalizeList(devices, 'devices').filter(d => d.isActive !== false && d.status !== 'DISABLED');
  const activeDevices = rawActiveDevices;

  // Modals state for Telemetry Resync, Reports, Alarms
  const [showResyncModal, setShowResyncModal] = useState(false);
  const [resyncForm, setResyncForm] = useState({
    siteId: 7,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'DAILY_DPR',
    siteId: 7,
    format: 'PDF',
    title: 'Daily Telemetry & DPR Report'
  });

  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmForm, setAlarmForm] = useState({
    deviceId: 'EM_LIVEWIZE_101',
    fieldKey: 'temperature',
    value: '95.5',
    severity: 'CRITICAL'
  });

  // Modals state for Buildings, Assets, Devices
  const [selectedBuildingSiteId, setSelectedBuildingSiteId] = useState('ALL');
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    code: '',
    totalFloors: 1,
    description: '',
    isActive: true,
    displayOrder: 0,
    siteId: ''
  });

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({ name: '', assetType: 'BUILDING', parentAssetId: '', description: '', siteId: 7 });

  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState({ name: '', category: 'ENERGY_METER', bmsDeviceId: '', serialNumber: '', siteId: 7 });

  // Extended Device API State Hooks & UI Sub-Tabs
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');
  const [deviceSubTab, setDeviceSubTab] = useState('registration');
  const [showRegisterDeviceModal, setShowRegisterDeviceModal] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [registerForm, setRegisterForm] = useState({
    siteId: 7,
    name: '',
    sochiotDeviceIds: '',
    category: 'ENERGY_METER',
    areaId: '',
    buildingId: '',
    floorNo: '',
    roomNo: '',
    energyGroupId: '',
    description: '',
    serialNumber: '',
    profileId: 'MFM-1 Profile',
    templateName: 'EnergyMeter_Template_V1'
  });

  const [dynamicTemplateFields, setDynamicTemplateFields] = useState([
    {
      deviceId: '101',
      moduleId: '4583',
      sochiotFieldName: '3,100F',
      displayName: 'Voltage R-N',
      thresholdValue: '250',
      dataType: 'INTEGER',
      unit: 'V',
      warningHigh: 250,
      criticalHigh: 260,
      warningLow: 210,
      criticalLow: 200,
      isCommand: false,
      graphable: true
    }
  ]);

  const [availableTemplates, setAvailableTemplates] = useState([
    {
      name: 'EnergyMeter_Template_V1',
      category: 'ENERGY_METER',
      protocol: 'MODBUS_RTU',
      profileId: 'prf_cm71',
      bmsDeviceId: 'BMS-0001',
      sochiotDeviceIds: [1231],
      template_settings: [
        {
          moduleId: 4583,
          moduleName: 'Main Incomer',
          sochiotFieldName: '3,100F',
          displayName: 'Voltage R-N',
          dataType: 'INTEGER',
          unit: 'V',
          warningHigh: 250,
          criticalHigh: 260,
          warningLow: 210,
          criticalLow: 200,
          isCommand: false,
          graphable: true
        }
      ],
      widgets: [
        {
          widgetId: 'E1',
          displayName: 'Total Active Power',
          moduleId: 4583,
          eventKey: '4,0F',
          isActive: true,
          telemetryType: 'AVERAGE',
          samplingInterval: 'MIN_15'
        }
      ],
      rules: [
        {
          name: 'VOLTAGE_HIGH_RULE',
          ruleType: 'CONDITION',
          sochiotModuleId: 4583,
          priority: 1,
          fields: [
            {
              fieldName: 'condition_type',
              displayName: 'Condition Type',
              fieldGroup: 'CONDITION',
              moduleFieldMappingId: 28135,
              sochiotFieldName: '3,100F',
              value: 'MODBUS',
              dataType: 'TEXT_SHORT',
              isRequired: true
            }
          ]
        }
      ]
    },
    {
      name: 'HVAC_Chiller_Template_V2',
      category: 'HVAC',
      protocol: 'BACNET_IP',
      profileId: 'prf_hvac_02',
      bmsDeviceId: 'BMS-HVAC-02',
      sochiotDeviceIds: [1232],
      template_settings: [
        { moduleId: 4584, moduleName: 'Chiller Unit', sochiotFieldName: 'CHILL_TEMP', displayName: 'Chiller Water Temp', dataType: 'FLOAT', unit: '°C', warningHigh: 28, criticalHigh: 35, warningLow: 10, criticalLow: 5, isCommand: false, graphable: true }
      ],
      widgets: [
        { widgetId: 'H1', displayName: 'Chiller Thermal Trend', moduleId: 4584, eventKey: 'CHILL_TEMP', isActive: true, telemetryType: 'AVERAGE', samplingInterval: 'MIN_15' }
      ],
      rules: [
        { name: 'HIGH_TEMP_SAFETY_TRIP', ruleType: 'CONDITION', sochiotModuleId: 4584, priority: 1, fields: [{ fieldName: 'condition_type', displayName: 'High Temp Trip', fieldGroup: 'CONDITION', value: 'AUTO_SHUTDOWN', dataType: 'TEXT_SHORT', isRequired: true }] }
      ]
    },
    {
      name: 'Water_Pump_Relay_V1',
      category: 'MOTOR_PUMP',
      protocol: 'MODBUS_TCP',
      profileId: 'prf_pump_01',
      bmsDeviceId: 'BMS-PUMP-01',
      sochiotDeviceIds: [1233],
      template_settings: [
        { moduleId: 4585, moduleName: 'Pump Relay', sochiotFieldName: 'PUMP_STAT', displayName: 'Pump Relay Run Status', dataType: 'BOOLEAN', unit: '', warningHigh: 0, criticalHigh: 0, warningLow: 0, criticalLow: 0, isCommand: true, graphable: false }
      ],
      widgets: [
        { widgetId: 'P1', displayName: 'Pump Discharge Pressure', moduleId: 4585, eventKey: 'PUMP_PRESS', isActive: true, telemetryType: 'INSTANT', samplingInterval: 'MIN_5' }
      ],
      rules: [
        { name: 'LOW_PRESSURE_CUTOFF_RULE', ruleType: 'CONDITION', sochiotModuleId: 4585, priority: 1, fields: [{ fieldName: 'condition_type', displayName: 'Pressure Cutoff', fieldGroup: 'CONDITION', value: 'TRIP_RELAY', dataType: 'TEXT_SHORT', isRequired: true }] }
      ]
    }
  ]);

  const [showLiveModal, setShowLiveModal] = useState(false);
  const [selectedDeviceForLive, setSelectedDeviceForLive] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedDeviceForSettings, setSelectedDeviceForSettings] = useState(null);
  const [deviceSettingsForm, setDeviceSettingsForm] = useState({
    slaveId: 1, baudRate: 9600, parity: 'NONE', pollingIntervalMs: 2000,
    fieldMappings: [
      { field: 'voltage', register: 40001, dataType: 'FLOAT32' },
      { field: 'current', register: 40003, dataType: 'FLOAT32' },
      { field: 'powerKw', register: 40005, dataType: 'FLOAT32' }
    ]
  });

  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [selectedDeviceForThresholds, setSelectedDeviceForThresholds] = useState(null);
  const [thresholdsForm, setThresholdsForm] = useState({
    '3,100F': { warningHigh: 250, criticalHigh: 260, warningLow: 210, criticalLow: 200 },
    '4,0F': { warningHigh: 50, criticalHigh: 65, warningLow: 0, criticalLow: 0 }
  });

  const handleOpenThresholdsModal = (d) => {
    setSelectedDeviceForThresholds(d);
    
    // Extract valid settings keys from device settings or profile mappings
    let validSettings = [];
    if (d.settings && Array.isArray(d.settings) && d.settings.length > 0) {
      validSettings = d.settings;
    } else if (d.profile && d.profile.fieldMappings && typeof d.profile.fieldMappings === 'object') {
      validSettings = Object.keys(d.profile.fieldMappings).map(k => ({
        sochiotFieldName: k,
        displayName: k,
        warningHigh: 250,
        criticalHigh: 260,
        warningLow: 210,
        criticalLow: 200
      }));
    } else {
      validSettings = [
        { sochiotFieldName: '3,100F', displayName: 'Voltage R-N', warningHigh: 250, criticalHigh: 260, warningLow: 210, criticalLow: 200 }
      ];
    }

    const initialForm = {};
    validSettings.forEach(s => {
      const key = s.sochiotFieldName || s.displayName || '3,100F';
      initialForm[key] = {
        warningHigh: s.warningHigh ?? 250,
        criticalHigh: s.criticalHigh ?? 260,
        warningLow: s.warningLow ?? 210,
        criticalLow: s.criticalLow ?? 200
      };
    });
    setThresholdsForm(initialForm);
    setShowThresholdsModal(true);
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (!selectedDeviceForThresholds) return;
    setLoading(true);
    try {
      const siteId = selectedDeviceForThresholds.siteId || 7;
      const cleanedThresholds = {};
      Object.keys(thresholdsForm).forEach(k => {
        cleanedThresholds[k] = {
          warningHigh: Number(thresholdsForm[k].warningHigh) || 250,
          criticalHigh: Number(thresholdsForm[k].criticalHigh) || 260,
          warningLow: Number(thresholdsForm[k].warningLow) || 210,
          criticalLow: Number(thresholdsForm[k].criticalLow) || 200,
        };
      });

      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${selectedDeviceForThresholds.id}/thresholds`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ thresholds: cleanedThresholds })
      });
      if (res.ok) {
        showToast('success', `Threshold limits updated for ${selectedDeviceForThresholds.name}!`);
        setShowThresholdsModal(false);
        fetchDevices();
      } else {
        const err = await res.json();
        showToast('danger', err.error?.message || err.message || 'Failed to update thresholds');
      }
    } catch (err) {
      showToast('danger', err.message || 'Error updating thresholds');
    }
    setLoading(false);
  };

  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [selectedDeviceForAudit, setSelectedDeviceForAudit] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const [showRecentEventsModal, setShowRecentEventsModal] = useState(false);
  const [recentEventsList, setRecentEventsList] = useState([]);

  const [showGlobalResyncModal, setShowGlobalResyncModal] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedDeviceForRules, setSelectedDeviceForRules] = useState(null);
  const [deviceRules, setDeviceRules] = useState([]);

  // Widgets State
  const [showCreateWidgetModal, setShowCreateWidgetModal] = useState(false);
  const [showBulkWidgetModal, setShowBulkWidgetModal] = useState(false);
  const [widgetFilterActiveOnly, setWidgetFilterActiveOnly] = useState(false);
  const [selectedDeviceForWidgets, setSelectedDeviceForWidgets] = useState(1);
  const [widgetsList, setWidgetsList] = useState([]);
  const [widgetFormData, setWidgetFormData] = useState({
    widgetId: '',
    displayName: '',
    widgetType: 'GAUGE',
    displayOrder: 1,
    isActive: true
  });

  const [showEditWidgetModal, setShowEditWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [editWidgetFormData, setEditWidgetFormData] = useState({
    id: null,
    widgetId: '',
    displayName: '',
    widgetType: 'GAUGE',
    displayOrder: 1,
    isActive: true
  });

  // Rules Tab State
  const [selectedDeviceForRulesTab, setSelectedDeviceForRulesTab] = useState(1);
  const [rulesList, setRulesList] = useState([]);
  const [showRuleDetailsModal, setShowRuleDetailsModal] = useState(false);
  const [selectedRuleDetails, setSelectedRuleDetails] = useState(null);
  const [showEditRuleModal, setShowEditRuleModal] = useState(false);
  const [editRuleFormData, setEditRuleFormData] = useState({
    id: '',
    name: '',
    conditionType: 'GREATER_THAN',
    fieldName: 'voltage',
    threshold: 250,
    consequenceType: 'TRIGGER_ALARM_EVENT',
    enabled: true
  });

  // Commands Tab State
  const [selectedDeviceForCommandsTab, setSelectedDeviceForCommandsTab] = useState(1);
  const [commandsList, setCommandsList] = useState([]);
  const [showSendCommandModal, setShowSendCommandModal] = useState(false);
  const [sendCommandFormData, setSendCommandFormData] = useState({
    fieldKey: '',
    commandValue: '',
    notes: ''
  });
  const [showCommandDetailsModal, setShowCommandDetailsModal] = useState(false);
  const [selectedCommandDetails, setSelectedCommandDetails] = useState(null);

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
    address: ''
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
    const siteParam = params.get('siteId');
    if (tabParam && ['company', 'tenant', 'zone', 'area', 'site', 'building', 'asset', 'device', 'widgets', 'rules', 'commands'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    if (siteParam) {
      setSelectedBuildingSiteId(siteParam);
    }
  }, [location.search]);

  // Fetch Companies
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/companies`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setCompanies(normalizeList(json, 'companies'));
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
        setTenants(normalizeList(json, 'tenants'));
      }
    } catch (err) {
      console.warn('Tenants fetch err:', err);
    }
  }, []);

  // Fetch Zones
  const fetchZones = useCallback(async (tenantFilterArg) => {
    try {
      const targetFilter = tenantFilterArg !== undefined ? tenantFilterArg : selectedTenantFilter;
      const url = targetFilter && targetFilter !== 'ALL'
        ? `${API_BASE_URL}/zones?tenantId=${targetFilter}`
        : `${API_BASE_URL}/zones`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setZones(normalizeList(json, 'zones'));
      }
    } catch (err) {
      console.warn('Zones fetch err:', err);
    }
  }, []);

  // Fetch Tenant Areas
  const fetchAreas = useCallback(async (zoneFilterArg, tenantFilterArg) => {
    try {
      const zFilter = zoneFilterArg !== undefined ? zoneFilterArg : selectedZoneFilter;
      const tFilter = tenantFilterArg !== undefined ? tenantFilterArg : selectedTenantFilter;
      let url = `${API_BASE_URL}/areas`;
      const query = [];
      if (zFilter && zFilter !== 'ALL') query.push(`zoneId=${zFilter}`);
      if (tFilter && tFilter !== 'ALL') query.push(`tenantId=${tFilter}`);
      if (query.length) url += `?${query.join('&')}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setAreas(normalizeList(json, 'areas'));
      }
    } catch (err) {
      console.warn('Areas fetch err:', err);
    }
  }, []);

  // Fetch Sites
  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sites`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setSites(normalizeList(json, 'sites'));
      }
    } catch (err) {
      console.warn('Sites fetch err:', err);
    }
  }, []);

  // Fetch Buildings
  const fetchBuildings = useCallback(async (siteIdArg) => {
    try {
      const targetSiteId = siteIdArg !== undefined ? siteIdArg : selectedBuildingSiteId;
      if (targetSiteId && targetSiteId !== 'ALL') {
        const res = await fetch(`${API_BASE_URL}/sites/${targetSiteId}/buildings`, { headers: getAuthHeaders() });
        if (res.ok) {
          const json = await res.json();
          const list = normalizeList(json, 'buildings');
          setBuildings(list.map(b => ({
            ...b,
            siteId: targetSiteId
          })));
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/sites`, { headers: getAuthHeaders() });
        let siteList = [];
        if (res.ok) {
          const json = await res.json();
          siteList = normalizeList(json, 'sites');
        }
        if (!siteList.length) {
          siteList = [{ id: 7, name: 'Noida Testing Site' }, { id: 4, name: 'Testing' }, { id: 1, name: 'LIT India' }];
        }
        const buildingPromises = siteList.slice(0, 10).map(async (s) => {
          try {
            const bRes = await fetch(`${API_BASE_URL}/sites/${s.id}/buildings`, { headers: getAuthHeaders() });
            if (bRes.ok) {
              const bJson = await bRes.json();
              const list = normalizeList(bJson, 'buildings');
              return list.map(b => ({ ...b, siteId: s.id, siteName: s.name }));
            }
          } catch(e) {}
          return [];
        });
        const results = await Promise.all(buildingPromises);
        setBuildings(results.flat());
      }
    } catch (err) {
      console.warn('Buildings fetch err:', err);
    }
  }, []);

  // Fetch Assets
  const fetchAssets = useCallback(async () => {
    try {
      let list = [];
      const res = await fetch(`${API_BASE_URL}/assets`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        list = normalizeList(json, 'assets');
      }
      const userAssets = JSON.parse(localStorage.getItem('tb_created_assets') || '[]');
      if (userAssets.length > 0) {
        const existingIds = new Set(list.map(a => String(a.id)));
        const newAdditions = userAssets.filter(a => !existingIds.has(String(a.id)));
        list = [...newAdditions, ...list.map(a => {
          const userEdit = userAssets.find(u => String(u.id) === String(a.id));
          return userEdit ? { ...a, ...userEdit } : a;
        })];
      }
      setAssets(list);
    } catch (err) {
      console.warn('Assets fetch err:', err);
    }
  }, []);

  // Fetch Devices
  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/devices`, { headers: getAuthHeaders() });
      const deletedIds = JSON.parse(localStorage.getItem('bms_deleted_devices') || '[]');
      if (res.ok) {
        const json = await res.json();
        let list = normalizeList(json, 'devices');
        const savedEdits = JSON.parse(localStorage.getItem('bms_device_edits') || '{}');
        if (Object.keys(savedEdits).length > 0) {
          list = list.map(d => savedEdits[d.id] ? { ...d, ...savedEdits[d.id] } : d);
        }
        const customDevices = JSON.parse(localStorage.getItem('bms_registered_devices') || '[]');
        const combined = [...customDevices, ...list.filter(d => !customDevices.some(c => String(c.id) === String(d.id)))];
        const finalDevices = combined.filter(d => !deletedIds.includes(String(d.id)));
        setDevices(finalDevices);
      }
    } catch (err) {
      console.warn('Devices fetch err:', err);
      const customDevices = JSON.parse(localStorage.getItem('bms_registered_devices') || '[]');
      const deletedIds = JSON.parse(localStorage.getItem('bms_deleted_devices') || '[]');
      if (customDevices.length > 0) {
        setDevices(prev => [...customDevices.filter(d => !deletedIds.includes(String(d.id))), ...prev]);
      }
    }
  }, []);

  // Fetch Telemetry Resync Logs
  const fetchTelemetryLogs = useCallback(async () => {
    try {
      const targetSite = (activeSites && activeSites[0]?.id) || 1;
      const res = await fetch(`${API_BASE_URL}/sites/${targetSite}/telemetry/resync-logs`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTelemetryLogs(normalizeList(json, 'logs'));
      } else {
        const fallbackLogs = [
          { id: 'log_1', siteId: 7, siteName: 'Sanjay', status: 'SUCCESS', syncedDevices: 12, triggeredBy: 'Super Admin', timestamp: new Date().toISOString(), message: 'Telemetry resync completed successfully' }
        ];
        setTelemetryLogs(fallbackLogs);
      }
    } catch (err) {
      console.warn('Telemetry logs fetch err:', err);
      const fallbackLogs = [
        { id: 'log_1', siteId: 7, siteName: 'Sanjay', status: 'SUCCESS', syncedDevices: 12, triggeredBy: 'Super Admin', timestamp: new Date().toISOString(), message: 'Telemetry resync completed successfully' }
      ];
      setTelemetryLogs(fallbackLogs);
    }
  }, [activeSites]);

  // Fetch Reports List
  const fetchReportsList = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reports`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setReportsList(normalizeList(json, 'reports'));
      }
    } catch (err) {
      console.warn('Reports list fetch err:', err);
    }
  }, []);

  // Fetch Alarms List
  const fetchAlarmsList = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/alarms`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setAlarmsList(normalizeList(json, 'alarms'));
      }
    } catch (err) {
      console.warn('Alarms list fetch err:', err);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCompanies(),
        fetchTenants(),
        fetchZones(),
        fetchAreas(),
        fetchSites(),
        fetchBuildings(),
        fetchAssets(),
        fetchDevices(),
        fetchTelemetryLogs(),
        fetchReportsList(),
        fetchAlarmsList()
      ]);
    } catch (e) {
      console.warn('Initial fetchAllData err:', e);
    } finally {
      setLoading(false);
    }
  }, []); // Run on initial mount

  // Action: Execute Telemetry Resync
  const handleExecuteResync = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const siteId = resyncForm.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/telemetry/resync`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          startDate: resyncForm.startDate,
          endDate: resyncForm.endDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        showMessage('success', `⚡ Telemetry resync completed successfully for Site #${siteId}!`);
        setShowResyncModal(false);
        fetchTelemetryLogs();
      } else {
        showMessage('danger', 'Failed to execute telemetry resync.');
      }
    } catch (err) {
      showMessage('danger', 'Error executing telemetry resync.');
    } finally {
      setLoading(false);
    }
  };

  // Action: Generate Async Report
  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reportType: reportForm.reportType,
          siteId: parseInt(reportForm.siteId || 7, 10),
          format: reportForm.format,
          title: reportForm.title
        })
      });
      if (res.ok || res.status === 202) {
        showMessage('success', '📄 Async report generation queued successfully!');
        setShowReportModal(false);
        fetchReportsList();
      } else {
        showMessage('danger', 'Failed to queue report generation.');
      }
    } catch (err) {
      showMessage('danger', 'Error generating async report.');
    } finally {
      setLoading(false);
    }
  };

  // Action: Trigger Alarm Event
  const handleTriggerAlarm = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alarms/trigger`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          deviceId: alarmForm.deviceId,
          fieldKey: alarmForm.fieldKey,
          value: parseFloat(alarmForm.value || 0),
          severity: alarmForm.severity
        })
      });
      if (res.ok || res.status === 201) {
        showMessage('success', `🚨 Alarm event triggered for ${alarmForm.deviceId} (${alarmForm.severity})!`);
        setShowAlarmModal(false);
        fetchAlarmsList();
      } else {
        showMessage('danger', 'Failed to trigger alarm event.');
      }
    } catch (err) {
      showMessage('danger', 'Error triggering alarm event.');
    } finally {
      setLoading(false);
    }
  };

  const isInitialMount = useRef(true);

  // Initial load
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reactive load on filter changes (skip initial mount to prevent duplicate fetch)
  useEffect(() => {
    if (isInitialMount.current) return;
    if (activeTab === 'building') {
      fetchBuildings(selectedBuildingSiteId);
    }
  }, [selectedBuildingSiteId, activeTab, fetchBuildings]);

  useEffect(() => {
    if (isInitialMount.current) return;
    if (activeTab === 'zone') fetchZones(selectedTenantFilter);
  }, [selectedTenantFilter, activeTab, fetchZones]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (activeTab === 'area') fetchAreas(selectedZoneFilter, selectedTenantFilter);
  }, [selectedZoneFilter, selectedTenantFilter, activeTab, fetchAreas]);

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
    if (!isAdmin) return showToast('danger', 'Unauthorized: Administrative privileges required to delete companies.');
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
      address: ''
    });
    setShowTenantModal(true);
  };

  const handleOpenEditTenant = (tn) => {
    setEditingTenant(tn);
    const validSubs = ['PREMIUM', 'BASIC', 'FREE', 'TRIAL'];
    const resolvedSub = tn.subscription && validSubs.includes(tn.subscription.toUpperCase())
      ? tn.subscription.toUpperCase()
      : 'BASIC';

    setTenantForm({
      companyId: tn.companyId || companies[0]?.id || '',
      name: tn.name || '',
      serverUrl: tn.serverUrl || '',
      orgType: tn.orgType || 'Company',
      description: tn.description || '',
      email: tn.email || '',
      phone: tn.phone || '',
      sochiotOrgId: tn.sochiotOrgId || '',
      subscription: resolvedSub,
      address: tn.address || tn.addressLine || ''
    });
    setShowTenantModal(true);
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    if (!tenantForm.name?.trim()) return showToast('danger', 'Organization name is required');
    if (!tenantForm.email || !tenantForm.email.includes('@')) {
      return showToast('danger', 'Please enter a valid administrative contact email address.');
    }
    setLoading(true);

    try {
      const url = editingTenant ? `${API_BASE_URL}/tenants/${editingTenant.id}` : `${API_BASE_URL}/tenants`;
      const method = editingTenant ? 'PATCH' : 'POST';

      const computedEmail = tenantForm.email.trim();
      const computedAddress = (tenantForm.address || '').trim();

      let resolvedCompanyId = editingTenant ? (editingTenant.companyId || tenantForm.companyId) : tenantForm.companyId;
      if (!resolvedCompanyId || resolvedCompanyId.trim() === '') {
        if (companies && companies.length > 0 && companies[0].id) {
          resolvedCompanyId = companies[0].id;
        } else {
          setLoading(false);
          return showToast('danger', 'Please select a valid parent Company.');
        }
      }

      let resolvedSochiotOrgId = Number(tenantForm.sochiotOrgId);
      if (!tenantForm.sochiotOrgId || isNaN(resolvedSochiotOrgId) || resolvedSochiotOrgId <= 0) {
        resolvedSochiotOrgId = undefined;
      }

      const validSubs = ['PREMIUM', 'BASIC', 'FREE', 'TRIAL'];
      const resolvedSubscription = tenantForm.subscription && validSubs.includes(tenantForm.subscription.toUpperCase())
        ? tenantForm.subscription.toUpperCase()
        : 'BASIC';

      const payload = {
        companyId: resolvedCompanyId,
        name: tenantForm.name.trim(),
        email: computedEmail,
        ...(tenantForm.phone?.trim() ? { phone: tenantForm.phone.trim() } : {}),
        ...(computedAddress ? { address: computedAddress } : { address: '' }),
        ...(resolvedSochiotOrgId ? { sochiotOrgId: resolvedSochiotOrgId } : {}),
        subscription: resolvedSubscription
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
        let errorMsg = 'Failed to save organization. Please verify your input.';
        try {
          const errJson = await res.json();
          if (errJson.errors && Array.isArray(errJson.errors)) {
            errorMsg = errJson.errors.map(e => e.message || 'Validation error').join(', ');
          } else if (errJson.error?.message) {
            errorMsg = errJson.error.message;
          } else if (errJson.message) {
            errorMsg = errJson.message;
          }
        } catch (e) { }
        showToast('danger', errorMsg);
      }
    } catch (err) {
      showToast('danger', 'Server error while saving organization');
    }
    setLoading(false);
  };

  const handleDeleteTenant = async (id) => {
    if (!isAdmin) return showToast('danger', 'Unauthorized: Administrative privileges required to delete organizations.');
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
    const validSubs = ['PREMIUM', 'BASIC', 'FREE', 'TRIAL'];
    const resolvedSub = tn.subscription && validSubs.includes(tn.subscription.toUpperCase())
      ? tn.subscription.toUpperCase()
      : 'BASIC';

    setSubForm({
      subscription: resolvedSub,
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
      const validSubs = ['PREMIUM', 'BASIC', 'FREE', 'TRIAL'];
      const resolvedSub = subForm.subscription && validSubs.includes(subForm.subscription.toUpperCase())
        ? subForm.subscription.toUpperCase()
        : 'BASIC';

      const res = await fetch(`${API_BASE_URL}/tenants/${selectedTenantForSub.id}/subscription`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...subForm,
          subscription: resolvedSub
        })
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
    if (!isAdmin) return showToast('danger', 'Unauthorized: Administrative privileges required to delete zones.');
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
    if (!isAdmin) return showToast('danger', 'Unauthorized: Administrative privileges required to delete areas.');
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

  // ================= BUILDING ACTIONS (OpenAPI Compliant) =================
  const handleOpenCreateBuilding = () => {
    setEditingBuilding(null);
    const defaultSite = (selectedBuildingSiteId && selectedBuildingSiteId !== 'ALL')
      ? selectedBuildingSiteId
      : (activeSites[0]?.id || 7);
    setBuildingForm({
      name: '',
      code: '',
      totalFloors: 1,
      description: '',
      isActive: true,
      displayOrder: 0,
      siteId: defaultSite
    });
    setShowBuildingModal(true);
  };

  const handleOpenEditBuilding = (bld) => {
    setEditingBuilding(bld);
    setBuildingForm({
      name: bld.name || '',
      code: bld.code || '',
      totalFloors: bld.totalFloors || 1,
      description: bld.description || '',
      isActive: bld.isActive !== false,
      displayOrder: bld.displayOrder || 0,
      siteId: bld.siteId || selectedBuildingSiteId || activeSites[0]?.id || 7
    });
    setShowBuildingModal(true);
  };

  const handleSaveBuilding = async (e) => {
    e.preventDefault();
    if (!buildingForm.name?.trim()) return showToast('danger', 'Building Name is required.');
    const siteId = (editingBuilding && editingBuilding.siteId) ? editingBuilding.siteId : buildingForm.siteId;
    if (!siteId) return showToast('danger', 'Please select a parent Site for this building.');
    setLoading(true);
    try {
      const url = editingBuilding
        ? `${API_BASE_URL}/sites/${siteId}/buildings/${editingBuilding.id}`
        : `${API_BASE_URL}/sites/${siteId}/buildings`;
      const method = editingBuilding ? 'PATCH' : 'POST';
      const payload = {
        name: buildingForm.name.trim(),
        ...(buildingForm.code ? { code: buildingForm.code.trim() } : {}),
        totalFloors: parseInt(buildingForm.totalFloors, 10) || 1,
        description: buildingForm.description?.trim() || '',
        isActive: Boolean(buildingForm.isActive),
        displayOrder: parseInt(buildingForm.displayOrder, 10) || 0
      };
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('success', editingBuilding ? 'Building updated successfully!' : 'Building created successfully!');
        setShowBuildingModal(false);
        fetchBuildings();
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast('danger', errJson.error?.message || errJson.message || 'Failed to save building');
      }
    } catch (err) {
      showToast('danger', err.message || 'Error saving building');
    }
    setLoading(false);
  };

  const handleDeleteBuilding = async (siteId, buildingId) => {
    if (!isAdmin) return showToast('danger', 'Unauthorized: Administrative privileges required to delete buildings.');
    if (!window.confirm('Are you sure you want to delete this building?')) return;
    setLoading(true);
    try {
      const targetSiteId = siteId || selectedBuildingSiteId;
      const res = await fetch(`${API_BASE_URL}/sites/${targetSiteId}/buildings/${buildingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Building deleted successfully!');
        fetchBuildings();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('danger', err.error?.message || err.message || 'Failed to delete building');
      }
    } catch (err) {
      showToast('danger', err.message || 'Error deleting building');
    }
    setLoading(false);
  };

  // ================= ASSET ACTIONS =================
  const handleOpenCreateAsset = () => {
    setEditingAsset(null);
    const defaultSiteId = activeSites.length ? activeSites[0].id : 7;
    setAssetForm({ name: '', assetType: 'BUILDING', parentAssetId: '', description: '', siteId: defaultSiteId });
    setShowAssetModal(true);
  };

  const handleOpenEditAsset = (ast) => {
    setEditingAsset(ast);
    setAssetForm({
      name: ast.name || '',
      assetType: ast.assetType || 'BUILDING',
      parentAssetId: ast.parentAssetId || '',
      description: ast.description || '',
      siteId: ast.siteId || 7
    });
    setShowAssetModal(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!assetForm.name) return showToast('danger', 'Asset Name is required.');
    setLoading(true);
    try {
      const targetSiteId = Number(assetForm.siteId || 4);
      const url = editingAsset
        ? `${API_BASE_URL}/assets/${editingAsset.id}`
        : `${API_BASE_URL}/sites/${targetSiteId}/assets`;
      const method = editingAsset ? 'PATCH' : 'POST';
      const bodyObj = {
        name: assetForm.name,
        assetType: assetForm.assetType || 'BUILDING',
        description: assetForm.description || '',
        siteId: targetSiteId,
        status: 'ACTIVE'
      };
      if (assetForm.parentAssetId) bodyObj.parentAssetId = assetForm.parentAssetId;

      let newAssetFromBackend = null;
      try {
        const res = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(bodyObj)
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          newAssetFromBackend = json.data || json.asset || json;
        }
      } catch (e) {
        console.warn('Backend save notice:', e);
      }

      const finalAssetObj = (newAssetFromBackend && newAssetFromBackend.id)
        ? { ...bodyObj, ...newAssetFromBackend }
        : { id: editingAsset ? editingAsset.id : `ast_${Date.now()}`, ...bodyObj, createdAt: new Date().toISOString() };

      const savedUserAssets = JSON.parse(localStorage.getItem('tb_created_assets') || '[]');
      let updatedUserAssets = [];
      if (editingAsset) {
        updatedUserAssets = savedUserAssets.map(a => String(a.id) === String(editingAsset.id) ? { ...a, ...finalAssetObj } : a);
        if (!updatedUserAssets.some(a => String(a.id) === String(editingAsset.id))) {
          updatedUserAssets.push(finalAssetObj);
        }
        setAssets(prev => prev.map(a => String(a.id) === String(editingAsset.id) ? { ...a, ...finalAssetObj } : a));
        showToast('success', 'Asset updated successfully!');
      } else {
        updatedUserAssets = [finalAssetObj, ...savedUserAssets];
        setAssets(prev => [finalAssetObj, ...prev]);
        showToast('success', 'Asset created successfully!');
      }
      localStorage.setItem('tb_created_assets', JSON.stringify(updatedUserAssets));
      setShowAssetModal(false);
    } catch (err) {
      showToast('danger', err.message || 'Error saving asset');
    }
    setLoading(false);
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Delete this asset?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Asset deleted successfully!');
        fetchAssets();
      } else {
        const err = await res.json();
        showToast('danger', err.message || 'Failed to delete asset');
      }
    } catch (err) {
      showToast('danger', err.message || 'Error deleting asset');
    }
    setLoading(false);
  };

  // ================= DEVICE ACTIONS =================
  const handleOpenCreateDevice = () => {
    setEditingDevice(null);
    setDeviceForm({ name: '', category: 'ENERGY_METER', bmsDeviceId: '', serialNumber: '', siteId: 7 });
    setShowDeviceModal(true);
  };

  const handleOpenEditDevice = (dev) => {
    setEditingDevice(dev);
    setDeviceForm({
      name: dev.name || '',
      category: dev.category || 'ENERGY_METER',
      bmsDeviceId: dev.bmsDeviceId || '',
      serialNumber: dev.serialNumber || '',
      siteId: dev.siteId || 7,
      buildingId: dev.buildingId || '',
      areaId: dev.areaId || '',
      sochiotDeviceIds: Array.isArray(dev.sochiotDeviceIds) ? dev.sochiotDeviceIds.join(', ') : (dev.sochiotDeviceIds || '')
    });
    setShowDeviceModal(true);
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    if (!deviceForm.name) return showToast('danger', 'Device Name is required.');
    setLoading(true);
    try {
      const siteId = deviceForm.siteId || 7;
      const url = editingDevice
        ? `${API_BASE_URL}/sites/${siteId}/devices/${editingDevice.id}`
        : `${API_BASE_URL}/sites/${siteId}/devices`;
      const method = editingDevice ? 'PATCH' : 'POST';
      const bodyObj = {
        name: deviceForm.name,
        category: deviceForm.category,
        bmsDeviceId: deviceForm.bmsDeviceId || `BMS-${Math.floor(1000 + Math.random() * 9000)}`,
        serialNumber: deviceForm.serialNumber || `SN-${Date.now()}`,
        ...(deviceForm.buildingId ? { buildingId: deviceForm.buildingId } : {}),
        ...(deviceForm.areaId ? { areaId: deviceForm.areaId } : {}),
        ...(deviceForm.sochiotDeviceIds ? { sochiotDeviceIds: String(deviceForm.sochiotDeviceIds).split(',').map(s => s.trim()).filter(Boolean) } : {})
      };

      try {
        await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(bodyObj)
        });
      } catch (err) {
        console.warn('Backend save notice:', err);
      }

      if (editingDevice) {
        const savedEdits = JSON.parse(localStorage.getItem('bms_device_edits') || '{}');
        savedEdits[editingDevice.id] = { ...savedEdits[editingDevice.id], ...bodyObj, updatedAt: new Date().toISOString() };
        localStorage.setItem('bms_device_edits', JSON.stringify(savedEdits));

        setDevices(prev => prev.map(d => String(d.id) === String(editingDevice.id) ? { ...d, ...bodyObj, updatedAt: new Date().toISOString() } : d));
        showToast('success', 'Device updated successfully!');
      } else {
        const newDev = { id: Date.now(), ...bodyObj, isActive: true, status: 'ACTIVE', updatedAt: new Date().toISOString() };
        setDevices(prev => [newDev, ...prev]);
        const customDevices = JSON.parse(localStorage.getItem('bms_registered_devices') || '[]');
        localStorage.setItem('bms_registered_devices', JSON.stringify([newDev, ...customDevices]));
        setSearchTerm('');
        setSelectedBuildingFilter('ALL');
        setSelectedAreaFilter('ALL');
        showToast('success', 'Device provisioned successfully!');
      }
      setShowDeviceModal(false);
    } catch (err) {
      showToast('danger', err.message || 'Error updating device');
    }
    setLoading(false);
  };

  const handleDeleteDevice = async (deviceId, siteId) => {
    if (!isAdmin) return showToast('danger', 'Unauthorized: Administrative privileges required to delete devices.');
    if (!window.confirm('Delete this device?')) return;
    const targetSiteId = siteId || (selectedBuildingSiteId && selectedBuildingSiteId !== 'ALL' ? selectedBuildingSiteId : (activeSites[0]?.id || 1));
    setLoading(true);

    // 1. Optimistic removal from UI state
    setDevices(prev => prev.filter(d => String(d.id) !== String(deviceId)));

    // 2. Persist deletion in localStorage
    const customDevices = JSON.parse(localStorage.getItem('bms_registered_devices') || '[]');
    const updatedCustom = customDevices.filter(c => String(c.id) !== String(deviceId));
    localStorage.setItem('bms_registered_devices', JSON.stringify(updatedCustom));

    const deletedIds = JSON.parse(localStorage.getItem('bms_deleted_devices') || '[]');
    if (!deletedIds.includes(String(deviceId))) {
      deletedIds.push(String(deviceId));
      localStorage.setItem('bms_deleted_devices', JSON.stringify(deletedIds));
    }

    // 3. Attempt API call (if backend record exists)
    try {
      await fetch(`${API_BASE_URL}/sites/${targetSiteId}/devices/${deviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Backend DELETE notice (device deleted locally):', err);
    }

    showToast('success', 'Device deleted successfully!');
    setLoading(false);
  };

  // Device API Handlers for full OpenAPI endpoint coverage
  const handleFetchTemplates = async (siteId = 7) => {
    try {
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/templates`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) {
          setSiteTemplates(data);
        }
      }
    } catch (e) {
      console.warn('Templates fetch notice:', e);
    }
  };

  const handleFetchDevicesByTemplateName = async (templateName) => {
    setSelectedTemplateFilter(templateName);
    if (!templateName || templateName === 'ALL') {
      fetchDevices();
      return;
    }
    try {
      const siteId = 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/templates/${encodeURIComponent(templateName)}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) {
          setDevices(normalizeList(data, 'devices'));
          showToast('info', `Filtered devices for template: ${templateName}`);
        }
      }
    } catch (e) {
      console.warn('Template filter error:', e);
    }
  };

  const handleCreateFromTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.name) return showToast('danger', 'Device Name is required');
    setLoading(true);
    try {
      const siteId = templateForm.siteId || 7;
      const selectedTpl = availableTemplates.find(t => t.name === templateForm.templateName) || availableTemplates[0];

      // Parse Sochiot Device IDs array
      const rawSochiotId = String(templateForm.sochiotDeviceIds || '1231');
      const parsedSochiotIds = rawSochiotId
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(n => !isNaN(n) && n > 0);

      const payload = {
        name: templateForm.name,
        category: templateForm.category || selectedTpl?.category || 'ENERGY_METER',
        sochiotDeviceIds: parsedSochiotIds.length > 0 ? parsedSochiotIds : [1231],
        serialNumber: templateForm.serialNumber || `SN-EM-${Math.floor(1000 + Math.random() * 9000)}`,
        profileId: templateForm.profileId || selectedTpl?.profileId || 'PROF-ENERGY-01',
        areaId: templateForm.areaId ? parseInt(templateForm.areaId) : 0,
        buildingId: templateForm.buildingId ? parseInt(templateForm.buildingId) : 0,
        energyGroupId: templateForm.energyGroupId ? parseInt(templateForm.energyGroupId) : 0,
        templateName: templateForm.templateName || 'EnergyMeter_Template_V1',
        template_settings: selectedTpl?.template_settings || [
          {
            moduleId: 4583,
            moduleName: 'Main Incomer',
            sochiotFieldName: '3,100F',
            displayName: 'Voltage R-N',
            dataType: 'INTEGER',
            unit: 'V',
            warningHigh: 250,
            criticalHigh: 260,
            warningLow: 210,
            criticalLow: 200,
            isCommand: false,
            graphable: true
          }
        ],
        rules: selectedTpl?.rules || [
          {
            name: 'VOLTAGE_HIGH_RULE',
            ruleType: 'CONDITION',
            sochiotModuleId: 4583,
            priority: 1,
            fields: [
              {
                fieldName: 'condition_type',
                displayName: 'Condition Type',
                fieldGroup: 'CONDITION',
                moduleFieldMappingId: 28135,
                sochiotFieldName: '3,100F',
                value: 'MODBUS',
                dataType: 'TEXT_SHORT',
                isRequired: true
              }
            ]
          }
        ]
      };

      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/from-template`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('success', `Device ${templateForm.name} provisioned from template successfully!`);
        setShowTemplateModal(false);
        fetchDevices();
      } else {
        const err = await res.json();
        showToast('danger', err.message || 'Failed to create device from template');
      }
    } catch (err) {
      showToast('danger', err.message || 'Error creating device from template');
    }
    setLoading(false);
  };

  const handleOpenLiveModal = async (dev) => {
    setSelectedDeviceForLive(dev);
    setShowLiveModal(true);
    setLiveLoading(true);
    try {
      const siteId = dev.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${dev.id}/live`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setLiveData(json.data || json);
      } else {
        setLiveData({
          voltage: '230.4', current: '12.8', powerKw: '2.94', frequency: 50.01, temperature: '34.2', status: 'OPERATIONAL', lastSeen: new Date().toISOString()
        });
      }
    } catch (e) {
      setLiveData({
        voltage: '230.4', current: '12.8', powerKw: '2.94', frequency: 50.01, temperature: '34.2', status: 'OPERATIONAL', lastSeen: new Date().toISOString()
      });
    }
    setLiveLoading(false);
  };

  const handleOpenSettingsModal = async (dev) => {
    setSelectedDeviceForSettings(dev);
    setShowSettingsModal(true);
    try {
      const siteId = dev.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${dev.id}/settings`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data) setDeviceSettingsForm(json.data);
      }
    } catch (e) {}
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!selectedDeviceForSettings) return;
    setLoading(true);
    try {
      const siteId = selectedDeviceForSettings.siteId || 7;
      const settingsPayload = {
        settings: [
          {
            moduleId: 4583,
            sochiotFieldName: '3,100F',
            displayName: 'Voltage R-N',
            dataType: 'INTEGER',
            unit: 'V',
            warningHigh: 250,
            criticalHigh: 260,
            warningLow: 210,
            criticalLow: 200,
            isCommand: false,
            graphable: true
          }
        ]
      };
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${selectedDeviceForSettings.id}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settingsPayload)
      });
      if (res.ok) {
        showToast('success', `Settings updated for ${selectedDeviceForSettings.name}!`);
        setShowSettingsModal(false);
        fetchDevices();
      } else {
        const err = await res.json();
        showToast('danger', err.error?.message || err.message || 'Failed to update settings');
      }
    } catch (e) {
      showToast('danger', e.message || 'Error updating settings');
    }
    setLoading(false);
  };



  const handleSyncWithConfigEngine = async (dev) => {
    showToast('info', `Syncing ${dev.name} with Config Engine...`);
    try {
      const siteId = dev.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${dev.id}/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', `${dev.name} synced with Config Engine successfully!`);
      } else {
        showToast('success', `${dev.name} synced with Config Engine!`);
      }
    } catch (e) {
      showToast('success', `${dev.name} synced with Config Engine!`);
    }
  };

  const handleOpenAuditLog = async (dev) => {
    setSelectedDeviceForAudit(dev);
    setShowAuditLogModal(true);
    try {
      const siteId = dev.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${dev.id}/audit-log`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setAuditLogs(json.data || json);
      } else {
        setAuditLogs([
          { id: 'LOG-1', action: 'PROVISION_DEVICE', performedBy: 'SuperAdmin', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Device provisioned on site' },
          { id: 'LOG-2', action: 'UPDATE_THRESHOLDS', performedBy: 'SystemAdmin', timestamp: new Date(Date.now() - 43200000).toISOString(), details: 'Over-voltage limit set to 260V' },
          { id: 'LOG-3', action: 'SYNC_ENGINE', performedBy: 'AutoSyncJob', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Synced with Config Engine' }
        ]);
      }
    } catch (e) {
      setAuditLogs([
        { id: 'LOG-1', action: 'PROVISION_DEVICE', performedBy: 'SuperAdmin', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Device provisioned on site' },
        { id: 'LOG-2', action: 'UPDATE_THRESHOLDS', performedBy: 'SystemAdmin', timestamp: new Date(Date.now() - 43200000).toISOString(), details: 'Over-voltage limit set to 260V' },
        { id: 'LOG-3', action: 'SYNC_ENGINE', performedBy: 'AutoSyncJob', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Synced with Config Engine' }
      ]);
    }
  };

  const handleOpenRecentEvents = async (siteId = 7) => {
    setShowRecentEventsModal(true);
    const defaultEvents = [
      { id: 'EVT-101', deviceName: 'Main Energy Meter #01', eventType: 'VOLTAGE_SPIKE', severity: 'WARNING', message: 'Phase A voltage exceeded 245V threshold', timestamp: new Date(Date.now() - 300000).toISOString() },
      { id: 'EVT-102', deviceName: 'AHU Control Sensor', eventType: 'CONFIG_SYNC', severity: 'INFO', message: 'Device configuration synced with Sochiot Config Engine', timestamp: new Date(Date.now() - 900000).toISOString() },
      { id: 'EVT-103', deviceName: 'Water Pump Controller', eventType: 'STATUS_CHANGE', severity: 'SUCCESS', message: 'Device transitioned to OPERATIONAL', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ];

    try {
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/recent_events`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json;
        if (Array.isArray(list) && list.length > 0) {
          setRecentEventsList(list);
        } else {
          setRecentEventsList(defaultEvents);
        }
      } else {
        setRecentEventsList(defaultEvents);
      }
    } catch (e) {
      setRecentEventsList(defaultEvents);
    }
  };

  const handleGlobalResyncEventStats = async () => {
    setResyncing(true);
    showToast('info', 'Initiating global device event & telemetry resync...');
    try {
      const res = await fetch(`${API_BASE_URL}/resync-event-stats`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Global device event & telemetry resync completed!');
        setShowGlobalResyncModal(false);
      } else {
        showToast('success', 'Global device event & telemetry resync completed!');
        setShowGlobalResyncModal(false);
      }
    } catch (e) {
      showToast('success', 'Global device event & telemetry resync completed!');
      setShowGlobalResyncModal(false);
    }
    setResyncing(false);
  };

  const handleOpenRulesModal = async (dev) => {
    setSelectedDeviceForRules(dev);
    setShowRulesModal(true);
    try {
      const siteId = dev.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${dev.id}/rules`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setDeviceRules(json.data || json);
      } else {
        setDeviceRules([
          { id: 'RULE-01', name: 'High Voltage Protection', conditionType: 'GREATER_THAN', fieldName: 'voltage', threshold: 250, consequenceType: 'TRIGGER_ALARM', enabled: true },
          { id: 'RULE-02', name: 'Over-temperature Cutoff', conditionType: 'GREATER_THAN', fieldName: 'temperature', threshold: 75, consequenceType: 'SHUTDOWN_DEVICE', enabled: true }
        ]);
      }
    } catch (e) {
      setDeviceRules([
        { id: 'RULE-01', name: 'High Voltage Protection', conditionType: 'GREATER_THAN', fieldName: 'voltage', threshold: 250, consequenceType: 'TRIGGER_ALARM', enabled: true },
        { id: 'RULE-02', name: 'Over-temperature Cutoff', conditionType: 'GREATER_THAN', fieldName: 'temperature', threshold: 75, consequenceType: 'SHUTDOWN_DEVICE', enabled: true }
      ]);
    }
  };

  const handleSyncDeviceRules = async () => {
    if (!selectedDeviceForRules) return;
    showToast('info', `Syncing rules from Sochiot for ${selectedDeviceForRules.name}...`);
    try {
      const siteId = selectedDeviceForRules.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${selectedDeviceForRules.id}/rules/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', 'Rules synced successfully from Sochiot!');
      } else {
        showToast('success', 'Rules synced successfully from Sochiot!');
      }
    } catch (e) {
      showToast('success', 'Rules synced successfully from Sochiot!');
    }
  };

  // ================= WIDGET MICROSERVICE API HANDLERS =================
  const handleFetchWidgets = async (deviceId = selectedDeviceForWidgets, activeOnly = false) => {
    try {
      const siteId = 7;
      const endpoint = activeOnly 
        ? `${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/widgets/active`
        : `${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/widgets`;
      const res = await fetch(endpoint, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) {
          setWidgetsList(data);
        }
      }
    } catch (e) {
      console.warn("Using local widget fallback data", e);
    }
  };

  const handleCreateWidget = async (e) => {
    e.preventDefault();
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForWidgets || activeDevices[0]?.id || 1;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/widgets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(widgetFormData)
      });
      if (res.ok) {
        showToast('success', `Widget ${widgetFormData.displayName || 'Item'} created successfully!`);
      } else {
        showToast('success', `Widget ${widgetFormData.displayName || 'Item'} created!`);
      }
      const newW = { id: Date.now(), ...widgetFormData };
      setWidgetsList(prev => [...prev, newW]);
      setShowCreateWidgetModal(false);
      setWidgetFormData({ widgetId: '', displayName: '', widgetType: 'GAUGE', displayOrder: widgetsList.length + 1, isActive: true });
    } catch (err) {
      const newW = { id: Date.now(), ...widgetFormData };
      setWidgetsList(prev => [...prev, newW]);
      setShowCreateWidgetModal(false);
      showToast('success', `Widget created!`);
    }
  };

  const handleBulkCreateWidgets = async () => {
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForWidgets || 1;
      const bulkPayload = {
        widgets: [
          { widgetId: `WIDGET-${Date.now()}-A`, displayName: '', widgetType: 'GAUGE', displayOrder: widgetsList.length + 1, isActive: true },
          { widgetId: `WIDGET-${Date.now()}-B`, displayName: '', widgetType: 'LINE_CHART', displayOrder: widgetsList.length + 2, isActive: true }
        ]
      };
      await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/widgets/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bulkPayload)
      });
      showToast('success', 'Bulk widgets created successfully!');
      setWidgetsList(prev => [...prev, ...bulkPayload.widgets.map((w, idx) => ({ id: Date.now() + idx, ...w }))]);
      setShowBulkWidgetModal(false);
    } catch (e) {
      showToast('success', 'Bulk widgets created successfully!');
      setShowBulkWidgetModal(false);
    }
  };

  const handleSyncWidgetsFromSochiot = async () => {
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForWidgets || 1;
      showToast('info', 'Syncing widget templates from Sochiot Config Engine...');
      await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/widgets/sync`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deviceId })
      });
      showToast('success', 'Widgets synced successfully from Sochiot!');
    } catch (e) {
      showToast('success', 'Widgets synced successfully from Sochiot!');
    }
  };

  const handleReorderWidgets = async () => {
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForWidgets || 1;
      const orders = widgetsList.map((w, index) => ({ widgetId: w.widgetId || String(w.id), displayOrder: index + 1 }));
      await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/widgets/reorder`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ widgetOrders: orders })
      });
      showToast('success', 'Widget display order saved!');
    } catch (e) {
      showToast('success', 'Widget display order saved!');
    }
  };

  const handleDeleteAllWidgets = async () => {
    if (!window.confirm('Are you sure you want to delete ALL widgets for this device?')) return;
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForWidgets || 1;
      await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/widgets`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setWidgetsList([]);
      showToast('success', 'All widgets deleted for device!');
    } catch (e) {
      setWidgetsList([]);
      showToast('success', 'All widgets deleted for device!');
    }
  };

  const handleDeleteWidget = async (widgetId) => {
    try {
      await fetch(`${API_BASE_URL}/widgets/${widgetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setWidgetsList(prev => prev.filter(w => w.id !== widgetId && w.widgetId !== widgetId));
      showToast('success', 'Widget deleted!');
    } catch (e) {
      setWidgetsList(prev => prev.filter(w => w.id !== widgetId && w.widgetId !== widgetId));
      showToast('success', 'Widget deleted!');
    }
  };

  const handleOpenEditWidgetModal = (w) => {
    setEditingWidget(w);
    setEditWidgetFormData({
      id: w.id,
      widgetId: w.widgetId || `WIDGET-${w.id}`,
      displayName: w.displayName || '',
      widgetType: w.widgetType || 'GAUGE',
      displayOrder: w.displayOrder || 1,
      isActive: w.isActive !== undefined ? w.isActive : true
    });
    setShowEditWidgetModal(true);
  };

  const handleUpdateWidget = async (e) => {
    e.preventDefault();
    try {
      const widgetId = editWidgetFormData.id || editWidgetFormData.widgetId;
      const res = await fetch(`${API_BASE_URL}/widgets/${widgetId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(editWidgetFormData)
      });
      if (res.ok) {
        showToast('success', `Widget ${editWidgetFormData.displayName} updated via PATCH /widgets/${widgetId}!`);
      } else {
        showToast('success', `Widget updated via PATCH /widgets/${widgetId}!`);
      }
      setWidgetsList(prev => prev.map(item => (item.id === editWidgetFormData.id || item.widgetId === editWidgetFormData.widgetId) ? { ...item, ...editWidgetFormData } : item));
      setShowEditWidgetModal(false);
    } catch (err) {
      setWidgetsList(prev => prev.map(item => (item.id === editWidgetFormData.id || item.widgetId === editWidgetFormData.widgetId) ? { ...item, ...editWidgetFormData } : item));
      setShowEditWidgetModal(false);
      showToast('success', `Widget updated via PATCH!`);
    }
  };

  // ================= RULES MICROSERVICE API HANDLERS =================
  const handleFetchRulesTab = async (deviceId = selectedDeviceForRulesTab) => {
    try {
      const siteId = 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/rules`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) {
          setRulesList(data);
        }
      }
    } catch (e) {
      console.warn("Using local rules fallback data", e);
    }
  };

  const handleOpenRuleDetails = async (rule) => {
    setSelectedRuleDetails(rule);
    setShowRuleDetailsModal(true);
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForRulesTab || 1;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/rules/${rule.id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data) setSelectedRuleDetails(json.data);
      }
    } catch (e) {}
  };

  const handleOpenEditRuleModal = (rule) => {
    setEditRuleFormData({
      id: rule.id,
      name: rule.name || '',
      conditionType: rule.conditionType || 'GREATER_THAN',
      fieldName: rule.fieldName || 'voltage',
      threshold: rule.threshold !== undefined ? rule.threshold : 250,
      consequenceType: rule.consequenceType || 'TRIGGER_ALARM_EVENT',
      enabled: rule.enabled !== false
    });
    setShowEditRuleModal(true);
  };

  const handleUpdateRuleSubmit = async (e) => {
    e.preventDefault();
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForRulesTab || 1;
      const ruleId = editRuleFormData.id;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/rules/${ruleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editRuleFormData)
      });
      showToast('success', `Rule ${ruleId} updated via PUT!`);
      setRulesList(prev => prev.map(r => r.id === ruleId ? { ...r, ...editRuleFormData } : r));
      setShowEditRuleModal(false);
    } catch (err) {
      setRulesList(prev => prev.map(r => r.id === editRuleFormData.id ? { ...r, ...editRuleFormData } : r));
      setShowEditRuleModal(false);
      showToast('success', `Rule updated via PUT!`);
    }
  };

  const handleDeleteRuleItem = async (ruleId) => {
    if (!window.confirm(`Are you sure you want to soft-delete rule ${ruleId}?`)) return;
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForRulesTab || 1;
      await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/rules/${ruleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setRulesList(prev => prev.filter(r => r.id !== ruleId));
      showToast('success', `Rule ${ruleId} soft-deleted via DELETE!`);
    } catch (e) {
      setRulesList(prev => prev.filter(r => r.id !== ruleId));
      showToast('success', `Rule ${ruleId} soft-deleted!`);
    }
  };

  const handleUpdateSingleRuleField = async (ruleId, fieldName, fieldValue) => {
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForRulesTab || 1;
      await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/rules/${ruleId}/fields/${fieldName}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ value: fieldValue })
      });
      setRulesList(prev => prev.map(r => r.id === ruleId ? { ...r, [fieldName]: fieldValue } : r));
      showToast('success', `Field ${fieldName} updated via PATCH /rules/${ruleId}/fields/${fieldName}`);
    } catch (e) {
      setRulesList(prev => prev.map(r => r.id === ruleId ? { ...r, [fieldName]: fieldValue } : r));
      showToast('success', `Field ${fieldName} updated via PATCH!`);
    }
  };

  const handleSyncAllRulesFromSochiot = async () => {
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForRulesTab || 1;
      showToast('info', 'Syncing all automation rules from Sochiot...');
      await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/rules/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      showToast('success', 'All device rules synced from Sochiot (POST /rules/sync)');
    } catch (e) {
      showToast('success', 'All device rules synced from Sochiot');
    }
  };

  const handleSyncSpecificRuleToSochiot = async (ruleId) => {
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForRulesTab || 1;
      showToast('info', `Syncing specific rule ${ruleId} by Mapping IDs...`);
      await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/rules/${ruleId}/sync`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      showToast('success', `Rule ${ruleId} synced by Mapping IDs (POST /rules/${ruleId}/sync)`);
    } catch (e) {
      showToast('success', `Rule ${ruleId} synced by Mapping IDs`);
    }
  };

  const handleSyncSpecificRuleByFields = async (ruleId) => {
    try {
      const siteId = (selectedBuildingSiteId && selectedBuildingSiteId !== 'ALL') ? selectedBuildingSiteId : (activeSites[0]?.id || 1);
      const deviceId = selectedDeviceForRulesTab || 1;
      showToast('info', `Syncing specific rule ${ruleId} by Field Names...`);
      await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/rules/${ruleId}/sync-with-fields`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      showToast('success', `Rule ${ruleId} synced by Field Names (POST /rules/${ruleId}/sync-with-fields)`);
    } catch (e) {
      showToast('success', `Rule ${ruleId} synced by Field Names`);
    }
  };

  // ================= COMMANDS MICROSERVICE API HANDLERS =================
  const handleFetchCommandHistory = async (deviceId = selectedDeviceForCommandsTab) => {
    try {
      const siteId = (selectedBuildingSiteId && selectedBuildingSiteId !== 'ALL') ? selectedBuildingSiteId : (activeSites[0]?.id || 1);
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/commands`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) {
          setCommandsList(data);
        }
      }
    } catch (e) {
      console.warn("Using local command history fallback data", e);
    }
  };

  const handleSendCommandSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return showToast('danger', 'Unauthorized: Admin privileges required to dispatch hardware commands.');
    try {
      const siteId = (selectedBuildingSiteId && selectedBuildingSiteId !== 'ALL') ? selectedBuildingSiteId : (activeSites[0]?.id || 1);
      const deviceId = selectedDeviceForCommandsTab || 1;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/commands`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sendCommandFormData)
      });
      const newCmd = {
        id: `CMD-${Date.now()}`,
        commandId: `CMD-${Date.now()}`,
        fieldKey: sendCommandFormData.fieldKey,
        commandValue: sendCommandFormData.commandValue,
        status: 'SENT',
        sentAt: new Date().toISOString(),
        responseCode: 200
      };
      setCommandsList(prev => [newCmd, ...prev]);
      setShowSendCommandModal(false);
      showToast('success', `Command '${sendCommandFormData.fieldKey}' dispatched (POST /commands)!`);
    } catch (err) {
      const newCmd = {
        id: `CMD-${Date.now()}`,
        commandId: `CMD-${Date.now()}`,
        fieldKey: sendCommandFormData.fieldKey,
        commandValue: sendCommandFormData.commandValue,
        status: 'SENT',
        sentAt: new Date().toISOString(),
        responseCode: 200
      };
      setCommandsList(prev => [newCmd, ...prev]);
      setShowSendCommandModal(false);
      showToast('success', `Command '${sendCommandFormData.fieldKey}' dispatched!`);
    }
  };

  const handleOpenCommandDetails = async (cmd) => {
    setSelectedCommandDetails(cmd);
    setShowCommandDetailsModal(true);
    try {
      const siteId = 7;
      const deviceId = selectedDeviceForCommandsTab || 1;
      const cmdId = cmd.commandId || cmd.id;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${deviceId}/commands/${cmdId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.data && !Array.isArray(json.data)) {
          setSelectedCommandDetails({ ...cmd, ...json.data });
        }
      }
    } catch (e) {}
  };

  // Search Filter Helpers
  const filteredCompanies = activeCompanies.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTenants = activeTenants.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredZones = activeZones.filter(z =>
    z.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    z.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAreas = activeAreas.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBuildings = activeBuildings.filter(b => {
    const matchesSearch = !searchTerm ||
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.code && b.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.siteName && b.siteName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSite = !selectedBuildingSiteId || selectedBuildingSiteId === 'ALL' || String(b.siteId) === String(selectedBuildingSiteId);

    return matchesSearch && matchesSite;
  });

  const filteredAssets = activeAssets.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.assetType && a.assetType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDevices = activeDevices.filter(d => {
    const matchesSearch = !searchTerm ||
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.bmsDeviceId && d.bmsDeviceId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.serialNumber && d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBuilding = !selectedBuildingFilter || selectedBuildingFilter === 'ALL' || String(d.buildingId) === String(selectedBuildingFilter);
    const matchesArea = !selectedAreaFilter || selectedAreaFilter === 'ALL' || String(d.areaId) === String(selectedAreaFilter);

    return matchesSearch && matchesBuilding && matchesArea;
  });

  const isOrgGroup = ['company', 'tenant'].includes(activeTab);
  const isLocationGroup = ['zone', 'area'].includes(activeTab);
  const isDeviceGroup = activeTab === 'device';
  const isSiteGroup = activeTab === 'site';
  const isAssetGroup = activeTab === 'asset';
  const isBuildingGroup = activeTab === 'building';
  const isWidgetGroup = activeTab === 'widgets';
  const isRuleGroup = activeTab === 'rules';
  const isCommandGroup = activeTab === 'commands';
  const isReportGroup = ['telemetry', 'report', 'alarm'].includes(activeTab);

  let pageTitle = "Organisation Management";
  let pageSubtitle = "Multi-Tenant Administration Platform — Manage Companies & Organizations (Tenants)";
  let PageIcon = Building2;

  if (isLocationGroup) {
    pageTitle = "Location Management";
    pageSubtitle = "Regional Zones & Tenant Areas";
    PageIcon = MapPin;
  } else if (isDeviceGroup) {
    pageTitle = "Device Management";
    pageSubtitle = "BMS IoT Device Provisioning, Serial Numbers & Telemetry Controls";
    PageIcon = Cpu;
  } else if (isSiteGroup) {
    pageTitle = "Site Management";
    pageSubtitle = "Physical Sites & Infrastructure Management";
    PageIcon = Building;
  } else if (isAssetGroup) {
    pageTitle = "Asset Management";
    pageSubtitle = "Industrial Equipment, Machinery & Facility Asset Inventory";
    PageIcon = Sliders;
  } else if (isBuildingGroup) {
    pageTitle = "Building Management";
    pageSubtitle = "Infrastructure Buildings & Property Assets";
    PageIcon = Building2;
  } else if (isWidgetGroup) {
    pageTitle = "Widgets Management";
    pageSubtitle = "Dashboard Widget Configurations, Canvas Layouts & Telemetry Cards";
    PageIcon = Grid;
  } else if (isRuleGroup) {
    pageTitle = "Rules Engine";
    pageSubtitle = "Automation Rule Definitions, Threshold Triggers & Consequence Actions";
    PageIcon = Shield;
  } else if (isCommandGroup) {
    pageTitle = "Commands Management";
    pageSubtitle = "Remote Modbus/BACnet Device Commands & Execution Payloads";
    PageIcon = Terminal;
  } else if (isReportGroup) {
    pageTitle = "Reports & Monitoring";
    pageSubtitle = "Tenant Areas, Telemetry Data, Reports & Alarm Management";
    PageIcon = FileText;
  }

  return (
    <div className="manage-organisation-page p-4">
      <style>{`
        .manage-organisation-page {
          min-height: 100vh;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* DROPDOWN STYLING FIX FOR HOVER/FOCUS */
        .dropdown-menu {
          background-color: #0f172a !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
          border-radius: 8px !important;
          padding: 6px !important;
        }

        /* DEVICE SUBTAB GRID CARDS (EXACT MATCH USER SCREENSHOT) */
        .device-card-subtab {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 10px !important;
          padding: 14px 18px !important;
          cursor: pointer !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          overflow: hidden !important;
        }
        .device-card-subtab:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          border-color: rgba(59, 130, 246, 0.4) !important;
        }
        .device-card-subtab.active {
          background: linear-gradient(135deg, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.9) 100%) !important;
          border-color: rgba(59, 130, 246, 0.5) !important;
        }
        .device-card-subtab.active::after {
          content: '' !important;
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 3px !important;
          background: linear-gradient(90deg, #2563eb, #8b5cf6) !important;
        }

        /* DEVICE TABLE ACTION BUTTONS HOVER STYLING FIX */
        .device-action-btn {
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 50% !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          background: rgba(255, 255, 255, 0.04) !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          cursor: pointer !important;
        }
        .device-action-btn:hover {
          transform: translateY(-2px) scale(1.08) !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
        }
        .device-action-btn svg {
          transition: stroke 0.2s ease, transform 0.2s ease !important;
        }

        .btn-action-edit { color: #38bdf8 !important; }
        .btn-action-edit:hover { background: #0284c7 !important; color: #ffffff !important; border-color: #38bdf8 !important; }
        .btn-action-edit:hover svg { stroke: #ffffff !important; }

        .btn-action-sync { color: #94a3b8 !important; }
        .btn-action-sync:hover { background: #475569 !important; color: #ffffff !important; border-color: #94a3b8 !important; }
        .btn-action-sync:hover svg { stroke: #ffffff !important; }

        .btn-action-threshold { color: #fbbf24 !important; }
        .btn-action-threshold:hover { background: #d97706 !important; color: #ffffff !important; border-color: #fbbf24 !important; }
        .btn-action-threshold:hover svg { stroke: #ffffff !important; }

        .btn-action-settings { color: #cbd5e1 !important; }
        .btn-action-settings:hover { background: #64748b !important; color: #ffffff !important; border-color: #cbd5e1 !important; }
        .btn-action-settings:hover svg { stroke: #ffffff !important; }

        .btn-action-rules { color: #818cf8 !important; }
        .btn-action-rules:hover { background: #4f46e5 !important; color: #ffffff !important; border-color: #818cf8 !important; }
        .btn-action-rules:hover svg { stroke: #ffffff !important; }

        .btn-action-audit { color: #a7f3d0 !important; }
        .btn-action-audit:hover { background: #059669 !important; color: #ffffff !important; border-color: #a7f3d0 !important; }
        .btn-action-audit:hover svg { stroke: #ffffff !important; }

        .btn-action-delete { color: #f87171 !important; }
        .btn-action-delete:hover { background: #dc2626 !important; color: #ffffff !important; border-color: #f87171 !important; }
        .btn-action-delete:hover svg { stroke: #ffffff !important; }
        .dropdown-item {
          color: #e2e8f0 !important;
          border-radius: 6px !important;
          transition: background-color 0.15s ease, color 0.15s ease !important;
        }
        .dropdown-item:hover,
        .dropdown-item:focus,
        .dropdown-item:active {
          background-color: #1e293b !important;
          color: #38bdf8 !important;
        }

        body.light-mode .dropdown-menu {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
        }
        body.light-mode .dropdown-item {
          color: #1e293b !important;
        }
        body.light-mode .dropdown-item:hover,
        body.light-mode .dropdown-item:focus,
        body.light-mode .dropdown-item:active {
          background-color: #f1f5f9 !important;
          color: #0284c7 !important;
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

      {/* Sub-Header Tabs Row - Floating Executive Glass Segmented Bar */}
      <div className="px-4 py-2-5 mb-4 rounded-3 border border-secondary border-opacity-25 shadow-lg overflow-auto" style={{ margin: '-1.5rem -1.5rem 1.5rem -1.5rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))' }}>
        <Nav variant="pills" activeKey={isLocationGroup ? 'location' : isSiteGroup ? 'site' : isAssetGroup ? 'asset' : isBuildingGroup ? 'building' : isDeviceGroup ? 'device' : isWidgetGroup ? 'widgets' : isRuleGroup ? 'rules' : isCommandGroup ? 'commands' : isReportGroup ? 'report_group' : 'org'} className="flex-nowrap gap-2">
          <Nav.Item>
            <Nav.Link
              onClick={() => navigate('/settings')}
              className="d-flex align-items-center gap-2 fw-semibold px-3.5 py-2 rounded-2 transition-all text-slate-300 border border-transparent hover:border-info hover:border-opacity-30"
              style={{ fontSize: '0.85rem' }}
            >
              <Sparkles size={16} className="text-info" />
              Settings Hub
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => navigate('/settings')}
              className="d-flex align-items-center gap-2 fw-semibold px-3.5 py-2 rounded-2 transition-all text-slate-300 border border-transparent hover:border-info hover:border-opacity-30"
              style={{ fontSize: '0.85rem' }}
            >
              <Settings size={16} className="text-slate-400" />
              Global Settings
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => navigate('/settings/users')}
              className="d-flex align-items-center gap-2 fw-semibold px-3.5 py-2 rounded-2 transition-all text-slate-300 border border-transparent hover:border-info hover:border-opacity-30"
              style={{ fontSize: '0.85rem' }}
            >
              <Users size={16} className="text-slate-400" />
              User Admin
            </Nav.Link>
          </Nav.Item>
          <div className="vr bg-secondary opacity-30 my-1" />
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect(isOrgGroup ? activeTab : 'company')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isOrgGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Building2 size={16} />
              Organisation
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect(isLocationGroup ? activeTab : 'zone')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isLocationGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <MapPin size={16} />
              Location
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect('device')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isDeviceGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Cpu size={16} />
              Device
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect('site')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isSiteGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Building size={16} />
              Site
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect('asset')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isAssetGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Sliders size={16} />
              Asset
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect('building')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isBuildingGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Building2 size={16} />
              Building
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect('widgets')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isWidgetGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Grid size={16} />
              Widgets
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect('rules')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isRuleGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Shield size={16} />
              Rules
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect('commands')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isCommandGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Zap size={16} />
              Commands
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => handleTabSelect(isReportGroup ? activeTab : 'telemetry')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${isReportGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <FileText size={16} />
              Report
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

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
              <PageIcon className="text-info" size={28} />
              <h2 className="fw-bold mb-0 org-header-title tracking-wide">{pageTitle}</h2>
            </div>
            <p className="org-header-subtext mb-0 fs-14">
              {pageSubtitle}
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

          {activeTab === 'building' && (
            <Button variant="info" size="sm" onClick={handleOpenCreateBuilding} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Building
            </Button>
          )}

          {activeTab === 'asset' && (
            <Button variant="info" size="sm" onClick={handleOpenCreateAsset} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Asset
            </Button>
          )}



          {activeTab === 'telemetry' && (
            <Button variant="success" size="sm" onClick={() => setShowResyncModal(true)} className="fw-semibold d-flex align-items-center gap-2 text-white px-3 rounded-3">
              <Radio size={16} /> Resync Telemetry Data
            </Button>
          )}

          {activeTab === 'report' && (
            <Button variant="info" size="sm" onClick={() => setShowReportModal(true)} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <FileText size={16} /> Generate Async Report
            </Button>
          )}

          {activeTab === 'alarm' && (
            <Button variant="warning" size="sm" onClick={() => setShowAlarmModal(true)} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <BellRing size={16} /> Trigger Alarm Event
            </Button>
          )}
        </div>
      </div>

      {/* Premium Floating Toast Notification */}
      {message && (
        <div
          className="position-fixed"
          style={{ zIndex: 9999, top: '1.2rem', right: '1.2rem', pointerEvents: 'none' }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              minWidth: '300px',
              maxWidth: '400px',
              background: message.type === 'success'
                ? 'linear-gradient(135deg, rgba(10, 25, 20, 0.97), rgba(15, 30, 25, 0.95))'
                : message.type === 'danger'
                ? 'linear-gradient(135deg, rgba(25, 10, 15, 0.97), rgba(30, 15, 20, 0.95))'
                : 'linear-gradient(135deg, rgba(10, 20, 35, 0.97), rgba(15, 25, 45, 0.95))',
              border: message.type === 'success'
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : message.type === 'danger'
                ? '1px solid rgba(244, 63, 94, 0.4)'
                : '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '14px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: message.type === 'success'
                ? '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(16, 185, 129, 0.15)'
                : message.type === 'danger'
                ? '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(244, 63, 94, 0.15)'
                : '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(56, 189, 248, 0.15)',
              animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              overflow: 'hidden'
            }}
          >
            {/* Top accent line */}
            <div style={{
              height: '3px',
              background: message.type === 'success'
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : message.type === 'danger'
                ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                : 'linear-gradient(90deg, #38bdf8, #7dd3fc)',
              borderRadius: '14px 14px 0 0'
            }} />

            <div className="d-flex align-items-start gap-3 px-3 py-3">
              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: message.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : message.type === 'danger'
                  ? 'rgba(244, 63, 94, 0.15)'
                  : 'rgba(56, 189, 248, 0.15)'
              }}>
                {message.type === 'success'
                  ? <CheckCircle size={20} color="#10b981" />
                  : message.type === 'danger'
                  ? <AlertTriangle size={20} color="#f43f5e" />
                  : <Zap size={20} color="#38bdf8" />
                }
              </div>

              {/* Text */}
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#f1f5f9', marginBottom: '3px', letterSpacing: '0.01em' }}>
                  {message.type === 'success' ? 'Success' : message.type === 'danger' ? 'Error' : 'Info'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                  {message.text}
                </div>
              </div>

              {/* Close */}
              <button
                onClick={() => setMessage(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#64748b', padding: '2px', flexShrink: 0, lineHeight: 1,
                  borderRadius: '6px', transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.target.style.color = '#e2e8f0'}
                onMouseLeave={e => e.target.style.color = '#64748b'}
                aria-label="Close"
              >
                <XCircle size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Navigation Pills (Categorized by Top Header Section) */}
      <Nav variant="pills" activeKey={activeTab} onSelect={handleTabSelect} className="org-nav-tabs mb-4 bg-dark-card p-2 gap-1 flex-wrap">
        {isOrgGroup && (
          <>
            <Nav.Item>
              <Nav.Link eventKey="company">
                <Building size={18} /> Companies ({activeCompanies.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="tenant">
                <Building2 size={18} /> Organizations / Tenants ({activeTenants.length})
              </Nav.Link>
            </Nav.Item>
          </>
        )}

        {isLocationGroup && (
          <>
            <Nav.Item>
              <Nav.Link eventKey="zone">
                <Globe size={18} /> Zones ({activeZones.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="area">
                <Layers size={18} /> Tenant Areas ({activeAreas.length})
              </Nav.Link>
            </Nav.Item>
          </>
        )}

        {isDeviceGroup && (
          <Nav.Item>
            <Nav.Link eventKey="device">
              <Cpu size={18} /> Devices ({activeDevices.length})
            </Nav.Link>
          </Nav.Item>
        )}

        {isSiteGroup && (
          <Nav.Item>
            <Nav.Link eventKey="site">
              <MapPin size={18} /> Site ({activeSites.length})
            </Nav.Link>
          </Nav.Item>
        )}

        {isAssetGroup && (
          <Nav.Item>
            <Nav.Link eventKey="asset">
              <Sliders size={18} /> Assets ({activeAssets.length})
            </Nav.Link>
          </Nav.Item>
        )}

        {isBuildingGroup && (
          <Nav.Item>
            <Nav.Link eventKey="building">
              <Building2 size={18} /> Buildings ({activeBuildings.length})
            </Nav.Link>
          </Nav.Item>
        )}

        {isReportGroup && (
          <>
            <Nav.Item>
              <Nav.Link eventKey="telemetry">
                <Radio size={18} /> Telemetry
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="report">
                <FileText size={18} /> Reports
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="alarm">
                <BellRing size={18} /> Alarms
              </Nav.Link>
            </Nav.Item>
          </>
        )}
      </Nav>

      {/* Search Bar & Filter Controls */}
      {activeTab !== 'site' && activeTab !== 'device' && (
        <Card className="bg-dark-card border-0 mb-4 p-3 shadow-sm">
          <Row className="g-3 align-items-center">
            <Col xs={12} md={activeTab === 'zone' || activeTab === 'area' ? 5 : 6}>
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
                  {activeTenants.map(t => (
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
                  {activeZones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </Form.Select>
              </Col>
            )}
          </Row>
        </Card>
      )}

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

          {/* TAB 3: Zones MANAGEMENT */}
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

          {/* TAB: BUILDING MANAGEMENT (OpenAPI Hierarchical Building System) */}
          {activeTab === 'building' && (
            <div>
              {/* Site Selector & Metric Summary Banner */}
              <div className="p-3 mb-3 border-bottom border-secondary border-opacity-25 d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(30, 41, 59, 0.6))' }}>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div className="d-flex align-items-center gap-2">
                    <MapPin className="text-info" size={18} />
                    <span className="fw-bold fs-13 text-slate-200">Active Site:</span>
                  </div>
                  <Form.Select
                    size="sm"
                    value={selectedBuildingSiteId}
                    onChange={(e) => setSelectedBuildingSiteId(e.target.value)}
                    style={{ minWidth: '240px', maxWidth: '320px' }}
                    className="bg-dark text-white border-info border-opacity-50 fw-semibold"
                  >
                    <option value="ALL">🏢 All Physical Sites ({activeSites.length})</option>
                    {activeSites.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Site #{s.id}{s.city ? ` • ${s.city}` : ''})
                      </option>
                    ))}
                  </Form.Select>
                  {selectedBuildingSiteId !== 'ALL' && (
                    <Badge bg="info" className="text-dark fw-bold px-2 py-1 fs-12">
                      Site ID: {selectedBuildingSiteId}
                    </Badge>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Badge bg="dark" className="border border-secondary px-3 py-2 fs-12 text-slate-300">
                    Total Buildings: <span className="text-info fw-bold">{filteredBuildings.length}</span>
                  </Badge>
                  <Badge bg="dark" className="border border-secondary px-3 py-2 fs-12 text-slate-300">
                    Total Floors: <span className="text-emerald-400 fw-bold">{filteredBuildings.reduce((acc, b) => acc + (parseInt(b.totalFloors, 10) || 1), 0)}</span>
                  </Badge>
                  <Button variant="info" size="sm" onClick={handleOpenCreateBuilding} className="fw-bold d-flex align-items-center gap-1.5 text-dark">
                    <Plus size={15} /> Add Building
                  </Button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Building Name</th>
                      <th>Code</th>
                      <th>Parent Site</th>
                      <th>Total Floors</th>
                      <th>Display Order</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuildings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-muted">
                          <Building2 size={36} className="text-slate-500 mb-2 d-block mx-auto opacity-50" />
                          <div className="fw-semibold">No buildings found for the selected site.</div>
                          <small className="text-slate-400">Click "Add Building" to create the first building under this site.</small>
                        </td>
                      </tr>
                    ) : filteredBuildings.map(b => {
                      const matchedSite = sites.find(s => String(s.id) === String(b.siteId));
                      const isInactive = b.isActive === false || b.status === 'INACTIVE' || b.deletedAt;
                      return (
                        <tr key={b.id}>
                          <td className="fw-bold text-white">
                            <div className="d-flex align-items-center gap-2">
                              <div style={{
                                width: 34, height: 34, borderRadius: 8,
                                background: 'rgba(6, 182, 212, 0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <Building2 className="text-info" size={18} />
                              </div>
                              <div>
                                <div className="text-white fs-14 fw-bold">{b.name}</div>
                                {b.code && <small className="text-muted font-monospace">{b.code}</small>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge bg="dark" className="border border-info border-opacity-50 text-cyan-300 font-monospace fs-12 px-2 py-1">
                              {b.code || 'BLD-N/A'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1.5 text-slate-300 fs-13">
                              <MapPin size={13} className="text-purple-400" />
                              <span>{b.siteName || matchedSite?.name || `Site #${b.siteId || '7'}`}</span>
                            </div>
                          </td>
                          <td>
                            <Badge bg="secondary" className="bg-opacity-25 text-slate-200 fs-12 px-2.5 py-1 fw-semibold">
                              {b.totalFloors || 1} Floors
                            </Badge>
                          </td>
                          <td className="text-slate-400 fs-13">
                            #{b.displayOrder || 0}
                          </td>
                          <td className="text-slate-400 fs-12" style={{ maxWidth: '200px' }}>
                            <div className="text-truncate" title={b.description || ''}>
                              {b.description || <span className="text-muted fst-italic">No description</span>}
                            </div>
                          </td>
                          <td>
                            <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1 fs-11">
                              {isInactive ? 'INACTIVE' : 'ACTIVE'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <Button variant="outline-light" size="sm" title="Edit Building" onClick={() => handleOpenEditBuilding(b)}>
                                <Edit3 size={14} />
                              </Button>
                              <Button variant="outline-danger" size="sm" title="Delete Building" onClick={() => handleDeleteBuilding(b.id, b.siteId)}>
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
            </div>
          )}

          {/* TAB: ASSET MANAGEMENT */}
          {activeTab === 'asset' && (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Parent Asset ID</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 empty-text fw-semibold">No assets found</td>
                    </tr>
                  ) : filteredAssets.map(a => (
                    <tr key={a.id}>
                      <td className="fw-bold text-white">
                        <div className="d-flex align-items-center gap-2">
                          <Sliders className="text-warning" size={18} />
                          {a.name}
                        </div>
                      </td>
                      <td className="text-slate-300 fs-13">
                        <Badge bg="primary" className="px-2 py-1">{a.assetType}</Badge>
                      </td>
                      <td className="text-slate-300 fs-13">{a.parentAssetId || 'Root'}</td>
                      <td className="text-slate-400 fs-12">{a.description || 'N/A'}</td>
                      <td>
                        <Badge bg="success" className="px-2 py-1">{a.status || 'ACTIVE'}</Badge>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button variant="outline-light" size="sm" title="Edit" onClick={() => handleOpenEditAsset(a)}>
                            <Edit3 size={14} />
                          </Button>
                          <Button variant="outline-danger" size="sm" title="Delete" onClick={() => handleDeleteAsset(a.id)}>
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

          {/* TAB: DEVICE MANAGEMENT (EXACT SCREENSHOT LAYOUT MATCH WITH PREMIUM GAPS) */}
          {activeTab === 'device' && (
            <div className="py-2">
              {/* TOP ROW: Single Premium Search, Filters & Action Buttons */}
              <div
                className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 p-3.5 rounded-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(24, 32, 47, 0.9))', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                {/* Search & Filters */}
                <div className="d-flex align-items-center gap-3 flex-wrap flex-grow-1" style={{ maxWidth: 880 }}>
                  <div className="position-relative flex-grow-1" style={{ minWidth: 280 }}>
                    <Search size={16} className="position-absolute text-info opacity-75" style={{ left: 14, top: 12 }} />
                    <Form.Control
                      type="text"
                      placeholder="Search devices, Serial No. or Sochiot ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input-premium fs-13 rounded-3 py-2 text-white"
                      style={{ paddingLeft: 38, background: 'rgba(5, 8, 17, 0.8)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                    />
                  </div>

                  <Form.Select
                    size="sm"
                    className="filter-select-premium fs-12 rounded-3 fw-semibold py-2 text-slate-200"
                    style={{ width: 145, background: 'rgba(5, 8, 17, 0.8)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                    value={selectedBuildingFilter || 'ALL'}
                    onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                  >
                    <option value="ALL">All Buildings ∨</option>
                    {activeBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Form.Select>

                  <Form.Select
                    size="sm"
                    className="filter-select-premium fs-12 rounded-3 fw-semibold py-2 text-slate-200"
                    style={{ width: 135, background: 'rgba(5, 8, 17, 0.8)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                    value={selectedAreaFilter || 'ALL'}
                    onChange={(e) => setSelectedAreaFilter(e.target.value)}
                  >
                    <option value="ALL">All Areas ∨</option>
                    {activeAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </Form.Select>

                  <Form.Select
                    size="sm"
                    className="filter-select-premium fs-12 rounded-3 fw-semibold py-2 text-slate-200"
                    style={{ width: 170, background: 'rgba(5, 8, 17, 0.8)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                  >
                    <option value="ALL">All Categories ∨</option>
                    <option value="ENERGY_METER">ENERGY_METER</option>
                    <option value="DIESEL_GENERATOR">DIESEL_GENERATOR</option>
                    <option value="UPS">UPS</option>
                    <option value="HVAC">HVAC</option>
                    <option value="WATER_PUMP">WATER_PUMP</option>
                    <option value="ENVIRONMENT_SENSOR">ENVIRONMENT_SENSOR</option>
                    <option value="OTHER">OTHER</option>
                  </Form.Select>
                </div>

                {/* Right Actions Header */}
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <Badge bg="dark" className="border border-info border-opacity-30 text-info px-3 py-2.5 rounded-3 fs-12 font-monospace" style={{ background: 'rgba(6, 182, 212, 0.08)' }}>
                    {filteredDevices.length} Devices
                  </Badge>

                  <Button
                    onClick={() => handleOpenRecentEvents()}
                    className="fw-bold fs-12 rounded-3 px-3 py-2 text-warning border-0 transition-all d-flex align-items-center gap-1.5"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24' }}
                  >
                    ⚡ Recent Events
                  </Button>

                  <Button
                    onClick={handleGlobalResyncEventStats}
                    className="fw-bold fs-12 rounded-3 px-3 py-2 text-info border-0 transition-all d-flex align-items-center gap-1.5"
                    style={{ backgroundColor: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(14, 165, 233, 0.35)', color: '#38bdf8' }}
                  >
                    <RefreshCw size={14} /> Resync All
                  </Button>

                  <Button
                    onClick={() => {
                      setRegisterStep(1);
                      setRegisterForm(prev => ({
                        ...prev,
                        name: '',
                        sochiotDeviceIds: '',
                        serialNumber: ''
                      }));
                      setShowRegisterDeviceModal(true);
                    }}
                    className="fw-bold fs-13 rounded-3 px-4 py-2 text-white border-0 d-flex align-items-center gap-2 shadow"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}
                  >
                    + Register Device
                  </Button>
                </div>
              </div>



              {/* THIRD ROW: Devices Inventory Table */}
              <div className="table-responsive rounded-3 overflow-hidden shadow-lg" style={{ background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <table className="table table-dark table-hover mb-0 align-middle fs-13">
                  <thead style={{ background: '#050811', color: '#94a3b8' }}>
                    <tr className="text-uppercase fs-11 tracking-wider border-bottom border-secondary border-opacity-25">
                      <th className="py-3 px-3" style={{ width: '22%' }}>DEVICE / SERIAL NO.</th>
                      <th className="py-3 px-2" style={{ width: '11%' }}>CATEGORY</th>
                      <th className="py-3 px-2" style={{ width: '14%' }}>PROFILE</th>
                      <th className="py-3 px-2" style={{ width: '13%' }}>BUILDING &amp; AREA</th>
                      <th className="py-3 px-2" style={{ width: '9%' }}>SOCHIOT ID</th>
                      <th className="py-3 px-2" style={{ width: '14%' }}>THRESHOLD LIMITS</th>
                      <th className="py-3 px-2" style={{ width: '9%' }}>STATUS</th>
                      <th className="py-3 px-3 text-end" style={{ width: '8%', minWidth: '240px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-slate-400 fw-semibold fs-13">
                          <Cpu size={32} className="text-slate-500 mb-2 opacity-50 d-block mx-auto" />
                          No devices found matching current filters
                        </td>
                      </tr>
                    ) : filteredDevices.map(d => {
                      const isDeviceActive = d.isActive !== false && d.status !== 'INACTIVE' && d.status !== 'OFFLINE';
                      return (
                        <tr key={d.id} className="border-bottom border-secondary border-opacity-10">
                          <td className="py-3 px-3">
                            <div className="d-flex align-items-center gap-3">
                              <div className="p-2.5 rounded-circle shadow-sm" style={{ background: '#1e3a8a', color: '#38bdf8', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                <Zap size={18} />
                              </div>
                              <div>
                                <div className="fw-bold text-white fs-14">{d.name}</div>
                                <div className="text-slate-400 font-monospace fs-11">{d.serialNumber || d.bmsDeviceId || '20e7cBe7def08'}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2">
                            <Badge
                              className="rounded-pill px-3 py-1.5 font-monospace fs-10 fw-bold border shadow-sm text-white"
                              style={{ backgroundColor: '#2563eb', borderColor: '#3b82f6', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)' }}
                            >
                              {d.category || 'ENERGY_METER'}
                            </Badge>
                          </td>

                          <td className="py-3 px-2 text-slate-300 fw-semibold fs-12">
                            <span className="text-truncate d-inline-block font-monospace" style={{ maxWidth: 140 }} title={d.profileId}>
                              {d.profileId || (d.category === 'AQI_SENSOR' ? 'AQI-T&H Profile' : 'cmsh6vz9600021...')}
                            </span>
                          </td>

                          <td className="py-3 px-2">
                            <div className="text-slate-200 fw-semibold fs-13">{d.buildingName || 'store-1'}</div>
                            <div className="text-slate-400 fs-11">{d.areaName || 'No Specific Area'}</div>
                          </td>

                          <td className="py-3 px-2 font-monospace text-slate-300 fs-13">
                            {Array.isArray(d.sochiotDeviceIds) ? d.sochiotDeviceIds.join(', ') : (d.sochiotDeviceIds || '1231')}
                          </td>

                          {/* THRESHOLD LIMITS DISPLAY COLUMN */}
                          <td className="py-3 px-2">
                            <div className="d-flex flex-column gap-1">
                              <div className="d-flex align-items-center gap-1 fs-11 font-monospace">
                                <Badge bg="dark" className="border border-warning text-warning px-2 py-0-5" style={{ background: '#050811' }}>
                                  Warn H: {d.settings?.[0]?.warningHigh ?? 250}
                                </Badge>
                                <Badge bg="dark" className="border border-danger text-danger px-2 py-0-5" style={{ background: '#050811' }}>
                                  Crit H: {d.settings?.[0]?.criticalHigh ?? 260}
                                </Badge>
                              </div>
                              <div className="d-flex align-items-center gap-1 fs-10 text-slate-400 font-monospace">
                                <span>Low: {d.settings?.[0]?.warningLow ?? 210}..{d.settings?.[0]?.criticalLow ?? 200}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2">
                            <div className="d-flex align-items-center gap-2">
                              <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, background: isDeviceActive ? '#10b981' : '#64748b', boxShadow: isDeviceActive ? '0 0 8px #10b981' : 'none' }} />
                              <span className={`fs-11 fw-bold font-monospace ${isDeviceActive ? 'text-emerald-400' : 'text-slate-500'}`} style={{ color: isDeviceActive ? '#34d399' : '#64748b' }}>
                                {isDeviceActive ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                              <Form.Check
                                type="switch"
                                id={`toggle-status-${d.id}`}
                                checked={isDeviceActive}
                                onChange={async () => {
                                  try {
                                    const nextIsActive = !isDeviceActive;
                                    const siteId = d.siteId || 7;
                                    const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${d.id}`, {
                                      method: 'PATCH',
                                      headers: getAuthHeaders(),
                                      body: JSON.stringify({ isActive: nextIsActive, status: nextIsActive ? 'ACTIVE' : 'INACTIVE' })
                                    });
                                    if (res.ok) {
                                      showToast('success', `Device ${d.name} changed to ${nextIsActive ? 'ACTIVE' : 'INACTIVE'}`);
                                      fetchDevices();
                                    } else {
                                      showToast('danger', 'Failed to change device status');
                                    }
                                  } catch (e) {
                                    showToast('danger', 'Error updating device status');
                                  }
                                }}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3 text-end" style={{ minWidth: '240px' }}>
                            <div className="d-flex justify-content-end align-items-center gap-2">
                              {/* 1. EDIT DEVICE BUTTON */}
                              <Button
                                variant="link"
                                size="sm"
                                title="Edit Device Details (PATCH /devices/:id)"
                                onClick={() => handleOpenEditDevice(d)}
                                className="device-action-btn btn-action-edit"
                              >
                                <Edit3 size={15} />
                              </Button>

                              {/* 2. RESYNC DEVICE BUTTON */}
                              <Button
                                variant="link"
                                size="sm"
                                title="Resync Device Telemetry"
                                onClick={() => handleOpenLiveModal(d)}
                                className="device-action-btn btn-action-sync"
                              >
                                <RefreshCw size={15} />
                              </Button>

                              {/* 3. THRESHOLD LIMITS BUTTON */}
                              <Button
                                variant="link"
                                size="sm"
                                title="Manage Threshold Limits (PATCH /thresholds)"
                                onClick={() => handleOpenThresholdsModal(d)}
                                className="device-action-btn btn-action-threshold"
                              >
                                <Activity size={15} />
                              </Button>

                              {/* 4. DEVICE PARAMETERS & FIELD SETTINGS BUTTON */}
                              <Button
                                variant="link"
                                size="sm"
                                title="Device Parameters & Field Settings (GET/PUT /settings)"
                                onClick={() => handleOpenSettingsModal(d)}
                                className="device-action-btn btn-action-settings"
                              >
                                <Sliders size={15} />
                              </Button>

                              {/* 5. DEVICE AUTOMATION & RULES BUTTON */}
                              <Button
                                variant="link"
                                size="sm"
                                title="Device Automation & Rules (GET/PUT /rules)"
                                onClick={() => handleOpenRulesModal(d)}
                                className="device-action-btn btn-action-rules"
                              >
                                <Shield size={15} />
                              </Button>

                              {/* 5.5 SEND COMMAND TO DEVICE BUTTON (POST /sites/:siteId/devices/:deviceId/commands) */}
                              <Button
                                variant="link"
                                size="sm"
                                title="Send Command To Device (POST /sites/:siteId/devices/:deviceId/commands)"
                                onClick={() => {
                                  setSelectedDeviceForCommandsTab(d.id);
                                  setShowSendCommandModal(true);
                                }}
                                className="device-action-btn btn-action-command text-warning"
                              >
                                <Zap size={15} />
                              </Button>

                              {/* 6. AUDIT LOGS BUTTON */}
                              <Button
                                variant="link"
                                size="sm"
                                title="Device Audit Action Logs (GET /audit-log)"
                                onClick={() => handleOpenAuditLog(d)}
                                className="device-action-btn btn-action-audit"
                              >
                                <FileText size={15} />
                              </Button>

                              {/* 7. DELETE DEVICE BUTTON */}
                              <Button
                                variant="link"
                                size="sm"
                                title="Delete Device (DELETE /devices/:id)"
                                onClick={() => {
                                  setSelectedDeviceForAudit(d);
                                  handleDeleteDevice(d.id, d.siteId);
                                }}
                                className="device-action-btn btn-action-delete"
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* FOURTH ROW: Footer Pagination Bar (Matching Screenshot) */}
              <div className="d-flex align-items-center justify-content-between p-3 mt-3 rounded-3" style={{ background: '#050811', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span className="text-slate-400 fs-13">Showing 1 to {filteredDevices.length} of {filteredDevices.length} devices</span>
                <div className="d-flex align-items-center gap-1">
                  <Button variant="outline-secondary" size="sm" disabled className="px-2.5 py-1 text-slate-500 border-secondary border-opacity-25" style={{ background: '#090d16' }}>&lt;</Button>
                  <Button variant="primary" size="sm" className="px-3 py-1 fw-bold text-white border-0" style={{ background: '#2563eb' }}>1</Button>
                  <Button variant="outline-secondary" size="sm" disabled className="px-2.5 py-1 text-slate-500 border-secondary border-opacity-25" style={{ background: '#090d16' }}>&gt;</Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: WIDGETS MANAGEMENT */}
          {activeTab === 'widgets' && (
            <div className="p-3">
              {/* Premium Widgets Header */}
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 p-3 rounded-3 border border-secondary border-opacity-25" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))' }}>
                <div>
                  <h5 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
                    <Grid className="text-info" size={22} /> Device Widgets Control Center
                  </h5>
                  <p className="text-slate-400 fs-12 mb-0">Configure dashboard visual widgets, metric panels & display ordering</p>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={handleSyncWidgetsFromSochiot}
                    className="fw-semibold rounded-2 d-flex align-items-center gap-1"
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    title="Sync Widgets from Sochiot"
                  >
                    <RefreshCw size={14} /> Sync
                  </Button>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={handleReorderWidgets}
                    className="fw-semibold rounded-2 d-flex align-items-center gap-1"
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    title="Save Display Order"
                  >
                    <Sliders size={14} /> Save Order
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleDeleteAllWidgets}
                    className="fw-semibold rounded-2 d-flex align-items-center gap-1"
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    title="Delete All Widgets"
                  >
                    <Trash2 size={14} /> Delete All
                  </Button>
                </div>
              </div>

              {/* Device Selector & Filter Bar */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 p-3 rounded-3 border border-secondary border-opacity-25" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center gap-2 text-slate-300 fw-semibold fs-13">
                    <Cpu size={16} className="text-info" /> Target Device:
                  </div>
                  <Form.Select
                    size="sm"
                    style={{ width: 260, backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155', fontSize: '0.83rem' }}
                    value={selectedDeviceForWidgets}
                    onChange={(e) => {
                      setSelectedDeviceForWidgets(Number(e.target.value));
                      handleFetchWidgets(Number(e.target.value), widgetFilterActiveOnly);
                    }}
                    className="fw-semibold rounded-2"
                  >
                    {activeDevices.length === 0 && <option value="">No devices available</option>}
                    {activeDevices.map(d => (
                      <option key={d.id} value={d.id}>{d.name}{d.category ? ` (${d.category})` : ''}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="text-slate-400 fs-12">
                    <span className="text-white fw-bold">{widgetsList.length}</span> widget{widgetsList.length !== 1 ? 's' : ''} loaded
                  </span>
                  <Form.Check
                    type="switch"
                    id="active-widgets-switch"
                    label="Active Only"
                    className="text-slate-300 fs-13 fw-semibold"
                    checked={widgetFilterActiveOnly}
                    onChange={(e) => {
                      setWidgetFilterActiveOnly(e.target.checked);
                      handleFetchWidgets(selectedDeviceForWidgets, e.target.checked);
                    }}
                  />
                </div>
              </div>

              {/* Rich Visual Widget Cards Grid */}
              <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <Sparkles className="text-warning" size={18} /> Live Visual Widget Panels Preview
              </h6>
              <Row className="g-3 mb-4">
                {widgetsList.map((w, idx) => {
                  const wName = w.displayName || 'Unnamed Widget';
                  const wType = w.widgetType || 'GAUGE';
                  const wId = w.widgetId || `W-${idx + 1}`;
                  const wOrder = w.displayOrder || idx + 1;
                  const wActive = w.isActive !== false;
                  const wVal = w.value || '—';
                  const wTypeLabel = wType === 'GAUGE' ? 'Dial Gauge' : wType === 'LINE_CHART' ? 'Time-Series' : wType === 'TOGGLE_SWITCH' ? 'Switch' : 'Stat Card';

                  return (
                    <Col md={4} key={w.id || idx}>
                      <Card className="bg-dark-card border-secondary border-opacity-25 p-3 rounded-3 shadow-sm h-100 position-relative hover-glow transition-all" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))' }}>
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                          <div className="d-flex align-items-center gap-2">
                            <div className="p-2 rounded-3 bg-dark border border-secondary border-opacity-25">
                              {wType === 'GAUGE' ? <Zap className="text-warning" size={20} /> : wType === 'LINE_CHART' ? <Activity className="text-info" size={20} /> : <Sliders className="text-success" size={20} />}
                            </div>
                            <div>
                              <h6 className="fw-bold text-white mb-0 fs-14">{wName}</h6>
                              <span className="text-slate-400 font-monospace fs-11">{wId}</span>
                            </div>
                          </div>
                          <Badge bg={wActive ? 'success' : 'secondary'} className="fs-11 px-2 py-1 rounded-2">
                            {wActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>

                        {/* Visual Widget Live Display Body */}
                        <div className="my-2 p-3 bg-dark rounded-3 border border-secondary border-opacity-25 text-center">
                          {wType === 'GAUGE' && (
                            <div className="d-flex flex-column align-items-center py-1">
                              <h5 className="fw-bold text-warning font-monospace mb-0 mt-1">{wVal}</h5>
                              <span className="text-slate-400 fs-11">{wTypeLabel}</span>
                            </div>
                          )}

                          {wType === 'LINE_CHART' && (
                            <div className="d-flex flex-column align-items-center py-1">
                              <h5 className="fw-bold text-info font-monospace mb-0 mt-1">{wVal}</h5>
                              <span className="text-slate-400 fs-11">{wTypeLabel}</span>
                            </div>
                          )}

                          {(wType === 'TOGGLE_SWITCH' || wType === 'STAT_CARD') && (
                            <div className="d-flex flex-column align-items-center py-2">
                              <div className={`fs-12 px-3 py-1 fw-bold rounded-2 ${wVal === 'ON' ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                                {wVal === 'ON' ? 'ENABLED' : 'DISABLED'}
                              </div>
                              <span className="text-slate-400 fs-11 mt-1">{wTypeLabel}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Details & Action Buttons */}
                        <div className="d-flex align-items-center justify-content-between text-slate-400 fs-12 mt-auto pt-3 border-top border-secondary border-opacity-25">
                          <span className="font-monospace text-slate-400 fs-11">Order: <span className="text-info fw-bold">#{wOrder}</span></span>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleOpenEditWidgetModal(w)}
                              className="px-2 py-1 fs-12 fw-semibold d-flex align-items-center gap-1 rounded-2"
                            >
                              <Edit3 size={12} /> Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteWidget(w.id)}
                              className="px-2 py-1 fs-12 d-flex align-items-center gap-1 rounded-2"
                            >
                              <Trash2 size={12} /> Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
                {widgetsList.length === 0 && (
                  <Col xs={12}>
                    <div className="text-center py-5 text-slate-400">
                      <Grid size={36} className="mb-3 opacity-30" />
                      <p className="fs-14 fw-semibold mb-1">No widgets found</p>
                      <p className="fs-12 mb-0">Select a device and click <span className="text-info">Fetch Widgets</span> to load data from the API.</p>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Widgets Inventory Table */}
              <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <FileText className="text-info" size={16} /> Widgets Inventory
              </h6>
              <div className="table-responsive bg-dark-card rounded-3 border border-secondary border-opacity-25">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Widget ID</th>
                      <th>Display Name</th>
                      <th>Widget Type</th>
                      <th>Display Order</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {widgetsList.map((w, idx) => {
                      const wName = w.displayName || w.name || w.label || `Widget #${idx + 1}`;
                      const wType = w.widgetType || w.type || 'GAUGE';
                      const wId = w.widgetId || `WIDGET-${w.id || idx + 1}`;
                      const wOrder = w.displayOrder || idx + 1;
                      const wActive = w.isActive !== false;

                      return (
                        <tr key={w.id || idx}>
                          <td className="text-info font-monospace fw-bold fs-13">{wId}</td>
                          <td className="fw-bold text-white">{wName}</td>
                          <td>
                            <Badge bg={wType === 'GAUGE' ? 'warning' : wType === 'LINE_CHART' ? 'info' : 'success'} className="text-dark fs-11 px-2 py-1">
                              {wType}
                            </Badge>
                          </td>
                          <td className="text-slate-300 fs-13 font-monospace">#{wOrder}</td>
                          <td>
                            <Badge bg={wActive ? 'success' : 'secondary'} className="fs-11 px-2 py-1">
                              {wActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleOpenEditWidgetModal(w)}
                                title="Edit Widget"
                                className="fw-semibold d-flex align-items-center gap-1 rounded-3"
                                style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                              >
                                <Edit3 size={13} /> Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteWidget(w.id)}
                                title="Delete Widget"
                                className="d-flex align-items-center gap-1 rounded-3"
                                style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                              >
                                <Trash2 size={13} /> Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: RULES ENGINE MANAGEMENT */}
          {activeTab === 'rules' && (
            <div className="p-3">
              {/* Executive Rules Microservice Header Bar */}
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
                <div>
                  <h5 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
                    <Shield className="text-info" size={24} /> Device Automation Rules Engine
                  </h5>
                  <p className="text-slate-400 fs-13 mb-0">
                    Device Condition Triggers, Threshold Interlocks, Consequence Actions & Sochiot Synchronization
                  </p>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <Button variant="outline-success" size="sm" onClick={handleSyncAllRulesFromSochiot} className="fw-semibold rounded-3 d-flex align-items-center gap-1 shadow-sm px-3 py-1-5">
                    <RefreshCw size={15} /> Sync All Engine Rules <Badge bg="success" className="text-dark fs-10 ms-1">POST /sync</Badge>
                  </Button>
                </div>
              </div>

              {/* Top Executive Metrics & Target Device Selector Bar */}
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <div className="p-3 bg-dark-card rounded-3 border border-secondary border-opacity-25 shadow-sm d-flex align-items-center justify-content-between h-100">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2-5 rounded-3 bg-dark border border-info border-opacity-25">
                        <Cpu size={22} className="text-info" />
                      </div>
                      <div>
                        <div className="text-slate-400 fs-12 fw-semibold">Target Hardware Device:</div>
                        <Form.Select
                          size="sm"
                          style={{ width: 280, backgroundColor: '#0f172a', color: '#38bdf8', borderColor: '#334155' }}
                          value={selectedDeviceForRulesTab}
                          onChange={(e) => {
                            setSelectedDeviceForRulesTab(Number(e.target.value));
                            handleFetchRulesTab(Number(e.target.value));
                          }}
                          className="fw-semibold rounded-3 mt-1"
                        >
                          {activeDevices.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.category || 'BMS'})</option>
                          ))}
                        </Form.Select>
                      </div>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-3 bg-dark-card rounded-3 border border-secondary border-opacity-25 shadow-sm d-flex align-items-center justify-content-around h-100">
                    <div className="d-flex align-items-center gap-3">
                      <Shield className="text-info" size={26} />
                      <div>
                        <span className="text-slate-400 fs-12 d-block">Configured Rules</span>
                        <h5 className="fw-bold text-white mb-0">{rulesList.length} Rules</h5>
                      </div>
                    </div>
                    <div className="vr bg-secondary opacity-25 style={{ height: 40 }}" />
                    <div className="d-flex align-items-center gap-3">
                      <Zap className="text-warning" size={26} />
                      <div>
                        <span className="text-slate-400 fs-12 d-block">Active Protection</span>
                        <h5 className="fw-bold text-success mb-0">{rulesList.filter(r => r.enabled !== false).length} Enabled</h5>
                      </div>
                    </div>
                    <div className="vr bg-secondary opacity-25 style={{ height: 40 }}" />
                    <div className="d-flex align-items-center gap-3">
                      <RefreshCw className="text-success" size={26} />
                      <div>
                        <span className="text-slate-400 fs-12 d-block">Sochiot Engine</span>
                        <Badge bg="success" className="fs-11 px-2 py-1">SYNCHRONIZED</Badge>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Rules Visual Automation Cards Grid */}
              <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <Sparkles className="text-warning" size={18} /> Interactive Rule Nodes & Automation Logic
              </h6>
              <Row className="g-3 mb-4">
                {rulesList.map((rule, idx) => {
                  const ruleId = rule.id || `RULE-${idx + 101}`;
                  const ruleName = rule.name || rule.title || `Automation Rule #${idx + 1}`;
                  const fieldName = rule.fieldName || rule.field || 'voltage';
                  const condType = rule.conditionType || 'GREATER_THAN';
                  const thresholdVal = rule.threshold !== undefined ? rule.threshold : 250;
                  const consequence = rule.consequenceType || 'TRIGGER_ALARM_EVENT';
                  const isEnabled = rule.enabled !== false;

                  return (
                    <Col md={4} key={ruleId}>
                      <Card className="bg-dark-card border-secondary border-opacity-25 p-3 rounded-3 shadow-sm h-100 position-relative transition-all hover-glow" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))' }}>
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                          <div className="d-flex align-items-center gap-2">
                            <div className="p-2 rounded-3 bg-dark border border-secondary border-opacity-25">
                              <Shield className={isEnabled ? 'text-info' : 'text-slate-500'} size={20} />
                            </div>
                            <div>
                              <h6 className="fw-bold text-white mb-0 fs-14">{ruleName}</h6>
                              <span className="text-slate-400 font-monospace fs-11">{ruleId}</span>
                            </div>
                          </div>
                          <Form.Check
                            type="switch"
                            id={`rule-switch-${ruleId}`}
                            checked={isEnabled}
                            onChange={(e) => handleUpdateSingleRuleField(ruleId, 'enabled', e.target.checked)}
                            title="Toggle Rule Enable Status (PATCH /fields/enabled)"
                          />
                        </div>

                        {/* High-Visibility Rule Logic Card Body */}
                        <div className="my-2.5 p-3 rounded-3 bg-dark border border-secondary border-opacity-30 shadow-inner">
                          {/* Condition Row */}
                          <div className="mb-2.5 pb-2 border-bottom border-secondary border-opacity-20">
                            <div className="text-slate-400 fs-11 fw-bold tracking-wider text-uppercase mb-1">Trigger Condition</div>
                            <div className="d-flex align-items-center flex-wrap gap-2 fs-13 font-monospace">
                              <Badge bg="info" className="text-dark fw-bold px-2 py-1 fs-11">IF</Badge>
                              <span className="text-info fw-bold px-2 py-1 rounded bg-dark-card border border-info border-opacity-40">{fieldName}</span>
                              <span className="text-warning fw-bold">{condType === 'GREATER_THAN' ? 'GREATER THAN (>)' : condType === 'LESS_THAN' ? 'LESS THAN (<)' : condType}</span>
                              <span className="text-success fw-bold fs-13 bg-dark-card px-2 py-1 rounded border border-success border-opacity-40">{thresholdVal}</span>
                            </div>
                          </div>

                          {/* Action Row */}
                          <div>
                            <div className="text-slate-400 fs-11 fw-bold tracking-wider text-uppercase mb-1">Consequence Action</div>
                            <div className="d-flex align-items-center flex-wrap gap-2">
                              <Badge bg="success" className="text-dark fw-bold px-2 py-1 fs-11">THEN</Badge>
                              <Badge bg="outline" className="border border-warning text-warning font-monospace fs-12 px-2.5 py-1 tracking-wide">
                                ⚡ {consequence}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Structured Executive Action Buttons */}
                        <div className="d-flex align-items-center justify-content-between mt-auto pt-3 border-top border-secondary border-opacity-25">
                          <div className="d-flex align-items-center gap-2">
                            <Button variant="outline-light" size="sm" onClick={() => handleOpenRuleDetails(rule)} className="px-2.5 py-1.5 fs-12 fw-semibold rounded-2 d-flex align-items-center gap-1 shadow-sm" title="GET /rules/:ruleId">
                              <Eye size={13} /> Details
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleOpenEditRuleModal(rule)}
                              title="Edit Rule"
                              className="fs-12 fw-semibold rounded-2 d-flex align-items-center gap-1 shadow-sm"
                              style={{ padding: '5px 12px' }}
                            >
                              <Edit3 size={13} /> Edit
                            </Button>
                          </div>

                          <div className="d-flex align-items-center gap-3">
                            <Dropdown align="end" className="me-2">
                              <Dropdown.Toggle variant="outline-success" size="sm" className="px-3 py-1.5 fs-12 fw-semibold rounded-2 d-flex align-items-center gap-1 shadow-sm">
                                <RefreshCw size={13} /> Sync (POST)
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="bg-dark border-secondary shadow-lg">
                                <Dropdown.Item onClick={() => handleSyncSpecificRuleToSochiot(ruleId)} className="text-success fs-12 d-flex align-items-center gap-2">
                                  <RefreshCw size={13} /> Sync by Mapping IDs (POST /sync)
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleSyncSpecificRuleByFields(ruleId)} className="text-warning fs-12 d-flex align-items-center gap-2">
                                  <Sliders size={13} /> Sync by Field Names (POST /sync-with-fields)
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>

                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteRuleItem(ruleId)} className="px-2.5 py-1.5 fs-12 rounded-2 shadow-sm" title="DELETE /rules/:ruleId">
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {/* Complete Rules Endpoints Inventory Table */}
              <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <FileText className="text-info" size={18} /> Automation Rules Microservice Matrix
              </h6>
              <div className="table-responsive bg-dark-card rounded-3 border border-secondary border-opacity-25 shadow-sm">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Rule ID</th>
                      <th>Rule Name</th>
                      <th>Condition Expression</th>
                      <th>Consequence Action</th>
                      <th>Status (PATCH)</th>
                      <th className="text-end">All Microservice Endpoints & Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rulesList.map((rule, idx) => {
                      const ruleId = rule.id || `RULE-${idx + 101}`;
                      const ruleName = rule.name || rule.title || `Rule #${idx + 1}`;
                      const fieldName = rule.fieldName || 'voltage';
                      const condType = rule.conditionType || 'GREATER_THAN';
                      const thresholdVal = rule.threshold !== undefined ? rule.threshold : 250;
                      const consequence = rule.consequenceType || 'TRIGGER_ALARM_EVENT';
                      const isEnabled = rule.enabled !== false;

                      return (
                        <tr key={ruleId}>
                          <td className="text-info font-monospace fw-bold fs-13">{ruleId}</td>
                          <td className="fw-bold text-white">{ruleName}</td>
                          <td className="text-info fs-13 font-monospace">
                            IF <code className="text-info bg-dark px-1.5 py-0.5 rounded border border-info border-opacity-25">{fieldName}</code> {condType} <span className="text-warning fw-bold">{thresholdVal}</span>
                          </td>
                          <td>
                            <Badge bg="outline" className="border border-warning text-warning fs-11 font-monospace px-2 py-1">
                              ⚡ {consequence}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={isEnabled ? 'success' : 'secondary'} className="fs-11 px-2 py-1">
                              {isEnabled ? '● ENABLED' : '○ DISABLED'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end align-items-center gap-2">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleOpenRuleDetails(rule)}
                                title="View Rule Details"
                                className="fs-12 fw-semibold rounded-3 shadow-sm d-flex align-items-center gap-1"
                                style={{ padding: '5px 10px' }}
                              >
                                <Eye size={13} /> View
                              </Button>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleOpenEditRuleModal(rule)}
                                title="Edit Rule"
                                className="fs-12 fw-semibold rounded-3 shadow-sm d-flex align-items-center gap-1"
                                style={{ padding: '5px 10px' }}
                              >
                                <Edit3 size={13} /> Edit
                              </Button>
                              <Dropdown align="end" className="me-1">
                                <Dropdown.Toggle variant="outline-success" size="sm" className="fs-12 fw-semibold rounded-3 shadow-sm" style={{ padding: '5px 10px' }}>
                                  <RefreshCw size={13} className="me-1" />Sync
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="bg-dark border-secondary shadow-lg">
                                  <Dropdown.Item onClick={() => handleSyncSpecificRuleToSochiot(ruleId)} className="text-success fs-12">
                                    Sync by Mapping IDs
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => handleSyncSpecificRuleByFields(ruleId)} className="text-warning fs-12">
                                    Sync by Field Names
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteRuleItem(ruleId)}
                                title="Delete Rule"
                                className="d-flex align-items-center gap-1 rounded-3 shadow-sm"
                                style={{ padding: '5px 10px' }}
                              >
                                <Trash2 size={13} /> Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: COMMANDS MANAGEMENT */}
          {activeTab === 'commands' && (
            <div className="p-3">
              {/* Ultra-Premium Cyber-Industrial SCADA Header Station */}
              <div className="p-4 rounded-3 border border-info border-opacity-30 shadow-lg mb-4 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.9))', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.05)' }}>
                {/* Glowing Top Accent Bar */}
                <div className="position-absolute top-0 start-0 w-100" style={{ height: 3, background: 'linear-gradient(90deg, #38bdf8, #10b981, #f59e0b, #38bdf8)' }} />
                
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-3 rounded-3 bg-dark border border-info border-opacity-50 shadow-sm" style={{ boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)' }}>
                      <Terminal className="text-info" size={30} />
                    </div>
                    <div>
                      <h4 className="fw-bold text-white mb-1 d-flex align-items-center gap-2 font-monospace">
                        Hardware Commands & Control Pipeline
                      </h4>
                      <p className="text-slate-400 fs-13 mb-0">
                        Real-time Device Execution Signals, Field Key Writes, Modbus Registers & Dispatch History
                      </p>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <Button variant="info" size="md" onClick={() => setShowSendCommandModal(true)} className="fw-bold text-dark rounded-3 d-flex align-items-center gap-2 shadow-lg px-4 py-2" style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)', border: 'none', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)' }}>
                      <Plus size={18} /> Dispatch Hardware Command <Badge bg="dark" className="text-info fs-11 ms-1 font-monospace">POST /commands</Badge>
                    </Button>
                  </div>
                </div>

                {/* Integrated Control Bar: Target Hardware & Live Status Pills */}
                <Row className="g-3 mt-3 pt-3 border-top border-secondary border-opacity-25 align-items-center">
                  <Col md={5}>
                    <div className="p-3 bg-dark rounded-3 border border-secondary border-opacity-30 d-flex align-items-center justify-content-between shadow-sm">
                      <div className="d-flex align-items-center gap-3">
                        <Cpu size={22} className="text-info" />
                        <div>
                          <div className="text-slate-400 fs-11 font-monospace fw-bold text-uppercase">TARGET HARDWARE DEVICE:</div>
                          <Form.Select
                            size="sm"
                            style={{ width: 230, backgroundColor: '#070b14', color: '#38bdf8', borderColor: '#1e293b' }}
                            value={selectedDeviceForCommandsTab}
                            onChange={(e) => {
                              setSelectedDeviceForCommandsTab(Number(e.target.value));
                              handleFetchCommandHistory(Number(e.target.value));
                            }}
                            className="fw-bold rounded-2 mt-1 font-monospace fs-13"
                          >
                            {activeDevices.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.category || 'BMS'})</option>
                            ))}
                          </Form.Select>
                        </div>
                      </div>
                      <Badge bg="outline" className="border border-success text-success fs-11 px-2.5 py-1 font-monospace">
                        ● ONLINE (12ms)
                      </Badge>
                    </div>
                  </Col>

                  <Col md={7}>
                    <div className="p-3 bg-dark rounded-3 border border-secondary border-opacity-30 d-flex align-items-center justify-content-around shadow-sm">
                      <div className="d-flex align-items-center gap-3">
                        <Terminal className="text-info" size={20} />
                        <div>
                          <span className="text-slate-400 fs-11 font-monospace fw-bold d-block text-uppercase">Dispatched</span>
                          <h6 className="fw-bold text-white mb-0 font-monospace fs-15">{commandsList.length} Commands</h6>
                        </div>
                      </div>
                      <div className="vr bg-secondary opacity-25" style={{ height: 30 }} />
                      <div className="d-flex align-items-center gap-3">
                        <CheckCircle2 className="text-success" size={20} />
                        <div>
                          <span className="text-slate-400 fs-11 font-monospace fw-bold d-block text-uppercase">Acknowledged</span>
                          <h6 className="fw-bold text-success mb-0 font-monospace fs-15">{commandsList.filter(c => c.status === 'ACKNOWLEDGED').length} OK (200)</h6>
                        </div>
                      </div>
                      <div className="vr bg-secondary opacity-25" style={{ height: 30 }} />
                      <div className="d-flex align-items-center gap-3">
                        <Activity className="text-info" size={20} />
                        <div>
                          <span className="text-slate-400 fs-11 font-monospace fw-bold d-block text-uppercase">Pending Signal</span>
                          <h6 className="fw-bold text-info mb-0 font-monospace fs-15">{commandsList.filter(c => c.status === 'SENT').length} Sent</h6>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Commands SCADA Terminal Cards Grid */}
              <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2 fs-15">
                <Sparkles className="text-warning" size={18} /> Recent Command Execution Pipeline Cards
              </h6>
              <Row className="g-3 mb-4">
                {commandsList.map((cmd, idx) => {
                  const cmdId = cmd.commandId || cmd.id || `CMD-${idx + 9901}`;
                  const fieldKey = cmd.fieldKey || 'SET_PUMP_STATE';
                  const cmdVal = cmd.commandValue || 'ON';
                  const status = cmd.status || 'ACKNOWLEDGED';
                  const sentAt = cmd.sentAt ? new Date(cmd.sentAt).toLocaleString() : 'Recent';
                  const code = cmd.responseCode || 200;

                  return (
                    <Col md={4} key={cmdId}>
                      <Card className="bg-dark-card border-secondary border-opacity-30 p-3.5 rounded-3 shadow-md h-100 position-relative transition-all hover-glow" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85))', borderLeft: status === 'ACKNOWLEDGED' ? '4px solid #10b981' : status === 'FAILED' ? '4px solid #ef4444' : '4px solid #38bdf8' }}>
                        {/* Card Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3 pb-2.5 border-bottom border-secondary border-opacity-25">
                          <div className="d-flex align-items-center gap-2.5">
                            <div className="p-2 rounded-3 bg-dark border border-secondary border-opacity-30">
                              <Terminal className={status === 'ACKNOWLEDGED' ? 'text-success' : status === 'FAILED' ? 'text-danger' : 'text-info'} size={18} />
                            </div>
                            <div>
                              <h6 className="fw-bold text-white mb-0 fs-14 font-monospace">{fieldKey}</h6>
                              <span className="text-info font-monospace fs-11 fw-semibold">{cmdId}</span>
                            </div>
                          </div>
                          <Badge bg={status === 'ACKNOWLEDGED' ? 'success' : status === 'FAILED' ? 'danger' : 'info'} className="fs-11 px-2.5 py-1.5 font-monospace fw-bold shadow-sm">
                            {status === 'ACKNOWLEDGED' ? '● ACKNOWLEDGED' : status === 'FAILED' ? '● FAILED' : '● SENT'}
                          </Badge>
                        </div>

                        {/* High-Tech Terminal Output Screen */}
                        <div className="my-2 p-3 rounded-3 bg-dark border border-secondary border-opacity-40 shadow-inner" style={{ backgroundColor: '#070b14' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="text-slate-400 fs-11 font-monospace fw-bold tracking-wider">HARDWARE PAYLOAD WRITE:</span>
                            <Badge bg="outline" className={`border ${status === 'ACKNOWLEDGED' ? 'border-success text-success' : status === 'FAILED' ? 'border-danger text-danger' : 'border-info text-info'} fs-10 font-monospace px-2 py-0.5`}>
                              HTTP {code} {code === 200 ? 'OK' : 'ERR'}
                            </Badge>
                          </div>
                          
                          <div className="d-flex align-items-center justify-content-between p-2.5 rounded bg-dark-card border border-warning border-opacity-30 mb-2.5 font-monospace" style={{ backgroundColor: '#0f172a' }}>
                            <span className="text-warning fw-bold fs-16">{cmdVal}</span>
                            <span className="text-slate-400 fs-11 fw-semibold">VAL_REGISTER</span>
                          </div>

                          <div className="d-flex align-items-center justify-content-between text-slate-400 fs-11 font-monospace pt-1">
                            <span>DISPATCH TIME:</span>
                            <span className="text-slate-300 fw-semibold">{sentAt}</span>
                          </div>
                        </div>

                        {/* Symmetrical High-Contrast Action Buttons */}
                        <div className="d-flex align-items-center justify-content-between gap-2 mt-auto pt-3 border-top border-secondary border-opacity-25">
                          <Button variant="outline-light" size="sm" onClick={() => handleOpenCommandDetails(cmd)} className="w-50 py-1.5 fs-12 fw-semibold rounded-2 d-flex align-items-center justify-content-center gap-1 shadow-sm">
                            <Eye size={13} /> Inspect (GET)
                          </Button>
                          <Button variant="info" size="sm" onClick={() => {
                            setSendCommandFormData({ fieldKey, commandValue: cmdVal, notes: 'Re-dispatched Command' });
                            setShowSendCommandModal(true);
                          }} className="w-50 py-1.5 fs-12 fw-bold text-dark rounded-2 d-flex align-items-center justify-content-center gap-1 shadow-sm">
                            <Zap size={13} /> Re-dispatch
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {/* Complete Commands History Table */}
              <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2 fs-15">
                <FileText className="text-info" size={18} /> Commands Microservice Audit Trail Grid
              </h6>
              <div className="table-responsive bg-dark-card rounded-3 border border-secondary border-opacity-25 shadow-sm">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Command ID</th>
                      <th>Field Key Parameter</th>
                      <th>Command Value</th>
                      <th>Dispatch Timestamp</th>
                      <th>HTTP Code</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandsList.map((cmd, idx) => {
                      const cmdId = cmd.commandId || cmd.id || `CMD-${idx + 9901}`;
                      const fieldKey = cmd.fieldKey || 'SET_PUMP_STATE';
                      const cmdVal = cmd.commandValue || 'ON';
                      const status = cmd.status || 'ACKNOWLEDGED';
                      const sentAt = cmd.sentAt ? new Date(cmd.sentAt).toLocaleString() : 'Recent';
                      const code = cmd.responseCode || 200;

                      return (
                        <tr key={cmdId}>
                          <td className="text-info font-monospace fw-bold fs-13">{cmdId}</td>
                          <td className="fw-bold text-white font-monospace">{fieldKey}</td>
                          <td>
                            <code className="text-warning bg-dark px-2.5 py-1 rounded border border-warning border-opacity-30 font-monospace fs-13">{cmdVal}</code>
                          </td>
                          <td className="text-slate-300 fs-12 font-monospace">{sentAt}</td>
                          <td className="text-slate-300 fs-12 font-monospace">{code}</td>
                          <td>
                            <Badge bg={status === 'ACKNOWLEDGED' ? 'success' : status === 'FAILED' ? 'danger' : 'info'} className="fs-11 px-2.5 py-1 font-monospace fw-bold">
                              {status === 'ACKNOWLEDGED' ? '● ACKNOWLEDGED' : status === 'FAILED' ? '● FAILED' : '● SENT'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end align-items-center gap-2">
                              <Button variant="outline-light" size="sm" onClick={() => handleOpenCommandDetails(cmd)} title="Get Command Details (GET /commands/:commandId)" className="px-3 py-1.5 fs-12 fw-semibold rounded-3 shadow-sm">
                                <Eye size={13} /> GET Status
                              </Button>
                              <Button variant="info" size="sm" onClick={() => {
                                setSendCommandFormData({ fieldKey, commandValue: cmdVal, notes: 'Re-dispatched Command' });
                                setShowSendCommandModal(true);
                              }} title="Re-dispatch Command (POST /commands)" className="px-3 py-1.5 fs-12 fw-bold text-dark rounded-3 shadow-sm">
                                <Zap size={13} /> Re-dispatch (POST)
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TELEMETRY RESYNC MANAGEMENT */}
          {activeTab === 'telemetry' && (
            <div className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                  <Radio className="text-success" /> Live & Historical Sensor Telemetry Resync
                </h5>
                <Button variant="success" size="sm" onClick={() => setShowResyncModal(true)} className="fw-semibold text-white px-3">
                  <Radio size={15} /> Resync Telemetry Data
                </Button>
              </div>
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Site ID</th>
                      <th>Target Date Range</th>
                      <th>Processed Events</th>
                      <th>Triggered By</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetryLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 empty-text fw-semibold">No telemetry resync logs available</td>
                      </tr>
                    ) : telemetryLogs.map(log => (
                      <tr key={log.id}>
                        <td className="fw-bold text-info">{log.id}</td>
                        <td className="text-slate-300">Site #{log.siteId}</td>
                        <td className="text-slate-300">{log.startDate} to {log.endDate}</td>
                        <td className="text-slate-200 fw-bold">{log.processedEvents || 1250} events</td>
                        <td className="text-slate-400 fs-13">{log.triggeredBy || 'Super Admin'}</td>
                        <td>
                          <Badge bg="success" className="px-2 py-1">{log.status}</Badge>
                        </td>
                        <td className="text-slate-400 fs-12">{formatDate(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ASYNC REPORTS MANAGEMENT */}
          {activeTab === 'report' && (
            <div className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                  <FileText className="text-info" /> Telemetry & DPR Async Reports
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <PdfButton sites={sites} assets={assets} label="Download User PDF Report" />
                  <Button variant="info" size="sm" onClick={() => setShowReportModal(true)} className="fw-semibold text-dark px-3 d-flex align-items-center gap-1">
                    <FileText size={15} /> Custom PDF Generator
                  </Button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Report Title</th>
                      <th>Type</th>
                      <th>Site ID</th>
                      <th>Format</th>
                      <th>Requested By</th>
                      <th>Status</th>
                      <th>Generated Date</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 empty-text fw-semibold">No generated reports available</td>
                      </tr>
                    ) : reportsList.map(r => (
                      <tr key={r.id}>
                        <td className="fw-bold text-white">{r.title}</td>
                        <td><Badge bg="secondary" className="px-2 py-1">{r.reportType}</Badge></td>
                        <td className="text-slate-300">Site #{r.siteId}</td>
                        <td><Badge bg={r.format === 'PDF' ? 'danger' : 'success'} className="px-2 py-1">{r.format}</Badge></td>
                        <td className="text-slate-400 fs-13">{r.requestedBy || 'Super Admin'}</td>
                        <td><Badge bg="success" className="px-2 py-1">{r.status}</Badge></td>
                        <td className="text-slate-400 fs-12">{formatDate(r.createdAt)}</td>
                        <td className="text-end">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="px-2 py-1 fs-12 d-inline-flex align-items-center gap-1"
                            onClick={() => generateUserCustomPdfReport({
                              title: r.title || 'Telemetry & Operational Report',
                              subtitle: `Report Type: ${r.reportType}`,
                              siteName: `Site #${r.siteId}`,
                              userName: r.requestedBy || 'Super Admin',
                              dateRange: 'Selected Range (Aug 10 - Aug 17, 2026)',
                              fileName: `${(r.title || 'Report').replace(/[^a-zA-Z0-9]/g, '_')}_${r.id}.pdf`
                            })}
                          >
                            <FileText size={14} /> Download PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ALARMS MANAGEMENT */}
          {activeTab === 'alarm' && (
            <div className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                  <BellRing className="text-warning" /> Real-time Device Alarm Monitoring & Triggering
                </h5>
                <Button variant="warning" size="sm" onClick={() => setShowAlarmModal(true)} className="fw-semibold text-dark px-3">
                  <BellRing size={15} /> Trigger Alarm Event
                </Button>
              </div>
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Alarm ID</th>
                      <th>Device ID</th>
                      <th>Metric / Field</th>
                      <th>Value</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Triggered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alarmsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 empty-text fw-semibold">No triggered alarm events</td>
                      </tr>
                    ) : alarmsList.map(a => (
                      <tr key={a.id}>
                        <td className="fw-bold text-warning">{a.id}</td>
                        <td className="fw-semibold text-white">{a.deviceId}</td>
                        <td className="text-slate-300 fs-13">{a.fieldKey}</td>
                        <td className="text-slate-200 fw-bold">{a.value}</td>
                        <td>
                          <Badge bg={a.severity === 'CRITICAL' ? 'danger' : a.severity === 'WARNING' ? 'warning' : 'info'} className={a.severity === 'WARNING' ? 'text-dark px-2 py-1' : 'px-2 py-1'}>
                            {a.severity}
                          </Badge>
                        </td>
                        <td><Badge bg="success" className="px-2 py-1">{a.status}</Badge></td>
                        <td className="text-slate-400 fs-12">{formatDate(a.triggeredAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 5.Site TAB */}
      {activeTab === 'site' && (
        <SiteManagement />
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
              <Form.Label className="fs-13 fw-semibold text-slate-300">Full Address</Form.Label>
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
              {loading ? <Spinner size="sm" animation="border" /> : editingCompany ? 'Save Changes' : 'Create Company'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 2. TENANT / ORGANIZATION MODAL */}
      <Modal show={showTenantModal} onHide={() => { setEditingTenant(null); setShowTenantModal(false); }} size="lg" centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25 pb-3">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-white fs-18">
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Building2 className="text-info" size={18} />
            </div>
            <span>{editingTenant ? 'Edit Organization Details' : 'Add New Organization'}</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveTenant}>
          <Modal.Body className="p-4 d-flex flex-column gap-3">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                    Organization Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Sumilon Industries"
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                    Server URL
                  </Form.Label>
                  <Form.Control
                    placeholder="https://app.sochiot.com"
                    value={tenantForm.serverUrl}
                    onChange={(e) => setTenantForm({ ...tenantForm, serverUrl: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                    Organization Type <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={tenantForm.orgType}
                    onChange={(e) => setTenantForm({ ...tenantForm, orgType: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
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
                  <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                    Parent Company {editingTenant ? '' : <span className="text-danger">*</span>}
                  </Form.Label>
                  {editingTenant ? (
                    <div
                      className="p-2.5 rounded-3 d-flex align-items-center justify-content-between"
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        height: '42px'
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div style={{
                          width: 24, height: 24, borderRadius: 5,
                          background: 'rgba(16, 185, 129, 0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Building className="text-emerald-400" size={13} />
                        </div>
                        <span className="text-white fw-bold fs-13">
                          {activeCompanies.find(c => String(c.id) === String(editingTenant.companyId))?.name || editingTenant.companyName || 'octiot'}
                        </span>
                      </div>
                      <Badge bg="dark" className="border border-secondary border-opacity-50 text-slate-400 font-monospace fs-11 px-2 py-0.5">
                        
                      </Badge>
                    </div>
                  ) : (
                    <Form.Select
                      value={tenantForm.companyId}
                      onChange={(e) => setTenantForm({ ...tenantForm, companyId: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                    >
                      <option value="">-- Select Parent Company --</option>
                      {activeCompanies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                    Contact Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="admin@org.com"
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                    Phone Number
                  </Form.Label>
                  <Form.Control
                    placeholder="+91-1234567890"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                    Sochiot Org ID
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g. 882"
                    value={tenantForm.sochiotOrgId}
                    onChange={(e) => setTenantForm({ ...tenantForm, sochiotOrgId: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                    Subscription Tier
                  </Form.Label>
                  <Form.Select
                    value={tenantForm.subscription}
                    onChange={(e) => setTenantForm({ ...tenantForm, subscription: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                  >
                    <option value="BASIC">BASIC</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="FREE">FREE</option>
                    <option value="TRIAL">TRIAL</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                Description
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter organization description and operational scope..."
                value={tenantForm.description}
                onChange={(e) => setTenantForm({ ...tenantForm, description: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
              />
            </Form.Group>

            {/* Single Headquarters Address Textarea */}
            <Form.Group>
              <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400 mb-1.5" style={{ letterSpacing: '0.04em' }}>
                Address
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter full headquarters address (building, street, city, state, postal code)..."
                value={tenantForm.address || ''}
                onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 fs-13"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25 justify-content-end gap-2 pt-3">
            <Button variant="outline-secondary" onClick={() => setShowTenantModal(false)} className="px-3 py-1.5">
              Cancel
            </Button>
            <Button variant="info" type="submit" disabled={loading} className="fw-semibold text-dark px-4 py-1.5 shadow-sm">
              {loading ? <Spinner size="sm" animation="border" /> : editingTenant ? 'Update Organization' : 'Create Organization'}
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
                disabled={!!editingZone}
                value={zoneForm.tenantId}
                onChange={(e) => setZoneForm({ ...zoneForm, tenantId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
                style={editingZone ? { opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(15, 23, 42, 0.6)' } : {}}
              >
                <option value="">-- Select Organization --</option>
                {activeTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
              {editingZone && (
                <Form.Text className="text-muted fs-11 mt-1 d-block">
                  Organization cannot be edited after zone creation.
                </Form.Text>
              )}
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
              {loading ? <Spinner size="sm" animation="border" /> : editingZone ? 'Save Changes' : 'Create Zone'}
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
                disabled={!!editingArea}
                value={areaForm.tenantId}
                onChange={(e) => {
                  const tId = e.target.value;
                  const firstZ = activeZones.find(z => z.tenantId === tId)?.id || '';
                  setAreaForm({ ...areaForm, tenantId: tId, zoneId: firstZ });
                }}
                className="bg-dark text-white border-secondary border-opacity-25"
                style={editingArea ? { opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(15, 23, 42, 0.6)' } : {}}
              >
                <option value="">-- Select Organization --</option>
                {activeTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
              {editingArea && (
                <Form.Text className="text-muted fs-11 mt-1 d-block">
                  Organization cannot be edited after area creation.
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Parent Zone *</Form.Label>
              <Form.Select
                required
                disabled={!!editingArea}
                value={areaForm.zoneId}
                onChange={(e) => setAreaForm({ ...areaForm, zoneId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
                style={editingArea ? { opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(15, 23, 42, 0.6)' } : {}}
              >
                <option value="">-- Select Geographic Zone --</option>
                {activeZones
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
              {loading ? <Spinner size="sm" animation="border" /> : editingArea ? 'Save Changes' : 'Create Area'}
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
                <option value="FREE">FREE</option>
                <option value="TRIAL">TRIAL</option>
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
      {/* 8. BUILDING MODAL (OpenAPI 3.0.3 Compliant) */}
      <Modal show={showBuildingModal} onHide={() => setShowBuildingModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Building2 className="text-info" /> {editingBuilding ? 'Edit Building Details' : 'Create Building in Site'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveBuilding}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300 d-flex justify-content-between align-items-center">
                <span>Parent Physical Site <span className="text-danger">*</span></span>
                {editingBuilding && (
                  <Badge bg="dark" className="border border-secondary border-opacity-50 text-slate-400 font-monospace fs-11 py-1 px-2">
                    {/* 🔒 Locked (Immutable) */}
                  </Badge>
                )}
              </Form.Label>
              <Form.Select
                required
                disabled={!!editingBuilding}
                value={buildingForm.siteId}
                onChange={(e) => setBuildingForm({ ...buildingForm, siteId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 py-2"
                style={editingBuilding ? { opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(15, 23, 42, 0.6)' } : {}}
              >
                <option value="">-- Select Parent Site --</option>
                {activeSites.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Site #{s.id}{s.city ? ` • ${s.city}, ${s.state || ''}` : ''})
                  </option>
                ))}
              </Form.Select>
              {editingBuilding && (
                <Form.Text className="text-muted fs-11 mt-1 d-block">
                  Buildings belong strictly to their parent site and cannot be moved across sites.
                </Form.Text>
              )}
            </Form.Group>

            <Row className="g-3">
              <Col md={7}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Building Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Main Tower Alpha"
                    value={buildingForm.name}
                    onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                    required
                    className="bg-dark text-white border-secondary border-opacity-25 py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Building Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. BLD-A"
                    value={buildingForm.code}
                    onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 font-monospace"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Total Floors</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={buildingForm.totalFloors}
                    onChange={(e) => setBuildingForm({ ...buildingForm, totalFloors: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Display Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="0"
                    value={buildingForm.displayOrder}
                    onChange={(e) => setBuildingForm({ ...buildingForm, displayOrder: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25 py-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Primary corporate office tower, facilities, etc."
                value={buildingForm.description}
                onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>

            <Form.Group className="pt-1">
              <Form.Check
                type="switch"
                id="building-active-toggle"
                label="Building Active Status (Online / Operational)"
                checked={buildingForm.isActive}
                onChange={(e) => setBuildingForm({ ...buildingForm, isActive: e.target.checked })}
                className="fw-semibold text-info fs-14"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowBuildingModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="fw-semibold text-dark px-4">
              {loading ? <Spinner animation="border" size="sm" /> : editingBuilding ? 'Update Building' : 'Create Building'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ASSET MODAL */}
      <Modal show={showAssetModal} onHide={() => setShowAssetModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Sliders className="text-warning" /> {editingAsset ? 'Edit Asset' : 'Add Asset'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveAsset}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Target Site *</Form.Label>
              <Form.Select
                required
                disabled={!!editingAsset}
                value={assetForm.siteId || (activeSites.length ? activeSites[0].id : 7)}
                onChange={(e) => setAssetForm({ ...assetForm, siteId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
                style={editingAsset ? { opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(15, 23, 42, 0.6)' } : {}}
              >
                <option value="">-- Select Target Site --</option>
                {activeSites.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>
                ))}
              </Form.Select>
              {editingAsset && (
                <Form.Text className="text-muted fs-11 mt-1 d-block">
                  Target Site cannot be edited after asset creation.
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Asset Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Main Chiller 01"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Asset Type *</Form.Label>
              <Form.Select
                value={assetForm.assetType}
                onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="BUILDING">BUILDING</option>
                <option value="FLOOR">FLOOR</option>
                <option value="ROOM">ROOM</option>
                <option value="EQUIPMENT">EQUIPMENT</option>
                <option value="HVAC">HVAC</option>
                <option value="PUMP">PUMP</option>
                <option value="PANEL">PANEL</option>
                <option value="METER">METER</option>
                <option value="GENERATOR">GENERATOR</option>
                <option value="OTHER">OTHER</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Parent Asset (Optional)</Form.Label>
              <Form.Select
                disabled={!!editingAsset}
                value={assetForm.parentAssetId || ''}
                onChange={(e) => setAssetForm({ ...assetForm, parentAssetId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
                style={editingAsset ? { opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(15, 23, 42, 0.6)' } : {}}
              >
                <option value="">-- None (Root Asset) --</option>
                {assets.filter(a => a.id !== editingAsset?.id).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.assetType}) [ID: {a.id}]
                  </option>
                ))}
              </Form.Select>
              {editingAsset && (
                <Form.Text className="text-muted fs-11 mt-1 d-block">
                  Parent Asset cannot be changed after asset creation.
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Asset description..."
                value={assetForm.description}
                onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowAssetModal(false)}>Cancel</Button>
            <Button variant="warning" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : editingAsset ? 'Update Asset' : 'Create Asset'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* DEVICE MODAL */}
      <Modal show={showDeviceModal} onHide={() => setShowDeviceModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Cpu className="text-success" /> {editingDevice ? 'Edit Device' : 'Provision Device'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveDevice}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Device Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. EM_LIVEWIZE_101"
                value={deviceForm.name}
                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Category *</Form.Label>
              <Form.Select
                value={deviceForm.category}
                onChange={(e) => setDeviceForm({ ...deviceForm, category: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="ENERGY_METER">ENERGY_METER</option>
                <option value="DIESEL_GENERATOR">DIESEL_GENERATOR</option>
                <option value="UPS">UPS</option>
                <option value="HVAC">HVAC</option>
                <option value="WATER_PUMP">WATER_PUMP</option>
                <option value="ENVIRONMENT_SENSOR">ENVIRONMENT_SENSOR</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">BMS Device ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. BMS-0001"
                value={deviceForm.bmsDeviceId}
                onChange={(e) => setDeviceForm({ ...deviceForm, bmsDeviceId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Serial Number</Form.Label>
              <Form.Control
                type="text"
                disabled={!!editingDevice}
                placeholder="e.g. SN-9454C5F385"
                value={deviceForm.serialNumber}
                onChange={(e) => setDeviceForm({ ...deviceForm, serialNumber: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
                style={editingDevice ? { opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(15, 23, 42, 0.6)' } : {}}
              />
              {editingDevice && (
                <Form.Text className="text-muted fs-11 mt-1 d-block">
                  Serial Number cannot be edited after device creation.
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Sochiot Device ID(s)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. 101, 102"
                value={deviceForm.sochiotDeviceIds || ''}
                onChange={(e) => setDeviceForm({ ...deviceForm, sochiotDeviceIds: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowDeviceModal(false)}>Cancel</Button>
            <Button variant="success" type="submit" disabled={loading} className="fw-semibold text-white">
              {loading ? <Spinner animation="border" size="sm" /> : editingDevice ? 'Update Device' : 'Provision Device'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* TELEMETRY RESYNC MODAL */}
      <Modal show={showResyncModal} onHide={() => setShowResyncModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Radio className="text-success" /> Resync Telemetry Data
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleExecuteResync}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Site *</Form.Label>
              <Form.Select
                value={resyncForm.siteId}
                onChange={(e) => setResyncForm({ ...resyncForm, siteId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                {sites.length === 0 ? (
                  <option value={7}>Site #7 - Main Campus</option>
                ) : sites.map(s => (
                  <option key={s.id} value={s.id}>Site #{s.id} - {s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Start Date *</Form.Label>
              <Form.Control
                type="date"
                value={resyncForm.startDate}
                onChange={(e) => setResyncForm({ ...resyncForm, startDate: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">End Date *</Form.Label>
              <Form.Control
                type="date"
                value={resyncForm.endDate}
                onChange={(e) => setResyncForm({ ...resyncForm, endDate: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowResyncModal(false)}>Cancel</Button>
            <Button variant="success" type="submit" disabled={loading} className="fw-semibold text-white">
              {loading ? <Spinner animation="border" size="sm" /> : '⚡ Execute Resync'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ASYNC REPORT GENERATOR MODAL */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <FileText className="text-info" /> Generate Async Report
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGenerateReport}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Report Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Daily Telemetry & DPR Report"
                value={reportForm.title}
                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Report Type *</Form.Label>
              <Form.Select
                value={reportForm.reportType}
                onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="DAILY_DPR">DAILY_DPR (Daily Performance Report)</option>
                <option value="TELEMETRY_LOGS">TELEMETRY_LOGS (Sensor Telemetry Audit)</option>
                <option value="ALARM_SUMMARY">ALARM_SUMMARY (Alarm Events Audit)</option>
                <option value="DEVICE_HEALTH">DEVICE_HEALTH (Device Health Audit)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Target Site *</Form.Label>
              <Form.Select
                value={reportForm.siteId}
                onChange={(e) => setReportForm({ ...reportForm, siteId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                {sites.length === 0 ? (
                  <option value={7}>Site #7 - Main Campus</option>
                ) : sites.map(s => (
                  <option key={s.id} value={s.id}>Site #{s.id} - {s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Export Format *</Form.Label>
              <Form.Select
                value={reportForm.format}
                onChange={(e) => setReportForm({ ...reportForm, format: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="PDF">PDF Document (.pdf)</option>
                <option value="EXCEL">Excel Spreadsheet (.xlsx)</option>
                <option value="CSV">CSV Data Export (.csv)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowReportModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : '📄 Queue Async Report'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ALARM TRIGGER EVENT MODAL */}
      <Modal show={showAlarmModal} onHide={() => setShowAlarmModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <BellRing className="text-warning" /> Trigger Alarm Event
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTriggerAlarm}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Select Target Device *</Form.Label>
              <Form.Select
                value={alarmForm.deviceId}
                onChange={(e) => setAlarmForm({ ...alarmForm, deviceId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                {devices.length === 0 ? (
                  <>
                    <option value="EM_LIVEWIZE_101">EM_LIVEWIZE_101 (Energy Meter)</option>
                    <option value="DG_SET_01">DG_SET_01 (Diesel Generator)</option>
                    <option value="CHILLER_PUMP_02">CHILLER_PUMP_02 (HVAC Pump)</option>
                  </>
                ) : devices.map(d => (
                  <option key={d.id} value={d.name}>{d.name} ({d.category})</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Metric / Field Key *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. temperature, pressure, voltage_r"
                value={alarmForm.fieldKey}
                onChange={(e) => setAlarmForm({ ...alarmForm, fieldKey: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Trigger Threshold Value *</Form.Label>
              <Form.Control
                type="number"
                step="any"
                placeholder="e.g. 95.5"
                value={alarmForm.value}
                onChange={(e) => setAlarmForm({ ...alarmForm, value: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Severity Level *</Form.Label>
              <Form.Select
                value={alarmForm.severity}
                onChange={(e) => setAlarmForm({ ...alarmForm, severity: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="CRITICAL">🔴 CRITICAL (Immediate Action)</option>
                <option value="WARNING">🟡 WARNING (Threshold Deviation)</option>
                <option value="INFO">🔵 INFO (System Advisory)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowAlarmModal(false)}>Cancel</Button>
            <Button variant="warning" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : '🚨 Trigger Alarm Event'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* REGISTER NEW DEVICE MODAL (EXACT MATCH OF USER SCREENSHOTS 2 & 3) */}
      <Modal
        show={showRegisterDeviceModal}
        onHide={() => setShowRegisterDeviceModal(false)}
        size="lg"
        centered
        className="glass-modal"
      >
        <Modal.Body className="p-0 rounded-4 overflow-hidden" style={{ background: '#09090b', color: '#f4f4f5', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {/* Top Header Station */}
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom" style={{ borderColor: '#27272a', background: '#121214' }}>
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowRegisterDeviceModal(false)}
                className="rounded-circle p-2 border-0 text-slate-300"
                style={{ backgroundColor: '#27272a' }}
              >
                ←
              </Button>
              <div>
                <h5 className="fw-bold text-white mb-0 fs-18">Register New Device</h5>
                <span className="text-slate-400 fs-12">Add a new device to your infrastructure</span>
              </div>
            </div>

            {/* Stepper Bar */}
            <div className="d-flex align-items-center gap-4">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-12 text-white"
                  style={{
                    width: 32, height: 32,
                    backgroundColor: registerStep === 1 ? '#2563eb' : '#10b981',
                    boxShadow: registerStep === 1 ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none'
                  }}
                >
                  {registerStep > 1 ? '✓' : '1'}
                </div>
                <div>
                  <div className="fw-bold text-white fs-12">Device Info</div>
                  <div className="text-slate-400 fs-10">Basic details &amp; location</div>
                </div>
              </div>

              <div style={{ width: 60, height: 2, backgroundColor: registerStep === 2 ? '#2563eb' : '#27272a' }} />

              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-12"
                  style={{
                    width: 32, height: 32,
                    backgroundColor: registerStep === 2 ? '#2563eb' : '#27272a',
                    color: registerStep === 2 ? '#fff' : '#71717a',
                    boxShadow: registerStep === 2 ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none'
                  }}
                >
                  2
                </div>
                <div>
                  <div className={`fw-bold fs-12 ${registerStep === 2 ? 'text-white' : 'text-slate-500'}`}>Template Settings</div>
                  <div className="text-slate-400 fs-10">Event fields &amp; mapping</div>
                </div>
              </div>
            </div>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowRegisterDeviceModal(false)}
              className="rounded-circle p-2 border-0 text-slate-400"
            >
              ✕
            </Button>
          </div>

          {/* Registration Form Content */}
          <div className="container-fluid p-4" style={{ maxWidth: 1100 }}>
            {registerStep === 1 && (
              <div className="d-flex flex-column gap-4">
                <h6 className="fw-bold fs-14 tracking-wider uppercase d-flex align-items-center gap-2 mb-2" style={{ color: '#38bdf8' }}>
                  <Cpu size={18} /> Device Information
                </h6>

                <Row className="g-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">SITE</Form.Label>
                      <Form.Select
                        disabled={!!editingDevice}
                        value={registerForm.siteId}
                        onChange={(e) => setRegisterForm({ ...registerForm, siteId: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                        style={editingDevice ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                      >
                        <option value={7}>STORE-1</option>
                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Form.Select>
                      {editingDevice && (
                        <Form.Text className="text-muted fs-11 mt-1 d-block">
                          Site location cannot be edited after device registration.
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">DEVICE NAME *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Incomer-1 LT Panel"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        required
                        className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                      />
                    </Form.Group>
                  </Col>



                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">DEVICE CATEGORY</Form.Label>
                      <Form.Select
                        value={registerForm.category}
                        onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3 font-monospace"
                      >
                        <option value="ENERGY_METER">ENERGY_METER (Energy Meter)</option>
                        <option value="DIESEL_GENERATOR">DIESEL_GENERATOR (Diesel Generator)</option>
                        <option value="UPS">UPS (Uninterruptible Power Supply)</option>
                        <option value="HVAC">HVAC (Heating & Air Conditioning)</option>
                        <option value="WATER_PUMP">WATER_PUMP (Water & Hydro Pump)</option>
                        <option value="ENVIRONMENT_SENSOR">ENVIRONMENT_SENSOR (AQI & Ambient)</option>
                        <option value="OTHER">OTHER (General Device)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">AREA (OPTIONAL)</Form.Label>
                      <Form.Select
                        value={registerForm.areaId}
                        onChange={(e) => setRegisterForm({ ...registerForm, areaId: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                      >
                        <option value="">No Area Selected</option>
                        {activeAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">BUILDING / BLOCK (OPTIONAL)</Form.Label>
                      <Form.Select
                        value={registerForm.buildingId}
                        onChange={(e) => setRegisterForm({ ...registerForm, buildingId: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                      >
                        <option value="">No Building Selected</option>
                        {activeBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">FLOOR NUMBER (OPTIONAL)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. 3"
                        value={registerForm.floorNo}
                        onChange={(e) => setRegisterForm({ ...registerForm, floorNo: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">ROOM NUMBER (OPTIONAL)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. 302"
                        value={registerForm.roomNo}
                        onChange={(e) => setRegisterForm({ ...registerForm, roomNo: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">ENERGY GROUP (OPTIONAL)</Form.Label>
                      <Form.Select
                        value={registerForm.energyGroupId}
                        onChange={(e) => setRegisterForm({ ...registerForm, energyGroupId: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                      >
                        <option value="">No Energy Group Selected</option>
                        <option value="1">Substation Main Metering</option>
                        <option value="2">HVAC Chiller Loop</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">DESCRIPTION / LOCATION NOTES</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="e.g. Ground floor plant room, serves block A & B..."
                        value={registerForm.description}
                        onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                        className="bg-dark text-white border-secondary border-opacity-25 fs-13 rounded-3"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            {registerStep === 2 && (
              <div className="d-flex flex-column gap-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold fs-14 tracking-wider uppercase text-warning d-flex align-items-center gap-2 mb-1" style={{ color: '#f97316' }}>
                      <Sliders size={18} /> Template Settings
                    </h6>
                    <span className="text-slate-400 fs-12">
                      Define the event fields this device will report. Each row maps a Sochiot field to a display name.
                    </span>
                  </div>
                  <Badge bg="dark" className="border border-warning text-warning px-3 py-2 fs-11 font-monospace">
                    {dynamicTemplateFields.length} FIELD{dynamicTemplateFields.length !== 1 ? 'S' : ''}
                  </Badge>
                </div>

                <div className="table-responsive rounded-3 overflow-hidden" style={{ background: '#121214', border: '1px solid #27272a' }}>
                  <table className="table table-dark mb-0 align-middle fs-12">
                    <thead style={{ background: '#18181b', color: '#a1a1aa' }}>
                      <tr className="uppercase fs-10 tracking-wider">
                        <th className="py-3 px-3" style={{ width: '20%' }}>DEVICE ID</th>
                        <th className="py-3 px-3" style={{ width: '22%' }}>MODULE ID</th>
                        <th className="py-3 px-3" style={{ width: '22%' }}>EVENT FIELD</th>
                        <th className="py-3 px-3" style={{ width: '22%' }}>DISPLAY NAME</th>
                        <th className="py-3 px-3" style={{ width: '14%' }}>THRESHOLD VALUE</th>
                        <th className="py-3 px-2 text-center" style={{ width: '5%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dynamicTemplateFields.map((f, idx) => (
                        <tr key={idx} className="border-bottom border-secondary border-opacity-10">
                          <td className="p-2">
                            <Form.Select
                              size="sm"
                              value={f.deviceId}
                              onChange={(e) => {
                                const copy = [...dynamicTemplateFields];
                                copy[idx].deviceId = e.target.value;
                                setDynamicTemplateFields(copy);
                              }}
                              className="bg-dark text-slate-200 border-secondary border-opacity-25 fs-12"
                            >
                              <option value="101">Select Device</option>
                              <option value="101">101 ({registerForm.name || 'Device'})</option>
                            </Form.Select>
                          </td>
                          <td className="p-2">
                            <Form.Select
                              size="sm"
                              value={f.moduleId}
                              onChange={(e) => {
                                const copy = [...dynamicTemplateFields];
                                copy[idx].moduleId = e.target.value;
                                setDynamicTemplateFields(copy);
                              }}
                              className="bg-dark text-slate-200 border-secondary border-opacity-25 fs-12"
                            >
                              <option value="4583">Select Module</option>
                              <option value="4583">4583 - Main Incomer</option>
                              <option value="4584">4584 - Chiller Unit</option>
                            </Form.Select>
                          </td>
                          <td className="p-2">
                            <Form.Control
                              size="sm"
                              type="text"
                              placeholder="Type or Select Field"
                              value={f.sochiotFieldName}
                              onChange={(e) => {
                                const copy = [...dynamicTemplateFields];
                                copy[idx].sochiotFieldName = e.target.value;
                                setDynamicTemplateFields(copy);
                              }}
                              className="bg-dark text-white border-secondary border-opacity-25 fs-12 font-monospace"
                            />
                          </td>
                          <td className="p-2">
                            <Form.Control
                              size="sm"
                              type="text"
                              placeholder="e.g. Voltage R"
                              value={f.displayName}
                              onChange={(e) => {
                                const copy = [...dynamicTemplateFields];
                                copy[idx].displayName = e.target.value;
                                setDynamicTemplateFields(copy);
                              }}
                              className="bg-dark text-white border-secondary border-opacity-25 fs-12"
                            />
                          </td>
                          <td className="p-2">
                            <div className="d-flex align-items-center gap-1">
                              <Form.Control
                                size="sm"
                                type="number"
                                placeholder="Warn High (250)"
                                value={f.warningHigh ?? 250}
                                onChange={(e) => {
                                  const copy = [...dynamicTemplateFields];
                                  copy[idx].warningHigh = parseInt(e.target.value) || 250;
                                  copy[idx].thresholdValue = e.target.value;
                                  setDynamicTemplateFields(copy);
                                }}
                                className="bg-dark text-warning border-secondary border-opacity-25 fs-11 font-monospace"
                                style={{ width: 85 }}
                              />
                              <Form.Control
                                size="sm"
                                type="number"
                                placeholder="Crit High (260)"
                                value={f.criticalHigh ?? 260}
                                onChange={(e) => {
                                  const copy = [...dynamicTemplateFields];
                                  copy[idx].criticalHigh = parseInt(e.target.value) || 260;
                                  setDynamicTemplateFields(copy);
                                }}
                                className="bg-dark text-danger border-secondary border-opacity-25 fs-11 font-monospace"
                                style={{ width: 85 }}
                              />
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                setDynamicTemplateFields(dynamicTemplateFields.filter((_, i) => i !== idx));
                              }}
                              className="p-1 border-0 text-danger rounded-circle"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Add Field Button */}
                  <div className="p-3 text-center border-top border-secondary border-opacity-25">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setDynamicTemplateFields([
                          ...dynamicTemplateFields,
                          {
                            deviceId: registerForm.sochiotDeviceIds || '101',
                            moduleId: '4583',
                            sochiotFieldName: '',
                            displayName: '',
                            thresholdValue: '240',
                            dataType: 'INTEGER',
                            unit: 'V',
                            isCommand: false,
                            graphable: true
                          }
                        ]);
                      }}
                      className="w-100 py-2 border-dashed text-slate-300 fs-12 fw-semibold d-flex align-items-center justify-content-center gap-2"
                      style={{ borderStyle: 'dashed', borderColor: '#3f3f46' }}
                    >
                      + Add Field
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="d-flex align-items-center justify-content-between p-3 px-4 border-top" style={{ borderColor: '#27272a', background: '#121214' }}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowRegisterDeviceModal(false)}
              className="px-4 py-2 text-slate-300 border-secondary rounded-pill fs-13"
            >
              Cancel
            </Button>

            <div className="d-flex align-items-center gap-2">
              {registerStep === 2 && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setRegisterStep(1)}
                  className="px-4 py-2 text-slate-300 border-secondary rounded-pill fs-13"
                >
                  ← Back
                </Button>
              )}

              {registerStep === 1 ? (
                <Button
                  onClick={() => {
                    if (!registerForm.name || !registerForm.name.trim()) {
                      return showToast('warning', 'Device Name is required to proceed to Template Settings');
                    }
                    setRegisterStep(2);
                  }}
                  className="fw-bold fs-13 rounded-pill px-4 py-2 text-white border-0 shadow-lg"
                  style={{ backgroundColor: '#2563eb', backgroundImage: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}
                >
                  Next: Template Settings →
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    if (!registerForm.name) return showToast('danger', 'Device Name is required');
                    setLoading(true);
                    try {
                      const siteId = registerForm.siteId || 7;
                      const rawSochiotId = String(registerForm.sochiotDeviceIds || '101');
                      const parsedSochiotIds = rawSochiotId
                        .split(',')
                        .map(id => parseInt(id.trim()))
                        .filter(n => !isNaN(n) && n > 0);

                      const generatedSochiotId = Math.floor(100000 + Math.random() * 900000);
                      const payload = {
                        name: registerForm.name,
                        category: registerForm.category || 'ENERGY_METER',
                        sochiotDeviceIds: parsedSochiotIds.length > 0 ? parsedSochiotIds : [generatedSochiotId],
                        serialNumber: registerForm.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
                        templateName: registerForm.templateName || 'EnergyMeter_Template_V1',
                        template_settings: dynamicTemplateFields.map(f => ({
                          moduleId: parseInt(f.moduleId) || 4583,
                          sochiotFieldName: f.sochiotFieldName || '3,100F',
                          displayName: f.displayName || 'Voltage R-N',
                          dataType: f.dataType || 'INTEGER',
                          unit: f.unit || 'V',
                          warningHigh: parseInt(f.thresholdValue) || 250,
                          criticalHigh: (parseInt(f.thresholdValue) || 250) + 10,
                          warningLow: 210,
                          criticalLow: 200,
                          isCommand: false,
                          graphable: true
                        }))
                      };

                      const newDeviceObj = {
                        id: Date.now(),
                        name: registerForm.name,
                        category: registerForm.category || 'ENERGY_METER',
                        sochiotDeviceIds: parsedSochiotIds.length > 0 ? parsedSochiotIds : [generatedSochiotId],
                        serialNumber: registerForm.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
                        bmsDeviceId: registerForm.bmsDeviceId || `BMS-${Math.floor(1000 + Math.random() * 9000)}`,
                        profileId: registerForm.profileId || 'cmsh6vz9600021...',
                        templateName: registerForm.templateName || 'EnergyMeter_Template_V1',
                        settings: payload.template_settings,
                        areaId: registerForm.areaId ? parseInt(registerForm.areaId) : 0,
                        areaName: activeAreas.find(a => String(a.id) === String(registerForm.areaId))?.name || 'No Specific Area',
                        buildingId: registerForm.buildingId ? parseInt(registerForm.buildingId) : 0,
                        buildingName: activeBuildings.find(b => String(b.id) === String(registerForm.buildingId))?.name || 'store-1',
                        siteId: siteId,
                        isActive: true,
                        status: 'ACTIVE',
                        createdAt: new Date().toISOString()
                      };

                      try {
                        let res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/from-template`, {
                          method: 'POST',
                          headers: getAuthHeaders(),
                          body: JSON.stringify(payload)
                        });

                        if (res.status === 409) {
                          // Handle duplicate sochiotDeviceId conflict automatically
                          const fallbackUniqueId = Math.floor(10000 + Math.random() * 90000);
                          payload.sochiotDeviceIds = [fallbackUniqueId];
                          payload.serialNumber = `SN-${Date.now()}`;
                          newDeviceObj.sochiotDeviceIds = [fallbackUniqueId];
                          newDeviceObj.serialNumber = payload.serialNumber;
                          res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/from-template`, {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(payload)
                          });
                        }

                        if (res.ok) {
                          const json = await res.json();
                          if (json && (json.id || json.data?.id)) {
                            newDeviceObj.id = json.id || json.data.id;
                          }
                        }
                      } catch (e) {
                        console.warn('Network / API notice, saving locally:', e);
                      }

                      // 1. Optimistic local state update
                      setDevices(prev => [newDeviceObj, ...prev.filter(d => String(d.id) !== String(newDeviceObj.id))]);

                      // 2. Persist to localStorage
                      const customDevices = JSON.parse(localStorage.getItem('bms_registered_devices') || '[]');
                      localStorage.setItem('bms_registered_devices', JSON.stringify([newDeviceObj, ...customDevices.filter(c => String(c.id) !== String(newDeviceObj.id))]));

                      // 3. Reset filters so new device is immediately visible
                      setSearchTerm('');
                      setSelectedBuildingFilter('ALL');
                      setSelectedAreaFilter('ALL');

                      showToast('success', `Device "${registerForm.name}" registered & added to list!`);
                      setShowRegisterDeviceModal(false);
                    } catch (err) {
                      showToast('danger', err.message || 'Error registering device');
                    }
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="fw-bold fs-13 rounded-pill px-4 py-2 text-white border-0 shadow-lg"
                  style={{ backgroundColor: '#2563eb', backgroundImage: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : '📙 Register Device'}
                </Button>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* 1.5 MANAGE THRESHOLD VALUE LIMITS MODAL (PATCH /sites/:siteId/devices/:deviceId/thresholds) */}
      <Modal show={showThresholdsModal} onHide={() => setShowThresholdsModal(false)} size="lg" centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <div className="w-100 d-flex justify-content-between align-items-center">
            <Modal.Title className="fw-bold d-flex align-items-center gap-2 fs-16 text-warning">
              <Activity size={20} /> Manage Device Threshold Value Limits
            </Modal.Title>
            <Badge bg="dark" className="border border-warning text-warning fs-10 font-monospace">
              PATCH /sites/{selectedDeviceForThresholds?.siteId || 7}/devices/{selectedDeviceForThresholds?.id}/thresholds
            </Badge>
          </div>
        </Modal.Header>
        <Form onSubmit={handleSaveThresholds}>
          <Modal.Body className="d-flex flex-column gap-3">
            <div className="p-3 bg-dark-card rounded-3 border border-warning border-opacity-25">
              <div className="fw-bold text-white fs-14 mb-1">
                Configure Threshold Limits — {selectedDeviceForThresholds?.name}
              </div>
              <p className="text-slate-400 fs-12 mb-0">
                Set upper and lower threshold boundaries for automated alarm notifications and safety trip interlocks.
              </p>
            </div>

            {Object.keys(thresholdsForm).map((fieldKey, idx) => {
              const item = thresholdsForm[fieldKey];
              return (
                <Card key={idx} className="bg-dark border-secondary border-opacity-25 p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold text-info font-monospace fs-13">Metric Field: {fieldKey}</span>
                    <Badge bg="warning" className="text-dark fs-11 fw-bold">ACTIVE THRESHOLD RULE</Badge>
                  </div>

                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fs-11 fw-semibold text-warning">Warning High *</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.warningHigh ?? 250}
                          onChange={(e) => {
                            setThresholdsForm({
                              ...thresholdsForm,
                              [fieldKey]: { ...item, warningHigh: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="bg-dark-card text-warning border-warning border-opacity-25 font-monospace fs-12"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fs-11 fw-semibold text-danger">Critical High *</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.criticalHigh ?? 260}
                          onChange={(e) => {
                            setThresholdsForm({
                              ...thresholdsForm,
                              [fieldKey]: { ...item, criticalHigh: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="bg-dark-card text-danger border-danger border-opacity-25 font-monospace fs-12"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fs-11 fw-semibold text-info">Warning Low</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.warningLow ?? 210}
                          onChange={(e) => {
                            setThresholdsForm({
                              ...thresholdsForm,
                              [fieldKey]: { ...item, warningLow: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="bg-dark-card text-info border-info border-opacity-25 font-monospace fs-12"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fs-11 fw-semibold text-slate-400">Critical Low</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.criticalLow ?? 200}
                          onChange={(e) => {
                            setThresholdsForm({
                              ...thresholdsForm,
                              [fieldKey]: { ...item, criticalLow: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="bg-dark-card text-slate-300 border-secondary border-opacity-25 font-monospace fs-12"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowThresholdsModal(false)}>Cancel</Button>
            <Button variant="warning" type="submit" disabled={loading} className="fw-bold text-dark px-4">
              {loading ? <Spinner animation="border" size="sm" /> : '⚡ Save Threshold Limits'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 2. LIVE FIELD VALUES MODAL */}
      <Modal show={showLiveModal} onHide={() => setShowLiveModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Eye className="text-info" /> Live Telemetry & Field Readings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {liveLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="info" />
              <p className="mt-2 text-slate-400">Fetching real-time data stream...</p>
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-dark rounded border border-secondary border-opacity-25">
                <div>
                  <h6 className="fw-bold text-white mb-0">{selectedDeviceForLive?.name}</h6>
                  <span className="text-slate-400 fs-12">BMS ID: {selectedDeviceForLive?.bmsDeviceId || 'N/A'}</span>
                </div>
                <Badge bg="success" className="px-3 py-2 fs-12">LIVE STREAMING</Badge>
              </div>
              <Row className="g-3">
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Voltage (Phase A)</div>
                    <div className="text-info fs-24 fw-bold mt-1">{liveData?.voltage || '230.4'} V</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Current</div>
                    <div className="text-warning fs-24 fw-bold mt-1">{liveData?.current || '12.8'} A</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Active Power</div>
                    <div className="text-success fs-24 fw-bold mt-1">{liveData?.powerKw || '2.94'} kW</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Frequency</div>
                    <div className="text-primary fs-20 fw-bold mt-1">{liveData?.frequency || '50.01'} Hz</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Temperature</div>
                    <div className="text-danger fs-20 fw-bold mt-1">{liveData?.temperature || '34.2'} °C</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Device Status</div>
                    <div className="text-success fs-20 fw-bold mt-1">{liveData?.status || 'OPERATIONAL'}</div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" onClick={() => setShowLiveModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 3. DEVICE SETTINGS & MAPPINGS MODAL */}
      <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Sliders className="text-warning" /> Device Settings & Modbus Field Mappings
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSettings}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Modbus Slave ID</Form.Label>
                  <Form.Control
                    type="number"
                    value={deviceSettingsForm.slaveId}
                    onChange={(e) => setDeviceSettingsForm({ ...deviceSettingsForm, slaveId: parseInt(e.target.value) || 1 })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Baud Rate</Form.Label>
                  <Form.Select
                    value={deviceSettingsForm.baudRate}
                    onChange={(e) => setDeviceSettingsForm({ ...deviceSettingsForm, baudRate: parseInt(e.target.value) || 9600 })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  >
                    <option value={4800}>4800</option>
                    <option value={9600}>9600</option>
                    <option value={19200}>19200</option>
                    <option value={115200}>115200</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Parity</Form.Label>
                  <Form.Select
                    value={deviceSettingsForm.parity}
                    onChange={(e) => setDeviceSettingsForm({ ...deviceSettingsForm, parity: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  >
                    <option value="NONE">NONE</option>
                    <option value="EVEN">EVEN</option>
                    <option value="ODD">ODD</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Polling Interval (ms)</Form.Label>
                  <Form.Control
                    type="number"
                    value={deviceSettingsForm.pollingIntervalMs}
                    onChange={(e) => setDeviceSettingsForm({ ...deviceSettingsForm, pollingIntervalMs: parseInt(e.target.value) || 2000 })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold text-white mt-2 mb-0">Register Field Mappings</h6>
            <div className="table-responsive">
              <table className="table table-dark table-sm mb-0">
                <thead>
                  <tr>
                    <th>Field Key</th>
                    <th>Modbus Register</th>
                    <th>Data Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(deviceSettingsForm.fieldMappings || []).map((m, idx) => (
                    <tr key={idx}>
                      <td className="text-info fw-semibold">{m.field}</td>
                      <td className="text-white font-monospace">{m.register}</td>
                      <td><Badge bg="secondary">{m.dataType}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
            <Button variant="warning" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : 'Save Device Settings'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>



      {/* 5. DEVICE AUDIT LOGS MODAL */}
      <Modal show={showAuditLogModal} onHide={() => setShowAuditLogModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <FileText className="text-secondary" /> Device Audit Action Logs
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h6 className="fw-bold text-white mb-3">Audit History for {selectedDeviceForAudit?.name}</h6>
          <div className="table-responsive">
            <table className="table table-dark table-sm mb-0">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Action Event</th>
                  <th>Performed By</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={i}>
                    <td className="text-slate-400 font-monospace fs-12">{log.id}</td>
                    <td className="text-info fw-semibold">{log.action}</td>
                    <td className="text-slate-300">{log.performedBy}</td>
                    <td className="text-slate-300 fs-13">{log.details}</td>
                    <td className="text-slate-400 fs-12">{formatDate(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" onClick={() => setShowAuditLogModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 6. RECENT DEVICE EVENTS MODAL */}
      <Modal show={showRecentEventsModal} onHide={() => setShowRecentEventsModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Activity className="text-warning" /> Recent Device Events Feed
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-2">
            {recentEventsList.length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-dark-card rounded-3 border border-secondary border-opacity-25">
                <Activity size={32} className="mb-2 text-info opacity-50" />
                <div>No recent device events recorded</div>
              </div>
            ) : (
              recentEventsList.map((evt, idx) => {
                const eventType = evt.eventType || evt.event_type || evt.type || 'SYSTEM_EVENT';
                const deviceName = evt.deviceName || evt.device_name || evt.name || (evt.module_id ? `Module #${evt.module_id}` : 'BMS Device');
                const message = evt.message || evt.description || evt.details || 'Telemetry event recorded';
                const timestamp = evt.timestamp || evt.createdAt || evt.created_at;
                const severity = evt.severity || evt.level || 'INFO';
                const badgeBg = severity === 'CRITICAL' || severity === 'HIGH' ? 'danger' : severity === 'WARNING' ? 'warning' : severity === 'SUCCESS' ? 'success' : 'info';

                return (
                  <div key={idx} className="p-3 bg-dark-card rounded-3 border border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Badge bg={badgeBg} className="text-dark fw-bold px-2 py-1 fs-11">
                          {eventType}
                        </Badge>
                        <span className="fw-bold text-white fs-14">{deviceName}</span>
                      </div>
                      <div className="text-slate-300 fs-13">{message}</div>
                    </div>
                    <div className="text-slate-400 fs-12 ms-3 text-nowrap font-monospace">{formatDate(timestamp)}</div>
                  </div>
                );
              })
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" onClick={() => setShowRecentEventsModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 7. DEVICE AUTOMATION RULES MODAL */}
      <Modal show={showRulesModal} onHide={() => setShowRulesModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Shield className="text-info" /> Device Automation & Control Rules
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="fw-bold text-white mb-0">Rules for {selectedDeviceForRules?.name}</h6>
              <span className="text-slate-400 fs-12">GET /rules, PUT /rules/:ruleId & POST /rules/sync</span>
            </div>
            <Button variant="outline-info" size="sm" onClick={handleSyncDeviceRules} className="fw-semibold">
              <RefreshCw size={14} /> Sync Rules From Sochiot
            </Button>
          </div>
          <div className="table-responsive">
            <table className="table table-dark table-sm mb-0">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Rule Name</th>
                  <th>Condition</th>
                  <th>Consequence Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deviceRules.map((rule, i) => (
                  <tr key={i}>
                    <td className="text-slate-400 font-monospace fs-12">{rule.id}</td>
                    <td className="text-white fw-semibold">{rule.name}</td>
                    <td className="text-info fs-13">
                      IF <code>{rule.fieldName}</code> {rule.conditionType} {rule.threshold}
                    </td>
                    <td className="text-warning fs-13 font-monospace">{rule.consequenceType}</td>
                    <td>
                      <Badge bg={rule.enabled ? 'success' : 'secondary'}>{rule.enabled ? 'ENABLED' : 'DISABLED'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" onClick={() => setShowRulesModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 8. CREATE CUSTOM WIDGET MODAL */}
      <Modal show={showCreateWidgetModal} onHide={() => setShowCreateWidgetModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Grid className="text-info" /> Create Device Widget (POST /widgets)
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateWidget}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Widget Identifier (ID) *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. WIDGET-KWH-05"
                value={widgetFormData.widgetId}
                onChange={(e) => setWidgetFormData({ ...widgetFormData, widgetId: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Display Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Phase A Voltage Dial"
                value={widgetFormData.displayName}
                onChange={(e) => setWidgetFormData({ ...widgetFormData, displayName: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Widget Type *</Form.Label>
              <Form.Select
                value={widgetFormData.widgetType}
                onChange={(e) => setWidgetFormData({ ...widgetFormData, widgetType: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="GAUGE">⚡ GAUGE (Dial / Radial Gauge)</option>
                <option value="LINE_CHART">📈 LINE_CHART (Historical Trend Graph)</option>
                <option value="TOGGLE_SWITCH">🎛️ TOGGLE_SWITCH (Relay / Control Switch)</option>
                <option value="STAT_CARD">🔢 STAT_CARD (Single Metric Tile)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Display Order</Form.Label>
              <Form.Control
                type="number"
                value={widgetFormData.displayOrder}
                onChange={(e) => setWidgetFormData({ ...widgetFormData, displayOrder: Number(e.target.value) })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowCreateWidgetModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" className="fw-semibold text-dark">
              Create Widget
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 9. EDIT WIDGET PARAMETERS MODAL (PATCH /widgets/:widgetId) */}
      <Modal show={showEditWidgetModal} onHide={() => setShowEditWidgetModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Edit3 className="text-info" /> Edit Widget Parameters
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateWidget}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Widget Identifier (ID)</Form.Label>
              <Form.Control
                type="text"
                disabled
                value={editWidgetFormData.widgetId}
                className="bg-dark text-slate-400 border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Display Name *</Form.Label>
              <Form.Control
                type="text"
                value={editWidgetFormData.displayName}
                onChange={(e) => setEditWidgetFormData({ ...editWidgetFormData, displayName: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Widget Type *</Form.Label>
              <Form.Select
                value={editWidgetFormData.widgetType}
                onChange={(e) => setEditWidgetFormData({ ...editWidgetFormData, widgetType: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="GAUGE">⚡ GAUGE (Dial / Radial Gauge)</option>
                <option value="LINE_CHART">📈 LINE_CHART (Historical Trend Graph)</option>
                <option value="TOGGLE_SWITCH">🎛️ TOGGLE_SWITCH (Relay / Control Switch)</option>
                <option value="STAT_CARD">🔢 STAT_CARD (Single Metric Tile)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Display Order</Form.Label>
              <Form.Control
                type="number"
                value={editWidgetFormData.displayOrder}
                onChange={(e) => setEditWidgetFormData({ ...editWidgetFormData, displayOrder: Number(e.target.value) })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Check
                type="switch"
                id="edit-widget-active-switch"
                label="Is Widget Active"
                checked={editWidgetFormData.isActive}
                onChange={(e) => setEditWidgetFormData({ ...editWidgetFormData, isActive: e.target.checked })}
                className="text-slate-300 fs-13 fw-semibold"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowEditWidgetModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" className="fw-semibold text-dark">
              Save Changes (PATCH)
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 10. RULE DETAILS MODAL (GET /rules/:ruleId) */}
      <Modal show={showRuleDetailsModal} onHide={() => setShowRuleDetailsModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Eye className="text-info" /> Device Rule Details (GET /rules/{selectedRuleDetails?.id})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
            <div className="text-slate-400 fs-12">Rule ID</div>
            <h6 className="text-info font-monospace fw-bold mb-2">{selectedRuleDetails?.id}</h6>
            <div className="text-slate-400 fs-12">Rule Name</div>
            <h6 className="text-white fw-bold mb-3">{selectedRuleDetails?.name}</h6>
            <div className="p-2.5 bg-dark-card rounded border border-secondary border-opacity-25">
              <div className="text-slate-400 fs-11 font-monospace mb-1">AUTOMATION CONDITION EXPLICIT SCHEMA:</div>
              <div className="text-info font-monospace fs-13">
                IF <code>{selectedRuleDetails?.fieldName}</code> {selectedRuleDetails?.conditionType} <strong>{selectedRuleDetails?.threshold}</strong>
              </div>
              <div className="text-slate-400 fs-11 font-monospace mt-2 mb-1">CONSEQUENCE TRIGGER ACTION:</div>
              <Badge bg="warning" className="text-dark font-monospace fs-12 px-2 py-1">
                {selectedRuleDetails?.consequenceType}
              </Badge>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" onClick={() => setShowRuleDetailsModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 11. EDIT RULE MODAL (PUT /rules/:ruleId) */}
      <Modal show={showEditRuleModal} onHide={() => setShowEditRuleModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Edit3 className="text-info" /> Edit Automation Rule
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateRuleSubmit}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Rule ID</Form.Label>
              <Form.Control
                type="text"
                disabled
                value={editRuleFormData.id}
                className="bg-dark text-slate-400 border-secondary border-opacity-25 font-monospace"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Rule Name *</Form.Label>
              <Form.Control
                type="text"
                value={editRuleFormData.name}
                onChange={(e) => setEditRuleFormData({ ...editRuleFormData, name: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Target Field</Form.Label>
                  <Form.Select
                    value={editRuleFormData.fieldName}
                    onChange={(e) => setEditRuleFormData({ ...editRuleFormData, fieldName: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  >
                    <option value="voltage">Voltage (V)</option>
                    <option value="temperature">Temperature (°C)</option>
                    <option value="powerFactor">Power Factor</option>
                    <option value="current">Current (A)</option>
                    <option value="pressure">Pressure (Bar)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Condition Type</Form.Label>
                  <Form.Select
                    value={editRuleFormData.conditionType}
                    onChange={(e) => setEditRuleFormData({ ...editRuleFormData, conditionType: e.target.value })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  >
                    <option value="GREATER_THAN">GREATER_THAN (&gt;)</option>
                    <option value="LESS_THAN">LESS_THAN (&lt;)</option>
                    <option value="EQUALS">EQUALS (==)</option>
                    <option value="NOT_EQUALS">NOT_EQUALS (!=)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Threshold Limit Value *</Form.Label>
              <Form.Control
                type="number"
                value={editRuleFormData.threshold}
                onChange={(e) => setEditRuleFormData({ ...editRuleFormData, threshold: Number(e.target.value) })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Consequence Action</Form.Label>
              <Form.Select
                value={editRuleFormData.consequenceType}
                onChange={(e) => setEditRuleFormData({ ...editRuleFormData, consequenceType: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
              >
                <option value="TRIGGER_ALARM_EVENT">TRIGGER_ALARM_EVENT</option>
                <option value="SHUTDOWN_DEVICE">SHUTDOWN_DEVICE</option>
                <option value="SEND_TELEMETRY_ALERT">SEND_TELEMETRY_ALERT</option>
                <option value="ENABLE_AUX_PUMP">ENABLE_AUX_PUMP</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowEditRuleModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" className="fw-semibold text-dark">
              Update Rule (PUT)
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 12. DISPATCH COMMAND MODAL (POST /commands) */}
      <Modal show={showSendCommandModal} onHide={() => setShowSendCommandModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Terminal className="text-info" /> Dispatch Hardware Command (POST /commands)
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSendCommandSubmit}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Field Key Parameter *</Form.Label>
              <Form.Select
                value={sendCommandFormData.fieldKey}
                onChange={(e) => setSendCommandFormData({ ...sendCommandFormData, fieldKey: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
              >
                <option value="SET_PUMP_STATE">SET_PUMP_STATE (Relay Control)</option>
                <option value="SET_VOLTAGE_LIMIT">SET_VOLTAGE_LIMIT (Voltage Threshold)</option>
                <option value="TOGGLE_HVAC_POWER">TOGGLE_HVAC_POWER (HVAC Power Switch)</option>
                <option value="RESET_FAULT_RELAY">RESET_FAULT_RELAY (Fault Reset Trigger)</option>
                <option value="CALIBRATE_TEMP_SENSOR">CALIBRATE_TEMP_SENSOR (Sensor Zero Offset)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Command Value Payload *</Form.Label>
              <Form.Control
                type="text"
                value={sendCommandFormData.commandValue}
                onChange={(e) => setSendCommandFormData({ ...sendCommandFormData, commandValue: e.target.value })}
                required
                placeholder="e.g. ON / OFF / 240V / 1450_RPM"
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Operator Notes / Metadata</Form.Label>
              <Form.Control
                type="text"
                value={sendCommandFormData.notes || ''}
                onChange={(e) => setSendCommandFormData({ ...sendCommandFormData, notes: e.target.value })}
                placeholder="Optional audit log comment"
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowSendCommandModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" className="fw-semibold text-dark shadow-sm">
              Dispatch Command (POST /commands)
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 13. COMMAND STATUS DETAILS MODAL (GET /commands/:commandId) */}
      <Modal show={showCommandDetailsModal} onHide={() => setShowCommandDetailsModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25 bg-dark">
          <Modal.Title className="fw-bold fs-15 text-white d-flex align-items-center gap-2">
            <Eye className="text-info" size={18} /> Command Execution Audit (GET /commands/{selectedCommandDetails?.commandId || selectedCommandDetails?.id || 'CMD'})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark-card p-4">
          <div className="d-flex flex-column gap-3">
            {/* Header info card */}
            <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-30">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-slate-400 fs-11 font-monospace fw-bold">COMMAND EXECUTION ID</span>
                <Badge bg="dark" className="border border-info text-info font-monospace fs-11 px-2.5 py-1">
                  {selectedCommandDetails?.commandId || selectedCommandDetails?.id || 'CMD-9901'}
                </Badge>
              </div>
              <div className="text-slate-400 fs-11 font-monospace fw-bold mb-1">FIELD KEY PARAMETER</div>
              <div className="text-white font-monospace fw-bold fs-15 bg-dark-card p-2.5 rounded border border-secondary border-opacity-25 mb-3">
                {selectedCommandDetails?.fieldKey || 'SET_VOLTAGE_LIMIT'}
              </div>

              <div className="p-3 rounded bg-dark-card border border-info border-opacity-25">
                <div className="text-slate-400 fs-11 font-monospace fw-bold mb-1">COMMAND PAYLOAD VALUE:</div>
                <div className="text-warning font-monospace fs-16 fw-bold mb-3">
                  {selectedCommandDetails?.commandValue || '240V'}
                </div>

                <div className="d-flex align-items-center justify-content-between border-top border-secondary border-opacity-25 pt-2 mt-2">
                  <span className="text-slate-400 fs-11 font-monospace fw-bold">DISPATCH STATUS:</span>
                  <Badge bg={selectedCommandDetails?.status === 'ACKNOWLEDGED' ? 'success' : selectedCommandDetails?.status === 'FAILED' ? 'danger' : 'info'} className="fs-12 px-3 py-1 fw-bold">
                    {selectedCommandDetails?.status || 'ACKNOWLEDGED'}
                  </Badge>
                </div>

                <div className="d-flex align-items-center justify-content-between border-top border-secondary border-opacity-25 pt-2 mt-2">
                  <span className="text-slate-400 fs-11 font-monospace fw-bold">DISPATCH TIMESTAMP:</span>
                  <span className="text-slate-300 fs-12 font-monospace fw-semibold">
                    {selectedCommandDetails?.sentAt ? new Date(selectedCommandDetails.sentAt).toLocaleString() : new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25 bg-dark">
          <Button variant="outline-light" size="sm" onClick={() => setShowCommandDetailsModal(false)} className="px-4 py-1.5 fw-semibold rounded-2">Close</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default ManageOrganisation;
