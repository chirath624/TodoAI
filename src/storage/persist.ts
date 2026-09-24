import { AppState } from 'react-native';
import {
  initialNotesState,
  type NotesState,
} from '../features/notes/notesSlice';
import { storage } from './mmkv';

const NOTES_KEY = 'notes.v1';
const CORRUPT_BACKUP_KEY = 'notes.v1.corrupt';
const WRITE_DELAY_MS = 300;

function isNotesState(value: unknown): value is NotesState {
  const v = value as NotesState | null;
  return (
    !!v &&
    Array.isArray(v.ids) &&
    typeof v.entities === 'object' &&
    v.entities !== null
  );
}

/**
 * Synchronous read used as `preloadedState`, so the first render already has
 * the user's notes: no loading gate, no spinner.
 */
export function loadNotesState(): NotesState {
  const raw = storage.getString(NOTES_KEY);
  if (raw === undefined) {
    return initialNotesState;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isNotesState(parsed)) {
      return parsed;
    }
  } catch {
    // fall through
  }
  // Keep the unreadable payload instead of letting the next write clobber it.
  storage.set(CORRUPT_BACKUP_KEY, raw);
  return initialNotesState;
}

interface PersistableStore {
  getState(): { notes: NotesState };
  subscribe(listener: () => void): () => void;
}

/**
 * Writes `state.notes` to MMKV whenever it changes, coalescing bursts
 * (e.g. typing) into one write per WRITE_DELAY_MS. Flushes immediately when
 * the app leaves the foreground so nothing is lost if the OS kills it.
 */
export function startNotesPersistence(store: PersistableStore): () => void {
  let lastSaved = store.getState().notes;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const notes = store.getState().notes;
    if (notes !== lastSaved) {
      storage.set(NOTES_KEY, JSON.stringify(notes));
      lastSaved = notes;
    }
  };

  const unsubscribe = store.subscribe(() => {
    if (!timer && store.getState().notes !== lastSaved) {
      timer = setTimeout(flush, WRITE_DELAY_MS);
    }
  });

  const appStateSub = AppState.addEventListener('change', status => {
    if (status !== 'active') {
      flush();
    }
  });

  return () => {
    flush();
    unsubscribe();
    appStateSub.remove();
  };
}
