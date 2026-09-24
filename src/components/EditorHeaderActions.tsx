import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { noteDeleted, notePinToggled } from '../features/notes/notesSlice';
import { selectNoteById } from '../features/notes/selectors';
import { useAttachImage } from '../features/notes/useAttachImage';
import { useThemeColors } from '../theme';

function HeaderButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

export default function EditorHeaderActions({ id }: { id: string }) {
  const pinned = useAppSelector(state => selectNoteById(state, id)?.pinned);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const attach = useAttachImage();
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      <HeaderButton
        label={pinned ? 'Unpin' : 'Pin'}
        color={colors.accent}
        onPress={() => dispatch(notePinToggled(id))}
      />
      <HeaderButton
        label="Image"
        color={colors.accent}
        onPress={() => attach(id)}
      />
      <HeaderButton
        label="Delete"
        color={colors.danger}
        onPress={() => {
          dispatch(noteDeleted(id));
          navigation.goBack();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
