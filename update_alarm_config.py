import re

with open('src/pages/AlarmSystem/AlarmConfig.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add templateModule to ALL_SERVICES
mapping = {
    'energy-main': "'Main Meter'",
    'energy-sub': "'Sub Meters'",
    'water-ug': "'UG Pump'",
    'water-ag': "'AG Tank'",
    'fire-pump': "'Fire Pump'",
    'vrv': "'Temp & Humidity'",
    'lt-panel': "'Electrical Parameter'",
    'transformer': "'Electrical Parameter'",
    'aqi': "'Temp & Humidity'",
    'motors': "'Motors'",
    'energy-dg': "'DG Set'"
}

def repl_service(m):
    id_val = m.group(1)
    mod = mapping.get(id_val, "''")
    return f"id:'{id_val}', templateModule:{mod}, name:"

content = re.sub(r"id:'([^']+)', name:", repl_service, content)

# Inject state and useEffect
hook_injection = """
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDevice, setSelectedDevice]   = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);

  useEffect(() => {
    if (!selectedService) {
      setAvailableDevices([]);
      setSelectedDevice(null);
      return;
    }
    const svc = ALL_SERVICES.find(s => s.id === selectedService);
    try {
      const saved = JSON.parse(localStorage.getItem('scada_templates') || '[]');
      const devs = saved.filter(t => t.module === svc.templateModule);
      setAvailableDevices(devs);
      if (devs.length > 0) {
        setSelectedDevice(devs[0].id);
      } else {
        setSelectedDevice(null);
      }
    } catch(e) {
      console.error(e);
      setAvailableDevices([]);
      setSelectedDevice(null);
    }
  }, [selectedService]);
"""

content = re.sub(r"const \[selectedService, setSelectedService\] = useState\(null\);", hook_injection.strip(), content)

# Inject Device Selector UI
ui_injection = """
        {/* ── Spacer ──────────────────────────────────────────────────────── */}
        <div style={{height: 32}}></div>

        {activeService && availableDevices.length > 0 && (
           <div style={{background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16}}>
              <label style={{color: '#94a3b8', fontSize: '0.95rem', fontWeight: 600}}>Select Specific Device:</label>
              <select 
                 value={selectedDevice || ''} 
                 onChange={e => setSelectedDevice(Number(e.target.value))}
                 style={{
                   flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                   color: '#f8fafc', padding: '10px 16px', borderRadius: 8, fontSize: '0.95rem', outline: 'none'
                 }}
              >
                {availableDevices.map(d => (
                   <option key={d.id} value={d.id} style={{background: '#0f172a'}}>{d.name}</option>
                ))}
              </select>
           </div>
        )}
        {activeService && availableDevices.length === 0 && (
           <div style={{background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '20px', padding: '16px 24px', marginBottom: 24}}>
              <span style={{color: '#ef4444', fontSize: '0.9rem', fontWeight: 500}}>
                 No mapped devices found for {activeService.name}. Please configure templates first.
              </span>
           </div>
        )}

        {/* ── Config Area ────────────────────────────────────────────────────── */}
"""

content = content.replace("{/* ── Spacer ──────────────────────────────────────────────────────── */}\n        <div style={{height: 32}}></div>\n\n        {/* ── Config Area ────────────────────────────────────────────────────── */}", ui_injection)

# Replace handleSave
save_logic = """
  const handleSave = async (sid) => {
    if (!selectedDevice) {
       alert("Please select a specific device first.");
       return;
    }

    const deviceTemplate = availableDevices.find(d => d.id === selectedDevice);
    if (!deviceTemplate || !deviceTemplate.mapping) {
       alert("Device mapping not found.");
       return;
    }

    let targetModuleId = null;
    const mapping = deviceTemplate.mapping;
    for (const key in mapping) {
       if (mapping[key] && typeof mapping[key] === 'object') {
          if (mapping[key].module) {
             targetModuleId = mapping[key].module;
             break;
          }
       }
    }

    if (!targetModuleId) {
       alert("Could not extract a valid module ID for this device from the mapping.");
       return;
    }

    // Mock Payload for now to show user
    const payload = {
       moduleId: targetModuleId,
       settingFields: []
    };
    console.log("SENDING TO RULE ENGINE:", payload);
    
    // Simulate API call
    setSaved(p=>({...p,[sid]:true}));
    setSaveTarget(sid);
    setShowModal(true);
    setTimeout(()=>setSaved(p=>({...p,[sid]:false})),3000);
  };
"""

content = re.sub(r"const handleSave = sid => \{.*?\n  \};", save_logic.strip(), content, flags=re.DOTALL)

with open('src/pages/AlarmSystem/AlarmConfig.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Update successful')
