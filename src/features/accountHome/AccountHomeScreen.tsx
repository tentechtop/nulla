import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { accountHomeImages } from './designAssets';
import {
  CardAddressQrIcon,
  CardCopyAddressIcon,
  CardUnlockBadgeIcon,
  ChevronRightIcon,
  LogoutIcon,
  RpcGlobeIcon,
  SecurityRowIcon,
  type SecurityIconKey,
  WalletRowIcon,
  type WalletIconKey
} from './AccountHomeSvgIcons';
import { useAccountHomeResponsiveLayout } from './useAccountHomeResponsiveLayout';

const TOP_NAVIGATION_DESIGN_HEIGHT = 117;

const walletRows = [
  { key: 'currentWallet', icon: 'walletCurrent', label: '当前钱包', value: '3GT9QRA...TcZjT5S' },
  { key: 'switchAccount', icon: 'switchAccount', label: '切换账户', value: '' },
  { key: 'addressQr', icon: 'addressQr', label: '导出地址二维码', value: '' },
  { key: 'backupKey', icon: 'backupKey', label: '备份助记词', value: '' }
] as const;

const securityRows = [
  { key: 'localSign', icon: 'sign', label: '本地签名', value: '已开启' },
  { key: 'deployConfirm', icon: 'confirm', label: '部署请求确认', value: '已开启' },
  { key: 'privateKeyLocal', icon: 'lock', label: '私钥不上链', value: '已开启' },
  { key: 'clearLocal', icon: 'clear', label: '清除本机账户', value: '' }
] as const;

const rpcTabs = ['公网节点', '本地节点', '自定义'] as const;

type WalletRowKey = (typeof walletRows)[number]['key'];
type SecurityRowKey = (typeof securityRows)[number]['key'];
type RpcTab = (typeof rpcTabs)[number];

type AccountHomeScreenProps = {
  readonly bottomPadding?: number;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function scaledBelowTopNavigation(value: number, scale: number) {
  return scaled(value - TOP_NAVIGATION_DESIGN_HEIGHT, scale);
}

export function AccountHomeScreen({ bottomPadding, topPadding }: AccountHomeScreenProps) {
  const layoutMetrics = useAccountHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;

  const handleAccountActionPress = (actionKey: string) => {
    console.info('[account-home] action requested', { actionKey });
  };

  const handleWalletPress = (rowKey: WalletRowKey) => {
    console.info('[account-home] wallet row requested', { rowKey });
  };

  const handleRpcTabPress = (tab: RpcTab) => {
    console.info('[account-home] rpc tab requested', { tab });
  };

  const handleSecurityPress = (rowKey: SecurityRowKey) => {
    console.info('[account-home] security row requested', { rowKey });
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
          <PageHeading styles={styles} />
          <AccountSummaryCard onActionPress={handleAccountActionPress} scale={layoutMetrics.scale} styles={styles} />
          <WalletManageCard onWalletPress={handleWalletPress} scale={layoutMetrics.scale} styles={styles} />
          <RpcNodeCard onRpcTabPress={handleRpcTabPress} scale={layoutMetrics.scale} styles={styles} />
          <SecuritySettingsCard onSecurityPress={handleSecurityPress} scale={layoutMetrics.scale} styles={styles} />
          <LogoutButton onPress={() => handleAccountActionPress('logout')} scale={layoutMetrics.scale} styles={styles} />
        </View>
      </ScrollView>
    </View>
  );
}

function PageHeading({ styles }: { readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.pageHeading}>
      <Text style={styles.pageTitle}>账户</Text>
      <Text style={styles.pageSubtitle}>钱包、RPC、安全</Text>
    </View>
  );
}

function AccountSummaryCard({
  onActionPress,
  scale,
  styles
}: {
  readonly onActionPress: (actionKey: string) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.summaryCard}>
      <Image resizeMode="cover" source={accountHomeImages.accountCardBackground} style={styles.summaryArtwork} />
      <LinearGradient colors={['#050507F7', '#050507BB', '#05050722']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.summaryShade} />
      <Text style={styles.summaryLabel}>当前账户</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.summaryAddress}>3GT9QRA...TcZjT5S</Text>
      <Pressable accessibilityLabel="复制当前账户地址" accessibilityRole="button" onPress={() => onActionPress('copyAddress')} style={styles.copyAddressButton}>
        <CardCopyAddressIcon size={scaled(64, scale)} />
      </Pressable>
      <Pressable accessibilityLabel="显示当前账户二维码" accessibilityRole="button" onPress={() => onActionPress('showQr')} style={styles.cardQrButton}>
        <CardAddressQrIcon size={scaled(64, scale)} />
      </Pressable>
      <View style={styles.summaryStatusRow}>
        <View style={styles.unlockBadge}>
          <CardUnlockBadgeIcon size={scaled(28, scale)} />
          <Text style={styles.unlockBadgeText}>已解锁</Text>
        </View>
        <View style={styles.summaryRpcStatus}>
          <View style={styles.rpcDot} />
          <Text numberOfLines={1} style={styles.rpcLabel}>公网 RPC</Text>
        </View>
      </View>
    </View>
  );
}

