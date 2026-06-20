import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MarketRow, marketRows } from '../../data/home';
import { colors, fontFamilies } from '../../theme/tokens';
import { ListMenuSvgIcon, MarketTokenIcon } from './HomeSvgIcons';
import { useHomeResponsiveLayout } from './useHomeResponsiveLayout';

const SECTION_HEIGHT = 650;
const MARKET_ROW_TOP = 166;
const MARKET_ROW_GAP = 79;
const MARKET_TAB_MENU_TOP = 10;
const MARKET_TAB_ITEMS = [
  { label: '自选', left: 0, width: 76 },
  { label: '主流', left: 100, width: 76 },
  { label: '涨幅榜', left: 195, width: 106 },
  { label: '跌幅榜', left: 318, width: 106 },
  { label: '24h 成交额', left: 450, width: 164 }
] as const;

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function MarketList() {
  const { scale } = useHomeResponsiveLayout();
  const styles = createStyles(scale);

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.tabRow}>
          {MARKET_TAB_ITEMS.map((tab, index) => (
            <Pressable
              accessibilityRole="tab"
              key={tab.label}
              style={[styles.tabButton, { left: scaled(tab.left, scale), width: scaled(tab.width, scale) }]}
            >
              <View style={styles.tabLabelSlot}>
                <Text style={index === 0 ? styles.activeTabText : styles.tabText}>{tab.label}</Text>
              </View>
              {index === 0 ? <View style={styles.activeUnderline} /> : null}
            </Pressable>
          ))}
          <View style={styles.menuIcon}>
            <ListMenuSvgIcon size={scaled(40, scale)} />
          </View>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.nameHeader}>名称</Text>
          <Text style={styles.priceHeader}>最新价 (USD)</Text>
          <Text style={styles.changeHeader}>24h 涨跌</Text>
          <Text style={styles.volumeHeader}>24h 成交额</Text>
        </View>
        {marketRows.map((row, index) => (
          <MarketItem index={index} key={row.symbol} row={row} scale={scale} styles={styles} />
        ))}
        <Pressable accessibilityRole="button" style={styles.moreButton}>
          <Text style={styles.moreText}>查看更多</Text>
          <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={scaled(24, scale)} />
        </Pressable>
      </View>
    </View>
  );
}

