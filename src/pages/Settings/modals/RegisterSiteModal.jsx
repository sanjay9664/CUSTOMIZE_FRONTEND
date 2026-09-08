import React from 'react';
import { Building2, Edit3 } from 'lucide-react';
import UnifiedRegisterModal from '../../../components/common/UnifiedRegisterModal';
import { DEFAULT_SITE_TEMPLATES, DEFAULT_SITE_FEATURES } from '../../../components/common/CustomFieldsTemplate';

/**
 * Common field schema generator for Site registration and editing.
 */
export const getSiteFormFields = ({
  tenants = [],
  zones = [],
  areas = [],
  formData = {},
  isEdit = false
}) => {
  // Ensure current formData values are present in options even if not yet in fetched lists
  const tenantOptions = [...tenants.map(t => ({ value: t.id, label: `${t.name}` }))];
  if (formData.tenantId && !tenantOptions.some(opt => String(opt.value) === String(formData.tenantId))) {
    tenantOptions.unshift({
      value: formData.tenantId,
      label: formData.tenant?.name || formData.tenantName || `Organization (${formData.tenantId})`
    });
  }

  const filteredZones = zones.filter(z => !formData.tenantId || String(z.tenantId) === String(formData.tenantId));
  const zoneOptions = [...filteredZones.map(z => ({ value: z.id, label: z.name }))];
  if (formData.zoneId && !zoneOptions.some(opt => String(opt.value) === String(formData.zoneId))) {
    const matchedZone = zones.find(z => String(z.id) === String(formData.zoneId));
    zoneOptions.unshift({
      value: formData.zoneId,
      label: matchedZone ? matchedZone.name : (formData.zone?.name || formData.zoneName || `Zone (${formData.zoneId})`)
    });
  }

  const filteredAreas = areas.filter(a => !formData.zoneId || String(a.zoneId) === String(formData.zoneId));
  const areaOptions = [...filteredAreas.map(a => ({ value: a.id, label: a.name }))];
  if (formData.areaId && !areaOptions.some(opt => String(opt.value) === String(formData.areaId))) {
    const matchedArea = areas.find(a => String(a.id) === String(formData.areaId));
    areaOptions.unshift({
      value: formData.areaId,
      label: matchedArea ? matchedArea.name : (formData.areaRef?.name || formData.areaName || `Area (${formData.areaId})`)
    });
  }

  return [
    {
      key: 'hierarchy',
      type: 'hierarchy',
      label: 'Location Hierarchy',
      required: true,
      colSpan: 12,
      options: [
        {
          key: 'tenantId',
          label: 'Organization',
          placeholder: 'Select Organization...',
          required: true,
          colSpan: 4,
          options: tenantOptions,
          onChange: (val, form, setField) => {
            setField('zoneId', '');
            setField('areaId', '');
          }
        },
        {
          key: 'zoneId',
          label: 'Geographic Zone',
          placeholder: 'Select Zone...',
          colSpan: 4,
          options: zoneOptions,
          onChange: (val, form, setField) => {
            setField('areaId', '');
          }
        },
        {
          key: 'areaId',
          label: 'Sub-Zone / Area',
          placeholder: 'Select Area...',
          colSpan: 4,
          options: areaOptions
        }
      ]
    },
    {
      key: 'name',
      label: 'Site Name',
      type: 'text',
      placeholder: 'Enter physical site or campus name...',
      required: true,
      colSpan: 6
    },
    {
      key: 'showSochiotLogo',
      label: 'Show Sochiot Logo',
      type: 'switch',
      colSpan: 3
    },
    {
      key: 'logoUrl',
      label: 'Upload Site Logo',
      type: 'imageUpload',
      colSpan: 3
    },
    {
      key: 'contacts',
      label: 'Site Contacts',
      type: 'contacts',
      colSpan: 12,
      // helpText: 'Add primary facility managers or emergency contacts with Name, Phone, and Email.'
    },
    {
      key: 'address',
      label: 'Physical Address',
      type: 'textarea',
      placeholder: 'Enter base address (street, plot/building number, landmark)...',
      rows: 2,
      colSpan: 12
    },
    {
      key: 'showExtendedAddress',
      label: 'Detailed Location',
      type: 'switch',
      alignLeft: true,
      switchLabel: (val) => val ? 'Add detailed address & GPS ' : 'Add more details',
      colSpan: 12
    },
    ...(formData.showExtendedAddress ? [
      {
        key: 'city',
        label: 'City',
        type: 'text',
        placeholder: 'e.g. Noida',
        colSpan: 4
      },
      {
        key: 'state',
        label: 'State / Province',
        type: 'text',
        placeholder: 'e.g. Uttar Pradesh',
        colSpan: 4
      },
      {
        key: 'pincode',
        label: 'Pincode / Postal Code',
        type: 'text',
        placeholder: 'e.g. 201301',
        colSpan: 4
      },
      {
        key: 'latitude',
        label: 'Latitude (-90 to 90)',
        type: 'number',
        placeholder: 'e.g. 28.5355',
        min: -90,
        max: 90,
        step: 'any',
        colSpan: 6,
        helpText: 'GPS Latitude between -90 and 90'
      },
      {
        key: 'longitude',
        label: 'Longitude (-180 to 180)',
        type: 'number',
        placeholder: 'e.g. 77.3910',
        min: -180,
        max: 180,
        step: 'any',
        colSpan: 6,
        helpText: 'GPS Longitude between -180 and 180'
      }
    ] : []),
    {
      key: 'timezone',
      label: 'Time Zone',
      type: 'select',
      placeholder: 'Select Time Zone...',
      colSpan: 6,
      options: [
        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+05:30)' },
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
        { value: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+04:00)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+08:00)' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT, UTC+07:00)' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+09:00)' },
        { value: 'Europe/London', label: 'Europe/London (GMT/BST, UTC+00/01)' },
        { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST, UTC+01/02)' },
        { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST, UTC+01/02)' },
        { value: 'America/New_York', label: 'America/New_York (EST/EDT, UTC-05/04)' },
        { value: 'America/Chicago', label: 'America/Chicago (CST/CDT, UTC-06/05)' },
        { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT, UTC-08/07)' },
        { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST, UTC+10:00)' }
      ],
      // helpText: 'Default: Asia/Kolkata'
    },
    {
      key: 'isActive',
      label: 'Operational Status',
      type: 'switch',
      alignLeft: true,
      switchLabel: (val) => (val !== false ? 'Active (Enabled)' : 'Inactive (Disabled)'),
      defaultChecked: true,
      colSpan: 6,
      // helpText: 'Controls whether site sensors & assets are actively tracked'
    },
    {
      key: 'selectedTemplates',
      label: 'Select BMS Templates',
      type: 'templateSelector',
      colSpan: 6,
      options: DEFAULT_SITE_TEMPLATES
    },
    {
      key: 'selectedFeatures',
      label: 'Select Features',
      type: 'featureSelector',
      colSpan: 6,
      options: DEFAULT_SITE_FEATURES
    }
  ];
};

