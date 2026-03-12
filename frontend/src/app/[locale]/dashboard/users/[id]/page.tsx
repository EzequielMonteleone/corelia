'use client';

import {useParams} from 'next/navigation';
import {User, Mail, Phone, Shield, Building2, Home, ArrowLeft} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {Card} from '@/components/ui/Card';
import {Badge} from '@/components/ui/Badge';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {useUser} from '@/hooks/useUsers';
import {useTranslations} from 'next-intl';

export default function UserDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const {data: user, isLoading, isError} = useUser(id ?? null);
  const t = useTranslations('Users');
  const tCommon = useTranslations('Common');

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingState message={t('loadingDetail')} iconClassName="text-indigo-500" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-8">
        <PageHeader title={t('title')} description={t('description')} />
        <Card className="p-8 text-center">
          <p className="text-gray-400 mb-4">{t('notFound')}</p>
          <Link
            href="/dashboard/users"
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
      <PageHeader title={t('detailTitle')} description={t('description')}>
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {tCommon('back')}
        </Link>
      </PageHeader>

      <Card className="p-6 max-w-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <User className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge intent={user.isActive ? 'success' : 'danger'}>
                {user.isActive ? tCommon('active') : tCommon('inactive')}
              </Badge>
              {user.globalRole && (
                <span className="flex items-center gap-1 text-sm text-indigo-400">
                  <Shield className="w-4 h-4" />
                  {user.globalRole}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-white/5 pt-6">
          <div className="flex items-center gap-3 text-gray-300">
            <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm text-gray-500">{t('emailPlaceholder')}</p>
              <p>{user.email}</p>
            </div>
          </div>
          {user.phone && (
            <div className="flex items-center gap-3 text-gray-300">
              <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">{t('phone')}</p>
                <p>{user.phone}</p>
              </div>
            </div>
          )}
        </div>

        {user.buildingUsers && user.buildingUsers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('buildingsAndRoles')}
            </h3>
            <ul className="space-y-2">
              {user.buildingUsers.map(bu => (
                <li
                  key={bu.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.02]">
                  <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-white font-medium">
                    {typeof bu.building === 'object' && bu.building?.name
                      ? bu.building.name
                      : bu.buildingId}
                  </span>
                  {bu.role?.name && (
                    <Badge className="ml-auto">{bu.role.name}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {user.userUnits && user.userUnits.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {t('units')}
            </h3>
            <ul className="space-y-2">
              {user.userUnits.map(uu => (
                <li
                  key={uu.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.02]">
                  <Home className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-white">
                    {typeof uu.unit === 'object' && uu.unit
                      ? uu.unit.floor
                        ? `${uu.unit.floor} - ${uu.unit.name}`
                        : uu.unit.name
                      : uu.unit?.id ?? ''}
                  </span>
                  <Badge intent="outline" className="ml-auto">
                    {uu.relationType === 'OWNER' ? t('owner') : t('roomer')}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
