import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights, shadows } from '../../theme/tokens';
import { JsonRpcClient } from '../../utils/chainRpc';
import { copyTextToClipboard } from '../../utils/clipboard';
import { transactionDetailImages } from './designAssets';
import {
  TransactionArrowDownIcon,
  TransactionBackIcon,
  TransactionBlockIcon,
  TransactionChevronRightIcon,
  TransactionCopyIcon,
  TransactionFeeIcon,
  TransactionMetricIcon,
  TransactionPersonIcon,
  TransactionSolanaMarkIcon,
  TransactionStatusCheckIcon,
  TransactionTypeIcon
} from './TransactionDetailSvgIcons';
import {
  DEFAULT_TRANSACTION_DETAIL_DATA,
  createTransactionDetailFromRpc,
  type TransactionDetailData,
  type TransactionInstructionDetail
} from './transactionDetailData';
import { useTransactionDetailResponsiveLayout } from './useTransactionDetailResponsiveLayout';

type TransactionDetailScreenProps = {
  readonly bottomPadding?: number;
  readonly detailData?: TransactionDetailData | null;
  readonly onBackPress?: () => void;
  readonly onViewBlockPress?: (slot: number | null) => void;
  readonly rpcEndpoint?: string;
  readonly topPadding?: number;
};

