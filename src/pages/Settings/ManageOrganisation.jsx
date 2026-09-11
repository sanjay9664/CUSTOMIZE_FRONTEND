import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import useManageOrganisation, { formatDate, getAuthHeaders, API_BASE_URL } from './OrganizationHub/hooks/useManageOrganisation';
import ManageOrganisationHeader from './OrganizationHub/components/ManageOrganisationHeader';
import ManageOrganisationModals from './OrganizationHub/components/ManageOrganisationModals';
import OrganizationSection from './OrganizationHub/sections/OrganizationSection';
import LocationSection from './OrganizationHub/sections/LocationSection';
import BuildingSection from './OrganizationHub/sections/BuildingSection';
import AssetSection from './OrganizationHub/sections/AssetSection';
import DeviceSection from './OrganizationHub/sections/DeviceSection';
import WidgetsSection from './OrganizationHub/sections/WidgetsSection';
import RulesSection from './OrganizationHub/sections/RulesSection';
import CommandsSection from './OrganizationHub/sections/CommandsSection';
import ReportSection from './OrganizationHub/sections/ReportSection';
import SiteSection from './OrganizationHub/sections/SiteSection';
import TemplatesTab from './OrganizationHub/tabs/TemplatesTab';

const ManageOrganisation = () => {
  const org = useManageOrganisation();

  return (
    <div className="manage-organisation-page p-0 m-0 w-100">
      <style>{`
        .manage-organisation-page {
          min-height: auto;
          margin: 0 !important;
          padding: 0 !important;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .dropdown-menu {
          background-color: #0f172a !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
          border-radius: 8px !important;
          padding: 6px !important;
        }

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

        .dropdown-item {
          color: #e2e8f0 !important;
          border-radius: 6px !important;
          transition: background-color 0.15s ease, color 0.15s ease !important;
        }
        .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active {
          background-color: #1e293b !important;
          color: #38bdf8 !important;
        }

        body.light-mode .manage-organisation-page {
          background-color: var(--scada-bg, #f1f5f9) !important;
          color: #0f172a !important;
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
        body.light-mode .manage-organisation-page .table-custom th {
          background-color: #f1f5f9 !important;
          color: #0369a1 !important;
        }
        body.light-mode .manage-organisation-page .table-custom td {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }

        body:not(.light-mode) .manage-organisation-page {
          background-color: #090d16 !important;
          color: #f8fafc !important;
        }
        body:not(.light-mode) .manage-organisation-page .bg-dark-card {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f8fafc !important;
        }
        body:not(.light-mode) .manage-organisation-page .table-custom th {
          background-color: #1e293b !important;
          color: #38bdf8 !important;
        }
        body:not(.light-mode) .manage-organisation-page .table-custom td {
          background-color: #0f172a !important;
          color: #f8fafc !important;
        }

        .config-option-card {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.1) !important;
          transition: all 0.25s ease-in-out !important;
          cursor: pointer !important;
        }
        .config-option-card:hover {
          transform: translateY(-4px) !important;
          border-color: rgba(56, 189, 248, 0.6) !important;
          background: rgba(30, 41, 59, 0.8) !important;
          box-shadow: 0 10px 25px rgba(56, 189, 248, 0.15) !important;
        }
        .dashed-icon-box {
          width: 90px !important;
          height: 90px !important;
          border-radius: 16px !important;
          border: 2px dashed rgba(255, 255, 255, 0.25) !important;
          background: rgba(255, 255, 255, 0.02) !important;
          color: #94a3b8 !important;
          transition: all 0.25s ease-in-out !important;
          margin: 0 auto !important;
        }
        .config-option-card:hover .dashed-icon-box {
          border-color: #38bdf8 !important;
          background: rgba(56, 189, 248, 0.1) !important;
          color: #38bdf8 !important;
        }

        body.light-mode .config-option-card {
          background: #ffffff !important;
          border: 1.5px solid #e2e8f0 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
        }
        body.light-mode .config-option-card:hover {
          background: #f8fafc !important;
          border-color: #0284c7 !important;
          box-shadow: 0 8px 20px rgba(2, 132, 199, 0.12) !important;
        }
        body.light-mode .config-option-card .card-title-text {
          color: #0f172a !important;
        }
        body.light-mode .config-option-card .card-subtitle-text {
          color: #64748b !important;
        }
        body.light-mode .config-option-card .dashed-icon-box {
          border-color: #cbd5e1 !important;
          background: #f1f5f9 !important;
          color: #64748b !important;
        }
        body.light-mode .config-option-card:hover .dashed-icon-box {
          border-color: #0284c7 !important;
          background: rgba(2, 132, 199, 0.08) !important;
          color: #0284c7 !important;
        }
        body.light-mode .footer-note-text {
          color: #64748b !important;
        }
      `}</style>

      {/* Header & Sub-Nav Component */}
      {org.activeTab !== 'templates' && <ManageOrganisationHeader org={org} />}

      {/* Floating Toast Notification */}
      {org.message && (
        <div className="position-fixed" style={{ zIndex: 9999, top: '1.2rem', right: '1.2rem' }}>
          <div className="px-3 py-2.5 rounded-3 bg-dark text-white shadow-lg border border-info border-opacity-40 d-flex align-items-center gap-2">
            {org.message.type === 'success' ? <CheckCircle size={18} className="text-success" /> : <AlertTriangle size={18} className="text-danger" />}
            <span className="fs-13">{org.message.text}</span>
            <button onClick={() => org.setMessage(null)} className="btn-close btn-close-white ms-2" size="sm" />
          </div>
        </div>
      )}

      {/* TAB CONTENT TABLES */}
      <Card className="bg-dark-card border-0 shadow-sm" style={{ overflow: 'visible' }}>
        {(org.activeTab === 'company' || org.activeTab === 'tenant') && (
          <OrganizationSection
            activeTab={org.activeTab}
            filteredCompanies={org.filteredCompanies}
            formatDate={formatDate}
            handleViewCompanyTenants={org.handleViewCompanyTenants}
            handleOpenEditCompany={org.handleOpenEditCompany}
            handleDeleteCompany={org.handleDeleteCompany}
            filteredTenants={org.filteredTenants}
            companies={org.companies}
            handleOpenFeaturesModal={org.handleOpenFeaturesModal}
            handleOpenSubModal={org.handleOpenSubModal}
            handleOpenEditTenant={org.handleOpenEditTenant}
            handleReactivateTenant={org.handleReactivateTenant}
            handleDeleteTenant={org.handleDeleteTenant}
          />
        )}

        {(org.activeTab === 'zone' || org.activeTab === 'area') && (
          <LocationSection
            activeTab={org.activeTab}
            filteredZones={org.filteredZones}
            tenants={org.activeTenants || org.filteredTenants}
            handleOpenEditZone={org.handleOpenEditZone}
            handleReactivateZone={org.handleReactivateZone}
            handleDeleteZone={org.handleDeleteZone}
            filteredAreas={org.filteredAreas}
            zones={org.activeZones || org.filteredZones}
            handleOpenEditArea={org.handleOpenEditArea}
            handleDeleteArea={org.handleDeleteArea}
          />
        )}

        {/* Building Section - Commented out: building is now managed as an asset */}
        {/* {org.activeTab === 'building' && (
          <BuildingSection
            selectedBuildingSiteId={org.selectedBuildingSiteId}
            setSelectedBuildingSiteId={org.setSelectedBuildingSiteId}
            activeSites={org.activeSites}
            filteredBuildings={org.filteredBuildings}
            handleOpenCreateBuilding={org.handleOpenCreateBuilding}
            sites={org.sites}
            handleOpenEditBuilding={org.handleOpenEditBuilding}
            handleDeleteBuilding={org.handleDeleteBuilding}
          />
        )} */}


        {org.activeTab === 'device' && (
          <DeviceSection
            searchTerm={org.searchTerm}
            setSearchTerm={org.setSearchTerm}
            selectedSiteFilter={org.selectedSiteFilter}
            setSelectedSiteFilter={org.setSelectedSiteFilter}
            activeSites={org.activeSites}
            selectedBuildingFilter={org.selectedBuildingFilter}
            setSelectedBuildingFilter={org.setSelectedBuildingFilter}
            selectedAreaFilter={org.selectedAreaFilter}
            setSelectedAreaFilter={org.setSelectedAreaFilter}
            activeBuildings={org.activeBuildings}
            activeAreas={org.activeAreas}
            activeAssets={org.activeAssets}
            selectedAssetFilter={org.selectedAssetFilter}
            setSelectedAssetFilter={org.setSelectedAssetFilter}
            selectedAssetTypeFilter={org.selectedAssetTypeFilter}
            setSelectedAssetTypeFilter={org.setSelectedAssetTypeFilter}
            filteredDevices={org.filteredDevices}
            handleOpenRecentEvents={org.handleOpenRecentEvents}
            handleGlobalResyncEventStats={org.handleGlobalResyncEventStats}
            showConfigDevicesModal={org.showConfigDevicesModal}
            setShowConfigDevicesModal={org.setShowConfigDevicesModal}
            handleTabSelect={org.handleTabSelect}
            showToast={org.showToast}
            setRegisterStep={org.setRegisterStep}
            setRegisterForm={org.setRegisterForm}
            setShowRegisterDeviceModal={org.setShowRegisterDeviceModal}
            handleOpenRegisterDevice={org.handleOpenRegisterDevice}
            setEditingDeviceItem={org.setEditingDeviceItem}
            handleOpenEditDevice={org.handleOpenEditDevice}
            handleOpenLiveModal={org.handleOpenLiveModal}
            handleOpenSettingsModal={org.handleOpenSettingsModal}
            handleOpenThresholdsModal={org.handleOpenThresholdsModal}
            handleOpenRulesModal={org.handleOpenRulesModal}
            handleOpenAuditLog={org.handleOpenAuditLog}
            setSelectedDeviceForAudit={org.setSelectedDeviceForAudit}
            setSelectedDeviceForCommandsTab={org.setSelectedDeviceForCommandsTab}
            setShowSendCommandModal={org.setShowSendCommandModal}
            handleDeleteDevice={org.handleDeleteDevice}
            fetchDevices={org.fetchDevices}
          />
        )}

        {org.activeTab === 'templates' && (
          <TemplatesTab
            handleGlobalResyncEventStats={org.handleGlobalResyncEventStats}
            showConfigDevicesModal={org.showConfigDevicesModal}
            setShowConfigDevicesModal={org.setShowConfigDevicesModal}
            handleTabSelect={org.handleTabSelect}
            showToast={org.showToast}
          />
        )}

        {org.activeTab === 'widgets' && (
          <WidgetsSection
            searchTerm={org.searchTerm}
            setSearchTerm={org.setSearchTerm}
            selectedDeviceForWidgets={org.selectedDeviceForWidgets}
            setSelectedDeviceForWidgets={org.setSelectedDeviceForWidgets}
            activeDevices={org.activeDevices}
            widgetFilterActiveOnly={org.widgetFilterActiveOnly}
            setWidgetFilterActiveOnly={org.setWidgetFilterActiveOnly}
            setShowCreateWidgetModal={org.setShowCreateWidgetModal}
            filteredWidgets={org.filteredWidgets}
            handleToggleWidget={org.handleToggleWidget}
            handleOpenEditWidget={org.handleOpenEditWidget}
            handleDeleteWidget={org.handleDeleteWidget}
          />
        )}

        {org.activeTab === 'rules' && (
          <RulesSection
            searchTerm={org.searchTerm}
            setSearchTerm={org.setSearchTerm}
            selectedDeviceForRulesTab={org.selectedDeviceForRulesTab}
            setSelectedDeviceForRulesTab={org.setSelectedDeviceForRulesTab}
            activeDevices={org.activeDevices}
            setShowRulesModal={org.setShowRulesModal}
            filteredRules={org.filteredRules}
            handleToggleRule={org.handleToggleRule}
            handleInspectRule={org.handleInspectRule}
            handleOpenEditRule={org.handleOpenEditRule}
            handleDeleteRule={org.handleDeleteRule}
          />
        )}

        {org.activeTab === 'commands' && (
          <CommandsSection
            selectedDeviceForCommandsTab={org.selectedDeviceForCommandsTab}
            setSelectedDeviceForCommandsTab={org.setSelectedDeviceForCommandsTab}
            activeDevices={org.activeDevices}
            setShowSendCommandModal={org.setShowSendCommandModal}
            filteredCommands={org.filteredCommands}
            formatDate={formatDate}
            handleInspectCommand={org.handleInspectCommand}
          />
        )}

        {(org.activeTab === 'telemetry' || org.activeTab === 'report' || org.activeTab === 'alarm') && (
          <ReportSection
            activeTab={org.activeTab}
            telemetryLogs={org.telemetryLogs}
            formatDate={formatDate}
            setShowResyncModal={org.setShowResyncModal}
            activeDevices={org.activeDevices}
            assets={org.assets}
            sites={org.activeSites || []}
            companies={org.activeCompanies || []}
            tenants={org.activeTenants || []}
            zones={org.activeZones || []}
            areas={org.activeAreas || []}
            setShowReportModal={org.setShowReportModal}
            reportsList={org.reportsList}
            setShowAlarmModal={org.setShowAlarmModal}
            alarmsList={org.alarmsList}
          />
        )}
      </Card>

      {org.activeTab === 'site' && <SiteSection />}
      {org.activeTab === 'asset' && <AssetSection />}

      {/* Modals Group Component */}
      <ManageOrganisationModals org={org} />
    </div>
  );
};

export default ManageOrganisation;
