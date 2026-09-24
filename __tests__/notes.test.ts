import { configureStore } from '@reduxjs/toolkit';
import notesReducer, {
  noteAdded,
  noteDeleted,
  notePinToggled,
  noteSynced,
  noteUpdated,
} from '../src/features/notes/notesSlice';
import {
  OTHERS_HEADER,
  PINNED_HEADER,
  selectFeedItems,
} from '../src/features/notes/selectors';
import { storage } from '../src/storage/mmkv';
import { loadNotesState, startNotesPersistence } from '../src/storage/persist';

const makeStore = () =>
  configureStore({
    reducer: { notes: notesReducer },
    preloadedState: { notes: loadNotesState() },
  });

beforeEach(() => storage.clearAll());

test('pinned notes are grouped first under headers', () => {
  const store = makeStore();
  const a = store.dispatch(noteAdded({ title: 'a' })).payload.id;
  const b = store.dispatch(noteAdded({ title: 'b' })).payload.id;
  expect(selectFeedItems(store.getState())).toEqual(
    expect.arrayContaining([a, b]),
  );
  expect(selectFeedItems(store.getState())).not.toContain(PINNED_HEADER);

  store.dispatch(notePinToggled(a));
  expect(selectFeedItems(store.getState())).toEqual([
    PINNED_HEADER,
    a,
    OTHERS_HEADER,
    b,
  ]);
});

test('sync ack for an older version keeps the note pending', () => {
  jest.useFakeTimers({ now: 1000 });
  const store = makeStore();
  const note = store.dispatch(noteAdded({ title: 'x' })).payload;
  jest.setSystemTime(2000);
  store.dispatch(noteUpdated(note.id, { body: 'edited while in flight' }));
  store.dispatch(noteSynced({ id: note.id, updatedAt: 1000 }));
  jest.useRealTimers();

  const current = store.getState().notes.entities[note.id];
  expect(current.syncStatus).toBe('pending');
  expect(current.syncedAt).toBe(1000);

  store.dispatch(noteSynced({ id: note.id, updatedAt: 2000 }));
  expect(store.getState().notes.entities[note.id].syncStatus).toBe('synced');
});

test('deleting a never-synced note removes it immediately', () => {
  const store = makeStore();
  const id = store.dispatch(noteAdded()).payload.id;
  store.dispatch(noteDeleted(id));
  expect(store.getState().notes.ids).toEqual([]);
});

test('state round-trips through MMKV synchronously', () => {
  jest.useFakeTimers();
  const store = makeStore();
  const stop = startNotesPersistence(store);
  const id = store.dispatch(noteAdded({ title: 'persist me' })).payload.id;
  jest.runAllTimers();
  stop();
  jest.useRealTimers();

  const rehydrated = makeStore();
  expect(rehydrated.getState().notes.entities[id]?.title).toBe('persist me');
});

test('corrupt storage falls back to empty and keeps a backup', () => {
  storage.set('notes.v1', '{not json');
  expect(loadNotesState().ids).toEqual([]);
  expect(storage.getString('notes.v1.corrupt')).toBe('{not json');
});
