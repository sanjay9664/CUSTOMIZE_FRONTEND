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
    <div className="role-form-view">
      {/* Subheader with Back Arrow matching Screenshot 3 */}
      <div className="d-flex align-items-center mb-4">
        <button
          type="button"
          className="btn btn-link text-decoration-none text-dark p-0 me-3 d-flex align-items-center back-nav-btn"
          onClick={onBack}
          title="Back to Roles"
        >
          <ArrowLeft size={20} />
        </button>
        <h5 className="mb-0 fw-semibold text-dark fs-16">
          {titlePrefix} {roleType} Role
        </h5>
      </div>

      {isPredefined && (
        <Alert variant="info" className="fs-13 py-2 px-3 mb-4 d-flex align-items-center gap-2">
          <Shield size={16} />
          <span>
            This is a system-defined predefined role. Permissions are fixed by the platform schema.
          </span>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="fs-13 py-2 px-3 mb-4" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main 2-Column Card matching Screenshot 3 */}
      <Card className="border-0 shadow-sm rounded-3 bg-white">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              {/* Left Column: Role Details Form */}
              <Col xs={12} lg={6}>
                {/* Name */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-dark">
                    Name<span className="text-danger ms-1">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isPredefined || saving}
                    className="ref-form-input"
                  />
                </Form.Group>

                {/* Description */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-dark">
                    Description<span className="text-danger ms-1">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    disabled={isPredefined || saving}
                    className="ref-form-input"
                  />
                </Form.Group>

                {/* Organization */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-dark">
                    Organization<span className="text-danger ms-1">*</span>
                  </Form.Label>
                  <Form.Select
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    disabled={isPredefined || saving || loadingOrgs}
                    className="ref-form-input"
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
                  <Form.Label className="fs-13 fw-semibold text-dark">
                    Role Type<span className="text-danger ms-1">*</span>
                  </Form.Label>
                  <Form.Select
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value)}
                    disabled={isPredefined || saving}
                    className="ref-form-input"
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

            {/* Bottom Action Buttons matching Screenshot 3 */}
            <div className="d-flex align-items-center gap-2 mt-4 pt-3 border-top">
              {!isPredefined && (
                <Button
                  type="submit"
                  variant="primary"
                  className="px-4 py-2 fs-14 fw-500 rounded-1 ref-primary-btn"
                  disabled={saving || !name.trim() || selectedPermissions.length === 0}
                  style={{ minWidth: '100px', backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' }}
                >
                  {saving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    isEdit ? 'Save Changes' : 'Add'
                  )}
                </Button>
              )}

              <Button
                type="button"
                variant="outline-secondary"
                className="px-4 py-2 fs-14 fw-500 rounded-1 bg-white border"
                onClick={onBack}
                disabled={saving}
                style={{ color: '#475569', borderColor: '#cbd5e1' }}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RoleFormView;
