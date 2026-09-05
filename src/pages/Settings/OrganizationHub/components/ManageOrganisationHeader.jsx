import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Nav } from 'react-bootstrap';
import {
  Building2, Building, MapPin, Globe, Shield, Plus, Search,
  RefreshCw, Layers, Settings, ArrowLeft, Cpu,
  Radio, FileText, BellRing, Sparkles, Users, Grid, Sliders, Zap, ChevronRight
} from 'lucide-react';

const ManageOrganisationHeader = ({ org = {} }) => {
  const HeaderIcon = org.PageIcon || Building2;
  const safeCompanies = Array.isArray(org.activeCompanies) ? org.activeCompanies : [];
  const safeTenants = Array.isArray(org.activeTenants) ? org.activeTenants : [];
  const safeZones = Array.isArray(org.activeZones) ? org.activeZones : [];
  const safeAreas = Array.isArray(org.activeAreas) ? org.activeAreas : [];
  const safeDevices = Array.isArray(org.activeDevices) ? org.activeDevices : [];
  const safeSites = Array.isArray(org.activeSites) ? org.activeSites : [];
  const safeAssets = Array.isArray(org.activeAssets) ? org.activeAssets : [];
  const safeBuildings = Array.isArray(org.activeBuildings) ? org.activeBuildings : [];

  const isExtraTabActive = ['widgets', 'rules', 'commands', 'telemetry', 'report', 'alarm', 'building'].includes(org.activeTab);
  const [showExtraTabs, setShowExtraTabs] = useState(() => {
    const saved = localStorage.getItem('bms_show_extra_tabs');
    if (saved !== null) return saved === 'true';
    return isExtraTabActive;
  });

  useEffect(() => {
    if (isExtraTabActive && !showExtraTabs) {
      setShowExtraTabs(true);
    }
  }, [isExtraTabActive]);

  const handleToggleExtra = (e) => {
    const val = e.target.checked;
    setShowExtraTabs(val);
    localStorage.setItem('bms_show_extra_tabs', String(val));
  };

  return (
    <>
      {/* Sub-Header Tabs Row */}
      <div className="px-4 py-2-5 mb-4 rounded-3 border border-secondary border-opacity-25 shadow-lg overflow-auto" style={{ margin: '-1.5rem -1.5rem 1.5rem -1.5rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 w-100">
          <Nav variant="pills" activeKey={org.activeTab} className="flex-nowrap gap-1.5 align-items-center">
            <Nav.Item>
              <Nav.Link onClick={() => org.navigate && org.navigate('/settings')} className="d-flex align-items-center gap-1.5 fw-semibold px-3 py-2 rounded-2 text-slate-300 border border-transparent hover:border-info hover:border-opacity-30" style={{ fontSize: '0.83rem' }}>
                <Sparkles size={15} className="text-info" /> Settings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link onClick={() => org.navigate && org.navigate('/settings')} className="d-flex align-items-center gap-1.5 fw-semibold px-3 py-2 rounded-2 text-slate-300 border border-transparent hover:border-info hover:border-opacity-30" style={{ fontSize: '0.83rem' }}>
                <Settings size={15} className="text-slate-400" /> Global
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link onClick={() => org.navigate && org.navigate('/settings/users')} className="d-flex align-items-center gap-1.5 fw-semibold px-3 py-2 rounded-2 text-slate-300 border border-transparent hover:border-info hover:border-opacity-30" style={{ fontSize: '0.83rem' }}>
                <Users size={15} className="text-slate-400" /> Users
              </Nav.Link>
            </Nav.Item>

            <div className="vr bg-secondary opacity-30 mx-1" style={{ height: '24px' }} />

            {/* Hierarchy Sequence: Company => Organization => Zone => Area => Site => Asset => Device */}
            <Nav.Item>
              <Nav.Link
                onClick={() => org.handleTabSelect && org.handleTabSelect('company')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.activeTab === 'company' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Building size={15} /> Company
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => org.handleTabSelect && org.handleTabSelect('tenant')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.activeTab === 'tenant' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Building2 size={15} /> Organization
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => org.handleTabSelect && org.handleTabSelect('zone')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.activeTab === 'zone' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Globe size={15} /> Zone
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => org.handleTabSelect && org.handleTabSelect('area')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.activeTab === 'area' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Layers size={15} /> Area
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => org.handleTabSelect && org.handleTabSelect('site')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.activeTab === 'site' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <MapPin size={15} /> Site
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => org.handleTabSelect && org.handleTabSelect('asset')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.activeTab === 'asset' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Sliders size={15} /> Asset
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => org.handleTabSelect && org.handleTabSelect('device')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.activeTab === 'device' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Cpu size={15} /> Device
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Right Side Toggle Controls & Extra Tabs (Widgets, Rules, Commands, Report, Building) */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            {showExtraTabs && (
              <Nav variant="pills" activeKey={org.activeTab} className="flex-nowrap gap-1.5 align-items-center">
                <Nav.Item>
                  <Nav.Link onClick={() => org.handleTabSelect && org.handleTabSelect('widgets')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.isWidgetGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <Grid size={15} /> Widgets
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link onClick={() => org.handleTabSelect && org.handleTabSelect('rules')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.isRuleGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <Shield size={15} /> Rules
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link onClick={() => org.handleTabSelect && org.handleTabSelect('commands')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.isCommandGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <Zap size={15} /> Commands
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link onClick={() => org.handleTabSelect && org.handleTabSelect(org.isReportGroup ? org.activeTab : 'telemetry')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.isReportGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <FileText size={15} /> Report
                  </Nav.Link>
                </Nav.Item>
                {/* <Nav.Item>
                  <Nav.Link onClick={() => org.handleTabSelect && org.handleTabSelect('building')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${org.isBuildingGroup ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <Building2 size={15} /> Building
                  </Nav.Link>
                </Nav.Item> */}
              </Nav>
            )}

            <div className="d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-2 bg-dark bg-opacity-60 border border-info border-opacity-30 shadow-sm ms-2">
              <Form.Check
                type="switch"
                id="extra-modules-toggle"
                checked={showExtraTabs}
                onChange={handleToggleExtra}
                className="m-0 cursor-pointer"
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="extra-modules-toggle" className="form-check-label fw-semibold text-info mb-0 text-nowrap cursor-pointer" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                Extra Tabs
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary border-opacity-25 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => org.navigate && org.navigate('/settings')} className="d-flex align-items-center gap-2 rounded-3 px-3 py-1-5 fw-semibold">
            <ArrowLeft size={16} /> Back to Settings
          </Button>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <HeaderIcon className="text-info" size={28} />
              <h2 className="fw-bold mb-0 org-header-title tracking-wide">{org.pageTitle || 'Organisation Management'}</h2>
            </div>
            <p className="org-header-subtext mb-0 fs-14">{org.pageSubtitle || 'System Configuration & Parameters'}</p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" size="sm" onClick={org.fetchAllData} className="d-flex align-items-center gap-2 rounded-3 text-slate-300">
            <RefreshCw size={15} className={org.loading ? 'spin-icon' : ''} /> Refresh
          </Button>

          {org.activeTab === 'company' && (
            <Button variant="info" size="sm" onClick={org.handleOpenCreateCompany} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Company
            </Button>
          )}
          {org.activeTab === 'tenant' && (
            <Button variant="info" size="sm" onClick={org.handleOpenCreateTenant} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Organization
            </Button>
          )}
          {org.activeTab === 'zone' && (
            <Button variant="info" size="sm" onClick={org.handleOpenCreateZone} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Geographic Zone
            </Button>
          )}
          {org.activeTab === 'area' && (
            <Button variant="info" size="sm" onClick={org.handleOpenCreateArea} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Tenant Area
            </Button>
          )}
          {/* {org.activeTab === 'building' && (
            <Button variant="info" size="sm" onClick={org.handleOpenCreateBuilding} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Building
            </Button>
          )} */}
          {org.activeTab === 'asset' && (
            <Button variant="info" size="sm" onClick={org.handleOpenCreateAsset} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <Plus size={16} /> Add Asset
            </Button>
          )}
          {org.activeTab === 'telemetry' && (
            <Button variant="success" size="sm" onClick={() => org.setShowResyncModal && org.setShowResyncModal(true)} className="fw-semibold d-flex align-items-center gap-2 text-white px-3 rounded-3">
              <Radio size={16} /> Resync Telemetry Data
            </Button>
          )}
          {org.activeTab === 'report' && (
            <Button variant="info" size="sm" onClick={() => org.setShowReportModal && org.setShowReportModal(true)} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <FileText size={16} /> Generate Async Report
            </Button>
          )}
          {org.activeTab === 'alarm' && (
            <Button variant="warning" size="sm" onClick={() => org.setShowAlarmModal && org.setShowAlarmModal(true)} className="fw-semibold d-flex align-items-center gap-2 text-dark px-3 rounded-3">
              <BellRing size={16} /> Trigger Alarm Event
            </Button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <Nav variant="pills" activeKey={org.activeTab} onSelect={org.handleTabSelect} className="org-nav-tabs mb-4 bg-dark-card p-2 gap-1 flex-wrap">
        {org.isOrgGroup && (
          <>
            <Nav.Item><Nav.Link eventKey="company"><Building size={18} /> Companies ({safeCompanies.length})</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="tenant"><Building2 size={18} /> Organizations ({safeTenants.length})</Nav.Link></Nav.Item>
          </>
        )}
        {org.isLocationGroup && (
          <>
            <Nav.Item><Nav.Link eventKey="zone"><Globe size={18} /> Zones ({safeZones.length})</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="area"><Layers size={18} /> Areas ({safeAreas.length})</Nav.Link></Nav.Item>
          </>
        )}
        {org.isDeviceGroup && <Nav.Item><Nav.Link eventKey="device"><Cpu size={18} /> Devices ({safeDevices.length})</Nav.Link></Nav.Item>}
        {org.isSiteGroup && <Nav.Item><Nav.Link eventKey="site"><MapPin size={18} /> Site ({safeSites.length})</Nav.Link></Nav.Item>}
        {org.isAssetGroup && <Nav.Item><Nav.Link eventKey="asset"><Sliders size={18} /> Assets ({safeAssets.length})</Nav.Link></Nav.Item>}
        {/* {org.isBuildingGroup && <Nav.Item><Nav.Link eventKey="building"><Building2 size={18} /> Buildings ({safeBuildings.length})</Nav.Link></Nav.Item>} */}
        {org.isReportGroup && (
          <>
            <Nav.Item><Nav.Link eventKey="telemetry"><Radio size={18} /> Telemetry</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="report"><FileText size={18} /> Reports</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="alarm"><BellRing size={18} /> Alarms</Nav.Link></Nav.Item>
          </>
        )}
      </Nav>

      {/* Search Bar & Filter Controls */}
      {org.activeTab !== 'site' && org.activeTab !== 'device' && (
        <Card className="bg-dark-card border-0 mb-4 p-3 shadow-sm">
          <Row className="g-3 align-items-center">
            <Col xs={12} md={org.activeTab === 'zone' || org.activeTab === 'area' ? 5 : 6}>
              <InputGroup>
                <InputGroup.Text className="bg-transparent border-secondary border-opacity-25 text-slate-400">
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder={`Search ${org.activeTab || 'item'}s...`}
                  value={org.searchTerm || ''}
                  onChange={(e) => org.setSearchTerm && org.setSearchTerm(e.target.value)}
                  className="bg-transparent border-secondary border-opacity-25 text-white"
                />
              </InputGroup>
            </Col>
            {(org.activeTab === 'zone' || org.activeTab === 'area') && (
              <Col xs={12} md={3}>
                <Form.Select
                  value={org.selectedTenantFilter || 'ALL'}
                  onChange={(e) => org.setSelectedTenantFilter && org.setSelectedTenantFilter(e.target.value)}
                  className="bg-dark text-white border-secondary border-opacity-25"
                >
                  <option value="ALL">All Organizations</option>
                  {safeTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Form.Select>
              </Col>
            )}
            {org.activeTab === 'area' && (
              <Col xs={12} md={3}>
                <Form.Select
                  value={org.selectedZoneFilter || 'ALL'}
                  onChange={(e) => org.setSelectedZoneFilter && org.setSelectedZoneFilter(e.target.value)}
                  className="bg-dark text-white border-secondary border-opacity-25"
                >
                  <option value="ALL">All Zones</option>
                  {safeZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </Form.Select>
              </Col>
            )}
          </Row>
        </Card>
      )}
    </>
  );
};

export default ManageOrganisationHeader;
