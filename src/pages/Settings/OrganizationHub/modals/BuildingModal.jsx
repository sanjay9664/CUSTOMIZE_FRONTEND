import React from 'react';
import { Building } from 'lucide-react';
import UnifiedRegisterModal from '../../../../components/common/UnifiedRegisterModal';

const BuildingModal = ({
  show,
  onHide,
  editingBuilding,
  buildingForm,
  setBuildingForm,
  sites = [],
  selectedBuildingSiteId,
  onSubmit,
  loading
}) => {
  const activeSites = sites.filter(s => s.status !== 'INACTIVE' && s.status !== 'DISABLED' && !s.deletedAt);

  const fields = [
    {
      key: 'siteId',
      label: 'Physical Parent Site',
      type: 'select',
      placeholder: 'Select Physical Parent Site...',
      required: true,
      disabled: !!editingBuilding,
      options: activeSites.map(s => ({ value: s.id, label: `${s.name} (Site #${s.id})` })),
      colSpan: 12
    },
    {
      key: 'name',
      label: 'Building Name',
      type: 'text',
      placeholder: 'e.g. Tower A / Executive Block',
      required: true,
      colSpan: 6
    },
    {
      key: 'code',
      label: 'Building Code / Identifier',
      type: 'text',
      placeholder: 'e.g. BLD-TOW-01',
      colSpan: 6
    },
    {
      key: 'totalFloors',
      label: 'Total Floors',
      type: 'number',
      required: true,
      colSpan: 6
    },
    {
      key: 'displayOrder',
      label: 'Display Order',
      type: 'number',
      colSpan: 6
    },
    {
      key: 'description',
      label: 'Description & Notes',
      type: 'textarea',
      placeholder: 'Additional facility details or occupancy notes',
      rows: 2,
      colSpan: 12
    },
    {
      key: 'isActive',
      label: 'Operational Status (Active)',
      type: 'switch',
      colSpan: 12,
      helpText: 'Enable or disable telemetry polling for this structure'
    }
  ];

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={editingBuilding ? 'Edit Building Profile' : 'Add Physical Building'}
      subtitle={editingBuilding ? `ID: ${editingBuilding.id}` : 'Provision building infrastructure scoped under physical site'}
      icon={Building}
      fields={fields}
      formData={buildingForm}
      onChange={(key, val) => setBuildingForm(prev => ({ ...prev, [key]: val }))}
      onSubmit={onSubmit}
      submitting={loading}
      submitLabel={editingBuilding ? 'Update Building' : 'Create Building'}
      submittingLabel={editingBuilding ? 'Updating...' : 'Creating...'}
    />
  );
};

export default BuildingModal;