function MarketItem({
  index,
  row,
  scale,
  styles
}: {
  readonly index: number;
  readonly row: MarketRow;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const changeStyle = row.changePercent >= 0 ? styles.positiveChange : styles.negativeChange;

  return (
    <Pressable accessibilityRole="button" style={[styles.marketRow, { top: scaled(MARKET_ROW_TOP + index * MARKET_ROW_GAP, scale) }]}>
      <View style={styles.tokenIcon}>
        <MarketTokenIcon size={scaled(54, scale)} symbol={row.symbol} />
      </View>
      <View style={styles.assetTextBlock}>
        <Text style={styles.symbolText}>{row.symbol}</Text>
        <Text style={styles.nameText}>{row.name}</Text>
      </View>
      <View style={styles.priceBlock}>
        <Text style={styles.priceText}>{row.price}</Text>
        <Text style={styles.fiatText}>{row.fiat}</Text>
      </View>
      <Text style={changeStyle}>{formatChange(row.changePercent)}</Text>
      <View style={styles.volumeBlock}>
        <Text style={styles.volumeText}>{row.turnover}</Text>
      </View>
      <MaterialCommunityIcons color={colors.textSoft} name="chevron-right" size={scaled(25, scale)} style={styles.rowChevron} />
    </Pressable>
  );
}

function formatChange(changePercent: number) {
  const prefix = changePercent > 0 ? '+' : '';
  return `${prefix}${changePercent.toFixed(2)}%`;
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    activeTabText: {
      color: colors.text,
      fontSize: scaled(29, scale),
      fontWeight: '700',
      lineHeight: scaled(34, scale),
      ...textBase
    },
    activeUnderline: {
      backgroundColor: colors.primary,
      borderRadius: scaled(2, scale),
      height: scaled(4, scale),
      marginTop: scaled(8, scale),
      width: scaled(56, scale)
    },
    assetTextBlock: {
      left: scaled(91, scale),
      position: 'absolute',
      top: 0,
      width: scaled(180, scale)
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(23, scale),
      borderWidth: 1,
      height: scaled(620, scale),
      left: scaled(18, scale),
      position: 'absolute',
      top: scaled(17, scale),
      width: scaled(816, scale)
    },
    changeHeader: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '400',
      left: scaled(512, scale),
      lineHeight: scaled(22, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    fiatText: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      fontWeight: '400',
      lineHeight: scaled(23, scale),
      marginTop: scaled(4, scale),
      textAlign: 'right',
      ...textBase
    },
    headerRow: {
      height: scaled(26, scale),
      left: scaled(28, scale),
      position: 'absolute',
      top: scaled(113, scale),
      width: scaled(760, scale)
    },
    marketRow: {
      height: scaled(70, scale),
      left: scaled(26, scale),
      position: 'absolute',
      width: scaled(764, scale)
    },
    menuIcon: {
      alignItems: 'center',
      height: scaled(34, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: 0,
      top: scaled(MARKET_TAB_MENU_TOP, scale),
      width: scaled(54, scale)
    },
    moreButton: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(40, scale),
      justifyContent: 'center',
      left: scaled(320, scale),
      position: 'absolute',
      top: scaled(560, scale),
      width: scaled(178, scale)
    },
    moreText: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      fontWeight: '400',
      lineHeight: scaled(25, scale),
      marginRight: scaled(8, scale),
      ...textBase
    },
    nameHeader: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '400',
      left: 0,
      lineHeight: scaled(22, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    nameText: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      fontWeight: '400',
      lineHeight: scaled(24, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    negativeChange: {
      color: colors.negative,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(493, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      top: scaled(13, scale),
      width: scaled(118, scale),
      ...textBase
    },
    positiveChange: {
      color: colors.primary,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(493, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      top: scaled(13, scale),
      width: scaled(118, scale),
      ...textBase
    },
    priceBlock: {
      alignItems: 'flex-end',
      left: scaled(305, scale),
      position: 'absolute',
      top: 0,
      width: scaled(145, scale)
    },
    priceHeader: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '400',
      left: scaled(310, scale),
      lineHeight: scaled(22, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    priceText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(29, scale),
      textAlign: 'right',
      ...textBase
    },
    rowChevron: {
      position: 'absolute',
      right: 0,
      top: scaled(20, scale)
    },
    section: {
      backgroundColor: colors.background,
      height: scaled(SECTION_HEIGHT, scale),
      position: 'relative',
      width: '100%'
    },
    symbolText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    tabButton: {
      alignItems: 'center',
      height: scaled(58, scale),
      justifyContent: 'flex-start',
      position: 'absolute',
      top: 0
    },
    tabLabelSlot: {
      alignItems: 'center',
      height: scaled(34, scale),
      justifyContent: 'center',
      width: '100%'
    },
    tabRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(60, scale),
      left: scaled(29, scale),
      position: 'absolute',
      top: scaled(32, scale),
      width: scaled(760, scale)
    },
    tabText: {
      color: colors.textMuted,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    tokenIcon: {
      height: scaled(54, scale),
      left: 0,
      position: 'absolute',
      top: scaled(4, scale),
      width: scaled(54, scale)
    },
    volumeBlock: {
      alignItems: 'flex-end',
      left: scaled(625, scale),
      position: 'absolute',
      top: scaled(12, scale),
      width: scaled(100, scale)
    },
    volumeHeader: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '400',
      left: scaled(632, scale),
      lineHeight: scaled(22, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    volumeText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(29, scale),
      textAlign: 'right',
      ...textBase
    }
  });
}
