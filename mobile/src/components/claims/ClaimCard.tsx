import {Badge, type BadgeIntent} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {colors, radius, spacing, typography} from '@/theme';
import {
  CLAIM_STATUSES,
  type Claim,
  type ClaimStatus,
  type ClaimUpdateInput,
} from '@/types/claims';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';

const STATUS_LABEL_KEYS = {
  OPEN: 'Claims.status.OPEN',
  IN_PROGRESS: 'Claims.status.IN_PROGRESS',
  CLOSED: 'Claims.status.CLOSED',
} as const;

const STATUS_INTENTS: Record<ClaimStatus, BadgeIntent> = {
  OPEN: 'warning',
  IN_PROGRESS: 'primary',
  CLOSED: 'success',
};

export function ClaimCard({
  claim,
  pending,
  highlighted = false,
  onSave,
}: {
  claim: Claim;
  pending: boolean;
  highlighted?: boolean;
  onSave: (input: ClaimUpdateInput) => void;
}) {
  const {t} = useTranslation();
  const [status, setStatus] = useState<ClaimStatus>(claim.status);
  const [reply, setReply] = useState(claim.reply ?? '');

  const author = `${claim.author.firstName} ${claim.author.lastName}`;
  const meta = claim.amenityName
    ? t('Claims.metaAmenity', {amenity: claim.amenityName, author})
    : t('Claims.meta', {unit: claim.unitName ?? '-', author});

  const save = () => {
    const next: ClaimUpdateInput = {};
    if (status !== claim.status) next.status = status;
    if (reply !== (claim.reply ?? '')) next.reply = reply;
    if (next.status === undefined && next.reply === undefined) return;
    onSave(next);
  };

  return (
    <View style={[styles.card, highlighted && styles.highlighted]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{claim.title}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <Badge
          label={t(STATUS_LABEL_KEYS[claim.status])}
          intent={STATUS_INTENTS[claim.status]}
        />
      </View>

      <Text style={styles.body}>{claim.body}</Text>

      <View style={styles.separator} />

      {claim.canManage ? (
        <View style={styles.editor}>
          <Select
            label={t('Claims.statusLabel')}
            value={status}
            onChange={value => setStatus(value as ClaimStatus)}
            options={CLAIM_STATUSES.map(value => ({
              value,
              label: t(STATUS_LABEL_KEYS[value]),
            }))}
          />
          <Input
            label={t('Claims.replyLabel')}
            value={reply}
            onChangeText={setReply}
            placeholder={t('Claims.replyPlaceholder')}
            multiline
          />
          <Button
            title={t('Claims.save')}
            size="sm"
            loading={pending}
            onPress={save}
            style={styles.save}
          />
        </View>
      ) : (
        <View style={styles.replyBlock}>
          <Text style={styles.replyLabel}>{t('Claims.replyLabel')}</Text>
          <Text style={styles.reply}>{claim.reply || t('Claims.noReply')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  highlighted: {
    borderColor: 'rgba(59,130,246,0.7)',
    backgroundColor: 'rgba(59,130,246,0.06)',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerText: {flex: 1, gap: 3},
  title: {color: colors.text, fontSize: typography.h3, fontWeight: '700'},
  meta: {color: colors.textSecondary, fontSize: typography.small},
  body: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.lg,
  },
  editor: {gap: spacing.md},
  save: {alignSelf: 'flex-end'},
  replyBlock: {gap: spacing.xs},
  replyLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reply: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
});
