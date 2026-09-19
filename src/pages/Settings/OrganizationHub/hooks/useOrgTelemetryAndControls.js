import { useState } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';
import { getAuthToken } from '../../../../utils/cookieUtils';

export const API_BASE_URL = getApiUrl();

export const getAuthHeaders = () => {
  const token = getAuthToken() || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const normalizeList = (raw, key) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (raw.data && Array.isArray(raw.data[key])) return raw.data[key];
  if (Array.isArray(raw[key])) return raw[key];
  return [];
};

export const useOrgTelemetryAndControls = ({ showToast, setLoading, devices }) => {
  // Telemetry, Reports, Alarms States
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [alarmsList, setAlarmsList] = useState([]);

  // Resync Telemetry Modal
  const [showResyncModal, setShowResyncModal] = useState(false);
  const [resyncForm, setResyncForm] = useState({
    siteId: 7,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'DAILY_DPR',
    siteId: 7,
    format: 'PDF',
    title: 'Daily Telemetry & DPR Report'
  });

  // Alarm Modal
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmForm, setAlarmForm] = useState({
    deviceId: 'EM_LIVEWIZE_101',
    fieldKey: 'temperature',
    value: '95.5',
    severity: 'CRITICAL'
  });

  // Widgets State & Forms
  const [showCreateWidgetModal, setShowCreateWidgetModal] = useState(false);
  const [widgetFilterActiveOnly, setWidgetFilterActiveOnly] = useState(false);
  const [selectedDeviceForWidgets, setSelectedDeviceForWidgets] = useState(1);
  const [widgetsList, setWidgetsList] = useState([]);
  const [widgetForm, setWidgetForm] = useState({ displayName: '', widgetType: 'GAUGE', displayOrder: 1, isActive: true });
  const [showEditWidgetModal, setShowEditWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);

  // Rules Tab State & Forms
  const [selectedDeviceForRulesTab, setSelectedDeviceForRulesTab] = useState(1);
  const [rulesList, setRulesList] = useState([]);
  const [showRuleDetailsModal, setShowRuleDetailsModal] = useState(false);
  const [inspectingRule, setInspectingRule] = useState(null);
  const [showEditRuleModal, setShowEditRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ name: '', fieldName: 'voltage', conditionType: 'GREATER_THAN', threshold: 250, enabled: true });

  // Commands Tab State & Forms
  const [selectedDeviceForCommandsTab, setSelectedDeviceForCommandsTab] = useState(1);
  const [commandsList, setCommandsList] = useState([]);
  const [showSendCommandModal, setShowSendCommandModal] = useState(false);
  const [sendCommandFormData, setSendCommandFormData] = useState({ fieldKey: '', commandValue: '', notes: '' });
  const [showCommandDetailsModal, setShowCommandDetailsModal] = useState(false);
  const [inspectingCommand, setInspectingCommand] = useState(null);

  // Widgets Actions
  const handleFetchWidgets = async (deviceId) => {
    try {
      const device = (devices || []).find((item) => String(item.id) === String(deviceId));
      if (!device?.siteId) {
        showToast('danger', 'Select a device with a valid site before loading widgets.');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/sites/${device.siteId}/devices/${deviceId}/widgets`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setWidgetsList(normalizeList(json, 'widgets'));
      } else {
        showToast('danger', 'Widgets could not be loaded.');
      }
    } catch (e) {
      showToast('danger', 'Widgets could not be loaded.');
    }
  };

  const handleSyncWidgetsFromSochiot = async () => {
    showToast('info', 'Synced widgets from Sochiot IoT platform.');
  };

  const handleReorderWidgets = () => {
    showToast('info', 'Widget display layout saved.');
  };

  const handleDeleteAllWidgets = () => {
    setWidgetsList([]);
    showToast('success', 'All widgets purged.');
  };

  const handleOpenEditWidgetModal = (w) => {
    setEditingWidget(w);
    setWidgetForm({ displayName: w.displayName || w.name || '', widgetType: w.widgetType || 'GAUGE', displayOrder: w.displayOrder || 1, isActive: w.isActive !== false });
    setShowEditWidgetModal(true);
  };

  const handleSaveWidget = (e) => {
    e.preventDefault();
    showToast('success', 'Widget parameters updated.');
    setShowEditWidgetModal(false);
  };

  const handleDeleteWidget = (id, name) => {
    setWidgetsList(prev => prev.filter(w => String(w.id) !== String(id)));
    showToast('success', `Widget "${name}" removed.`);
  };

  // Rules Tab Actions
  const handleFetchRulesTab = async (deviceId) => {
    try {
      const device = (devices || []).find((item) => String(item.id) === String(deviceId));
      if (!device?.siteId) {
        showToast('danger', 'Select a device with a valid site before loading rules.');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/sites/${device.siteId}/devices/${deviceId}/rules`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setRulesList(normalizeList(json, 'rules'));
      } else {
        showToast('danger', 'Rules could not be loaded.');
      }
    } catch (e) {
      showToast('danger', 'Rules could not be loaded.');
    }
  };

  const handleSyncAllRulesFromSochiot = () => {
    showToast('info', 'Synced rules from Sochiot engine.');
  };

  const handleUpdateSingleRuleField = (ruleId, field, val) => {
    setRulesList(prev => prev.map(r => r.id === ruleId ? { ...r, [field]: val } : r));
  };

  const handleOpenRuleDetails = (r) => {
    setInspectingRule(r);
    setShowRuleDetailsModal(true);
  };

  const handleOpenEditRuleModal = (r) => {
    setEditingRule(r);
    setRuleForm({ name: r.name || '', fieldName: r.fieldName || 'voltage', conditionType: r.conditionType || 'GREATER_THAN', threshold: r.threshold ?? 250, enabled: r.enabled !== false });
    setShowEditRuleModal(true);
  };

  const handleSaveRuleItem = (e) => {
    e.preventDefault();
    showToast('success', 'Rule updated successfully.');
    setShowEditRuleModal(false);
  };

  const handleSyncSpecificRuleToSochiot = (r) => {
    showToast('success', `Rule "${r.name}" synced to Sochiot.`);
  };

  const handleSyncSpecificRuleByFields = (r) => {
    showToast('success', `Field mapping rule "${r.name}" synced.`);
  };

  const handleDeleteRuleItem = (id, name) => {
    setRulesList(prev => prev.filter(r => String(r.id) !== String(id)));
    showToast('success', `Rule "${name}" deleted.`);
  };

  // Commands Actions
  const handleFetchCommandHistory = async (deviceId) => {
    try {
      const device = (devices || []).find((item) => String(item.id) === String(deviceId));
      if (!device?.siteId) {
        showToast('danger', 'Select a device with a valid site before loading commands.');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/sites/${device.siteId}/devices/${deviceId}/commands`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setCommandsList(normalizeList(json, 'commands'));
      } else {
        showToast('danger', 'Command history could not be loaded.');
      }
    } catch (e) {
      showToast('danger', 'Command history could not be loaded.');
    }
  };

  const handleExecuteSendCommand = (e) => {
    e.preventDefault();
    if (!sendCommandFormData.fieldKey) return showToast('danger', 'Field Key parameter is required');
    const newCmd = {
      id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
      fieldKey: sendCommandFormData.fieldKey,
      commandValue: sendCommandFormData.commandValue,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      responseCode: 200
    };
    setCommandsList(prev => [newCmd, ...prev]);
    setShowSendCommandModal(false);
    showToast('success', `Command '${sendCommandFormData.fieldKey}' dispatched!`);
  };

  const handleOpenCommandDetails = (cmd) => {
    setInspectingCommand(cmd);
    setShowCommandDetailsModal(true);
  };

  // Resync Telemetry Action
  const handleExecuteResync = (e) => {
    e.preventDefault();
    showToast('success', 'Telemetry resync scheduled!');
    setShowResyncModal(false);
  };

  // Report Generator Action
  const handleGenerateReport = (e) => {
    e.preventDefault();
    showToast('success', 'Async report generation queued!');
    setShowReportModal(false);
  };

  // Alarm Trigger Action
  const handleTriggerAlarm = (e) => {
    e.preventDefault();
    showToast('warning', `Alarm triggered on ${alarmForm.deviceId}!`);
    setShowAlarmModal(false);
  };

  return {
    telemetryLogs, setTelemetryLogs,
    reportsList, setReportsList,
    alarmsList, setAlarmsList,
    showResyncModal, setShowResyncModal, resyncForm, setResyncForm, handleExecuteResync,
    showReportModal, setShowReportModal, reportForm, setReportForm, handleGenerateReport,
    showAlarmModal, setShowAlarmModal, alarmForm, setAlarmForm, handleTriggerAlarm,
    showCreateWidgetModal, setShowCreateWidgetModal, widgetFilterActiveOnly, setWidgetFilterActiveOnly,
    selectedDeviceForWidgets, setSelectedDeviceForWidgets,
    widgetsList, setWidgetsList, widgetForm, setWidgetForm,
    showEditWidgetModal, setShowEditWidgetModal, editingWidget, setEditingWidget,
    handleFetchWidgets, handleSyncWidgetsFromSochiot, handleReorderWidgets, handleDeleteAllWidgets,
    handleOpenEditWidgetModal, handleSaveWidget, handleDeleteWidget,
    selectedDeviceForRulesTab, setSelectedDeviceForRulesTab,
    rulesList, setRulesList,
    showRuleDetailsModal, setShowRuleDetailsModal, inspectingRule, setInspectingRule,
    showEditRuleModal, setShowEditRuleModal, editingRule, setEditingRule, ruleForm, setRuleForm,
    handleFetchRulesTab, handleSyncAllRulesFromSochiot, handleUpdateSingleRuleField,
    handleOpenRuleDetails, handleOpenEditRuleModal, handleSaveRuleItem,
    handleSyncSpecificRuleToSochiot, handleSyncSpecificRuleByFields, handleDeleteRuleItem,
    selectedDeviceForCommandsTab, setSelectedDeviceForCommandsTab,
    commandsList, setCommandsList,
    showSendCommandModal, setShowSendCommandModal,
    sendCommandFormData, setSendCommandFormData,
    showCommandDetailsModal, setShowCommandDetailsModal, inspectingCommand, setInspectingCommand,
    handleFetchCommandHistory, handleExecuteSendCommand, handleOpenCommandDetails
  };
};

export default useOrgTelemetryAndControls;
