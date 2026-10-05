import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Card, Badge, Form, Button, Modal, Table } from 'react-bootstrap';
import { 
  Wind, Thermometer, Droplets, Zap, Power, Settings, Fan, MapPin, 
  Clock, Info, Activity, Edit2, Eye, EyeOff, Trash2, Play, Square, 
  CheckCircle, Check, X, ChevronDown, ChevronUp, ChevronRight, Cpu, Gauge, RefreshCw, Sliders, UserCheck, User,
  Wifi, Radio, Calendar, List, Hand, Maximize2, Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSiteStore } from '../../context/SiteContext';
import { useNavigate } from 'react-router-dom';
import apiClient, { normalizeList } from '../../services/apiClient';
import { getDeviceTemplateSettings, extractTelemetryValue } from '../../utils/telemetryMatcher';

// --- 12 INITIAL AC UNITS MATCHING DASHBOARD SCREENSHOT ---
const INITIAL_ACS = [
  { id: 1, name: 'Master AC', type: '', room: 'SANJAY', status: 'ON', mode: '--', setTemp: 30.3, roomTemp: 30.3, fanSpeed: '--', powerUsage: 0.89, scheduleStart: '', scheduleEnd: '', operationMode: 'Auto', activeAutoOptions: ['SENSOR'] },
  { id: 2, name: 'Lobby AC', type: '2.0 Ton Cassette AC', room: 'LOBBY', status: 'ON', mode: '--', setTemp: 30.3, roomTemp: 30.3, fanSpeed: '--', powerUsage: 0.89, scheduleStart: '', scheduleEnd: '', operationMode: 'Auto', activeAutoOptions: ['SENSOR'] },
  { id: 3, name: 'Main Hall AC', type: '2.0 Ton Cassette AC', room: 'HALL', status: 'ON', mode: '--', setTemp: 30.3, roomTemp: 30.3, fanSpeed: '--', powerUsage: 0.89, scheduleStart: '', scheduleEnd: '', operationMode: 'Auto', activeAutoOptions: ['SENSOR'] },
  { id: 4, name: 'Server Room AC', type: '2.0 Ton Cassette AC', room: 'SERVER ROOM', status: 'ON', mode: '--', setTemp: 30.3, roomTemp: 30.3, fanSpeed: '--', powerUsage: 0.89, scheduleStart: '', scheduleEnd: '', operationMode: 'Auto', activeAutoOptions: ['SENSOR'] },
  { id: 5, name: 'User AC', type: '1.5 Ton Split AC', room: 'USER OFFICE', status: 'OFF', mode: '--', setTemp: '--', roomTemp: null, fanSpeed: '--', powerUsage: 0, scheduleStart: '', scheduleEnd: '', operationMode: 'Manual', activeAutoOptions: [] },
  { id: 6, name: 'HO AC', type: '2.0 Ton Split AC', room: 'HO OFFICE', status: 'OFF', mode: '--', setTemp: '--', roomTemp: null, fanSpeed: '--', powerUsage: 0, scheduleStart: '', scheduleEnd: '', operationMode: 'Manual', activeAutoOptions: [] },
  { id: 7, name: 'AC_7', type: '1.5 Ton Split AC', room: 'ZONE 7', status: 'OFF', mode: '--', setTemp: '--', roomTemp: null, fanSpeed: '--', powerUsage: 0, scheduleStart: '', scheduleEnd: '', operationMode: 'Manual', activeAutoOptions: [] },
  { id: 8, name: 'AC_8', type: '1.5 Ton Split AC', room: 'ZONE 8', status: 'OFF', mode: '--', setTemp: '--', roomTemp: null, fanSpeed: '--', powerUsage: 0, scheduleStart: '', scheduleEnd: '', operationMode: 'Manual', activeAutoOptions: [] },
  { id: 9, name: 'AC_9', type: '1.5 Ton Split AC', room: 'ZONE 9', status: 'OFF', mode: '--', setTemp: '--', roomTemp: null, fanSpeed: '--', powerUsage: 0, scheduleStart: '', scheduleEnd: '', operationMode: 'Manual', activeAutoOptions: [] },
  { id: 10, name: 'AC_10', type: '1.5 Ton Split AC', room: 'ZONE 10', status: 'OFF', mode: '--', setTemp: '--', roomTemp: null, fanSpeed: '--', powerUsage: 0, scheduleStart: '', scheduleEnd: '', operationMode: 'Manual', activeAutoOptions: [] },
  { id: 11, name: 'AC_11', type: '1.5 Ton Split AC', room: 'ZONE 11', status: 'OFF', mode: '--', setTemp: '--', roomTemp: null, fanSpeed: '--', powerUsage: 0, scheduleStart: '', scheduleEnd: '', operationMode: 'Manual', activeAutoOptions: [] },
  { id: 12, name: 'AC_12', type: '1.5 Ton Split AC', room: 'ZONE 12', status: 'OFF', mode: '--', setTemp: '--', roomTemp: null, fanSpeed: '--', powerUsage: 0, scheduleStart: '', scheduleEnd: '', operationMode: 'Manual', activeAutoOptions: [] },
];

// --- CANONICAL FIELDS MATCHING USER'S REAL HARDWARE DEVICE & TEMPLATE ---
const CANONICAL_AC_FIELDS = [
  { id: 1, displayName: 'Room Temperature', moduleId: 'T&H', eventField: '3,1', unit: '°C', defaultOnValue: 30.3, defaultOffValue: 30.3, icon: 'Thermometer', isDisplayed: true, showOnDashboard: true },
  { id: 2, displayName: 'Humidity', moduleId: 'T&H', eventField: '3,2', unit: '%', defaultOnValue: 41.9, defaultOffValue: 41.9, icon: 'Droplets', isDisplayed: true, showOnDashboard: true },
  { id: 3, displayName: 'kWh-R', moduleId: 'PARM', eventField: '3,132F', unit: 'KWH', defaultOnValue: 2.78, defaultOffValue: 2.78, icon: 'Zap', isDisplayed: true, showOnDashboard: true },
  { id: 4, displayName: 'kWh-Y', moduleId: 'PARM', eventField: '3,134F', unit: 'KWH', defaultOnValue: 0, defaultOffValue: 0, icon: 'Zap', isDisplayed: false, showOnDashboard: false },
  { id: 5, displayName: 'kWh-B', moduleId: 'PARM', eventField: '3,136F', unit: 'KWH', defaultOnValue: 0, defaultOffValue: 0, icon: 'Zap', isDisplayed: false, showOnDashboard: false },
  { id: 6, displayName: 'PF-R', moduleId: 'PARM', eventField: '3,124F', unit: 'PF', defaultOnValue: 0.98, defaultOffValue: 0.98, icon: 'Activity', isDisplayed: false, showOnDashboard: false },
  { id: 7, displayName: 'PF-Y', moduleId: 'PARM', eventField: '3,126F', unit: '', defaultOnValue: 0.99, defaultOffValue: 0.99, icon: 'Activity', isDisplayed: false, showOnDashboard: false },
  { id: 8, displayName: 'PF-B', moduleId: 'PARM', eventField: '3,128F', unit: '', defaultOnValue: 0.99, defaultOffValue: 0.99, icon: 'Activity', isDisplayed: false, showOnDashboard: false },
  { id: 9, displayName: 'Avg. Voltage L-L', moduleId: 'CHANGE', eventField: '3,140F', unit: 'V', defaultOnValue: 75.72, defaultOffValue: 75.72, icon: 'Zap', isDisplayed: false, showOnDashboard: false },
  { id: 10, displayName: 'Average Current', moduleId: 'CHANGE', eventField: '3,142F', unit: 'A', defaultOnValue: 1.34, defaultOffValue: 0.0, icon: 'Activity', isDisplayed: false, showOnDashboard: false },
  { id: 11, displayName: 'Power kVA (Avg.)', moduleId: 'CHANGE', eventField: '3,146F', unit: 'kVA', defaultOnValue: 0.91, defaultOffValue: 0.0, icon: 'Zap', isDisplayed: false, showOnDashboard: false },
  { id: 12, displayName: 'Voltage R-N', moduleId: 'CHANGE', eventField: '3,100F', unit: 'V', defaultOnValue: 226.98, defaultOffValue: 226.98, icon: 'Zap', isDisplayed: true, showOnDashboard: true },
  { id: 13, displayName: 'Voltage Y-N', moduleId: 'CHANGE', eventField: '3,102F', unit: 'V', defaultOnValue: 0.16, defaultOffValue: 0.16, icon: 'Zap', isDisplayed: false, showOnDashboard: false },
  { id: 14, displayName: 'Voltage B-R', moduleId: 'CHANGE', eventField: '3,104F', unit: 'V', defaultOnValue: 0.06, defaultOffValue: 0.06, icon: 'Zap', isDisplayed: false, showOnDashboard: false },
  { id: 15, displayName: 'Current L1', moduleId: 'CHANGE', eventField: '3,108F', unit: 'A', defaultOnValue: 4.0, defaultOffValue: 0.0, icon: 'Activity', isDisplayed: true, showOnDashboard: true },
  { id: 16, displayName: 'Current L2', moduleId: 'CHANGE', eventField: '3,110F', unit: 'A', defaultOnValue: 0.0, defaultOffValue: 0.0, icon: 'Activity', isDisplayed: false, showOnDashboard: false },
  { id: 17, displayName: 'Current L3', moduleId: 'CHANGE', eventField: '3,112F', unit: 'A', defaultOnValue: 0.0, defaultOffValue: 0.0, icon: 'Activity', isDisplayed: false, showOnDashboard: false },
  { id: 18, displayName: 'kW-R', moduleId: 'CHANGE', eventField: '3,116F', unit: 'KW', defaultOnValue: 0.88, defaultOffValue: 0.0, icon: 'Zap', isDisplayed: true, showOnDashboard: true },
  { id: 19, displayName: 'kW-Y', moduleId: 'CHANGE', eventField: '3,118F', unit: 'KW', defaultOnValue: 0.0, defaultOffValue: 0.0, icon: 'Zap', isDisplayed: false, showOnDashboard: false },
  { id: 20, displayName: 'kW-B', moduleId: 'CHANGE', eventField: '3,120F', unit: 'KW', defaultOnValue: 0.0, defaultOffValue: 0.0, icon: 'Zap', isDisplayed: false, showOnDashboard: false },
];

/**
 * Resolves all telemetry fields for an AC unit from:
 * 1. Linked device's custom template settings (if registered in system)
 * 2. Incoming real-time events payload (from /events/latest API)
 * 3. Canonical defaults matching the user's template configuration
 */
export const resolveUnitTelemetry = (unit, linkedDevice, liveEvents) => {
  const devSettings = linkedDevice ? getDeviceTemplateSettings(linkedDevice) : [];
  const fieldsToProcess = (Array.isArray(devSettings) && devSettings.length > 0) ? devSettings : CANONICAL_AC_FIELDS;

  return fieldsToProcess.map((field, idx) => {
    const displayName = field.displayName || field.name || field.sochiotFieldName || `Field ${idx + 1}`;
    const moduleId = field.moduleId || field.module_id || field.moduleName || field.module || '--';
    const eventField = field.sochiotFieldName || field.eventField || field.fieldName || '--';
    
    // Auto-detect unit if not explicitly in setting
    let unitStr = field.unit || '';
    if (!unitStr) {
      const lower = displayName.toLowerCase();
      if (lower.includes('temp')) unitStr = '°C';
      else if (lower.includes('humidity')) unitStr = '%';
      else if (lower.includes('power') || (lower.includes('kw') && !lower.includes('kwh'))) unitStr = 'kW';
      else if (lower.includes('voltage')) unitStr = 'V';
      else if (lower.includes('current')) unitStr = 'A';
      else if (lower.includes('kwh')) unitStr = 'KWH';
    }

    let liveReading = null;
    if (liveEvents) {
      liveReading = extractTelemetryValue(field, liveEvents);
    }

    let val = liveReading?.value;
    if (val === undefined || val === null) {
      const canonicalMatch = CANONICAL_AC_FIELDS.find(cf => 
        cf.displayName.toLowerCase() === displayName.toLowerCase() ||
        cf.eventField.toLowerCase().replace(/,/g, '.') === String(eventField).toLowerCase().replace(/,/g, '.')
      );
      if (unit.status === 'ON') {
        val = canonicalMatch ? canonicalMatch.defaultOnValue : (field.defaultOnValue ?? (unitStr === '°C' ? 30.3 : unitStr === 'kW' ? 0.88 : unitStr === 'V' ? 226.98 : unitStr === 'A' ? 1.34 : 0));
      } else {
        val = canonicalMatch ? canonicalMatch.defaultOffValue : (field.defaultOffValue ?? null);
      }
    }

    let displayVal = '--';
    if (val !== null && val !== undefined && val !== '--') {
      const num = Number(val);
      if (!isNaN(num)) {
        if (Number.isInteger(num)) {
          displayVal = num.toString();
        } else {
          // Precise formatting with up to 2 decimal places (e.g. 0.06, 0.16, 0.99, 30.3, 75.72)
          displayVal = Number(num.toFixed(2)).toString();
        }
      } else {
        displayVal = String(val);
      }
    }

    // Determine whether this field is toggled ON:
    let isFieldActive = true;
    if (field.isDisplayed !== undefined || field.showOnDashboard !== undefined) {
      isFieldActive = field.isDisplayed !== false && field.showOnDashboard !== false;
    } else {
      const canonicalMatch = CANONICAL_AC_FIELDS.find(cf => 
        cf.displayName.toLowerCase() === displayName.toLowerCase() ||
        cf.eventField.toLowerCase().replace(/,/g, '.') === String(eventField).toLowerCase().replace(/,/g, '.')
      );
      if (canonicalMatch) {
        isFieldActive = canonicalMatch.isDisplayed === true;
      } else {
        const lower = displayName.toLowerCase();
        isFieldActive = [
          'room temp', 'temperature', 'temp',
          'humidity',
          'kwh-r', 'energy',
          'voltage r-n',
          'current l1',
          'active power', 'kw-r'
        ].some(term => lower.includes(term)) || ['3,1', '3,2', '3,132F', '3,100F', '3,108F', '3,116F'].includes(eventField);
      }
    }

    return {
      id: field.id || idx + 1,
      displayName,
      moduleId,
      eventField,
      unit: unitStr,
      value: val,
      displayVal,
      isLive: Boolean(liveReading),
      updatedAt: liveReading?.updatedAt,
      isDisplayed: isFieldActive,
      showOnDashboard: isFieldActive
    };
  });
};

