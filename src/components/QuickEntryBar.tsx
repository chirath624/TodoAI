import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme';

interface Props {
  /** Save the typed text as a new note. */
  onSubmit: (text: string) => void;
  /** Continue in the full editor, carrying over the typed text. */
  onExpand: (text: string) => void;
  /** Start a new note from a photo. */
  onAddImage: (text: string) => void;
}

/**
 * Always-visible bottom input. It *is* the TextInput, so a single tap puts
 * the cursor in it with the keyboard up: no screen transition in between.
 */
export default function QuickEntryBar({
  onSubmit,
  onExpand,
  onAddImage,
}: Props) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const hasText = text.trim().length > 0;

  const take = (handler: (value: string) => void) => () => {
    handler(text.trim());
    setText('');
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <Pressable
        onPress={take(onAddImage)}
        accessibilityRole="button"
        accessibilityLabel="New note with image"
        hitSlop={8}
        style={styles.iconButton}
      >
        <Text style={[styles.icon, { color: colors.textMuted }]}>▣</Text>
      </Pressable>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Take a note…"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.background },
        ]}
        multiline
        maxLength={10000}
        submitBehavior="submit"
        returnKeyType="done"
        onSubmitEditing={() => hasText && take(onSubmit)()}
        accessibilityLabel="New note"
      />

      <Pressable
        onPress={take(onExpand)}
        accessibilityRole="button"
        accessibilityLabel="Open full editor"
        hitSlop={8}
        style={styles.iconButton}
      >
        <Text style={[styles.icon, { color: colors.textMuted }]}>⤢</Text>
      </Pressable>

      {hasText && (
        <Pressable
          onPress={take(onSubmit)}
          accessibilityRole="button"
          accessibilityLabel="Save note"
          hitSlop={8}
          style={[styles.send, { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.sendIcon, { color: colors.surface }]}>↑</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
  },
  iconButton: {
    height: 40,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  send: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
});
