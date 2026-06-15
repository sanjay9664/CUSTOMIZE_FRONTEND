import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Spinner } from 'react-bootstrap';
import { FiPlus, FiMail, FiBell, FiCheckCircle, FiXCircle, FiInbox, FiEdit2, FiTrash2, FiX, FiChevronRight, FiZap, FiAlertCircle, FiMessageSquare } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import RuleEditModal from './RuleEditModal';
import { 
  loginToSochiot, 
  getSochiotUserMe, 
  getSochiotZoneData, 
  getSochiotLocationData,
  getSochiotRules,
  getSochiotRuleById,
  updateSochiotRule
} from '../../services/authService';

const AlarmConfig = () => {
  const { isDark } = useTheme();
  
  // Hierarchy Data States
  const [hierarchyData, setHierarchyData] = useState([]);
  const [globalLocation, setGlobalLocation] = useState({
    organization: '', client: '', zone: '', subZone: '', building: '', gateway: ''
  });
  
  const [locationIdMap, setLocationIdMap] = useState({});
  const [zoneIdMap, setZoneIdMap] = useState({});
  const [locationDetails, setLocationDetails] = useState({});
  const [dynamicOptions, setDynamicOptions] = useState({
    fields: [], modules: [], devices: [], locations: []
  });

  // Rule Engine States
  const [rules, setRules] = useState([]);
  const [totalRules, setTotalRules] = useState(0);
  const [emailGroups, setEmailGroups] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Rule Detail Panel States
  const [selectedRule, setSelectedRule] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Initialize Data
  useEffect(() => {
    const initDynamicData = async () => {
      try {
        let userData = await getSochiotUserMe();
        if (!userData) {
          await loginToSochiot("sa@ismartaccess.com", "I0t3ch");
          userData = await getSochiotUserMe();
        }

        if (userData) {
          const companies = [];
          const clients = [];
          const zones = [];
          const locations = [];
          const lMap = {};
          const zMap = {};

          if (userData.userZoneLocationVO?.companyList) {
            const rawData = userData.userZoneLocationVO.companyList;
            const normalize = (list) => {
              return (list || []).map(org => ({
                name: org.name,
                id: org.id,
                clients: (org.consumers || org.customerVOS || org.clients || []).map(client => ({
                  name: client.name,
                  id: client.id,
                  zones: (client.zoneVOS || client.zones || []).map(zone => ({
                    name: zone.name,
                    id: zone.id,
                    subZones: (zone.subZoneVOS || zone.subZoneVos || zone.subZones || []).map(sz => ({
                      name: sz.name,
                      id: sz.id,
                      locations: (sz.locationVOS || sz.locationVos || sz.locations || []).map(loc => ({
                        name: loc.name,
                        id: loc.id,
                        type: loc.locationType
                      }))
                    })),
                    locations: (zone.locationVOS || zone.locationVos || zone.locations || []).map(loc => ({
                      name: loc.name,
                      id: loc.id,
                      type: loc.locationType
                    }))
                  }))
                }))
              }));
            };

            const normalized = normalize(rawData);
            setHierarchyData(normalized);

            normalized.forEach(comp => {
              companies.push(comp.name);
              (comp.clients || []).forEach(client => {
                clients.push(client.name);
                (client.zones || []).forEach(zone => {
                  const traverse = (z) => {
                    zones.push(z.name);
                    zMap[z.name] = z.id;
                    (z.locations || []).forEach(l => {
                      locations.push(l.name);
                      lMap[l.name] = l.id;
                    });
                    (z.subZones || []).forEach(traverse);
                  };
                  traverse(zone);
                });
              });
            });
          }

          setLocationIdMap(lMap);
          setZoneIdMap(zMap);
          setDynamicOptions({
            fields: companies.length > 0 ? [...new Set(companies)] : [],
            modules: clients.length > 0 ? [...new Set(clients)] : [],
            devices: zones.length > 0 ? [...new Set(zones)] : [],
            locations: locations.length > 0 ? [...new Set(locations)] : []
          });
        }
      } catch (error) {
        console.error('Failed to load dynamic Sochiot data:', error);
      }
    };
    initDynamicData();
  }, []);

  const fetchZoneDetails = async (zoneName, zoneId) => {
    if (!zoneId) return;
    try {
      const data = await getSochiotZoneData(zoneId);
      if (data?.locationVOS) {
        setHierarchyData(prev => {
          const next = JSON.parse(JSON.stringify(prev)); 
          next.forEach(org => {
            (org.clients || []).forEach(client => {
              (client.zones || []).forEach(zone => {
                const updateNode = (node) => {
                  if (String(node.id) === String(zoneId) || node.name === zoneName) {
                    node.locations = data.locationVOS.map(loc => ({
                      name: loc.name, id: loc.id, type: loc.locationType
                    }));
                    if (data.locationVOS.length > 0) {
                      setDynamicOptions(prevOpts => ({
                        ...prevOpts,
                        locations: [...new Set([...prevOpts.locations, ...data.locationVOS.map(l => l.name)])]
                      }));
                      data.locationVOS.forEach(l => {
                        setLocationIdMap(prevMap => ({ ...prevMap, [l.name]: l.id }));
                      });
                    }
                  }
                  (node.subZones || []).forEach(updateNode);
                };
                updateNode(zone);
              });
            });
          });
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to fetch zone details:", e);
    }
  };

  const fetchLocationDetails = async (locationName, providedId = null) => {
    if (locationDetails[locationName]) return;
    const locId = providedId || locationIdMap[locationName];
    if (!locId) return;

    try {
      const data = await getSochiotLocationData(locId);
      if (data?.locationVOS?.[0]) {
        const gateways = data.locationVOS[0].gatewayVOList || [];
        const deviceList = [];
        const gatewayList = gateways.map(g => ({ label: g.name, id: g.id, uuid: g.uuid }));
        gateways.forEach(g => {
          if (g.deviceEntityVOS) {
            g.deviceEntityVOS.forEach(d => {
              deviceList.push({ label: `${g.name} / ${d.name}`, id: d.id, uuid: d.uuid, gatewayId: g.id });
            });
          }
        });
        setLocationDetails(prev => ({ ...prev, [locationName]: { deviceList, gatewayList } }));
      }
    } catch (e) {
      console.error("Failed to fetch location details:", e);
    }
  };

  const handleRuleClick = async (ruleId) => {
    setIsDetailOpen(true);
    setIsEditMode(false);
    setSelectedRule(null);
    setIsDetailLoading(true);
    try {
      const data = await getSochiotRuleById(ruleId);
      setSelectedRule(data);
      setEditName(data?.name || '');
    } catch (e) {
      console.error('Failed to fetch rule detail:', e);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const fetchRulesForSelection = async (locationState) => {
    let companyId = '';
    let targetNodeType = '';
    let targetNodeId = '';

    if (locationState.organization) {
      const comp = hierarchyData.find(c => c.name === locationState.organization);
      if (comp) {
        companyId = comp.id;
        targetNodeType = 'COMPANY';
        targetNodeId = comp.id;
      }
    }

    if (!companyId) {
      setRules([]); setTotalRules(0); setEmailGroups(0); return;
    }

    if (locationState.client) {
      const comp = hierarchyData.find(c => c.name === locationState.organization);
      const cli = comp?.clients?.find(c => c.name === locationState.client);
      if (cli) { targetNodeType = 'CONSUMER'; targetNodeId = cli.id; }
    }
    if (locationState.zone && zoneIdMap[locationState.zone]) {
      targetNodeType = 'ZONE'; targetNodeId = zoneIdMap[locationState.zone];
    }
    if (locationState.subZone && locationIdMap[locationState.subZone]) {
      targetNodeType = 'LOCATION'; targetNodeId = locationIdMap[locationState.subZone];
    }
    if (locationState.building && locationIdMap[locationState.building]) {
      targetNodeType = 'LOCATION'; targetNodeId = locationIdMap[locationState.building];
    }
    // Gateway removed - rules now show at Location/Building level

    setIsLoading(true);
    let fetchType = '';
    let fetchId = '';
    
    // Call the most specific API for the selected level.
    // Backend will return only rules created for that specific node.
    if (targetNodeType && targetNodeId) {
      fetchType = targetNodeType;
      fetchId = targetNodeId;
    } else if (companyId) {
      fetchType = 'COMPANY';
      fetchId = companyId;
    }

    if (fetchType && fetchId) {
      try {
        const rulesData = await getSochiotRules(fetchType, fetchId, 1);

        if (rulesData && rulesData.list) {
          const fetchedRules = rulesData.list;
          setRules(fetchedRules);
          setTotalRules(fetchedRules.length);
          
          const uniqueEmailGroups = new Set();
          fetchedRules.forEach(r => { if (r.emailGroupVO?.id) uniqueEmailGroups.add(r.emailGroupVO.id); });
          setEmailGroups(uniqueEmailGroups.size);
        } else {
          setRules([]);
          setTotalRules(0);
          setEmailGroups(0);
        }
      } catch (err) {
        console.error("Failed to fetch rules:", err);
        setRules([]);
        setTotalRules(0);
        setEmailGroups(0);
      }
    } else {
      setRules([]);
      setTotalRules(0);
      setEmailGroups(0);
    }
    setIsLoading(false);
  };

  const getHierarchyOptions = () => {
    const { organization, client, zone, subZone } = globalLocation;
    let clients = [], zones = [], subZones = [], buildings = [];

    if (organization) {
      const comp = hierarchyData.find(c => c.name === organization);
      if (comp) clients = comp.clients.map(c => c.name);
    }
    if (organization && client) {
      const comp = hierarchyData.find(c => c.name === organization);
      const cli = comp?.clients.find(c => c.name === client);
      if (cli) zones = cli.zones.map(z => z.name);
    }
    if (organization && client && zone) {
      const comp = hierarchyData.find(c => c.name === organization);
      const cli = comp?.clients.find(c => c.name === client);
      const z = cli?.zones.find(z => z.name === zone);
      if (z) {
        subZones = z.subZones.map(sz => sz.name);
        buildings = z.locations.map(l => l.name);
      }
    }
    if (organization && client && zone && subZone) {
      const comp = hierarchyData.find(c => c.name === organization);
      const cli = comp?.clients.find(c => c.name === client);
      const z = cli?.zones.find(z => z.name === zone);
      const sz = z?.subZones.find(s => s.name === subZone);
      if (sz) buildings = sz.locations.map(l => l.name);
    }
    return { clients, zones, subZones, buildings };
  };

  const hierarchyOptions = getHierarchyOptions();

  const handleLocationChange = async (field, value) => {
    const newLoc = { ...globalLocation, [field]: value };
    if (field === 'organization') {
      newLoc.client = ''; newLoc.zone = ''; newLoc.subZone = ''; newLoc.building = ''; newLoc.gateway = '';
    } else if (field === 'client') {
      newLoc.zone = ''; newLoc.subZone = ''; newLoc.building = ''; newLoc.gateway = '';
    } else if (field === 'zone') {
      newLoc.subZone = ''; newLoc.building = ''; newLoc.gateway = '';
      if (value) fetchZoneDetails(value, zoneIdMap[value]);
    } else if (field === 'subZone') {
      newLoc.building = ''; newLoc.gateway = '';
    } else if (field === 'building') {
      newLoc.gateway = '';
      if (value) fetchLocationDetails(value);
    }
    setGlobalLocation(newLoc);
    fetchRulesForSelection(newLoc);
  };

  const getGatewaysForSelectedBuilding = () => {
    const b = globalLocation.building;
    if (b && locationDetails[b]) return locationDetails[b].gatewayList || [];
    return [];
  };

  // Toggle rule active/inactive via API
  const toggleRuleActive = async (rule, e) => {
    if (e) e.stopPropagation();
    const newActive = !rule.active;
    try {
      // Fetch latest rule data to get current version (prevents optimistic lock errors)
      const freshRule = await getSochiotRuleById(rule.id);
      if (!freshRule) throw new Error('Could not fetch latest rule data');
      
      const origConditions = freshRule.conditions || [];
      const origConsequences = freshRule.consequences || [];
      const payload = {
        name: freshRule.name,
        active: newActive,
        emailGroupId: freshRule.emailGroupVO?.id || freshRule.emailGroupId,
        conditions: origConditions.map((c, idx) => {
          const ef = c.eventField || {};
          return {
            name: c.name, locationId: c.locationId, deviceId: c.deviceId,
            moduleId: c.moduleId, thresholdValue: c.thresholdValue,
            logicalOperatorType: idx === 0 ? 'NONE' : (c.logicalOperatorType && c.logicalOperatorType !== 'NONE' ? c.logicalOperatorType : 'AND'),
            debounceTime: c.debounceTime, parentId: c.parentId,
            description: c.description, onModuleGroup: c.onModuleGroup || false,
            moduleGroupId: c.moduleGroupId || null,
            conditionType: (typeof c.conditionType === 'object' && c.conditionType) ? c.conditionType.name : c.conditionType,
            eventField: {
              id: ef.id, fieldName: ef.fieldName, displayName: ef.displayName,
              fieldType: (typeof ef.fieldType === 'object' && ef.fieldType) ? ef.fieldType.name : (ef.fieldType || 'MODULE'),
              moduleTypeId: ef.moduleTypeId, moduleTypeNumber: ef.moduleTypeNumber,
              moduleTypeName: ef.moduleTypeName,
              dataType: (typeof ef.dataType === 'object' && ef.dataType) ? ef.dataType.name : ef.dataType,
              supportedValues: Array.isArray(ef.supportedValues) ? ef.supportedValues.join(',') : (ef.supportedValues ?? ''),
              dateCreated: ef.dateCreated, lastUpdated: ef.lastUpdated, deleted: ef.deleted || false
            }
          };
        }),
        consequences: origConsequences.map(c => ({
          name: c.name, deviceId: c.deviceId, moduleId: c.moduleId,
          locationId: c.locationId,
          dataType: (typeof c.dataType === 'object' && c.dataType) ? c.dataType.name : c.dataType,
          cmdField: c.cmdField,
          supportedValues: Array.isArray(c.supportedValues) ? c.supportedValues.join(',') : (c.supportedValues ?? ''),
          cmdArg: c.cmdArg, argValue: c.argValue,
          moduleTypeName: c.moduleTypeName, moduleTypeNumber: c.moduleTypeNumber,
          moduleTypeId: c.moduleTypeId, parentId: c.parentId,
          description: c.description, onModuleGroup: c.onModuleGroup || false,
          moduleGroupId: c.moduleGroupId || null
        })),
        notifications: (freshRule.notifications || []).map(n => ({
          id: n.id, text: n.text, alias: n.alias, userIds: n.userIds,
          created: n.created, type: n.type, icon: n.icon, priority: n.priority
        })),
        version: freshRule.version
      };
      const updatedRule = await updateSochiotRule(rule.id, payload);
      // Update local state with fresh data from API response
      const newRuleData = updatedRule || { ...freshRule, active: newActive, version: freshRule.version + 1 };
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, ...newRuleData } : r));
      if (selectedRule?.id === rule.id) {
        setSelectedRule(prev => ({ ...prev, ...newRuleData }));
      }
    } catch (error) {
      console.error('Toggle active error:', error);
      alert('Failed to toggle active: ' + error.message);
    }
  };

  // Styles
  const pageBg = isDark ? '#0b1120' : '#f8f9fa';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <Container fluid className="py-4" style={{ backgroundColor: pageBg, minHeight: '100vh', color: textColor }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ fontWeight: '700', margin: 0 }}>Rule Engine</h2>
          <small style={{ color: subTextColor }}>Manage alarms, notifications, and automated actions</small>
        </div>
      </div>

      <div className="mb-4 d-flex gap-2" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ minWidth: '180px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: subTextColor, textTransform: 'uppercase', marginBottom: '4px' }}>Organization</div>
          <Form.Select value={globalLocation.organization} onChange={(e) => handleLocationChange('organization', e.target.value)} style={{ backgroundColor: isDark ? '#0f172a' : '#fff', color: textColor, borderColor: borderColor, fontSize: '14px', borderRadius: '8px' }}>
            <option value="">Select Company</option>
            {dynamicOptions.fields.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Form.Select>
        </div>
        <div style={{ minWidth: '180px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: subTextColor, textTransform: 'uppercase', marginBottom: '4px' }}>Client (Consumer)</div>
          <Form.Select disabled={!globalLocation.organization} value={globalLocation.client} onChange={(e) => handleLocationChange('client', e.target.value)} style={{ backgroundColor: isDark ? '#0f172a' : '#fff', color: textColor, borderColor: borderColor, fontSize: '14px', borderRadius: '8px' }}>
            <option value="">Select Client</option>
            {hierarchyOptions.clients.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Form.Select>
        </div>
        <div style={{ minWidth: '180px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: subTextColor, textTransform: 'uppercase', marginBottom: '4px' }}>Zone</div>
          <Form.Select disabled={!globalLocation.client} value={globalLocation.zone} onChange={(e) => handleLocationChange('zone', e.target.value)} style={{ backgroundColor: isDark ? '#0f172a' : '#fff', color: textColor, borderColor: borderColor, fontSize: '14px', borderRadius: '8px' }}>
            <option value="">Select Zone</option>
            {hierarchyOptions.zones.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Form.Select>
        </div>
        {hierarchyOptions.subZones.length > 0 && (
          <div style={{ minWidth: '180px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: subTextColor, textTransform: 'uppercase', marginBottom: '4px' }}>Sub Zone</div>
            <Form.Select disabled={!globalLocation.zone} value={globalLocation.subZone} onChange={(e) => handleLocationChange('subZone', e.target.value)} style={{ backgroundColor: isDark ? '#0f172a' : '#fff', color: textColor, borderColor: borderColor, fontSize: '14px', borderRadius: '8px' }}>
              <option value="">Select Sub Zone</option>
              {hierarchyOptions.subZones.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Form.Select>
          </div>
        )}
        <div style={{ minWidth: '180px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: subTextColor, textTransform: 'uppercase', marginBottom: '4px' }}>Location / Building</div>
          <Form.Select disabled={!globalLocation.zone} value={globalLocation.building} onChange={(e) => handleLocationChange('building', e.target.value)} style={{ backgroundColor: isDark ? '#0f172a' : '#fff', color: textColor, borderColor: borderColor, fontSize: '14px', borderRadius: '8px' }}>
            <option value="">Select Building</option>
            {hierarchyOptions.buildings.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Form.Select>
        </div>
      </div>

      <Card style={{ backgroundColor: cardBg, borderColor: borderColor, borderRadius: '12px' }}>
          <Card.Header style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${borderColor}`, padding: '16px 20px' }}>
            <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-4">
              <div className="text-center">
                <div style={{ color: '#6366f1', fontSize: '18px', fontWeight: 'bold' }}>
                  <FiBell className="me-2" />{totalRules}
                </div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: subTextColor, fontWeight: '600' }}>Total Rules</div>
              </div>
              <div className="text-center">
                <div style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>
                  <FiMail className="me-2" />{emailGroups}
                </div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: subTextColor, fontWeight: '600' }}>Email Groups</div>
              </div>
            </div>
            <div className="d-flex gap-3">
              <Button variant="outline-primary" className="d-flex align-items-center" style={{ fontWeight: '500', borderRadius: '8px' }}>
                <FiMail className="me-2" /> Create Email Groups
              </Button>
              <Button variant="primary" className="d-flex align-items-center" style={{ fontWeight: '500', borderRadius: '8px', backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}>
                <FiPlus className="me-2" /> Create Rule & Notification
              </Button>
            </div>
          </div>
        </Card.Header>
        
        {!globalLocation.building ? (
          <div className="text-center py-5" style={{ color: subTextColor }}>
            <FiBell size={48} className="mb-3" style={{ opacity: 0.5 }} />
            <h5>Please select a Location / Building to view rules</h5>
            <p>Rules will be displayed once a Location is selected.</p>
          </div>
        ) : (
        <Table responsive hover variant={isDark ? "dark" : "light"} className="mb-0" style={{ backgroundColor: 'transparent' }}>
          <thead>
            <tr>
              <th style={{ backgroundColor: isDark ? '#1e293b' : '#f8f9fa', color: subTextColor, fontSize: '12px', padding: '16px 20px' }}>NAME</th>
              <th className="text-center" style={{ backgroundColor: isDark ? '#1e293b' : '#f8f9fa', color: subTextColor, fontSize: '12px', padding: '16px 20px' }}>CONDITION COUNT</th>
              <th className="text-center" style={{ backgroundColor: isDark ? '#1e293b' : '#f8f9fa', color: subTextColor, fontSize: '12px', padding: '16px 20px' }}>CONSEQUENCE COUNT</th>
              <th className="text-center" style={{ backgroundColor: isDark ? '#1e293b' : '#f8f9fa', color: subTextColor, fontSize: '12px', padding: '16px 20px' }}>ENABLED</th>
              <th style={{ backgroundColor: isDark ? '#1e293b' : '#f8f9fa', color: subTextColor, fontSize: '12px', padding: '16px 20px' }}>LAST UPDATED</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-5">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <div style={{ color: subTextColor }}>Loading Rules...</div>
                </td>
              </tr>
            ) : rules.length > 0 ? (
              rules.map((rule) => (
                <tr 
                  key={rule.id} 
                  onClick={() => handleRuleClick(rule.id)}
                  style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px 20px', verticalAlign: 'middle', borderColor: borderColor }}>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {rule.name}
                      <FiChevronRight size={14} style={{ color: subTextColor }} />
                    </div>
                    <div style={{ fontSize: '12px', color: subTextColor }}>ID: {rule.id} | Ver: {rule.version}</div>
                  </td>
                  <td className="text-center" style={{ padding: '16px 20px', verticalAlign: 'middle', borderColor: borderColor }}>
                    <Badge bg="info" text="dark" style={{ padding: '6px 12px', borderRadius: '20px' }}>
                      {rule.conditions?.length || 0}
                    </Badge>
                  </td>
                  <td className="text-center" style={{ padding: '16px 20px', verticalAlign: 'middle', borderColor: borderColor }}>
                    <Badge bg="warning" text="dark" style={{ padding: '6px 12px', borderRadius: '20px' }}>
                      {rule.consequences?.length || 0}
                    </Badge>
                  </td>
                  <td className="text-center" style={{ padding: '16px 20px', verticalAlign: 'middle', borderColor: borderColor }}>
                    <div className="d-flex justify-content-center">
                      <Form.Check 
                        type="switch"
                        id={`rule-switch-${rule.id}`}
                        checked={rule.active}
                        onChange={() => {}}
                        onClick={e => toggleRuleActive(rule, e)}
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', verticalAlign: 'middle', color: subTextColor, borderColor: borderColor }}>
                    {new Date(rule.lastUpdated).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-5" style={{ borderColor: borderColor }}>
                  <FiInbox size={48} color={subTextColor} style={{ opacity: 0.5, marginBottom: '16px' }} />
                  <h5 style={{ color: textColor }}>No Data</h5>
                  <p style={{ color: subTextColor }}>
                    {!globalLocation.organization ? 'Please select an organization to view rules.' : 'No rules found for the selected location.'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        )}
      </Card>

      {/* Rule Detail Side Panel */}
      {isDetailOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: '520px',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderLeft: `1px solid ${borderColor}`,
          boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
          zIndex: 1050, overflowY: 'auto',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px', borderBottom: `1px solid ${borderColor}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: subTextColor, textTransform: 'uppercase', fontWeight: '600' }}>
                {isEditMode ? '✏️ Edit Rule' : '📋 Rule Details'}
              </div>
              <div style={{ fontWeight: '700', fontSize: '18px', color: textColor, marginTop: '4px' }}>
                {isDetailLoading ? 'Loading...' : (selectedRule?.name || 'Rule')}
              </div>
              {selectedRule && (
                <div style={{ fontSize: '12px', color: subTextColor }}>ID: {selectedRule.id} | Ver: {selectedRule.version}</div>
              )}
            </div>
            <button onClick={() => { setIsDetailOpen(false); setIsEditMode(false); }}
              style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', padding: '8px' }}>
              <FiX size={22} />
            </button>
          </div>

          {isDetailLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div style={{ color: subTextColor, marginTop: '12px' }}>Loading rule details...</div>
            </div>
          ) : selectedRule ? (
            <div style={{ padding: '20px 24px', flex: 1 }}>

              {/* Name */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: subTextColor, textTransform: 'uppercase', marginBottom: '6px' }}>Rule Name</div>
                {isEditMode ? (
                  <Form.Control
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{ backgroundColor: isDark ? '#0f172a' : '#f8f9fa', color: textColor, borderColor: borderColor, borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', fontWeight: '600', color: textColor }}>{selectedRule.name}</div>
                )}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                  background: selectedRule.active ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)',
                  color: selectedRule.active ? '#10b981' : subTextColor }}>
                  {selectedRule.active ? '● Active' : '○ Inactive'}
                </div>
                <div style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                  background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                  {selectedRule.zoneNodeType}
                </div>
              </div>

              {/* Email Group */}
              {selectedRule.emailGroupVO && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)', border: `1px solid rgba(16,185,129,0.2)`, marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#10b981', textTransform: 'uppercase', marginBottom: '4px' }}>
                    <FiMail size={12} className="me-1" /> Email Group
                  </div>
                  <div style={{ fontWeight: '600', color: textColor }}>{selectedRule.emailGroupVO.name}</div>
                  <div style={{ fontSize: '12px', color: subTextColor }}>{selectedRule.emailGroupVO.emails?.join(', ')}</div>
                </div>
              )}

              {/* Conditions */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#06b6d4', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiAlertCircle size={15} /> CONDITIONS ({selectedRule.conditions?.length || 0})
                </div>
                {selectedRule.conditions?.length > 0 ? selectedRule.conditions.map((c, i) => (
                  <div key={c.id} style={{ padding: '14px', borderRadius: '10px', background: isDark ? 'rgba(6,182,212,0.06)' : 'rgba(6,182,212,0.04)', border: `1px solid rgba(6,182,212,0.2)`, marginBottom: '10px' }}>
                    <div style={{ fontWeight: '600', color: textColor, marginBottom: '8px' }}>{i + 1}. {c.name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Module</div>
                        <div style={{ fontSize: '13px', color: textColor, fontWeight: '500' }}>{c.eventField?.moduleTypeName?.substring(0, 18) || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Event Field</div>
                        <div style={{ fontSize: '13px', color: '#06b6d4', fontWeight: '500' }}>{c.eventField?.displayName || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Condition</div>
                        <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '500' }}>{c.conditionType?.displayName || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Threshold</div>
                        <div style={{ fontSize: '13px', color: textColor, fontWeight: '600' }}>{c.thresholdValue}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Debounce</div>
                        <div style={{ fontSize: '13px', color: textColor }}>{c.debounceTime}s</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Description</div>
                        <div style={{ fontSize: '13px', color: textColor }}>{c.description || '-'}</div>
                      </div>
                    </div>
                  </div>
                )) : <div style={{ color: subTextColor, fontSize: '13px' }}>No conditions</div>}
              </div>

              {/* Consequences */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiZap size={15} /> CONSEQUENCES ({selectedRule.consequences?.length || 0})
                </div>
                {selectedRule.consequences?.length > 0 ? selectedRule.consequences.map((c, i) => (
                  <div key={c.id} style={{ padding: '14px', borderRadius: '10px', background: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)', border: `1px solid rgba(245,158,11,0.2)`, marginBottom: '10px' }}>
                    <div style={{ fontWeight: '600', color: textColor, marginBottom: '8px' }}>{i + 1}. {c.name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Command Field</div>
                        <div style={{ fontSize: '13px', color: textColor, fontWeight: '500' }}>{c.cmdField || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Module</div>
                        <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '500' }}>{c.moduleTypeName || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Cmd Arg</div>
                        <div style={{ fontSize: '13px', color: textColor }}>{c.cmdArg}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Arg Value</div>
                        <div style={{ fontSize: '13px', color: textColor, fontWeight: '600' }}>{c.argValue}</div>
                      </div>
                      {c.description && (
                        <div style={{ gridColumn: '1/-1' }}>
                          <div style={{ fontSize: '10px', color: subTextColor, textTransform: 'uppercase' }}>Description</div>
                          <div style={{ fontSize: '13px', color: textColor }}>{c.description}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )) : <div style={{ color: subTextColor, fontSize: '13px' }}>No consequences</div>}
              </div>

              {/* Notifications */}
              {selectedRule.notifications?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#8b5cf6', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiMessageSquare size={15} /> NOTIFICATIONS ({selectedRule.notifications.length})
                  </div>
                  {selectedRule.notifications.map((n, i) => (
                    <div key={n.id} style={{ padding: '12px 14px', borderRadius: '10px', background: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.05)', border: `1px solid rgba(139,92,246,0.2)`, marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', color: textColor }}>{n.text}</div>
                      <div style={{ fontSize: '12px', color: subTextColor, marginTop: '4px' }}>
                        Priority: <span style={{ color: '#8b5cf6' }}>{n.priority}</span> • Icon: {n.icon}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : null}

          {/* Footer Actions */}
          {selectedRule && (
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${borderColor}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Button variant="primary" style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5', borderRadius: '8px', fontWeight: '600' }}
                onClick={() => setIsEditModalOpen(true)}>
                <FiEdit2 size={14} className="me-2" />Edit
              </Button>
              <Button variant="outline-danger" style={{ borderRadius: '8px', fontWeight: '600' }}
                onClick={() => alert('Delete rule: ' + selectedRule.id)}>
                <FiTrash2 size={14} className="me-2" />Delete
              </Button>
              <div style={{ marginLeft: 'auto' }}>
                <Form.Check
                  type="switch"
                  id="detail-rule-active"
                  checked={selectedRule.active}
                  onChange={() => toggleRuleActive(selectedRule)}
                  label={<span style={{ fontSize: '13px', fontWeight: '600', color: selectedRule.active ? '#10b981' : '#ef4444' }}>Active</span>}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isDetailOpen && (
        <div onClick={() => { setIsDetailOpen(false); setIsEditMode(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1049 }} />
      )}

      {/* Rule Edit Modal */}
      {isEditModalOpen && selectedRule && (
        <RuleEditModal
          rule={selectedRule}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={async (updated) => {
            try {
              // Fetch latest version from API to prevent optimistic lock errors
              const freshRule = await getSochiotRuleById(updated.id);
              const latestVersion = freshRule?.version || updated.version;

              // Find original condition/consequence data from freshRule to preserve fields
              const origConditions = freshRule?.conditions || selectedRule?.conditions || [];
              const origConsequences = freshRule?.consequences || selectedRule?.consequences || [];
              const origNotifications = freshRule?.notifications || selectedRule?.notifications || [];

              const payload = {
                name: updated.name,
                active: updated.active,
                emailGroupId: updated.emailGroupVO?.id || updated.emailGroupId,
                conditions: updated.conditions?.map((c, idx, arr) => {
                  // Find original condition to get missing fields
                  const orig = origConditions.find(oc => oc.id === c.id) || {};
                  const origEF = orig.eventField || {};
                  const ef = c.eventField || origEF;
                  // First condition must be NONE (no preceding operator), others keep their AND/OR setting
                  const isFirst = idx === 0;

                  return {
                    name: c.name,
                    locationId: c.locationId,
                    deviceId: c.deviceId,
                    moduleId: c.moduleId,
                    thresholdValue: c.thresholdValue,
                    logicalOperatorType: isFirst ? 'NONE' : (c.logicalOperatorType && c.logicalOperatorType !== 'NONE' ? c.logicalOperatorType : 'AND'),
                    debounceTime: c.debounceTime,
                    parentId: c.parentId,
                    description: c.description,
                    onModuleGroup: c.onModuleGroup || false,
                    moduleGroupId: c.moduleGroupId || null,
                    conditionType: (typeof c.conditionType === 'object' && c.conditionType) ? c.conditionType.name : c.conditionType,
                    eventField: {
                      id: ef.id,
                      fieldName: ef.fieldName,
                      displayName: ef.displayName,
                      fieldType: (typeof ef.fieldType === 'object' && ef.fieldType) ? ef.fieldType.name : (ef.fieldType || origEF.fieldType || 'MODULE'),
                      moduleTypeId: ef.moduleTypeId || origEF.moduleTypeId,
                      moduleTypeNumber: ef.moduleTypeNumber || origEF.moduleTypeNumber,
                      moduleTypeName: ef.moduleTypeName || origEF.moduleTypeName,
                      dataType: (typeof ef.dataType === 'object' && ef.dataType) ? ef.dataType.name : (ef.dataType || origEF.dataType),
                      supportedValues: Array.isArray(ef.supportedValues) ? ef.supportedValues.join(',') : (ef.supportedValues ?? ''),
                      dateCreated: ef.dateCreated || origEF.dateCreated,
                      lastUpdated: ef.lastUpdated || origEF.lastUpdated,
                      deleted: ef.deleted || false
                    }
                  };
                }),
                consequences: updated.consequences?.map(c => {
                  const orig = origConsequences.find(oc => oc.id === c.id) || {};
                  return {
                    name: c.name,
                    deviceId: c.deviceId,
                    moduleId: c.moduleId,
                    locationId: c.locationId,
                    dataType: (typeof c.dataType === 'object' && c.dataType) ? c.dataType.name : (c.dataType || orig.dataType),
                    cmdField: c.cmdField,
                    supportedValues: Array.isArray(c.supportedValues) ? c.supportedValues.join(',') : (c.supportedValues ?? ''),
                    cmdArg: c.cmdArg,
                    argValue: c.argValue,
                    moduleTypeName: c.moduleTypeName || orig.moduleTypeName,
                    moduleTypeNumber: c.moduleTypeNumber || orig.moduleTypeNumber,
                    moduleTypeId: c.moduleTypeId || orig.moduleTypeId,
                    parentId: c.parentId,
                    description: c.description,
                    onModuleGroup: c.onModuleGroup || false,
                    moduleGroupId: c.moduleGroupId || null
                  };
                }),
                notifications: (updated.notifications || origNotifications).map(n => ({
                  id: n.id,
                  text: n.text,
                  alias: n.alias,
                  userIds: n.userIds,
                  created: n.created,
                  type: n.type,
                  icon: n.icon,
                  priority: n.priority
                })),
                version: latestVersion
              };

              await updateSochiotRule(updated.id, payload);
              setSelectedRule(updated);
              setRules(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
              setIsEditModalOpen(false);
            } catch (error) {
              console.error('Failed to update rule', error);
              alert('Failed to update rule: ' + error.message);
            }
          }}
          hierarchyData={hierarchyData}
          isDark={isDark}
        />
      )}
    </Container>
  );
};

export default AlarmConfig;
