import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { Sliders, Edit3, Trash2 } from 'lucide-react';

const AssetSection = ({
  filteredAssets = [],
  handleOpenEditAsset = () => {},
  handleDeleteAsset = () => {}
}) => {
  const safeAssets = Array.isArray(filteredAssets) ? filteredAssets : [];

  return (
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
          {safeAssets.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4 empty-text fw-semibold">No assets found</td>
            </tr>
          ) : safeAssets.map(a => (
            <tr key={a.id}>
              <td className="fw-bold text-white">
                <div className="d-flex align-items-center gap-2">
                  <Sliders className="text-info" size={18} />
                  {a.name}
                </div>
              </td>
              <td className="text-slate-300">
                <Badge bg="secondary" className="px-2 py-1 fs-11">
                  {a.assetType || 'EQUIPMENT'}
                </Badge>
              </td>
              <td className="text-slate-400 fs-13 font-monospace">{a.parentAssetId || 'None'}</td>
              <td className="text-slate-400 fs-13">{a.description || 'N/A'}</td>
              <td>
                <Badge bg={a.status === 'INACTIVE' || a.deletedAt ? 'secondary' : 'success'} className="px-2 py-1">
                  {a.status === 'INACTIVE' || a.deletedAt ? 'INACTIVE' : 'ACTIVE'}
                </Badge>
              </td>
              <td className="text-end">
                <div className="d-flex align-items-center justify-content-end gap-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => handleOpenEditAsset(a)}
                    title="Edit Asset Details"
                    className="p-1 border-0"
                  >
                    <Edit3 size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDeleteAsset(a)}
                    title="Delete Asset"
                    className="p-1 border-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetSection;
