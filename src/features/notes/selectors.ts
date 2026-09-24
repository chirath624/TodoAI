import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { notesAdapter } from './notesSlice';
import type { Note } from './types';

export const { selectAll: selectAllNotes, selectById: selectNoteById } =
  notesAdapter.getSelectors((state: RootState) => state.notes);

export const PINNED_HEADER = 'header:pinned';
export const OTHERS_HEADER = 'header:others';

/** A note id, or one of the two full-width section header keys. */
export type FeedItem = string;

export const isHeader = (item: FeedItem) =>
  item === PINNED_HEADER || item === OTHERS_HEADER;

const byUpdatedDesc = (a: Note, b: Note) => b.updatedAt - a.updatedAt;

const sameItems = (a: FeedItem[], b: FeedItem[]) =>
  a.length === b.length && a.every((item, i) => item === b[i]);

/**
 * Ordered feed for the masonry list: pinned notes, then the rest, with
 * section headers only when something is pinned. Items are plain strings so
 * the result is reused (same array reference) when an edit doesn't change
 * the order, and the list doesn't re-render.
 */
export const selectFeedItems = createSelector(
  [selectAllNotes],
  (notes): FeedItem[] => {
    const visible = notes.filter(n => !n.deleted);
    const pinned = visible.filter(n => n.pinned).sort(byUpdatedDesc);
    const others = visible.filter(n => !n.pinned).sort(byUpdatedDesc);
    const toId = (n: Note) => n.id;

    if (pinned.length === 0) {
      return others.map(toId);
    }
    return [
      PINNED_HEADER,
      ...pinned.map(toId),
      ...(others.length ? [OTHERS_HEADER, ...others.map(toId)] : []),
    ];
  },
  { memoizeOptions: { resultEqualityCheck: sameItems } },
);
