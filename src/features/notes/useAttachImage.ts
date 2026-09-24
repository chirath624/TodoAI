import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch } from '../../app/hooks';
import { pickImage, promptImageSource } from '../../permissions/media';
import { persistPickedImage } from '../../storage/imageCache';
import { noteUpdated } from './notesSlice';

/**
 * Returns `attach(noteId)`: asks camera vs. library, handles permissions,
 * copies the result into app storage and sets it on the note (which marks
 * the note pending sync). Resolves true if an image was attached.
 */
export function useAttachImage() {
  const dispatch = useAppDispatch();

  return useCallback(
    async (noteId: string) => {
      const source = await promptImageSource();
      if (!source) {
        return false;
      }
      const asset = await pickImage(source);
      if (!asset) {
        return false;
      }
      try {
        const image = await persistPickedImage(asset);
        dispatch(noteUpdated(noteId, { image }));
        return true;
      } catch (error) {
        Alert.alert('Could not save image', String(error));
        return false;
      }
    },
    [dispatch],
  );
}
