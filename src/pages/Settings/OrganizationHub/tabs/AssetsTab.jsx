import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { Activity, Plus, Edit3, Trash2 } from 'lucide-react';

const AssetsTab = ({
  assets,
  searchTerm,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  isAdmin
}) => {
  const filtered = assets.filter(a =>
    (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.assetType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="table-responsive">
      <table className="table table-custom mb-0">
        <thead>
          <tr>
            <th>Asset / Equipment Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-5 text-muted">
                <Activity size={36} className="mb-2 text-slate-500 opacity-50" />
                <div>No assets found.</div>
              </td>
            </tr>
          ) : (
            filtered.map(a => {
              const isInactive = a.status === 'INACTIVE' || a.deletedAt;
              return (
                <tr key={a.id}>
                  <td className="fw-bold text-white">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1.5 rounded-2 bg-warning bg-opacity-10 text-warning">
                        <Activity size={16} />
                      </div>
                      <div>
                        {a.name}
                        <div className="fs-11 text-muted font-monospace">{a.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge bg="dark" className="border border-secondary border-opacity-50 text-slate-300 font-monospace px-2 py-1">
                      {a.assetType || 'EQUIPMENT'}
                    </Badge>
                  </td>
                  <td className="text-slate-300 fs-13" style={{ maxWidth: 280 }}>
                    <span className="text-truncate d-inline-block" style={{ maxWidth: 260 }}>
                      {a.description || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                      {isInactive ? 'INACTIVE' : 'ACTIVE'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-1.5">
                      <Button variant="outline-light" size="sm" title="Edit Asset" onClick={() => onOpenEdit(a)} className="py-1">
                        <Edit3 size={13} />
                      </Button>
                      {isAdmin && (
                        <Button variant="outline-danger" size="sm" title="Delete Asset" onClick={() => onDelete(a.id)} className="py-1">
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssetsTab;
