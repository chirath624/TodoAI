import {
  createEntityAdapter,
  createSlice,
  nanoid,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { EditableNoteFields, Note } from './types';

export const notesAdapter = createEntityAdapter<Note>();

export type NotesState = ReturnType<typeof notesAdapter.getInitialState>;

export const initialNotesState: NotesState = notesAdapter.getInitialState();

// Timestamps are generated in `prepare` callbacks so reducers stay pure.
const withTimestamp = <T>(payload: T) => ({
  payload: { ...payload, at: Date.now() },
});

type Stamped<T> = PayloadAction<T & { at: number }>;

function markDirty(note: Note, at: number) {
  note.updatedAt = at;
  note.syncStatus = 'pending';
}

const notesSlice = createSlice({
  name: 'notes',
  initialState: initialNotesState,
  reducers: {
    noteAdded: {
      reducer(state, action: PayloadAction<Note>) {
        notesAdapter.addOne(state, action.payload);
      },
      prepare(fields: Partial<EditableNoteFields> = {}) {
        const now = Date.now();
        const note: Note = {
          id: nanoid(),
          title: '',
          body: '',
          color: 'default',
          pinned: false,
          ...fields,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending',
        };
        return { payload: note };
      },
    },

    noteUpdated: {
      reducer(
        state,
        action: Stamped<{ id: string; changes: Partial<EditableNoteFields> }>,
      ) {
        const note = state.entities[action.payload.id];
        if (!note || note.deleted) {
          return;
        }
        Object.assign(note, action.payload.changes);
        markDirty(note, action.payload.at);
      },
      prepare: (id: string, changes: Partial<EditableNoteFields>) =>
        withTimestamp({ id, changes }),
    },

    notePinToggled: {
      reducer(state, action: Stamped<{ id: string }>) {
        const note = state.entities[action.payload.id];
        if (!note || note.deleted) {
          return;
        }
        note.pinned = !note.pinned;
        markDirty(note, action.payload.at);
      },
      prepare: (id: string) => withTimestamp({ id }),
    },

    noteDeleted: {
      reducer(state, action: Stamped<{ id: string }>) {
        const note = state.entities[action.payload.id];
        if (!note) {
          return;
        }
        // Never reached the server: nothing to tell it, drop it outright.
        if (note.syncedAt === undefined) {
          notesAdapter.removeOne(state, note.id);
          return;
        }
        note.deleted = true;
        markDirty(note, action.payload.at);
      },
      prepare: (id: string) => withTimestamp({ id }),
    },

    /**
     * Dispatched by the sync layer when the server acknowledged a version.
     * `updatedAt` identifies which version was sent: if the user edited the
     * note while the request was in flight, it stays pending.
     */
    noteSynced(
      state,
      action: PayloadAction<{
        id: string;
        updatedAt: number;
        imageRemoteKey?: string;
      }>,
    ) {
      const { id, updatedAt, imageRemoteKey } = action.payload;
      const note = state.entities[id];
      if (!note) {
        return;
      }
      note.syncedAt = updatedAt;
      if (imageRemoteKey && note.image) {
        note.image.remoteKey = imageRemoteKey;
      }
      if (note.updatedAt !== updatedAt) {
        return;
      }
      if (note.deleted) {
        notesAdapter.removeOne(state, id);
      } else {
        note.syncStatus = 'synced';
      }
    },

    noteSyncFailed(
      state,
      action: PayloadAction<{ id: string; updatedAt: number }>,
    ) {
      const note = state.entities[action.payload.id];
      if (note && note.updatedAt === action.payload.updatedAt) {
        note.syncStatus = 'failed';
      }
    },
  },
});

export const {
  noteAdded,
  noteUpdated,
  notePinToggled,
  noteDeleted,
  noteSynced,
  noteSyncFailed,
} = notesSlice.actions;

export default notesSlice.reducer;
