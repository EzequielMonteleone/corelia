import {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {AppHeader} from '@/components/layout/AppHeader';
import {BuildingSwitcher} from '@/components/layout/BuildingSwitcher';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {ModalSheet} from '@/components/ui/ModalSheet';
import {Select} from '@/components/ui/Select';
import {EmptyState, ErrorState, LoadingState} from '@/components/ui/States';
import {Screen} from '@/components/ui/Screen';
import {useActiveBuilding} from '@/hooks/useActiveBuilding';
import {
  useCreateDocument,
  useDocument,
  useDocuments,
} from '@/hooks/queries/useDocuments';
import {errorMessage} from '@/lib/apiError';
import {formatDate} from '@/lib/format';
import {toast} from '@/store/toastStore';
import type {DocumentKind} from '@/types/document';
import {colors, radius, spacing, typography} from '@/theme';

const KIND_LABELS: Record<DocumentKind, string> = {
  BYLAW: 'Reglamento',
  NOTICE: 'Aviso',
};

const KIND_FILTERS = [
  {value: 'ALL', label: 'Todos'},
  {value: 'BYLAW', label: 'Reglamentos'},
  {value: 'NOTICE', label: 'Avisos'},
];

export default function DocumentsScreen() {
  const router = useRouter();
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
    if (!title.trim()) nextErrors.title = 'Ingresá un título.';
    if (!body.trim()) nextErrors.body = 'Ingresá el contenido.';
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
          toast.success('Documento publicado correctamente.');
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
            title="Documentos"
            showBell={false}
            onBack={() => router.back()}
          />
          <LoadingState message="Cargando documentos..." />
        </Screen>
      </RequireAccess>
    );
  }

  if (buildingsError) {
    return (
      <RequireAccess path="/documents">
        <Screen>
          <AppHeader
            title="Documentos"
            showBell={false}
            onBack={() => router.back()}
          />
          <ErrorState
            message="No pudimos cargar tus edificios."
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
          title="Documentos"
          subtitle="Reglamentos y avisos del edificio."
          showBell={false}
          onBack={() => router.back()}
          right={
            canManage ? (
              <Button title="Publicar" size="sm" onPress={openCreate} />
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
            title="Elegí un edificio"
            description="Seleccioná un edificio para ver sus documentos."
          />
        ) : documentsQuery.isLoading ? (
          <LoadingState message="Cargando documentos..." />
        ) : documentsQuery.isError ? (
          <ErrorState
            message="No pudimos cargar los documentos."
            onRetry={() => documentsQuery.refetch()}
          />
        ) : documents.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Sin documentos"
            description={
              canManage
                ? 'Publicá el primer reglamento o aviso del edificio.'
                : 'El administrador todavía no publicó documentos.'
            }
            actionLabel={canManage ? 'Publicar documento' : undefined}
            onAction={canManage ? openCreate : undefined}
          />
        ) : (
          <View style={styles.content}>
            <Select
              value={kindFilter}
              onChange={setKindFilter}
              options={KIND_FILTERS}
            />

            {filtered.length === 0 ? (
              <EmptyState
                icon="filter-outline"
                title="Sin resultados"
                description="No hay documentos de este tipo."
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
                        {KIND_LABELS[document.kind]} ·{' '}
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
          title={documentQuery.data?.title ?? 'Documento'}>
          {documentQuery.isLoading ? (
            <LoadingState message="Cargando documento..." />
          ) : documentQuery.isError ? (
            <ErrorState
              message="No pudimos cargar el documento."
              onRetry={() => documentQuery.refetch()}
            />
          ) : documentQuery.data ? (
            <View style={styles.detail}>
              <View style={styles.detailMeta}>
                <Badge
                  label={KIND_LABELS[documentQuery.data.kind]}
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
          title="Publicar documento">
          <View style={styles.form}>
            <Select
              label="Tipo"
              value={kind}
              onChange={value => setKind(value as DocumentKind)}
              options={[
                {value: 'NOTICE', label: 'Aviso'},
                {value: 'BYLAW', label: 'Reglamento'},
              ]}
            />
            <Input
              label="Título"
              value={title}
              onChangeText={value => {
                setTitle(value);
                if (errors.title) {
                  setErrors(current => ({...current, title: ''}));
                }
              }}
              placeholder="Título del documento"
              error={errors.title || undefined}
            />
            <Input
              label="Contenido"
              value={body}
              onChangeText={value => {
                setBody(value);
                if (errors.body) {
                  setErrors(current => ({...current, body: ''}));
                }
              }}
              placeholder="Escribí el contenido..."
              multiline
              error={errors.body || undefined}
            />
            {errors.form ? (
              <Text style={styles.formError}>{errors.form}</Text>
            ) : null}
            <Button
              title="Publicar"
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