// --- OCCUPANT OFFICER AVATAR MATCHING USER'S MOCKUP WITH RADAR & PULSE ANIMATIONS ---
const OfficerAvatar = ({ size = 48, isOccupied = true }) => {
  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
      {/* Animated Expanding Ripple Wave when Occupied */}
      {isOccupied && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          left: '-4px',
          right: '-4px',
          bottom: '-4px',
          borderRadius: '50%',
          border: '2px solid rgba(16, 185, 129, 0.75)',
          animation: 'occupiedRipple 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
          pointerEvents: 'none'
        }} />
      )}

      {/* Main Avatar Container with Pulsing Halo Ring */}
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isOccupied 
          ? 'radial-gradient(circle, #064e3b 0%, #022c22 100%)' 
          : 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
        border: isOccupied ? '2.5px solid #10b981' : '2px solid rgba(148, 163, 184, 0.3)',
        animation: isOccupied ? 'occupiedPulse 2.5s infinite ease-in-out' : 'none',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ 
          animation: isOccupied ? 'avatarFloat 3s infinite ease-in-out' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width={size * 0.9} height={size * 0.9} viewBox="0 0 64 64" fill="none" style={{ marginTop: '4px' }}>
            {/* Officer Cap */}
            <path d="M16 20 C16 11, 48 11, 48 20 Z" fill="#1e3a8a" />
            <ellipse cx="32" cy="20" rx="17" ry="4" fill="#0f172a" />
            <circle cx="32" cy="15" r="3" fill="#fbbf24" />
            {/* Face & Ears */}
            <ellipse cx="18" cy="28" rx="2.5" ry="4" fill="#fbd2a9" />
            <ellipse cx="46" cy="28" rx="2.5" ry="4" fill="#fbd2a9" />
            <ellipse cx="32" cy="29" rx="12" ry="11" fill="#fbd2a9" />
            {/* Eyes & Eyebrows */}
            <ellipse cx="27" cy="28" rx="1.8" ry="2.2" fill="#0f172a" />
            <ellipse cx="37" cy="28" rx="1.8" ry="2.2" fill="#0f172a" />
            <path d="M24 24 Q27 23 30 25" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M34 25 Q37 23 40 24" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Nose & Smile */}
            <path d="M32 29 L31.5 32 L33 32" stroke="#d97706" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M29 35 Q32 37.5 35 35" stroke="#b45309" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            {/* Uniform */}
            <path d="M16 42 L48 42 L54 64 L10 64 Z" fill="#1e3a8a" />
            <path d="M27 42 L32 50 L37 42 Z" fill="#ffffff" />
            <path d="M30 46 L34 46 L32 57 Z" fill="#0f172a" />
            {/* Epaulettes */}
            <path d="M14 43 L22 43 L20 46 L13 46 Z" fill="#fbbf24" />
            <path d="M42 43 L50 43 L51 46 L44 46 Z" fill="#fbbf24" />
            {/* Badge */}
            <polygon points="22,50 25,53 23,56 20,54" fill="#fbbf24" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const RealisticAC = ({ unit, liveCurrentL1, liveTemp, isLarge = false }) => {
  const displayCurrent = liveCurrentL1 !== undefined && liveCurrentL1 !== null && liveCurrentL1 !== '--' ? liveCurrentL1 : '4.03';
  const displayTemp = liveTemp !== undefined && liveTemp !== null && liveTemp !== '--' ? liveTemp : '30.3';
  const isRunning = unit.status === 'ON';

  return (
    <div style={{
      width: '100%',
      maxWidth: isLarge ? '680px' : '100%',
      margin: isLarge ? '0 auto' : '0',
      position: 'relative',
      marginBottom: isRunning ? (isLarge ? '34px' : '22px') : (isLarge ? '12px' : '4px')
    }}>
      {/* Main AC Indoor Body */}
      <div style={{
        width: '100%',
        height: isLarge ? '128px' : '86px',
        background: 'linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 35%, #cbd5e1 75%, #94a3b8 100%)',
        borderRadius: isLarge ? '18px' : '14px',
        position: 'relative',
        boxShadow: isRunning 
          ? (isLarge 
              ? '0 16px 40px rgba(0,0,0,0.45), inset 0 3px 6px rgba(255,255,255,0.95), 0 0 35px rgba(14, 165, 233, 0.25)' 
              : '0 10px 28px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.9), 0 0 20px rgba(14, 165, 233, 0.15)')
          : (isLarge 
              ? '0 12px 32px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.8)' 
              : '0 8px 24px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.7)'),
        border: '1.5px solid rgba(255,255,255,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isLarge ? '12px 0' : '8px 0',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Top Bevel / Accent Line */}
        <div className="d-flex justify-content-center">
          <div style={{ 
            width: isLarge ? '80px' : '48px', 
            height: isLarge ? '3.5px' : '2.5px', 
            background: '#64748b', 
            borderRadius: '4px', 
            opacity: 0.45 
          }}></div>
        </div>
        
        {/* Sensor (IR / Intake Receiver) */}
        <div style={{
          position: 'absolute',
          left: isLarge ? '36px' : '26px',
          top: isLarge ? '32px' : '22px',
          width: isLarge ? '18px' : '14px',
          height: isLarge ? '9px' : '7px',
          borderRadius: '4px',
          background: '#090d16',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 1px rgba(255,255,255,0.1)',
          border: '1px solid rgba(0,0,0,0.6)'
        }}></div>

        {/* Digital Display (Current L1 & Temp) with Premium Tinted Display Box */}
        <div style={{
          position: 'absolute',
          right: isLarge ? '24px' : '15px',
          top: isLarge ? '22px' : '16px',
          background: '#090d16',
          padding: isLarge ? '6px 14px' : '4px 10px',
          borderRadius: isLarge ? '10px' : '8px',
          display: 'flex',
          alignItems: 'center',
          gap: isLarge ? '12px' : '8px',
          fontFamily: "'Courier New', monospace",
          fontWeight: 'bold',
          fontSize: isLarge ? '15px' : '12px',
          boxShadow: isRunning ? '0 0 18px rgba(245, 158, 11, 0.45), inset 0 0 6px rgba(0,0,0,0.8)' : 'inset 0 0 6px rgba(0,0,0,0.9)',
          border: '1.5px solid rgba(245, 158, 11, 0.45)',
          transition: 'all 0.3s ease'
        }}>
          {/* L1 Current Display */}
          <span style={{ 
            color: isRunning ? '#ffffff' : '#64748b', 
            letterSpacing: '0.8px',
            fontSize: isLarge ? '14px' : '11px'
          }}>
            {isRunning ? `L1: ${displayCurrent} A` : 'L1: 0.00 A'}
          </span>
          {/* Temp Display in highlighted amber box */}
          <span style={{ 
            background: isRunning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.1)',
            padding: isLarge ? '3px 8px' : '2px 6px',
            borderRadius: '5px',
            color: isRunning ? '#fbbf24' : '#64748b',
            border: isRunning ? '1.2px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(255,255,255,0.05)',
            textShadow: isRunning ? '0 0 10px rgba(245, 158, 11, 0.7)' : 'none',
            letterSpacing: '0.5px',
            fontSize: isLarge ? '16px' : '12px'
          }}>
            {displayTemp}°
          </span>
        </div>
        
        {/* Status LED */}
        <div style={{
          position: 'absolute',
          left: isLarge ? '22px' : '16px',
          top: isLarge ? '33px' : '23px',
          width: isLarge ? '8px' : '6px',
          height: isLarge ? '8px' : '6px',
          borderRadius: '50%',
          background: isRunning ? '#10b981' : '#ef4444',
          boxShadow: isRunning 
            ? (isLarge ? '0 0 14px #10b981, 0 0 6px #34d399' : '0 0 10px #10b981, 0 0 4px #34d399')
            : '0 0 5px rgba(239, 68, 68, 0.5)',
          transition: 'all 0.3s ease'
        }}></div>

        {/* Air Vent Cavity & Motorized Flap */}
        <div style={{
          width: isLarge ? '94%' : '90%',
          margin: '0 auto',
          height: isLarge ? '22px' : '15px',
          background: '#070b14',
          borderRadius: '4px',
          marginTop: 'auto',
          marginBottom: isLarge ? '5px' : '3px',
          boxShadow: 'inset 0 5px 8px rgba(0,0,0,0.95), inset 0 -1px 2px rgba(255,255,255,0.1)',
          position: 'relative',
          perspective: isLarge ? '600px' : '450px'
        }}>
          {/* Motorized Louver Flap */}
          <div style={{
             position: 'absolute',
             top: 0, left: 0, right: 0, bottom: 0,
             background: 'linear-gradient(to bottom, #94a3b8 0%, #64748b 60%, #475569 100%)',
             transformOrigin: 'top',
             transform: isRunning ? 'rotateX(72deg)' : 'rotateX(0deg)',
             transition: 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
             borderRadius: '3px',
             boxShadow: isRunning ? '0 12px 18px rgba(0,0,0,0.65)' : '0 2px 4px rgba(0,0,0,0.2)',
             borderBottom: isLarge ? '2px solid rgba(255,255,255,0.5)' : '1.5px solid rgba(255,255,255,0.45)'
          }}></div>
        </div>
      </div>

      {/* REALISTIC COOL AIRFLOW BREEZE WAVES & STREAMS (ONLY ACTIVE WHEN AC RUNNING) */}
      {isRunning && (
        <div 
          className="realistic-airflow-container"
          style={{
            position: 'absolute',
            top: isLarge ? '120px' : '80px',
            left: '3%',
            width: '94%',
            height: isLarge ? '60px' : '42px',
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: 10
          }}
        >
          {/* Ambient Cool Breeze Mist Glow */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '5%',
            width: '90%',
            height: isLarge ? '55px' : '38px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.4) 0%, rgba(6, 182, 212, 0.18) 50%, transparent 80%)',
            filter: 'blur(8px)',
            animation: 'coolMistBreath 2.8s infinite ease-in-out',
            pointerEvents: 'none'
          }} />

          {/* Flowing Air Streams & Cool Waves (SVG) */}
          <svg 
            viewBox="0 0 380 44" 
            style={{
              width: '100%',
              height: isLarge ? '58px' : '44px',
              overflow: 'visible',
              filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))'
            }}
          >
            <defs>
              <linearGradient id="coolAirGradA" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="30%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="coolAirGradB" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#67e8f9" stopOpacity="0.7" />
                <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Downward Cascading Air Current Streams */}
            <path d="M 40,0 Q 30,16 18,38" stroke="url(#coolAirGradA)" strokeWidth={isLarge ? "3.2" : "2.4"} strokeLinecap="round" fill="none" className="air-stream air-s1" />
            <path d="M 85,0 Q 78,18 68,40" stroke="url(#coolAirGradB)" strokeWidth={isLarge ? "2.8" : "2.2"} strokeLinecap="round" fill="none" className="air-stream air-s2" />
            <path d="M 135,0 Q 132,20 126,42" stroke="url(#coolAirGradA)" strokeWidth={isLarge ? "3.6" : "2.8"} strokeLinecap="round" fill="none" className="air-stream air-s3" />
            <path d="M 190,0 Q 190,22 190,44" stroke="url(#coolAirGradA)" strokeWidth={isLarge ? "4.2" : "3.2"} strokeLinecap="round" fill="none" className="air-stream air-s4" />
            <path d="M 245,0 Q 248,20 254,42" stroke="url(#coolAirGradA)" strokeWidth={isLarge ? "3.6" : "2.8"} strokeLinecap="round" fill="none" className="air-stream air-s5" />
            <path d="M 295,0 Q 302,18 312,40" stroke="url(#coolAirGradB)" strokeWidth={isLarge ? "2.8" : "2.2"} strokeLinecap="round" fill="none" className="air-stream air-s6" />
            <path d="M 340,0 Q 350,16 362,38" stroke="url(#coolAirGradA)" strokeWidth={isLarge ? "3.2" : "2.4"} strokeLinecap="round" fill="none" className="air-stream air-s7" />

            {/* Transverse Cool Breeze Ripples */}
            <path d="M 50,12 Q 190,26 330,12" stroke="rgba(186, 230, 253, 0.6)" strokeWidth={isLarge ? "2.2" : "1.6"} strokeDasharray="8 6" fill="none" className="air-wave air-w1" />
            <path d="M 35,24 Q 190,40 345,24" stroke="rgba(56, 189, 248, 0.5)" strokeWidth={isLarge ? "2.4" : "1.8"} strokeDasharray="10 8" fill="none" className="air-wave air-w2" />
            <path d="M 20,34 Q 190,48 360,34" stroke="rgba(6, 182, 212, 0.35)" strokeWidth={isLarge ? "2.0" : "1.5"} strokeDasharray="12 8" fill="none" className="air-wave air-w3" />
          </svg>
        </div>
      )}
    </div>
  );
};

