import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Feed: undefined;
  NoteEditor: { id: string; attachImage?: boolean };
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
