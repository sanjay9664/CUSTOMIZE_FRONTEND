import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { ArrowLeft, Save, Plus, Shield, Layers } from 'lucide-react';
import PermissionSelector from './PermissionSelector';
import { bmsService } from '../../../services/bmsService';

export const RoleFormView = ({
  role = null, // if present, edit mode; if null, add mode
  defaultRoleType = 'Organisation',
  onBack,
  onSaved
}) => {
  const isEdit = Boolean(role && role.id);
  const isPredefined = Boolean(role?.isPredefined);

  // Form State
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [organization, setOrganization] = useState(role?.tenantId || '');
  const [roleType, setRoleType] = useState(defaultRoleType || 'Organization');
  const [selectedPermissions, setSelectedPermissions] = useState(role?.permissions || []);

  // Organizations / Tenants list
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load organizations from /tenants & /companies
  useEffect(() => {
    let isMounted = true;
    const fetchOrgs = async () => {
      try {
        setLoadingOrgs(true);
        const [tenantsRes, companiesRes] = await Promise.allSettled([
          bmsService.getTenants(),
          bmsService.getCompanies()
        ]);

        const list = [];
        if (tenantsRes.status === 'fulfilled') {
          const tenants = tenantsRes.value?.data || (Array.isArray(tenantsRes.value) ? tenantsRes.value : []);
          tenants.forEach(t => list.push({ id: t.id, name: `${t.name || t.tenantName} (Tenant)`, type: 'TENANT' }));
        }
        if (companiesRes.status === 'fulfilled') {
          const companies = companiesRes.value?.data || (Array.isArray(companiesRes.value) ? companiesRes.value : []);
          companies.forEach(c => list.push({ id: c.id, name: `${c.name} (Company)`, type: 'COMPANY' }));
        }

        if (isMounted) {
          setOrganizations(list);
          if (!organization && list.length > 0) {
            setOrganization(list[0].id);
          }
        }
      } catch (e) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoadingOrgs(false);
      }
    };
    fetchOrgs();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required.');
      return;
    }
    if (selectedPermissions.length === 0) {
      setError('Please select at least one permission for this role.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEdit) {
        if (isPredefined) {
          // Predefined roles are immutable in backend per OpenAPI lines 795, clone instead if needed
          setError('System predefined roles cannot be modified directly. Please create a custom role or clone this role.');
          setSaving(false);
          return;
        }

        // Update Custom Role
        await bmsService.updateRole(role.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          permissionCodes: selectedPermissions
        });
      } else {
        // Create Custom Role
        await bmsService.createRole({
          name: name.trim(),
          description: description.trim() || undefined,
          permissionCodes: selectedPermissions,
          tenantId: organization || undefined
        });
      }

      if (onSaved) onSaved();
    } catch (err) {
      setError(err?.message || 'Failed to save role. Please check for duplicate names or invalid permissions.');
    } finally {
      setSaving(false);
    }
  };

  const titlePrefix = isEdit 
    ? (isPredefined ? 'View' : 'Edit') 
    : 'Add';

  return (
    <div className="role-form-view w-100">
      {/* Subheader with Back Arrow */}
      <div className="d-flex align-items-center mb-3.5">
        <button
          type="button"
          className="btn btn-sm d-inline-flex align-items-center justify-content-center me-2.5 p-1.5 rounded-circle text-white role-back-btn"
          onClick={onBack}
          title="Back to Roles"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <h4 className="mb-0 fw-bold text-white fs-18">
            {titlePrefix} {roleType} Role
          </h4>
        </div>
      </div>

      {isPredefined && (
        <Alert variant="info" className="fs-13 py-2 px-3 mb-3 d-flex align-items-center gap-2 bg-info bg-opacity-10 border-info border-opacity-25 text-info">
          <Shield size={16} />
          <span>
            This is a system-defined predefined role. Permissions are fixed by the platform schema.
          </span>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="fs-13 py-2 px-3 mb-3 bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main 2-Column Card */}
      <Card 
        className="border-0 shadow-lg rounded-3 role-form-card"
        style={{ backgroundColor: '#0c1429', border: '1px solid rgba(255, 255, 255, 0.08)' }}
      >
        <Card.Body className="p-4 p-md-4.5">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              {/* Left Column: Role Details Form */}
              <Col xs={12} lg={6}>
                {/* Name */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter role name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isPredefined || saving}
                    className="role-form-input"
                  />
                </Form.Group>

                {/* Description */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    Description <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Enter role description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    disabled={isPredefined || saving}
                    className="role-form-input"
                  />
                </Form.Group>

                {/* Organization */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    Organization <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    disabled={isPredefined || saving || loadingOrgs}
                    className="role-form-input"
                    required
                  >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Role Type */}
                <Form.Group className="mb-4">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    Role Type <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value)}
                    disabled={isPredefined || saving}
                    className="role-form-input"
                  >
                    <option value="Organization">Organization</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Installation">Installation</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Right Column: Permissions Selector (2-Column Checkboxes) */}
              <Col xs={12} lg={6}>
                <PermissionSelector
                  selectedPermissions={selectedPermissions}
                  onChange={setSelectedPermissions}
                  disabled={isPredefined || saving}
                />
              </Col>
            </Row>

            {/* Bottom Action Buttons */}
            <div className="d-flex align-items-center gap-2.5 mt-4 pt-3 border-top border-secondary border-opacity-25">
              {!isPredefined && (
                <button
                  type="submit"
                  className="btn d-inline-flex align-items-center justify-content-center px-4 py-2 fs-13 fw-semibold rounded-pill role-submit-btn"
                  disabled={saving || !name.trim() || selectedPermissions.length === 0}
                >
                  {saving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    isEdit ? 'Save Changes' : 'Add'
                  )}
                </button>
              )}

              <button
                type="button"
                className="btn d-inline-flex align-items-center justify-content-center px-4 py-2 fs-13 fw-medium rounded-pill role-cancel-btn"
                onClick={onBack}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Scoped Styles for RoleFormView */}
      <style dangerouslySetInnerHTML={{ __html: `
        .role-form-input {
          background-color: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          border-radius: 8px !important;
          color: #ffffff !important;
          padding: 8px 13px !important;
          font-size: 13.5px !important;
          transition: all 0.15s ease;
        }
        .role-form-input:focus {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: #38bdf8 !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15) !important;
        }
        .role-form-input::placeholder {
          color: #64748b !important;
        }
        .role-form-input option {
          background-color: #0f172a;
          color: #ffffff;
        }

        .role-submit-btn {
          background-color: #0284c7 !important;
          border: 1px solid #38bdf8 !important;
          color: #ffffff !important;
          min-width: 105px;
          height: 36px;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
          transition: all 0.15s ease;
        }
        .role-submit-btn:hover:not(:disabled) {
          background-color: #0369a1 !important;
          border-color: #7dd3fc !important;
          color: #ffffff !important;
        }
        .role-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .role-cancel-btn {
          background-color: rgba(255, 255, 255, 0.06) !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
          color: #ffffff !important;
          min-width: 95px;
          height: 36px;
          transition: all 0.15s ease;
        }
        .role-cancel-btn:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
          color: #ffffff !important;
        }

        .role-back-btn:hover {
          background-color: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
        }

        /* Light mode overrides */
        body.light-mode .role-form-card {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .role-form-input {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .role-form-input option {
          background-color: #ffffff;
          color: #0f172a;
        }
        body.light-mode .role-cancel-btn {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
      `}} />
    </div>
  );
};

export default RoleFormView;
