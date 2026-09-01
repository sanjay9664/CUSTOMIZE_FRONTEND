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
      <Modal.Header closeButton className="border-secondary border-opacity-25">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <Layers className="text-info" /> Tenants under {selectedCompanyForTenants?.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {companyTenantsList.length === 0 ? (
          <p className="text-center py-4 text-muted">No organizations assigned under this company yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Tenant Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Subscription</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {companyTenantsList.map(t => (
                  <tr key={t.id}>
                    <td className="fw-bold text-white">{t.name}</td>
                    <td className="text-slate-300">{t.email || 'N/A'}</td>
                    <td className="text-slate-300">{t.phone || 'N/A'}</td>
                    <td><Badge bg="warning" text="dark">{t.subscription || 'BASIC'}</Badge></td>
                    <td>
                      <Badge bg={t.status === 'INACTIVE' ? 'secondary' : 'success'}>
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
      <Modal.Footer className="border-secondary border-opacity-25">
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CompanyTenantsModal;
