import React, { useState } from 'react';
import { Form, Button, Table, Nav } from 'react-bootstrap';
import { Sliders, Plus, Eye, Copy, Trash2, ArrowUpDown } from 'lucide-react';
import ConfigDevicesPopover from '../components/ConfigDevicesPopover';

const TemplatesTab = ({
  handleGlobalResyncEventStats = () => {},
  showConfigDevicesModal = false,
  setShowConfigDevicesModal = () => {},
  handleTabSelect = () => {},
  showToast = () => {}
}) => {
  const [activeSubTab, setActiveSubTab] = useState('device');

  // Sample data matching user screenshot image
  const [templatesList] = useState([
    { id: 1, name: 'OZ-AIR-V0', inUseEntities: 0, lastUpdated: 'Jul 24, 2026 16:09:28' },
    { id: 2, name: 'Rule Engine V3', inUseEntities: 0, lastUpdated: 'Jul 2, 2026 09:20:54' },
    { id: 3, name: 'SELEC_EM2M', inUseEntities: 4, lastUpdated: 'Jun 21, 2026 13:41:12' },
    { id: 4, name: 'Livwize_T&H_84L', inUseEntities: 1, lastUpdated: 'Jun 16, 2026 13:14:50' },
    { id: 5, name: 'Livwize_EM_V1', inUseEntities: 1, lastUpdated: 'Jun 16, 2026 12:17:56' },
    { id: 6, name: 'EPM-310-Monitoring', inUseEntities: 0, lastUpdated: 'Jun 10, 2026 17:01:52' }
  ]);

  const [selectedItems, setSelectedItems] = useState({});

  const toggleSelectAll = (e) => {
    const checked = e.target.checked;
    const newSelected = {};
    if (checked) {
      templatesList.forEach(t => { newSelected[t.id] = true; });
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="d-flex flex-column gap-2 p-0 m-0 mb-0">
      {/* Top Title & Config Devices Button Row */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => handleTabSelect('device')}
            className="border-0 text-slate-300 hover:text-white px-2 py-1 fs-13 d-flex align-items-center gap-1"
            title="Back to Devices"
          >
            &larr; Back
          </Button>
          <h3 className="fw-bold text-white mb-0 fs-20">Templates</h3>
        </div>

        <div className="position-relative d-inline-block">
          <Button
            variant="outline-info"
            size="sm"
            onClick={handleGlobalResyncEventStats}
            className="fw-semibold d-flex align-items-center gap-1.5 fs-12 px-3 py-1.5"
          >
            <Sliders size={14} /> Config Devices
          </Button>

          <ConfigDevicesPopover
            show={showConfigDevicesModal}
            onClose={() => setShowConfigDevicesModal(false)}
            onSelectTemplates={() => {
              setShowConfigDevicesModal(false);
              handleTabSelect('templates');
            }}
            onSelectEntities={() => {
              setShowConfigDevicesModal(false);
              showToast('info', 'Opening Digital Twin Entities configuration...');
            }}
            onSelectLaunchpad={() => {
              setShowConfigDevicesModal(false);
              showToast('info', 'Opening Sochiot Cloud Launchpad...');
            }}
          />
        </div>
      </div>

      {/* Main Templates Content Card */}
      <div className="bg-dark-card rounded-3 p-2 border border-secondary border-opacity-25 shadow-sm">
        {/* Sub-Tabs Row & Action Buttons */}
        <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-3 mb-4 flex-wrap gap-3">
          <Nav variant="tabs" className="border-0 gap-3">
            <Nav.Item>
              <Nav.Link
                active={activeSubTab === 'device'}
                onClick={() => setActiveSubTab('device')}
                className={`fw-semibold fs-13 px-1 py-2 border-0 bg-transparent ${
                  activeSubTab === 'device'
                    ? 'text-info border-bottom border-info border-2 fw-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ borderRadius: 0 }}
              >
                Device Template
              </Nav.Link>
            </Nav.Item>

            <Nav.Item>
              <Nav.Link
                active={activeSubTab === 'module'}
                onClick={() => setActiveSubTab('module')}
                className={`fw-semibold fs-13 px-1 py-2 border-0 bg-transparent ${
                  activeSubTab === 'module'
                    ? 'text-info border-bottom border-info border-2 fw-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ borderRadius: 0 }}
              >
                Module Template
              </Nav.Link>
            </Nav.Item>

            <Nav.Item>
              <Nav.Link
                active={activeSubTab === 'type'}
                onClick={() => setActiveSubTab('type')}
                className={`fw-semibold fs-13 px-1 py-2 border-0 bg-transparent ${
                  activeSubTab === 'type'
                    ? 'text-info border-bottom border-info border-2 fw-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ borderRadius: 0 }}
              >
                Module Type
              </Nav.Link>
            </Nav.Item>

            <Nav.Item>
              <Nav.Link
                active={activeSubTab === 'network'}
                onClick={() => setActiveSubTab('network')}
                className={`fw-semibold fs-13 px-1 py-2 border-0 bg-transparent ${
                  activeSubTab === 'network'
                    ? 'text-info border-bottom border-info border-2 fw-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ borderRadius: 0 }}
              >
                Network Template
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <div className="d-flex align-items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="fw-semibold fs-12 px-3 py-1.5 d-flex align-items-center gap-1.5 text-white"
              style={{ backgroundColor: '#2563eb', border: 'none' }}
              onClick={() => showToast('info', 'Add Device Template action triggered')}
            >
              <Plus size={15} /> Add Device Template
            </Button>

            <Button
              variant="outline-info"
              size="sm"
              className="fw-semibold fs-12 px-3 py-1.5"
              onClick={() => showToast('info', 'Import Template action triggered')}
            >
              Import Template
            </Button>
          </div>
        </div>

        {/* Sub-heading */}
        <h5 className="fw-bold text-white fs-14 mb-3">Device Template</h5>

        {/* Templates Table */}
        <div className="table-responsive rounded-3 overflow-hidden mb-4" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Table hover variant="dark" className="mb-0 align-middle fs-13">
            <thead style={{ background: '#090d16', color: '#94a3b8' }}>
              <tr className="border-bottom border-secondary border-opacity-25 fs-12 text-uppercase">
                <th style={{ width: '40px' }} className="py-3 px-3">
                  <Form.Check
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={templatesList.length > 0 && Object.keys(selectedItems).length === templatesList.length}
                  />
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-1">
                    Name <ArrowUpDown size={13} className="text-slate-400 ms-1" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">In Use Entities</th>
                <th className="py-3 px-3">Last Updated</th>
                <th className="py-3 px-3 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {templatesList.map(item => (
                <tr key={item.id} className="border-bottom border-secondary border-opacity-10">
                  <td className="py-3 px-3">
                    <Form.Check
                      type="checkbox"
                      checked={!!selectedItems[item.id]}
                      onChange={() => toggleSelectItem(item.id)}
                    />
                  </td>
                  <td className="py-3 px-3 fw-bold text-info">{item.name}</td>
                  <td className="py-3 px-3 text-center font-monospace">{item.inUseEntities}</td>
                  <td className="py-3 px-3 text-slate-300 fs-12">{item.lastUpdated}</td>
                  <td className="py-3 px-3 text-end">
                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <Button
                        variant="link"
                        className="p-0 text-slate-400 hover:text-info"
                        title="View Details"
                        onClick={() => showToast('info', `Inspecting template: ${item.name}`)}
                      >
                        <Eye size={15} />
                      </Button>
                      <Button
                        variant="link"
                        className="p-0 text-slate-400 hover:text-white"
                        title="Duplicate"
                        onClick={() => showToast('info', `Duplicating template: ${item.name}`)}
                      >
                        <Copy size={15} />
                      </Button>
                      <Button
                        variant="link"
                        className="p-0 text-slate-400 hover:text-danger"
                        title="Delete"
                        onClick={() => showToast('info', `Delete template: ${item.name}`)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="d-flex align-items-center justify-content-center gap-1 fs-12 text-slate-400 pt-2">
          <Button variant="outline-secondary" size="sm" className="px-2 py-0 fs-12 border-0">&lt;</Button>
          <Button variant="primary" size="sm" className="px-2.5 py-0.5 fs-12 fw-bold me-1 ms-1">1</Button>
          {[2, 3, 4, 5, 6, 7].map(n => (
            <Button key={n} variant="link" size="sm" className="px-2 py-0.5 fs-12 text-slate-400 text-decoration-none hover:text-white">{n}</Button>
          ))}
          <Button variant="outline-secondary" size="sm" className="px-2 py-0 fs-12 border-0">&gt;</Button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesTab;
