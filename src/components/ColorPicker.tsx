import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { NOTE_COLORS, type NoteColor } from '../features/notes/types';
import { noteBackground, useScheme, useThemeColors } from '../theme';

interface Props {
  value: NoteColor;
  onChange: (color: NoteColor) => void;
}

function ColorPicker({ value, onChange }: Props) {
  const scheme = useScheme();
  const colors = useThemeColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {NOTE_COLORS.map(color => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${color} background`}
            hitSlop={4}
            style={[
              styles.swatch,
              selected && styles.selected,
              {
                backgroundColor: noteBackground(color, scheme),
                borderColor: selected ? colors.accent : colors.border,
              },
            ]}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  selected: {
    borderWidth: 2,
  },
});

export default memo(ColorPicker);
