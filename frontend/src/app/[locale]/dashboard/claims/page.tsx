'use client';

import {SubmitEvent, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {toast} from 'sonner';
import {errorCode} from '@/lib/apiError';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Card, CardContent} from '@/components/ui/Card';
import {LoadingState} from '@/components/ui/LoadingState';
import {Select} from '@/components/ui/Select';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {ClaimCard} from '@/components/dashboard/claims/ClaimCard';
import {useBuildingAmenities, useBuildingUnits, useBuildings} from '@/hooks/useBuildings';
import {useClaims, useCreateClaim, useUpdateClaim} from '@/hooks/useClaims';
import {ClaimUpdateInput} from '@/types/claims';

const fieldClass = 'space-y-1.5';
const labelClass = 'text-xs font-medium text-gray-400';
const notesClass =
  'flex min-h-28 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-blue-500/50 focus:outline-none';

function parseTarget(value: string) {
  if (value.startsWith('unit:')) {
    return {unitId: value.slice(5), buildingAmenityId: null};
  }
  if (value.startsWith('amenity:')) {
    return {unitId: null, buildingAmenityId: value.slice(8)};
  }
  return {unitId: null, buildingAmenityId: null};
}

export default function ClaimsPage() {
  const t = useTranslations('Claims');
  const {data: buildings = [], isLoading: loadingBuildings} = useBuildings();
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const activeBuildingId = useMemo(
    () => selectedBuildingId || (buildings.length === 1 ? buildings[0].id : ''),
    [buildings, selectedBuildingId],
  );
  const {data: units = [], isLoading: loadingUnits} = useBuildingUnits(
    activeBuildingId || null,
  );
  const {data: amenityData, isLoading: loadingAmenities} = useBuildingAmenities(
    activeBuildingId || null,
  );
  const amenities = (amenityData?.amenities ?? []).filter(amenity => amenity.isEnabled);
  const target = parseTarget(selectedTarget);
  const claimsQuery = useClaims(activeBuildingId || null, target);
  const createClaim = useCreateClaim();
  const updateClaim = useUpdateClaim();
  const list = claimsQuery.data;

  const toastError = (error: unknown) => {
    const code = errorCode(error);
    if (code === 'INVALID_CLAIM') toast.error(t('invalid'));
    else if (code === 'UNIT_NOT_LINKED') toast.error(t('unitNotLinked'));
    else if (code === 'AMENITY_NOT_FOUND') toast.error(t('amenityNotFound'));
    else if (code === 'INSUFFICIENT_PERMISSIONS') toast.error(t('forbidden'));
    else toast.error(t('saveError'));
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!activeBuildingId) return;
    const payload = target.unitId
      ? {buildingId: activeBuildingId, unitId: target.unitId, title, body}
      : target.buildingAmenityId
        ? {
            buildingId: activeBuildingId,
            buildingAmenityId: target.buildingAmenityId,
            title,
            body,
          }
        : null;
    if (!payload) return;
    createClaim.mutate(payload, {
      onSuccess: () => {
        toast.success(t('createSuccess'));
        setTitle('');
        setBody('');
      },
      onError: toastError,
    });
  };

  const saveClaim = (id: string, input: ClaimUpdateInput) => {
    updateClaim.mutate(
      {id, ...input},
      {
        onSuccess: () => toast.success(t('saveSuccess')),
        onError: toastError,
      },
    );
  };

  const isLoading =
    loadingBuildings ||
    (!!activeBuildingId && (loadingUnits || loadingAmenities));
  const showTarget = units.length > 0 || amenities.length > 0;

  return (
    <div className="p-8">
      <PageHeader title={t('title')} description={t('description')}>
        <div className="flex flex-col gap-3 sm:flex-row">
          {buildings.length > 1 && (
            <Select
              className="w-56 shrink-0"
              value={activeBuildingId}
              onChange={event => {
                setSelectedBuildingId(event.target.value);
                setSelectedTarget('');
              }}>
              <option value="">{t('selectBuilding')}</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </Select>
          )}
          {showTarget && (
            <Select
              className="w-56 shrink-0"
              value={selectedTarget}
              onChange={event => setSelectedTarget(event.target.value)}>
              <option value="">{t('allSubjects')}</option>
              {units.length > 0 && (
                <optgroup label={t('units')}>
                  {units.map(unit => (
                    <option key={unit.id} value={`unit:${unit.id}`}>
                      {unit.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {amenities.length > 0 && (
                <optgroup label={t('amenities')}>
                  {amenities.map(amenity => (
                    <option key={amenity.id} value={`amenity:${amenity.id}`}>
                      {amenity.amenity.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          )}
        </div>
      </PageHeader>

      {isLoading ? (
        <LoadingState message={t('loading')} />
      ) : !activeBuildingId ? (
        <Card>
          <CardContent className="p-8 text-gray-400">{t('selectBuilding')}</CardContent>
        </Card>
      ) : claimsQuery.isLoading ? (
        <LoadingState message={t('loading')} />
      ) : claimsQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-gray-400">{t('saveError')}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {list?.canCreate && (
            <form
              onSubmit={submit}
              className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white">{t('newTitle')}</h2>
              <label className={fieldClass}>
                <span className={labelClass}>{t('titleLabel')}</span>
                <Input
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  required
                />
              </label>
              <label className={fieldClass}>
                <span className={labelClass}>{t('bodyLabel')}</span>
                <textarea
                  className={notesClass}
                  value={body}
                  onChange={event => setBody(event.target.value)}
                  required
                />
              </label>
              <div className="flex justify-end">
                <Button type="submit" isLoading={createClaim.isPending}>
                  {t('submit')}
                </Button>
              </div>
            </form>
          )}

          {list && list.claims.length === 0 && (
            <p className="text-sm text-gray-500">{t('empty')}</p>
          )}
          <div className="grid gap-4">
            {list?.claims.map(claim => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                pending={updateClaim.isPending && updateClaim.variables?.id === claim.id}
                onSave={input => saveClaim(claim.id, input)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
