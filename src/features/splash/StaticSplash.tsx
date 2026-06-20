import { StyleSheet, useWindowDimensions, View } from 'react-native';

type StaticSplashProps = {
  readonly onReady: () => void;
};

const logoModuleRatio = 0.215;
const logoGapRatio = 0.075;
const logoModulePlacements = [
  [0, 0],
  [2, 0],
  [1, 1],
  [0, 2],
  [2, 2]
] as const;

type CodeLogoGlyphProps = {
  readonly color: string;
  readonly size: number;
};

function CodeLogoGlyph({ color, size }: CodeLogoGlyphProps) {
  const moduleSize = Math.round(size * logoModuleRatio);
  const moduleGap = Math.round(size * logoGapRatio);
  const glyphContentSize = (moduleSize * 3) + (moduleGap * 2);
  const glyphOffset = Math.round((size - glyphContentSize) / 2);

  return (
    <View style={{ height: size, width: size }}>
      {logoModulePlacements.map(([columnIndex, rowIndex]) => (
        <View
          key={`${columnIndex}-${rowIndex}`}
          style={[
            styles.logoModule,
            {
              backgroundColor: color,
              height: moduleSize,
              left: glyphOffset + (columnIndex * (moduleSize + moduleGap)),
              top: glyphOffset + (rowIndex * (moduleSize + moduleGap)),
              width: moduleSize
            }
          ]}
        />
      ))}
    </View>
  );
}

export function StaticSplash({ onReady }: StaticSplashProps) {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.max(Math.min(width, height), 240);
  const logoSize = Math.round(Math.min(Math.max(shortSide * 0.24, 72), 104));

  return (
    <View style={styles.root} onLayout={onReady}>
      <CodeLogoGlyph color="#050505" size={logoSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center'
  },
  logoModule: {
    position: 'absolute'
  }
});
