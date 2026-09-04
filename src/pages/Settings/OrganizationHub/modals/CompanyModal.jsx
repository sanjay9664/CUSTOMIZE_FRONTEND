import React from 'react';
import { Building } from 'lucide-react';
import UnifiedRegisterModal from '../../../../components/common/UnifiedRegisterModal';

const CompanyModal = ({
  show,
  onHide,
  editingCompany,
  companyForm,
  setCompanyForm,
  onSubmit,
  loading
}) => {
  const fields = [
    {
      key: 'name',
      label: 'Company Name',
      type: 'text',
      placeholder: 'e.g. Acme Global Corporation',
      required: true,
      colSpan: 12
    },
    {
      key: 'email',
      label: 'Contact Email',
      type: 'email',
      placeholder: 'admin@company.com',
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
      key: 'address',
      label: 'Corporate Address',
      type: 'textarea',
      placeholder: 'Headquarters location and address details',
      rows: 3,
      colSpan: 12
    }
  ];

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={editingCompany ? 'Edit Master Company' : 'Add Master Company'}
      subtitle={editingCompany ? `ID: ${editingCompany.id}` : 'Create a top-level parent company entity'}
      icon={Building}
      fields={fields}
      formData={companyForm}
      onChange={(key, val) => setCompanyForm(prev => ({ ...prev, [key]: val }))}
      onSubmit={onSubmit}
      submitting={loading}
      submitLabel={editingCompany ? 'Save Changes' : 'Create Company'}
      submittingLabel={editingCompany ? 'Saving...' : 'Creating...'}
    />
  );
};

export default CompanyModal;
