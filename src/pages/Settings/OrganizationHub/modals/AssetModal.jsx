import React from 'react';
import { Sliders } from 'lucide-react';
import UnifiedRegisterModal from '../../../../components/common/UnifiedRegisterModal';

const AssetModal = ({
  show,
  onHide,
  editingAsset,
  assetForm,
  setAssetForm,
  handleSaveAsset,
  activeSites = [],
  assets = [],
  loading
}) => {
  const fields = [
    {
      key: 'siteId',
      label: 'Target Site',
      type: 'select',
      placeholder: 'Select Target Site...',
      required: true,
      disabled: !!editingAsset,
      options: activeSites.map(s => ({ value: s.id, label: `${s.name} (ID: ${s.id})` })),
      colSpan: 12
    },
    {
      key: 'name',
      label: 'Asset Name',
      type: 'text',
      placeholder: 'e.g. Main Chiller 01',
      required: true,
      colSpan: 6
    },
    {
      key: 'assetType',
      label: 'Asset Type',
      type: 'select',
      required: true,
      options: [
        { value: 'BUILDING', label: 'BUILDING' },
        { value: 'FLOOR', label: 'FLOOR' },
        { value: 'ROOM', label: 'ROOM' },
        { value: 'EQUIPMENT', label: 'EQUIPMENT' },
        { value: 'HVAC', label: 'HVAC' },
        { value: 'PUMP', label: 'PUMP' },
        { value: 'PANEL', label: 'PANEL' },
        { value: 'METER', label: 'METER' },
        { value: 'GENERATOR', label: 'GENERATOR' },
        { value: 'OTHER', label: 'OTHER' }
      ],
      colSpan: 6
    },
    {
      key: 'parentAssetId',
      label: 'Parent Asset (Optional)',
      type: 'select',
      placeholder: '-- None (Root Asset) --',
      disabled: !!editingAsset,
      options: assets.filter(a => a.id !== editingAsset?.id).map(a => ({
        value: a.id,
        label: `${a.name} (${a.assetType}) [ID: ${a.id}]`
      })),
      colSpan: 12
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Asset description...',
      rows: 2,
      colSpan: 12
    }
  ];

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={editingAsset ? 'Edit Asset' : 'Add Asset'}
      subtitle={editingAsset ? `ID: ${editingAsset.id}` : 'Create physical or functional asset'}
      icon={Sliders}
      fields={fields}
      formData={assetForm}
      onChange={(key, val) => setAssetForm(prev => ({ ...prev, [key]: val }))}
      onSubmit={handleSaveAsset}
      submitting={loading}
      submitLabel={editingAsset ? 'Update Asset' : 'Create Asset'}
      submittingLabel={editingAsset ? 'Updating...' : 'Creating...'}
    />
  );
};

export default AssetModal;
