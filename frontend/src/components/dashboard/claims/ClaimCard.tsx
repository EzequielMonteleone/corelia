'use client';

import {useTranslations} from 'next-intl';
import {Badge} from '@/components/ui/Badge';
import {ClaimEditor} from '@/components/dashboard/claims/ClaimEditor';
import {Claim, ClaimStatus, ClaimUpdateInput} from '@/types/claims';

const labelClass = 'text-xs font-medium text-gray-400';

function statusIntent(status: ClaimStatus) {
  if (status === 'CLOSED') return 'success' as const;
  if (status === 'IN_PROGRESS') return 'primary' as const;
  return 'warning' as const;
}

export function ClaimCard({
  claim,
  pending,
  onSave,
}: {
  claim: Claim;
  pending: boolean;
  onSave: (input: ClaimUpdateInput) => void;
}) {
  const t = useTranslations('Claims');
  const author = `${claim.author.firstName} ${claim.author.lastName}`;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{claim.title}</h3>
          <p className="mt-1 text-sm text-gray-400">
            {claim.amenityName
              ? t('metaAmenity', {amenity: claim.amenityName, author})
              : t('meta', {unit: claim.unitName ?? '', author})}
          </p>
        </div>
        <Badge intent={statusIntent(claim.status)}>
          {t(`status.${claim.status}`)}
        </Badge>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm text-gray-200">
        {claim.body}
      </p>
      {claim.canManage ? (
        <ClaimEditor
          key={`${claim.status}:${claim.reply ?? ''}`}
          claim={claim}
          pending={pending}
          onSave={onSave}
        />
      ) : (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className={labelClass}>{t('replyLabel')}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-200">
            {claim.reply || t('noReply')}
          </p>
        </div>
      )}
    </article>
  );
}
