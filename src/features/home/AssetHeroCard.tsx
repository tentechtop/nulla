import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { assetSummary } from '../../data/home';
import { colors, fontFamilies } from '../../theme/tokens';
import { HIDDEN_AMOUNT_TEXT } from '../../utils/sensitiveDisplay';
import { createEmptyWalletPortfolio, splitSolAmount, type WalletPortfolio } from '../../utils/walletBusiness';
import { homeAssetImages } from './designAssets';
import { useHomeResponsiveLayout } from './useHomeResponsiveLayout';

const SECTION_HEIGHT = 584;
const HERO_IMAGE_RATIO = 1758 / 895;
const HERO_CARD_LEFT = 20;
const HERO_CARD_WIDTH = 812;
const HERO_CARD_CONTENT_PADDING = 24;
const HERO_CARD_CONTENT_WIDTH = HERO_CARD_WIDTH - HERO_CARD_CONTENT_PADDING * 2;
const HERO_CARD_CURRENCY_WIDTH = 126;
const HERO_CARD_CURRENCY_LEFT = HERO_CARD_WIDTH - HERO_CARD_CONTENT_PADDING - HERO_CARD_CURRENCY_WIDTH;
const HERO_PRIVATE_COLUMN_LEFT = HERO_CARD_CONTENT_PADDING + 290;
const LAMPORTS_ICON_IMAGE_SIZE = 43;

type AssetHeroCardProps = {
  readonly isLoading?: boolean;
  readonly onContractPress?: () => void;
  readonly onTransactionHistoryPress?: () => void;
  readonly portfolio?: WalletPortfolio;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function AssetHeroCard({ isLoading = false, onContractPress, onTransactionHistoryPress, portfolio = createEmptyWalletPortfolio() }: AssetHeroCardProps) {
  const { scale } = useHomeResponsiveLayout();
  const styles = createStyles(scale);
  const [isAmountHidden, setIsAmountHidden] = useState(false);
  const totalAmountParts = splitSolAmount(portfolio.totalSolText);
  const visibleAvailableText = isLoading ? '加载中' : portfolio.availableSolText;
  const visiblePrivateText = isLoading ? '加载中' : portfolio.privateSolText;
  const visibleTokenText = isLoading ? '加载中' : portfolio.tokenLamportsText;

  const handleToggleAmountVisibility = () => {
    setIsAmountHidden((currentValue) => !currentValue);
  };

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Image resizeMode="contain" source={homeAssetImages.heroBackground} style={styles.backgroundImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.96)', 'rgba(0,0,0,0.44)', 'rgba(0,0,0,0.08)']}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={styles.dimmer}
        />
        <View style={styles.topRow}>
          <Text style={styles.assetLabel}>总资产 (SOL)</Text>
          <Pressable
            accessibilityLabel={isAmountHidden ? '显示金额' : '隐藏金额'}
            accessibilityRole="button"
            accessibilityState={{ selected: isAmountHidden }}
            hitSlop={scaled(12, scale)}
            onPress={handleToggleAmountVisibility}
            style={styles.eyeButton}
          >
            <MaterialCommunityIcons
              color="rgba(255,255,255,0.7)"
              name={isAmountHidden ? 'eye-off-outline' : 'eye-outline'}
              size={scaled(30, scale)}
            />
          </Pressable>
        </View>
        <Pressable accessibilityLabel="选择 SOL 币种" accessibilityRole="button" style={styles.currencyButton}>
          <Text style={styles.currencyText}>{assetSummary.symbol}</Text>
          <MaterialCommunityIcons color="#FFFFFF" name="chevron-down" size={scaled(28, scale)} />
        </Pressable>
        <View style={styles.totalRow}>
          {isAmountHidden ? (
            <Text style={styles.totalIntegerText}>{HIDDEN_AMOUNT_TEXT}</Text>
          ) : (
            <>
              <Text style={styles.totalIntegerText}>{isLoading ? '...' : totalAmountParts.integerPart}</Text>
              <Text style={styles.totalDecimalText}>{isLoading ? '' : totalAmountParts.decimalPart}</Text>
            </>
          )}
        </View>
        <Text style={styles.totalSymbol}>{assetSummary.symbol}</Text>
        <View style={styles.availableColumn}>
          <Text style={styles.smallLabel}>可用资产</Text>
          <Text style={styles.smallAmount}>{isAmountHidden ? HIDDEN_AMOUNT_TEXT : visibleAvailableText}</Text>
          <Text style={styles.smallSymbol}>{assetSummary.symbol}</Text>
        </View>
        <View style={styles.privateColumn}>
          <Text style={styles.smallLabel}>隐私可用</Text>
          <Text style={styles.smallAmount}>{isAmountHidden ? HIDDEN_AMOUNT_TEXT : visiblePrivateText}</Text>
          <Text style={styles.smallSymbol}>{assetSummary.symbol}</Text>
        </View>
        <TokenRow
          isAmountHidden={isAmountHidden}
          onPress={onTransactionHistoryPress}
          scale={scale}
          styles={styles}
          tokenAmountText={visibleTokenText}
        />
        <View style={styles.secondDivider} />
        <ContractRow onPress={onContractPress} scale={scale} styles={styles} />
      </View>
    </View>
  );
}

