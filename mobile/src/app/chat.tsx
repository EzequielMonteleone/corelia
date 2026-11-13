import {useEffect, useRef, useState} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {AppHeader} from '@/components/layout/AppHeader';
import {RequireAccess} from '@/components/layout/RequireAccess';
import {Card} from '@/components/ui/Card';
import {ErrorState, LoadingState} from '@/components/ui/States';
import {
  useChatThread,
  useConfirmChatDraft,
  useConfirmClaimDraft,
  useSendChatMessage,
} from '@/hooks/queries/useChat';
import {errorMessage} from '@/lib/apiError';
import {formatDateTime} from '@/lib/format';
import {toast} from '@/store/toastStore';
import type {ChatMessage} from '@/types/chat';
import {colors, radius, spacing, typography} from '@/theme';

const SUGGESTIONS = [
  'Quiero reservar el SUM',
  'Tengo un problema en mi unidad',
  '¿Cuánto tengo que pagar de expensas?',
];

export default function ChatScreen() {
  const router = useRouter();
  const threadQuery = useChatThread();
  const sendMessage = useSendChatMessage();
  const confirmDraft = useConfirmChatDraft();
  const confirmClaimDraft = useConfirmClaimDraft();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState('');

  const messages = threadQuery.data?.messages ?? [];
  const pendingDrafts = threadQuery.data?.pendingDrafts ?? [];
  const pendingClaimDrafts = threadQuery.data?.pendingClaimDrafts ?? [];

  useEffect(() => {
    if (messages.length === 0) return;
    listRef.current?.scrollToEnd({animated: true});
  }, [messages.length]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || sendMessage.isPending) return;
    setInput('');
    sendMessage.mutate(value, {
      onError: error => toast.error(errorMessage(error)),
    });
  };

  const confirmReservation = (draftId: string) => {
    confirmDraft.mutate(draftId, {
      onSuccess: () => toast.success('Reserva confirmada.'),
      onError: error => toast.error(errorMessage(error)),
    });
  };

  const confirmClaim = (draftId: string) => {
    confirmClaimDraft.mutate(draftId, {
      onSuccess: () => toast.success('Reclamo actualizado.'),
      onError: error => toast.error(errorMessage(error)),
    });
  };

  return (
    <RequireAccess path="/chat">
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <AppHeader
            title="Asistente Corelia"
            subtitle="Reservas, reclamos y consultas en un chat."
            showBell={false}
            onBack={() => router.back()}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={styles.flex}>
          {threadQuery.isLoading ? (
            <LoadingState message="Cargando conversación..." />
          ) : threadQuery.isError ? (
            <ErrorState
              message="No pudimos cargar la conversación."
              onRetry={() => threadQuery.refetch()}
            />
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.messages}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({animated: true})
              }
              renderItem={({item}) => (
                <MessageBubble
                  message={item}
                  onChoice={choice => send(choice)}
                  disabled={sendMessage.isPending}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="sparkles"
                      size={26}
                      color={colors.indigo}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>¿En qué te puedo ayudar?</Text>
                  <Text style={styles.emptyText}>
                    Podés pedirme que reserve un amenity, que cree un reclamo o
                    que consulte tus expensas.
                  </Text>
                  <View style={styles.suggestions}>
                    {SUGGESTIONS.map(suggestion => (
                      <Pressable
                        key={suggestion}
                        accessibilityRole="button"
                        onPress={() => send(suggestion)}
                        style={styles.suggestion}>
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              }
              ListFooterComponent={
                <View style={styles.footer}>
                  {pendingDrafts.map(draft => (
                    <Card key={draft.id} style={styles.draftCard}>
                      <View style={styles.draftHeader}>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color={colors.primary}
                        />
                        <Text style={styles.draftTitle}>Reserva pendiente</Text>
                      </View>
                      <Text style={styles.draftLine}>
                        {draft.amenityName} · {draft.unitName}
                      </Text>
                      <Text style={styles.draftMeta}>
                        {draft.buildingName} · {formatDateTime(draft.startsAt)}
                      </Text>
                      {draft.notes ? (
                        <Text style={styles.draftMeta}>{draft.notes}</Text>
                      ) : null}
                      <ButtonRow
                        title="Confirmar reserva"
                        pending={confirmDraft.isPending}
                        onPress={() => confirmReservation(draft.id)}
                      />
                    </Card>
                  ))}

                  {pendingClaimDrafts.map(draft => (
                    <Card key={draft.id} style={styles.draftCard}>
                      <View style={styles.draftHeader}>
                        <Ionicons
                          name="chatbox-ellipses-outline"
                          size={18}
                          color={colors.warning}
                        />
                        <Text style={styles.draftTitle}>
                          {draft.kind === 'CREATE'
                            ? 'Reclamo pendiente'
                            : 'Actualización de reclamo'}
                        </Text>
                      </View>
                      <Text style={styles.draftLine}>{draft.title}</Text>
                      {draft.body ? (
                        <Text style={styles.draftMeta}>{draft.body}</Text>
                      ) : null}
                      <Text style={styles.draftMeta}>
                        {draft.amenityName ?? draft.unitName} ·{' '}
                        {draft.buildingName}
                        {draft.nextStatus ? ` · ${draft.nextStatus}` : ''}
                      </Text>
                      <ButtonRow
                        title="Confirmar reclamo"
                        pending={confirmClaimDraft.isPending}
                        onPress={() => confirmClaim(draft.id)}
                      />
                    </Card>
                  ))}

                  {sendMessage.isPending ? (
                    <View style={styles.typing}>
                      <ActivityDots />
                      <Text style={styles.typingText}>Corelia está escribiendo…</Text>
                    </View>
                  ) : null}
                </View>
              }
            />
          )}

          <View style={styles.inputBar}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Escribí tu mensaje..."
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              maxLength={1000}
              editable={!sendMessage.isPending}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              disabled={!input.trim() || sendMessage.isPending}
              onPress={() => send(input)}
              style={[
                styles.sendButton,
                (!input.trim() || sendMessage.isPending) && styles.sendDisabled,
              ]}>
              <Ionicons name="arrow-up" size={20} color={colors.white} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RequireAccess>
  );
}

function MessageBubble({
  message,
  onChoice,
  disabled,
}: {
  message: ChatMessage;
  onChoice: (choice: string) => void;
  disabled: boolean;
}) {
  const mine = message.role === 'USER';

  return (
    <View style={[styles.messageRow, mine && styles.messageRowMine]}>
      {!mine ? (
        <View style={styles.assistantIcon}>
          <Ionicons name="sparkles" size={15} color={colors.indigo} />
        </View>
      ) : null}
      <View style={styles.messageContent}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={styles.messageText}>{message.content}</Text>
        </View>
        {message.choices && message.choices.length > 0 ? (
          <View style={styles.choices}>
            {message.choices.map(choice => (
              <Pressable
                key={choice}
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => onChoice(choice)}
                style={[styles.choice, disabled && styles.choiceDisabled]}>
                <Text style={styles.choiceText}>{choice}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ButtonRow({
  title,
  pending,
  onPress,
}: {
  title: string;
  pending: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={pending}
      onPress={onPress}
      style={({pressed}) => [
        styles.confirmButton,
        pressed && styles.pressed,
        pending && styles.choiceDisabled,
      ]}>
      <Text style={styles.confirmText}>{pending ? 'Confirmando...' : title}</Text>
    </Pressable>
  );
}

function ActivityDots() {
  return (
    <View style={styles.dots}>
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {backgroundColor: colors.background, flex: 1},
  flex: {flex: 1},
  header: {paddingHorizontal: spacing.lg, paddingTop: spacing.md},
  messages: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.indigoSoft,
    borderRadius: 999,
    height: 62,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 62,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
    textAlign: 'center',
  },
  suggestions: {gap: spacing.sm, marginTop: spacing.md, width: '100%'},
  suggestion: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  suggestionText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '500',
    textAlign: 'center',
  },
  messageRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  messageRowMine: {justifyContent: 'flex-end'},
  assistantIcon: {
    alignItems: 'center',
    backgroundColor: colors.indigoSoft,
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    marginTop: 2,
    width: 30,
  },
  messageContent: {flexShrink: 1, gap: spacing.sm, maxWidth: '82%'},
  bubble: {borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md},
  bubbleMine: {
    backgroundColor: colors.primaryDark,
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: radius.sm,
    borderColor: colors.border,
    borderWidth: 1,
  },
  messageText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  choices: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  choice: {
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(59,130,246,0.35)',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceDisabled: {opacity: 0.5},
  choiceText: {color: colors.primary, fontSize: typography.small, fontWeight: '600'},
  footer: {gap: spacing.md, paddingTop: spacing.md},
  draftCard: {gap: spacing.xs, padding: spacing.md},
  draftHeader: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm},
  draftTitle: {color: colors.text, fontSize: typography.small, fontWeight: '700'},
  draftLine: {color: colors.text, fontSize: typography.body, fontWeight: '600'},
  draftMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 16,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  confirmText: {color: colors.white, fontSize: typography.small, fontWeight: '700'},
  pressed: {opacity: 0.8},
  typing: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm},
  typingText: {color: colors.textMuted, fontSize: typography.caption},
  dots: {flexDirection: 'row', gap: 3},
  dot: {
    backgroundColor: colors.indigo,
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  inputBar: {
    alignItems: 'flex-end',
    backgroundColor: colors.backgroundAlt,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    textAlignVertical: 'center',
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendDisabled: {opacity: 0.45},
});
