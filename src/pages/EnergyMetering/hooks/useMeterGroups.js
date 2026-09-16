import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export const GROUP_EVENT_NAME = 'energy-meter-groups-updated';

export const GROUP_COLORS = [
  '#0284c7', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const createGroupId = () => `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const normalizeMeterGroups = (groups = [], meters = []) => {
  const templateIdMap = new Map();
  const meterLookup = new Map();
  const globallyAssigned = new Set();
  const usedGroupIds = new Set();

  meters.forEach(meter => {
    const templateId = String(meter.templateId ?? meter.id);
    templateIdMap.set(templateId, templateId);
    templateIdMap.set(String(meter.id), templateId);
    meterLookup.set(templateId, {
      id: templateId,
      label: meter.label || meter.name,
      type: meter.type || meter.category || 'Sub Meter',
      category: meter.type || meter.category || 'Sub Meter'
    });
  });

  return (Array.isArray(groups) ? groups : [])
    .map((group, index) => {
      const requestedId = String(group?.id || '').trim();
      const safeId = requestedId && !usedGroupIds.has(requestedId) ? requestedId : createGroupId();
      usedGroupIds.add(safeId);

      const groupMeterIds = Array.from(
        new Set((Array.isArray(group?.meterIds) ? group.meterIds : []).map(id => String(id)))
      )
        .map(id => templateIdMap.get(id))
        .filter(Boolean)
        .filter(id => {
          if (globallyAssigned.has(id)) return false;
          globallyAssigned.add(id);
          return true;
        });

      return {
        id: safeId,
        name: String(group?.name || '').trim() || `Group ${index + 1}`,
        color: group?.color || GROUP_COLORS[index % GROUP_COLORS.length],
        meterIds: groupMeterIds,
        meterDetails: groupMeterIds.map(id => meterLookup.get(id)).filter(Boolean)
      };
    })
    .filter(group => group.name);
};

export const useMeterGroups = (meters = []) => {
  const [meterGroups, setMeterGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupSaveStatus, setGroupSaveStatus] = useState(null);
  const groupsHydratedRef = useRef(false);

  const getBackendUrl = () => window.process?.env?.REACT_APP_BACKEND_URL || '';

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true);
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const tenantId = userData?.tenantId;
      const url = tenantId
        ? `${getBackendUrl()}/api/templates/energy-meter-groups?tenantId=${tenantId}`
        : `${getBackendUrl()}/api/templates/energy-meter-groups`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch energy meter groups');
      }
      const data = await response.json();
      const groups = Array.isArray(data?.groups) ? data.groups : [];
      const normalized = normalizeMeterGroups(groups, meters);
      setMeterGroups(normalized);
      groupsHydratedRef.current = true;
      return normalized;
    } catch (err) {
      console.warn('Backend groups fetch failed, checking local cache:', err);
      const cached = localStorage.getItem('energyMeterGroups');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const normalized = normalizeMeterGroups(parsed, meters);
          setMeterGroups(normalized);
          groupsHydratedRef.current = true;
          return normalized;
        } catch {
          // ignore error
        }
      }
      setMeterGroups([]);
      groupsHydratedRef.current = true;
      return [];
    } finally {
      setIsLoadingGroups(false);
    }
  }, [meters]);

  const saveGroupsToBackend = useCallback(async (nextGroups) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const tenantId = userData?.tenantId;
    const cleanGroups = (Array.isArray(nextGroups) ? nextGroups : []).map(group => ({
      id: group.id,
      name: group.name,
      color: group.color,
      meterIds: group.meterIds || []
    }));

    // LocalStorage optimistic cache
    localStorage.setItem('energyMeterGroups', JSON.stringify(cleanGroups));

    const response = await fetch(`${getBackendUrl()}/api/templates/energy-meter-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId,
        groups: cleanGroups,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save energy meter groups to backend');
    }

    const data = await response.json();
    const savedGroups = Array.isArray(data?.groups) ? data.groups : cleanGroups;
    const normalized = normalizeMeterGroups(savedGroups, meters);
    setMeterGroups(normalized);

    // Broadcast update across components
    window.dispatchEvent(new CustomEvent(GROUP_EVENT_NAME, { detail: normalized }));
    return normalized;
  }, [meters]);

  // Initial load
  useEffect(() => {
    let active = true;
    if (meters.length > 0 && !groupsHydratedRef.current) {
      fetchGroups();
    } else if (meters.length > 0 && groupsHydratedRef.current) {
      setMeterGroups(prev => normalizeMeterGroups(prev, meters));
    }
    return () => { active = false; };
  }, [meters, fetchGroups]);

  // Real-time synchronization event listener
  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setMeterGroups(normalizeMeterGroups(e.detail, meters));
      } else {
        fetchGroups();
      }
    };
    window.addEventListener(GROUP_EVENT_NAME, handleSync);
    return () => window.removeEventListener(GROUP_EVENT_NAME, handleSync);
  }, [meters, fetchGroups]);

  const duplicateGroupNames = useMemo(() => {
    const counts = new Map();
    meterGroups.forEach(group => {
      const normalizedName = String(group.name || '').trim().toLowerCase();
      if (!normalizedName) return;
      counts.set(normalizedName, (counts.get(normalizedName) || 0) + 1);
    });
    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [meterGroups]);

  const getAssignedGroupForMeter = useCallback((meterId, currentGroupId = null) => {
    const targetId = String(meterId);
    return meterGroups.find(
      group => group.id !== currentGroupId && group.meterIds.includes(targetId)
    );
  }, [meterGroups]);

  return {
    meterGroups,
    setMeterGroups,
    isLoadingGroups,
    groupSaveStatus,
    setGroupSaveStatus,
    fetchGroups,
    saveGroupsToBackend,
    duplicateGroupNames,
    getAssignedGroupForMeter,
    normalizeMeterGroups: (groups) => normalizeMeterGroups(groups, meters)
  };
};
