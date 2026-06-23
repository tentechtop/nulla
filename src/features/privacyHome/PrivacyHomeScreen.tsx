import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { getSensitiveAmountParts } from '../../utils/sensitiveDisplay';
import { privacyHomeImages } from './designAssets';
import {
  ActionAuditIcon,
  ActionPrivateInIcon,
  ActionPrivateTransferIcon,
  ActionTransparentOutIcon,
  CardAuditShieldIcon,
  CardUnlockIcon,
  ChevronRightIcon,
  EmptyPrivacyActivityIcon,
  PrivacyEyeIcon,
  PrivacyRecordClockIcon,
  RoutePreviewIcon,
  RoutePrivateNodeIcon,
  RouteTransparentNodeIcon,
  StatusChartIcon,
  StatusCubeIcon,
  StatusKeyIcon,
  StatusLayersIcon,
  StatusNullifierIcon,
  TitleShieldIcon
} from './PrivacyHomeSvgIcons';
import { usePrivacyHomeResponsiveLayout } from './usePrivacyHomeResponsiveLayout';

const TOP_NAVIGATION_DESIGN_HEIGHT = 117;

const actionItems = [
  { key: 'privateIn', label: '转入隐私' },
  { key: 'privateTransfer', label: '隐私转账' },
  { key: 'transparentOut', label: '转出透明' },
  { key: 'audit', label: '授权审计' }
] as const;

const statusRows = [
  { key: 'commitment', icon: 'cube', label: 'commitment 数量', value: '0', hasChevron: false },
  { key: 'nullifier', icon: 'nullifier', label: 'nullifier 已同步', value: '0', hasChevron: false },
  { key: 'localKey', icon: 'key', label: '本地密钥', value: '未生成', hasChevron: true },
  { key: 'syncHeight', icon: 'layers', label: '最近同步高度', value: '0', hasChevron: false }
] as const;

const routeRows = [
  { key: 'transparentToPrivate', from: 'transparent', to: 'private', label: '透明 → 隐私' },
  { key: 'privateToTransparent', from: 'private', to: 'transparent', label: '隐私 → 透明' }
] as const;

type ActionKey = (typeof actionItems)[number]['key'];
type StatusIconKey = (typeof statusRows)[number]['icon'];
type RouteNodeKey = (typeof routeRows)[number]['from'];

type PrivacyHomeScreenProps = {
  readonly bottomPadding?: number;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function scaledBelowTopNavigation(value: number, scale: number) {
  return scaled(value - TOP_NAVIGATION_DESIGN_HEIGHT, scale);
}

export function PrivacyHomeScreen({ bottomPadding, topPadding }: PrivacyHomeScreenProps) {
  const [isPrivacyAmountVisible, setIsPrivacyAmountVisible] = useState(true);
  const layoutMetrics = usePrivacyHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;

  const handleActionPress = (actionKey: ActionKey) => {
    console.info('[privacy-home] action requested', { actionKey });
  };

  const handleTogglePrivacyAmount = () => {
    setIsPrivacyAmountVisible((currentValue) => !currentValue);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: resolvedBottomPadding,
            paddingTop: resolvedTopPadding
          }
        ]}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.canvas}>
          <PageHeading scale={layoutMetrics.scale} styles={styles} />
          <PrivacyBalanceCard
            isAmountVisible={isPrivacyAmountVisible}
            onToggleAmountVisibility={handleTogglePrivacyAmount}
            scale={layoutMetrics.scale}
            styles={styles}
          />
          <ActionCard onActionPress={handleActionPress} scale={layoutMetrics.scale} styles={styles} />
          <PrivacyStatusCard scale={layoutMetrics.scale} styles={styles} />
          <RoutePreviewCard scale={layoutMetrics.scale} styles={styles} />
          <PrivacyRecordCard scale={layoutMetrics.scale} styles={styles} />
        </View>
      </ScrollView>
    </View>
  );
}

function PageHeading({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.pageHeading}>
      <Text style={styles.pageTitle}>隐私账户</Text>
      <View style={styles.titleShieldIcon}>
        <TitleShieldIcon size={scaled(40, scale)} />
      </View>
      <Text style={styles.pageSubtitle}>保护余额与转账路径</Text>
    </View>
  );
}

