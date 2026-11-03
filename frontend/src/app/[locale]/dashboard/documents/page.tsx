'use client';

import {SubmitEvent, useMemo, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {toast} from 'sonner';
import {errorCode} from '@/lib/apiError';
import {useRouter} from '@/i18n/navigation';
import {PageHeader} from '@/components/dashboard/PageHeader';
import {Card, CardContent} from '@/components/ui/Card';
import {LoadingState} from '@/components/ui/LoadingState';
import {Select} from '@/components/ui/Select';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {useBuildings} from '@/hooks/useBuildings';
import {
  useCreateDocument,
  useDocument,
  useDocuments,
} from '@/hooks/useDocuments';
import {DocumentKind} from '@/types/document';

const fieldClass = 'space-y-1.5';
const labelClass = 'text-xs font-medium text-gray-400';
const notesClass =
  'flex min-h-40 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-blue-500/50 focus:outline-none';

export default function DocumentsPage() {
  const t = useTranslations('Documents');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryBuildingId = searchParams.get('buildingId') ?? '';
  const documentId = searchParams.get('documentId');
  const {data: buildings = [], isLoading: loadingBuildings} = useBuildings();
  const [buildingChoice, setBuildingChoice] = useState<{
    forQuery: string;
    value: string;
  } | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<DocumentKind>('NOTICE');
  const selectedBuildingId =
    buildingChoice?.forQuery === queryBuildingId
      ? buildingChoice.value
      : queryBuildingId;

  const activeBuildingId = useMemo(
    () => selectedBuildingId || (buildings.length === 1 ? buildings[0].id : ''),
    [buildings, selectedBuildingId],
  );
  const documentsQuery = useDocuments(activeBuildingId || null);
  const detailQuery = useDocument(activeBuildingId || null, documentId);
  const createDocument = useCreateDocument();
  const list = documentsQuery.data;

  const openDocument = (id: string) => {
    if (!activeBuildingId) return;
    const params = new URLSearchParams({
      buildingId: activeBuildingId,
      documentId: id,
    });
    router.replace(`/dashboard/documents?${params.toString()}`);
  };

  const toastError = (error: unknown) => {
    const code = errorCode(error);
    if (
      code === 'INVALID_TITLE' ||
      code === 'INVALID_BODY' ||
      code === 'INVALID_KIND'
    ) {
      toast.error(t('invalid'));
    } else if (code === 'INSUFFICIENT_PERMISSIONS') toast.error(t('forbidden'));
    else if (code === 'CHAT_NOT_CONFIGURED')
      toast.error(t('chatNotConfigured'));
    else toast.error(t('saveError'));
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!activeBuildingId) return;
    createDocument.mutate(
      {buildingId: activeBuildingId, title, body, kind},
      {
        onSuccess: created => {
          toast.success(t('createSuccess'));
          setTitle('');
          setBody('');
          openDocument(created.id);
        },
        onError: toastError,
      },
    );
  };

  return (
    <div className="p-8">
      <PageHeader title={t('title')} description={t('description')}>
        {buildings.length > 1 && (
          <Select
            className="w-56 shrink-0"
            value={activeBuildingId}
            onChange={event =>
              setBuildingChoice({
                forQuery: queryBuildingId,
                value: event.target.value,
              })
            }>
            <option value="">{t('selectBuilding')}</option>
            {buildings.map(building => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </Select>
        )}
      </PageHeader>

      {loadingBuildings ? (
        <LoadingState message={t('loading')} />
      ) : !activeBuildingId ? (
        <Card>
          <CardContent className="p-8 text-gray-400">
            {t('selectBuilding')}
          </CardContent>
        </Card>
      ) : documentsQuery.isLoading ? (
        <LoadingState message={t('loading')} />
      ) : documentsQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-gray-400">
            {t('saveError')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {list?.canManage && (
            <form
              onSubmit={submit}
              className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white">
                {t('newTitle')}
              </h2>
              <label className={fieldClass}>
                <span className={labelClass}>{t('kindLabel')}</span>
                <Select
                  value={kind}
                  onChange={event =>
                    setKind(event.target.value as DocumentKind)
                  }>
                  <option value="NOTICE">{t('kind.NOTICE')}</option>
                  <option value="BYLAW">{t('kind.BYLAW')}</option>
                </Select>
              </label>
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
                <Button type="submit" isLoading={createDocument.isPending}>
                  {t('submit')}
                </Button>
              </div>
            </form>
          )}

          {documentId && detailQuery.isLoading && (
            <LoadingState message={t('loading')} />
          )}
          {documentId && detailQuery.isError && (
            <p className="text-sm text-gray-500">{t('notFound')}</p>
          )}
          {detailQuery.data && (
            <article className="rounded-2xl border border-blue-500/40 bg-white/5 p-5">
              <p className="text-xs font-medium text-blue-300">
                {t(`kind.${detailQuery.data.kind}`)}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {detailQuery.data.title}
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm text-gray-200">
                {detailQuery.data.body}
              </p>
            </article>
          )}

          {list && list.documents.length === 0 && (
            <p className="text-sm text-gray-500">{t('empty')}</p>
          )}
          <div className="grid gap-3">
            {list?.documents.map(document => (
              <button
                key={document.id}
                type="button"
                onClick={() => openDocument(document.id)}
                className={`rounded-2xl border px-4 py-3 text-left ${
                  document.id === documentId
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}>
                <p className="text-xs text-gray-400">
                  {t(`kind.${document.kind}`)}
                </p>
                <p className="mt-1 font-medium text-white">{document.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
