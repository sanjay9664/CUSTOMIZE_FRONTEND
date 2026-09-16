import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { FileDown } from 'lucide-react';
import UserPdfReportModal from './UserPdfReportModal';

const PdfButton = ({
  label = "Download Custom PDF",
  onClick,
  className = "",
  sites = [],
  assets = [],
  title,
  variant = "outline-info"
}) => {
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
        variant={variant} 
        size="sm" 
        className={`d-flex align-items-center gap-1.5 fw-semibold ${className}`}
        onClick={handleClick}
        title={title || (typeof label === 'string' && label ? label : "Download Custom PDF")}
        aria-label={title || (typeof label === 'string' && label ? label : "Download Custom PDF")}
      >
        <FileDown size={16} />
        {label ? <span>{label}</span> : null}
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
