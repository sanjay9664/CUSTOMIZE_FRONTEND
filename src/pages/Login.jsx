import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Modal } from 'react-bootstrap';
import { 
  Shield, User, Lock, Activity, ArrowRight, Eye, Key, Mail, Cpu, Globe, 
  CheckCircle2, LogIn, LockKeyhole, ShieldCheck, Chrome, Server, Activity as Waveform,
  Palette, Building2, Check, RefreshCw, SlidersHorizontal, Image as ImageIcon, Sparkles,
  Upload, Trash2
} from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import { setAuthCookies, setAuthSession } from '../utils/cookieUtils';
import { AUTH_ENDPOINTS } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';
import logo from "../assets/logo.png";
import heroImg from "./scada_hero.png";

// PRE-SET ENTERPRISE TENANT THEMES WITH RICH MATCHING PREMIUM DARK BACKGROUND TINTS
const PRESET_THEMES = [
  {
    id: 'cyan',
    name: 'Sochiot Cyber Cyan',
    primary: '#00f2fe',
    secondary: '#38bdf8',
    bgColor: '#060a12',
    gradient: 'linear-gradient(90deg, #00f2fe 0%, #38bdf8 50%, #4facfe 100%)',
    glow: 'rgba(0, 242, 254, 0.4)',
    bgGlow: 'rgba(0, 242, 254, 0.18)'
  },
  {
    id: 'emerald',
    name: 'Emerald Bio-Tech',
    primary: '#10b981',
    secondary: '#34d399',
    bgColor: '#02160e',
    gradient: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.4)',
    bgGlow: 'rgba(16, 185, 129, 0.18)'
  },
  {
    id: 'purple',
    name: 'Royal Electric Purple',
    primary: '#a855f7',
    secondary: '#c084fc',
    bgColor: '#0f0719',
    gradient: 'linear-gradient(90deg, #a855f7 0%, #c084fc 50%, #7c3aed 100%)',
    glow: 'rgba(168, 85, 247, 0.4)',
    bgGlow: 'rgba(168, 85, 247, 0.18)'
  },
  {
    id: 'amber',
    name: 'Solar Industrial Gold',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    bgColor: '#140c02',
    gradient: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)',
    glow: 'rgba(245, 158, 11, 0.4)',
    bgGlow: 'rgba(245, 158, 11, 0.18)'
  },
  {
    id: 'crimson',
    name: 'Crimson Power Red',
    primary: '#ef4444',
    secondary: '#f87171',
    bgColor: '#170405',
    gradient: 'linear-gradient(90deg, #ef4444 0%, #f87171 50%, #dc2626 100%)',
    glow: 'rgba(239, 68, 68, 0.4)',
    bgGlow: 'rgba(239, 68, 68, 0.18)'
  },
  {
    id: 'cobalt',
    name: 'Cobalt Deep Blue',
    primary: '#2563eb',
    secondary: '#60a5fa',
    bgColor: '#030c22',
    gradient: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 50%, #1d4ed8 100%)',
    glow: 'rgba(37, 99, 235, 0.4)',
    bgGlow: 'rgba(37, 99, 235, 0.18)'
  },
  {
    id: 'grayscale',
    name: 'Industrial Silver Gray',
    primary: '#94a3b8',
    secondary: '#cbd5e1',
    bgColor: '#0f172a',
    gradient: 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 50%, #64748b 100%)',
    glow: 'rgba(148, 163, 184, 0.4)',
    bgGlow: 'rgba(148, 163, 184, 0.18)'
  }
];

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin, syncAuthState } = useAuth();
  
  // Login State
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('remember_me') !== 'false';
  });
  const [credentials, setCredentials] = useState(() => {
    const isRemembered = localStorage.getItem('remember_me') !== 'false';
    const savedId = localStorage.getItem('remembered_identifier') || '';
    // Clean up any legacy remembered_password from localStorage
    localStorage.removeItem('remembered_password');
    return {
      identifier: isRemembered ? savedId : '',
      password: ''
    };
  });
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // ── TENANT BRANDING & THEME CUSTOMIZER STATE ─────────────────────────────
  const logoInputRef = React.useRef(null);
  const wallpaperInputRef = React.useRef(null);

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [tenantConfig, setTenantConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('tenant_theme_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      companyName: 'Sochiot Automation',
      tagline: 'SMARTER AUTOMATION',
      logoUrl: '',
      bgWallpaperUrl: '',
      activeThemeId: 'cyan',
      customPrimaryColor: '#00f2fe',
      customBgColor: '#060a12'
    };
  });

  // Active theme calculation
  const currentTheme = PRESET_THEMES.find(t => t.id === tenantConfig.activeThemeId) || PRESET_THEMES[0];

  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c = hex.substring(1).split('');
      if(c.length === 3){
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return [(c>>16)&255, (c>>8)&255, c&255].join(',');
    }
    return '0, 242, 254';
  };

  const primaryColor = tenantConfig.activeThemeId === 'custom' ? tenantConfig.customPrimaryColor : currentTheme.primary;
  const bgColor = tenantConfig.activeThemeId === 'custom' ? (tenantConfig.customBgColor || '#060a12') : currentTheme.bgColor;
  const primaryRgb = hexToRgb(primaryColor);

  // Handler for selecting theme palette: updates theme accent AND matching premium background instantly!
  const handleSelectTheme = (theme) => {
    const updated = {
      ...tenantConfig,
      activeThemeId: theme.id,
      customBgColor: theme.bgColor // Synchronizes background color to match theme tint!
    };
    setTenantConfig(updated);
    localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
  };

  // Sync theme changes to localStorage
  const handleSaveTenantConfig = (newConfig) => {
    setTenantConfig(newConfig);
    localStorage.setItem('tenant_theme_config', JSON.stringify(newConfig));
    setShowThemeModal(false);
  };

  // Instant File Upload Handlers (Reads file from computer and converts to Base64)
  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...tenantConfig, logoUrl: reader.result };
        setTenantConfig(updated);
        localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleWallpaperFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...tenantConfig, bgWallpaperUrl: reader.result };
        setTenantConfig(updated);
        localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Helper for storing auth session and configuring sidebar
  const storeSessionAndRedirect = (data) => {
    const payloadData = data?.data || data;
    const user = payloadData?.user || {};
    const token = payloadData?.accessToken || payloadData?.token || '';
    const refreshToken = payloadData?.refreshToken || '';

    // Set Cookies & Session Management, cleaning redundant raw JWT tokens from localStorage
    setAuthSession({
      token,
      refreshToken,
      userRole: user.role || 'ADMIN',
      userData: user
    });

    // Remove any legacy stored passwords for security
    localStorage.removeItem('remembered_password');

    if (rememberMe) {
      localStorage.setItem('remember_me', 'true');
      if (credentials.identifier) {
        localStorage.setItem('remembered_identifier', credentials.identifier);
      }
    } else {
      localStorage.setItem('remember_me', 'false');
      localStorage.removeItem('remembered_identifier');
    }

    const config = payloadData.config || {};
    const sidebarMapping = {
      "Dashboard":        config.showDashboard        ?? true,
      "Water Management": config.showWaterManagement  ?? true,
      "Motors":           config.showMotors           ?? true,
      "DG Set":           config.showDGSet            ?? true,
      "Setting Templates":config.showSettingTemplates ?? true,
      "Alarm System":     config.showAlarms           ?? true,
      "LT Panel":         config.showLTPanel          ?? true,
      "Transformer":      config.showTransformers     ?? true,
      "Fire":             config.showFirePumps        ?? true,
      "Ticketing":        config.showTicketing        ?? true,
      "Maintenance":      config.showMaintenance      ?? true,
      "Service History":  config.showServiceHistory   ?? true,
      "Daily DPR":        config.showDailyDPR         ?? true,
      "Energy Metering":  config.showEnergyMetering   ?? true,
      "VRV":              config.showVRV              ?? true,
      "AQI Sensor":       config.showAQISensor        ?? true,
      "HVAC":             config.showHVAC             ?? true,
      "AC":               config.showAC               ?? true,
    };
    localStorage.setItem('scada_modules_config',    JSON.stringify(sidebarMapping));
    localStorage.setItem('scada_submodules_config', JSON.stringify(config.submoduleVisibility || {}));

    syncAuthState();
    window.dispatchEvent(new Event('storage-update'));
    setLoading(false);

    navigate('/dashboard', { replace: true });
  };

  // ── HANDLE LOGIN (Username or Email) ──────────────────────────────────────
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!credentials.identifier || !credentials.password) {
      setError('Please enter your Username or Email and Password.');
      setLoading(false);
      return;
    }

    try {
      const result = await authLogin({
        identifier: credentials.identifier,
        password: credentials.password,
      });

      storeSessionAndRedirect(result.data);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid username/email or password');
      setLoading(false);
    }
  };

  // ── HANDLE OAUTH / SSO ──────────────────────────────────────────────────
  const handleOAuth = async (provider) => {
    setLoading(true);
    setError('');
    setSuccessMsg(`Authenticating with ${provider}...`);

    try {
      const response = await fetch(AUTH_ENDPOINTS.oauth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: `${provider.toLowerCase().replace(/\s+/g, '')}.user@sochiot.com`,
          name: `${provider} Authenticated User`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        storeSessionAndRedirect(data);
      } else {
        setError(`${provider} authentication failed.`);
        setLoading(false);
      }
    } catch (err) {
      setError(`Unable to connect to ${provider} OAuth gateway.`);
      setLoading(false);
    }
  };

  return (
    <div 
      className="scada-exact-login-bg min-vh-100 d-flex overflow-hidden"
      style={{
        '--dynamic-primary': primaryColor,
        '--dynamic-primary-rgb': primaryRgb,
        '--dynamic-bg-color': bgColor,
        '--dynamic-gradient': tenantConfig.activeThemeId === 'custom' 
          ? `linear-gradient(90deg, ${primaryColor} 0%, #38bdf8 100%)` 
          : currentTheme.gradient,
        backgroundImage: tenantConfig.bgWallpaperUrl ? `url(${tenantConfig.bgWallpaperUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* FLOATING THEME CUSTOMIZER BUTTON */}
      <button 
        type="button"
        className="floating-theme-toggle-btn"
        onClick={() => setShowThemeModal(true)}
        title="Customize Company Theme, Branding & Background"
      >
        <Palette size={20} className="theme-btn-icon" />
        <span className="d-none d-md-inline fw-bold fs-12">Company Theme</span>
      </button>

      {/* LEFT SIDE: BRAND & BEAUTIFUL SCADA HERO VISUALS */}
      <div className="hero-exact-side d-none d-lg-flex flex-column justify-content-between p-5 position-relative">
        
        {/* DYNAMIC BACKGROUND AMBIENT GLOW */}
        <div className="hero-ambient-glow"></div>

        {/* TOP BRAND LOGO & COMPANY NAME */}
        <div className="position-relative z-10">
          <div className="d-flex align-items-center gap-3">
             {tenantConfig.logoUrl ? (
                <img src={tenantConfig.logoUrl} alt={tenantConfig.companyName} style={{ height: 48, objectFit: 'contain' }} />
             ) : (
                <img src={logo} alt="Company Logo" style={{ height: 48 }} />
             )}
             {tenantConfig.companyName && tenantConfig.companyName !== 'Sochiot Automation' && (
                <div className="brand-divider-title ps-3 border-start border-secondary">
                   <h5 className="text-white fw-bold mb-0 leading-tight">{tenantConfig.companyName}</h5>
                   <span className="text-slate-400 fs-11 tracking-wider text-uppercase">{tenantConfig.tagline || 'BMS PORTAL'}</span>
                </div>
             )}
          </div>
        </div>

        {/* CENTER HERO HEADING & TALL HIGH-RES IMAGE */}
        <div className="position-relative z-10 my-auto py-2 flex-grow-1 d-flex flex-column justify-content-center">
          <h1 className="hero-exact-title mb-2">
             Industrial <span className="hero-gradient-text">Intelligence</span>
          </h1>
          
          <div className="hero-underline-bar mb-3"></div>

          <p className="hero-exact-subtext max-w-xl mb-3">
             Unified multi-tenant facility telemetry with real-time AI diagnostics, sub-millisecond control, and enterprise-grade security.
          </p>

          {/* EXPANDED TALL BEAUTIFUL SCADA IMAGE CARD */}
          <div className="hero-image-card-container position-relative overflow-hidden rounded-4 mt-2 flex-grow-1">
            <img src={heroImg} alt="Industrial SCADA Control Room" className="hero-scada-image" />
            <div className="hero-image-overlay-gradient"></div>
            <div className="hero-image-live-pill">
              <span className="live-pulse-dot"></span>
              <span>SCADA LIVE TELEMETRY STREAM</span>
            </div>
          </div>
        </div>

        {/* BOTTOM FEATURE BADGES & COPYRIGHT */}
        <div className="position-relative z-10 pt-3">
            <div className="d-flex gap-3 mb-3 flex-wrap">
                <div className="hero-badge-pill d-flex align-items-center gap-2 px-3 py-2 rounded-3">
                    <Shield size={16} className="text-cyan-exact" />
                    <span>Edge Engine v2</span>
                </div>
                <div className="hero-badge-pill d-flex align-items-center gap-2 px-3 py-2 rounded-3">
                    <Waveform size={16} className="text-cyan-exact" />
                    <span>Sub-10ms Telemetry</span>
                </div>
                <div className="hero-badge-pill d-flex align-items-center gap-2 px-3 py-2 rounded-3">
                    <Lock size={16} className="text-cyan-exact" />
                    <span>AES-256 SSL Shield</span>
                </div>
            </div>

            <div className="hero-copyright-text">
                © 2026 {tenantConfig.companyName || 'Sochiot Automation Pvt. Ltd.'}
            </div>
        </div>
      </div>

      {/* RIGHT SIDE: ACCESS PORTAL CARD WITH RECTANGULAR EDGE-TRAVELLING LIGHT BEAM */}
      <div className="auth-exact-side flex-grow-1 d-flex align-items-center justify-content-center p-4 position-relative z-10">
          <div className="exact-glass-card w-100 p-4 p-sm-5 rounded-5 position-relative" style={{ maxWidth: '460px' }}>
            
            {/* 4 RECTANGULAR EDGE BEAMS STAYING STRICTLY ON BORDER EDGES */}
            <div className="edge-beam-top"></div>
            <div className="edge-beam-right"></div>
            <div className="edge-beam-bottom"></div>
            <div className="edge-beam-left"></div>

            {/* HEADER SHIELD BADGE */}
            <div className="d-flex justify-content-center mb-4 position-relative z-10">
                 <div className="badge-shield-outer d-flex align-items-center justify-content-center">
                    <div className="badge-shield-inner d-flex align-items-center justify-content-center">
                       <ShieldCheck size={28} className="text-cyan-exact" />
                    </div>
                 </div>
            </div>

            {/* CARD TITLE & SUBTITLE */}
            <div className="text-center mb-4 position-relative z-10">
                 <h2 className="card-exact-title mb-1">
                   Access Portal
                 </h2>
                 <p className="card-exact-subtitle mb-0">
                   {tenantConfig.companyName ? `${tenantConfig.companyName} Gateway` : 'Secure Multi-Tenant BMS Gateway'}
                 </p>
            </div>

            {/* ALERTS */}
            {error && (
                <Alert variant="danger" className="border-0 bg-red-glass text-red-glow fs-12 uppercase fw-bold mb-4 rounded-3 p-3 d-flex align-items-center gap-2 position-relative z-10">
                   <Shield size={18} className="flex-shrink-0" /> <div>{error}</div>
                </Alert>
            )}

            {successMsg && (
                <Alert variant="success" className="border-0 bg-green-glass text-green-glow fs-12 uppercase fw-bold mb-4 rounded-3 p-3 d-flex align-items-center gap-2 position-relative z-10">
                   <CheckCircle2 size={18} className="flex-shrink-0" /> <div>{successMsg}</div>
                </Alert>
            )}

            {/* FORM: LOGIN */}
            <Form onSubmit={handleLogin} className="position-relative z-10">
                <div className="form-fade-in">
                    <Form.Group className="mb-4 position-relative">
                      <Form.Label className="exact-field-label mb-2">Email or Username</Form.Label>
                      <div className="exact-field-icon"><User size={18} /></div>
                      <Form.Control 
                          type="text" 
                          placeholder="you@example.com"
                          className="exact-cyber-input ps-5"
                          value={credentials.identifier}
                          onChange={(e) => setCredentials({...credentials, identifier: e.target.value})}
                          required
                      />
                    </Form.Group>

                    <Form.Group className="mb-4 position-relative">
                      <Form.Label className="exact-field-label mb-2">Password</Form.Label>
                      <div className="exact-field-icon"><LockKeyhole size={18} /></div>
                      <PasswordInput
                          placeholder="••••••••"
                          className="exact-cyber-input ps-5 pe-5"
                          value={credentials.password}
                          onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                          required
                      />
                    </Form.Group>

                    <div className="d-flex align-items-center justify-content-between mb-4 fs-13">
                      <Form.Check 
                        type="checkbox"
                        id="remember-me"
                        label="Remember this device"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="exact-cyber-checkbox text-slate-300"
                      />
                      <a href="#forgot" onClick={(e) => { e.preventDefault(); setError('Contact System Administrator to reset your credentials.'); }} className="forgot-exact-link text-decoration-none">
                        Forgot Password?
                      </a>
                    </div>
                </div>

                <Button 
                  disabled={loading}
                  type="submit" 
                  className="w-100 py-3 rounded-3 fw-extrabold uppercase border-0 exact-main-btn d-flex align-items-center justify-content-center gap-2"
                >
                  {loading ? (
                      <div className="d-flex align-items-center gap-2">
                        <span className="spinner-border spinner-border-sm"></span> AUTHENTICATING...
                      </div>
                  ) : (
                      <> SIGN IN <ArrowRight size={18} /> </>
                  )}
                </Button>
            </Form>

            {/* SSO DIVIDER */}
            <div className="exact-sso-divider my-4 text-center position-relative z-10">
               <span className="exact-sso-text">OR CONTINUE WITH</span>
            </div>

            {/* OAUTH BUTTONS */}
            <div className="d-flex gap-3 position-relative z-10">
               <button 
                 type="button"
                 className="exact-sso-btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                 onClick={() => handleOAuth('Google SSO')}
                 disabled={loading}
               >
                 <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                 </svg>
                 <span>Google SSO</span>
               </button>

               <button 
                 type="button"
                 className="exact-sso-btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                 onClick={() => handleOAuth('Sochiot Cloud')}
                 disabled={loading}
               >
                 <Server size={17} className="text-cyan-exact" />
                 <span>Sochiot Cloud</span>
               </button>
            </div>

          </div>
      </div>

      {/* COMPACT TENANT BRANDING & THEME CUSTOMIZER MODAL */}
      <Modal 
        show={showThemeModal} 
        onHide={() => setShowThemeModal(false)}
        centered
        size="lg"
        className="compact-tenant-modal"
      >
        <Modal.Header closeButton className="border-secondary bg-dark-glass text-white py-2 px-3">
          <Modal.Title className="d-flex align-items-center gap-2 fs-15 font-bold">
            <SlidersHorizontal size={18} className="text-cyan-exact" />
            <span>Theme & Branding Configurator</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-cyber-dark text-white p-3 compact-modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
          
          {/* SECTION 1: CORPORATE THEME PALETTE (SELECTING AUTO-MATCHES BACKGROUND & ACCENT) */}
          <div className="mb-3">
             <div className="d-flex align-items-center justify-content-between mb-2">
                <Form.Label className="text-cyan-muted fw-bold fs-11 text-uppercase mb-0 d-flex align-items-center gap-1">
                   <Palette size={14} /> Select Corporate Theme Palette
                </Form.Label>
                <span className="text-slate-400 fs-11 ms-auto">Selecting theme auto-matches background</span>
             </div>
             
             <div className="compact-themes-grid">
                {PRESET_THEMES.map((theme) => {
                   const isSelected = tenantConfig.activeThemeId === theme.id;
                   return (
                      <div 
                        key={theme.id}
                        className={`compact-theme-card p-2 rounded-2 cursor-pointer d-flex align-items-center justify-content-between ${isSelected ? 'theme-active' : ''}`}
                        onClick={() => handleSelectTheme(theme)}
                      >
                         <div className="d-flex align-items-center gap-2">
                            <div 
                              className="theme-color-preview-circle rounded-circle flex-shrink-0"
                              style={{ background: theme.gradient, width: 22, height: 22, border: '1.5px solid rgba(255,255,255,0.4)' }}
                            ></div>
                            <span className="fs-12 fw-semibold text-slate-200">{theme.name}</span>
                         </div>
                         {isSelected && <Check size={15} className="text-white flex-shrink-0" />}
                      </div>
                   );
                })}
             </div>
          </div>

          {/* SECTION 2: COMPACT COMPANY DETAILS & LOGO */}
          <div className="mb-3 p-2 rounded-3 bg-dark-glass border-glass">
             <Form.Label className="text-cyan-muted fw-bold fs-11 text-uppercase mb-2 d-flex align-items-center gap-1">
                <Building2 size={14} /> Company Details & Logo
             </Form.Label>

             <div className="row g-2">
                <div className="col-md-6">
                   <Form.Label className="fs-11 text-slate-300 mb-1">Company Name</Form.Label>
                   <Form.Control 
                      type="text"
                      value={tenantConfig.companyName || ''}
                      onChange={(e) => {
                         const updated = { ...tenantConfig, companyName: e.target.value };
                         setTenantConfig(updated);
                         localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
                      }}
                      placeholder="e.g. Tata BMS, Siemens Industrial"
                      className="cyber-modal-input-compact"
                   />
                </div>
                
                <div className="col-md-6">
                   <Form.Label className="fs-11 text-slate-300 mb-1">Logo Image (File or URL)</Form.Label>
                   <div className="d-flex gap-1">
                      <Form.Control 
                         type="text"
                         value={tenantConfig.logoUrl || ''}
                         onChange={(e) => {
                            const updated = { ...tenantConfig, logoUrl: e.target.value };
                            setTenantConfig(updated);
                            localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
                         }}
                         placeholder="URL or Upload..."
                         className="cyber-modal-input-compact flex-grow-1"
                      />
                      <button 
                         type="button"
                         className="btn btn-outline-info btn-sm py-1 px-2 d-flex align-items-center gap-1 cursor-pointer flex-shrink-0 mb-0 fs-11 fw-bold"
                         onClick={() => logoInputRef.current?.click()}
                      >
                         <Upload size={12} /> Browse
                      </button>
                      <input 
                         ref={logoInputRef}
                         type="file" 
                         accept="image/*" 
                         className="d-none" 
                         onChange={handleLogoFileUpload} 
                      />
                      {tenantConfig.logoUrl && (
                         <Button variant="outline-danger" size="sm" className="py-1 px-2 fs-11" onClick={() => {
                            const updated = { ...tenantConfig, logoUrl: '' };
                            setTenantConfig(updated);
                            localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
                         }}>
                            <Trash2 size={12} />
                         </Button>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* SECTION 3: COMPACT BACKGROUND WALLPAPER & CUSTOM COLOR */}
          <div className="p-2 rounded-3 bg-dark-glass border-glass">
             <Form.Label className="text-cyan-muted fw-bold fs-11 text-uppercase mb-2 d-flex align-items-center gap-1">
                <ImageIcon size={14} /> Custom Wallpaper & Colors
             </Form.Label>

             <div className="row g-2 align-items-center">
                <div className="col-md-7">
                   <Form.Label className="fs-11 text-slate-300 mb-1">Wallpaper Image (File or URL)</Form.Label>
                   <div className="d-flex gap-1">
                      <Form.Control 
                         type="text"
                         value={tenantConfig.bgWallpaperUrl || ''}
                         onChange={(e) => {
                            const updated = { ...tenantConfig, bgWallpaperUrl: e.target.value };
                            setTenantConfig(updated);
                            localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
                         }}
                         placeholder="URL or Upload..."
                         className="cyber-modal-input-compact flex-grow-1"
                      />
                      <button 
                         type="button"
                         className="btn btn-outline-info btn-sm py-1 px-2 d-flex align-items-center gap-1 cursor-pointer flex-shrink-0 mb-0 fs-11 fw-bold"
                         onClick={() => wallpaperInputRef.current?.click()}
                      >
                         <Upload size={12} /> Browse
                      </button>
                      <input 
                         ref={wallpaperInputRef}
                         type="file" 
                         accept="image/*" 
                         className="d-none" 
                         onChange={handleWallpaperFileUpload} 
                      />
                      {tenantConfig.bgWallpaperUrl && (
                         <Button variant="outline-danger" size="sm" className="py-1 px-2 fs-11" onClick={() => {
                            const updated = { ...tenantConfig, bgWallpaperUrl: '' };
                            setTenantConfig(updated);
                            localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
                         }}>
                            <Trash2 size={12} />
                         </Button>
                      )}
                   </div>
                </div>

                <div className="col-md-5 d-flex justify-content-between align-items-center pt-3 pt-md-0">
                   <div className="me-2">
                      <Form.Label className="fs-11 fw-bold text-white mb-0">Custom Colors</Form.Label>
                      <p className="fs-10 text-slate-400 mb-0">Accent & Bg Pickers</p>
                   </div>
                   <div className="d-flex gap-2">
                      <div className="text-center" title="Custom Accent Color">
                         <span className="d-block fs-9 text-slate-400">Accent</span>
                         <input 
                            type="color"
                            value={tenantConfig.customPrimaryColor || '#00f2fe'}
                            onChange={(e) => {
                               const updated = { ...tenantConfig, activeThemeId: 'custom', customPrimaryColor: e.target.value };
                               setTenantConfig(updated);
                               localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
                            }}
                            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                         />
                      </div>
                      <div className="text-center" title="Custom Background Tint">
                         <span className="d-block fs-9 text-slate-400">Background</span>
                         <input 
                            type="color"
                            value={tenantConfig.customBgColor || '#060a12'}
                            onChange={(e) => {
                               const updated = { ...tenantConfig, activeThemeId: 'custom', customBgColor: e.target.value };
                               setTenantConfig(updated);
                               localStorage.setItem('tenant_theme_config', JSON.stringify(updated));
                            }}
                            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                         />
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </Modal.Body>

        <Modal.Footer className="border-secondary bg-dark-glass py-2 px-3">
          <Button variant="outline-danger" size="sm" className="fw-bold fs-11 py-1" onClick={() => {
             const defaultConfig = { companyName: 'Sochiot Automation', tagline: 'SMARTER AUTOMATION', logoUrl: '', bgWallpaperUrl: '', activeThemeId: 'cyan', customPrimaryColor: '#00f2fe', customBgColor: '#060a12' };
             handleSaveTenantConfig(defaultConfig);
          }}>
             <RefreshCw size={12} className="me-1" /> Restore Original Theme
          </Button>
          <Button variant="info" size="sm" className="fw-bold px-3 text-dark fs-11 py-1" onClick={() => setShowThemeModal(false)}>
             <Check size={14} className="me-1" /> Done
          </Button>
        </Modal.Footer>
      </Modal>

      {/* EXACT MATCH SCADA GLASSMORPHIC STYLES WITH COMPACT MODAL & DYNAMIC THEME SUPPORT */}
      <style dangerouslySetInnerHTML={{ __html: `
        .scada-exact-login-bg {
            background-color: var(--dynamic-bg-color, #060a12) !important;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #f8fafc;
            position: relative;
            transition: background-color 0.4s ease;
        }

        /* FLOATING THEME TOGGLE BUTTON */
        .floating-theme-toggle-btn {
            position: absolute;
            top: 24px;
            right: 28px;
            z-index: 100;
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid var(--dynamic-primary, #00f2fe);
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            gap: 8px;
            backdrop-filter: blur(12px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .floating-theme-toggle-btn:hover {
            transform: translateY(-2px) scale(1.03);
            box-shadow: 0 8px 25px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.5);
        }

        .theme-btn-icon {
            color: var(--dynamic-primary, #00f2fe);
        }

        /* COMPACT MODAL STYLES */
        .compact-tenant-modal .modal-content {
            background: #0b111e !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            border-radius: 16px !important;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.9) !important;
        }

        .cyber-modal-input-compact {
            background: rgba(15, 23, 42, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            color: #ffffff !important;
            padding: 6px 10px !important;
            border-radius: 8px !important;
            font-size: 0.82rem !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            cursor: text !important;
        }

        .cyber-modal-input-compact::placeholder {
            color: rgba(255, 255, 255, 0.45) !important;
        }

        .cyber-modal-input-compact:focus {
            border-color: var(--dynamic-primary, #00f2fe) !important;
            box-shadow: 0 0 10px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.3) !important;
            color: #ffffff !important;
        }

        .compact-themes-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }

        @media (max-width: 768px) {
            .compact-themes-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        .compact-theme-card {
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.2s ease;
        }

        .compact-theme-card:hover {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(30, 41, 59, 0.8);
        }

        .compact-theme-card.theme-active {
            border-color: var(--dynamic-primary, #00f2fe) !important;
            background: rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.15) !important;
            box-shadow: inset 0 0 10px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.2);
        }

        /* LEFT HERO SIDE */
        .hero-exact-side {
            width: 53%;
            background: ${tenantConfig.bgWallpaperUrl ? 'rgba(6, 10, 18, 0.72)' : 'var(--dynamic-bg-color, #060a12)'};
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            position: relative;
            transition: background 0.4s ease;
            backdrop-filter: ${tenantConfig.bgWallpaperUrl ? 'blur(12px)' : 'none'};
        }

        .hero-ambient-glow {
            position: absolute;
            top: 20%;
            left: 10%;
            width: 480px;
            height: 480px;
            background: radial-gradient(circle, rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.22) 0%, rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.05) 50%, transparent 70%);
            filter: blur(110px);
            pointer-events: none;
            z-index: 1;
            transition: background 0.4s ease;
        }

        .hero-exact-title {
            font-size: 2.75rem;
            font-weight: 400;
            color: #ffffff;
            letter-spacing: -0.02em;
        }

        .hero-gradient-text {
            background: var(--dynamic-gradient, linear-gradient(90deg, #00f2fe 0%, #38bdf8 100%));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 600;
        }

        .hero-underline-bar {
            width: 44px;
            height: 3px;
            background: var(--dynamic-primary, #00f2fe);
            border-radius: 2px;
            box-shadow: 0 0 10px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.6);
        }

        .hero-exact-subtext {
            color: #94a3b8;
            font-size: 0.95rem;
            line-height: 1.6;
        }

        /* EXPANDED TALL HERO IMAGE CARD */
        .hero-image-card-container {
            width: 100%;
            min-height: 420px;
            max-height: 520px;
            border: 1px solid rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.35);
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.25);
            background: #090e1a;
            transition: all 0.4s ease;
        }

        .hero-scada-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            filter: contrast(1.1) brightness(1.05);
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-image-card-container:hover .hero-scada-image {
            transform: scale(1.025);
        }

        .hero-image-overlay-gradient {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(180deg, rgba(6, 10, 18, 0.05) 0%, rgba(6, 10, 18, 0.65) 100%);
            pointer-events: none;
        }

        .hero-image-live-pill {
            position: absolute;
            bottom: 18px;
            left: 18px;
            background: rgba(6, 10, 18, 0.88);
            border: 1px solid rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.45);
            backdrop-filter: blur(12px);
            padding: 7px 16px;
            border-radius: 20px;
            font-size: 0.74rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            color: var(--dynamic-primary, #00f2fe);
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 5;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            transition: all 0.4s ease;
        }

        .live-pulse-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: var(--dynamic-primary, #00f2fe);
            box-shadow: 0 0 10px var(--dynamic-primary, #00f2fe);
            animation: livePulse 1.5s infinite;
        }

        @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
        }

        .hero-badge-pill {
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.2);
            color: #e2e8f0;
            font-size: 0.8rem;
            font-weight: 600;
            transition: all 0.4s ease;
        }

        .text-cyan-exact {
            color: var(--dynamic-primary, #00f2fe) !important;
            transition: color 0.4s ease;
        }

        .hero-copyright-text {
            color: #64748b;
            font-size: 0.8rem;
        }

        /* RIGHT GLASS AUTH CARD WITH RECTANGULAR EDGE BEAMS */
        .auth-exact-side {
            background: ${tenantConfig.bgWallpaperUrl ? 'rgba(6, 10, 18, 0.70)' : 'var(--dynamic-bg-color, #060a12)'};
            transition: background 0.4s ease;
            backdrop-filter: ${tenantConfig.bgWallpaperUrl ? 'blur(12px)' : 'none'};
        }

        .exact-glass-card {
            background: rgba(11, 17, 30, 0.92) !important;
            border: 1px solid rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.25) !important;
            box-shadow: 0 30px 70px -10px rgba(0, 0, 0, 0.95), 0 0 45px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.2) !important;
            border-radius: 28px !important;
            position: relative;
            overflow: hidden;
            transition: all 0.4s ease;
        }

        /* 4 RECTANGULAR EDGE BEAMS STAYING STRICTLY ON BORDER EDGES */
        .edge-beam-top {
            position: absolute;
            top: 0;
            left: -100%;
            width: 60%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--dynamic-primary, #00f2fe), var(--dynamic-primary, #38bdf8), transparent);
            box-shadow: 0 0 12px var(--dynamic-primary, #00f2fe), 0 0 20px var(--dynamic-primary, #00f2fe);
            animation: moveTopEdge 4s linear infinite;
            z-index: 5;
        }

        .edge-beam-right {
            position: absolute;
            top: -100%;
            right: 0;
            width: 2px;
            height: 60%;
            background: linear-gradient(180deg, transparent, var(--dynamic-primary, #00f2fe), var(--dynamic-primary, #38bdf8), transparent);
            box-shadow: 0 0 12px var(--dynamic-primary, #00f2fe), 0 0 20px var(--dynamic-primary, #00f2fe);
            animation: moveRightEdge 4s linear infinite 1s;
            z-index: 5;
        }

        .edge-beam-bottom {
            position: absolute;
            bottom: 0;
            right: -100%;
            width: 60%;
            height: 2px;
            background: linear-gradient(270deg, transparent, var(--dynamic-primary, #00f2fe), var(--dynamic-primary, #38bdf8), transparent);
            box-shadow: 0 0 12px var(--dynamic-primary, #00f2fe), 0 0 20px var(--dynamic-primary, #00f2fe);
            animation: moveBottomEdge 4s linear infinite 2s;
            z-index: 5;
        }

        .edge-beam-left {
            position: absolute;
            bottom: -100%;
            left: 0;
            width: 2px;
            height: 60%;
            background: linear-gradient(0deg, transparent, var(--dynamic-primary, #00f2fe), var(--dynamic-primary, #38bdf8), transparent);
            box-shadow: 0 0 12px var(--dynamic-primary, #00f2fe), 0 0 20px var(--dynamic-primary, #00f2fe);
            animation: moveLeftEdge 4s linear infinite 3s;
            z-index: 5;
        }

        @keyframes moveTopEdge {
            0% { left: -60%; }
            100% { left: 100%; }
        }

        @keyframes moveRightEdge {
            0% { top: -60%; }
            100% { top: 100%; }
        }

        @keyframes moveBottomEdge {
            0% { right: -60%; }
            100% { right: 100%; }
        }

        @keyframes moveLeftEdge {
            0% { bottom: -60%; }
            100% { bottom: 100%; }
        }

        /* HEADER SHIELD BADGE */
        .badge-shield-outer {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.08);
            border: 1px solid rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.25);
        }

        .badge-shield-inner {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: #0b111e;
            border: 1px solid rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.45);
            box-shadow: inset 0 0 15px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.2);
        }

        .card-exact-title {
            color: #ffffff;
            font-size: 1.65rem;
            font-weight: 700;
        }

        .card-exact-subtitle {
            color: #94a3b8;
            font-size: 0.85rem;
        }

        /* FORM FIELD STYLING */
        .exact-field-label {
            color: #cbd5e1;
            font-size: 0.85rem;
            font-weight: 500;
        }

        .exact-field-icon {
            position: absolute;
            left: 14px;
            top: 38px;
            color: var(--dynamic-primary, #38bdf8);
            z-index: 5;
            pointer-events: none;
        }

        .exact-cyber-input {
            background: #0e1626 !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            color: #ffffff !important;
            padding: 12px 14px 12px 44px !important;
            border-radius: 12px !important;
            font-size: 0.9rem !important;
            transition: all 0.25s ease !important;
        }

        .exact-cyber-input::placeholder {
            color: #475569 !important;
        }

        .exact-cyber-input:focus {
            border-color: var(--dynamic-primary, #00f2fe) !important;
            box-shadow: 0 0 18px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.25) !important;
            background: #111a2e !important;
        }

        .exact-cyber-checkbox .form-check-input {
            background-color: #0e1626;
            border-color: rgba(255, 255, 255, 0.25);
            cursor: pointer;
        }

        .exact-cyber-checkbox .form-check-input:checked {
            background-color: var(--dynamic-primary, #00f2fe);
            border-color: var(--dynamic-primary, #00f2fe);
        }

        .forgot-exact-link {
            color: var(--dynamic-primary, #0ea5e9);
            font-weight: 500;
            transition: color 0.2s ease;
        }

        .forgot-exact-link:hover {
            color: #ffffff;
        }

        /* PRIMARY SIGN IN BUTTON */
        .exact-main-btn {
            background: var(--dynamic-gradient, linear-gradient(90deg, #00f2fe 0%, #38bdf8 50%, #4facfe 100%)) !important;
            color: #030712 !important;
            font-size: 0.9rem !important;
            font-weight: 800 !important;
            letter-spacing: 0.04em !important;
            border-radius: 12px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 6px 20px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.35) !important;
        }

        .exact-main-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 28px rgba(var(--dynamic-primary-rgb, 0, 242, 254), 0.55) !important;
            filter: brightness(1.05);
        }

        /* SSO DIVIDER */
        .exact-sso-divider {
            position: relative;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .exact-sso-text {
            position: absolute;
            top: -9px;
            left: 50%;
            transform: translateX(-50%);
            background: #0b111e;
            padding: 0 14px;
            color: #64748b;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.06em;
        }

        /* SSO BUTTONS */
        .exact-sso-btn {
            background: rgba(14, 22, 38, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #e2e8f0 !important;
            padding: 11px 16px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.25s ease;
            cursor: pointer;
        }

        .exact-sso-btn:hover:not(:disabled) {
            background: rgba(22, 34, 58, 0.95) !important;
            border-color: var(--dynamic-primary, #00f2fe) !important;
            color: #ffffff !important;
            transform: translateY(-2px);
        }

        .bg-red-glass { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); }
        .text-red-glow { color: #fca5a5; }
        .bg-green-glass { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }
        .text-green-glow { color: #6ee7b7; }
      `}} />
    </div>
  );
};

export default Login;
