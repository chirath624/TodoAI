import { configureStore } from '@reduxjs/toolkit';
import notesReducer from '../features/notes/notesSlice';
import { loadNotesState, startNotesPersistence } from '../storage/persist';

export const store = configureStore({
  reducer: {
    notes: notesReducer,
  },
  // Hydrated synchronously at module load, before the first render.
  preloadedState: {
    notes: loadNotesState(),
  },
});

startNotesPersistence(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
