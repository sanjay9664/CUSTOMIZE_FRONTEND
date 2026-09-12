import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileText, Lock, AlertTriangle, 
  Search, CheckCircle, Printer, Download, Eye, BookOpen 
} from 'lucide-react';

const PolicyCondition = () => {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' | 'privacy' | 'security' | 'sla'
  const [searchQuery, setSearchQuery] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [acceptedDate, setAcceptedDate] = useState(null);

  useEffect(() => {
    const acc = localStorage.getItem('scada_policy_accepted');
    if (acc) {
      setAccepted(true);
      setAcceptedDate(acc);
    }
  }, []);

  const handleAcceptPolicy = () => {
    const dateStr = new Date().toLocaleString();
    localStorage.setItem('scada_policy_accepted', dateStr);
    setAccepted(true);
    setAcceptedDate(dateStr);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-3 p-md-4 min-vh-100 scada-help-page">
      <div className="container-fluid max-w-6xl">
        
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between pb-3 mb-4 gap-3 scada-page-header">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="p-2.5 rounded-3 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
            >
              <ShieldCheck size={26} />
            </div>
            <div>
              <h3 className="fw-bold mb-0 scada-page-title">Policy & Terms Condition</h3>
              <p className="mb-0 small scada-page-subtitle">Building Management System (BMS) SCADA Governance & Operational Guidelines</p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn btn-sm d-flex align-items-center gap-1.5 scada-form-input"
              onClick={handlePrint}
            >
              <Printer size={16} style={{ color: '#0284c7' }} /> Print Policy
            </button>
            {accepted ? (
              <span 
                className="px-3 py-1.5 rounded-3 d-flex align-items-center gap-1.5 fw-bold font-monospace"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: '12px' }}
              >
                <CheckCircle size={15} /> Accepted on {acceptedDate}
              </span>
            ) : (
              <button 
                className="btn btn-sm fw-bold d-flex align-items-center gap-1.5 shadow-sm text-white"
                style={{ backgroundColor: '#059669', border: 'none' }}
                onClick={handleAcceptPolicy}
              >
                <CheckCircle size={16} /> Accept Conditions
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 h-100 scada-card-box">
              <div className="d-flex align-items-center gap-2 mb-1.5 fw-bold small" style={{ color: '#0284c7' }}>
                <Lock size={16} /> Role-Based Access
              </div>
              <p className="small mb-0 scada-body-text">Strict authorization levels for Control Panel operations (Super Admin, Admin, Operator).</p>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 h-100 scada-card-box">
              <div className="d-flex align-items-center gap-2 mb-1.5 fw-bold small" style={{ color: '#d97706' }}>
                <AlertTriangle size={16} /> Emergency Interlocking
              </div>
              <p className="small mb-0 scada-body-text">Fire & Water pump overrides require direct admin confirmation and audit logging.</p>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 h-100 scada-card-box">
              <div className="d-flex align-items-center gap-2 mb-1.5 fw-bold small" style={{ color: '#0284c7' }}>
                <FileText size={16} /> Telemetry Audit
              </div>
              <p className="small mb-0 scada-body-text">All telemetry readings, daily DPR logs, and command triggers are archived securely for 365 days.</p>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="p-3 rounded-3 h-100 scada-card-box">
              <div className="d-flex align-items-center gap-2 mb-1.5 fw-bold small" style={{ color: '#059669' }}>
                <ShieldCheck size={16} /> Uptime Commitment
              </div>
              <p className="small mb-0 scada-body-text">99.9% uptime target for critical electrical, HVAC, and alarm telemetry dispatchers.</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="d-flex flex-wrap gap-2 mb-4 pb-2 scada-page-header">
          <button
            className={`btn btn-sm px-3 py-2 fw-semibold rounded-3 transition-all d-flex align-items-center gap-1.5 ${activeTab === 'terms' ? 'text-white' : 'scada-tab-btn-inactive'}`}
            style={{
              backgroundColor: activeTab === 'terms' ? '#0284c7' : undefined,
              border: activeTab === 'terms' ? 'none' : undefined
            }}
            onClick={() => setActiveTab('terms')}
          >
            <BookOpen size={16} /> Terms & Conditions
          </button>
          <button
            className={`btn btn-sm px-3 py-2 fw-semibold rounded-3 transition-all d-flex align-items-center gap-1.5 ${activeTab === 'privacy' ? 'text-white' : 'scada-tab-btn-inactive'}`}
            style={{
              backgroundColor: activeTab === 'privacy' ? '#0284c7' : undefined,
              border: activeTab === 'privacy' ? 'none' : undefined
            }}
            onClick={() => setActiveTab('privacy')}
          >
            <Lock size={16} /> Privacy & Data Policy
          </button>
          <button
            className={`btn btn-sm px-3 py-2 fw-semibold rounded-3 transition-all d-flex align-items-center gap-1.5 ${activeTab === 'security' ? 'text-white' : 'scada-tab-btn-inactive'}`}
            style={{
              backgroundColor: activeTab === 'security' ? '#0284c7' : undefined,
              border: activeTab === 'security' ? 'none' : undefined
            }}
            onClick={() => setActiveTab('security')}
          >
            <ShieldCheck size={16} /> System Control & Security
          </button>
          <button
            className={`btn btn-sm px-3 py-2 fw-semibold rounded-3 transition-all d-flex align-items-center gap-1.5 ${activeTab === 'sla' ? 'text-white' : 'scada-tab-btn-inactive'}`}
            style={{
              backgroundColor: activeTab === 'sla' ? '#0284c7' : undefined,
              border: activeTab === 'sla' ? 'none' : undefined
            }}
            onClick={() => setActiveTab('sla')}
          >
            <FileText size={16} /> Service Level Agreement (SLA)
          </button>
        </div>

        {/* Tab Details */}
        <div className="p-4 rounded-4 shadow-lg scada-card-box">
          {activeTab === 'terms' && (
            <div>
              <h4 className="fw-bold scada-card-heading mb-3">1. Terms & Conditions of Operation</h4>
              <p className="leading-relaxed scada-body-text">
                Welcome to the Building Management System (BMS) SCADA Monitoring Platform. By accessing or operating this interface, you agree to comply with the terms defined herein:
              </p>

              <h6 className="fw-bold mt-4 mb-2" style={{ color: '#0284c7' }}>1.1 Authorized Usage & Operator Integrity</h6>
              <p className="small scada-body-text">
                Access to the BMS dashboard is strictly restricted to designated facility managers, electrical engineers, and authorized building maintenance operators. Credential sharing is prohibited.
              </p>

              <h6 className="fw-bold mt-4 mb-2" style={{ color: '#0284c7' }}>1.2 Equipment Command Executions</h6>
              <p className="small scada-body-text">
                Manual toggle operations (e.g. starting/stopping AG/UG pumps, changing HVAC Chiller setpoints, or tripping breakers) must adhere to site safety operating procedures (SOP). The platform maintains an immutable audit trail of all command dispatches.
              </p>

              <h6 className="fw-bold mt-4 mb-2" style={{ color: '#0284c7' }}>1.3 Modifications & Template Settings</h6>
              <p className="small scada-body-text">
                System alarm thresholds, sensor scale templates, and DPR report frequency settings may only be modified by users holding Admin or Super Admin permissions.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h4 className="fw-bold scada-card-heading mb-3">2. Privacy & Data Handling Policy</h4>
              <p className="leading-relaxed scada-body-text">
                We prioritize operational data integrity and facility telemetry privacy across all connected devices and sensor networks.
              </p>

              <h6 className="fw-bold mt-4 mb-2" style={{ color: '#0284c7' }}>2.1 Telemetry Data Collection</h6>
              <p className="small scada-body-text">
                The platform logs electrical consumption (LT Panel, DG Sets, Transformers), environmental readings (AQI, HVAC temperatures), and hydraulic water tank levels. No personal user biometric data is collected.
              </p>

              <h6 className="fw-bold mt-4 mb-2" style={{ color: '#0284c7' }}>2.2 Data Encryption & Retention</h6>
              <p className="small scada-body-text">
                All real-time MQTT and WebSocket telemetry streams are encrypted using TLS 1.3 standards. Daily log archives are backed up to secure local/cloud database storage with 1-year retention.
              </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h4 className="fw-bold scada-card-heading mb-3">3. System Control & Security Protocol</h4>
              <p className="leading-relaxed scada-body-text">
                Industrial control system safety is enforced through hardware and software interlocking mechanisms.
              </p>

              <h6 className="fw-bold mt-4 mb-2" style={{ color: '#0284c7' }}>3.1 Fail-Safe Emergency Protocols</h6>
              <p className="small scada-body-text">
                In the event of network disruption, local hardware controllers (PLCs/RTUs) maintain fail-safe automation logic independent of the cloud HMI dashboard.
              </p>

              <h6 className="fw-bold mt-4 mb-2" style={{ color: '#0284c7' }}>3.2 Impersonation & Audit Monitoring</h6>
              <p className="small scada-body-text">
                Super Admin verification modes and user impersonation sessions are recorded with IP addresses and session timestamps.
              </p>
            </div>
          )}

          {activeTab === 'sla' && (
            <div>
              <h4 className="fw-bold scada-card-heading mb-3">4. Service Level Agreement (SLA)</h4>
              <p className="leading-relaxed scada-body-text">
                Service availability and maintenance conditions for high-availability SCADA operations.
              </p>

              <h6 className="fw-bold mt-4 mb-2" style={{ color: '#0284c7' }}>4.1 Availability Guarantee</h6>
              <p className="small scada-body-text">
                The system targets 99.9% platform availability for alarm telemetry dispatches and real-time dashboard visualization.
              </p>

              <h6 className="fw-bold mt-4 mb-2" style={{ color: '#0284c7' }}>4.2 Scheduled Maintenance Windows</h6>
              <p className="small scada-body-text">
                Routine platform upgrades and patch deployments are scheduled during low-demand hours (01:00 AM - 03:00 AM IST) with advance system notifications.
              </p>
            </div>
          )}

          {/* Footer Acknowledgment Box */}
          <div className="mt-4 pt-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 p-3 rounded-3 scada-policy-footer">
            <div className="small">
              Have questions regarding system policies or operational compliance?
              <br />
              <span>Contact Facility Security Admin: <strong>compliance@bms-control.com</strong></span>
            </div>
            {!accepted && (
              <button 
                className="btn fw-bold px-4 py-2 d-flex align-items-center gap-2 shadow text-white"
                style={{ backgroundColor: '#059669', border: 'none' }}
                onClick={handleAcceptPolicy}
              >
                <CheckCircle size={18} /> Accept Terms & Conditions
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PolicyCondition;