function TokenRow({
  isAmountHidden,
  onPress,
  scale,
  styles,
  tokenAmountText
}: {
  readonly isAmountHidden: boolean;
  readonly onPress?: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly tokenAmountText: string;
}) {
  return (
    <Pressable accessibilityLabel="查看 LAMPORTS 资产" accessibilityRole="button" onPress={onPress} style={styles.tokenRow}>
      <LamportsAssetIcon scale={scale} styles={styles} />
      <View style={styles.tokenNameBlock}>
        <Text style={styles.tokenTitle}>{assetSummary.tokenName}</Text>
        <Text style={styles.tokenSubtitle}>{assetSummary.tokenDescription}</Text>
      </View>
      <View style={styles.tokenAmountBlock}>
        <Text style={styles.tokenAmount}>{isAmountHidden ? HIDDEN_AMOUNT_TEXT : tokenAmountText}</Text>
        <Text style={styles.tokenUnit}>{assetSummary.tokenName}</Text>
      </View>
      <MaterialCommunityIcons color="#FFFFFF" name="chevron-right" size={scaled(36, scale)} />
    </Pressable>
  );
}

function LamportsAssetIcon({
  scale,
  styles
}: {
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.tokenIconSlot}>
      <Image resizeMode="contain" source={homeAssetImages.lamportsTokenIcon} style={styles.tokenIconImage} />
    </View>
  );
}