const ACOverview = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { selectedSite, sites } = useSiteStore();

  // Derive the currently-selected site ID exactly like Energy Metering does
  const selectedSiteId = useMemo(() => {
    if (selectedSite) {
      const id = String(selectedSite.id ?? selectedSite.siteId ?? selectedSite._id ?? '');
      if (id) return id;
    }
    if (sites && sites.length > 0) {
      const first = sites[0];
      return String(first.id ?? first.siteId ?? first._id ?? '');
    }
    return '';
  }, [selectedSite, sites]);

  // Helper: extract siteId from a raw device object
  const getDeviceSiteId = (dev) =>
    dev?.siteId ?? dev?.site_id ?? dev?.site?.id ?? dev?.site?.siteId ?? dev?.site?._id ?? null;

  const [units, setUnits] = useState(() => {
    try {
      const saved = localStorage.getItem('bms_ac_units');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_ACS to ensure all 12 units exist while keeping user edits
          const merged = INITIAL_ACS.map(initU => {
            const existing = parsed.find(p => p.id === initU.id);
            return existing ? { ...initU, ...existing } : initU;
          });
          return merged;
        }
      }
    } catch (e) {}
    return INITIAL_ACS;
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- INLINE EDITING STATE FOR AC NAMES ---
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleStartEditName = (unit, e) => {
    if (e) e.stopPropagation();
    setEditingUnitId(unit.id);
    setEditingName(unit.name);
  };

  const handleSaveName = (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingUnitId(null);
      return;
    }
    setUnits(prev => {
      const updated = prev.map(u => (u.id === id || u.deviceId === id) ? { ...u, name: trimmed } : u);
      if (!updated.some(u => u.id === id || u.deviceId === id)) {
        updated.push({ id, deviceId: id, name: trimmed });
      }
      try { localStorage.setItem('bms_ac_units', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setRegisteredDevices(prev => prev.map(d => (d.id === id || d.id === Number(id)) ? { ...d, name: trimmed } : d));
    // Sync backend device name if deviceId is linked
    const targetUnit = units.find(u => u.id === id) || registeredDevices.find(d => d.id === id);
    const devId = targetUnit?.deviceId || targetUnit?.id || id;
    if (devId) {
      apiClient.patch(`/devices/${devId}`, { name: trimmed }).catch(() => {});
    }
    setEditingUnitId(null);
  };

  const handleCancelEditName = () => {
    setEditingUnitId(null);
    setEditingName('');
  };

  // --- REGISTERED DEVICES & REAL-TIME TELEMETRY STATE ---
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const [deviceTelemetryMap, setDeviceTelemetryMap] = useState({});
  // Independent per-card expansion state: default to empty {} so "More" is shown by default (not "Less")
  const [expandedCardIds, setExpandedCardIds] = useState({});
  const [showAllTelemetryModal, setShowAllTelemetryModal] = useState(false);
  const [inspectingUnit, setInspectingUnit] = useState(null);
  const [showAllRegistersInModal, setShowAllRegistersInModal] = useState(false);

  // In-Card Operation Mode Control State (contained completely inside the card, never pops outside!)
  const [activeControlCardId, setActiveControlCardId] = useState(null);
  // In-Card Operation Mode Control State (opens directly over the card/tile, never far away!)
  const [activeModeUnitId, setActiveModeUnitId] = useState(null);
  const [modalOperationMode, setModalOperationMode] = useState('AUTO'); // 'MANUAL' or 'AUTO'

  const getFieldTheme = (name = '', idx = 0) => {
    const lower = name.toLowerCase();
    if (lower.includes('temp')) {
      return {
        bg: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8) 0%, rgba(12, 18, 32, 0.9) 100%)',
        border: 'rgba(249, 115, 22, 0.45)',
        glow: 'rgba(249, 115, 22, 0.1)',
        unitColor: '#f97316'
      };
    }
    if (lower.includes('humidity')) {
      return {
        bg: 'linear-gradient(135deg, rgba(8, 35, 60, 0.8) 0%, rgba(10, 20, 38, 0.9) 100%)',
        border: 'rgba(6, 182, 212, 0.5)',
        glow: 'rgba(6, 182, 212, 0.1)',
        unitColor: '#06b6d4'
      };
    }
    if (lower.includes('kwh') || lower.includes('energy')) {
      return {
        bg: 'linear-gradient(135deg, rgba(35, 18, 55, 0.8) 0%, rgba(15, 12, 30, 0.9) 100%)',
        border: 'rgba(168, 85, 247, 0.45)',
        glow: 'rgba(168, 85, 247, 0.1)',
        unitColor: '#a855f7'
      };
    }
    if (lower.includes('voltage') || lower.includes('volt')) {
      return {
        bg: 'linear-gradient(135deg, rgba(16, 28, 55, 0.8) 0%, rgba(10, 16, 32, 0.9) 100%)',
        border: 'rgba(59, 130, 246, 0.45)',
        glow: 'rgba(59, 130, 246, 0.1)',
        unitColor: '#3b82f6'
      };
    }
    if (lower.includes('current')) {
      return {
        bg: 'linear-gradient(135deg, rgba(8, 40, 30, 0.8) 0%, rgba(8, 24, 18, 0.9) 100%)',
        border: 'rgba(16, 185, 129, 0.45)',
        glow: 'rgba(16, 185, 129, 0.1)',
        unitColor: '#10b981'
      };
    }
    if (lower.includes('power') || lower.includes('kw') || lower.includes('kva')) {
      return {
        bg: 'linear-gradient(135deg, rgba(8, 35, 30, 0.8) 0%, rgba(8, 22, 20, 0.9) 100%)',
        border: 'rgba(20, 184, 166, 0.45)',
        glow: 'rgba(20, 184, 166, 0.1)',
        unitColor: '#14b8a6'
      };
    }
    const fallbacks = [
      { bg: 'linear-gradient(135deg, rgba(20, 25, 45, 0.8) 0%, rgba(10, 15, 30, 0.9) 100%)', border: 'rgba(99, 102, 241, 0.45)', glow: 'rgba(99, 102, 241, 0.1)', unitColor: '#818cf8' },
      { bg: 'linear-gradient(135deg, rgba(30, 20, 40, 0.8) 0%, rgba(18, 12, 26, 0.9) 100%)', border: 'rgba(236, 72, 153, 0.45)', glow: 'rgba(236, 72, 153, 0.1)', unitColor: '#f472b6' },
      { bg: 'linear-gradient(135deg, rgba(12, 32, 45, 0.8) 0%, rgba(8, 20, 30, 0.9) 100%)', border: 'rgba(14, 165, 233, 0.45)', glow: 'rgba(14, 165, 233, 0.1)', unitColor: '#38bdf8' }
    ];
    return fallbacks[idx % fallbacks.length];
  };

  const openOperationModeModal = (unit) => {
    setModalOperationMode((unit.operationMode || 'Auto').toUpperCase() === 'MANUAL' ? 'MANUAL' : 'AUTO');
    setActiveModeUnitId(prev => (prev === unit.id ? null : unit.id));
  };

  const handleInitiatePower = (unit) => {
    openOperationModeModal(unit);
  };

  const handleConfirmPowerOn = (unitId, mode, autoOption = null) => {
    setUnits(prev => prev.map(u => {
      if (u.id === unitId) {
        let activeOpts = u.activeAutoOptions || [];
        if (mode === 'Auto') {
          activeOpts = autoOption ? [autoOption] : (activeOpts.length > 0 ? activeOpts : ['SENSOR']);
        } else {
          activeOpts = [];
        }
        return {
          ...u,
          status: 'ON',
          operationMode: mode,
          activeAutoOptions: activeOpts,
          powerUsage: 0.89,
          setTemp: (u.setTemp !== '--' && u.setTemp) ? u.setTemp : 30.1,
          roomTemp: 30.1
        };
      }
      return u;
    }));
    setActiveModeUnitId(null);
  };

  const toggleCardExpanded = (unitId) => {
    setExpandedCardIds(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const handleToggleCardControl = (unitId) => {
    setActiveControlCardId(prev => (prev === unitId ? null : unitId));
  };

  const handleSetOperationMode = (unitId, mode) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, operationMode: mode } : u));
    setControlMode(mode);
  };

  const handleCardControlAction = (unitId, action) => {
    if (action === 'SCHEDULE') {
      setActiveControlCardId(null);
      setScheduleTargetId(unitId.toString());
      setShowScheduleModal(true);
      return;
    }

    if (action === 'START') {
      setUnits(prev => prev.map(u => u.id === unitId ? { 
        ...u, 
        status: 'ON', 
        powerUsage: 0.88, 
        setTemp: (u.setTemp !== '--' ? u.setTemp : 30.1), 
        roomTemp: 30.1 
      } : u));
    } else if (action === 'STOP') {
      setUnits(prev => prev.map(u => u.id === unitId ? { 
        ...u, 
        status: 'OFF', 
        powerUsage: 0, 
        setTemp: '--', 
        roomTemp: null 
      } : u));
    }

    setCardSuccessMessage(prev => ({ ...prev, [unitId]: `AC ${action === 'START' ? 'STARTED' : 'STOPPED'} SUCCESSFULLY` }));
    setTimeout(() => {
      setCardSuccessMessage(prev => ({ ...prev, [unitId]: '' }));
    }, 2000);
  };

  const handleCardAutoToggle = (unitId, option) => {
    setUnits(prev => prev.map(u => {
      if (u.id === unitId) {
        const curOpts = u.activeAutoOptions || [];
        const newOpts = curOpts.includes(option) ? curOpts.filter(o => o !== option) : [...curOpts, option];
        return { ...u, activeAutoOptions: newOpts };
      }
      return u;
    }));
  };

  const openInspectTelemetry = (unit, linkedDevice, allMappedFields = [], visibleFields = null, isOnline = false, liveRoomTemp = null, liveCurrentL1 = null) => {
    const activeFields = visibleFields || allMappedFields.filter(f => f.isDisplayed);
    setInspectingUnit({ 
      ...unit, 
      linkedDevice, 
      allFields: allMappedFields, 
      fields: activeFields,
      visibleFields: activeFields,
      isOnline, 
      liveRoomTemp, 
      liveCurrentL1 
    });
    setShowAllRegistersInModal(false);
    setShowAllTelemetryModal(true);
  };

  // 1. Fetch Registered Devices for the currently-selected site (AC category)
  //    Pattern mirrors Energy Metering: pass siteId to every query, filter client-side.
  useEffect(() => {
    // Clear stale devices immediately so cards from the previous site disappear right away
    setRegisteredDevices([]);
    setDeviceTelemetryMap({});

    if (!selectedSiteId) return;

    let isMounted = true;
    const loadRegisteredDevices = async () => {
      try {
        // --- Primary: fetch AC devices scoped to this site ---
        const [siteRes, genericRes] = await Promise.all([
          apiClient.get(`/sites/${selectedSiteId}/devices`, {
            category: 'AC',
            include: 'settings,rules,profile'
          }).catch(() => null),
          apiClient.get('/devices', {
            siteId: String(selectedSiteId),
            category: 'AC',
            include: 'settings,rules,profile'
          }).catch(() => null)
        ]);

        const deviceMap = new Map();
        [siteRes, genericRes].forEach(res => {
          const items = normalizeList(res, 'devices');
          if (Array.isArray(items)) {
            items.forEach(d => {
              const id = String(d.id ?? d.deviceId ?? '');
              if (id && !deviceMap.has(id)) deviceMap.set(id, d);
            });
          }
        });

        let list = Array.from(deviceMap.values());

        // --- Fallback: site-scoped all-devices, then filter by AC category client-side ---
        if (list.length === 0) {
          const fallRes = await apiClient.get('/devices', {
            siteId: String(selectedSiteId),
            include: 'settings,rules,profile'
          }).catch(() => null);
          const allItems = normalizeList(fallRes, 'devices');
          list = allItems.filter(d => {
            const cat = String(d.category || d.profile?.category || '').toUpperCase();
            return cat === 'AC' || cat === 'AIR_CONDITIONER' || cat.includes('AIR') || cat.includes('CONDITIONER');
          });
        }

        // --- Strict client-side siteId filter: never show devices from a different site ---
        list = list.filter(d => {
          const devSiteId = getDeviceSiteId(d);
          if (devSiteId === null || devSiteId === undefined) return true; // no siteId field → trust the API scoping
          return String(devSiteId) === String(selectedSiteId);
        });

        // --- Populate settings for each device if missing ---
        if (list.length > 0) {
          list = await Promise.all(list.map(async (dev) => {
            if (!dev.settings || dev.settings.length === 0) {
              const fullDev = await apiClient.get(`/devices/${dev.id}`).catch(() => null);
              if (fullDev?.settings && fullDev.settings.length > 0) {
                return { ...dev, ...fullDev };
              }
            }
            return dev;
          }));
        }

        if (isMounted) {
          setRegisteredDevices(list); // may be empty — that is correct for unmapped sites
        }
      } catch (err) {
        console.warn('Error fetching registered AC devices:', err);
      }
    };

    loadRegisteredDevices();
    return () => { isMounted = false; };
  }, [selectedSiteId]);

  // 2. Poll Real-time Telemetry Events from Device (/events/latest)
  useEffect(() => {
    if (!registeredDevices || registeredDevices.length === 0) return;

    let isMounted = true;
    const fetchAllTelemetry = async () => {
      try {
        const eventsMap = {};
        await Promise.all(
          registeredDevices.map(async (dev) => {
            const devId = dev.id || dev.deviceId;
            if (!devId) return;
            try {
              const res = await apiClient.get(`/devices/${devId}/events/latest`).catch(() => null)
                       || (selectedSite?.id ? await apiClient.get(`/sites/${selectedSite.id}/devices/${devId}/events/latest`).catch(() => null) : null);
              if (res) {
                const evData = res.data?.events || res.events || res.data?.data || res.data || res;
                eventsMap[devId] = evData;
              }
            } catch (e) {}
          })
        );

        if (isMounted && Object.keys(eventsMap).length > 0) {
          setDeviceTelemetryMap(prev => ({ ...prev, ...eventsMap }));
        }
      } catch (err) {
        console.warn('Telemetry polling error:', err);
      }
    };

    fetchAllTelemetry();
    const interval = setInterval(fetchAllTelemetry, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [registeredDevices, selectedSite]);
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [formData, setFormData] = useState({});

  // Group & Schedule State
  const [acGroups, setAcGroups] = useState(() => {
    const saved = localStorage.getItem('bms_ac_groups');
    return saved ? JSON.parse(saved) : [{ id: 'g1', name: 'Master Control', acIds: [1, 2] }];
  });
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  useEffect(() => {
    try {
      localStorage.setItem('bms_ac_units', JSON.stringify(units));
    } catch (e) {}
  }, [units]);

  useEffect(() => {
    localStorage.setItem('bms_ac_groups', JSON.stringify(acGroups));
  }, [acGroups]);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedACsForGroup, setSelectedACsForGroup] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const [scheduleTargetId, setScheduleTargetId] = useState('');
  const [scheduleData, setScheduleData] = useState({ scheduleStart: '', scheduleEnd: '', mode: 'Cool', setTemp: 24 });

  // Control Action Modal State
  const [showControlModal, setShowControlModal] = useState(false);
  const [controlTargetId, setControlTargetId] = useState(null);
  const [controlMode, setControlMode] = useState('Manual');
  const [controlSuccessMessage, setControlSuccessMessage] = useState('');
  const [autoOptions, setAutoOptions] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime Schedule Runner
  useEffect(() => {
    const now = currentTime;
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    
    const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;

    const savedSchedulesStr = localStorage.getItem('bms_ac_schedules');
    if (!savedSchedulesStr) return;
    
    try {
      const savedSchedules = JSON.parse(savedSchedulesStr);
      
      setUnits(prevUnits => {
        let hasChanges = false;
        const newUnits = prevUnits.map(unit => {
          if (!unit.activeAutoOptions?.includes('SCHEDULE')) return unit;
          
          const acIdStr = unit.id.toString();
          
          const specialSchedules = savedSchedules.special || {};
          let activeSpecialDate = null;
          if (specialSchedules[acIdStr] && specialSchedules[acIdStr].length > 0) {
            activeSpecialDate = specialSchedules[acIdStr].find(d => d.date === dateStr);
          }
          if (!activeSpecialDate && specialSchedules['ALL']) {
            activeSpecialDate = specialSchedules['ALL'].find(d => d.date === dateStr);
          }
          
          const dailySchedules = savedSchedules.daily || {};
          let todaySlots = [];
          if (dailySchedules[acIdStr] && dailySchedules[acIdStr][currentDay] && dailySchedules[acIdStr][currentDay].length > 0) {
            todaySlots = dailySchedules[acIdStr][currentDay];
          } else if (dailySchedules['ALL'] && dailySchedules['ALL'][currentDay]) {
            todaySlots = dailySchedules['ALL'][currentDay];
          }
          
          const activeSlot = todaySlots.find(slot => {
             return currentTimeStr >= slot.start && currentTimeStr < slot.end;
          });

          let expectedPower = unit.status;
          let expectedTemp = unit.setTemp;
          
          if (activeSpecialDate) {
            if (activeSpecialDate.action === 'System OFF') {
              expectedPower = 'OFF';
            } else if (activeSpecialDate.action === 'Custom Temp') {
              expectedTemp = Number(activeSpecialDate.temp);
              expectedPower = 'ON';
            }
          } else if (activeSlot) {
            expectedPower = activeSlot.power;
            if (activeSlot.temp) expectedTemp = Number(activeSlot.temp);
          } else {
             // Turn OFF if out of schedule
             expectedPower = 'OFF';
          }
          
          if (unit.status !== expectedPower || unit.setTemp !== expectedTemp) {
            hasChanges = true;
            return {
              ...unit,
              status: expectedPower,
              setTemp: expectedTemp,
              powerUsage: expectedPower === 'ON' ? 1.5 : 0
            };
          }
          
          return unit;
        });
        
        return hasChanges ? newUnits : prevUnits;
      });
      
    } catch (e) {
      // ignore
    }
  }, [currentTime]);

  const togglePower = (id) => {
    setUnits(units.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'ON' ? 'OFF' : 'ON';
        return { 
          ...u, 
          status: nextStatus, 
          powerUsage: nextStatus === 'ON' ? 0.88 : 0,
          setTemp: nextStatus === 'ON' ? (u.setTemp !== '--' ? u.setTemp : 30.9) : '--',
          roomTemp: nextStatus === 'ON' ? 30.9 : null
        };
      }
      return u;
    }));
  };

  const openControlModal = (id) => {
    const unit = units.find(u => u.id === id);
    setControlTargetId(id);
    setControlMode(unit?.operationMode || 'Manual');
    setAutoOptions(unit?.activeAutoOptions || []);
    setControlSuccessMessage('');
    setShowControlModal(true);
  };

  const handleAutoToggle = (option) => {
    setAutoOptions(prev => {
      const newOptions = prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option];
      setUnits(units.map(u => u.id === controlTargetId ? { ...u, activeAutoOptions: newOptions } : u));
      return newOptions;
    });
  };

  const handleControlAction = (action) => {
    if (action === 'SCHEDULE') {
      setShowControlModal(false);
      setScheduleTargetId(controlTargetId.toString());
      setShowScheduleModal(true);
      return;
    }

    setControlSuccessMessage(`SUCCESSFULL ${action}`);
    
    if (action === 'START') {
      setUnits(units.map(u => u.id === controlTargetId ? { ...u, status: 'ON', powerUsage: 0.88, setTemp: (u.setTemp !== '--' ? u.setTemp : 30.9), roomTemp: 30.9 } : u));
    } else if (action === 'STOP') {
      setUnits(units.map(u => u.id === controlTargetId ? { ...u, status: 'OFF', powerUsage: 0, setTemp: '--', roomTemp: null } : u));
    }

    setTimeout(() => {
      setControlSuccessMessage('');
      setShowControlModal(false);
    }, 2000);
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'Cool': return <Thermometer size={14} className="text-info" />;
      case 'Dry': return <Droplets size={14} className="text-warning" />;
      case 'Fan': return <Fan size={14} className="text-secondary" />;
      case 'Heat': return <Thermometer size={14} className="text-danger" />;
      default: return <Wind size={14} />;
    }
  };

  const handleViewDetails = (unit) => {
    navigate(`/ac/${unit.id}`);
  };

  const getActiveScheduleForUnit = (unit) => {
    if (!unit.activeAutoOptions?.includes('SCHEDULE')) return null;
    
    const savedSchedulesStr = localStorage.getItem('bms_ac_schedules');
    if (!savedSchedulesStr) return null;
    
    try {
      const savedSchedules = JSON.parse(savedSchedulesStr);
      const acIdStr = unit.id.toString();
      
      const dailySchedules = savedSchedules.daily || {};
      const targetDaily = dailySchedules[acIdStr] || dailySchedules['ALL'] || {};
      
      const specialSchedules = savedSchedules.special || {};
      const targetSpecial = specialSchedules[acIdStr] || specialSchedules['ALL'] || [];
      
      const hasDailySlots = Object.values(targetDaily).some(daySlots => daySlots && daySlots.length > 0);
      const hasSpecialDates = targetSpecial.length > 0;
      
      return (hasDailySlots || hasSpecialDates) ? true : null;
    } catch (e) {
      return null;
    }
  };

  const getScheduleStats = (unit) => {
    const savedSchedulesStr = localStorage.getItem('bms_ac_schedules');
    if (!savedSchedulesStr) return { done: 0, upcoming: 0, total: 0 };
    try {
      const savedSchedules = JSON.parse(savedSchedulesStr);
      const acIdStr = unit.id.toString();
      const dailySchedules = savedSchedules.daily || {};
      
      const now = new Date();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = days[now.getDay()];
      
      let todaySlots = [];
      if (dailySchedules[acIdStr] && dailySchedules[acIdStr][currentDay] && dailySchedules[acIdStr][currentDay].length > 0) {
        todaySlots = dailySchedules[acIdStr][currentDay];
      } else if (dailySchedules['ALL'] && dailySchedules['ALL'][currentDay]) {
        todaySlots = dailySchedules['ALL'][currentDay];
      }
      
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      
      let done = 0;
      let upcoming = 0;
      todaySlots.forEach(slot => {
        if (slot.end <= currentTimeStr) done++;
        else if (slot.start > currentTimeStr) upcoming++;
      });
      
      return { done, upcoming, total: todaySlots.length };
    } catch (e) {
      return { done: 0, upcoming: 0, total: 0 };
    }
  };

  const openSettings = (unit) => {
    setSelectedUnit(unit);
    setFormData({ ...unit });
    setShowSettings(true);
  };

  const saveSettings = () => {
    const trimmedName = formData.name ? formData.name.trim() : formData.name;
    setUnits(prev => {
      const updated = prev.map(u => u.id === formData.id ? { ...u, ...formData, name: trimmedName || u.name } : u);
      try { localStorage.setItem('bms_ac_units', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    if (formData.deviceId && trimmedName) {
      apiClient.patch(`/devices/${formData.deviceId}`, { name: trimmedName }).catch(() => {});
    }
    setShowSettings(false);
  };

  const handleACGroupSelection = (id) => {
    if (selectedACsForGroup.includes(id)) {
      setSelectedACsForGroup(selectedACsForGroup.filter(acId => acId !== id));
    } else {
      setSelectedACsForGroup([...selectedACsForGroup, id]);
    }
  };

  const createOrUpdateGroup = () => {
    if (!newGroupName || selectedACsForGroup.length === 0) return;
    if (editingGroupId) {
       setAcGroups(acGroups.map(g => g.id === editingGroupId ? { ...g, name: newGroupName, acIds: selectedACsForGroup } : g));
       setEditingGroupId(null);
    } else {
       setAcGroups([...acGroups, { id: 'g' + Date.now(), name: newGroupName, acIds: selectedACsForGroup }]);
    }
    setNewGroupName('');
    setSelectedACsForGroup([]);
  };

  const startEditGroup = (group) => {
    setEditingGroupId(group.id);
    setNewGroupName(group.name);
    setSelectedACsForGroup(group.acIds);
  };

  const cancelEdit = () => {
    setEditingGroupId(null);
    setNewGroupName('');
    setSelectedACsForGroup([]);
  };

  const deleteGroup = (id) => {
    setAcGroups(acGroups.filter(g => g.id !== id));
  };

  const controlGroup = (groupId, action, value) => {
    const group = acGroups.find(g => g.id === groupId);
    if (!group) return;

    setUnits(units.map(u => {
      if (group.acIds.includes(u.id)) {
        if (action === 'POWER') return { ...u, status: value, powerUsage: value === 'ON' ? 2.0 : 0 };
        if (action === 'MODE') return { ...u, mode: value };
        if (action === 'TEMP') return { ...u, setTemp: value };
      }
      return u;
    }));
  };

  const applySchedule = () => {
    if (!scheduleTargetId) return;

    let targetACIds = [];
    if (scheduleTargetId === 'ALL') {
      targetACIds = units.map(u => u.id);
    } else if (scheduleTargetId.toString().startsWith('g')) {
      const group = acGroups.find(g => g.id === scheduleTargetId);
      if (group) targetACIds = group.acIds;
    } else {
      targetACIds = [Number(scheduleTargetId)];
    }

    setUnits(units.map(u => {
      if (targetACIds.includes(u.id)) {
        return {
          ...u,
          scheduleStart: scheduleData.scheduleStart || u.scheduleStart,
          scheduleEnd: scheduleData.scheduleEnd || u.scheduleEnd,
          mode: scheduleData.mode || u.mode,
          setTemp: scheduleData.setTemp || u.setTemp
        };
      }
      return u;
    }));
    setShowScheduleModal(false);
    setScheduleData({ scheduleStart: '', scheduleEnd: '', mode: 'Cool', setTemp: 24 });
  };

  // Display ONLY mapped AC units matching registered devices for the selected site.
  // (0 devices mapped → empty array → empty-state card is shown)
  const displayedUnits = useMemo(() => {
    if (!registeredDevices || registeredDevices.length === 0) {
      // Do NOT fall back to dummy units — return empty so the empty-state renders
      return [];
    }

    return registeredDevices.map((dev, idx) => {
      // Find matching saved unit by deviceId or id or name
      const existing = units.find(u =>
        String(u.deviceId) === String(dev.id) ||
        String(u.id) === String(dev.id) ||
        (u.name && dev.name && u.name.toLowerCase().trim() === dev.name.toLowerCase().trim())
      );
      const fallbackUnit = INITIAL_ACS[0];

      // Clean display name: prefer user-edited name; avoid generic "AC_11" or "First-Ac"
      const isUserEdited = Boolean(existing?.isUserEdited);
      let cleanName = existing?.name;
      if (!isUserEdited || !cleanName) {
        if (dev.name && dev.name !== 'First-Ac' && !dev.name.startsWith('AC_')) {
          cleanName = dev.name;
        } else {
          cleanName = idx === 0 ? 'Master AC' : (dev.name || `AC ${idx + 1}`);
        }
      }

      // Clean room name: avoid generic "ZONE 11"
      const cleanRoom = dev.buildingName || dev.assetName ||
        (existing?.room && !existing.room.startsWith('ZONE ') ? existing.room : 'SANJAY');

      return {
        ...fallbackUnit,
        id: dev.id,
        deviceId: dev.id,
        name: cleanName,
        room: cleanRoom,
        type: dev.category === 'AC' ? '' : (existing?.type || fallbackUnit.type || ''),
        status: existing?.status || 'ON',
        setTemp: existing?.setTemp !== undefined ? existing.setTemp : 30.3,
        roomTemp: existing?.roomTemp !== undefined ? existing.roomTemp : 30.3,
        powerUsage: existing?.powerUsage !== undefined ? existing.powerUsage : 0.89,
        operationMode: existing?.operationMode || 'Auto',
        activeAutoOptions: existing?.activeAutoOptions || ['SENSOR'],
      };
    });
  }, [registeredDevices, units]);

  return (
    <div className="ac-dashboard-wrapper fade-in p-4" style={{ 
      minHeight: '100vh', 
      background: 'transparent',
      fontFamily: "'Inter', sans-serif" 
    }}>
      {/* KEYFRAME ANIMATIONS FOR OCCUPIED RADAR, PULSE, AND AVATAR FLOAT */}
      <style>{`
        @keyframes occupiedPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.75), 0 0 16px rgba(16, 185, 129, 0.5), inset 0 0 8px rgba(16, 185, 129, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0), 0 0 24px rgba(16, 185, 129, 0.85), inset 0 0 12px rgba(16, 185, 129, 0.5);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), 0 0 16px rgba(16, 185, 129, 0.5), inset 0 0 8px rgba(16, 185, 129, 0.3);
          }
        }
        @keyframes occupiedRipple {
          0% {
            transform: scale(0.92);
            opacity: 0.85;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        @keyframes occupiedDotRadar {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 8px #10b981;
          }
          50% {
            opacity: 0.3;
            transform: scale(0.65);
            box-shadow: 0 0 2px #10b981;
          }
        }
        @keyframes avatarFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2.5px);
          }
        }
      `}</style>
      
      {/* HEADER SECTION */}
      <div className="d-flex justify-content-between align-items-center mb-5 pb-4 position-relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h3 className="text-white fw-bold mb-2 d-flex align-items-center" style={{ letterSpacing: '0.5px' }}>
            <Wind className="me-3 text-info" size={28} />
            AC Control Center
          </h3>
          <div className="d-flex align-items-center gap-4">
            <span className="text-secondary fw-bold" style={{ fontSize: '12px', letterSpacing: '1px' }}>{currentTime.toLocaleTimeString()}</span>
            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
               <div className="pulse-dot"></div>
               <span className="text-success fw-bold" style={{ fontSize: '11px', letterSpacing: '1px' }}>SYSTEM ACTIVE</span>
            </div>
          </div>
        </div>
        
      </div>

      {/* AC UNIT CARDS GRID (PROPORTIONED, NO OVER-STRETCHED TILES) */}
      {displayedUnits.length === 0 ? (
        /* ── Empty State: No AC units mapped to this site ── */
        <div
          className="w-100 mt-3 p-5 rounded-4 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(14,22,42,0.85) 0%, rgba(10,18,35,0.92) 100%)',
            border: '1.5px dashed rgba(56,189,248,0.28)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            minHeight: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            className="d-inline-flex p-4 rounded-circle mb-4"
            style={{
              background: 'rgba(14,165,233,0.10)',
              border: '1.5px solid rgba(14,165,233,0.25)',
              color: '#38bdf8'
            }}
          >
            <Wind size={44} strokeWidth={1.6} />
          </div>
          <h5 className="text-white fw-bold mb-2" style={{ fontSize: '1.25rem', letterSpacing: '-0.2px' }}>
            No AC Units Mapped
          </h5>
          <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '400px', fontSize: '14px', lineHeight: 1.65 }}>
            No AC devices are registered for{' '}
            <strong className="text-info">
              {selectedSite?.name || selectedSite?.siteName || 'this site'}
            </strong>.
            Register AC devices in Device Management to see them here.
          </p>
          <button
            type="button"
            className="btn fw-semibold px-5 py-2 rounded-pill text-white"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
              boxShadow: '0 4px 18px rgba(6,182,212,0.4)',
              border: 'none',
              fontSize: '14px',
              letterSpacing: '0.3px'
            }}
            onClick={() => navigate('/settings/device-management')}
          >
            Register Devices
          </button>
        </div>
      ) : (
      <div className="d-flex flex-wrap gap-4 mb-5" style={{ alignItems: 'flex-start' }}>
        {displayedUnits.map((unit) => {
          // Resolve linked device & telemetry
          const linkedDevice = registeredDevices.find(d => String(d.id) === String(unit.deviceId || unit.id)) 
                            || registeredDevices.find(d => d.name && unit.name && d.name.toLowerCase().trim() === unit.name.toLowerCase().trim())
                            || (registeredDevices.length > 0 ? registeredDevices[0] : null);

          const devEvents = linkedDevice ? (deviceTelemetryMap[linkedDevice.id] || deviceTelemetryMap[linkedDevice.deviceId]) : null;
          const allMappedFields = resolveUnitTelemetry(unit, linkedDevice, devEvents);

          // Determine which telemetry fields to display from device configuration (only fields with toggle ON)
          const isFieldActive = (f) => {
            return f.isDisplayed === true;
          };

          const visibleTelemetryFields = allMappedFields.filter(isFieldActive);

          // Determine real online/offline status from hardware event recency
          const isOnline = Boolean(
            (devEvents?.lastEventTime && (Date.now() - Number(devEvents.lastEventTime) < 15 * 60 * 1000 || Number(devEvents.lastEventTime) > 0)) ||
            (devEvents?.fields && devEvents.fields.some(f => f.currentValue !== null && f.currentValue !== undefined)) ||
            (linkedDevice?.isOnline !== undefined ? linkedDevice.isOnline : false)
          );

          // Extract specific parameters for realistic AC faceplate
          const roomTempField = allMappedFields.find(f => {
            const n = (f.displayName || '').toLowerCase();
            return n.includes('room temp') || n.includes('temperature') || n === 'temp' || f.eventField === '3,1';
          });
          const currentL1Field = allMappedFields.find(f => {
            const n = (f.displayName || '').toLowerCase();
            return n.includes('current l1') || f.eventField === '3,108F';
          });

          const liveRoomTemp = roomTempField?.displayVal !== '--' && roomTempField?.displayVal !== null && roomTempField?.displayVal !== undefined
            ? roomTempField.displayVal 
            : (unit.status === 'ON' ? (unit.roomTemp || '30.3') : (unit.roomTemp || '--'));

          const liveCurrentL1 = unit.status === 'ON'
            ? (currentL1Field?.displayVal !== '--' && currentL1Field?.displayVal !== null && currentL1Field?.displayVal !== undefined ? currentL1Field.displayVal : '4.03')
            : '0.0';

          return (
            <div key={unit.id} style={{ width: '100%', maxWidth: '540px', flex: '0 0 auto' }}>
              <Card className="border-0 h-100 overflow-hidden premium-card position-relative" style={{ 
                background: 'rgba(15, 23, 42, 0.78)', 
                borderRadius: '24px', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative'
              }}>
                {/* Elegant Top Border Indicator */}
                <div style={{ 
                  height: '4px', 
                  background: unit.status === 'ON' ? 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 40%, #06b6d4 75%, #10b981 100%)' : '#334155', 
                  boxShadow: unit.status === 'ON' ? '0 0 14px rgba(14, 165, 233, 0.65)' : 'none',
                  transition: 'all 0.3s ease' 
                }}></div>

                {/* IN-CARD OPERATION MODE OVERLAY (OPENS DIRECTLY ON TOP OF THIS CARD/TILE!) */}
                {activeModeUnitId === unit.id && (
                  <div 
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-between p-4"
                    style={{
                      zIndex: 100,
                      background: 'linear-gradient(155deg, rgba(12, 18, 34, 0.98) 0%, rgba(7, 11, 20, 0.99) 100%)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '24px',
                      border: '2px solid rgba(14, 165, 233, 0.55)',
                      boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(14, 165, 233, 0.25)',
                      animation: 'fadeInScale 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Top Header */}
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 16px rgba(6, 182, 212, 0.65)',
                            flexShrink: 0
                          }}>
                            <Power size={22} color="#ffffff" strokeWidth={2.8} />
                          </div>
                          <div>
                            <h4 className="text-white fw-bold mb-0" style={{ fontSize: '1.25rem', letterSpacing: '-0.3px' }}>
                              Operation Mode
                            </h4>
                            <div className="text-secondary" style={{ fontSize: '11px', marginTop: '1px' }}>
                              {unit.name || 'AC Unit'}
                            </div>
                          </div>
                        </div>

                        {/* Close Button ✕ */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveModeUnitId(null); }}
                          className="btn btn-sm p-1.5 rounded-circle"
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.08)', 
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#94a3b8',
                            cursor: 'pointer'
                          }}
                          title="Close"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Segmented Switch: MANUAL vs AUTO (CYBER CYAN / AZURE COLOR CODE) */}
                      <div className="d-flex align-items-center justify-content-center my-3">
                        <div style={{
                          background: '#070c18',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '30px',
                          padding: '4px',
                          display: 'flex',
                          width: '240px',
                          boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.6)'
                        }}>
                          <button
                            type="button"
                            onClick={() => setModalOperationMode('MANUAL')}
                            className="btn py-2 px-3 rounded-pill fw-bold transition-all flex-grow-1"
                            style={{
                              background: modalOperationMode === 'MANUAL' ? 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)' : 'transparent',
                              color: modalOperationMode === 'MANUAL' ? '#ffffff' : '#64748b',
                              boxShadow: modalOperationMode === 'MANUAL' ? '0 4px 15px rgba(6, 182, 212, 0.6)' : 'none',
                              fontSize: '12px',
                              letterSpacing: '1px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            MANUAL
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalOperationMode('AUTO')}
                            className="btn py-2 px-3 rounded-pill fw-bold transition-all flex-grow-1"
                            style={{
                              background: modalOperationMode === 'AUTO' ? 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)' : 'transparent',
                              color: modalOperationMode === 'AUTO' ? '#ffffff' : '#64748b',
                              boxShadow: modalOperationMode === 'AUTO' ? '0 4px 15px rgba(6, 182, 212, 0.6)' : 'none',
                              fontSize: '12px',
                              letterSpacing: '1px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            AUTO
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Center Body: Conditional Content */}
                    <div className="my-auto py-2">
                      {modalOperationMode === 'MANUAL' ? (
                        /* MANUAL VIEW: START & STOP (WITH CLEAR 32PX GAP) */
                        <div className="d-flex align-items-center justify-content-center pb-2" style={{ gap: '32px' }}>
                          {/* START BUTTON */}
                          <div 
                            onClick={() => {
                              setUnits(prev => prev.map(u => u.id === unit.id ? {
                                ...u,
                                status: 'ON',
                                operationMode: 'Manual',
                                activeAutoOptions: [],
                                powerUsage: 0.89,
                                setTemp: (u.setTemp !== '--' && u.setTemp) ? u.setTemp : 30.1,
                                roomTemp: 30.1
                              } : u));
                              setActiveModeUnitId(null);
                            }}
                            className="d-flex flex-column align-items-center justify-content-center transition-all"
                            style={{
                              width: '120px',
                              height: '110px',
                              borderRadius: '24px',
                              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                              cursor: 'pointer',
                              border: '1.5px solid rgba(255, 255, 255, 0.2)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                              e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.6)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.45)';
                            }}
                          >
                            <Play size={28} color="#ffffff" strokeWidth={2.4} fill="rgba(255,255,255,0.2)" />
                            <span className="fw-bold text-white mt-2" style={{ fontSize: '13px', letterSpacing: '1.2px' }}>
                              START
                            </span>
                          </div>

                          {/* STOP BUTTON */}
                          <div 
                            onClick={() => {
                              setUnits(prev => prev.map(u => u.id === unit.id ? {
                                ...u,
                                status: 'OFF',
                                powerUsage: 0,
                                setTemp: '--',
                                roomTemp: null
                              } : u));
                              setActiveModeUnitId(null);
                            }}
                            className="d-flex flex-column align-items-center justify-content-center transition-all"
                            style={{
                              width: '120px',
                              height: '110px',
                              borderRadius: '24px',
                              background: 'linear-gradient(135deg, rgba(35, 18, 25, 0.85) 0%, rgba(20, 12, 18, 0.95) 100%)',
                              border: '1.5px solid rgba(239, 68, 68, 0.45)',
                              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                              e.currentTarget.style.boxShadow = '0 12px 30px rgba(239, 68, 68, 0.4)';
                              e.currentTarget.style.borderColor = '#ef4444';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.5)';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
                            }}
                          >
                            <Square size={22} color="#ef4444" fill="#ef4444" />
                            <span className="fw-bold text-white mt-2" style={{ fontSize: '13px', letterSpacing: '1.2px' }}>
                              STOP
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* AUTO VIEW: 4 VERTICAL CAPSULES */
                        <div className="d-flex align-items-center justify-content-center gap-2 pb-2">
                          {/* SCHEDULE */}
                          {(() => {
                            const isSelected = (unit.activeAutoOptions || []).includes('SCHEDULE');
                            return (
                              <div
                                onClick={() => {
                                  handleConfirmPowerOn(unit.id, 'Auto', 'SCHEDULE');
                                  setScheduleTargetId(unit.id?.toString());
                                }}
                                className="position-relative d-flex flex-column align-items-center justify-content-center transition-all"
                                style={{
                                  width: '74px',
                                  height: '118px',
                                  borderRadius: '28px',
                                  background: isSelected 
                                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(8, 47, 73, 0.45) 100%)' 
                                    : 'rgba(15, 23, 42, 0.65)',
                                  border: isSelected ? '2px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                                  boxShadow: isSelected ? '0 0 18px rgba(6, 182, 212, 0.45), inset 0 0 10px rgba(6, 182, 212, 0.2)' : 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {isSelected && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
                                  }}>
                                    <Check size={11} color="#ffffff" strokeWidth={3.5} />
                                  </div>
                                )}
                                <div className="d-flex align-items-center justify-content-center mb-2" style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: 'rgba(6, 182, 212, 0.15)',
                                  border: '1.5px solid #06b6d4',
                                  color: '#06b6d4'
                                }}>
                                  <Clock size={18} />
                                </div>
                                <span className="fw-bold text-center" style={{ fontSize: '9px', letterSpacing: '0.8px', color: isSelected ? '#38bdf8' : '#e2e8f0' }}>
                                  SCHEDULE
                                </span>
                              </div>
                            );
                          })()}

                          {/* SENSOR */}
                          {(() => {
                            const isSelected = (unit.activeAutoOptions || []).includes('SENSOR');
                            return (
                              <div
                                onClick={() => handleConfirmPowerOn(unit.id, 'Auto', 'SENSOR')}
                                className="position-relative d-flex flex-column align-items-center justify-content-center transition-all"
                                style={{
                                  width: '74px',
                                  height: '118px',
                                  borderRadius: '28px',
                                  background: isSelected 
                                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(120, 53, 15, 0.45) 100%)' 
                                    : 'rgba(15, 23, 42, 0.65)',
                                  border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                                  boxShadow: isSelected ? '0 0 18px rgba(245, 158, 11, 0.45), inset 0 0 10px rgba(245, 158, 11, 0.2)' : 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {isSelected && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
                                  }}>
                                    <Check size={11} color="#ffffff" strokeWidth={3.5} />
                                  </div>
                                )}
                                <div className="d-flex align-items-center justify-content-center mb-2" style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#f59e0b'
                                }}>
                                  <Activity size={22} strokeWidth={2.4} />
                                </div>
                                <span className="fw-bold text-center" style={{ fontSize: '9px', letterSpacing: '0.8px', color: isSelected ? '#fbbf24' : '#e2e8f0' }}>
                                  SENSOR
                                </span>
                              </div>
                            );
                          })()}

                          {/* TEMP */}
                          {(() => {
                            const isSelected = (unit.activeAutoOptions || []).includes('TEMP') || (unit.activeAutoOptions || []).includes('AUTO');
                            return (
                              <div
                                onClick={() => handleConfirmPowerOn(unit.id, 'Auto', 'TEMP')}
                                className="position-relative d-flex flex-column align-items-center justify-content-center transition-all"
                                style={{
                                  width: '74px',
                                  height: '118px',
                                  borderRadius: '28px',
                                  background: isSelected 
                                    ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(136, 19, 55, 0.45) 100%)' 
                                    : 'rgba(15, 23, 42, 0.65)',
                                  border: isSelected ? '2px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.1)',
                                  boxShadow: isSelected ? '0 0 18px rgba(244, 63, 94, 0.45), inset 0 0 10px rgba(244, 63, 94, 0.2)' : 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {isSelected && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
                                  }}>
                                    <Check size={11} color="#ffffff" strokeWidth={3.5} />
                                  </div>
                                )}
                                <div className="d-flex align-items-center justify-content-center mb-2" style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: 'rgba(244, 63, 94, 0.15)',
                                  color: '#f43f5e'
                                }}>
                                  <Thermometer size={20} />
                                </div>
                                <span className="fw-bold text-center" style={{ fontSize: '9px', letterSpacing: '0.8px', color: isSelected ? '#fb7185' : '#e2e8f0' }}>
                                  TEMP
                                </span>
                              </div>
                            );
                          })()}

                          {/* LOCAL */}
                          {(() => {
                            const isSelected = (unit.activeAutoOptions || []).includes('LOCAL');
                            return (
                              <div
                                onClick={() => handleConfirmPowerOn(unit.id, 'Auto', 'LOCAL')}
                                className="position-relative d-flex flex-column align-items-center justify-content-center transition-all"
                                style={{
                                  width: '74px',
                                  height: '118px',
                                  borderRadius: '28px',
                                  background: isSelected 
                                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(88, 28, 135, 0.45) 100%)' 
                                    : 'rgba(15, 23, 42, 0.65)',
                                  border: isSelected ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                                  boxShadow: isSelected ? '0 0 18px rgba(168, 85, 247, 0.45), inset 0 0 10px rgba(168, 85, 247, 0.2)' : 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {isSelected && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
                                  }}>
                                    <Check size={11} color="#ffffff" strokeWidth={3.5} />
                                  </div>
                                )}
                                <div className="d-flex align-items-center justify-content-center mb-2" style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: 'rgba(168, 85, 247, 0.15)',
                                  color: '#a855f7'
                                }}>
                                  <Settings size={20} />
                                </div>
                                <span className="fw-bold text-center" style={{ fontSize: '9px', letterSpacing: '0.8px', color: isSelected ? '#c084fc' : '#e2e8f0' }}>
                                  LOCAL
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Bottom Note */}
                    <div className="text-center text-secondary py-1" style={{ fontSize: '11px' }}>
                      Click any mode to apply instantly · <span style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={(e) => { e.stopPropagation(); setActiveModeUnitId(null); }}>Dismiss</span>
                    </div>
                  </div>
                )}

                <Card.Body className="p-4 d-flex flex-column position-relative">
                  {/* HEADER AREA: SMART CLIMATE CONTROLLER, NAME, SUBTITLE & OCCUPANT AVATAR (SETTINGS GEAR REMOVED) */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{ maxWidth: 'calc(100% - 65px)' }}>
                      <div className="fw-bold text-uppercase d-flex align-items-center gap-1" style={{ 
                        color: '#38bdf8', 
                        fontSize: '9.5px', 
                        fontWeight: '800',
                        letterSpacing: '1.8px', 
                        marginBottom: '4px' 
                      }}>
                        
                       
                      </div>

                      {editingUnitId === unit.id ? (
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <Form.Control
                            type="text"
                            size="sm"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveName(unit.id);
                              if (e.key === 'Escape') handleCancelEditName();
                            }}
                            autoFocus
                            style={{
                              background: 'rgba(15, 23, 42, 0.95)',
                              border: '1px solid #0ea5e9',
                              color: '#ffffff',
                              fontWeight: '700',
                              fontSize: '1.35rem',
                              borderRadius: '8px',
                              boxShadow: '0 0 10px rgba(14, 165, 233, 0.4)',
                              padding: '2px 8px'
                            }}
                          />
                          <button 
                            onClick={() => handleSaveName(unit.id)}
                            className="btn btn-sm p-1 rounded-circle text-success"
                            style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                            title="Save (Enter)"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={handleCancelEditName}
                            className="btn btn-sm p-1 rounded-circle text-secondary"
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                            title="Cancel (Esc)"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2 mb-1 group-hover-edit">
                          <h3 
                            className="text-white fw-bold mb-0 text-truncate" 
                            style={{ cursor: 'pointer', fontSize: '1.45rem', letterSpacing: '-0.5px' }}
                            onClick={(e) => handleStartEditName(unit, e)}
                            title="Click to edit AC name"
                          >
                            {unit.name}
                          </h3>
                          <button 
                            onClick={(e) => handleStartEditName(unit, e)}
                            className="btn btn-sm p-1 rounded-circle text-secondary edit-pencil-btn" 
                            style={{ 
                              background: 'rgba(255,255,255,0.04)', 
                              border: 'none', 
                              color: '#94a3b8', 
                              transition: 'all 0.2s ease'
                            }}
                            title="Edit AC Name"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}

                      <div className="text-secondary fw-medium" style={{ fontSize: '12px' }}>{unit.type}</div>
                    </div>

                    {/* TOP RIGHT: OCCUPANCY AVATAR ONLY (CORNER GEAR REMOVED) */}
                    <div className="d-flex flex-column align-items-center">
                      <OfficerAvatar size={48} isOccupied={unit.status === 'ON'} />
                      <span className="fw-bold mt-1 d-flex align-items-center gap-1.5" style={{ 
                        fontSize: '9.5px', 
                        letterSpacing: '1px', 
                        color: unit.status === 'ON' ? '#10b981' : '#64748b',
                        textShadow: unit.status === 'ON' ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
                      }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          background: unit.status === 'ON' ? '#10b981' : '#64748b',
                          boxShadow: unit.status === 'ON' ? '0 0 8px #10b981' : 'none',
                          animation: unit.status === 'ON' ? 'occupiedDotRadar 1.5s infinite ease-in-out' : 'none'
                        }} />
                        {unit.status === 'ON' ? 'OCCUPIED' : 'VACANT'}
                      </span>
                    </div>
                  </div>

                  {/* STATUS BADGES ROW */}
                  <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                    {/* Connection Status Badge (Dynamic ONLINE / OFFLINE) */}
                    <span className="px-3 py-1.5 rounded-pill fw-bold d-flex align-items-center gap-1.5" style={{
                      background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: isOnline ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1.5px solid rgba(239, 68, 68, 0.4)',
                      color: isOnline ? '#34d399' : '#f87171',
                      fontSize: '10.5px',
                      letterSpacing: '0.8px',
                      boxShadow: isOnline ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'
                    }}>
                      <Wifi size={13} color={isOnline ? '#34d399' : '#f87171'} />
                      <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </span>

                    {/* Power Status Badge */}
                    <span className="px-3 py-1.5 rounded-pill fw-bold d-flex align-items-center gap-1.5" style={{
                      background: unit.status === 'ON' ? 'rgba(14, 165, 233, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                      border: unit.status === 'ON' ? '1.5px solid rgba(14, 165, 233, 0.5)' : '1.5px solid rgba(100, 116, 139, 0.3)',
                      color: unit.status === 'ON' ? '#38bdf8' : '#94a3b8',
                      fontSize: '10.5px',
                      letterSpacing: '0.8px'
                    }}>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: unit.status === 'ON' ? '#0ea5e9' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Power size={9} color="#ffffff" strokeWidth={3} />
                      </div>
                      <span>POWER: {unit.status}</span>
                    </span>

                    {/* Mode Status Badge */}
                    <span 
                      onClick={() => openOperationModeModal(unit)}
                      className="px-3 py-1.5 rounded-pill fw-bold d-flex align-items-center gap-1.5 transition-all" 
                      style={{
                        background: unit.operationMode === 'Manual' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        border: unit.operationMode === 'Manual' ? '1.5px solid rgba(56, 189, 248, 0.5)' : '1.5px solid rgba(245, 158, 11, 0.5)',
                        color: unit.operationMode === 'Manual' ? '#38bdf8' : '#fbbf24',
                        fontSize: '10.5px',
                        letterSpacing: '0.8px',
                        cursor: 'pointer'
                      }}
                      title="Click to change operating mode"
                    >
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: unit.operationMode === 'Manual' ? '1.2px solid #38bdf8' : '1.2px solid #fbbf24',
                        fontSize: '8.5px',
                        fontWeight: '900',
                        color: unit.operationMode === 'Manual' ? '#38bdf8' : '#fbbf24'
                      }}>
                        {unit.operationMode === 'Manual' ? 'M' : 'A'}
                      </span>
                      <span>
                        {unit.operationMode === 'Manual' 
                          ? 'MANUAL' 
                          : `AUTO: ${(unit.activeAutoOptions || ['SENSOR']).join(', ')}`}
                      </span>
                    </span>
                  </div>

                  {/* REALISTIC AC GRAPHIC */}
                  <div className="mb-4 position-relative" style={{ overflow: 'visible' }}>
                    <RealisticAC unit={unit} liveCurrentL1={liveCurrentL1} liveTemp={liveRoomTemp} />
                  </div>

                  {/* 1. MASTER POWER TOGGLE BUTTON (CLICKS OPEN OPERATION MODE OVERLAY ON TILE) */}
                  <div className="mb-3">
                    <div
                      onClick={() => openOperationModeModal(unit)}
                      className="w-100 py-2.5 rounded-pill fw-bold d-flex align-items-center justify-content-between px-3.5 shadow-lg transition-all"
                      style={{
                        background: unit.status === 'ON' 
                          ? 'linear-gradient(90deg, rgba(6, 78, 59, 0.5) 0%, rgba(4, 120, 87, 0.35) 100%)' 
                          : 'linear-gradient(90deg, rgba(30, 16, 26, 0.85) 0%, rgba(20, 12, 20, 0.9) 100%)',
                        border: unit.status === 'ON' 
                          ? '1.5px solid rgba(16, 185, 129, 0.65)' 
                          : '1.5px solid rgba(239, 68, 68, 0.35)',
                        boxShadow: unit.status === 'ON' 
                          ? '0 0 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                          : '0 4px 14px rgba(0, 0, 0, 0.5)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: unit.status === 'ON' 
                            ? 'linear-gradient(135deg, #059669, #10b981)' 
                            : 'linear-gradient(135deg, #b91c1c, #ef4444)',
                          border: unit.status === 'ON' ? '1.5px solid #34d399' : '1.5px solid #f87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: unit.status === 'ON' ? '0 0 14px rgba(16, 185, 129, 0.8)' : '0 0 12px rgba(239, 68, 68, 0.6)'
                        }}>
                          <Power size={17} strokeWidth={2.8} color="#ffffff" />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: '800', 
                            letterSpacing: '1.2px', 
                            color: '#ffffff' 
                          }}>
                            {unit.status === 'ON' ? 'AC RUNNING' : 'AC STANDBY'}
                          </span>
                          {unit.status === 'ON' && (
                            <span className="pulse-dot" style={{ width: '7px', height: '7px', background: '#10b981', borderRadius: '50%' }}></span>
                          )}
                        </div>
                      </div>

                      {/* Premium Toggle Switch Pill */}
                      <div style={{
                        width: '58px',
                        height: '28px',
                        borderRadius: '14px',
                        background: unit.status === 'ON' 
                          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                          : '#141a28',
                        border: unit.status === 'ON' 
                          ? '1px solid #34d399' 
                          : '1.5px solid rgba(239, 68, 68, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: unit.status === 'ON' ? '0 5px 0 10px' : '0 10px 0 5px',
                        boxShadow: unit.status === 'ON' 
                          ? '0 0 14px rgba(16, 185, 129, 0.7)' 
                          : 'inset 0 2px 6px rgba(0,0,0,0.6)',
                        transition: 'all 0.3s ease'
                      }}>
                        {unit.status === 'ON' ? (
                          <>
                            <span style={{ color: '#ffffff', fontWeight: '800', fontSize: '11px', letterSpacing: '0.5px' }}>ON</span>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
                            }} />
                          </>
                        ) : (
                          <>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: '#ef4444',
                              boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                            }} />
                            <span style={{ color: '#f87171', fontWeight: '800', fontSize: '11px', letterSpacing: '0.5px' }}>OFF</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. ACTIVE TELEMETRY CARDS (DIRECTLY SHOWN ON TILE WHEN TOGGLED ON IN DEVICE SETTINGS) */}
                  {visibleTelemetryFields.length > 0 && (
                    <div className="d-flex flex-column gap-2 mb-3">
                      <Row className="g-2">
                        {visibleTelemetryFields.map((f, fIdx) => {
                          const colSize = visibleTelemetryFields.length === 1 ? 12 : (visibleTelemetryFields.length === 2 || visibleTelemetryFields.length === 4) ? 6 : 4;
                          const theme = getFieldTheme(f.displayName, fIdx);

                          return (
                            <Col xs={colSize} key={f.id || f.displayName || fIdx}>
                              <div className="p-2.5 rounded-3 d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden text-center transition-all" style={{
                                background: theme.bg,
                                border: `1.5px solid ${theme.border}`,
                                boxShadow: `0 4px 16px rgba(0,0,0,0.35), inset 0 0 12px ${theme.glow}`,
                                minHeight: '68px'
                              }}>
                                <div className="d-flex align-items-center justify-content-center gap-1.5 mb-1 w-100">
                                  <span className="text-secondary fw-bold text-uppercase text-truncate" style={{ fontSize: '9.5px', letterSpacing: '0.8px', maxWidth: '100px' }} title={f.displayName}>
                                    {f.displayName}
                                  </span>
                                  {f.moduleId && f.moduleId !== '--' && (
                                    <span className="px-1.5 py-0.2 rounded text-info" style={{ 
                                      fontSize: '7.5px', 
                                      fontWeight: '700',
                                      background: 'rgba(14, 165, 233, 0.12)', 
                                      border: '1px solid rgba(14, 165, 233, 0.25)' 
                                    }}>
                                      {f.moduleId}
                                    </span>
                                  )}
                                </div>
                                <div className="d-flex align-items-baseline justify-content-center gap-1 w-100">
                                  <span className="text-white fw-bold text-truncate" style={{ fontSize: '1.3rem', letterSpacing: '-0.3px', lineHeight: 1.1, maxWidth: '95px' }} title={f.displayVal}>
                                    {f.displayVal}
                                  </span>
                                  {f.unit && (
                                    <span className="fw-bold" style={{ fontSize: '11px', color: theme.unitColor }}>
                                      {f.unit}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}

                  {/* Schedule Indicator */}
                  {getActiveScheduleForUnit(unit) ? (
                    <div className="d-flex flex-column gap-2 mt-auto">
                      <div className="d-flex align-items-center justify-content-center gap-2 px-3.5 py-2.5 rounded-pill text-center" style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                        <Calendar size={13} className="text-info" />
                        <span className="text-info fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                          Active Schedule: {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="bg-info rounded-circle ms-1" style={{ width: '6px', height: '6px', boxShadow: '0 0 8px #0ea5e9' }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center px-3.5 py-2.5 rounded-pill mt-auto gap-2 text-center" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.12)' }}>
                      <Calendar size={13} className="text-secondary" />
                      <span className="text-secondary fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>No Active Schedule</span>
                    </div>
                  )}

                  {/* DEDICATED EXPAND VIEW BUTTON (ALWAYS ACCESSIBLE AT BOTTOM OF TILE) */}
                  <div className="d-flex justify-content-center pt-2 mt-2">
                    <button
                      type="button"
                      onClick={() => openInspectTelemetry(unit, linkedDevice, allMappedFields, visibleTelemetryFields, isOnline, liveRoomTemp, liveCurrentL1)}
                      className="w-100 py-2 px-3 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 transition-all"
                      style={{
                        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(6, 182, 212, 0.18) 100%)',
                        border: '1.5px solid rgba(14, 165, 233, 0.45)',
                        color: '#38bdf8',
                        fontSize: '11px',
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(14, 165, 233, 0.15)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(14, 165, 233, 0.28) 0%, rgba(6, 182, 212, 0.38) 100%)';
                        e.currentTarget.style.borderColor = '#0ea5e9';
                        e.currentTarget.style.boxShadow = '0 0 16px rgba(14, 165, 233, 0.4)';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(6, 182, 212, 0.18) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.45)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(14, 165, 233, 0.15)';
                        e.currentTarget.style.color = '#38bdf8';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      title="Open Full Expanded View"
                    >
                      <Maximize2 size={13} strokeWidth={2.4} />
                      <span>EXPAND VIEW</span>
                      {visibleTelemetryFields.length > 0 && (
                        <span className="badge rounded-pill" style={{ background: 'rgba(14, 165, 233, 0.3)', color: '#ffffff', fontSize: '9.5px', padding: '2px 7px' }}>
                          {visibleTelemetryFields.length}
                        </span>
                      )}
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          );
        })}
      </div>
      )}


      {/* AC INDIVIDUAL SETTINGS MODAL */}
      <Modal show={showSettings} onHide={() => setShowSettings(false)} centered className="premium-modal">
        {selectedUnit && (
          <>
            <Modal.Header closeButton closeVariant="white" className="border-bottom-0 pb-0" style={{ background: '#0f172a' }}>
              <Modal.Title className="text-white fs-5 fw-bold d-flex align-items-center gap-3">
                <div className="bg-info rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '36px', height: '36px' }}>
                  <Settings size={20} color="white" />
                </div>
                Configure Unit
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-4" style={{ background: '#0f172a', color: '#fff' }}>
              
              <div className="mb-4">
                <h6 className="text-info fw-bold mb-3 fs-12 tracking-widest text-uppercase">Identification</h6>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="text-secondary fs-12 d-flex align-items-center gap-1">
                        <Edit2 size={12} /> AC Unit Name
                      </Form.Label>
                      <Form.Control 
                        type="text" 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="premium-input" 
                        placeholder="e.g. Master AC, Lobby AC"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-secondary fs-12">Room / Location</Form.Label>
                      <Form.Control type="text" value={formData.room || ''} onChange={e => setFormData({...formData, room: e.target.value})} className="premium-input" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-secondary fs-12">AC Type</Form.Label>
                      <Form.Control type="text" value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} className="premium-input" />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="text-secondary fs-12 d-flex align-items-center gap-1">
                        <Cpu size={12} /> Linked Hardware Device / Template
                      </Form.Label>
                      <Form.Select 
                        value={formData.deviceId || ''} 
                        onChange={e => setFormData({ ...formData, deviceId: e.target.value })} 
                        className="premium-input"
                      >
                        <option value="">-- Auto-Map from System --</option>
                        {registeredDevices.map(dev => (
                          <option key={dev.id} value={dev.id}>
                            {dev.name || `Device #${dev.id}`} ({dev.category || 'AC'} - {getDeviceTemplateSettings(dev).length || 14} Fields)
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              <div className="mb-4">
                <h6 className="text-info fw-bold mb-3 fs-12 tracking-widest text-uppercase">Automation Schedule</h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-secondary fs-12 d-flex align-items-center gap-1"><Clock size={12}/> Auto ON Time</Form.Label>
                      <Form.Control type="time" value={formData.scheduleStart || ''} onChange={e => setFormData({...formData, scheduleStart: e.target.value})} className="premium-input" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-secondary fs-12 d-flex align-items-center gap-1"><Clock size={12}/> Auto OFF Time</Form.Label>
                      <Form.Control type="time" value={formData.scheduleEnd || ''} onChange={e => setFormData({...formData, scheduleEnd: e.target.value})} className="premium-input" />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              <div>
                <h6 className="text-info fw-bold mb-3 fs-12 tracking-widest text-uppercase">Operation Default</h6>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="text-secondary fs-12">Mode</Form.Label>
                      <Form.Select value={formData.mode || '--'} onChange={e => setFormData({...formData, mode: e.target.value})} className="premium-input">
                        <option value="--" disabled>-- Select --</option>
                        <option value="Cool">Cool</option>
                        <option value="Fan">Fan</option>
                        <option value="Dry">Dry</option>
                        <option value="Heat">Heat</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="text-secondary fs-12">Fan Speed</Form.Label>
                      <Form.Select value={formData.fanSpeed || '--'} onChange={e => setFormData({...formData, fanSpeed: e.target.value})} className="premium-input">
                        <option value="--" disabled>-- Select --</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Auto">Auto</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="text-secondary fs-12">Room Temp</Form.Label>
                      <Form.Control type="number" min="16" max="30" value={formData.setTemp === '--' ? '' : formData.setTemp} onChange={e => setFormData({...formData, setTemp: e.target.value ? Number(e.target.value) : '--'})} className="premium-input" placeholder="--" />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0 px-4 pb-4" style={{ background: '#0f172a' }}>
              <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button variant="info" className="rounded-pill px-5 fw-bold shadow" onClick={saveSettings}>Apply Changes</Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* EXPANDED VIEW MODAL */}
      <Modal show={showAllTelemetryModal} onHide={() => setShowAllTelemetryModal(false)} centered size="xl" className="premium-modal">
        {inspectingUnit && (
          <>
            <Modal.Header closeButton closeVariant="white" className="border-bottom-0 pb-2 px-4 pt-4" style={{ background: '#070c18' }}>
              <Modal.Title className="text-white fs-5 fw-bold d-flex align-items-center gap-3">
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 18px rgba(6, 182, 212, 0.55)'
                }}>
                  <Maximize2 size={22} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4 fw-bold text-white">{inspectingUnit.name}</span>
                    <span className="text-info fw-bold" style={{ fontSize: '11px', letterSpacing: '1.2px', background: 'rgba(14, 165, 233, 0.15)', padding: '2px 9px', borderRadius: '20px', border: '1px solid rgba(14, 165, 233, 0.35)' }}>
                      EXPANDED VIEW
                    </span>
                  </div>
                  <div className="text-secondary fs-12 fw-normal mt-0.5 d-flex align-items-center gap-2">
                    <span className="d-flex align-items-center gap-1"><MapPin size={12} className="text-info" /> {inspectingUnit.room}</span>
                    <span>•</span>
                    <span>{inspectingUnit.type || 'Smart Inverter AC'}</span>
                    <span>•</span>
                    <span className="text-info opacity-75">{inspectingUnit.linkedDevice?.name || 'Hardware Controller'} (ID: {inspectingUnit.linkedDevice?.id || inspectingUnit.deviceId || '11'})</span>
                  </div>
                </div>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body className="px-4 py-3" style={{ background: '#070c18', color: '#fff' }}>
              
              {/* 1. TOP HERO: BIG AUTHENTIC REALISTIC AC SHOWCASE */}
              <div className="p-4 rounded-4 mb-4 position-relative" style={{
                background: 'radial-gradient(ellipse at 50% 30%, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.9) 70%, rgba(7, 12, 24, 0.98) 100%)',
                border: '1.5px solid rgba(14, 165, 233, 0.3)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.55), inset 0 0 35px rgba(14, 165, 233, 0.08)'
              }}>
                {/* Header status pills above AC */}
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2.5 flex-wrap gap-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {/* Connection */}
                    <span className="px-3 py-1.5 rounded-pill fw-bold d-flex align-items-center gap-1.5" style={{
                      background: inspectingUnit.isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: inspectingUnit.isOnline ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1.5px solid rgba(239, 68, 68, 0.4)',
                      color: inspectingUnit.isOnline ? '#34d399' : '#f87171',
                      fontSize: '11px',
                      letterSpacing: '0.8px'
                    }}>
                      <Wifi size={13} />
                      <span>{inspectingUnit.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </span>

                    {/* Power */}
                    <span className="px-3 py-1.5 rounded-pill fw-bold d-flex align-items-center gap-1.5" style={{
                      background: inspectingUnit.status === 'ON' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: inspectingUnit.status === 'ON' ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1.5px solid rgba(239, 68, 68, 0.4)',
                      color: inspectingUnit.status === 'ON' ? '#34d399' : '#f87171',
                      fontSize: '11px',
                      letterSpacing: '0.8px'
                    }}>
                      <Power size={12} strokeWidth={2.8} />
                      <span>{inspectingUnit.status === 'ON' ? 'AC RUNNING' : 'AC STANDBY'}</span>
                      {inspectingUnit.status === 'ON' && <span className="pulse-dot ms-1" style={{ width: '7px', height: '7px' }}></span>}
                    </span>

                    {/* Mode */}
                    <span className="px-3 py-1.5 rounded-pill fw-bold" style={{
                      background: inspectingUnit.operationMode === 'Manual' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      border: inspectingUnit.operationMode === 'Manual' ? '1.5px solid rgba(56, 189, 248, 0.5)' : '1.5px solid rgba(245, 158, 11, 0.5)',
                      color: inspectingUnit.operationMode === 'Manual' ? '#38bdf8' : '#fbbf24',
                      fontSize: '11px',
                      letterSpacing: '0.8px'
                    }}>
                      MODE: {inspectingUnit.operationMode === 'Manual' ? 'MANUAL' : `AUTO (${(inspectingUnit.activeAutoOptions || ['SENSOR']).join(', ')})`}
                    </span>
                  </div>

                  {/* Occupant Avatar */}
                  <div className="d-flex align-items-center gap-2">
                    <OfficerAvatar size={34} isOccupied={inspectingUnit.status === 'ON'} />
                    <span className="fw-bold" style={{ fontSize: '11px', letterSpacing: '0.8px', color: inspectingUnit.status === 'ON' ? '#10b981' : '#64748b' }}>
                      {inspectingUnit.status === 'ON' ? 'OCCUPIED' : 'VACANT'}
                    </span>
                  </div>
                </div>

                {/* THE BIG REALISTIC AC UNIT (AUTHENTIC & GRAND) */}
                <div style={{ maxWidth: '680px', margin: '0 auto', overflow: 'visible', padding: '10px 0 16px' }}>
                  <RealisticAC 
                    unit={inspectingUnit} 
                    liveCurrentL1={inspectingUnit.liveCurrentL1} 
                    liveTemp={inspectingUnit.liveRoomTemp} 
                    isLarge={true} 
                  />
                </div>
              </div>

              {/* 2. MIDDLE SECTION: ONLY ACTIVE TOGGLED TELEMETRY PARAMETERS ("wahi dikhao jo yaha toggle wala dikha rahe") */}
              <div className="p-4 rounded-4 mb-4" style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 flex-wrap gap-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div>
                    <span className="text-info fw-bold fs-12 tracking-widest text-uppercase d-flex align-items-center gap-2">
                      <Activity size={15} /> ACTIVE TELEMETRY PARAMETERS
                    </span>
                    <div className="text-secondary fs-11 mt-0.5">
                      Displaying parameters currently enabled in Device Settings
                    </div>
                  </div>
                  <span className="badge rounded-pill fw-bold" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.3)', fontSize: '11px', padding: '5px 12px' }}>
                    {inspectingUnit.visibleFields?.length || 0} TOGGLED ON
                  </span>
                </div>

                {inspectingUnit.visibleFields && inspectingUnit.visibleFields.length > 0 ? (
                  <Row className="g-3">
                    {inspectingUnit.visibleFields.map((f, idx) => {
                      const colSize = inspectingUnit.visibleFields.length === 1 ? 12 : (inspectingUnit.visibleFields.length === 2 ? 6 : 4);
                      const theme = getFieldTheme(f.displayName, idx);
                      return (
                        <Col xs={12} sm={6} md={colSize} key={f.id || idx}>
                          <div className="py-2.5 px-3 rounded-3 d-flex flex-column align-items-center justify-content-between text-center transition-all position-relative overflow-hidden" style={{
                            background: theme.bg,
                            border: `1.5px solid ${theme.border}`,
                            boxShadow: `0 6px 18px rgba(0,0,0,0.35), inset 0 0 16px ${theme.glow}`,
                            minHeight: '108px'
                          }}>
                            {/* Card Top: Display Name + Module Badge (Centered) */}
                            <div className="d-flex align-items-center justify-content-center gap-1.5 mb-1 w-100">
                              <span className="text-secondary fw-bold text-uppercase text-truncate" style={{ fontSize: '10.5px', letterSpacing: '0.8px', maxWidth: '170px' }} title={f.displayName}>
                                {f.displayName}
                              </span>
                              {f.moduleId && f.moduleId !== '--' && (
                                <span className="px-1.5 py-0.2 rounded text-info fw-bold" style={{ 
                                  fontSize: '8.5px', 
                                  background: 'rgba(14, 165, 233, 0.15)', 
                                  border: '1px solid rgba(14, 165, 233, 0.3)' 
                                }}>
                                  {f.moduleId}
                                </span>
                              )}
                            </div>

                            {/* Card Center: Big Live Value + Unit (Centered & Equal Gap) */}
                            <div className="d-flex align-items-baseline justify-content-center gap-1.5 my-1 w-100">
                              <span className="fw-bold text-white" style={{ 
                                fontSize: '2.1rem', 
                                letterSpacing: '-0.5px', 
                                lineHeight: 1,
                                textShadow: '0 0 14px rgba(255,255,255,0.18)' 
                              }}>
                                {f.displayVal}
                              </span>
                              {f.unit && (
                                <span className="fw-bold" style={{ fontSize: '13.5px', color: theme.unitColor, letterSpacing: '0.4px' }}>
                                  {f.unit}
                                </span>
                              )}
                            </div>

                            {/* Card Footer: Event Register + Active Status (Centered & Equal Gap) */}
                            <div className="d-flex align-items-center justify-content-center gap-2 pt-1.5 mt-1 w-100" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)', fontSize: '10.5px' }}>
                              <span className="text-secondary opacity-75 font-monospace">{f.eventField}</span>
                              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)' }} />
                              <span className="text-success fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '10px', letterSpacing: '0.6px' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                                ACTIVE ON TILE
                              </span>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  <div className="text-center p-5 rounded-4 d-flex flex-column align-items-center justify-content-center" style={{ background: 'rgba(7, 12, 24, 0.5)', border: '1px dashed rgba(255, 255, 255, 0.12)' }}>
                    <Info size={36} className="text-secondary opacity-50 mb-3" />
                    <h6 className="text-white fw-bold mb-1">No Telemetry Parameters Toggled ON</h6>
                    <p className="text-secondary fs-12 mb-0" style={{ maxWidth: '340px' }}>
                      Open Device Settings to toggle ON the telemetry registers you wish to monitor on this AC tile and in expanded view.
                    </p>
                  </div>
                )}
              </div>

              {/* 3. BEAUTIFUL & CENTERED MESSAGE SHOWCASE */}
              <div className="d-flex align-items-center justify-content-center my-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: '45px', height: '1.5px', background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.6))' }} />
                  <div 
                    className="px-4 py-2 rounded-pill text-center transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(16, 185, 129, 0.1) 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      boxShadow: '0 4px 24px rgba(14, 165, 233, 0.2), inset 0 0 16px rgba(14, 165, 233, 0.08)',
                    }}
                  >
                    <span style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      letterSpacing: '0.8px',
                      background: 'linear-gradient(90deg, #ffffff 0%, #38bdf8 50%, #a7f3d0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block'
                    }}>
                      Stay Cool. Feel Refreshed.
                    </span>
                  </div>
                  <div style={{ width: '45px', height: '1.5px', background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.6), transparent)' }} />
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className="border-top-0 pt-0 px-4 pb-4" style={{ background: '#070c18' }}>
              <Button variant="info" className="rounded-pill px-5 fw-bold shadow" onClick={() => setShowAllTelemetryModal(false)}>Close View</Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* MANAGE GROUPS MODAL */}
      <Modal show={showGroupModal} onHide={() => setShowGroupModal(false)} centered size="xl" className="premium-modal">
        <Modal.Header closeButton closeVariant="white" className="border-bottom-0 pb-0" style={{ background: '#0f172a' }}>
          <Modal.Title className="text-white fs-4 fw-bold d-flex align-items-center gap-3">
            <div className="bg-info rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '42px', height: '42px' }}>
              <Wind size={24} color="white" />
            </div>
            AC Group Management
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: '#0f172a', color: '#fff' }}>
          <Row className="g-5">
            <Col lg={5}>
              <div className="bg-slate-800 p-4 rounded-4" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.3)' }}>
                <h5 className="text-white fw-bold mb-4">{editingGroupId ? 'Update Existing Group' : 'Create New Group'}</h5>
                <Form.Group className="mb-4">
                  <Form.Label className="text-secondary fs-12 fw-bold tracking-widest text-uppercase">Group Name</Form.Label>
                  <Form.Control type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Server Rooms" className="premium-input py-3" />
                </Form.Group>
                
                <Form.Label className="text-secondary fs-12 fw-bold tracking-widest text-uppercase mb-3">Assign Units to Group</Form.Label>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="mb-4 pe-2">
                  {units.map(u => {
                    const isManual = u.operationMode === 'Manual';
                    const isSelected = selectedACsForGroup.includes(u.id);
                    return (
                      <div 
                        key={u.id} 
                        className="d-flex align-items-center justify-content-between p-3 mb-2 rounded-3 position-relative" 
                        style={{ 
                          background: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'rgba(0,0,0,0.2)', 
                          border: `1px solid ${isSelected ? 'rgba(14, 165, 233, 0.3)' : 'transparent'}`, 
                          cursor: isManual ? 'not-allowed' : 'pointer',
                          opacity: isManual ? 0.5 : 1
                        }} 
                        onClick={() => !isManual && handleACGroupSelection(u.id)}
                      >
                        <div className="d-flex align-items-center">
                          <Form.Check 
                            type="checkbox" 
                            id={`group-ac-${u.id}`} 
                            checked={isSelected} 
                            disabled={isManual}
                            onChange={() => {}} 
                            className="me-3" 
                          />
                          <div>
                            <div className="text-white fw-bold fs-12">{u.name}</div>
                            <div className="text-secondary fs-11"><MapPin size={10} className="me-1"/>{u.room}</div>
                          </div>
                        </div>
                        {isManual && (
                          <Badge bg="dark" className="text-secondary border border-secondary border-opacity-25 px-2 py-1" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>MANUAL</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="d-flex gap-3">
                  {editingGroupId && <Button variant="outline-secondary" className="w-50 rounded-pill fw-bold py-2" onClick={cancelEdit}>CANCEL</Button>}
                  <Button variant="info" onClick={createOrUpdateGroup} disabled={!newGroupName || selectedACsForGroup.length === 0} className={`${editingGroupId ? 'w-50' : 'w-100'} rounded-pill fw-bold py-2 shadow`}>
                    {editingGroupId ? 'UPDATE GROUP' : 'CREATE GROUP'}
                  </Button>
                </div>
              </div>
            </Col>
            
            <Col lg={7}>
              <h5 className="text-white fw-bold mb-4">Active Groups & Control</h5>
              {acGroups.length === 0 ? (
                <div className="text-center p-5 border border-dashed rounded-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Wind size={48} className="text-secondary mb-3 opacity-50" />
                  <h6 className="text-secondary">No groups configured yet.</h6>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                  {acGroups.map(group => (
                    <Card key={group.id} className="border-0 shadow-sm" style={{ background: 'rgba(15,23,42,0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="text-white fw-bold mb-1">{group.name}</h5>
                            <Badge bg="transparent" className="px-2 py-1 rounded-pill fw-bold" style={{ background: 'rgba(14, 165, 233, 0.2) !important', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.3)' }}>{group.acIds.length} Linked Units</Badge>
                          </div>
                          <div className="d-flex gap-2">
                            <Button variant="link" className="text-info p-2" onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}>
                              {expandedGroupId === group.id ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </Button>
                            <Button variant="link" className="text-warning p-2" onClick={() => startEditGroup(group)}>
                              <Edit2 size={16}/>
                            </Button>
                            <Button variant="link" className="text-danger p-2" onClick={() => deleteGroup(group.id)}>
                              <Trash2 size={16}/>
                            </Button>
                          </div>
                        </div>

                        {expandedGroupId === group.id && (
                          <div className="bg-black bg-opacity-30 p-3 rounded-3 mb-3 border border-secondary border-opacity-25 mt-3">
                            <div className="d-flex flex-wrap gap-2">
                              {group.acIds.map(id => {
                                const ac = units.find(u => u.id === id);
                                return ac ? <Badge bg="dark" className="border border-secondary border-opacity-50 px-3 py-2 text-light fw-normal" key={id}>{ac.name}</Badge> : null;
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-black bg-opacity-20 rounded-3 p-3 mt-3 border border-secondary border-opacity-10">
                           <Row className="g-2">
                             <Col xs={6} md={3}>
                               <Button variant="outline-success" className="w-100 fw-bold rounded-pill" onClick={() => controlGroup(group.id, 'POWER', 'ON')}><Power size={14} className="me-1"/> ON</Button>
                             </Col>
                             <Col xs={6} md={3}>
                               <Button variant="outline-danger" className="w-100 fw-bold rounded-pill" onClick={() => controlGroup(group.id, 'POWER', 'OFF')}><Power size={14} className="me-1"/> OFF</Button>
                             </Col>
                             <Col xs={6} md={3}>
                               <Form.Select className="premium-select rounded-pill" onChange={(e) => controlGroup(group.id, 'MODE', e.target.value)}>
                                 <option value="">Set Mode</option>
                                 <option value="Cool">Cool</option>
                                 <option value="Fan">Fan</option>
                                 <option value="Dry">Dry</option>
                                 <option value="Heat">Heat</option>
                               </Form.Select>
                             </Col>
                             <Col xs={6} md={3}>
                               <Form.Select className="premium-select rounded-pill" onChange={(e) => controlGroup(group.id, 'TEMP', Number(e.target.value))}>
                                 <option value="">Set Temp</option>
                                 {[16,18,20,22,24,26,28,30].map(t => <option key={t} value={t}>{t}°C</option>)}
                               </Form.Select>
                             </Col>
                           </Row>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      {/* SCHEDULE SETTINGS MODAL */}
      <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} centered size="md" className="premium-modal">
        <Modal.Header closeButton closeVariant="white" className="border-bottom-0 pb-0" style={{ background: '#0f172a' }}>
          <Modal.Title className="text-white fs-5 fw-bold d-flex align-items-center gap-3">
            <div className="bg-info rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '36px', height: '36px' }}>
              <Clock size={20} color="white" />
            </div>
            Global Scheduler
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-4" style={{ background: '#0f172a', color: '#fff' }}>
          
          <div className="bg-slate-800 p-4 rounded-4 mb-4" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.3)' }}>
            <Form.Group>
              <Form.Label className="text-info fw-bold fs-12 tracking-widest text-uppercase">1. Select Target Application</Form.Label>
              <Form.Select value={scheduleTargetId} onChange={(e) => setScheduleTargetId(e.target.value)} className="premium-input py-3">
                <option value="">-- Choose Target --</option>
                <option value="ALL" className="fw-bold text-info">★ ALL AC UNITS IN FACILITY</option>
                {acGroups.length > 0 && <optgroup label="Custom Groups">
                  {acGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.acIds.length} Units)</option>)}
                </optgroup>}
                <optgroup label="Individual Units">
                  {units.map(u => <option key={u.id} value={u.id}>{u.name} - {u.room}</option>)}
                </optgroup>
              </Form.Select>
            </Form.Group>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-4" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.3)' }}>
            <h6 className="text-info fw-bold mb-4 fs-12 tracking-widest text-uppercase">2. Execution Parameters</h6>
            
            <Row className="mb-4 g-4">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-secondary fs-12 fw-bold d-flex align-items-center gap-2"><div className="w-2 h-2 rounded-circle bg-success" style={{width:'8px',height:'8px'}}></div> Power ON Time</Form.Label>
                  <Form.Control type="time" value={scheduleData.scheduleStart || ''} onChange={e => setScheduleData({...scheduleData, scheduleStart: e.target.value})} className="premium-input py-2" />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-secondary fs-12 fw-bold d-flex align-items-center gap-2"><div className="w-2 h-2 rounded-circle bg-danger" style={{width:'8px',height:'8px'}}></div> Power OFF Time</Form.Label>
                  <Form.Control type="time" value={scheduleData.scheduleEnd || ''} onChange={e => setScheduleData({...scheduleData, scheduleEnd: e.target.value})} className="premium-input py-2" />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-4">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-secondary fs-12 fw-bold">Target Mode</Form.Label>
                  <Form.Select value={scheduleData.mode || 'Cool'} onChange={e => setScheduleData({...scheduleData, mode: e.target.value})} className="premium-input py-2">
                    <option value="Cool">Cool</option>
                    <option value="Fan">Fan</option>
                    <option value="Dry">Dry</option>
                    <option value="Heat">Heat</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-secondary fs-12 fw-bold">Room Temp (°C)</Form.Label>
                  <Form.Control type="number" min="16" max="30" value={scheduleData.setTemp || 24} onChange={e => setScheduleData({...scheduleData, setTemp: Number(e.target.value)})} className="premium-input py-2" />
                </Form.Group>
              </Col>
            </Row>
          </div>

        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 px-4 pb-4" style={{ background: '#0f172a' }}>
          <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
          <Button variant="info" className="rounded-pill px-5 fw-bold shadow" onClick={applySchedule} disabled={!scheduleTargetId}>
            Dispatch Schedule
          </Button>
        </Modal.Footer>
      </Modal>

      {/* POWER CONTROL MODAL */}
      <Modal show={showControlModal} onHide={() => setShowControlModal(false)} centered size="sm" className={`premium-modal ${isDark ? '' : 'light-mode-modal'}`}>
        <Modal.Header closeButton closeVariant={isDark ? "white" : "black"} className="border-bottom-0 pb-0" style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
          <Modal.Title className={`fs-5 fw-bold d-flex align-items-center gap-3 ${isDark ? 'text-white' : 'text-dark'}`}>
            <div className="bg-info rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '36px', height: '36px' }}>
              <Power size={18} color="white" />
            </div>
            Operation Mode
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-4 text-center position-relative" style={{ background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#fff' : '#0f172a' }}>
          
          {/* Segmented Control for Auto/Manual */}
          <div className="d-flex align-items-center justify-content-between p-1 rounded-pill mb-4 mx-auto" style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', width: '220px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'}`, boxShadow: isDark ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
            <div 
              onClick={() => {
                setControlMode('Manual'); 
                setControlSuccessMessage('');
                setUnits(units.map(u => u.id === controlTargetId ? { ...u, operationMode: 'Manual' } : u));
              }}
              className={`w-50 text-center py-2 rounded-pill fw-bold transition-all ${controlMode === 'Manual' ? 'bg-info text-white shadow' : (isDark ? 'text-secondary' : 'text-dark')}`}
              style={{ fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}
            >
              MANUAL
            </div>
            <div 
              onClick={() => {
                setControlMode('Auto'); 
                setControlSuccessMessage('');
                setUnits(units.map(u => u.id === controlTargetId ? { ...u, operationMode: 'Auto' } : u));
              }}
              className={`w-50 text-center py-2 rounded-pill fw-bold transition-all ${controlMode === 'Auto' ? 'bg-info text-white shadow' : (isDark ? 'text-secondary' : 'text-dark')}`}
              style={{ fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}
            >
              AUTO
            </div>
          </div>

          {/* Floating Success Message Overlay */}
          <div 
            className="alert py-2 border-0 fw-bold shadow-lg d-flex align-items-center justify-content-center m-0" 
            style={{ 
              position: 'absolute', 
              top: '65%', 
              left: '50%', 
              transform: controlSuccessMessage ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)', 
              width: '85%', 
              zIndex: 100,
              background: 'rgba(16, 185, 129, 0.95)', 
              color: '#fff', 
              borderRadius: '12px', 
              border: '1px solid rgba(16, 185, 129, 1)',
              opacity: controlSuccessMessage ? 1 : 0,
              visibility: controlSuccessMessage ? 'visible' : 'hidden',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              backdropFilter: 'blur(4px)'
            }}>
            {controlSuccessMessage || 'SUCCESS'}
          </div>

          {/* Premium Action Buttons */}
          <div className="d-flex justify-content-center align-items-center gap-2 w-100" style={{ minHeight: '110px', transition: 'all 0.3s ease' }}>
            {controlMode === 'Manual' ? (
              <>
                <button onClick={() => handleControlAction('START')} className="action-btn-premium start-btn" style={{ width: '100px', height: '85px' }}>
                  <Play size={24} className="mb-2" />
                  <span>START</span>
                </button>
                <button onClick={() => handleControlAction('STOP')} className="action-btn-premium stop-btn" style={{ width: '100px', height: '85px' }}>
                  <Square size={22} className="mb-2" fill="currentColor" />
                  <span>STOP</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleAutoToggle('SCHEDULE')} className={`action-btn-premium schedule-btn ${autoOptions.includes('SCHEDULE') ? 'active-opt' : ''} ${!isDark ? 'light-btn' : ''}`} style={{ width: '70px', height: '105px', position: 'relative' }}>
                  {autoOptions.includes('SCHEDULE') && <CheckCircle size={18} fill="#10b981" color="#ffffff" style={{position: 'absolute', top: '4px', right: '4px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'}} />}
                  <Clock size={24} className="mb-2" />
                  <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>SCHEDULE</span>
                </button>
                <button onClick={() => handleAutoToggle('SENSOR')} className={`action-btn-premium sensor-btn ${autoOptions.includes('SENSOR') ? 'active-opt' : ''} ${!isDark ? 'light-btn' : ''}`} style={{ width: '70px', height: '105px', position: 'relative' }}>
                  {autoOptions.includes('SENSOR') && <CheckCircle size={18} fill="#10b981" color="#ffffff" style={{position: 'absolute', top: '4px', right: '4px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'}} />}
                  <Activity size={24} className="mb-2" />
                  <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>SENSOR</span>
                </button>
                <button onClick={() => handleAutoToggle('TEMP')} className={`action-btn-premium temp-btn ${autoOptions.includes('TEMP') ? 'active-opt' : ''} ${!isDark ? 'light-btn' : ''}`} style={{ width: '70px', height: '105px', position: 'relative' }}>
                  {autoOptions.includes('TEMP') && <CheckCircle size={18} fill="#10b981" color="#ffffff" style={{position: 'absolute', top: '4px', right: '4px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'}} />}
                  <Thermometer size={24} className="mb-2" />
                  <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TEMP</span>
                </button>
                <button 
                  className={`action-btn-premium local-btn ${autoOptions.includes('LOCAL') ? 'active-opt' : ''} ${!isDark ? 'light-btn' : ''}`} 
                  style={{ width: '70px', height: '105px', position: 'relative', cursor: 'not-allowed', opacity: 0.8 }}
                  title="This is selected automatically when the AC is operated from a physical switch."
                >
                  {autoOptions.includes('LOCAL') && <CheckCircle size={18} fill="#10b981" color="#ffffff" style={{position: 'absolute', top: '4px', right: '4px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'}} />}
                  <Settings size={24} className="mb-2" />
                  <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>LOCAL</span>
                </button>
              </>
            )}
          </div>

        </Modal.Body>
      </Modal>

      {/* STYLE SHEET */}
      <style dangerouslySetInnerHTML={{__html: `
        
        .premium-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }

        .hover-glow:hover {
          background: rgba(255,255,255,0.1) !important;
          color: #fff !important;
        }

        .sleek-power.on:hover {
          box-shadow: 0 12px 25px rgba(14, 165, 233, 0.5) !important;
          transform: scale(1.05);
        }
        .sleek-power.off:hover {
          background: rgba(255,255,255,0.1) !important;
          color: #fff !important;
        }

        .hover-white:hover {
          color: #fff !important;
          background: rgba(255,255,255,0.05);
        }

        .edit-pencil-btn:hover {
          background: rgba(14, 165, 233, 0.25) !important;
          color: #38bdf8 !important;
          transform: scale(1.1);
        }

        .group-hover-edit:hover h4 {
          color: #38bdf8 !important;
          transition: color 0.2s ease;
        }

        .premium-input {
          background: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #fff !important;
          border-radius: 12px;
          transition: all 0.3s;
        }
        .premium-input:focus {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2) !important;
        }

        .premium-select {
          background-color: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          font-size: 11px;
          font-weight: bold;
        }

        .action-btn-premium {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          border-radius: 26px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(15, 23, 42, 0.6);
          color: #94a3b8;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.5px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          cursor: pointer;
        }

        .action-btn-premium.light-btn:not(.active-opt) {
          background: #ffffff;
          border-color: rgba(0,0,0,0.1);
          color: #475569;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        
        .action-btn-premium.light-btn:not(.active-opt):hover {
          background: #f8fafc;
          border-color: rgba(0,0,0,0.15);
        }

        .action-btn-premium:hover {
          transform: translateY(-5px);
        }

        .start-btn { color: #10b981; border-color: rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.05); }
        .stop-btn { color: #ef4444; border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); }
        .schedule-btn { color: #0ea5e9; border-color: rgba(14, 165, 233, 0.3); background: rgba(14, 165, 233, 0.02); }
        .sensor-btn { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.02); }
        .temp-btn { color: #ec4899; border-color: rgba(236, 72, 153, 0.3); background: rgba(236, 72, 153, 0.02); }
        .local-btn { color: #a855f7; border-color: rgba(168, 85, 247, 0.3); background: rgba(168, 85, 247, 0.02); }

        .start-btn:hover { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3)); border-color: rgba(16, 185, 129, 0.5); box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2); }
        .stop-btn:hover { background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3)); border-color: rgba(239, 68, 68, 0.5); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2); }
        .schedule-btn:hover { background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(2, 132, 199, 0.2)); border-color: rgba(14, 165, 233, 0.5); box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2); }
        .sensor-btn:hover { background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.2)); border-color: rgba(245, 158, 11, 0.5); box-shadow: 0 10px 20px rgba(245, 158, 11, 0.2); }
        .temp-btn:hover { background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.2)); border-color: rgba(236, 72, 153, 0.5); box-shadow: 0 10px 20px rgba(236, 72, 153, 0.2); }
        .local-btn:hover { background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(147, 51, 234, 0.2)); border-color: rgba(168, 85, 247, 0.5); box-shadow: 0 10px 20px rgba(168, 85, 247, 0.2); }

        .schedule-btn.active-opt { background: linear-gradient(135deg, rgba(14, 165, 233, 0.4), rgba(2, 132, 199, 0.6)); border-color: rgba(14, 165, 233, 0.8); box-shadow: 0 10px 20px rgba(14, 165, 233, 0.4); color: #fff; }
        .sensor-btn.active-opt { background: linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.6)); border-color: rgba(245, 158, 11, 0.8); box-shadow: 0 10px 20px rgba(245, 158, 11, 0.4); color: #fff; }
        .temp-btn.active-opt { background: linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(219, 39, 119, 0.6)); border-color: rgba(236, 72, 153, 0.8); box-shadow: 0 10px 20px rgba(236, 72, 153, 0.4); color: #fff; }
        .local-btn.active-opt { background: linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(147, 51, 234, 0.6)); border-color: rgba(168, 85, 247, 0.8); box-shadow: 0 10px 20px rgba(168, 85, 247, 0.4); color: #fff; }

        
        .fs-12 { font-size: 0.75rem !important; }
        .fs-11 { font-size: 0.7rem !important; }
        .tracking-widest { letter-spacing: 1.5px !important; }

        .pulse-dot {
          width: 6px;
          height: 6px;
          background-color: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulse 2s infinite;
        }
        .pulse-badge {
          animation: pulse 2s infinite;
        }
        
        @keyframes airStreamFlow {
          0% {
            stroke-dashoffset: 70;
            opacity: 0;
            transform: translateY(-4px) scaleY(0.65);
          }
          20% {
            opacity: 0.95;
          }
          75% {
            opacity: 0.65;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
            transform: translateY(14px) scaleY(1.2);
          }
        }

        @keyframes airWaveRipple {
          0% {
            transform: translateY(-2px) scaleX(0.9);
            opacity: 0;
          }
          35% {
            opacity: 0.8;
          }
          70% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(18px) scaleX(1.08);
            opacity: 0;
          }
        }

        @keyframes coolMistBreath {
          0%, 100% {
            opacity: 0.5;
            transform: scale(0.95, 0.88);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.04, 1.18);
          }
        }

        .air-stream {
          stroke-dasharray: 24 16;
          animation: airStreamFlow 1.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        .air-s1 { animation-delay: 0.08s; }
        .air-s2 { animation-delay: 0.32s; }
        .air-s3 { animation-delay: 0.16s; }
        .air-s4 { animation-delay: 0s; stroke-dasharray: 28 14; }
        .air-s5 { animation-delay: 0.2s; }
        .air-s6 { animation-delay: 0.38s; }
        .air-s7 { animation-delay: 0.12s; }

        .air-wave {
          animation: airWaveRipple 2.2s ease-out infinite;
        }
        .air-w1 { animation-delay: 0s; }
        .air-w2 { animation-delay: 0.75s; }
        .air-w3 { animation-delay: 1.45s; }

        .operation-mode-modal .modal-dialog {
          max-width: 390px !important;
          margin: 1.75rem auto;
        }

        .operation-mode-modal .modal-content {
          background: transparent !important;
          border: none !important;
        }
      `}} />
    </div>
  );
};

export default ACOverview;