function PrivacyBalanceCard({
  isAmountVisible,
  onToggleAmountVisibility,
  scale,
  styles
}: {
  readonly isAmountVisible: boolean;
  readonly onToggleAmountVisibility: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const balanceAmountParts = getSensitiveAmountParts('0.000000', 'SOL', isAmountVisible);

  return (
    <View style={styles.balanceCard}>
      <Image resizeMode="cover" source={privacyHomeImages.privacyCardBackground} style={styles.balanceCardArtwork} />
      <View style={styles.balanceCardShade} />
      <Text style={styles.balanceLabel}>隐私可用</Text>
      <Pressable
        accessibilityLabel={isAmountVisible ? '隐藏隐私金额' : '显示隐私金额'}
        accessibilityRole="button"
        accessibilityState={{ selected: !isAmountVisible }}
        hitSlop={scaled(12, scale)}
        onPress={onToggleAmountVisibility}
        style={styles.balanceEyeButton}
      >
        <PrivacyEyeIcon size={scaled(34, scale)} />
      </Pressable>
      <View style={styles.balanceAmountRow}>
        <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.balanceAmount}>
          {balanceAmountParts.amountText}
        </Text>
        <Text style={styles.balanceSymbol}>{balanceAmountParts.unitText}</Text>
      </View>
      <View style={styles.balanceDivider} />
      <View style={styles.cardUnlockIcon}>
        <CardUnlockIcon size={scaled(48, scale)} />
      </View>
      <Text style={styles.cardUnlockLabel}>已解锁</Text>
      <Text style={styles.cardUnlockValue}>0 个状态</Text>
      <View style={styles.cardMetricDivider} />
      <View style={styles.cardAuditIcon}>
        <CardAuditShieldIcon size={scaled(48, scale)} />
      </View>
      <Text style={styles.cardAuditLabel}>审计授权</Text>
      <Text style={styles.cardAuditValue}>未开启</Text>
    </View>
  );
}

