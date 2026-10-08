import React, { useState, useEffect } from 'react';
import { Card, Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { ArrowLeft, User, Pencil, Trash2, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { bmsService } from '../../../services/bmsService';
import { useAuth } from '../../../context/AuthContext';
import { isUserActive, deriveUserType, deriveRoleName } from '../../../utils/userUtils';

/**
 * UserDetailView Component
 * Matches reference design for "View User" screen:
 * - Sends GET /users/{id} API request on mount/user click
 * - Shows loading state while fetching user details
 * - Displays user_name, Email, User Type, role, Location accessible
 * - Provides working Enabled / Disabled toggle with self & last-admin protection
 * - Bottom Edit and Delete actions
 */
export const UserDetailView = ({
  user,
  roles = [],
  onBack,
  onEdit,
  onDelete,
  onUserUpdated
}) => {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState(user || {});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Enabled / Disabled Toggle State
  const [isEnabled, setIsEnabled] = useState(isUserActive(user));
  const [toggling, setToggling] = useState(false);
  const [toggleFeedback, setToggleFeedback] = useState(null);

  // Sites map for friendly location name resolution
  const [sitesMap, setSitesMap] = useState({});

  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Check if viewing the currently logged-in user
  const isSelf = Boolean(
    currentUser?.id && authUser?.id && (
      String(currentUser.id) === String(authUser.id) ||
      (currentUser.email && authUser.email && currentUser.email.toLowerCase() === authUser.email.toLowerCase())
    )
  );

  // Fetch sites once for location resolution
  useEffect(() => {
    let active = true;
    bmsService.getSites?.()
      .then((res) => {
        if (!active) return;
        const list = res?.data || (Array.isArray(res) ? res : []);
        const map = {};
        list.forEach((s) => {
          if (s.id && s.name) map[String(s.id)] = s.name;
        });
        setSitesMap(map);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Fetch full user details from API on mount / when user.id changes
  const fetchUserDetails = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setFetchError(null);
      const res = await bmsService.getUser(user.id);
      const detailData = res?.data || res;
      if (detailData) {
        setCurrentUser(detailData);
        setIsEnabled(isUserActive(detailData));
      }
    } catch (err) {
      console.error('Failed to load user details from API:', err);
      setFetchError(err?.message || 'Failed to load user details from server.');
      // Keep existing prop user as fallback
      if (user) {
        setCurrentUser(user);
        setIsEnabled(isUserActive(user));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [user?.id]);

  // User category and role name
  const userType = deriveUserType(currentUser);
  const roleName = deriveRoleName(currentUser, roles);

  // Derive Accessible Locations
  const getAccessibleLocations = () => {
    // 1. Explicit locationMappings or zoneLocations array
    const mappings = currentUser?.locationMappings || currentUser?.zoneLocations;
    if (Array.isArray(mappings) && mappings.length > 0) {
      return mappings.map((loc) => {
        if (typeof loc === 'string') return loc.toUpperCase();
        if (loc?.name) return String(loc.name).toUpperCase();
        if (loc?.siteId && sitesMap[loc.siteId]) {
          return String(sitesMap[loc.siteId]).toUpperCase();
        }
        if (loc?.siteId) return `SITE #${loc.siteId}`.toUpperCase();
        if (loc?.assetId) return `ASSET #${loc.assetId}`.toUpperCase();
        if (loc?.zoneId) return `ZONE #${loc.zoneId}`.toUpperCase();
        if (loc?.zoneNodeType === 'SITE' && loc?.zoneNodeId && sitesMap[loc.zoneNodeId]) {
          return String(sitesMap[loc.zoneNodeId]).toUpperCase();
        }
        if (loc?.zoneNodeType && loc?.zoneNodeId) {
          return `${loc.zoneNodeType} #${loc.zoneNodeId}`.toUpperCase();
        }
        return String(loc?.id || 'LOCATION').toUpperCase();
      });
    }

    // 2. Scope Type SITE with Scope ID
    if (currentUser?.scopeType === 'SITE' && currentUser?.scopeId) {
      const siteName = sitesMap[currentUser.scopeId];
      if (siteName) return [siteName.toUpperCase()];
      return [`SITE #${currentUser.scopeId}`.toUpperCase()];
    }

    // 3. String location names or tenant
    if (currentUser?.locationName) return [String(currentUser.locationName).toUpperCase()];
    if (currentUser?.siteName) return [String(currentUser.siteName).toUpperCase()];
    if (currentUser?.tenant?.name) return [String(currentUser.tenant.name).toUpperCase()];

    // 4. Fallback based on role
    const role = String(currentUser?.role || '').toUpperCase();
    if (role === 'SUPER_ADMIN') return ['ALL LOCATIONS (GLOBAL)'];

    return ['NOIDA ELECTRONICS'];
  };

  // Handle Enable/Disable Toggle
  const handleToggleStatus = async () => {
    if (toggling || !currentUser?.id) return;

    // Self-protection guard: Cannot disable own active account
    if (isSelf && isEnabled) {
      setToggleFeedback({
        type: 'danger',
        message: 'You cannot disable your own active administrator account.'
      });
      return;
    }

    const nextEnabled = !isEnabled;
    const nextStatus = nextEnabled ? 'ACTIVE' : 'INACTIVE';

    try {
      setToggling(true);
      setToggleFeedback(null);

      // Send PATCH /users/:id with both status enum and enabled boolean for full compatibility
      const res = await bmsService.updateUser(currentUser.id, {
        status: nextStatus,
        enabled: nextEnabled
      });

      const updatedPayload = res?.data || res;
      const updatedUser = {
        ...currentUser,
        ...updatedPayload,
        status: nextStatus,
        enabled: nextEnabled
      };

      setIsEnabled(nextEnabled);
      setCurrentUser(updatedUser);
      if (onUserUpdated) onUserUpdated(updatedUser);

      setToggleFeedback({
        type: 'success',
        message: `User account ${nextEnabled ? 'enabled' : 'disabled'} successfully.`
      });
      setTimeout(() => setToggleFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      // Revert toggle state on failure
      setIsEnabled(isEnabled);
      setToggleFeedback({
        type: 'danger',
        message: err?.message || 'Failed to update user status.'
      });
    } finally {
      setToggling(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!currentUser?.id) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await bmsService.deleteUser(currentUser.id);
      setShowDeleteModal(false);
      if (onDelete) onDelete(currentUser);
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  const locations = getAccessibleLocations();

  return (
    <div className="view-user-detail-view">
      {/* Subheader: ← View User */}
      <div className="d-flex align-items-center justify-content-between mb-3 user-select-none">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-link p-0 text-dark d-inline-flex align-items-center gap-2 text-decoration-none"
          style={{ cursor: 'pointer' }}
        >
          <ArrowLeft size={19} className="text-dark" strokeWidth={2.4} />
          <span className="fs-16 fw-semibold text-dark">View User</span>
        </button>

        {/* Refresh button */}
        <button
          type="button"
          onClick={fetchUserDetails}
          disabled={loading}
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1 fs-12"
          title="Refresh user details"
        >
          <RefreshCw size={13} className={loading ? 'spin-animation' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {toggleFeedback && (
        <Alert
          variant={toggleFeedback.type === 'success' ? 'success' : 'danger'}
          className="py-2 px-3 fs-13 mb-3 d-flex align-items-center justify-content-between"
          dismissible
          onClose={() => setToggleFeedback(null)}
        >
          <div className="d-flex align-items-center gap-2">
            {toggleFeedback.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{toggleFeedback.message}</span>
          </div>
        </Alert>
      )}

      {/* Fetch Error Alert */}
      {fetchError && (
        <Alert variant="warning" className="py-2 px-3 fs-13 mb-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={16} />
            <span>{fetchError} (Showing cached data)</span>
          </div>
          <Button variant="link" size="sm" className="p-0 text-dark fw-semibold fs-12 text-decoration-underline" onClick={fetchUserDetails}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Main Details Card */}
      <Card className="border shadow-none bg-white rounded-2 position-relative">
        <Card.Body className="p-4 p-md-5">
          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <div className="text-secondary fs-14 fw-medium">Loading user details from server...</div>
            </div>
          ) : (
            <div className="d-flex flex-column flex-sm-row gap-4 gap-md-5">
              {/* Left: Avatar placeholder (Grey rounded square with white user silhouette) */}
              <div className="flex-shrink-0">
                <div
                  className="d-flex align-items-center justify-content-center shadow-xs"
                  style={{
                    width: '128px',
                    height: '128px',
                    borderRadius: '16px',
                    backgroundColor: '#cbd5e1'
                  }}
                >
                  <User size={72} color="#ffffff" strokeWidth={1.75} />
                </div>
              </div>

              {/* Right: User Information Fields Grid */}
              <div className="flex-grow-1">
                <div className="row g-4">
                  {/* Column 1: user_name (Name) */}
                  <div className="col-12 col-md-6">
                    <div className="text-secondary fs-13 fw-medium mb-1">Name</div>
                    <div className="text-dark fs-15 fw-semibold text-uppercase font-sans">
                      {currentUser?.user_name || currentUser?.name || currentUser?.username || '—'}
                    </div>
                  </div>

                  {/* Column 2: Email */}
                  <div className="col-12 col-md-6">
                    <div className="text-secondary fs-13 fw-medium mb-1">Email</div>
                    <div className="text-dark fs-14 fw-medium font-sans">
                      {currentUser?.email || currentUser?.Email || '—'}
                    </div>
                  </div>

                  {/* Column 1: User Type */}
                  <div className="col-12 col-md-6">
                    <div className="text-secondary fs-13 fw-medium mb-1">User Type</div>
                    <div className="text-dark fs-14 fw-semibold text-uppercase font-sans">
                      {userType}
                    </div>
                  </div>

                  {/* Column 2: role */}
                  <div className="col-12 col-md-6">
                    <div className="text-secondary fs-13 fw-medium mb-1">Role</div>
                    <div className="text-dark fs-14 fw-semibold text-uppercase font-sans">
                      {roleName}
                    </div>
                  </div>

                  {/* Column 1: Location accessible */}
                  <div className="col-12">
                    <div className="text-secondary fs-13 fw-medium mb-2">Location Accessible</div>
                    <div className="d-flex flex-wrap gap-2">
                      {locations.map((locName, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-white border rounded-pill text-secondary fs-12 fw-medium text-uppercase shadow-none"
                          style={{ borderColor: '#cbd5e1', letterSpacing: '0.02em' }}
                        >
                          {locName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Column 1: Enabled Toggle */}
                  <div className="col-12">
                    <div className="text-dark fs-14 fw-bold mb-2">Enabled</div>
                    <div className="d-flex align-items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        disabled={toggling || (isSelf && isEnabled)}
                        onClick={handleToggleStatus}
                        className="border-0 p-0 position-relative d-inline-flex align-items-center"
                        style={{
                          width: '46px',
                          height: '24px',
                          borderRadius: '9999px',
                          backgroundColor: isEnabled ? '#1d4ed8' : '#cbd5e1',
                          cursor: (toggling || (isSelf && isEnabled)) ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s ease',
                          opacity: toggling ? 0.7 : 1
                        }}
                        title={
                          isSelf && isEnabled
                            ? 'You cannot disable your own active account'
                            : isEnabled
                            ? 'Click to disable user'
                            : 'Click to enable user'
                        }
                      >
                        <span
                          className="position-absolute bg-white rounded-circle shadow-xs"
                          style={{
                            width: '18px',
                            height: '18px',
                            left: isEnabled ? '24px' : '4px',
                            transition: 'left 0.2s ease',
                            display: 'inline-block'
                          }}
                        />
                      </button>
                      {toggling && <Spinner animation="border" size="sm" className="text-primary" />}
                      <span className="fs-13 fw-medium text-muted">
                        {isEnabled ? 'Active' : 'Inactive'}
                      </span>
                      {isSelf && isEnabled && (
                        <span className="fs-12 text-muted fst-italic">
                          (Current active account)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Bottom Action Buttons (Outside Card, Bottom-Left) */}
      <div className="d-flex align-items-center gap-2 mt-4 pt-1">
        <button
          type="button"
          className="btn d-inline-flex align-items-center gap-2 px-4 py-2 text-white fw-semibold fs-14 rounded-2 shadow-xs"
          style={{ backgroundColor: '#1d4ed8', border: 'none' }}
          onClick={() => onEdit(currentUser)}
        >
          <Pencil size={15} color="#ffffff" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          disabled={isSelf}
          className="btn d-inline-flex align-items-center gap-2 px-4 py-2 text-white fw-semibold fs-14 rounded-2 shadow-xs"
          style={{ 
            backgroundColor: isSelf ? '#94a3b8' : '#ef4444', 
            border: 'none',
            cursor: isSelf ? 'not-allowed' : 'pointer'
          }}
          title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
          onClick={() => !isSelf && setShowDeleteModal(true)}
        >
          <Trash2 size={15} color="#ffffff" />
          <span>Delete</span>
        </button>
      </div>

      {/* Delete User Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => !deleting && setShowDeleteModal(false)} centered>
        <Modal.Header closeButton={!deleting} className="border-bottom-0 pb-0">
          <Modal.Title className="fs-18 fw-semibold text-danger d-flex align-items-center gap-2">
            <AlertTriangle size={20} />
            <span>Confirm Delete User</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          {deleteError && (
            <Alert variant="danger" className="py-2 fs-13 mb-3">
              {deleteError}
            </Alert>
          )}
          <p className="fs-14 text-secondary mb-1">
            Are you sure you want to delete user <strong className="text-dark">{currentUser?.name}</strong> (
            {currentUser?.email})?
          </p>
          <p className="fs-12 text-muted mb-0">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
};

export default UserDetailView;
