import React from 'react';
import { Building2 } from 'lucide-react';
import UnifiedRegisterModal from '../../../../components/common/UnifiedRegisterModal';

const OrganizationModal = ({
  show,
  onHide,
  editingTenant,
  tenantForm,
  setTenantForm,
  companies = [],
  onSubmit,
  loading
}) => {
  const fields = [
    {
      key: 'companyId',
      label: 'Parent Company',
      type: 'select',
      placeholder: 'Select Parent Company...',
      required: !editingTenant,
      disabled: !!editingTenant,
      options: companies.map(c => ({ value: c.id, label: c.name })),
      colSpan: 12
    },
    {
      key: 'name',
      label: 'Organization Name',
      type: 'text',
      placeholder: 'e.g. Acme Tech Park',
      required: true,
      colSpan: 6
    },
    {
      key: 'serverUrl',
      label: 'Server URL',
      type: 'text',
      placeholder: 'https://client.iotcloud.com',
      colSpan: 6
    },
    {
      key: 'email',
      label: 'Contact Email',
      type: 'email',
      placeholder: 'admin@tenant.com',
      required: true,
      colSpan: 6
    },
    {
      key: 'phone',
      label: 'Phone Number',
      type: 'text',
      placeholder: '+91-XXXXXXXXXX',
      colSpan: 6
    },
    {
      key: 'sochiotOrgId',
      label: 'Sochiot Org ID',
      type: 'number',
      placeholder: 'e.g. 101',
      colSpan: 6
    },
    {
      key: 'subscription',
      label: 'Subscription Tier',
      type: 'select',
      options: [
        { value: 'BASIC', label: 'BASIC' },
        { value: 'PREMIUM', label: 'PREMIUM' },
        { value: 'FREE', label: 'FREE' },
        { value: 'TRIAL', label: 'TRIAL' }
      ],
      colSpan: 6
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter organization description and operational scope...',
      rows: 2,
      colSpan: 12
    },
    {
      key: 'address',
      label: 'Headquarters Address',
      type: 'textarea',
      placeholder: 'Enter full headquarters address (building, street, city, state, postal code)...',
      rows: 2,
      colSpan: 12
    }
  ];

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={editingTenant ? 'Edit Organization (Tenant)' : 'Add New Organization'}
      subtitle={editingTenant ? `ID: ${editingTenant.id}` : 'Create a tenant organization under a parent company'}
      icon={Building2}
      fields={fields}
      formData={tenantForm}
      onChange={(key, val) => setTenantForm(prev => ({ ...prev, [key]: val }))}
      onSubmit={onSubmit}
      submitting={loading}
      submitLabel={editingTenant ? 'Update Organization' : 'Create Organization'}
      submittingLabel={editingTenant ? 'Updating...' : 'Creating...'}
    />
  );
};

export default OrganizationModal;
