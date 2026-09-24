import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useThemeColors } from '../theme';

function SectionHeader({ label }: { label: string }) {
  const colors = useThemeColors();
  return (
    <Text
      style={[styles.header, { color: colors.textMuted }]}
      accessibilityRole="header"
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 6,
  },
});

export default memo(SectionHeader);
