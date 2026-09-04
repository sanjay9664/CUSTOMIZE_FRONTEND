import React from 'react';
import { Layers } from 'lucide-react';
import UnifiedRegisterModal from '../../../../components/common/UnifiedRegisterModal';

const ZoneModal = ({
  show,
  onHide,
  editingZone,
  zoneForm,
  setZoneForm,
  tenants = [],
  onSubmit,
  loading
}) => {
  const activeTenants = tenants.filter(t => t.status !== 'INACTIVE' && !t.deletedAt);

  const fields = [
    {
      key: 'tenantId',
      label: 'Organization (Tenant)',
      type: 'select',
      placeholder: 'Select Organization...',
      required: true,
      options: activeTenants.map(t => ({ value: t.id, label: t.name })),
      colSpan: 12
    },
    {
      key: 'name',
      label: 'Zone Name',
      type: 'text',
      placeholder: 'e.g. North Zone / Tower Zone',
      required: true,
      colSpan: 12
    },
    {
      key: 'region',
      label: 'Region / Description',
      type: 'text',
      placeholder: 'e.g. Delhi NCR / Floor 1-5',
      colSpan: 12
    }
  ];

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={editingZone ? 'Edit Zone' : 'Add New Zone'}
      subtitle={editingZone ? `ID: ${editingZone.id}` : 'Create a regional zone scoped under an organization'}
      icon={Layers}
      fields={fields}
      formData={zoneForm}
      onChange={(key, val) => setZoneForm(prev => ({ ...prev, [key]: val }))}
      onSubmit={onSubmit}
      submitting={loading}
      submitLabel={editingZone ? 'Update Zone' : 'Create Zone'}
      submittingLabel={editingZone ? 'Updating...' : 'Creating...'}
    />
  );
};

export default ZoneModal;
