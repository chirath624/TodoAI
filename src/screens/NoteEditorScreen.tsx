import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useStore } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import type { ScreenProps } from '../app/navigation';
import type { RootState } from '../app/store';
import CachedImage from '../components/CachedImage';
import ColorPicker from '../components/ColorPicker';
import SyncBadge from '../components/SyncBadge';
import { noteDeleted, noteUpdated } from '../features/notes/notesSlice';
import { selectNoteById } from '../features/notes/selectors';
import { useAttachImage } from '../features/notes/useAttachImage';
import { imageUri } from '../storage/imageCache';
import { noteBackground, useScheme, useThemeColors } from '../theme';

export default function NoteEditorScreen({
  navigation,
  route,
}: ScreenProps<'NoteEditor'>) {
  const { id, attachImage } = route.params;
  const note = useAppSelector(state => selectNoteById(state, id));
  const store = useStore<RootState>();
  const dispatch = useAppDispatch();
  const attach = useAttachImage();
  const scheme = useScheme();
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const background = note ? noteBackground(note.color, scheme) : colors.surface;
  const startsEmpty = useRef(!note?.title && !note?.body).current;

  // Opened from the quick bar's image button: go straight to the picker.
  const attachRequested = useRef(false);
  useEffect(() => {
    if (attachImage && !attachRequested.current) {
      attachRequested.current = true;
      attach(id);
    }
  }, [attach, attachImage, id]);

  // Don't leave empty notes behind when the editor is abandoned.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        const current = store.getState().notes.entities[id];
        if (
          current &&
          !current.deleted &&
          !current.title.trim() &&
          !current.body.trim() &&
          !current.image
        ) {
          dispatch(noteDeleted(id));
        }
      }),
    [dispatch, id, navigation, store],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: background },
      headerShadowVisible: false,
      headerTintColor: colors.text,
    });
  }, [background, colors.text, navigation]);

  if (!note || note.deleted) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
      style={[styles.screen, { backgroundColor: background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {note.image && (
          <View>
            <View
              style={[
                styles.imageFrame,
                { aspectRatio: note.image.width / note.image.height },
              ]}
            >
              <CachedImage uri={imageUri(note.image)} priority="high" />
            </View>
            <Pressable
              onPress={() => dispatch(noteUpdated(id, { image: undefined }))}
              accessibilityRole="button"
              accessibilityLabel="Remove image"
              hitSlop={8}
              style={styles.removeImage}
            >
              <Text style={styles.removeImageLabel}>✕</Text>
            </Pressable>
          </View>
        )}

        <TextInput
          value={note.title}
          onChangeText={title => dispatch(noteUpdated(id, { title }))}
          placeholder="Title"
          placeholderTextColor={colors.textMuted}
          style={[styles.title, { color: colors.text }]}
          multiline
          submitBehavior="blurAndSubmit"
          returnKeyType="next"
        />
        <TextInput
          value={note.body}
          onChangeText={body => dispatch(noteUpdated(id, { body }))}
          placeholder="Note"
          placeholderTextColor={colors.textMuted}
          style={[styles.body, { color: colors.text }]}
          multiline
          scrollEnabled={false}
          autoFocus={startsEmpty && !attachImage}
          textAlignVertical="top"
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border, paddingBottom: insets.bottom },
        ]}
      >
        <ColorPicker
          value={note.color}
          onChange={color => dispatch(noteUpdated(id, { color }))}
        />
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            Edited {new Date(note.updatedAt).toLocaleString()}
          </Text>
          <SyncBadge status={note.syncStatus} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  imageFrame: {
    width: '100%',
  },
  removeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    paddingHorizontal: 16,
    paddingTop: 8,
    minHeight: 200,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  metaText: {
    fontSize: 12,
  },
});
