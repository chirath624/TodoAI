export type SyncStatus = 'synced' | 'pending' | 'failed';

export const NOTE_COLORS = [
  'default',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
  'gray',
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number];

export interface NoteImage {
  /**
   * File name inside the app's note-images dir. Not an absolute path: the iOS
   * container path changes across app updates. Resolve with `imageUri()`.
   */
  fileName: string;
  mimeType: string;
  /** S3 object key, set once the upload has been confirmed. */
  remoteKey?: string;
  /** Intrinsic size, so cards can reserve height before the image loads. */
  width: number;
  height: number;
}

export interface Note {
  /** Client-generated, so notes can be created offline. */
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
  image?: NoteImage;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
  /** `updatedAt` of the last version the server acknowledged. */
  syncedAt?: number;
  /** Tombstone: hidden from the feed, removed once the server confirms. */
  deleted?: boolean;
}

export type EditableNoteFields = Pick<
  Note,
  'title' | 'body' | 'color' | 'pinned' | 'image'
>;
