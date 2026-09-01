import React from 'react';
import { Form, Button, Badge } from 'react-bootstrap';
import { Grid, Plus, Edit3, Trash2, RefreshCw } from 'lucide-react';

const WidgetsTab = ({
  handleSyncWidgetsFromSochiot = () => {},
  handleReorderWidgets = () => {},
  handleDeleteAllWidgets = () => {},
  selectedDeviceForWidgets = 1,
  setSelectedDeviceForWidgets = () => {},
  handleFetchWidgets = () => {},
  widgetFilterActiveOnly = false,
  setWidgetFilterActiveOnly = () => {},
  activeDevices = [],
  widgetsList = [],
  handleOpenEditWidgetModal = () => {},
  handleDeleteWidget = () => {}
}) => {
  const safeDevices = Array.isArray(activeDevices) ? activeDevices : [];
  const safeWidgets = Array.isArray(widgetsList) ? widgetsList : [];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-dark rounded border border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <Grid className="text-info" size={18} />
            <span className="fw-bold fs-13 text-slate-200">Device Widgets:</span>
          </div>
          <Form.Select
            size="sm"
            value={selectedDeviceForWidgets}
            onChange={(e) => {
              setSelectedDeviceForWidgets(e.target.value);
              handleFetchWidgets(e.target.value);
            }}
            style={{ minWidth: '220px' }}
            className="bg-dark text-white border-info border-opacity-50 fs-12 fw-semibold"
          >
            {safeDevices.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.category || 'BMS'})</option>
            ))}
          </Form.Select>

          <Form.Check
            type="switch"
            id="widgets-active-only"
            label="Active Only"
            checked={widgetFilterActiveOnly}
            onChange={(e) => setWidgetFilterActiveOnly(e.target.checked)}
            className="text-slate-300 fs-12 fw-semibold ms-2"
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-info"
            size="sm"
            onClick={handleSyncWidgetsFromSochiot}
            className="fw-semibold d-flex align-items-center gap-1.5 fs-12"
          >
            <RefreshCw size={14} /> Sync Widgets From Sochiot
          </Button>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleReorderWidgets}
            className="fw-semibold d-flex align-items-center gap-1.5 fs-12 text-slate-300"
          >
            ⚡ Reorder Layout
          </Button>

          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleDeleteAllWidgets}
            className="fw-semibold d-flex align-items-center gap-1.5 fs-12"
          >
            <Trash2 size={14} /> Purge All
          </Button>
        </div>
      </div>

      {/* Widgets Grid Table */}
      <div className="table-responsive rounded-3 overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <table className="table table-dark table-hover mb-0 align-middle fs-13">
          <thead style={{ background: '#090d16', color: '#94a3b8' }}>
            <tr className="text-uppercase fs-11 tracking-wider border-bottom border-secondary border-opacity-25">
              <th className="py-3 px-3">WIDGET NAME</th>
              <th className="py-3 px-3">WIDGET TYPE</th>
              <th className="py-3 px-3">DISPLAY ORDER</th>
              <th className="py-3 px-3">STATUS</th>
              <th className="py-3 px-3 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {safeWidgets.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5 text-slate-400">
                  <Grid size={32} className="mb-2 text-info opacity-50" />
                  <div>No widgets configured for this device</div>
                </td>
              </tr>
            ) : safeWidgets.map(w => (
              <tr key={w.id} className="border-bottom border-secondary border-opacity-10">
                <td className="py-3 px-3">
                  <div className="fw-bold text-white fs-14">{w.displayName || w.name}</div>
                  <div className="text-slate-400 fs-11 font-monospace">ID: {w.widgetId || w.id}</div>
                </td>
                <td className="py-3 px-3">
                  <Badge bg="info" className="px-2 py-1 fs-11 font-monospace text-dark">
                    {w.widgetType || 'GAUGE'}
                  </Badge>
                </td>
                <td className="py-3 px-3 font-monospace text-slate-300">
                  {w.displayOrder ?? 1}
                </td>
                <td className="py-3 px-3">
                  <Badge bg={w.isActive !== false ? 'success' : 'secondary'} className="px-2 py-1 fs-11">
                    {w.isActive !== false ? '● ACTIVE' : '○ INACTIVE'}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-end">
                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={() => handleOpenEditWidgetModal(w)}
                      className="p-1 border-0 rounded-circle text-info"
                    >
                      <Edit3 size={15} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDeleteWidget(w.id, w.displayName || w.name)}
                      className="p-1 border-0 rounded-circle text-danger"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WidgetsTab;
