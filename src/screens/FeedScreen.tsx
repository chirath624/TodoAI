import { useCallback } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useStore } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import type { ScreenProps } from '../app/navigation';
import type { RootState } from '../app/store';
import NoteCard from '../components/NoteCard';
import QuickEntryBar from '../components/QuickEntryBar';
import SectionHeader from '../components/SectionHeader';
import { noteAdded, notePinToggled } from '../features/notes/notesSlice';
import {
  isHeader,
  PINNED_HEADER,
  selectFeedItems,
  type FeedItem,
} from '../features/notes/selectors';
import { useThemeColors } from '../theme';

const keyExtractor = (item: FeedItem) => item;

export default function FeedScreen({ navigation }: ScreenProps<'Feed'>) {
  const items = useAppSelector(selectFeedItems);
  const store = useStore<RootState>();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const openNote = useCallback(
    (id: string) => navigation.navigate('NoteEditor', { id }),
    [navigation],
  );

  const togglePin = useCallback(
    (id: string) => dispatch(notePinToggled(id)),
    [dispatch],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FeedItem>) =>
      isHeader(item) ? (
        <SectionHeader label={item === PINNED_HEADER ? 'Pinned' : 'Others'} />
      ) : (
        <NoteCard id={item} onPress={openNote} onLongPress={togglePin} />
      ),
    [openNote, togglePin],
  );

  // Recycling hint only: cells are reused within the same type. Read the
  // store directly so the screen doesn't subscribe to every note edit.
  const getItemType = useCallback(
    (item: FeedItem) => {
      if (isHeader(item)) {
        return 'header';
      }
      return store.getState().notes.entities[item]?.image
        ? 'note-image'
        : 'note-text';
    },
    [store],
  );

  // Headers span every column, which also levels the columns, so each
  // section starts on a clean line and pinned notes can't interleave.
  const overrideItemLayout = useCallback(
    (
      layout: { span?: number },
      item: FeedItem,
      _: number,
      maxColumns: number,
    ) => {
      if (isHeader(item)) {
        layout.span = maxColumns;
      }
    },
    [],
  );

  const createAndOpen = (body: string, attachImage?: boolean) => {
    const { payload } = dispatch(noteAdded({ body }));
    navigation.navigate('NoteEditor', { id: payload.id, attachImage });
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={{ paddingTop: insets.top }}>
        <Text style={[styles.title, { color: colors.text }]}>Notes</Text>
      </View>

      <FlashList
        data={items}
        masonry
        numColumns={numColumns}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemType={getItemType}
        overrideItemLayout={overrideItemLayout}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Notes you add appear here
          </Text>
        }
      />

      <QuickEntryBar
        onSubmit={body => dispatch(noteAdded({ body }))}
        onExpand={body => createAndOpen(body)}
        onAddImage={body => createAndOpen(body, true)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  list: {
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 80,
    fontSize: 15,
  },
});