function ContractRow({ onPress, scale, styles }: { readonly onPress?: () => void; readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <Pressable accessibilityLabel="查看链上合约" accessibilityRole="button" onPress={onPress} style={styles.contractRow}>
      <MaterialCommunityIcons color={colors.primary} name="link-variant" size={scaled(35, scale)} />
      <Text style={styles.contractTitle}>链上合约</Text>
      <Text style={styles.contractValue}>12 个</Text>
      <MaterialCommunityIcons color="#A45BFF" name="arrow-up" size={scaled(30, scale)} />
      <MaterialCommunityIcons color="#FFFFFF" name="chevron-right" size={scaled(36, scale)} />
    </Pressable>
  );
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    assetLabel: {
      color: 'rgba(255,255,255,0.72)',
      fontSize: scaled(23, scale),
      fontWeight: '400',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    availableColumn: {
      left: scaled(HERO_CARD_CONTENT_PADDING, scale),
      position: 'absolute',
      top: scaled(251, scale),
      width: scaled(250, scale)
    },
    backgroundImage: {
      height: scaled(584, scale),
      left: scaled(-175, scale),
      position: 'absolute',
      top: 0,
      width: scaled(584 * HERO_IMAGE_RATIO, scale)
    },
    card: {
      borderRadius: scaled(26, scale),
      height: scaled(584, scale),
      left: scaled(HERO_CARD_LEFT, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      width: scaled(HERO_CARD_WIDTH, scale)
    },
    contractRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(86, scale),
      left: scaled(HERO_CARD_CONTENT_PADDING, scale),
      position: 'absolute',
      top: scaled(498, scale),
      width: scaled(HERO_CARD_CONTENT_WIDTH, scale)
    },
    contractTitle: {
      color: '#FFFFFF',
      flex: 1,
      fontSize: scaled(26, scale),
      fontWeight: '600',
      lineHeight: scaled(32, scale),
      marginLeft: scaled(18, scale),
      ...textBase
    },
    contractValue: {
      color: '#A45BFF',
      fontSize: scaled(25, scale),
      fontWeight: '600',
      lineHeight: scaled(31, scale),
      marginRight: scaled(2, scale),
      ...textBase
    },
    currencyButton: {
      alignItems: 'center',
      borderColor: 'rgba(255,255,255,0.38)',
      borderRadius: scaled(29, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(58, scale),
      justifyContent: 'center',
      left: scaled(HERO_CARD_CURRENCY_LEFT, scale),
      position: 'absolute',
      top: scaled(31, scale),
      width: scaled(HERO_CARD_CURRENCY_WIDTH, scale)
    },
    currencyText: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      marginRight: scaled(5, scale),
      ...textBase
    },
    dimmer: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    eyeButton: {
      alignItems: 'center',
      height: scaled(34, scale),
      justifyContent: 'center',
      width: scaled(34, scale)
    },
    privateColumn: {
      left: scaled(HERO_PRIVATE_COLUMN_LEFT, scale),
      position: 'absolute',
      top: scaled(251, scale),
      width: scaled(250, scale)
    },
    section: {
      backgroundColor: colors.background,
      height: scaled(SECTION_HEIGHT, scale),
      position: 'relative',
      width: '100%'
    },
    secondDivider: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      height: 1,
      left: scaled(HERO_CARD_CONTENT_PADDING, scale),
      position: 'absolute',
      top: scaled(493, scale),
      width: scaled(HERO_CARD_CONTENT_WIDTH, scale)
    },
    smallAmount: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(30, scale),
      marginTop: scaled(14, scale),
      ...textBase
    },
    smallLabel: {
      color: 'rgba(255,255,255,0.68)',
      fontSize: scaled(22, scale),
      fontWeight: '400',
      lineHeight: scaled(27, scale),
      ...textBase
    },
    smallSymbol: {
      color: 'rgba(255,255,255,0.68)',
      fontSize: scaled(22, scale),
      fontWeight: '400',
      lineHeight: scaled(27, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    tokenAmount: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(30, scale),
      textAlign: 'right',
      ...textBase
    },
    tokenAmountBlock: {
      alignItems: 'flex-end',
      flex: 1
    },
    tokenIconSlot: {
      alignItems: 'center',
      borderColor: 'rgba(255,255,255,0.42)',
      borderRadius: scaled(16, scale),
      borderWidth: 1,
      height: scaled(72, scale),
      justifyContent: 'center',
      width: scaled(72, scale)
    },
    tokenIconImage: {
      height: scaled(LAMPORTS_ICON_IMAGE_SIZE, scale),
      width: scaled(LAMPORTS_ICON_IMAGE_SIZE, scale)
    },
    tokenNameBlock: {
      marginLeft: scaled(24, scale),
      width: scaled(250, scale)
    },
    tokenRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(118, scale),
      left: scaled(HERO_CARD_CONTENT_PADDING, scale),
      position: 'absolute',
      top: scaled(375, scale),
      width: scaled(HERO_CARD_CONTENT_WIDTH, scale)
    },
    tokenSubtitle: {
      color: 'rgba(255,255,255,0.68)',
      fontSize: scaled(21, scale),
      fontWeight: '400',
      lineHeight: scaled(27, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    tokenTitle: {
      color: '#FFFFFF',
      fontSize: scaled(27, scale),
      fontWeight: '500',
      lineHeight: scaled(33, scale),
      ...textBase
    },
    tokenUnit: {
      color: 'rgba(255,255,255,0.68)',
      fontSize: scaled(21, scale),
      fontWeight: '400',
      lineHeight: scaled(27, scale),
      marginTop: scaled(5, scale),
      textAlign: 'right',
      ...textBase
    },
    topRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(14, scale),
      left: scaled(HERO_CARD_CONTENT_PADDING, scale),
      position: 'absolute',
      top: scaled(52, scale)
    },
    totalSymbol: {
      color: 'rgba(255,255,255,0.68)',
      fontSize: scaled(26, scale),
      fontWeight: '400',
      left: scaled(HERO_CARD_CONTENT_PADDING, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(174, scale),
      ...textBase
    },
    totalDecimalText: {
      color: '#FFFFFF',
      fontSize: scaled(31, scale),
      fontWeight: '600',
      letterSpacing: 0,
      lineHeight: scaled(38, scale),
      marginTop: scaled(19, scale),
      ...textBase
    },
    totalIntegerText: {
      color: '#FFFFFF',
      fontSize: scaled(50, scale),
      fontWeight: '700',
      letterSpacing: 0,
      lineHeight: scaled(58, scale),
      ...textBase
    },
    totalRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      left: scaled(HERO_CARD_CONTENT_PADDING, scale),
      position: 'absolute',
      top: scaled(101, scale),
      width: scaled(510, scale)
    }
  });
}
