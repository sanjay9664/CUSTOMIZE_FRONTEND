import React, { useMemo } from 'react';
import { Sliders } from 'lucide-react';
import UnifiedRegisterModal from '../../../components/common/UnifiedRegisterModal';

// OpenAPI AssetType and AssetStatus enums
export const ASSET_TYPES = [
  { value: 'BUILDING', label: 'BUILDING (Facility / Structure)' },
  { value: 'FLOOR', label: 'FLOOR (Level / Story)' },
  { value: 'AREA', label: 'AREA (Zone / Wing / Section)' },
  { value: 'ROOM', label: 'ROOM (Enclosed Space / Office)' },
  { value: 'CUBICLE', label: 'CUBICLE (Desk / Workstation)' },
  { value: 'EQUIPMENT', label: 'EQUIPMENT (Machinery / Unit)' },
  { value: 'MACHINE', label: 'MACHINE (Production / Mechanical)' },
  { value: 'LINE', label: 'LINE (Assembly / Distribution)' },
  { value: 'PANEL', label: 'PANEL (Electrical / Control Panel)' },
  { value: 'DG', label: 'DG (Diesel Generator Set)' },
  { value: 'LT_ROOM', label: 'LT_ROOM (Low Tension Switchgear)' },
  { value: 'PUMP_ROOM', label: 'PUMP_ROOM (Hydraulic / Fire Pump)' },
  { value: 'OTHER', label: 'OTHER (Uncategorized Asset)' }
];

export const ASSET_STATUSES = [
  { value: 'ACTIVE', label: 'ACTIVE (Operational)' },
  { value: 'INACTIVE', label: 'INACTIVE (Offline / Decommissioned)' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE (Under Service)' }
];

const RegisterAssetModal = ({
  show = false,
  onHide = () => {},
  editingAsset = null,
  assetForm = {},
  setAssetForm = () => {},
  handleSaveAsset = () => {},
  sites = [],
  assets = [],
  submitting = false,
  error = null
}) => {
  // Find all descendant IDs of the editingAsset to prevent circular hierarchy
  const descendantIds = useMemo(() => {
    if (!editingAsset?.id) return new Set();
    const descendants = new Set();
    const queue = [String(editingAsset.id)];

    while (queue.length > 0) {
      const currentId = queue.shift();
      assets.forEach(a => {
        const parent = String(a.parentId || a.parentAssetId || '');
        if (parent === currentId && !descendants.has(String(a.id))) {
          descendants.add(String(a.id));
          queue.push(String(a.id));
        }
      });
    }
    return descendants;
  }, [editingAsset, assets]);

  // Filter valid parent assets:
  // 1. Must belong to the same site
  // 2. Cannot be the asset itself
  // 3. Cannot be any of the asset's descendants (cycle prevention)
  const currentSiteId = assetForm.siteId;
  const parentAssetOptions = useMemo(() => {
    return assets
      .filter(a => {
        if (!a || !a.id) return false;
        const aId = String(a.id);
        if (editingAsset && aId === String(editingAsset.id)) return false;
        if (descendantIds.has(aId)) return false;
        if (currentSiteId && a.siteId && String(a.siteId) !== String(currentSiteId)) return false;
        return true;
      })
      .map(a => ({
        value: a.id,
        label: `${a.name} (${a.assetType || 'EQUIPMENT'})`
      }));
  }, [assets, editingAsset, descendantIds, currentSiteId]);

  // Site options
  const siteOptions = sites.map(s => ({
    value: s.id,
    label: `${s.name} (ID: ${s.id})`
  }));

  const fields = [
    // Section 1: Location & Parent Hierarchy
    {
      key: 'siteId',
      label: 'Site / Location',
      type: 'select',
      placeholder: 'Select physical site...',
      required: true,
      disabled: Boolean(editingAsset),
      options: siteOptions,
      colSpan: 6
    },
    {
      key: 'isChildAsset',
      label: 'Is Child Asset?',
      type: 'switch',
      alignLeft: true,
      switchLabel: assetForm?.isChildAsset ? 'Yes (Sub-Asset)' : 'No (Root Asset)',
      colSpan: 6
    },
    ...(assetForm?.isChildAsset ? [{
      key: 'parentId',
      label: 'Parent Asset (Hierarchy Parent)',
      type: 'select',
      placeholder: parentAssetOptions.length === 0
        ? '-- No valid parent assets in this site --'
        : '-- Select Parent Asset (Building, Floor, Room, etc.) --',
      required: true,
      options: parentAssetOptions,
      colSpan: 12
    }] : []),

    // Section 2: Asset Identification
    {
      key: 'name',
      label: 'Asset Name',
      type: 'text',
      placeholder: 'e.g., AHU-01, Pump Room 2, Floor 3, Main Building',
      required: true,
      colSpan: 6
    },
    {
      key: 'assetType',
      label: 'Asset Type',
      type: 'select',
      required: true,
      options: ASSET_TYPES,
      colSpan: 6
    },
    {
      key: 'status',
      label: 'Operational Status',
      type: 'select',
      required: true,
      options: ASSET_STATUSES,
      colSpan: 6
    },
    {
      key: 'order',
      label: 'Display Order / Index',
      type: 'number',
      placeholder: '0',
      colSpan: 6
    },
    {
      key: 'description',
      label: 'Description / Purpose',
      type: 'textarea',
      placeholder: 'Detailed function, physical location notes, or operational parameters...',
      rows: 2,
      colSpan: 12
    },

    // Section 3: Technical Specifications & Identification
    {
      key: 'serialNumber',
      label: 'Serial Number / Asset Tag',
      type: 'text',
      placeholder: 'e.g. SN-8829-X',
      colSpan: 6
    },
    {
      key: 'firmware',
      label: 'Firmware / Model Spec',
      type: 'text',
      placeholder: 'e.g. v2.4.1 or BACnet-IP-400',
      colSpan: 6
    },

    // Section 4: Service & Field Calibration
    {
      key: 'installDate',
      label: 'Installation Date',
      type: 'date',
      colSpan: 4
    },
    {
      key: 'installBy',
      label: 'Installed By (Vendor / Engineer)',
      type: 'text',
      placeholder: 'Technician / Organization',
      colSpan: 4
    },
    {
      key: 'lastVisitDate',
      label: 'Last Inspection / Service Date',
      type: 'date',
      colSpan: 4
    }
  ];

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={editingAsset ? 'Edit Asset Configuration' : 'Register New Asset'}
      subtitle={editingAsset ? `Asset ID: ${editingAsset.id} • ${editingAsset.name}` : 'Configure physical asset hierarchy in compliance with BMS OpenAPI 3.0'}
      icon={Sliders}
      fields={fields}
      formData={assetForm}
      onChange={(key, val) => {
        setAssetForm(prev => {
          const next = { ...prev, [key]: val };
          if (key === 'isChildAsset' && !val) {
            next.parentId = '';
            next.parentAssetId = '';
          }
          if (key === 'siteId') {
            next.parentId = '';
            next.parentAssetId = '';
          }
          return next;
        });
      }}
      onSubmit={handleSaveAsset}
      submitting={submitting}
      error={error}
      submitLabel={editingAsset ? 'Save Changes' : 'Create Asset'}
      submittingLabel={editingAsset ? 'Saving Changes...' : 'Creating Asset...'}
      maxWidth="860px"
    />
  );
};

export default RegisterAssetModal;
