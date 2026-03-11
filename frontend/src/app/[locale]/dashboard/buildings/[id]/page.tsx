'use client';

import {useParams} from 'next/navigation';
import {Building2, MapPin, ArrowLeft} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {Card} from '@/components/ui/Card';
import {Badge} from '@/components/ui/Badge';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {useBuilding} from '@/hooks/useBuildings';
import {useTranslations} from 'next-intl';

export default function BuildingDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const {data: building, isLoading, isError} = useBuilding(id ?? null);
  const t = useTranslations('Buildings');
  const tCommon = useTranslations('Common');

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
    </div>
  );
}
