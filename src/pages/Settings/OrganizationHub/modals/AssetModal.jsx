import React from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { Sliders } from 'lucide-react';

const AssetModal = ({
  show,
  onHide,
  editingAsset,
  assetForm,
  setAssetForm,
  handleSaveAsset,
  activeSites,
  assets,
  loading
}) => {
  return (
    <Modal show={show} onHide={onHide} centered className="glass-modal">
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
          <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
          <Button variant="warning" type="submit" disabled={loading} className="fw-semibold text-dark">
            {loading ? <Spinner animation="border" size="sm" /> : editingAsset ? 'Update Asset' : 'Create Asset'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AssetModal;