type DetailRow = {
  readonly canCopy?: boolean;
  readonly label: string;
  readonly value: string;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function shortenValue(value: string, prefixLength = 7, suffixLength = 7) {
  if (value.length <= prefixLength + suffixLength + 3) {
    return value;
  }

  return `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`;
}

function parseDisplayInteger(value: string) {
  const parsedValue = Number(value.replace(/[^\d]/g, ''));
  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function TransactionDetailScreen({ bottomPadding, detailData, onBackPress, onViewBlockPress, rpcEndpoint, topPadding }: TransactionDetailScreenProps) {
  const layoutMetrics = useTransactionDetailResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const effectiveRpcEndpoint = detailData?.rpcEndpoint ?? rpcEndpoint;
  const client = useMemo(() => new JsonRpcClient(effectiveRpcEndpoint), [effectiveRpcEndpoint]);
  const [liveDetailData, setLiveDetailData] = useState<TransactionDetailData | null>(null);
  const baseTransaction = detailData ?? DEFAULT_TRANSACTION_DETAIL_DATA;
  const transaction = liveDetailData ?? baseTransaction;

  useEffect(() => {
    let cancelled = false;
    const signature = baseTransaction.signature.trim();
    setLiveDetailData(null);

    if (signature.length === 0 || signature === DEFAULT_TRANSACTION_DETAIL_DATA.signature) {
      return () => {
        cancelled = true;
      };
    }

    async function refreshTransactionDetail() {
      try {
        const rpcDetail = await client.getTransaction(signature);
        if (!cancelled && rpcDetail.found) {
          setLiveDetailData(createTransactionDetailFromRpc(rpcDetail, baseTransaction));
        }
      } catch (error: unknown) {
        console.info('[transaction-detail] refresh failed', {
          endpoint: client.endpoint,
          message: error instanceof Error ? error.message : String(error),
          signature
        });
      }
    }

    void refreshTransactionDetail();
    const timer = setInterval(() => {
      void refreshTransactionDetail();
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [baseTransaction, client]);

  const handleCopy = (value: string, label: string) => {
    // 功能目的：复制交易详情关键字段；实现原因：签名、地址和区块哈希需要给用户可复核的完整值。
    void copyTextToClipboard(value, `${label}已复制`).catch((error: unknown) => {
      console.info('[transaction-detail] copy failed', {
        message: error instanceof Error ? error.message : 'unknown error'
      });
    });
  };

  const handleViewBlock = () => {
    onViewBlockPress?.(parseDisplayInteger(transaction.slot));
    console.info('[transaction-detail] block detail requested', {
      blockHeight: transaction.blockHeight,
      slot: transaction.slot
    });
  };

  const detailRows: readonly DetailRow[] = [
    { canCopy: true, label: 'Signature', value: transaction.signature },
    { canCopy: true, label: 'Status', value: transaction.status },
    { canCopy: true, label: 'Location', value: transaction.location },
    { label: 'Submit Time', value: transaction.submitTime },
    { canCopy: true, label: 'Recent Blockhash', value: transaction.recentBlockhash },
    { label: 'Compute Used', value: transaction.computeUsed },
    { label: 'Instruction Count', value: String(transaction.instructions.length) }
  ];

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
          <PageHeading onBackPress={onBackPress} onCopy={() => handleCopy(transaction.signature, '签名')} scale={layoutMetrics.scale} signature={transaction.signature} styles={styles} />
          <HeroCard scale={layoutMetrics.scale} styles={styles} transaction={transaction} />
          <DetailRowsCard onCopy={handleCopy} rows={detailRows} scale={layoutMetrics.scale} styles={styles} />
          <ParticipantsCard onCopy={handleCopy} scale={layoutMetrics.scale} styles={styles} transaction={transaction} />
          <FeeBreakdownCard scale={layoutMetrics.scale} styles={styles} transaction={transaction} />
          <InstructionCard instructions={transaction.instructions} scale={layoutMetrics.scale} styles={styles} />
          <BlockLinkCard onPress={handleViewBlock} scale={layoutMetrics.scale} styles={styles} transaction={transaction} />
          <ActionButtons onCopySignature={() => handleCopy(transaction.signature, '签名')} onViewBlock={handleViewBlock} scale={layoutMetrics.scale} styles={styles} />
        </View>
      </ScrollView>
    </View>
  );
}

function PageHeading({
  onBackPress,
  onCopy,
  scale,
  signature,
  styles
}: {
  readonly onBackPress?: () => void;
  readonly onCopy: () => void;
  readonly scale: number;
  readonly signature: string;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.pageHeading}>
      <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
        <TransactionBackIcon size={scaled(48, scale)} />
      </Pressable>
      <View style={styles.headingTextGroup}>
        <Text style={styles.pageTitle}>交易详情</Text>
        <View style={styles.headingSignatureRow}>
          <Text numberOfLines={1} style={styles.headingSignature}>{shortenValue(signature, 4, 3)}</Text>
          <Pressable accessibilityLabel="复制交易签名" accessibilityRole="button" onPress={onCopy} style={styles.smallCopyButton}>
            <TransactionCopyIcon size={scaled(28, scale)} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function HeroCard({
  scale,
  styles,
  transaction
}: {
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly transaction: TransactionDetailData;
}) {
  return (
    <View style={styles.heroCard}>
      <Image resizeMode="cover" source={transactionDetailImages.blockDetailCard} style={styles.heroArtwork} />
      <LinearGradient colors={['#040507FA', '#040507D6', '#04050718']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <View style={styles.transactionTypeIcon}>
        <TransactionTypeIcon size={scaled(54, scale)} />
      </View>
      <Text style={styles.heroType}>{transaction.transactionType}</Text>
      <View style={styles.finalizedPill}>
        <TransactionStatusCheckIcon size={scaled(28, scale)} />
        <Text style={styles.finalizedText}>{transaction.status}</Text>
      </View>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.heroAmount}>-{transaction.amountLamports}</Text>
      <Text style={styles.heroAmountUnit}>lamports</Text>
      <View style={styles.directionPill}>
        <Text style={styles.directionText}>↗ Outgoing</Text>
      </View>
      <View style={styles.solanaMark}>
        <TransactionSolanaMarkIcon size={scaled(112, scale)} />
      </View>
      <View style={styles.heroMetrics}>
        <HeroMetric label="Slot" scale={scale} styles={styles} value={transaction.slot} />
        <View style={styles.metricDivider} />
        <HeroMetric label="Block Height" scale={scale} styles={styles} value={transaction.blockHeight} />
        <View style={styles.metricDivider} />
        <HeroMetric label="手续费" scale={scale} styles={styles} value={transaction.feeLamports} valueSuffix="lamports" />
      </View>
    </View>
  );
}

function HeroMetric({
  label,
  scale,
  styles,
  value,
  valueSuffix
}: {
  readonly label: string;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly value: string;
  readonly valueSuffix?: string;
}) {
  return (
    <View style={styles.heroMetricItem}>
      <View style={styles.heroMetricLabelRow}>
        <TransactionMetricIcon size={scaled(28, scale)} />
        <Text numberOfLines={1} style={styles.heroMetricLabel}>{label}</Text>
      </View>
      <Text numberOfLines={1} style={styles.heroMetricValue}>{value}</Text>
      {valueSuffix ? <Text numberOfLines={1} style={styles.heroMetricSuffix}>{valueSuffix}</Text> : null}
    </View>
  );
}

function DetailRowsCard({
  onCopy,
  rows,
  scale,
  styles
}: {
  readonly onCopy: (value: string, label: string) => void;
  readonly rows: readonly DetailRow[];
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.detailCard}>
      {rows.map((row) => (
        <View key={row.label} style={styles.detailRow}>
          <TransactionMetricIcon color="#24293B" size={scaled(30, scale)} />
          <Text numberOfLines={1} style={styles.detailLabel}>{row.label}</Text>
          <Text numberOfLines={1} style={row.label === 'Status' ? styles.detailStatusValue : styles.detailValue}>{row.value}</Text>
          {row.canCopy ? (
            <Pressable accessibilityLabel={`复制${row.label}`} accessibilityRole="button" onPress={() => onCopy(row.value, row.label)} style={styles.rowCopyButton}>
              <TransactionCopyIcon size={scaled(28, scale)} />
            </Pressable>
          ) : (
            <View style={styles.rowCopyPlaceholder} />
          )}
        </View>
      ))}
    </View>
  );
}

function ParticipantsCard({
  onCopy,
  scale,
  styles,
  transaction
}: {
  readonly onCopy: (value: string, label: string) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly transaction: TransactionDetailData;
}) {
  return (
    <View style={styles.participantsCard}>
      <View style={styles.participantRail}>
        <TransactionPersonIcon size={scaled(56, scale)} />
        <TransactionArrowDownIcon size={scaled(34, scale)} />
        <TransactionPersonIcon size={scaled(56, scale)} />
      </View>
      <View style={styles.participantContent}>
        <Text style={styles.participantCaption}>从（发送方）</Text>
        <View style={styles.participantAddressRow}>
          <Text numberOfLines={1} style={styles.participantAddress}>{transaction.senderAddress}</Text>
          <Pressable accessibilityLabel="复制发送方地址" accessibilityRole="button" onPress={() => onCopy(transaction.senderAddress, '发送方地址')} style={styles.inlineCopyButton}>
            <TransactionCopyIcon size={scaled(26, scale)} />
          </Pressable>
        </View>
        <Text style={styles.participantCaption}>至（接收方）</Text>
        <View style={styles.participantAddressRow}>
          <Text numberOfLines={1} style={styles.participantAddress}>{transaction.receiverAddress}</Text>
          <Pressable accessibilityLabel="复制接收方地址" accessibilityRole="button" onPress={() => onCopy(transaction.receiverAddress, '接收方地址')} style={styles.inlineCopyButton}>
            <TransactionCopyIcon size={scaled(26, scale)} />
          </Pressable>
        </View>
      </View>
      <View style={styles.participantAmountGroup}>
        <Text numberOfLines={1} style={styles.participantAmount}>-{transaction.amountLamports}</Text>
        <Text style={styles.participantAmountUnit}>lamports</Text>
      </View>
    </View>
  );
}

function FeeBreakdownCard({
  scale,
  styles,
  transaction
}: {
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly transaction: TransactionDetailData;
}) {
  const feeItems = [
    { key: 'base', label: 'Base Fee', value: transaction.baseFeeLamports ?? transaction.feeLamports, unit: 'lamports' },
    { key: 'priority', label: 'Priority Fee', value: transaction.priorityFeeLamports ?? '0', unit: 'lamports' },
    { key: 'burned', label: 'Burned', value: transaction.burnedFeeLamports ?? '-', unit: 'lamports' },
    { key: 'leader', label: 'Leader Fee', value: transaction.leaderFeeLamports ?? '-', unit: 'lamports' }
  ] as const;

  return (
    <View style={styles.feeCard}>
      {feeItems.map((fee, index) => (
        <View key={fee.key} style={styles.feeItem}>
          <View style={styles.feeLabelRow}>
            <TransactionFeeIcon size={scaled(28, scale)} />
            <Text numberOfLines={1} style={styles.feeLabel}>{fee.label}</Text>
          </View>
          <Text numberOfLines={1} style={styles.feeValue}>{fee.value}</Text>
          <Text numberOfLines={1} style={styles.feeUnit}>{fee.unit}</Text>
          {index < feeItems.length - 1 ? <View style={styles.feeDivider} /> : null}
        </View>
      ))}
    </View>
  );
}

function InstructionCard({
  instructions,
  scale,
  styles
}: {
  readonly instructions: readonly TransactionInstructionDetail[];
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.instructionsCard}>
      <Text style={styles.sectionTitle}>指令详情</Text>
      {instructions.map((instruction, index) => (
        <View key={instruction.id} style={styles.instructionRow}>
          <LinearGradient colors={['#1ACBFF', '#384DFF', '#9A3DFF']} style={styles.instructionIndex}>
            <Text style={styles.instructionIndexText}>{instruction.id}</Text>
          </LinearGradient>
          <View style={styles.instructionNameGroup}>
            <Text numberOfLines={1} style={styles.instructionName}>{instruction.name}</Text>
            <Text numberOfLines={1} style={styles.instructionProgram}>{instruction.program}</Text>
          </View>
          <View style={styles.instructionMetricGroup}>
            <Text style={styles.instructionMetricLabel}>账户数</Text>
            <Text style={styles.instructionMetricValue}>{instruction.accountCount}</Text>
          </View>
          <View style={styles.instructionMetricGroup}>
            <Text style={styles.instructionMetricLabel}>可写账户</Text>
            <Text style={styles.instructionMetricValue}>{instruction.writableAccountCount}</Text>
          </View>
          <TransactionChevronRightIcon size={scaled(34, scale)} />
          {index < instructions.length - 1 ? <View style={styles.instructionDivider} /> : null}
        </View>
      ))}
    </View>
  );
}

function BlockLinkCard({
  onPress,
  scale,
  styles,
  transaction
}: {
  readonly onPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly transaction: TransactionDetailData;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.blockLinkCard}>
      <TransactionBlockIcon size={scaled(48, scale)} />
      <View style={styles.blockTextGroup}>
        <Text numberOfLines={1} style={styles.blockTitle}>区块 {transaction.blockHeight} / Slot {transaction.slot}</Text>
        <Text numberOfLines={1} style={styles.blockSubtitle}>查看区块详细信息</Text>
      </View>
      <TransactionChevronRightIcon size={scaled(36, scale)} />
    </Pressable>
  );
}

function ActionButtons({
  onCopySignature,
  onViewBlock,
  scale,
  styles
}: {
  readonly onCopySignature: () => void;
  readonly onViewBlock: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.actionRow}>
      <Pressable accessibilityRole="button" onPress={onCopySignature} style={styles.primaryActionButton}>
        <TransactionCopyIcon color="#FFFFFF" size={scaled(34, scale)} />
        <Text style={styles.primaryActionText}>复制签名</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onViewBlock} style={styles.secondaryActionButton}>
        <TransactionBlockIcon size={scaled(36, scale)} />
        <Text style={styles.secondaryActionText}>查看区块</Text>
      </Pressable>
    </View>
  );
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: scaled(20, scale)
    },
    backButton: {
      alignItems: 'center',
      height: scaled(64, scale),
      justifyContent: 'center',
      width: scaled(64, scale)
    },
    blockLinkCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: scaled(14, scale),
      minHeight: scaled(84, scale),
      paddingHorizontal: scaled(24, scale),
      ...shadows.card
    },
    blockSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(25, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    blockTextGroup: {
      flex: 1,
      marginLeft: scaled(18, scale)
    },
    blockTitle: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    canvas: {
      minHeight: scaled(1599, scale),
      paddingHorizontal: scaled(29, scale),
      paddingTop: scaled(4, scale)
    },
    detailCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(18, scale),
      paddingHorizontal: scaled(22, scale),
      paddingVertical: scaled(17, scale),
      ...shadows.card
    },
    detailLabel: {
      color: colors.text,
      fontSize: scaled(22, scale),
      lineHeight: scaled(31, scale),
      marginLeft: scaled(16, scale),
      width: scaled(178, scale),
      ...textBase
    },
    detailRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: scaled(42, scale)
    },
    detailStatusValue: {
      color: colors.primary,
      flex: 1,
      fontSize: scaled(22, scale),
      lineHeight: scaled(31, scale),
      ...textBase
    },
    detailValue: {
      color: colors.textMuted,
      flex: 1,
      fontSize: scaled(22, scale),
      lineHeight: scaled(31, scale),
      ...textBase
    },
    directionPill: {
      alignItems: 'center',
      borderColor: '#8A4DFF',
      borderRadius: scaled(20, scale),
      borderWidth: 1,
      height: scaled(42, scale),
      justifyContent: 'center',
      left: scaled(30, scale),
      paddingHorizontal: scaled(16, scale),
      position: 'absolute',
      top: scaled(164, scale)
    },
    directionText: {
      color: '#B06DFF',
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(28, scale),
      ...textBase
    },
    feeCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: scaled(14, scale),
      minHeight: scaled(132, scale),
      paddingVertical: scaled(23, scale),
      ...shadows.card
    },
    feeDivider: {
      backgroundColor: colors.border,
      bottom: scaled(16, scale),
      position: 'absolute',
      right: 0,
      top: scaled(16, scale),
      width: 1
    },
    feeItem: {
      alignItems: 'center',
      flex: 1,
      position: 'relative'
    },
    feeLabel: {
      color: colors.text,
      fontSize: scaled(19, scale),
      lineHeight: scaled(25, scale),
      marginLeft: scaled(8, scale),
      ...textBase
    },
    feeLabelRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center'
    },
    feeUnit: {
      color: colors.textMuted,
      fontSize: scaled(17, scale),
      lineHeight: scaled(23, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    feeValue: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      marginTop: scaled(18, scale),
      ...textBase
    },
    finalizedPill: {
      alignItems: 'center',
      backgroundColor: '#07100FCC',
      borderColor: '#40524D',
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(48, scale),
      paddingHorizontal: scaled(14, scale),
      position: 'absolute',
      right: scaled(26, scale),
      top: scaled(18, scale)
    },
    finalizedText: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      lineHeight: scaled(28, scale),
      marginLeft: scaled(8, scale),
      ...textBase
    },
    headingSignature: {
      color: colors.textMuted,
      flexShrink: 1,
      fontSize: scaled(24, scale),
      lineHeight: scaled(31, scale),
      ...textBase
    },
    headingSignatureRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: scaled(7, scale)
    },
    headingTextGroup: {
      flex: 1,
      marginLeft: scaled(9, scale)
    },
    heroAmount: {
      color: '#FFFFFF',
      fontSize: scaled(54, scale),
      fontWeight: '800',
      left: scaled(30, scale),
      letterSpacing: 0,
      lineHeight: scaled(68, scale),
      position: 'absolute',
      top: scaled(88, scale),
      width: scaled(315, scale),
      ...textBase
    },
    heroAmountUnit: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      left: scaled(330, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      top: scaled(120, scale),
      ...textBase
    },
    heroArtwork: {
      ...StyleSheet.absoluteFillObject,
      height: '100%',
      width: '100%'
    },
    heroCard: {
      borderRadius: scaled(22, scale),
      height: scaled(348, scale),
      marginTop: scaled(20, scale),
      overflow: 'hidden',
      position: 'relative'
    },
    heroMetricItem: {
      flex: 1,
      paddingHorizontal: scaled(5, scale)
    },
    heroMetricLabel: {
      color: '#FFFFFF',
      fontSize: scaled(19, scale),
      lineHeight: scaled(25, scale),
      marginLeft: scaled(10, scale),
      ...textBase
    },
    heroMetricLabelRow: {
      alignItems: 'center',
      flexDirection: 'row'
    },
    heroMetricSuffix: {
      color: '#FFFFFF',
      fontSize: scaled(18, scale),
      lineHeight: scaled(24, scale),
      marginLeft: scaled(38, scale),
      marginTop: scaled(2, scale),
      ...textBase
    },
    heroMetricValue: {
      color: '#FFFFFF',
      fontSize: scaled(27, scale),
      fontWeight: '700',
      lineHeight: scaled(36, scale),
      marginLeft: scaled(38, scale),
      marginTop: scaled(9, scale),
      ...textBase
    },
    heroMetrics: {
      bottom: scaled(28, scale),
      flexDirection: 'row',
      left: scaled(27, scale),
      position: 'absolute',
      right: scaled(27, scale)
    },
    heroShade: {
      ...StyleSheet.absoluteFillObject
    },
    heroType: {
      color: '#FFFFFF',
      fontSize: scaled(26, scale),
      fontWeight: '700',
      left: scaled(88, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(42, scale),
      ...textBase
    },
    inlineCopyButton: {
      alignItems: 'center',
      height: scaled(36, scale),
      justifyContent: 'center',
      marginLeft: scaled(8, scale),
      width: scaled(36, scale)
    },
    instructionDivider: {
      backgroundColor: colors.border,
      bottom: 0,
      height: 1,
      left: scaled(68, scale),
      position: 'absolute',
      right: scaled(24, scale)
    },
    instructionIndex: {
      alignItems: 'center',
      borderRadius: scaled(8, scale),
      height: scaled(36, scale),
      justifyContent: 'center',
      width: scaled(36, scale)
    },
    instructionIndexText: {
      color: '#FFFFFF',
      fontSize: scaled(20, scale),
      fontWeight: '700',
      lineHeight: scaled(25, scale),
      ...textBase
    },
    instructionMetricGroup: {
      alignItems: 'center',
      width: scaled(116, scale)
    },
    instructionMetricLabel: {
      color: colors.textMuted,
      fontSize: scaled(17, scale),
      lineHeight: scaled(23, scale),
      ...textBase
    },
    instructionMetricValue: {
      color: colors.text,
      fontSize: scaled(18, scale),
      lineHeight: scaled(24, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    instructionName: {
      color: colors.text,
      fontSize: scaled(21, scale),
      lineHeight: scaled(27, scale),
      ...textBase
    },
    instructionNameGroup: {
      flex: 1,
      marginLeft: scaled(24, scale)
    },
    instructionProgram: {
      color: colors.textMuted,
      fontSize: scaled(17, scale),
      lineHeight: scaled(23, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    instructionRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: scaled(72, scale),
      position: 'relative'
    },
    instructionsCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(14, scale),
      paddingHorizontal: scaled(24, scale),
      paddingVertical: scaled(18, scale),
      ...shadows.card
    },
    metricDivider: {
      backgroundColor: '#FFFFFF80',
      height: scaled(62, scale),
      marginHorizontal: scaled(12, scale),
      width: 1
    },
    pageHeading: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: scaled(76, scale)
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(32, scale),
      fontWeight: fontWeights.pageTitle,
      lineHeight: scaled(41, scale),
      ...textBase
    },
    participantAddress: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(20, scale),
      lineHeight: scaled(27, scale),
      ...textBase
    },
    participantAddressRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: scaled(20, scale),
      marginTop: scaled(8, scale)
    },
    participantAmount: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(32, scale),
      textAlign: 'right',
      ...textBase
    },
    participantAmountGroup: {
      alignItems: 'flex-end',
      marginLeft: scaled(14, scale),
      width: scaled(150, scale)
    },
    participantAmountUnit: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(24, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    participantCaption: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(24, scale),
      ...textBase
    },
    participantContent: {
      flex: 1,
      marginLeft: scaled(20, scale)
    },
    participantRail: {
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: scaled(154, scale),
      width: scaled(58, scale)
    },
    participantsCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: scaled(14, scale),
      minHeight: scaled(218, scale),
      paddingHorizontal: scaled(24, scale),
      paddingVertical: scaled(25, scale),
      ...shadows.card
    },
    primaryActionButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderColor: '#7C32FF',
      borderRadius: scaled(12, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(66, scale),
      justifyContent: 'center',
      width: scaled(390, scale)
    },
    primaryActionText: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      marginLeft: scaled(18, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    rowCopyButton: {
      alignItems: 'center',
      height: scaled(40, scale),
      justifyContent: 'center',
      width: scaled(40, scale)
    },
    rowCopyPlaceholder: {
      width: scaled(40, scale)
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background,
      flex: 1
    },
    secondaryActionButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: '#2E3344',
      borderRadius: scaled(12, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(66, scale),
      justifyContent: 'center',
      width: scaled(390, scale)
    },
    secondaryActionText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      marginLeft: scaled(18, scale),
      ...textBase
    },
    sectionTitle: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(33, scale),
      marginBottom: scaled(12, scale),
      ...textBase
    },
    smallCopyButton: {
      alignItems: 'center',
      height: scaled(36, scale),
      justifyContent: 'center',
      marginLeft: scaled(9, scale),
      width: scaled(36, scale)
    },
    solanaMark: {
      position: 'absolute',
      right: scaled(112, scale),
      top: scaled(86, scale)
    },
    transactionTypeIcon: {
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(31, scale)
    }
  });
}