function WalletManageCard({
  onWalletPress,
  scale,
  styles
}: {
  readonly onWalletPress: (rowKey: WalletRowKey) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.walletCard}>
      <Text style={styles.cardTitle}>钱包管理</Text>
      {walletRows.map((row, index) => (
        <Pressable accessibilityRole="button" key={row.key} onPress={() => onWalletPress(row.key)} style={[styles.listRow, { top: scaled(82 + index * 78, scale) }]}>
          <View style={styles.walletRowIcon}>
            <WalletRowIcon iconKey={row.icon as WalletIconKey} size={scaled(44, scale)} />
          </View>
          <Text style={styles.listRowLabel}>{row.label}</Text>
          {row.value ? <Text numberOfLines={1} style={styles.walletRowValue}>{row.value}</Text> : null}
          <View style={styles.rowChevron}>
            <ChevronRightIcon size={scaled(36, scale)} />
          </View>
          {index < walletRows.length - 1 ? <View style={styles.listDivider} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

function RpcNodeCard({
  onRpcTabPress,
  scale,
  styles
}: {
  readonly onRpcTabPress: (tab: RpcTab) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.rpcCard}>
      <Text style={styles.cardTitle}>RPC 节点</Text>
      <View style={styles.rpcGlobeIcon}>
        <RpcGlobeIcon size={scaled(66, scale)} />
      </View>
      <Text style={styles.rpcUrl}>http://101.35.87.31:8899</Text>
      <View style={styles.rpcHealthyDot} />
      <Text style={styles.rpcHealthyText}>连接正常</Text>
      <View style={styles.rpcChevron}>
        <ChevronRightIcon size={scaled(38, scale)} />
      </View>
      {rpcTabs.map((tab, index) => {
        const isActive = index === 0;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab}
            onPress={() => onRpcTabPress(tab)}
            style={[isActive ? styles.rpcTabActive : styles.rpcTab, { left: scaled(32 + index * 247, scale) }]}
          >
            <Text style={isActive ? styles.rpcTabTextActive : styles.rpcTabText}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SecuritySettingsCard({
  onSecurityPress,
  scale,
  styles
}: {
  readonly onSecurityPress: (rowKey: SecurityRowKey) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.securityCard}>
      <Text style={styles.cardTitle}>安全设置</Text>
      {securityRows.map((row, index) => (
        <Pressable accessibilityRole="button" key={row.key} onPress={() => onSecurityPress(row.key)} style={[styles.securityRow, { top: scaled(80 + index * 61, scale) }]}>
          <View style={styles.securityRowIcon}>
            <SecurityRowIcon iconKey={row.icon as SecurityIconKey} size={scaled(40, scale)} />
          </View>
          <Text style={styles.securityRowLabel}>{row.label}</Text>
          {row.value ? <Text style={styles.securityRowValue}>{row.value}</Text> : null}
          <View style={styles.securityChevron}>
            <ChevronRightIcon size={scaled(36, scale)} />
          </View>
          {index < securityRows.length - 1 ? <View style={styles.securityDivider} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

function LogoutButton({
  onPress,
  scale,
  styles
}: {
  readonly onPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.logoutButton}>
      <LogoutIcon size={scaled(48, scale)} />
      <Text style={styles.logoutText}>退出当前账户</Text>
    </Pressable>
  );
}

function createStyles(scale: number) {
  // 功能目的：按 10-account 设计坐标还原账户页；实现原因：避免切整图导致真实控件不可维护。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    canvas: {
      backgroundColor: colors.background,
      height: scaled(1576, scale),
      position: 'relative',
      width: '100%'
    },
    cardQrButton: {
      height: scaled(64, scale),
      left: scaled(500, scale),
      position: 'absolute',
      top: scaled(92, scale),
      width: scaled(64, scale)
    },
    cardTitle: {
      color: colors.text,
      fontSize: scaled(30, scale),
      fontWeight: '800',
      left: scaled(28, scale),
      lineHeight: scaled(38, scale),
      position: 'absolute',
      top: scaled(27, scale),
      ...textBase
    },
    copyAddressButton: {
      height: scaled(64, scale),
      left: scaled(420, scale),
      position: 'absolute',
      top: scaled(92, scale),
      width: scaled(64, scale)
    },
    listDivider: {
      backgroundColor: '#E6E8EF',
      bottom: 0,
      height: 1,
      left: scaled(76, scale),
      position: 'absolute',
      right: 0
    },
    listRow: {
      height: scaled(78, scale),
      left: scaled(28, scale),
      position: 'absolute',
      width: scaled(760, scale)
    },
    listRowLabel: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '500',
      left: scaled(72, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(17, scale),
      ...textBase
    },
    logoutButton: {
      alignItems: 'center',
      borderColor: '#FF3B30',
      borderRadius: scaled(19, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(78, scale),
      justifyContent: 'center',
      left: scaled(28, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1584, scale),
      width: scaled(808, scale)
    },
    logoutText: {
      color: '#FF3B30',
      fontSize: scaled(28, scale),
      fontWeight: '700',
      lineHeight: scaled(36, scale),
      marginLeft: scaled(16, scale),
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
      left: scaled(37, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(196, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(44, scale),
      fontWeight: fontWeights.pageTitle,
      left: scaled(37, scale),
      lineHeight: scaled(55, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(128, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    rowChevron: {
      alignItems: 'center',
      height: scaled(46, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(4, scale),
      top: scaled(15, scale),
      width: scaled(46, scale)
    },
    rpcCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(252, scale),
      left: scaled(28, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(949, scale),
      width: scaled(808, scale)
    },
    rpcChevron: {
      alignItems: 'center',
      height: scaled(52, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(31, scale),
      top: scaled(92, scale),
      width: scaled(52, scale)
    },
    rpcDot: {
      backgroundColor: '#236EFF',
      borderRadius: scaled(8, scale),
      height: scaled(16, scale),
      marginRight: scaled(14, scale),
      width: scaled(16, scale)
    },
    rpcGlobeIcon: {
      left: scaled(34, scale),
      position: 'absolute',
      top: scaled(86, scale)
    },
    rpcHealthyDot: {
      backgroundColor: '#18C772',
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      left: scaled(117, scale),
      position: 'absolute',
      top: scaled(137, scale),
      width: scaled(14, scale)
    },
    rpcHealthyText: {
      color: '#10B965',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(140, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(128, scale),
      ...textBase
    },
    rpcLabel: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      width: scaled(132, scale),
      ...textBase
    },
    rpcTab: {
      alignItems: 'center',
      borderColor: '#E3E6EF',
      borderRadius: scaled(11, scale),
      borderWidth: 1,
      height: scaled(54, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(174, scale),
      width: scaled(228, scale)
    },
    rpcTabActive: {
      alignItems: 'center',
      backgroundColor: '#F2F7FF',
      borderColor: '#9EC1FF',
      borderRadius: scaled(11, scale),
      borderWidth: 1,
      height: scaled(54, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(174, scale),
      width: scaled(228, scale)
    },
    rpcTabText: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    rpcTabTextActive: {
      color: colors.primary,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    rpcUrl: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(118, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(92, scale),
      ...textBase
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    securityCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(337, scale),
      left: scaled(28, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(1222, scale),
      width: scaled(808, scale)
    },
    securityChevron: {
      alignItems: 'center',
      height: scaled(44, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(5, scale),
      top: scaled(9, scale),
      width: scaled(44, scale)
    },
    securityDivider: {
      backgroundColor: '#E6E8EF',
      bottom: 0,
      height: 1,
      left: scaled(60, scale),
      position: 'absolute',
      right: 0
    },
    securityRow: {
      height: scaled(61, scale),
      left: scaled(28, scale),
      position: 'absolute',
      width: scaled(760, scale)
    },
    securityRowIcon: {
      left: 0,
      position: 'absolute',
      top: scaled(10, scale)
    },
    securityRowLabel: {
      color: colors.text,
      fontSize: scaled(26, scale),
      fontWeight: '500',
      left: scaled(64, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(12, scale),
      ...textBase
    },
    securityRowValue: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      lineHeight: scaled(32, scale),
      position: 'absolute',
      right: scaled(58, scale),
      textAlign: 'right',
      top: scaled(13, scale),
      width: scaled(150, scale),
      ...textBase
    },
    summaryAddress: {
      color: '#FFFFFF',
      fontSize: scaled(38, scale),
      fontWeight: '800',
      left: scaled(30, scale),
      lineHeight: scaled(50, scale),
      position: 'absolute',
      top: scaled(106, scale),
      width: scaled(364, scale),
      ...textBase
    },
    summaryArtwork: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    summaryCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(28, scale),
      height: scaled(274, scale),
      left: scaled(28, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaledBelowTopNavigation(238, scale),
      width: scaled(808, scale)
    },
    summaryLabel: {
      color: '#D6D9E2',
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(30, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(42, scale),
      ...textBase
    },
    summaryShade: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    summaryRpcStatus: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(48, scale),
      marginLeft: scaled(20, scale)
    },
    summaryStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(50, scale),
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(180, scale)
    },
    unlockBadge: {
      alignItems: 'center',
      backgroundColor: '#0E3B26CC',
      borderColor: '#1CBF72',
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(44, scale),
      justifyContent: 'center',
      minWidth: scaled(124, scale),
      paddingHorizontal: scaled(12, scale)
    },
    unlockBadgeText: {
      color: '#38E38E',
      fontSize: scaled(23, scale),
      fontWeight: '700',
      lineHeight: scaled(29, scale),
      marginLeft: scaled(5, scale),
      ...textBase
    },
    walletCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(390, scale),
      left: scaled(28, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(535, scale),
      width: scaled(808, scale)
    },
    walletRowIcon: {
      left: 0,
      position: 'absolute',
      top: scaled(17, scale)
    },
    walletRowValue: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      lineHeight: scaled(32, scale),
      position: 'absolute',
      right: scaled(58, scale),
      textAlign: 'right',
      top: scaled(18, scale),
      width: scaled(220, scale),
      ...textBase
    }
  });
}
