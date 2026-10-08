import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { ArrowLeft, Save, Plus, Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import LocationTreeSelector from './LocationTreeSelector';
import PasswordInput from '../../../components/PasswordInput';
import { bmsService } from '../../../services/bmsService';

export const UserFormView = ({
  user = null, // if present, edit mode; if null, add mode
  defaultUserType = 'Administrator User',
  onBack,
  onSaved
}) => {
  const isEdit = Boolean(user && user.id);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState(user?.tenantId || '');
  const [userType, setUserType] = useState(defaultUserType || 'Administrator User');
  const [role, setRole] = useState(user?.role || 'ADMIN');
  const [roleId, setRoleId] = useState(user?.roleId || '');
  const [status, setStatus] = useState(user?.status || 'ACTIVE');
  const [zoneLocations, setZoneLocations] = useState(user?.zoneLocations || []);

  // Auxiliary data
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load roles & organizations
  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        setLoadingMeta(true);
        const [rolesRes, tenantsRes, companiesRes] = await Promise.allSettled([
          bmsService.getRoles(),
          bmsService.getTenants(),
          bmsService.getCompanies()
        ]);

        if (isMounted) {
          if (rolesRes.status === 'fulfilled') {
            const roleList = rolesRes.value?.data || (Array.isArray(rolesRes.value) ? rolesRes.value : []);
            setRoles(roleList);
          }

          const orgList = [];
          if (tenantsRes.status === 'fulfilled') {
            const tenants = tenantsRes.value?.data || (Array.isArray(tenantsRes.value) ? tenantsRes.value : []);
            tenants.forEach(t => orgList.push({ id: t.id, name: `${t.name || t.tenantName} (Tenant)` }));
          }
          if (companiesRes.status === 'fulfilled') {
            const companies = companiesRes.value?.data || (Array.isArray(companiesRes.value) ? companiesRes.value : []);
            companies.forEach(c => orgList.push({ id: c.id, name: `${c.name} (Company)` }));
          }
          setOrganizations(orgList);
          if (!organization && orgList.length > 0) {
            setOrganization(orgList[0].id);
          }
        }
      } catch (e) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };
    fetchMetadata();
    return () => { isMounted = false; };
  }, []);

  // Sync roleId when role selection changes
  const handleRoleChange = (selectedRoleName) => {
    setRole(selectedRoleName);
    const found = roles.find(r => r.name === selectedRoleName);
    if (found) {
      setRoleId(found.id);
    }
  };

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

    try {
      setSaving(true);
      setError(null);

      // Clean zoneLocations payload
      const cleanedLocations = (zoneLocations || []).map(loc => ({
        zoneNodeType: String(loc.zoneNodeType || 'SITE').toUpperCase(),
        zoneNodeId: String(loc.zoneNodeId || loc.id)
      }));

      if (isEdit) {
        const updatePayload = {
          name: name.trim(),
          email: email.trim(),
          role,
          roleId: roleId || undefined,
          status,
          tenantId: organization || undefined,
          zoneLocations: cleanedLocations
        };
        if (password && password.length >= 6) {
          updatePayload.password = password;
        }

        await bmsService.updateUser(user.id, updatePayload);
      } else {
        const createPayload = {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          roleId: roleId || undefined,
          tenantId: organization || undefined,
          zoneLocations: cleanedLocations
        };

        await bmsService.createUser(createPayload);
      }

      if (onSaved) onSaved();
    } catch (err) {
      setError(err?.message || 'Failed to save user. Verify email uniqueness or valid role/location selection.');
    } finally {
      setSaving(false);
    }
  };

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
            {isEdit ? `Edit User: ${user.name}` : `Add ${userType}`}
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
          <Form onSubmit={handleSubmit}>
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
                  />
                </Form.Group>

                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    Email <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={saving}
                    className="role-form-input"
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
                  >
                    <option value="Administrator User">Administrator User</option>
                    <option value="Installation User">Installation User</option>
                    <option value="Organisation User">Organisation User</option>
                  </Form.Select>
                </Form.Group>

                {/* Role */}
                <Form.Group className="mb-3">
                  <Form.Label className="fs-13 fw-semibold text-white mb-1.5">
                    Role <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={saving || loadingMeta}
                    className="role-form-input"
                    required
                  >
                    {roles.length === 0 ? (
                      <option value="ADMIN">ADMIN</option>
                    ) : (
                      roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} {r.isPredefined ? '(System)' : '(Custom)'}
                        </option>
                      ))
                    )}
                  </Form.Select>
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

              {/* Right Column: Location Tree Assignment */}
              <Col xs={12} lg={6}>
                <LocationTreeSelector
                  value={zoneLocations}
                  onChange={setZoneLocations}
                  disabled={saving}
                />
              </Col>
            </Row>

            {/* Bottom Action Buttons */}
            <div className="d-flex align-items-center gap-2.5 mt-4 pt-3 border-top border-secondary border-opacity-25">
              <button
                type="submit"
                className="btn d-inline-flex align-items-center justify-content-center px-4 py-2 fs-13 fw-semibold rounded-pill role-submit-btn"
                disabled={saving || !name.trim() || !email.trim()}
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
