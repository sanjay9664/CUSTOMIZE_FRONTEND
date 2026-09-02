import React from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { Layers } from 'lucide-react';

const CompanyTenantsModal = ({
  show,
  onHide,
  selectedCompanyForTenants,
  companyTenantsList
}) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="glass-modal">
      <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-white fs-5">
          <Layers className="text-info" /> Tenants under {selectedCompanyForTenants?.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-white p-4">
        {companyTenantsList.length === 0 ? (
          <p className="text-center py-4 text-slate-400 fs-13">No organizations assigned under this company yet.</p>
        ) : (
          <div className="table-responsive rounded-3 overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <table className="table table-dark table-hover mb-0 align-middle fs-13">
              <thead style={{ background: '#090d16', color: '#94a3b8' }}>
                <tr className="text-uppercase fs-11 tracking-wider">
                  <th className="py-3 px-3">Tenant Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Subscription</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {companyTenantsList.map(t => (
                  <tr key={t.id} className="border-bottom border-secondary border-opacity-10">
                    <td className="py-3 px-3 fw-bold text-white">{t.name}</td>
                    <td className="py-3 px-3 text-slate-300 font-monospace">{t.email || 'N/A'}</td>
                    <td className="py-3 px-3 text-slate-300 font-monospace">{t.phone || 'N/A'}</td>
                    <td className="py-3 px-3"><Badge bg="warning" text="dark" className="px-2 py-1 fs-11 font-monospace">{t.subscription || 'BASIC'}</Badge></td>
                    <td className="py-3 px-3">
                      <Badge bg={t.status === 'INACTIVE' ? 'secondary' : 'success'} className="px-2 py-1 fs-11">
                        {t.status || 'ACTIVE'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-dark border-secondary border-opacity-25 px-4 py-3">
        <Button variant="outline-secondary" size="sm" onClick={onHide} className="px-4">Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CompanyTenantsModal;
