import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import * as FS from '@dr.pogodin/react-native-fs';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pickImage } from '../src/permissions/media';
import { imageUri, persistPickedImage } from '../src/storage/imageCache';

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
  mkdir: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
}));

const asset = {
  uri: 'file:///tmp/picked%20photo.jpg',
  width: 800,
  height: 600,
  type: 'image/jpeg',
};

const camera = launchCamera as jest.Mock;
const library = launchImageLibrary as jest.Mock;

let alertSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

function onAndroid() {
  jest.replaceProperty(Platform, 'OS', 'android');
}

test('library pick needs no permission request', async () => {
  const request = jest.spyOn(PermissionsAndroid, 'request');
  library.mockResolvedValue({ assets: [asset] });
  await expect(pickImage('library')).resolves.toBe(asset);
  expect(request).not.toHaveBeenCalled();
});

test('cancel resolves null without alerts', async () => {
  library.mockResolvedValue({ didCancel: true });
  await expect(pickImage('library')).resolves.toBeNull();
  expect(alertSpy).not.toHaveBeenCalled();
});

test('android camera: requests CAMERA on permission error, then retries', async () => {
  onAndroid();
  jest
    .spyOn(PermissionsAndroid, 'request')
    .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
  camera
    .mockResolvedValueOnce({ errorCode: 'permission' })
    .mockResolvedValueOnce({ assets: [asset] });

  await expect(pickImage('camera')).resolves.toBe(asset);
  expect(camera).toHaveBeenCalledTimes(2);
});

test('android camera: "never ask again" offers Settings', async () => {
  onAndroid();
  jest
    .spyOn(PermissionsAndroid, 'request')
    .mockResolvedValue(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
  camera.mockResolvedValue({ errorCode: 'permission' });

  await expect(pickImage('camera')).resolves.toBeNull();
  expect(camera).toHaveBeenCalledTimes(1);

  const buttons = alertSpy.mock.calls[0][2];
  const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  buttons.find((b: { text: string }) => b.text === 'Open Settings').onPress();
  expect(openSettings).toHaveBeenCalled();
});

test('ios camera denial goes straight to the Settings alert', async () => {
  camera.mockResolvedValue({ errorCode: 'permission' });
  await expect(pickImage('camera')).resolves.toBeNull();
  expect(alertSpy.mock.calls[0][0]).toBe('Camera access is off');
});

test('picked image is copied into documents under a relative name', async () => {
  const image = await persistPickedImage(asset);
  expect(image).toMatchObject({
    mimeType: 'image/jpeg',
    width: 800,
    height: 600,
  });
  expect(image.fileName).toMatch(/^[\w-]+\.jpg$/);
  expect(FS.copyFile).toHaveBeenCalledWith(
    '/tmp/picked photo.jpg',
    `/docs/note-images/${image.fileName}`,
  );
  expect(imageUri(image)).toBe(`file:///docs/note-images/${image.fileName}`);
});
