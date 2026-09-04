import React from 'react';
import { Grid } from 'lucide-react';
import UnifiedRegisterModal from '../../../../components/common/UnifiedRegisterModal';

const AreaModal = ({
  show,
  onHide,
  editingArea,
  areaForm,
  setAreaForm,
  tenants = [],
  zones = [],
  onSubmit,
  loading
}) => {
  const activeTenants = tenants.filter(t => t.status !== 'INACTIVE' && !t.deletedAt);
  const filteredZones = zones.filter(z => !areaForm.tenantId || String(z.tenantId) === String(areaForm.tenantId));

  const fields = [
    {
      key: 'tenantId',
      label: 'Organization',
      type: 'select',
      placeholder: 'Select Organization...',
      options: activeTenants.map(t => ({ value: t.id, label: t.name })),
      colSpan: 6
    },
    {
      key: 'zoneId',
      label: 'Parent Zone',
      type: 'select',
      placeholder: 'Select Zone...',
      required: true,
      options: filteredZones.map(z => ({ value: z.id, label: z.name })),
      colSpan: 6
    },
    {
      key: 'name',
      label: 'Area Name',
      type: 'text',
      placeholder: 'e.g. Server Room A / Basement Floor',
      required: true,
      colSpan: 12
    },
    {
      key: 'description',
      label: 'Description / Function',
      type: 'textarea',
      placeholder: 'Specific room occupancy, floor area or HVAC zone notes',
      rows: 2,
      colSpan: 12
    }
  ];

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={editingArea ? 'Edit Area / Space' : 'Add Area / Space'}
      subtitle={editingArea ? `ID: ${editingArea.id}` : 'Create a specific physical or operational area inside a zone'}
      icon={Grid}
      fields={fields}
      formData={areaForm}
      onChange={(key, val) => setAreaForm(prev => ({ ...prev, [key]: val }))}
      onSubmit={onSubmit}
      submitting={loading}
      submitLabel={editingArea ? 'Update Area' : 'Create Area'}
      submittingLabel={editingArea ? 'Updating...' : 'Creating...'}
    />
  );
};

export default AreaModal;
