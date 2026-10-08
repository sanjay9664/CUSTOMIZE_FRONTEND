import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import LocationTreeSelector from './LocationTreeSelector';
import PasswordInput from '../../../components/PasswordInput';
import { bmsService } from '../../../services/bmsService';

export const UserFormView = ({
  user = null, // if present, edit mode; if null, add mode
  defaultUserType = '',
  onBack,
  onSaved
}) => {
  const isEdit = Boolean(user && user.id);

  // Form State (No hardcoded or pre-filled defaults on creation)
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState(user?.tenantId || user?.companyId || '');
  const [userType, setUserType] = useState(user ? (user.userType || defaultUserType) : (defaultUserType || ''));
  const [role, setRole] = useState(user?.role || '');
  const [roleId, setRoleId] = useState(user?.roleId || '');
  const [status, setStatus] = useState(user?.status || 'ACTIVE');
  const [locationMappings, setLocationMappings] = useState(user?.locationMappings || user?.zoneLocations || []);

  // Auxiliary data
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load organizations on mount
  useEffect(() => {
    let isMounted = true;
    const fetchOrganizations = async () => {
      try {
        setLoadingMeta(true);
        const [tenantsRes, companiesRes] = await Promise.allSettled([
          bmsService.getTenants(),
          bmsService.getCompanies()
        ]);

        if (isMounted) {
          const orgList = [];
          if (tenantsRes.status === 'fulfilled') {
            const tenants = tenantsRes.value?.data || (Array.isArray(tenantsRes.value) ? tenantsRes.value : []);
            tenants.forEach(t => orgList.push({ 
              id: t.id, 
              name: `${t.name || t.tenantName} (Tenant)`, 
              type: 'TENANT',
              raw: t
            }));
          }
          if (companiesRes.status === 'fulfilled') {
            const companies = companiesRes.value?.data || (Array.isArray(companiesRes.value) ? companiesRes.value : []);
            companies.forEach(c => orgList.push({ 
              id: c.id, 
              name: `${c.name} (Company)`, 
              type: 'COMPANY',
              raw: c
            }));
          }
          setOrganizations(orgList);
        }
      } catch (e) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };
    fetchOrganizations();
    return () => { isMounted = false; };
  }, []);

  // Fetch and filter roles strictly for the selected organization
  useEffect(() => {
    let isMounted = true;
    if (!organization) {
      setRoles([]);
      setLoadingRoles(false);
      return;
    }

    const fetchRolesForOrg = async () => {
      try {
        setLoadingRoles(true);
        const targetOrg = organizations.find(o => String(o.id) === String(organization));
        const params = {};
        if (targetOrg?.type === 'TENANT') {
          params.tenantId = organization;
        } else if (targetOrg?.type === 'COMPANY') {
          params.companyId = organization;
        } else {
          params.tenantId = organization;
        }

        const rolesRes = await bmsService.getRoles(params);
        const rawRoles = rolesRes?.data || (Array.isArray(rolesRes) ? rolesRes : []);

        // Filter strictly for the selected organization:
        // Omit custom roles and restricted roles that belong to other organizations
        const targetId = String(organization).trim();
        const filteredRoles = rawRoles.filter((r) => {
          // If role belongs explicitly to another tenant
          if (r.tenantId && String(r.tenantId) !== targetId) return false;
          // If role belongs explicitly to another company
          if (r.companyId && String(r.companyId) !== targetId) return false;
          // If role belongs explicitly to another organization
          if (r.organizationId && String(r.organizationId) !== targetId) return false;

          // If role has an array of allowed tenants
          if (Array.isArray(r.tenants) && r.tenants.length > 0) {
            const hasT = r.tenants.some(t => String(t?.id || t) === targetId);
            if (!hasT) return false;
          }
          // If role has an array of allowed companies
          if (Array.isArray(r.companies) && r.companies.length > 0) {
            const hasC = r.companies.some(c => String(c?.id || c) === targetId);
            if (!hasC) return false;
          }

          // If the organization definition itself defines an allowed/assigned roles list
          const orgRaw = targetOrg?.raw;
          if (Array.isArray(orgRaw?.roles) && orgRaw.roles.length > 0) {
            const matches = orgRaw.roles.some(oRole => {
              const oId = typeof oRole === 'string' ? oRole : (oRole?.id || oRole?.name);
              return String(oId) === String(r.id) || String(oId).toUpperCase() === String(r.name).toUpperCase();
            });
            if (!matches) return false;
          }
          if (Array.isArray(orgRaw?.roleIds) && orgRaw.roleIds.length > 0) {
            if (!orgRaw.roleIds.includes(r.id)) return false;
          }

          return true;
        });

        if (isMounted) {
          setRoles(filteredRoles);
          // If role was already selected, update roleId
          if (role) {
            const found = filteredRoles.find(r => r.name === role);
            if (found) {
              setRoleId(found.id);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch roles for organization:', err);
        if (isMounted) setRoles([]);
      } finally {
        if (isMounted) setLoadingRoles(false);
      }
    };

    fetchRolesForOrg();
    return () => { isMounted = false; };
  }, [organization, organizations]);

  // Sync roleId when role selection changes
  const handleRoleChange = (selectedRoleName) => {
    setRole(selectedRoleName);
    const found = roles.find(r => r.name === selectedRoleName);
    if (found) {
      setRoleId(found.id);
    } else {
      setRoleId('');
    }
  };

  // When organization changes, reset location mappings and role selection
  const handleOrganizationChange = (e) => {
    const selectedOrgId = e.target.value;
    setOrganization(selectedOrgId);
    setLocationMappings([]); // reset location selection on organization change
    setRole('');             // reset role so stale role from previous org is discarded
    setRoleId('');
  };

  const selectedOrgObj = useMemo(() => {
    return organizations.find(o => String(o.id) === String(organization));
  }, [organizations, organization]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required.');
      return;
    }
    if (!isEdit && (!password || password.length < 6)) {
      setError('Password is required (min 6 characters).');
      return;
    }
    if (!organization) {
      setError('Please select an Organization.');
      return;
    }
    if (!role) {
      setError('Please select a Role.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Convert selected location nodes to LocationMapping schema
      const cleanedMappings = (locationMappings || []).map(loc => {
        // If already formatted with LocationMapping fields
        if (loc.siteId !== undefined || loc.assetId !== undefined || loc.zoneId !== undefined || loc.tenantId !== undefined) {
          return {
            companyId: loc.companyId ? String(loc.companyId) : null,
            tenantId: loc.tenantId ? String(loc.tenantId) : null,
            zoneId: loc.zoneId ? String(loc.zoneId) : null,
            tenantAreaId: loc.tenantAreaId ? String(loc.tenantAreaId) : null,
            siteId: loc.siteId ? (Number(loc.siteId) || null) : null,
            areaId: loc.areaId ? (Number(loc.areaId) || null) : null,
            assetId: loc.assetId ? String(loc.assetId) : null,
            deviceId: loc.deviceId ? (Number(loc.deviceId) || null) : null
          };
        }
        // If raw tree node or legacy item
        const type = String(loc.type || loc.zoneNodeType || '').toUpperCase();
        const id = loc.id || loc.zoneNodeId;
        const mapping = {
          companyId: loc.companyId ? String(loc.companyId) : null,
          tenantId: loc.tenantId ? String(loc.tenantId) : null,
          zoneId: loc.zoneId ? String(loc.zoneId) : null,
          tenantAreaId: loc.tenantAreaId ? String(loc.tenantAreaId) : null,
          siteId: loc.siteId ? (Number(loc.siteId) || null) : null,
          areaId: loc.areaId ? (Number(loc.areaId) || null) : null,
          assetId: loc.assetId ? String(loc.assetId) : null,
          deviceId: loc.deviceId ? (Number(loc.deviceId) || null) : null
        };
        if (type === 'COMPANY') mapping.companyId = mapping.companyId || String(id);
        else if (type === 'TENANT') mapping.tenantId = mapping.tenantId || String(id);
        else if (type === 'ZONE') mapping.zoneId = mapping.zoneId || String(id);
        else if (type === 'TENANT_AREA' || type === 'TENANTAREA') mapping.tenantAreaId = mapping.tenantAreaId || String(id);
        else if (type === 'SITE') mapping.siteId = Number(id) || null;
        else if (type === 'AREA') mapping.areaId = Number(id) || null;
        else if (type === 'ASSET' || type === 'BUILDING' || type === 'PANEL' || type === 'DG' || type === 'EQUIPMENT') mapping.assetId = mapping.assetId || String(id);
        else if (type === 'DEVICE') mapping.deviceId = Number(id) || null;
        return mapping;
      });

      if (isEdit) {
        const updatePayload = {
          name: name.trim(),
          email: email.trim(),
          role,
          roleId: roleId || undefined,
          status,
          tenantId: organization || undefined,
          locationMappings: cleanedMappings
        };
        if (password && password.length >= 6) {
          updatePayload.password = password;
        }

        // Completely removed zoneLocations per migration guide
        await bmsService.updateUser(user.id, updatePayload);
      } else {
        const createPayload = {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          roleId: roleId || undefined,
          tenantId: organization || undefined,
          locationMappings: cleanedMappings
        };

        // Completely removed zoneLocations per migration guide
        await bmsService.createUser(createPayload);
      }

      if (onSaved) onSaved();
    } catch (err) {
      setError(err?.message || 'Failed to save user. Verify email uniqueness or valid role/location selection.');
    } finally {
      setSaving(false);
    }
  };

  const titleText = isEdit 
    ? `Edit User: ${user.name}` 
    : (userType ? `Add ${userType}` : 'Add User');

  return (
    <div className="user-form-view w-100">
      {/* Subheader with Back Arrow */}
      <div className="d-flex align-items-center mb-3.5">
        <button
          type="button"
          className="btn btn-sm d-inline-flex align-items-center justify-content-center me-2.5 p-1.5 rounded-circle text-white role-back-btn"
          onClick={onBack}
          title="Back to Users"
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
            {titleText}
          </h4>
        </div>
      </div>

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
          <Form onSubmit={handleSubmit} autoComplete="off">
            <Row className="g-4">
              {/* Left Column: User Details Form */}
              <Col xs={12} lg={6}>
                {/* Name */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={saving}
                    className="role-form-input"
                    autoComplete="off"
                  />
                </Form.Group>

                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={saving}
                    className="role-form-input"
                    autoComplete="off"
                    name="new_user_email"
                  />
                </Form.Group>

                {/* Password (Required on create, optional on edit) */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    {isEdit ? 'Password (Leave blank to keep unchanged)' : 'Password'}
                    {!isEdit && <span className="text-danger ms-1">*</span>}
                  </Form.Label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEdit ? '••••••••' : 'Min 6 characters'}
                    required={!isEdit}
                    minLength={6}
                    disabled={saving}
                    autoComplete="new-password"
                    name="new_user_password"
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
                    onChange={handleOrganizationChange}
                    disabled={saving || loadingMeta}
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

                {/* User Type */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    User Type <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    disabled={saving}
                    className="role-form-input"
                    required
                  >
                    <option value="">Select User Type</option>
                    <option value="Organisation User">Organisation User</option>
                    <option value="Administrator User">Administrator User</option>
                    <option value="Installation User">Installation User</option>
                  </Form.Select>
                </Form.Group>

                {/* Role (shown and enabled only after organization is selected) */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    Role <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={saving || !organization || loadingRoles}
                    className="role-form-input"
                    required
                  >
                    {!organization ? (
                      <option value="">Select Organization first</option>
                    ) : loadingRoles ? (
                      <option value="">Loading roles for organization...</option>
                    ) : roles.length === 0 ? (
                      <option value="">No roles available for this organization</option>
                    ) : (
                      <>
                        <option value="">Select Role</option>
                        {roles.map((r) => (
                          <option key={r.id || r.name} value={r.name}>
                            {r.name} {r.isPredefined ? '(System)' : '(Custom)'}
                          </option>
                        ))}
                      </>
                    )}
                  </Form.Select>
                  {!organization && (
                    <Form.Text className="text-secondary fs-12 mt-1 d-block">
                      Select an organization above to view its available roles.
                    </Form.Text>
                  )}
                </Form.Group>

                {/* Enabled Status */}
                <Form.Group className="mb-4">
                  <Form.Check
                    type="switch"
                    id="user-enabled-switch"
                    label={
                      <span className="fs-13 fw-semibold text-white">
                        Account Enabled ({status})
                      </span>
                    }
                    checked={status === 'ACTIVE'}
                    onChange={(e) => setStatus(e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                    disabled={saving}
                  />
                </Form.Group>
              </Col>

              {/* Right Column: Location Tree Assignment (Scoped to Selected Organization) */}
              <Col xs={12} lg={6}>
                <LocationTreeSelector
                  value={locationMappings}
                  onChange={setLocationMappings}
                  disabled={saving || !organization}
                  organizationId={organization}
                  organizationType={selectedOrgObj?.type}
                  organizationName={selectedOrgObj?.name}
                />
              </Col>
            </Row>

            {/* Bottom Action Buttons */}
            <div className="d-flex align-items-center gap-2.5 mt-4 pt-3 border-top border-secondary border-opacity-25">
              <button
                type="submit"
                className="btn d-inline-flex align-items-center justify-content-center px-4 py-2 fs-13 fw-semibold rounded-pill role-submit-btn"
                disabled={saving || !name.trim() || !email.trim() || !organization || !role}
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

      {/* Scoped Styles for UserFormView */}
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

export default UserFormView;
