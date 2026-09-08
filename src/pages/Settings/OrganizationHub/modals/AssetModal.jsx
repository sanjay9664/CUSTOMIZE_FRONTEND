import React, { useState, useEffect, useRef } from 'react';
import { Sliders } from 'lucide-react';
import UnifiedRegisterModal from '../../../../components/common/UnifiedRegisterModal';
import { apiClient, normalizeList } from '../../../../services/apiClient';

const AssetModal = ({
  show,
  onHide,
  editingAsset,
  assetForm,
  setAssetForm,
  handleSaveAsset,
  activeSites = [],
  assets = [],
  loading
}) => {
  const [siteAssets, setSiteAssets] = useState([]);
  const [loadingSiteAssets, setLoadingSiteAssets] = useState(false);
  const lastFetchedSiteIdRef = useRef(null);

  // Reset cache when modal closes
  useEffect(() => {
    if (!show) {
      lastFetchedSiteIdRef.current = null;
      setSiteAssets([]);
    }
  }, [show]);

  // Fetch site assets: /sites/:id/assets?page=1&limit=10
  // ONLY triggered when isChildAsset is enabled and siteId has changed
  useEffect(() => {
    let isMounted = true;
    const currentSiteId = assetForm?.siteId || (activeSites.length > 0 ? activeSites[0].id : null);

    // If modal is closed, no siteId, or toggle is OFF -> do NOT trigger network request
    if (!show || !currentSiteId || !assetForm?.isChildAsset) {
      return;
    }

    // If assets for this site are already loaded, do NOT make duplicate network call
    if (String(lastFetchedSiteIdRef.current) === String(currentSiteId)) {
      return;
    }

    const fetchSiteAssets = async () => {
      setLoadingSiteAssets(true);
      try {
        const res = await apiClient.get(`/sites/${currentSiteId}/assets`, { page: 1, limit: 10 });
        const list = normalizeList(res, 'assets');
        if (isMounted) {
          setSiteAssets(list);
          lastFetchedSiteIdRef.current = currentSiteId;
        }
      } catch (err) {
        console.warn('Failed to fetch site assets via /sites/:id/assets, falling back to local list:', err);
        if (isMounted) {
          const fallback = (assets || []).filter(a => String(a.siteId) === String(currentSiteId));
          setSiteAssets(fallback);
          lastFetchedSiteIdRef.current = currentSiteId;
        }
      } finally {
        if (isMounted) {
          setLoadingSiteAssets(false);
        }
      }
    };

    fetchSiteAssets();

    return () => {
      isMounted = false;
    };
  }, [show, assetForm?.siteId, assetForm?.isChildAsset]);

  // Ensure current parent asset exists in options if editing an existing child asset
  const currentParentId = assetForm?.parentAssetId;
  let availableAssets = [...siteAssets];
  if (currentParentId && !availableAssets.some(a => String(a.id) === String(currentParentId))) {
    const existing = assets.find(a => String(a.id) === String(currentParentId));
    if (existing) {
      availableAssets.push(existing);
    }
  }

  // Filter only assets under this site and show only asset name and asset type
  const parentAssetOptions = availableAssets
    .filter(a => String(a.id) !== String(editingAsset?.id))
    .filter(a => !a.siteId || String(a.siteId) === String(assetForm?.siteId))
    .map(a => ({
      value: a.id,
      label: `${a.name} (${a.assetType})`
    }));

  const fields = [
    {
      key: 'siteId',
      label: 'Parent Site',
      type: 'select',
      placeholder: 'Select Parent Site...',
      required: true,
      disabled: !!editingAsset,
      options: activeSites.map(s => ({ value: s.id, label: `${s.name} (ID: ${s.id})` })),
      colSpan: 6
    },
    {
      key: 'isChildAsset',
      label: 'Is Child Asset?',
      type: 'switch',
      alignLeft: true,
      switchLabel: assetForm?.isChildAsset ? 'Yes' : 'No',
      colSpan: 6
    },
    ...(assetForm?.isChildAsset ? [{
      key: 'parentAssetId',
      label: 'Parent Asset (Optional)',
      type: 'select',
      placeholder: loadingSiteAssets ? 'Loading assets...' : (parentAssetOptions.length === 0 ? '-- No parent assets available in this site --' : '-- None (Root Asset) --'),
      disabled: loadingSiteAssets,
      options: parentAssetOptions,
      colSpan: 12
    }] : []),
    {
      key: 'name',
      label: 'Asset Name',
      type: 'text',
      placeholder: 'Enter a unique name',
      required: true,
      colSpan: 6
    },
    {
      key: 'assetType',
      label: 'Asset Type',
      type: 'select',
      required: true,
      options: [
        { value: 'BUILDING', label: 'BUILDING' },
        { value: 'FLOOR', label: 'FLOOR' },
        { value: 'ROOM', label: 'ROOM' },
        { value: 'EQUIPMENT', label: 'EQUIPMENT' },
        { value: 'HVAC', label: 'HVAC' },
        { value: 'PUMP', label: 'PUMP' },
        { value: 'PANEL', label: 'PANEL' },
        { value: 'METER', label: 'METER' },
        { value: 'GENERATOR', label: 'GENERATOR' },
        { value: 'OTHER', label: 'OTHER' }
      ],
      colSpan: 6
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Asset description...',
      rows: 2,
      colSpan: 12
    }
  ];

  return (
    <UnifiedRegisterModal
      show={show}
      onHide={onHide}
      title={editingAsset ? 'Edit Asset' : 'Add Asset'}
      subtitle={editingAsset ? `ID: ${editingAsset.id}` : ''}
      icon={Sliders}
      fields={fields}
      formData={assetForm}
      onChange={(key, val) => {
        setAssetForm(prev => {
          const next = { ...prev, [key]: val };
          if (key === 'isChildAsset' && !val) {
            next.parentAssetId = '';
          }
          if (key === 'siteId') {
            next.parentAssetId = '';
          }
          return next;
        });
      }}
      onSubmit={handleSaveAsset}
      submitting={loading}
      submitLabel={editingAsset ? 'Update Asset' : 'Create Asset'}
      submittingLabel={editingAsset ? 'Updating...' : 'Creating...'}
    />
  );
};

export default AssetModal;
