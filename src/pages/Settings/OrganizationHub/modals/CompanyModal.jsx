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
      placeholder: 'Enter Company Name',
      required: true,
      colSpan: 12
    },
    {
      key: 'email',
      label: 'Contact Email',
      type: 'email',
      placeholder: 'Enter Email',
      colSpan: 6
    },
    {
      key: 'phone',
      label: 'Phone Number',
      type: 'text',
      placeholder: 'Enter Phone Number',
      colSpan: 6
    },
    {
      key: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Enter Address',
      rows: 3,
      colSpan: 12
    }
  ];

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={editingCompany ? 'Edit Company' : 'Add Company'}
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
