import React, { useEffect, useRef, useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Layers, Cpu, Rocket } from 'lucide-react';

const ConfigDevicesPopover = ({
  show,
  onClose,
  onSelectTemplates,
  onSelectEntities,
  onSelectLaunchpad
}) => {
  const popoverRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setIsClosing(false);
    } else if (mounted && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 210);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleTriggerClose = (callback) => {
    setIsClosing(true);
    setTimeout(() => {
      onClose && onClose();
      if (typeof callback === 'function') {
        callback();
      }
      setIsClosing(false);
    }, 210);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        handleTriggerClose();
      }
    };
    if (show && mounted && !isClosing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, mounted, isClosing]);

  if (!show && !mounted) return null;

  return (
    <div
      ref={popoverRef}
      className={`config-devices-popover shadow-lg rounded-4 p-4 text-start ${isClosing ? 'closing' : 'opening'}`}
      style={{
        position: 'absolute',
        top: 'calc(100% + 14px)',
        right: 0,
        left: 'auto',
        zIndex: 9999,
        width: '580px',
        maxWidth: 'calc(100vw - 40px)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <style>{`
        .config-devices-popover {
          background: #090e1a;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.75);
        }

        body.light-mode .config-devices-popover {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12) !important;
        }

        @keyframes popoverPopIn {
          0% {
            opacity: 0;
            transform: translateY(-14px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes popoverPopOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-12px) scale(0.94);
          }
        }

        @keyframes popoverCardSlideUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .config-devices-popover.opening {
          animation: popoverPopIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
        }

        .config-devices-popover.closing {
          animation: popoverPopOut 0.21s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
          pointer-events: none;
        }

        .popover-card-anim-1 {
          animation: popoverCardSlideUp 0.30s cubic-bezier(0.16, 1, 0.3, 1) 0.04s both;
        }
        .popover-card-anim-2 {
          animation: popoverCardSlideUp 0.30s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
        }
        .popover-card-anim-3 {
          animation: popoverCardSlideUp 0.30s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
        }
      `}</style>

      <Row className="g-3 mb-3 justify-content-center">
        {/* Templates Option */}
        <Col md={4} className="popover-card-anim-1">
          <div
            className="config-option-card h-100 p-3.5 rounded-4 text-center d-flex flex-column align-items-center justify-content-between"
            onClick={() => handleTriggerClose(onSelectTemplates)}
          >
            <div className="dashed-icon-box mb-3 d-flex align-items-center justify-content-center">
              <Layers size={40} strokeWidth={1.5} />
            </div>
            <div>
              <h6 className="fw-bold text-white mb-1.5 fs-15 card-title-text">Templates</h6>
              <p className="text-slate-400 fs-12 mb-0 px-1 card-subtitle-text" style={{ lineHeight: '1.35' }}>
                Device & Module Templates
              </p>
            </div>
          </div>
        </Col>

        {/* Entities Option */}
        <Col md={4} className="popover-card-anim-2">
          <div
            className="config-option-card h-100 p-3.5 rounded-4 text-center d-flex flex-column align-items-center justify-content-between"
            onClick={() => handleTriggerClose(onSelectEntities)}
          >
            <div className="dashed-icon-box mb-3 d-flex align-items-center justify-content-center">
              <Cpu size={40} strokeWidth={1.5} />
            </div>
            <div>
              <h6 className="fw-bold text-white mb-1.5 fs-15 card-title-text">Entities</h6>
              <p className="text-slate-400 fs-12 mb-0 px-1 card-subtitle-text" style={{ lineHeight: '1.35' }}>
                Digital Twin of your Hardware
              </p>
            </div>
          </div>
        </Col>

        {/* Launchpad Option */}
        <Col md={4} className="popover-card-anim-3">
          <div
            className="config-option-card h-100 p-3.5 rounded-4 text-center d-flex flex-column align-items-center justify-content-between"
            onClick={() => handleTriggerClose(onSelectLaunchpad)}
          >
            <div className="dashed-icon-box mb-3 d-flex align-items-center justify-content-center">
              <Rocket size={40} strokeWidth={1.5} />
            </div>
            <div>
              <h6 className="fw-bold text-white mb-1.5 fs-15 card-title-text">Launchpad</h6>
              <p className="text-slate-400 fs-12 mb-0 px-1 card-subtitle-text" style={{ lineHeight: '1.35' }}>
                Connect your hardware to sochiot cloud
              </p>
            </div>
          </div>
        </Col>
      </Row>

      <div className="text-center pt-2 border-top border-secondary border-opacity-25">
        <span className="text-slate-400 fs-11 opacity-75 footer-note-text">
          Entities are required to connect hardware to cloud
        </span>
      </div>
    </div>
  );
};

export default ConfigDevicesPopover;
