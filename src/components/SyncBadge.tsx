import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { SyncStatus } from '../features/notes/types';
import { useThemeColors } from '../theme';

const GLYPHS: Record<SyncStatus, string> = {
  synced: '✓',
  pending: '↑',
  failed: '!',
};

const LABELS: Record<SyncStatus, string> = {
  synced: 'Synced',
  pending: 'Waiting to sync',
  failed: 'Sync failed, will retry',
};

function SyncBadge({ status }: { status: SyncStatus }) {
  const colors = useThemeColors();
  const color =
    status === 'failed'
      ? colors.danger
      : status === 'pending'
      ? colors.warning
      : colors.textMuted;

  return (
    <Text
      style={[styles.badge, { color }, status === 'synced' && styles.synced]}
      accessibilityLabel={LABELS[status]}
    >
      {GLYPHS[status]}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 11,
    fontWeight: '700',
    alignSelf: 'flex-end',
  },
  synced: {
    opacity: 0.5,
  },
});

export default memo(SyncBadge);
