'use client';

import {useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import {
  Building2,
  MapPin,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Pencil,
} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {Card} from '@/components/ui/Card';
import {Badge} from '@/components/ui/Badge';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {
  useBuilding,
  useBuildingAmenities,
  useBuildingUnits,
  useCreateBuildingAmenity,
  useCreateUnit,
  useDeleteBuildingAmenity,
  useDeleteUnit,
  useUpdateBuildingAmenity,
  useUpdateUnit,
} from '@/hooks/useBuildings';
import {useTranslations} from 'next-intl';

export default function BuildingDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const {data: building, isLoading, isError} = useBuilding(id ?? null);
  const {data: units = []} = useBuildingUnits(id ?? null);
  const {data: amenitiesData} = useBuildingAmenities(id ?? null);
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const createAmenity = useCreateBuildingAmenity();
  const updateAmenity = useUpdateBuildingAmenity();
  const deleteAmenity = useDeleteBuildingAmenity();

  const [unitName, setUnitName] = useState('');
  const [unitFloor, setUnitFloor] = useState('');
  const [unitCoefficient, setUnitCoefficient] = useState('');
  const [catalogAmenityId, setCatalogAmenityId] = useState('');
  const [customAmenityName, setCustomAmenityName] = useState('');

  const t = useTranslations('Buildings');
  const tCommon = useTranslations('Common');
  const buildingAmenities = amenitiesData?.amenities;
  const catalog = amenitiesData?.catalog;

  const availableCatalogAmenities = useMemo(() => {
    const selectedIds = new Set((buildingAmenities ?? []).map(item => item.amenityId));
    return (catalog ?? []).filter(item => !selectedIds.has(item.id));
  }, [buildingAmenities, catalog]);

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingState message={t('loading')} />
      </div>
    );
  }

  if (isError || !building) {
    return (
      <div className="p-8">
        <PageHeader title={t('title')} description={t('description')} />
        <Card className="p-8 text-center">
          <p className="text-gray-400 mb-4">{t('notFound')}</p>
          <Link
            href="/dashboard/buildings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('backToList')}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader title={t('title')} description={t('description')}>
        <Link
          href="/dashboard/buildings"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {tCommon('back')}
        </Link>
      </PageHeader>

      <Card className="p-6 max-w-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {building.name}
            </h2>
            <Badge intent={building.active ? 'success' : 'danger'}>
              {building.active ? tCommon('active') : tCommon('inactive')}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 border-t border-white/5 pt-6">
          <div className="flex items-center gap-3 text-gray-300">
            <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-sm text-gray-500">{t('address')}</p>
              <p>{building.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <span className="text-sm text-gray-500 w-20">{t('city')}</span>
            <span>{building.city}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <span className="text-sm text-gray-500 w-20">{t('country')}</span>
            <span>{building.country}</span>
          </div>
          {building.taxId && (
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-sm text-gray-500 w-20">{t('taxId')}</span>
              <span>{building.taxId}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">{t('unitsTitle')}</h3>
            <Badge>{units.length}</Badge>
          </div>

          <div className="space-y-3 mb-4">
            <Input
              placeholder={t('unitNamePlaceholder')}
              value={unitName}
              onChange={e => setUnitName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={t('unitFloorPlaceholder')}
                value={unitFloor}
                onChange={e => setUnitFloor(e.target.value)}
              />
              <Input
                placeholder={t('unitCoefficientPlaceholder')}
                value={unitCoefficient}
                onChange={e => setUnitCoefficient(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!id || !unitName.trim()) return;
                createUnit.mutate(
                  {
                    buildingId: id,
                    name: unitName.trim(),
                    floor: unitFloor.trim() || undefined,
                    coefficient: (() => {
                      if (unitCoefficient.trim() === '') return undefined;
                      const parsed = Number(unitCoefficient);
                      return Number.isFinite(parsed) ? parsed : undefined;
                    })(),
                  },
                  {
                    onSuccess: () => {
                      setUnitName('');
                      setUnitFloor('');
                      setUnitCoefficient('');
                    },
                  },
                );
              }}>
              <Plus className="w-4 h-4 mr-2" />
              {t('addUnit')}
            </Button>
          </div>

          <div className="space-y-2">
            {units.map(unit => (
              <div
                key={unit.id}
                className="p-3 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-medium">{unit.name}</p>
                  <p className="text-xs text-gray-400">
                    {t('unitFloorLabel')}: {unit.floor || '-'} | {t('unitCoefficientLabel')}:{' '}
                    {unit.coefficient ?? '-'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    intent="ghost"
                    size="icon"
                    onClick={() => {
                      const newName = prompt(t('renameUnitPrompt'), unit.name);
                      if (!newName || !newName.trim()) return;
                      updateUnit.mutate({id: unit.id, name: newName.trim()});
                    }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    intent="ghost"
                    size="icon"
                    className="hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => {
                      if (!id) return;
                      deleteUnit.mutate({id: unit.id, buildingId: id});
                    }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {units.length === 0 && (
              <p className="text-sm text-gray-500">{t('unitsEmpty')}</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">{t('amenitiesTitle')}</h3>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="space-y-3 mb-4">
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
              value={catalogAmenityId}
              onChange={e => setCatalogAmenityId(e.target.value)}>
              <option value="">{t('selectCatalogAmenity')}</option>
              {availableCatalogAmenities.map(item => (
                <option key={item.id} value={item.id} className="bg-[#121212]">
                  {item.name}
                </option>
              ))}
            </select>
            <Button
              className="w-full"
              intent="outline"
              onClick={() => {
                if (!id || !catalogAmenityId) return;
                createAmenity.mutate(
                  {buildingId: id, amenityId: catalogAmenityId},
                  {
                    onSuccess: () => {
                      setCatalogAmenityId('');
                    },
                  },
                );
              }}>
              <Plus className="w-4 h-4 mr-2" />
              {t('addCatalogAmenity')}
            </Button>
            <div className="flex gap-2">
              <Input
                placeholder={t('customAmenityPlaceholder')}
                value={customAmenityName}
                onChange={e => setCustomAmenityName(e.target.value)}
              />
              <Button
                intent="outline"
                onClick={() => {
                  if (!id || !customAmenityName.trim()) return;
                  createAmenity.mutate(
                    {
                      buildingId: id,
                      customAmenityName: customAmenityName.trim(),
                    },
                    {
                      onSuccess: () => {
                        setCustomAmenityName('');
                      },
                    },
                  );
                }}>
                {t('addCustomAmenity')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {(buildingAmenities ?? []).map(item => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-medium">{item.amenity.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.amenity.isSystem ? t('amenityTypeCatalog') : t('amenityTypeCustom')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!id) return;
                      updateAmenity.mutate({
                        id: item.id,
                        buildingId: id,
                        isEnabled: !item.isEnabled,
                      });
                    }}
                    className="cursor-pointer border-0 p-0 bg-transparent">
                    <Badge intent={item.isEnabled ? 'success' : 'danger'}>
                      {item.isEnabled ? tCommon('active') : tCommon('inactive')}
                    </Badge>
                  </button>
                  {!item.amenity.isSystem && (
                    <Button
                      intent="ghost"
                      size="icon"
                      onClick={() => {
                        if (!id) return;
                        const name = prompt(t('renameAmenityPrompt'), item.amenity.name);
                        if (!name || !name.trim()) return;
                        updateAmenity.mutate({
                          id: item.id,
                          buildingId: id,
                          customName: name.trim(),
                        });
                      }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    intent="ghost"
                    size="icon"
                    className="hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => {
                      if (!id) return;
                      deleteAmenity.mutate({id: item.id, buildingId: id});
                    }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(buildingAmenities?.length ?? 0) === 0 && (
              <p className="text-sm text-gray-500">{t('amenitiesEmpty')}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
