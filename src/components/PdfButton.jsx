import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { FileDown } from 'lucide-react';
import UserPdfReportModal from './UserPdfReportModal';

const PdfButton = ({ label = "Download Custom PDF", onClick, className = "", sites = [], assets = [] }) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <Button 
        variant="outline-info" 
        size="sm" 
        className={`d-flex align-items-center gap-1.5 fw-semibold ${className}`}
        onClick={handleClick}
      >
        <FileDown size={16} />
        <span>{label}</span>
      </Button>

      <UserPdfReportModal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        sites={sites} 
        assets={assets} 
      />
    </>
  );
};

export default PdfButton;
