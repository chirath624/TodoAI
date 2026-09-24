import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../app/hooks';
import { selectNoteById } from '../features/notes/selectors';
import { imageUri } from '../storage/imageCache';
import { noteBackground, useScheme, useThemeColors } from '../theme';
import SyncBadge from './SyncBadge';
import CachedImage from './CachedImage';

// Very tall images would dominate a column; crop them to at most 3:4.
const MIN_ASPECT_RATIO = 0.75;

interface Props {
  id: string;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
}

/**
 * Subscribes to its own note by id, so editing one note re-renders one card
 * and never the list.
 */
function NoteCard({ id, onPress, onLongPress }: Props) {
  const note = useAppSelector(state => selectNoteById(state, id));
  const scheme = useScheme();
  const colors = useThemeColors();

  if (!note) {
    return null;
  }

  const isDefault = note.color === 'default';
  const hasText = note.title.length > 0 || note.body.length > 0;

  return (
    <Pressable
      onPress={() => onPress(id)}
      onLongPress={() => onLongPress(id)}
      accessibilityRole="button"
      accessibilityHint="Opens the note. Long press to pin or unpin."
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: noteBackground(note.color, scheme),
          borderColor: isDefault ? colors.border : 'transparent',
        },
        pressed && styles.pressed,
      ]}
    >
      {note.image && (
        <View
          style={[
            styles.imageFrame,
            {
              aspectRatio: Math.max(
                note.image.width / note.image.height,
                MIN_ASPECT_RATIO,
              ),
            },
          ]}
        >
          <CachedImage uri={imageUri(note.image)} priority="normal" />
        </View>
      )}
      <View style={styles.content}>
        {note.title.length > 0 && (
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {note.title}
          </Text>
        )}
        {note.body.length > 0 && (
          <Text
            style={[styles.body, { color: colors.text }]}
            numberOfLines={10}
          >
            {note.body}
          </Text>
        )}
        {!hasText && !note.image && (
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Empty note
          </Text>
        )}
        <SyncBadge status={note.syncStatus} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 4,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  imageFrame: {
    width: '100%',
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    lineHeight: 19,
  },
});

export default memo(NoteCard);