/**
 * RegisterSiteModal - Built using project-wide UnifiedRegisterModal
 * Supports both Create and Edit mode with 100% schema parity.
 */
const RegisterSiteModal = ({
  show,
  onHide,
  createForm,
  formData,
  setCreateForm,
  setFormData,
  handleCreateSite,
  onSubmit,
  tenants = [],
  zones = [],
  areas = [],
  submitting = false,
  error = null,
  isEdit = false,
  title,
  subtitle,
  submitLabel,
  submittingLabel
}) => {
  // Support either naming convention for backward compatibility
  const activeFormData = formData || createForm || {};
  const activeSetFormData = setFormData || setCreateForm || (() => {});
  const activeSubmitHandler = onSubmit || handleCreateSite || (() => {});

  const siteFields = getSiteFormFields({
    tenants,
    zones,
    areas,
    formData: activeFormData,
    isEdit
  });

  const handleFieldChange = (key, val) => {
    activeSetFormData(prev => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={title || (isEdit ? 'Edit Site Configuration' : 'Site Registration')}
      subtitle={subtitle || (isEdit ? (activeFormData.name || 'Update site parameters') : 'Configure physical site and BMS bindings')}
      icon={isEdit ? Edit3 : Building2}
      fields={siteFields}
      formData={activeFormData}
      onChange={handleFieldChange}
      onSubmit={activeSubmitHandler}
      submitting={submitting}
      error={error}
      submitLabel={submitLabel || (isEdit ? 'Save Changes' : 'Create Site')}
      submittingLabel={submittingLabel || (isEdit ? 'Saving Changes...' : 'Creating Site...')}
    />
  );
};

export default RegisterSiteModal;
