import {AppHeader} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Screen} from '@/components/ui/Screen';
import {Select} from '@/components/ui/Select';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {
  useCreateDocument,
  useDocument,
  useDocuments,
} from '@/hooks/queries/useDocuments';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {errorMessage} from '@/lib/apiError';
import {formatDate} from '@/lib/format';
import {toast} from '@/store/toastStore';
import {colors, radius, spacing, typography} from '@/theme';
import type {DocumentKind} from '@/types/document';
import {Ionicons} from '@expo/vector-icons';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';

const KIND_LABEL_KEYS = {
  BYLAW: 'Documents.kind.BYLAW',
  NOTICE: 'Documents.kind.NOTICE',
} as const;

export default function DocumentsScreen() {
  const router = useRouter();
  const {t} = useTranslation();
  const params = useLocalSearchParams<{
    buildingId?: string;
    documentId?: string;
  }>();
  const {
    buildings,
    activeBuildingId,
    setSelectedBuildingId,
    isLoading: loadingBuildings,
    isRefetching: buildingsRefetching,
    isError: buildingsError,
    refetch: refetchBuildings,
  } = useActiveBuilding();
  const documentsQuery = useDocuments(activeBuildingId);
  const createDocument = useCreateDocument();

  const [kindFilter, setKindFilter] = useState('ALL');
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<DocumentKind>('NOTICE');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const documentQuery = useDocument(activeBuildingId, openDocumentId);

  useEffect(() => {
    if (params.buildingId) setSelectedBuildingId(params.buildingId);
  }, [params.buildingId, setSelectedBuildingId]);

  useEffect(() => {
    // Deep links can update params while the screen is already mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (params.documentId) setOpenDocumentId(params.documentId);
  }, [params.documentId]);

  const documents = useMemo(
    () => documentsQuery.data?.documents ?? [],
    [documentsQuery.data],
  );
  const canManage = !!documentsQuery.data?.canManage;

  const filtered = useMemo(
    () =>
      kindFilter === 'ALL'
        ? documents
        : documents.filter(item => item.kind === kindFilter),
    [documents, kindFilter],
  );

  const kindFilters = useMemo(
    () => [
      {value: 'ALL', label: t('Documents.all')},
      {value: 'BYLAW', label: t('Documents.allBylaws')},
      {value: 'NOTICE', label: t('Documents.allNotices')},
    ],
    [t],
  );

  const openCreate = () => {
    setTitle('');
    setBody('');
    setKind('NOTICE');
    setErrors({});
    setCreateOpen(true);
  };

  const submit = () => {
    if (!activeBuildingId) return;
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = t('Documents.titleRequired');
    if (!body.trim()) nextErrors.body = t('Documents.bodyRequired');
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    createDocument.mutate(
      {
        buildingId: activeBuildingId,
        title: title.trim(),
        body: body.trim(),
        kind,
      },
      {
        onSuccess: () => {
          toast.success(t('Documents.createSuccess'));
          setCreateOpen(false);
        },
        onError: error => setErrors({form: errorMessage(error)}),
      },
    );
  };

  if (loadingBuildings) {
    return (
      <RequireAccess path="/documents">
        <Screen>
          <AppHeader
            title={t('Documents.title')}
            showBell={false}
            onBack={() => router.back()}
          />
          <LoadingState message={t('Documents.loading')} />
        </Screen>
      </RequireAccess>
    );
  }

  if (buildingsError) {
    return (
      <RequireAccess path="/documents">
        <Screen>
          <AppHeader
            title={t('Documents.title')}
            showBell={false}
            onBack={() => router.back()}
          />
          <ErrorState
            message={t('Documents.buildingsError')}
            onRetry={() => refetchBuildings()}
          />
        </Screen>
      </RequireAccess>
    );
  }

  return (
    <RequireAccess path="/documents">
      <Screen
        refreshing={buildingsRefetching || documentsQuery.isRefetching}
        onRefresh={() => {
          refetchBuildings();
          documentsQuery.refetch();
        }}>
        <AppHeader
          title={t('Documents.title')}
          subtitle={t('Documents.subtitle')}
          showBell={false}
          onBack={() => router.back()}
          right={
            canManage ? (
              <Button
                title={t('Documents.submit')}
                size="sm"
                onPress={openCreate}
              />
            ) : undefined
          }
        />

        <BuildingSwitcher
          buildings={buildings}
          value={activeBuildingId}
          onChange={value => {
            setSelectedBuildingId(value);
            setOpenDocumentId(null);
            setKindFilter('ALL');
          }}
        />

        {!activeBuildingId ? (
          <EmptyState
            icon="document-text-outline"
            title={t('Documents.selectBuilding')}
            description={t('Documents.chooseBuildingDesc')}
          />
        ) : documentsQuery.isLoading ? (
          <LoadingState message={t('Documents.loading')} />
        ) : documentsQuery.isError ? (
          <ErrorState
            message={t('Documents.loadError')}
            onRetry={() => documentsQuery.refetch()}
          />
        ) : documents.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title={t('Documents.emptyTitle')}
            description={
              canManage
                ? t('Documents.emptyCanManage')
                : t('Documents.emptyCannotManage')
            }
            actionLabel={canManage ? t('Documents.publishTitle') : undefined}
            onAction={canManage ? openCreate : undefined}
          />
        ) : (
          <View style={styles.content}>
            <Select
              value={kindFilter}
              onChange={setKindFilter}
              options={kindFilters}
            />

            {filtered.length === 0 ? (
              <EmptyState
                icon="filter-outline"
                title={t('Documents.noResults')}
                description={t('Documents.noResultsDescription')}
              />
            ) : (
              <View style={styles.list}>
                {filtered.map(document => (
                  <Card
                    key={document.id}
                    style={styles.card}
                    onPress={() => setOpenDocumentId(document.id)}
                    accessibilityLabel={document.title}>
                    <View style={styles.icon}>
                      <Ionicons
                        name={
                          document.kind === 'BYLAW'
                            ? 'book-outline'
                            : 'megaphone-outline'
                        }
                        size={19}
                        color={
                          document.kind === 'BYLAW'
                            ? colors.indigo
                            : colors.warning
                        }
                      />
                    </View>
                    <View style={styles.text}>
                      <Text style={styles.title} numberOfLines={2}>
                        {document.title}
                      </Text>
                      <Text style={styles.meta}>
                        {t(KIND_LABEL_KEYS[document.kind])} ·{' '}
                        {formatDate(document.createdAt)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={colors.textMuted}
                    />
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        <ModalSheet
          visible={!!openDocumentId}
          onClose={() => setOpenDocumentId(null)}
          title={documentQuery.data?.title ?? t('Documents.document')}>
          {documentQuery.isLoading ? (
            <LoadingState message={t('Documents.loadingDocument')} />
          ) : documentQuery.isError ? (
            <ErrorState
              message={t('Documents.loadDocumentError')}
              onRetry={() => documentQuery.refetch()}
            />
          ) : documentQuery.data ? (
            <View style={styles.detail}>
              <View style={styles.detailMeta}>
                <Badge
                  label={t(KIND_LABEL_KEYS[documentQuery.data.kind])}
                  intent={
                    documentQuery.data.kind === 'BYLAW' ? 'primary' : 'warning'
                  }
                />
                <Text style={styles.detailDate}>
                  {formatDate(documentQuery.data.createdAt)}
                </Text>
              </View>
              <Text style={styles.detailBody}>{documentQuery.data.body}</Text>
            </View>
          ) : null}
        </ModalSheet>

        <ModalSheet
          visible={createOpen}
          onClose={() => setCreateOpen(false)}
          title={t('Documents.publishTitle')}>
          <View style={styles.form}>
            <Select
              label={t('Documents.kindLabel')}
              value={kind}
              onChange={value => setKind(value as DocumentKind)}
              options={[
                {value: 'NOTICE', label: t('Documents.kind.NOTICE')},
                {value: 'BYLAW', label: t('Documents.kind.BYLAW')},
              ]}
            />
            <Input
              label={t('Documents.titleLabel')}
              value={title}
              onChangeText={value => {
                setTitle(value);
                if (errors.title) {
                  setErrors(current => ({...current, title: ''}));
                }
              }}
              placeholder={t('Documents.titlePlaceholder')}
              error={errors.title || undefined}
            />
            <Input
              label={t('Documents.bodyLabel')}
              value={body}
              onChangeText={value => {
                setBody(value);
                if (errors.body) {
                  setErrors(current => ({...current, body: ''}));
                }
              }}
              placeholder={t('Documents.bodyPlaceholder')}
              multiline
              error={errors.body || undefined}
            />
            {errors.form ? (
              <Text style={styles.formError}>{errors.form}</Text>
            ) : null}
            <Button
              title={t('Documents.submit')}
              loading={createDocument.isPending}
              fullWidth
              onPress={submit}
            />
          </View>
        </ModalSheet>
      </Screen>
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  content: {gap: spacing.lg},
  list: {gap: spacing.sm},
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  text: {flex: 1, gap: 3},
  title: {color: colors.text, fontSize: typography.body, fontWeight: '700'},
  meta: {color: colors.textMuted, fontSize: typography.caption},
  detail: {gap: spacing.lg, paddingTop: spacing.sm},
  detailMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  detailDate: {color: colors.textMuted, fontSize: typography.caption},
  detailBody: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 23,
  },
  form: {gap: spacing.lg, paddingTop: spacing.sm},
  formError: {color: colors.danger, fontSize: typography.caption},
});
