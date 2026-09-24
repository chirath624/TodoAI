import { nanoid } from '@reduxjs/toolkit';
import * as FS from '@dr.pogodin/react-native-fs';
import type { Asset } from 'react-native-image-picker';
import type { NoteImage } from '../features/notes/types';

const IMAGES_DIR = `${FS.DocumentDirectoryPath}/note-images`;

export const imagePath = (image: NoteImage) =>
  `${IMAGES_DIR}/${image.fileName}`;

export const imageUri = (image: NoteImage) => `file://${imagePath(image)}`;

let dirReady: Promise<void> | null = null;

function ensureImagesDir() {
  dirReady ??= FS.mkdir(IMAGES_DIR).catch(error => {
    dirReady = null;
    throw error;
  });
  return dirReady;
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
};

const toPath = (uri: string) => decodeURI(uri.replace(/^file:\/\//, ''));

/**
 * Moves a picker result out of the OS temp/cache dir (which may be purged at
 * any time) into app documents, so the note keeps its image offline and
 * until it has been uploaded.
 */
export async function persistPickedImage(asset: Asset): Promise<NoteImage> {
  if (!asset.uri || !asset.width || !asset.height) {
    throw new Error('Picker returned an incomplete asset');
  }
  const mimeType = asset.type ?? 'image/jpeg';
  const extension =
    EXTENSIONS[mimeType] ?? asset.fileName?.split('.').pop() ?? 'jpg';
  const image: NoteImage = {
    fileName: `${nanoid()}.${extension}`,
    mimeType,
    width: asset.width,
    height: asset.height,
  };

  await ensureImagesDir();
  const source = toPath(asset.uri);
  await FS.copyFile(source, imagePath(image));
  FS.unlink(source).catch(() => {});

  return image;
}

export async function deleteImageFile(image: NoteImage) {
  await FS.unlink(imagePath(image)).catch(() => {});
}