function ActionCard({
  onActionPress,
  scale,
  styles
}: {
  readonly onActionPress: (actionKey: ActionKey) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionDividerOne} />
      <View style={styles.actionDividerTwo} />
      <View style={styles.actionDividerThree} />
      {actionItems.map((item, index) => (
        <Pressable
          accessibilityRole="button"
          key={item.key}
          onPress={() => onActionPress(item.key)}
          style={[styles.actionButton, { left: scaled(index * 204, scale) }]}
        >
          <ActionIcon actionKey={item.key} size={scaled(64, scale)} />
          <Text style={styles.actionLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ActionIcon({ actionKey, size }: { readonly actionKey: ActionKey; readonly size: number }) {
  if (actionKey === 'privateIn') {
    return <ActionPrivateInIcon size={size} />;
  }

  if (actionKey === 'privateTransfer') {
    return <ActionPrivateTransferIcon size={size} />;
  }

  if (actionKey === 'transparentOut') {
    return <ActionTransparentOutIcon size={size} />;
  }

  return <ActionAuditIcon size={size} />;
}

function PrivacyStatusCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.statusCard}>
      <View style={styles.sectionTitleIcon}>
        <StatusChartIcon size={scaled(32, scale)} />
      </View>
      <Text style={styles.sectionTitle}>隐私状态</Text>
      {statusRows.map((row, index) => (
        <View key={row.key} style={[styles.statusRow, { top: scaled(88 + index * 60, scale) }]}>
          <View style={styles.statusRowIcon}>
            <StatusRowIcon iconKey={row.icon} size={scaled(32, scale)} />
          </View>
          <Text style={styles.statusRowLabel}>{row.label}</Text>
          <Text style={[styles.statusRowValue, row.hasChevron ? styles.statusRowValueWithChevron : null]}>
            {row.value}
          </Text>
          {row.hasChevron ? (
            <View style={styles.statusRowChevron}>
              <ChevronRightIcon size={scaled(34, scale)} />
            </View>
          ) : null}
          {index < statusRows.length - 1 ? <View style={styles.statusRowDivider} /> : null}
        </View>
      ))}
    </View>
  );
}

function StatusRowIcon({ iconKey, size }: { readonly iconKey: StatusIconKey; readonly size: number }) {
  if (iconKey === 'cube') {
    return <StatusCubeIcon size={size} />;
  }

  if (iconKey === 'nullifier') {
    return <StatusNullifierIcon size={size} />;
  }

  if (iconKey === 'key') {
    return <StatusKeyIcon size={size} />;
  }

  return <StatusLayersIcon size={size} />;
}

function RoutePreviewCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.routeCard}>
      <View style={styles.routeTitleIcon}>
        <RoutePreviewIcon size={scaled(32, scale)} />
      </View>
      <Text style={styles.sectionTitle}>隐私路径预览</Text>
      {routeRows.map((row, index) => (
        <Pressable accessibilityRole="button" key={row.key} style={[styles.routeRow, { top: scaled(82 + index * 78, scale) }]}>
          <View style={styles.routeFromNode}>
            <RouteNode nodeKey={row.from} size={scaled(36, scale)} />
          </View>
          <Text style={styles.routeArrowLeft}>→</Text>
          <View style={styles.routeToNode}>
            <RouteNode nodeKey={row.to} size={scaled(36, scale)} />
          </View>
          <Text style={styles.routeLabel}>{row.label}</Text>
          <View style={styles.routeChevron}>
            <ChevronRightIcon size={scaled(38, scale)} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function RouteNode({ nodeKey, size }: { readonly nodeKey: RouteNodeKey; readonly size: number }) {
  if (nodeKey === 'transparent') {
    return <RouteTransparentNodeIcon size={size} />;
  }

  return <RoutePrivateNodeIcon size={size} />;
}

function PrivacyRecordCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordTitleIcon}>
        <PrivacyRecordClockIcon size={scaled(32, scale)} />
      </View>
      <Text style={styles.sectionTitle}>隐私记录</Text>
      <View style={styles.emptyRecordState}>
        <EmptyPrivacyActivityIcon size={scaled(128, scale)} />
        <Text style={styles.emptyRecordText}>暂无隐私活动</Text>
      </View>
    </View>
  );
}

function createStyles(scale: number) {
  // 功能目的：按设计稿坐标生成样式；实现原因：隐私首页要求一比一高保真还原。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      height: scaled(170, scale),
      justifyContent: 'flex-start',
      paddingTop: scaled(37, scale),
      position: 'absolute',
      top: 0,
      width: scaled(204, scale)
    },
    actionCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      height: scaled(172, scale),
      left: scaled(24, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(602, scale),
      width: scaled(816, scale),
      elevation: 1
    },
    actionDividerOne: {
      backgroundColor: '#E4E6EE',
      height: scaled(86, scale),
      left: scaled(204, scale),
      position: 'absolute',
      top: scaled(43, scale),
      width: 1
    },
    actionDividerThree: {
      backgroundColor: '#E4E6EE',
      height: scaled(86, scale),
      left: scaled(612, scale),
      position: 'absolute',
      top: scaled(43, scale),
      width: 1
    },
    actionDividerTwo: {
      backgroundColor: '#E4E6EE',
      height: scaled(86, scale),
      left: scaled(408, scale),
      position: 'absolute',
      top: scaled(43, scale),
      width: 1
    },
    actionLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      marginTop: scaled(14, scale),
      ...textBase
    },
    balanceAmount: {
      color: '#FFFFFF',
      fontSize: scaled(63, scale),
      fontWeight: '800',
      lineHeight: scaled(76, scale),
      maxWidth: scaled(336, scale),
      minWidth: 0,
      ...textBase
    },
    balanceAmountRow: {
      alignItems: 'baseline',
      flexDirection: 'row',
      left: scaled(33, scale),
      position: 'absolute',
      top: scaled(107, scale),
      width: scaled(430, scale)
    },
    balanceCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(30, scale),
      height: scaled(336, scale),
      left: scaled(24, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaledBelowTopNavigation(238, scale),
      width: scaled(816, scale)
    },
    balanceCardArtwork: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    balanceCardShade: {
      backgroundColor: '#05050766',
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    balanceDivider: {
      backgroundColor: '#3A3E4A',
      height: 1,
      left: scaled(34, scale),
      position: 'absolute',
      top: scaled(204, scale),
      width: scaled(422, scale)
    },
    balanceLabel: {
      color: '#F3F5FA',
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(34, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(56, scale),
      ...textBase
    },
    balanceEyeButton: {
      alignItems: 'center',
      height: scaled(44, scale),
      justifyContent: 'center',
      left: scaled(150, scale),
      position: 'absolute',
      top: scaled(50, scale),
      width: scaled(44, scale)
    },
    balanceSymbol: {
      color: '#F3F5FA',
      fontSize: scaled(26, scale),
      fontWeight: '400',
      lineHeight: scaled(34, scale),
      marginLeft: scaled(8, scale),
      ...textBase
    },
    canvas: {
      backgroundColor: colors.background,
      height: scaled(1576, scale),
      position: 'relative',
      width: '100%'
    },
    cardAuditIcon: {
      left: scaled(286, scale),
      position: 'absolute',
      top: scaled(236, scale)
    },
    cardAuditLabel: {
      color: '#E4E7EF',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(342, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(238, scale),
      ...textBase
    },
    cardAuditValue: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(342, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(279, scale),
      ...textBase
    },
    cardMetricDivider: {
      backgroundColor: '#3A3E4A',
      height: scaled(70, scale),
      left: scaled(244, scale),
      position: 'absolute',
      top: scaled(237, scale),
      width: 1
    },
    cardUnlockIcon: {
      left: scaled(50, scale),
      position: 'absolute',
      top: scaled(236, scale)
    },
    cardUnlockLabel: {
      color: '#E4E7EF',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(110, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(238, scale),
      ...textBase
    },
    cardUnlockValue: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(110, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(279, scale),
      ...textBase
    },
    emptyRecordState: {
      alignItems: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: scaled(77, scale)
    },
    emptyRecordText: {
      color: '#8B909D',
      fontSize: scaled(25, scale),
      fontWeight: '400',
      lineHeight: scaled(33, scale),
      marginTop: scaled(-12, scale),
      textAlign: 'center',
      ...textBase
    },
    pageHeading: {
      height: scaledBelowTopNavigation(238, scale),
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    pageSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      left: scaled(30, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(196, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(44, scale),
      fontWeight: fontWeights.pageTitle,
      left: scaled(30, scale),
      lineHeight: scaled(55, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(128, scale),
      ...textBase
    },
    recordCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      height: scaled(254, scale),
      left: scaled(24, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(1418, scale),
      width: scaled(816, scale),
      elevation: 1
    },
    recordTitleIcon: {
      left: scaled(32, scale),
      position: 'absolute',
      top: scaled(32, scale)
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    routeArrowLeft: {
      color: '#050505',
      fontSize: scaled(27, scale),
      fontWeight: '400',
      left: scaled(98, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(15, scale),
      ...textBase
    },
    routeCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      height: scaled(250, scale),
      left: scaled(24, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(1150, scale),
      width: scaled(816, scale),
      elevation: 1
    },
    routeChevron: {
      alignItems: 'center',
      height: scaled(48, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(22, scale),
      top: scaled(9, scale),
      width: scaled(48, scale)
    },
    routeFromNode: {
      left: scaled(25, scale),
      position: 'absolute',
      top: scaled(15, scale)
    },
    routeLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(248, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      textAlign: 'center',
      top: scaled(16, scale),
      width: scaled(220, scale),
      ...textBase
    },
    routeRow: {
      backgroundColor: '#FAFBFD',
      borderColor: '#E6E8EF',
      borderRadius: scaled(15, scale),
      borderWidth: 1,
      height: scaled(64, scale),
      left: scaled(32, scale),
      position: 'absolute',
      width: scaled(752, scale)
    },
    routeTitleIcon: {
      left: scaled(32, scale),
      position: 'absolute',
      top: scaled(32, scale)
    },
    routeToNode: {
      left: scaled(148, scale),
      position: 'absolute',
      top: scaled(15, scale)
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    sectionTitle: {
      color: colors.text,
      fontSize: scaled(28, scale),
      fontWeight: '800',
      left: scaled(80, scale),
      lineHeight: scaled(36, scale),
      position: 'absolute',
      top: scaled(31, scale),
      ...textBase
    },
    sectionTitleIcon: {
      left: scaled(32, scale),
      position: 'absolute',
      top: scaled(32, scale)
    },
    statusCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      height: scaled(336, scale),
      left: scaled(24, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(796, scale),
      width: scaled(816, scale),
      elevation: 1
    },
    statusRow: {
      height: scaled(60, scale),
      left: scaled(32, scale),
      position: 'absolute',
      width: scaled(752, scale)
    },
    statusRowChevron: {
      alignItems: 'center',
      height: scaled(42, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(4, scale),
      top: scaled(8, scale),
      width: scaled(42, scale)
    },
    statusRowDivider: {
      backgroundColor: '#E9EBF1',
      bottom: 0,
      height: 1,
      left: scaled(48, scale),
      position: 'absolute',
      right: 0
    },
    statusRowIcon: {
      left: 0,
      position: 'absolute',
      top: scaled(13, scale)
    },
    statusRowLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      left: scaled(48, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(14, scale),
      ...textBase
    },
    statusRowValue: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      lineHeight: scaled(32, scale),
      position: 'absolute',
      right: scaled(8, scale),
      textAlign: 'right',
      top: scaled(14, scale),
      width: scaled(160, scale),
      ...textBase
    },
    statusRowValueWithChevron: {
      right: scaled(56, scale)
    },
    titleShieldIcon: {
      left: scaled(229, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(139, scale)
    }
  });
}
