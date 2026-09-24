import { memo } from 'react';
import { StyleSheet } from 'react-native';
import FastImage, {
  type ImageStyle,
  type Priority,
} from '@d11/react-native-fast-image';

// FastImage's ImageStyle extends RN's FlexStyle, which no longer resolves
// against RN 0.87's types, so no layout key type-checks. The style is passed
// through to a native view unchanged; this cast is the only workaround.
const fill = StyleSheet.absoluteFill as unknown as ImageStyle;

interface Props {
  uri: string;
  priority?: Priority;
}

/** FastImage that fills its (sized) parent with `cover` cropping. */
function CachedImage({ uri, priority = 'normal' }: Props) {
  return (
    <FastImage source={{ uri, priority }} style={fill} resizeMode="cover" />
  );
}

export default memo(CachedImage);
