import { createMMKV } from 'react-native-mmkv';

/** Single app-wide instance. All reads/writes are synchronous (JSI). */
export const storage = createMMKV({ id: 'todoai' });
