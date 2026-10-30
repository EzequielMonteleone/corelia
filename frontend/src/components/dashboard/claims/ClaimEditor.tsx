'use client';

import {SubmitEvent, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/Button';
import {Select} from '@/components/ui/Select';
import {CLAIM_STATUSES, Claim, ClaimStatus, ClaimUpdateInput} from '@/types/claims';

const fieldClass = 'space-y-1.5';
const labelClass = 'text-xs font-medium text-gray-400';
const notesClass =
  'flex min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-blue-500/50 focus:outline-none';

export function ClaimEditor({
  claim,
  pending,
  onSave,
}: {
  claim: Claim;
  pending: boolean;
  onSave: (input: ClaimUpdateInput) => void;
}) {
  const t = useTranslations('Claims');
  const [status, setStatus] = useState<ClaimStatus>(claim.status);
  const [reply, setReply] = useState(claim.reply ?? '');

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const next: ClaimUpdateInput = {};
    if (status !== claim.status) next.status = status;
    if (reply.trim() !== (claim.reply ?? '')) next.reply = reply;
    if (next.status === undefined && next.reply === undefined) return;
    onSave(next);
  };

  return (
    <form onSubmit={submit} className="mt-5 grid gap-3">
      <label className={fieldClass}>
        <span className={labelClass}>{t('statusLabel')}</span>
        <Select
          value={status}
          onChange={event => setStatus(event.target.value as ClaimStatus)}>
          {CLAIM_STATUSES.map(value => (
            <option key={value} value={value}>
              {t(`status.${value}`)}
            </option>
          ))}
        </Select>
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>{t('replyLabel')}</span>
        <textarea
          className={notesClass}
          value={reply}
          onChange={event => setReply(event.target.value)}
        />
      </label>
      <div className="flex justify-end">
        <Button type="submit" size="sm" isLoading={pending}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
