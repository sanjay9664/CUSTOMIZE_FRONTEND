import React from 'react';
import CompanyModal from '../modals/CompanyModal';
import OrganizationModal from '../modals/OrganizationModal';
import ZoneModal from '../modals/ZoneModal';
import AreaModal from '../modals/AreaModal';
import BuildingModal from '../modals/BuildingModal';
import FeaturesModal from '../modals/FeaturesModal';
import SubscriptionModal from '../modals/SubscriptionModal';
import CompanyTenantsModal from '../modals/CompanyTenantsModal';
import AssetModal from '../modals/AssetModal';
import RegisterDeviceModal from '../modals/RegisterDeviceModal';
import DeviceModalsGroup from '../modals/DeviceModalsGroup';
import WidgetRuleCommandModalsGroup from '../modals/WidgetRuleCommandModalsGroup';
import { formatDate, getAuthHeaders, API_BASE_URL } from '../hooks/useManageOrganisation';

const ManageOrganisationModals = ({ org }) => {
  return (
    <>
      {/* CompanyModal expects: show, onHide, editingCompany, companyForm, setCompanyForm, onSubmit, loading */}
      <CompanyModal
        show={org.showCompanyModal}
        onHide={() => org.setShowCompanyModal(false)}
        editingCompany={org.editingCompany}
        companyForm={org.companyForm}
        setCompanyForm={org.setCompanyForm}
        onSubmit={org.handleSaveCompany}
        loading={org.loading}
      />

      {/* OrganizationModal expects: show, onHide, editingTenant, tenantForm, setTenantForm, companies, onSubmit, loading */}
      <OrganizationModal
        show={org.showTenantModal}
        onHide={() => org.setShowTenantModal(false)}
        editingTenant={org.editingTenant}
        tenantForm={org.tenantForm}
        setTenantForm={org.setTenantForm}
        companies={org.activeCompanies || []}
        onSubmit={org.handleSaveTenant}
        loading={org.loading}
      />

      {/* ZoneModal expects: show, onHide, editingZone, zoneForm, setZoneForm, tenants, onSubmit, loading */}
      <ZoneModal
        show={org.showZoneModal}
        onHide={() => org.setShowZoneModal(false)}
        editingZone={org.editingZone}
        zoneForm={org.zoneForm}
        setZoneForm={org.setZoneForm}
        tenants={org.activeTenants || []}
        onSubmit={org.handleSaveZone}
        loading={org.loading}
      />

      {/* AreaModal expects: show, onHide, editingArea, areaForm, setAreaForm, tenants, zones, onSubmit, loading */}
      <AreaModal
        show={org.showAreaModal}
        onHide={() => org.setShowAreaModal(false)}
        editingArea={org.editingArea}
        areaForm={org.areaForm}
        setAreaForm={org.setAreaForm}
        tenants={org.activeTenants || []}
        zones={org.activeZones || []}
        onSubmit={org.handleSaveArea}
        loading={org.loading}
      />

      {/* BuildingModal expects: show, onHide, editingBuilding, buildingForm, setBuildingForm, sites, onSubmit, loading */}
      <BuildingModal
        show={org.showBuildingModal}
        onHide={() => org.setShowBuildingModal(false)}
        editingBuilding={org.editingBuilding}
        buildingForm={org.buildingForm}
        setBuildingForm={org.setBuildingForm}
        sites={org.activeSites || []}
        onSubmit={org.handleSaveBuilding}
        loading={org.loading}
      />

      {/* FeaturesModal expects: show, onHide, selectedTenant, featuresForm, setFeaturesForm, onSubmit */}
      <FeaturesModal
        show={org.showFeaturesModal}
        onHide={() => org.setShowFeaturesModal(false)}
        selectedTenant={org.selectedTenantForFeatures}
        featuresForm={org.featuresForm}
        setFeaturesForm={org.setFeaturesForm}
        onSubmit={org.handleSaveFeatures}
      />

      {/* SubscriptionModal expects: show, onHide, selectedTenant, subForm, setSubForm, onSubmit */}
      <SubscriptionModal
        show={org.showSubModal}
        onHide={() => org.setShowSubModal(false)}
        selectedTenant={org.selectedTenantForSub}
        subForm={org.subForm}
        setSubForm={org.setSubForm}
        onSubmit={org.handleSaveSub}
      />

      {/* CompanyTenantsModal expects: show, onHide, selectedCompanyForTenants, companyTenantsList */}
      <CompanyTenantsModal
        show={org.showCompanyTenantsModal}
        onHide={() => org.setShowCompanyTenantsModal(false)}
        selectedCompanyForTenants={org.selectedCompanyForTenants}
        companyTenantsList={org.companyTenantsList}
        formatDate={formatDate}
      />

      {/* AssetModal expects: show, onHide, editingAsset, assetForm, setAssetForm, handleSaveAsset, activeSites, assets, loading */}
      <AssetModal
        show={org.showAssetModal}
        onHide={() => org.setShowAssetModal(false)}
        editingAsset={org.editingAsset}
        assetForm={org.assetForm}
        setAssetForm={org.setAssetForm}
        handleSaveAsset={org.handleSaveAsset}
        activeSites={org.activeSites || []}
        assets={org.activeAssets || []}
        loading={org.loading}
      />

      <RegisterDeviceModal
        show={org.showRegisterDeviceModal}
        onHide={() => org.setShowRegisterDeviceModal(false)}
        registerStep={org.registerStep}
        setRegisterStep={org.setRegisterStep}
        registerForm={org.registerForm}
        setRegisterForm={org.setRegisterForm}
        sites={org.activeSites || []}
        activeBuildings={org.activeBuildings || []}
        activeAreas={org.activeAreas || []}
        dynamicTemplateFields={org.dynamicTemplateFields}
        setDynamicTemplateFields={org.setDynamicTemplateFields}
        fetchDevices={org.fetchDevices}
        setDevices={org.setDevices}
        loading={org.loading}
        setLoading={org.setLoading}
        setSelectedBuildingFilter={org.setSelectedBuildingFilter}
        setSelectedAreaFilter={org.setSelectedAreaFilter}
        setSearchTerm={org.setSearchTerm}
        showToast={org.showToast}
        getAuthHeaders={getAuthHeaders}
        API_BASE_URL={API_BASE_URL}
      />

      {/* DeviceModalsGroup uses same prop names - pass directly */}
      <DeviceModalsGroup
        showEditDeviceModal={org.showEditDeviceModal}
        setShowEditDeviceModal={org.setShowEditDeviceModal}
        editingDeviceItem={org.editingDeviceItem}
        editDeviceForm={org.editDeviceForm}
        setEditDeviceForm={org.setEditDeviceForm}
        handleSaveEditDevice={org.handleSaveEditDevice}
        showLiveModal={org.showLiveModal}
        setShowLiveModal={org.setShowLiveModal}
        selectedDeviceForLive={org.selectedDeviceForLive}
        liveLoading={org.liveLoading}
        liveData={org.liveData}
        showThresholdsModal={org.showThresholdsModal}
        setShowThresholdsModal={org.setShowThresholdsModal}
        selectedDeviceForThresholds={org.selectedDeviceForThresholds}
        thresholdsForm={org.thresholdsForm}
        setThresholdsForm={org.setThresholdsForm}
        handleSaveThresholds={org.handleSaveThresholds}
        showSettingsModal={org.showSettingsModal}
        setShowSettingsModal={org.setShowSettingsModal}
        selectedDeviceForSettings={org.selectedDeviceForSettings}
        deviceSettingsForm={org.deviceSettingsForm}
        setDeviceSettingsForm={org.setDeviceSettingsForm}
        handleSaveSettings={org.handleSaveSettings}
        showRulesModal={org.showRulesModal}
        setShowRulesModal={org.setShowRulesModal}
        selectedDeviceForRules={org.selectedDeviceForRules}
        deviceRulesForm={org.ruleForm}
        setDeviceRulesForm={org.setRuleForm}
        handleSaveRules={org.handleSaveRules}
        showAuditLogModal={org.showAuditLogModal}
        setShowAuditLogModal={org.setShowAuditLogModal}
        selectedDeviceForAudit={org.selectedDeviceForAudit}
        auditLogList={org.auditLogList || []}
        formatDate={formatDate}
        showRecentEventsModal={org.showRecentEventsModal}
        setShowRecentEventsModal={org.setShowRecentEventsModal}
        recentEventsList={org.recentEventsList || []}
        loading={org.loading}
      />

      {/* WidgetRuleCommandModalsGroup uses same prop names - pass directly */}
      <WidgetRuleCommandModalsGroup
        showEditWidgetModal={org.showEditWidgetModal}
        setShowEditWidgetModal={org.setShowEditWidgetModal}
        editingWidget={org.editingWidget}
        widgetForm={org.widgetForm}
        setWidgetForm={org.setWidgetForm}
        handleSaveWidget={org.handleSaveWidget}
        showRuleDetailsModal={org.showRuleDetailsModal}
        setShowRuleDetailsModal={org.setShowRuleDetailsModal}
        inspectingRule={org.inspectingRule}
        showEditRuleModal={org.showEditRuleModal}
        setShowEditRuleModal={org.setShowEditRuleModal}
        editingRule={org.editingRule}
        ruleForm={org.ruleForm}
        setRuleForm={org.setRuleForm}
        handleSaveRuleItem={org.handleSaveRuleItem}
        showSendCommandModal={org.showSendCommandModal}
        setShowSendCommandModal={org.setShowSendCommandModal}
        selectedDeviceForCommandsTab={org.selectedDeviceForCommandsTab}
        activeDevices={org.activeDevices || []}
        devices={org.devices || []}
        sendCommandFormData={org.sendCommandFormData}
        setSendCommandFormData={org.setSendCommandFormData}
        handleExecuteSendCommand={org.handleExecuteSendCommand}
        showCommandDetailsModal={org.showCommandDetailsModal}
        setShowCommandDetailsModal={org.setShowCommandDetailsModal}
        inspectingCommand={org.inspectingCommand}
        showResyncModal={org.showResyncModal}
        setShowResyncModal={org.setShowResyncModal}
        resyncForm={org.resyncForm}
        setResyncForm={org.setResyncForm}
        activeSites={org.activeSites || []}
        sites={org.sites || []}
        handleExecuteResync={org.handleExecuteResync}
        showReportModal={org.showReportModal}
        setShowReportModal={org.setShowReportModal}
        reportForm={org.reportForm}
        setReportForm={org.setReportForm}
        handleGenerateReport={org.handleGenerateReport}
        showAlarmModal={org.showAlarmModal}
        setShowAlarmModal={org.setShowAlarmModal}
        alarmForm={org.alarmForm}
        setAlarmForm={org.setAlarmForm}
        handleTriggerAlarm={org.handleTriggerAlarm}
        loading={org.loading}
      />
    </>
  );
};

export default ManageOrganisationModals;
