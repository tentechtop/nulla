import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { quickActions } from '../../data/home';
import { colors, fontFamilies } from '../../theme/tokens';
import { homeAssetImages } from './designAssets';
import { useHomeResponsiveLayout } from './useHomeResponsiveLayout';

const SECTION_HEIGHT = 196;

type QuickActionKey = (typeof quickActions)[number]['key'];

const quickActionImages: Partial<Record<QuickActionKey, ImageSourcePropType>> = {
  receive: homeAssetImages.quickReceive,
  send: homeAssetImages.quickSend,
  stake: homeAssetImages.quickStake
};

type QuickActionBarProps = {
  readonly onHistoryPress?: () => void;
  readonly onReceivePress?: () => void;
  readonly onSendPress?: () => void;
  readonly onStakePress?: () => void;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function QuickActionBar({ onHistoryPress, onReceivePress, onSendPress, onStakePress }: QuickActionBarProps) {
  const { scale } = useHomeResponsiveLayout();
  const styles = createStyles(scale);

  const renderActionIcon = (actionKey: QuickActionKey) => {
    const imageSource = quickActionImages[actionKey];

    if (imageSource) {
      return <Image resizeMode="contain" source={imageSource} style={styles.actionIcon} />;
    }

    if (actionKey !== 'history') {
      return <View style={styles.vectorIconFrame} />;
    }

    return (
      <View style={styles.vectorIconFrame}>
        <MaterialCommunityIcons color={colors.text} name="history" size={scaled(54, scale)} />
      </View>
    );
  };

  const handleActionPress = (actionKey: QuickActionKey) => {
    if (actionKey === 'receive') {
      onReceivePress?.();
    }

    if (actionKey === 'send') {
      onSendPress?.();
    }

    if (actionKey === 'history') {
      onHistoryPress?.();
    }

    if (actionKey === 'stake') {
      onStakePress?.();
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.dividerOne} />
        <View style={styles.dividerTwo} />
        <View style={styles.dividerThree} />
        {quickActions.map((action, index) => (
          <Pressable
            accessibilityRole="button"
            key={action.key}
            onPress={() => handleActionPress(action.key)}
            style={[styles.actionButton, { left: scaled(index * 201, scale) }]}
          >
            {renderActionIcon(action.key)}
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      height: scaled(120, scale),
      justifyContent: 'flex-start',
      position: 'absolute',
      top: scaled(28, scale),
      width: scaled(201, scale)
    },
    actionIcon: {
      height: scaled(64, scale),
      width: scaled(64, scale)
    },
    actionLabel: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '600',
      lineHeight: scaled(27, scale),
      marginTop: scaled(13, scale),
      ...textBase
    },
    vectorIconFrame: {
      alignItems: 'center',
      height: scaled(64, scale),
      justifyContent: 'center',
      width: scaled(64, scale)
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(23, scale),
      borderWidth: 1,
      height: scaled(161, scale),
      left: scaled(18, scale),
      position: 'absolute',
      top: scaled(17, scale),
      width: scaled(816, scale)
    },
    dividerOne: {
      backgroundColor: colors.border,
      height: scaled(102, scale),
      left: scaled(204, scale),
      position: 'absolute',
      top: scaled(31, scale),
      width: 1
    },
    dividerThree: {
      backgroundColor: colors.border,
      height: scaled(102, scale),
      left: scaled(606, scale),
      position: 'absolute',
      top: scaled(31, scale),
      width: 1
    },
    dividerTwo: {
      backgroundColor: colors.border,
      height: scaled(102, scale),
      left: scaled(405, scale),
      position: 'absolute',
      top: scaled(31, scale),
      width: 1
    },
    section: {
      backgroundColor: colors.background,
      height: scaled(SECTION_HEIGHT, scale),
      position: 'relative',
      width: '100%'
    }
  });
}
