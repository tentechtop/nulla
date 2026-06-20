import { ReactNode } from 'react';
import { ImageBackground, ImageSourcePropType, StyleSheet, useWindowDimensions } from 'react-native';

type DesignSliceProps = {
  readonly children?: ReactNode;
  readonly designHeight: number;
  readonly designWidth: number;
  readonly source: ImageSourcePropType;
  readonly style?: object;
};

export function DesignSlice({
  children,
  designHeight,
  designWidth,
  source,
  style
}: DesignSliceProps) {
  const { width } = useWindowDimensions();
  const renderHeight = Math.round((width * designHeight) / designWidth);

  return (
    <ImageBackground
      resizeMode="stretch"
      source={source}
      style={[styles.slice, { height: renderHeight, width }, style]}
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  slice: {
    overflow: 'hidden'
  }
});
