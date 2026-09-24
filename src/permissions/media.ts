import {
  ActionSheetIOS,
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type CameraOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';

/*
 * Permission model
 * ----------------
 * Photo library: no runtime permission on either platform. iOS uses
 * PHPickerViewController (runs out-of-process, the app only receives what
 * the user picks) and Android uses the system Photo Picker (backported to
 * API < 33 via androidx.activity). Requesting READ_MEDIA_IMAGES / full
 * library access would be broader than we need, and Google Play restricts it.
 *
 * Camera: iOS shows the system prompt the first time `launchCamera` runs
 * (NSCameraUsageDescription). Android captures via the system camera app
 * and needs no permission, unless some dependency merges CAMERA into the
 * manifest; then Android requires a runtime grant, which we request lazily
 * on the first `permission` error.
 */

export type ImageSource = 'camera' | 'library';

const PICKER_OPTIONS = {
  mediaType: 'photo',
  // Keeps uploads and disk usage reasonable; plenty for a note card.
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.8,
  // HEIC -> JPEG so the image renders everywhere, including web clients.
  assetRepresentationMode: 'compatible',
} as const;

const CAMERA_OPTIONS: CameraOptions = {
  ...PICKER_OPTIONS,
  saveToPhotos: false,
  cameraType: 'back',
};

export function openSettingsAlert(what: string) {
  Alert.alert(
    `${what} access is off`,
    `Allow ${what.toLowerCase()} access in Settings to attach photos to notes.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
}

async function requestAndroidCamera(): Promise<
  'granted' | 'denied' | 'blocked'
> {
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera access',
      message: 'Take photos to attach to your notes.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }
  return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ? 'blocked'
    : 'denied';
}

function firstAsset(response: ImagePickerResponse): Asset | null {
  if (response.didCancel || response.errorCode) {
    return null;
  }
  return response.assets?.[0] ?? null;
}

async function captureFromCamera(): Promise<Asset | null> {
  let response = await launchCamera(CAMERA_OPTIONS);

  if (response.errorCode === 'permission' && Platform.OS === 'android') {
    const outcome = await requestAndroidCamera();
    if (outcome === 'granted') {
      response = await launchCamera(CAMERA_OPTIONS);
    } else if (outcome === 'blocked') {
      openSettingsAlert('Camera');
      return null;
    } else {
      return null;
    }
  }

  switch (response.errorCode) {
    case 'permission':
      // iOS never re-prompts after a denial; Settings is the only way back.
      openSettingsAlert('Camera');
      return null;
    case 'camera_unavailable':
      Alert.alert('No camera', 'This device has no available camera.');
      return null;
    case 'others':
      Alert.alert('Camera error', response.errorMessage ?? 'Unknown error');
      return null;
  }
  return firstAsset(response);
}

async function pickFromLibrary(): Promise<Asset | null> {
  const response = await launchImageLibrary({
    ...PICKER_OPTIONS,
    selectionLimit: 1,
  });
  if (response.errorCode === 'permission') {
    // Defensive: the system pickers don't normally report this.
    openSettingsAlert('Photos');
    return null;
  }
  if (response.errorCode === 'others') {
    Alert.alert('Photo error', response.errorMessage ?? 'Unknown error');
    return null;
  }
  return firstAsset(response);
}

/** Opens the camera or photo picker; null if cancelled, denied or failed. */
export function pickImage(source: ImageSource): Promise<Asset | null> {
  return source === 'camera' ? captureFromCamera() : pickFromLibrary();
}

/** Native "Take photo / Choose from library" chooser. */
export function promptImageSource(): Promise<ImageSource | null> {
  return new Promise(resolve => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Take Photo', 'Choose from Library', 'Cancel'],
          cancelButtonIndex: 2,
        },
        index =>
          resolve(index === 0 ? 'camera' : index === 1 ? 'library' : null),
      );
    } else {
      Alert.alert(
        'Add image',
        undefined,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          { text: 'Camera', onPress: () => resolve('camera') },
          { text: 'Gallery', onPress: () => resolve('library') },
        ],
        { cancelable: true, onDismiss: () => resolve(null) },
      );
    }
  });
}
