import React, { useState, useEffect } from 'react';
import { Container, Nav } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, Users, ShieldCheck } from 'lucide-react';
import GlobalSettings from './GlobalSettings';
import UserAdministration from './UserAdministration';

const SettingsIndex = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/users')) return 'users';
    return 'global';
  });

  useEffect(() => {
    if (location.pathname.includes('/users')) {
      setActiveTab('users');
    } else if (location.pathname.includes('/global') || location.pathname.includes('/settings')) {
      setActiveTab('global');
    }
  }, [location.pathname]);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'global') {
      navigate('/global-settings');
    } else if (tab === 'users') {
      navigate('/settings/users');
    }
  };

  return (
    <div style={{ backgroundColor: '#070605', minHeight: '100vh' }}>
      {/* Sub-Header Tabs */}
      <div className="border-bottom border-secondary border-opacity-25 px-4 pt-3 bg-black">
        <Nav variant="tabs" activeKey={activeTab} onSelect={handleSelectTab} className="border-0">
          <Nav.Item>
            <Nav.Link 
              eventKey="global" 
              className={`d-flex align-items-center gap-2 fw-bold px-4 py-3 border-0 rounded-top-3 transition-all ${activeTab === 'global' ? 'bg-dark text-warning border-bottom border-warning border-2' : 'text-slate-400 bg-transparent'}`}
            >
              <Settings size={18} className={activeTab === 'global' ? 'text-warning' : 'text-slate-400'} />
              Global Settings
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="users" 
              className={`d-flex align-items-center gap-2 fw-bold px-4 py-3 border-0 rounded-top-3 transition-all ${activeTab === 'users' ? 'bg-dark text-info border-bottom border-info border-2' : 'text-slate-400 bg-transparent'}`}
            >
              <Users size={18} className={activeTab === 'users' ? 'text-info' : 'text-slate-400'} />
              User Administration 
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'global' ? <GlobalSettings /> : <UserAdministration />}
    </div>
  );
};

export default SettingsIndex;
