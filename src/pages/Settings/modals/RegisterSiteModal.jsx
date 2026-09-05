import React from 'react';
import { Building2 } from 'lucide-react';
import UnifiedRegisterModal from '../../../components/common/UnifiedRegisterModal';
import { DEFAULT_SITE_TEMPLATES, DEFAULT_SITE_FEATURES } from '../../../components/common/CustomFieldsTemplate';

/**
 * RegisterSiteModal - Built using the project-wide UnifiedRegisterModal
 * Passes site/company specific field schema declaratively via props.
 */
const RegisterSiteModal = ({
  show,
  onHide,
  createForm = {},
  setCreateForm = () => {},
  handleCreateSite = () => {},
  tenants = [],
  zones = [],
  areas = [],
  submitting = false,
  error = null
}) => {
  // Declarative fields configuration for Site / Company registration
  const siteFields = [
    {
      key: 'hierarchy',
      type: 'hierarchy',
      label: 'Location',
      required: true,
      colSpan: 12,
      options: [
        {
          key: 'tenantId',
          label: 'Organization',
          placeholder: 'Select Organization...',
          required: true,
          colSpan: 4,
          options: tenants.map(t => ({
            value: t.id,
            label: `${t.name} (${t.subscription || 'Tenant'})`
          })),
          onChange: (val, form, setField) => {
            const selTenant = tenants.find(t => String(t.id) === String(val));
            setField('organizationId', selTenant?.sochiotOrgId || 1);
            setField('zoneId', '');
            setField('areaId', '');
          }
        },
        {
          key: 'zoneId',
          label: 'Zone',
          placeholder: 'Select Zone...',
          colSpan: 4,
          options: zones
            .filter(z => !createForm.tenantId || String(z.tenantId) === String(createForm.tenantId))
            .map(z => ({ value: z.id, label: z.name })),
          onChange: (val, form, setField) => {
            setField('areaId', '');
          }
        },
        {
          key: 'areaId',
          label: 'Area',
          placeholder: 'Select Area...',
          colSpan: 4,
          options: areas
            .filter(a => !createForm.zoneId || String(a.zoneId) === String(createForm.zoneId))
            .map(a => ({ value: a.id, label: a.name }))
        }
      ]
    },
    {
      key: 'name',
      label: 'Site name',
      type: 'text',
      placeholder: 'Site name',
      required: true,
      colSpan: 6
    },
    {
      key: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Address',
      rows: 1,
      colSpan: 6
    },
    {
      key: 'contactEmails',
      label: 'Contact emails',
      type: 'emailTags',
      placeholder: 'Please input email and hit enter to add',
      helpText: 'Please input email and hit enter to add',
      colSpan: 6
    },
    {
      key: 'showSochiotLogo',
      label: 'Show sochiot Logo',
      type: 'switch',
      colSpan: 3
    },
    {
      key: 'logoUrl',
      label: 'Upload logo',
      type: 'imageUpload',
      colSpan: 3
    },
    {
      key: 'selectedTemplates',
      label: 'Select Template',
      type: 'templateSelector',
      colSpan: 6,
      options: DEFAULT_SITE_TEMPLATES
    },
    {
      key: 'selectedFeatures',
      label: 'Select Feature',
      type: 'featureSelector',
      colSpan: 6,
      options: DEFAULT_SITE_FEATURES
    },
    {
      key: 'customFields',
      label: 'Custom Metadata Fields',
      type: 'customFields',
      colSpan: 12
    }
  ];

  const handleFieldChange = (key, val) => {
    setCreateForm(prev => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title="Site"
      subtitle="Configure site"
      icon={Building2}
      fields={siteFields}
      formData={createForm}
      onChange={handleFieldChange}
      onSubmit={handleCreateSite}
      submitting={submitting}
      error={error}
      submitLabel="Create Site"
      submittingLabel="Creating Site..."
    />
  );
};

export default RegisterSiteModal;
