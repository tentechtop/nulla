import { useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { OperationTipDialog } from '../../components/OperationTipDialog';
import { colors, fontFamilies, fontWeights, shadows } from '../../theme/tokens';
import {
  DEFAULT_LOCAL_RPC_URL,
  JsonRpcClient,
  PUBLIC_VALIDATOR_RPC_URLS,
  type AccountTransactionHistoryResult,
  type AccountTransactionRecordResult,
  type BlockResult,
  type HealthResult,
  type NodeStatusResult,
  type PeerNetworkPeer,
  type PeerNetworkResult,
  type TransactionDetailResult,
  type ValidatorInfo
} from '../../utils/chainRpc';
import {
  submitDelegateStakeTransaction,
  submitDeployContractTransaction,
  submitStakeTransaction,
  submitUndelegateStakeTransaction,
  submitUnstakeTransaction,
  submitUpdateValidatorCommissionTransaction,
  waitForTransactionFinality,
  submitWithdrawDelegationTransaction,
  submitWithdrawUnstakedTransaction
} from '../../utils/chainOperations';
import { copyTextToClipboard } from '../../utils/clipboard';
import {
  loadDeployRequestFromQRCode,
  postDeployRequestResult,
  type LoadedDeployRequest
} from '../../utils/deployRequest';
import {
  loadLocalTransactionRecords,
  mergeLocalTransactionRecords,
  saveLocalTransactionRecord
} from '../../utils/localTransactionHistory';
import {
  countOnlineValidatorRows,
  createValidatorDisplayRows,
  isValidatorRowOnline,
  type ValidatorDisplayRow
} from '../../utils/validatorStatus';
import {
  createEmptyWalletPortfolio,
  formatLamports as formatWalletLamports,
  loadWalletPortfolio,
  type WalletPortfolio,
  type WalletValidatorSummary
} from '../../utils/walletBusiness';
import { createTransactionDetailFromRpc, type TransactionDetailData } from '../transactionDetail/transactionDetailData';
import { useHomeResponsiveLayout } from '../home/useHomeResponsiveLayout';
import { BlockDetailIcon, type BlockDetailIconName } from './BlockDetailSvgIcons';

const explorerImages = {
  blockBackground: require('../../../design-draft/assets/15-block-detail/background-block-detail-card-hd.png'),
  chainStatusBackground: require('../../../design-draft/assets/30-chain-status/background-chain-status-hd.png'),
  contractBackground: require('../../../design-draft/assets/06-contract-deploy-confirm/background-contract-deploy-card-hd.png'),
  networkStatusBackground: require('../../../design-draft/assets/31-network-status/background-network-status-hd.png'),
  rpcNodeBackground: require('../../../design-draft/assets/32-rpc-node-detail/background-rpc-node-detail-hd.png'),
  solMark: require('../../../assets/images/home/lamports-token.png'),
  statusBackground: require('../../../design-draft/assets/30-chain-status/background-block-card-hd.png'),
  transactionHistoryBackground: require('../../../design-draft/assets/29-transaction-history/background-transaction-history-hd.png'),
  validatorBackground: require('../../../design-draft/assets/08-validator-list/background-validator-card-hd.png')
} as const;

type ChainScreenBaseProps = {
  readonly bottomPadding?: number;
  readonly onBackPress?: () => void;
  readonly rpcEndpoint?: string;
  readonly topPadding?: number;
};

type QueryState<T> = {
  readonly data: T | null;
  readonly error: string;
  readonly loading: boolean;
};

type ChainStatusData = {
  readonly health: HealthResult;
  readonly latestBlocks: readonly BlockResult[];
  readonly loadedAt: number;
  readonly node: NodeStatusResult;
  readonly roundTripMs: number;
};

type NetworkStatusData = {
  readonly health: HealthResult;
  readonly loadedAt: number;
  readonly network: PeerNetworkResult;
  readonly node: NodeStatusResult;
  readonly roundTripMs: number;
};

type RpcNodeDetailData = {
  readonly health: HealthResult;
  readonly loadedAt: number;
  readonly node: NodeStatusResult;
  readonly roundTripMs: number;
};

type ValidatorListData = {
  readonly health: HealthResult;
  readonly loadedAt: number;
  readonly networkAvailable: boolean;
  readonly node: NodeStatusResult;
  readonly peers: readonly PeerNetworkPeer[];
  readonly validators: readonly ValidatorInfo[];
  readonly warning: string;
};

type BlockDetailData = {
  readonly block: BlockResult;
  readonly health: HealthResult | null;
  readonly loadedAt: number;
  readonly roundTripMs: number;
};

type RowTone = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const unavailableText = '不可用';
const rpcFieldNotProvidedText = '未提供';
const transactionFilterOptions = ['全部', '转账', '隐私', '合约', 'DPoS', '交易'] as const;
type TransactionFilterOption = (typeof transactionFilterOptions)[number];
const validatorFilterOptions = ['全部', '在线', '低佣金', '推荐'] as const;
type ValidatorFilterOption = (typeof validatorFilterOptions)[number];
type BlockTransactionDisplay = {
  readonly amountText: string;
  readonly feeText: string;
  readonly iconName: BlockDetailIconName;
  readonly kindLabel: string;
  readonly statusText: string;
  readonly title: string;
};

export type ValidatorOperationMode = 'commission' | 'delegate' | 'stake' | 'undelegate' | 'unstake' | 'withdrawDelegation' | 'withdrawUnstaked';

const validatorOperationOptions: readonly { key: ValidatorOperationMode; label: string }[] = [
  { key: 'delegate', label: '委托质押' },
  { key: 'stake', label: '自质押' },
  { key: 'undelegate', label: '解除委托' },
  { key: 'unstake', label: '撤回自质押' },
  { key: 'withdrawDelegation', label: '领取委托' },
  { key: 'withdrawUnstaked', label: '领取自质押' },
  { key: 'commission', label: '调整佣金' }
];

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function createInitialQueryState<T>(): QueryState<T> {
  return { data: null, error: '', loading: true };
}

export function TransactionHistoryScreen({
  bottomPadding,
  currentWalletAddress,
  onBackPress,
  onTransactionDetailPress,
  rpcEndpoint,
  topPadding
}: ChainScreenBaseProps & {
  readonly currentWalletAddress: string | null;
  readonly onTransactionDetailPress?: (detailData: TransactionDetailData) => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [queryState, setQueryState] = useState<QueryState<AccountTransactionHistoryResult>>(() => createInitialQueryState());
  const [signature, setSignature] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<TransactionFilterOption>('全部');
  const [queryMessage, setQueryMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (currentWalletAddress === null) {
        setQueryState({ data: createEmptyHistoryResult(null), error: '当前钱包不存在', loading: false });
        return;
      }

      try {
        const [history, localRecords] = await Promise.all([
          client.getAddressTransactions(currentWalletAddress, 20),
          loadLocalTransactionRecords(currentWalletAddress)
        ]);
        if (!cancelled) {
          setQueryState({ data: mergeLocalTransactionRecords(history, localRecords), error: '', loading: false });
        }
      } catch (error) {
        if (!cancelled) {
          const localRecords = await loadLocalTransactionRecordsSafely(currentWalletAddress);
          const fallbackHistory = mergeLocalTransactionRecords(createEmptyHistoryResult(currentWalletAddress), localRecords);
          setQueryState({ data: fallbackHistory, error: formatError(error), loading: false });
        }
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [client, currentWalletAddress, reloadNonce]);

  const handleQueryTransaction = async () => {
    if (signature.trim().length === 0) {
      setQueryMessage('请输入交易签名');
      return;
    }

    try {
      const detail = await client.getTransaction(signature);
      onTransactionDetailPress?.(mapRpcTransactionToDetailData(detail));
      setQueryMessage(detail.found ? '交易已找到' : '交易未找到');
    } catch (error) {
      setQueryMessage(formatError(error));
    }
  };

  const handleLoadMore = async () => {
    const currentHistory = queryState.data;
    if (currentWalletAddress === null || !currentHistory?.has_more || !currentHistory.next_cursor) {
      setQueryMessage('没有更多链上记录');
      return;
    }

    setQueryState({ data: currentHistory, error: '', loading: true });
    try {
      const nextHistory = await client.getAddressTransactions(currentWalletAddress, 20, currentHistory.next_cursor);
      setQueryState({
        data: mergeLocalTransactionRecords({
          ...nextHistory,
          records: [...currentHistory.records, ...nextHistory.records]
        }, []),
        error: '',
        loading: false
      });
    } catch (error) {
      setQueryState({ data: currentHistory, error: formatError(error), loading: false });
    }
  };

  const handleRetryHistory = () => {
    setQueryState({ data: queryState.data, error: '', loading: true });
    setReloadNonce((currentValue) => currentValue + 1);
  };

  const handleExportUnavailable = () => {
    setQueryMessage('导出 CSV 暂不可用：当前运行环境未提供文件写入入口');
  };

  const historyRecords = queryState.data?.records ?? [];
  const visibleRecords = filterTransactionRecords(historyRecords, signature, selectedFilter);
  const groupedRecords = groupTransactionRecords(visibleRecords);
  const monthlySummary = createTransactionSummary(historyRecords);

  return (
    <ExplorerShell bottomPadding={bottomPadding} onBackPress={onBackPress} subtitle="全部链上活动与本地签名记录" title="交易历史" topPadding={topPadding}>
      <TransactionHistoryHero
        currentWalletAddress={currentWalletAddress}
        hasError={queryState.error.length > 0}
        summary={monthlySummary}
      />
      <View style={styles.searchPanel}>
        <View style={styles.searchRow}>
          <MaterialCommunityIcons color={colors.textSoft} name="magnify" size={scaled(30, layoutMetrics.scale)} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSignature}
            placeholder="搜索签名 / 地址 / 合约"
            placeholderTextColor="#8D93A1"
            style={styles.searchInput}
            underlineColorAndroid="transparent"
            value={signature}
          />
          <Pressable accessibilityRole="button" onPress={handleQueryTransaction} style={styles.miniActionButton}>
            <Text style={styles.miniActionText}>查询</Text>
          </Pressable>
        </View>
        <FilterTabs options={transactionFilterOptions} selectedOption={selectedFilter} onSelect={setSelectedFilter} />
      </View>
      {queryMessage.length > 0 ? <InfoMessage text={queryMessage} /> : null}
      {queryState.loading ? <InfoMessage text="正在同步交易历史" /> : null}
      {queryState.error.length > 0 ? <InfoMessage text={queryState.error} tone="error" /> : null}
      {groupedRecords.length > 0 ? (
        <View style={styles.stackGap}>
          {groupedRecords.map((group) => (
            <TransactionHistoryGroupCard
              currentWalletAddress={currentWalletAddress}
              group={group}
              key={group.title}
              onTransactionDetailPress={onTransactionDetailPress}
            />
          ))}
        </View>
      ) : <TransactionHistoryEmptyCard hasError={queryState.error.length > 0} />}
      <ButtonRow buttons={[
        {
          iconName: 'refresh',
          label: queryState.error.length > 0 ? '重试历史' : '加载更多',
          onPress: queryState.error.length > 0 ? handleRetryHistory : handleLoadMore,
          variant: 'primary'
        },
        { iconName: 'download-outline', label: '导出 CSV', onPress: handleExportUnavailable }
      ]} />
      <Text style={styles.footnote}>已加载当前 RPC 返回的记录，手续费字段缺失时不做估算。</Text>
    </ExplorerShell>
  );
}

export function BlockDetailScreen({
  bottomPadding,
  initialSlot,
  onBackPress,
  onTransactionHistoryPress,
  onValidatorListPress,
  rpcEndpoint,
  topPadding
}: ChainScreenBaseProps & {
  readonly initialSlot?: number | null;
  readonly onTransactionHistoryPress?: () => void;
  readonly onValidatorListPress?: () => void;
}) {
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);
  const [, setCopyMessage] = useState('');
  const [slotInput, setSlotInput] = useState(initialSlot && initialSlot > 0 ? String(initialSlot) : '');
  const [queryState, setQueryState] = useState<QueryState<BlockDetailData>>({ data: null, error: '', loading: true });

  const loadBlockDetail = async (slot: number) => {
    if (!Number.isSafeInteger(slot) || slot <= 0) {
      setQueryState({ data: null, error: 'Slot 必须是正整数', loading: false });
      return;
    }

    setQueryState({ data: null, error: '', loading: true });
    const startedAt = Date.now();
    try {
      const [rawBlock, healthResult] = await Promise.all([
        client.getBlock(slot),
        client.getHealth().catch(() => null)
      ]);
      const block = await resolveBlockLeaderFromTransaction(client, rawBlock);
      setQueryState({
        data: { block, health: healthResult, loadedAt: Date.now(), roundTripMs: Date.now() - startedAt },
        error: '',
        loading: false
      });
    } catch (error) {
      setQueryState({ data: null, error: formatError(error), loading: false });
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitialBlock() {
      try {
        const resolvedSlot = initialSlot && initialSlot > 0 ? initialSlot : (await client.getHealth()).head_slot;
        if (cancelled) {
          return;
        }
        await loadBlockDetail(resolvedSlot);
      } catch (error) {
        if (!cancelled) {
          setQueryState({ data: null, error: formatError(error), loading: false });
        }
      }
    }

    void loadInitialBlock();
    return () => {
      cancelled = true;
    };
  }, [client, initialSlot]);

  const handleCopyBlockHash = async () => {
    const blockHash = queryState.data?.block.blockhash;
    if (!blockHash) {
      setCopyMessage('当前区块哈希不可用');
      return;
    }

    try {
      const result = await copyTextToClipboard(blockHash, '已复制区块哈希');
      setCopyMessage(result.message);
    } catch (error) {
      setCopyMessage(formatError(error));
    }
  };

  const handleQueryBlockSlot = () => {
    const normalizedSlot = Number(slotInput.trim());
    void loadBlockDetail(normalizedSlot);
  };

  const block = queryState.data?.block;
  const transactionCount = String(block?.transactions?.length ?? 0);

  return (
    <ExplorerShell bottomPadding={bottomPadding} onBackPress={onBackPress} subtitle={block ? `Height ${block.slot} · Slot ${block.slot}` : '按 Slot 查询区块'} title="区块详情" topPadding={topPadding}>
      <BlockDetailHero detail={queryState.data} />
      <BlockSlotQueryPanel onChangeText={setSlotInput} onSubmit={handleQueryBlockSlot} value={slotInput} />
      <QueryBody state={queryState} emptyText="请输入 slot 查询区块">
        {(detail) => (
          <>
            <BlockHashPanel block={detail.block} onCopyBlockHash={handleCopyBlockHash} />
            <BlockValidatorPanel block={detail.block} onValidatorListPress={onValidatorListPress} />
            <BlockTransactionPanel block={detail.block} transactionCount={transactionCount} />
            <BlockRuntimePanel
              block={detail.block}
              confirmationText={createConfirmationText(detail.health, detail.block.slot)}
              finalizedHeight={detail.health ? formatNumber(detail.health.finalized_height) : unavailableText}
              rpcEndpoint={client.endpoint}
            />
          </>
        )}
      </QueryBody>
      <BlockDetailButtonRow
        onCopyBlockHash={handleCopyBlockHash}
        onTransactionHistoryPress={onTransactionHistoryPress}
      />
    </ExplorerShell>
  );
}

export function ChainStatusScreen({
  bottomPadding,
  onBlockDetailPress,
  onBackPress,
  onNetworkPress,
  onRpcNodePress,
  rpcEndpoint,
  topPadding
}: ChainScreenBaseProps & {
  readonly onBlockDetailPress?: (slot?: number | null) => void;
  readonly onNetworkPress?: () => void;
  readonly onRpcNodePress?: () => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [queryState, setQueryState] = useState<QueryState<ChainStatusData>>(() => createInitialQueryState());

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const startedAt = Date.now();
        const [health, node] = await Promise.all([client.getHealth(), client.getNodeStatus()]);
        const latestBlocks = await loadLatestBlocks(client, health.head_slot);
        if (!cancelled) {
          setQueryState({
            data: { health, latestBlocks, loadedAt: Date.now(), node, roundTripMs: Date.now() - startedAt },
            error: '',
            loading: false
          });
        }
      } catch (error) {
        if (!cancelled) {
          setQueryState({ data: null, error: formatError(error), loading: false });
        }
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [client, reloadNonce]);

  const handleRefresh = () => {
    // 功能目的：刷新链状态；实现原因：高度和 slot 属于实时数据，不能复用旧快照。
    setQueryState({ data: queryState.data, error: '', loading: true });
    setReloadNonce((currentValue) => currentValue + 1);
  };

  const visibleData = queryState.data ?? createUnavailableChainStatusData();
  const latestSlot = queryState.data?.health.head_slot ?? null;

  return (
    <ExplorerShell bottomPadding={bottomPadding} onBackPress={onBackPress} subtitle="高度、最终性、出块状态" title="链状态" topPadding={topPadding}>
      {queryState.loading ? <InfoMessage text="正在刷新链状态" /> : null}
      {queryState.error.length > 0 ? <InfoMessage text={queryState.error} tone="error" /> : null}
      <ChainStatusContent
        data={visibleData}
        onBlockDetailPress={onBlockDetailPress}
        rpcEndpoint={client.endpoint}
        styles={styles}
      />
      <ButtonRow buttons={[
        { iconName: 'refresh', label: '刷新状态', onPress: handleRefresh, variant: 'primary' },
        { iconName: 'cube-outline', label: '查看最新区块', onPress: () => onBlockDetailPress?.(latestSlot) }
      ]} />
      <ButtonRow buttons={[
        { iconName: 'lan', label: '网络拓扑', onPress: onNetworkPress },
        { iconName: 'server-network', label: 'RPC 节点', onPress: onRpcNodePress }
      ]} />
      <Text style={styles.footnote}>数据来自当前 RPC 节点，仅供参考；TPS 和 Epoch 时间缺字段时不估算。</Text>
    </ExplorerShell>
  );
}

function ChainStatusContent({
  data,
  onBlockDetailPress,
  rpcEndpoint,
  styles
}: {
  readonly data: ChainStatusData;
  readonly onBlockDetailPress?: (slot?: number | null) => void;
  readonly rpcEndpoint: string;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      <ExplorerHeroCard
        backgroundSource={explorerImages.chainStatusBackground}
        footerMetrics={[
          { label: 'Mempool', value: formatNumberOrUnavailable(data.health.mempool_size) },
          { label: 'Finality', value: data.health.ok ? createFinalityLagText(data.health) : unavailableText },
          { label: '出块延迟', value: data.roundTripMs > 0 ? `${data.roundTripMs}ms` : unavailableText },
          { label: '最近区块', value: data.latestBlocks.length > 0 ? '已同步' : unavailableText }
        ]}
        metrics={[
          { label: '当前高度', value: formatNumberOrUnavailable(data.health.head_height) },
          { label: '当前 Slot', value: formatNumberOrUnavailable(data.health.head_slot) },
          { label: 'Finalized 高度', value: formatNumberOrUnavailable(data.health.finalized_height) },
          { label: '当前 Epoch', value: data.node.epoch_id !== undefined ? String(data.node.epoch_id) : unavailableText },
          { label: '平均出块时间', value: unavailableText },
          { label: '网络 TPS', value: unavailableText }
        ]}
        primaryLabel="当前网络"
        primaryValue="Mainnet Beta"
        statusLabel={data.health.ok ? '链运行正常' : '链状态待同步'}
        statusTone={data.health.ok ? 'success' : 'warning'}
        subtitle={`当前 RPC ${shortValue(rpcEndpoint)}`}
        title="链运行状态"
      />
      <ExplorerCard actionLabel="查看更多" onActionPress={() => onBlockDetailPress?.(data.health.head_slot || null)} title="最近区块出块">
        <RecentBlockTable blocks={data.latestBlocks} />
      </ExplorerCard>
      <ExplorerCard title="当前 Epoch 进度">
        <View style={styles.epochRow}>
          <View>
            <Text style={styles.epochTitle}>Epoch {data.node.epoch_id ?? unavailableText}</Text>
            <Text style={styles.epochMeta}>开始/结束时间未由当前 RPC 返回</Text>
          </View>
          <Text style={styles.epochRemaining}>进度不可用</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressUnavailable} />
        </View>
        <MetricGrid items={[
          { label: '已确认 Slot', value: formatNumberOrUnavailable(data.health.head_slot) },
          { label: '剩余 Slot', value: unavailableText },
          { label: '下一 Epoch 验证者', value: formatNumberOrUnavailable(data.node.consensus.validator_count || data.node.validator_count) }
        ]} />
      </ExplorerCard>
      <ExplorerCard title="链健康状态">
        <HealthStatusGrid
          items={[
            { label: '分叉风险', meta: data.health.ok ? '正常' : '待检测', tone: data.health.ok ? 'success' : 'warning' },
            { label: '状态根同步', meta: data.node.consensus.available ? '正常' : '不可用', tone: data.node.consensus.available ? 'success' : 'warning' },
            { label: '交易回放', meta: data.health.mempool_size > 0 ? `${data.health.mempool_size} 笔` : unavailableText, tone: data.health.ok ? 'success' : 'warning' },
            { label: '快照高度', meta: formatNumberOrUnavailable(data.health.finalized_height), tone: data.health.ok ? 'primary' : 'warning' }
          ]}
        />
      </ExplorerCard>
    </>
  );
}

export function NetworkStatusScreen({
  bottomPadding,
  onBackPress,
  onRpcEndpointSelect,
  onRpcNodePress,
  onRpcSwitchPress,
  rpcEndpoint,
  topPadding
}: ChainScreenBaseProps & {
  readonly onRpcEndpointSelect?: (endpoint: string) => void;
  readonly onRpcNodePress?: () => void;
  readonly onRpcSwitchPress?: () => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);
  const [copyMessage, setCopyMessage] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);
  const [queryState, setQueryState] = useState<QueryState<NetworkStatusData>>(() => createInitialQueryState());

  useEffect(() => {
    let cancelled = false;

    async function loadNetwork() {
      try {
        const startedAt = Date.now();
        const [health, node, network] = await Promise.all([
          client.getHealth(),
          client.getNodeStatus(),
          client.getPeerNetwork()
        ]);
        if (!cancelled) {
          setQueryState({
            data: { health, loadedAt: Date.now(), network, node, roundTripMs: Date.now() - startedAt },
            error: '',
            loading: false
          });
        }
      } catch (error) {
        if (!cancelled) {
          setQueryState({ data: null, error: formatError(error), loading: false });
        }
      }
    }

    void loadNetwork();
    return () => {
      cancelled = true;
    };
  }, [client, reloadNonce]);

  const handleRefresh = () => {
    setQueryState({ data: queryState.data, error: '', loading: true });
    setReloadNonce((currentValue) => currentValue + 1);
  };

  const handleCopyRpcEndpoint = async () => {
    try {
      const result = await copyTextToClipboard(client.endpoint, '已复制 RPC 地址');
      setCopyMessage(result.message);
    } catch (error) {
      setCopyMessage(formatError(error));
    }
  };

  const visibleData = queryState.data ?? createUnavailableNetworkStatusData();

  return (
    <ExplorerShell bottomPadding={bottomPadding} onBackPress={onBackPress} subtitle="RPC、P2P、转发链路" title="网络状态" topPadding={topPadding}>
      {copyMessage.length > 0 ? <InfoMessage text={copyMessage} /> : null}
      {queryState.loading ? <InfoMessage text="正在检测网络状态" /> : null}
      {queryState.error.length > 0 ? <InfoMessage text={queryState.error} tone="error" /> : null}
      <NetworkStatusContent
        client={client}
        data={visibleData}
        onCopyRpcEndpoint={handleCopyRpcEndpoint}
        onRpcEndpointSelect={onRpcEndpointSelect}
        onRpcNodePress={onRpcNodePress}
        onRpcSwitchPress={onRpcSwitchPress}
      />
      <ButtonRow buttons={[
        { iconName: 'refresh', label: '重新检测', onPress: handleRefresh, variant: 'primary' },
        { iconName: 'swap-horizontal', label: '切换 RPC', onPress: onRpcSwitchPress }
      ]} />
      <Text style={styles.footnote}>仅当前 RPC 会被实时检测，其他配置节点未检测时显示为不可用。</Text>
    </ExplorerShell>
  );
}

function NetworkStatusContent({
  client,
  data,
  onCopyRpcEndpoint,
  onRpcEndpointSelect,
  onRpcNodePress,
  onRpcSwitchPress
}: {
  readonly client: JsonRpcClient;
  readonly data: NetworkStatusData;
  readonly onCopyRpcEndpoint: () => void;
  readonly onRpcEndpointSelect?: (endpoint: string) => void;
  readonly onRpcNodePress?: () => void;
  readonly onRpcSwitchPress?: () => void;
}) {
  return (
    <>
      <ExplorerHeroCard
        backgroundSource={explorerImages.networkStatusBackground}
        metrics={[
          { label: '延迟', value: data.roundTripMs > 0 ? `${data.roundTripMs}ms` : unavailableText },
          { label: '在线率', value: createOnlineRateText(data.network.peers) },
          { label: '验证者连接', value: createValidatorReachabilityText(data.network.peers, data.node) },
          { label: '转发链路', value: data.node.rpc_forwarding || data.node.transaction_fast_path.fast_path_available ? '转发正常' : unavailableText }
        ]}
        primaryLabel="当前连接端点"
        primaryValue={client.endpoint}
        statusLabel={data.health.ok ? '公网 RPC 正常' : '公网 RPC 待检测'}
        statusTone={data.health.ok ? 'success' : 'warning'}
        subtitle={`本地 Peer ${shortValue(data.network.local_peer_id)}`}
        title="网络状态"
      />
      <ExplorerCard title="连接路径">
        <ConnectionPath data={data} />
      </ExplorerCard>
      <ExplorerCard actionLabel="+ 添加自定义节点" onActionPress={onRpcSwitchPress} title="RPC 节点">
        <RpcEndpointTable
          currentEndpoint={client.endpoint}
          data={data}
          onCopyPress={onCopyRpcEndpoint}
          onEndpointSelect={onRpcEndpointSelect}
          onRpcNodePress={onRpcNodePress}
        />
      </ExplorerCard>
      <MetricGrid items={[
        { label: 'Known Peers', value: formatNumberOrUnavailable(data.network.peers.length) },
        { label: 'Connected Peers', value: formatNumberOrUnavailable(countConnectedPeers(data.network.peers)) },
        { label: 'Secure Sessions', value: data.node.p2p_secure_session ? String(countConnectedPeers(data.network.peers)) : unavailableText },
        { label: 'Relay Queue', value: unavailableText },
        { label: 'Dropped Tx', value: unavailableText }
      ]} />
      <ExplorerCard title="验证者可达性">
        <ValidatorReachabilityTable peers={data.network.peers} />
      </ExplorerCard>
      <ExplorerCard title="故障切换策略">
        <HealthStatusGrid
          items={[
            { label: '当前策略', meta: '自动', tone: 'primary' },
            { label: '超时阈值', meta: `${client.timeoutMillis / 1000}s`, tone: 'default' },
            { label: '重试次数', meta: unavailableText, tone: 'warning' },
            { label: '最近切换', meta: unavailableText, tone: 'muted' }
          ]}
        />
      </ExplorerCard>
    </>
  );
}

export function RpcNodeDetailScreen({ bottomPadding, onBackPress, rpcEndpoint, topPadding }: ChainScreenBaseProps) {
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);
  const [copyMessage, setCopyMessage] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);
  const [queryState, setQueryState] = useState<QueryState<RpcNodeDetailData>>(() => createInitialQueryState());

  useEffect(() => {
    let cancelled = false;

    async function loadRpcNode() {
      try {
        const startedAt = Date.now();
        const [health, node] = await Promise.all([client.getHealth(), client.getNodeStatus()]);
        if (!cancelled) {
          setQueryState({
            data: { health, loadedAt: Date.now(), node, roundTripMs: Date.now() - startedAt },
            error: '',
            loading: false
          });
        }
      } catch (error) {
        if (!cancelled) {
          setQueryState({ data: null, error: formatError(error), loading: false });
        }
      }
    }

    void loadRpcNode();
    return () => {
      cancelled = true;
    };
  }, [client, reloadNonce]);

  const handleRefresh = () => {
    setQueryState({ data: queryState.data, error: '', loading: true });
    setReloadNonce((currentValue) => currentValue + 1);
  };

  const handleCopyRpcEndpoint = async () => {
    try {
      const result = await copyTextToClipboard(client.endpoint, '已复制节点地址');
      setCopyMessage(result.message);
    } catch (error) {
      setCopyMessage(formatError(error));
    }
  };

  const handleSetCurrentRpc = () => {
    setCopyMessage('当前应用已在使用此 RPC');
  };

  const visibleData = queryState.data ?? createUnavailableRpcNodeDetailData();

  return (
    <ExplorerShell bottomPadding={bottomPadding} onBackPress={onBackPress} subtitle="公网入口 · bootnode-101" title="RPC 节点详情" topPadding={topPadding}>
      {copyMessage.length > 0 ? <InfoMessage text={copyMessage} /> : null}
      {queryState.loading ? <InfoMessage text="正在检测 RPC 节点" /> : null}
      {queryState.error.length > 0 ? <InfoMessage text={queryState.error} tone="error" /> : null}
      <RpcNodeDetailContent
        client={client}
        data={visibleData}
        onCopyEndpoint={handleCopyRpcEndpoint}
        onRefresh={handleRefresh}
        onSetCurrentRpc={handleSetCurrentRpc}
      />
    </ExplorerShell>
  );
}

// 功能目的：承载 RPC 详情专用结构；实现原因：避免通用详情卡片压缩设计稿中的信息层级。
function RpcNodeDetailContent({
  client,
  data,
  onCopyEndpoint,
  onRefresh,
  onSetCurrentRpc
}: {
  readonly client: JsonRpcClient;
  readonly data: RpcNodeDetailData;
  readonly onCopyEndpoint: () => void;
  readonly onRefresh: () => void;
  readonly onSetCurrentRpc: () => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <>
      <RpcDetailHeroCard data={data} endpoint={client.endpoint} onCopyEndpoint={onCopyEndpoint} />
      <RpcCapabilityCard node={data.node} />
      <RpcPerformanceCard data={data} />
      <RpcUpstreamValidatorCard node={data.node} />
      <RpcSecurityBoundaryCard />
      <RpcRuntimeLogCard data={data} />
      <RpcDetailActionBar onCopyEndpoint={onCopyEndpoint} onRefresh={onRefresh} onSetCurrentRpc={onSetCurrentRpc} />
      <Text style={styles.rpcFootnote}>节点负载、QPS、拒绝请求未由当前 RPC 返回时保持不可用。</Text>
    </>
  );
}

function RpcDetailHeroCard({
  data,
  endpoint,
  onCopyEndpoint
}: {
  readonly data: RpcNodeDetailData;
  readonly endpoint: string;
  readonly onCopyEndpoint: () => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const roleBadges = createRpcRoleBadges(data.node);
  const statusText = data.health.ok ? '正常' : '待检测';
  const statusTone = data.health.ok ? 'success' : 'warning';
  const latencyText = data.roundTripMs > 0 ? `${data.roundTripMs}ms` : unavailableText;
  const syncHeight = formatNumberOrUnavailable(data.node.head_slot || data.health.head_slot);
  const securityText = createRpcSecurityText(endpoint, data.node);

  return (
    <View style={styles.rpcHeroCard}>
      <Image resizeMode="cover" source={explorerImages.rpcNodeBackground} style={styles.heroImage} />
      <LinearGradient colors={['#050507FA', '#050507E8', '#05050738']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <View style={styles.rpcHeroContent}>
        <Text style={styles.rpcHeroLabel}>节点地址</Text>
        <View style={styles.rpcEndpointRow}>
          <Text adjustsFontSizeToFit minimumFontScale={0.62} numberOfLines={1} style={styles.rpcEndpointText}>{endpoint}</Text>
          <Pressable accessibilityLabel="复制节点地址" accessibilityRole="button" onPress={onCopyEndpoint} style={styles.rpcHeroCopyButton}>
            <MaterialCommunityIcons color="#FFFFFF" name="content-copy" size={scaled(27, layoutMetrics.scale)} />
          </Pressable>
        </View>
        <View style={styles.rpcHeroStatusRow}>
          <View style={getToneStyle(statusTone, styles.rpcStatusDot, styles.rpcStatusDotWarning, styles.rpcStatusDotDanger)} />
          <Text style={getToneTextStyle(statusTone, styles.rpcStatusText, styles.rpcStatusTextSuccess, styles.rpcStatusTextWarning, styles.rpcStatusTextDanger)}>状态: {statusText}</Text>
          <View style={styles.rpcStatusDivider} />
          <Text style={styles.rpcStatusText}>延迟: {latencyText}</Text>
        </View>
        <View style={styles.rpcHeroDivider} />
        <View style={styles.rpcHeroMetricGrid}>
          <View style={styles.rpcHeroMetricCell}>
            <Text style={styles.rpcHeroMetricLabel}>同步高度</Text>
            <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.rpcHeroMetricValue}>{syncHeight}</Text>
          </View>
          <View style={styles.rpcHeroMetricCell}>
            <Text style={styles.rpcHeroMetricLabel}>角色</Text>
            <View style={styles.rpcRoleChipRow}>
              {roleBadges.map((role) => (
                <Text key={role} numberOfLines={1} style={styles.rpcRoleChip}>{role}</Text>
              ))}
            </View>
          </View>
          <View style={styles.rpcHeroMetricCell}>
            <Text style={styles.rpcHeroMetricLabel}>安全性</Text>
            <View style={styles.rpcHeroIconValueRow}>
              <MaterialCommunityIcons color={colors.success} name="shield-check-outline" size={scaled(24, layoutMetrics.scale)} />
              <Text numberOfLines={1} style={styles.rpcHeroMetricValue}>{securityText}</Text>
            </View>
          </View>
          <View style={styles.rpcHeroMetricCell}>
            <Text style={styles.rpcHeroMetricLabel}>当前负载</Text>
            <Text numberOfLines={1} style={styles.rpcHeroMetricValue}>{unavailableText}</Text>
            <View style={styles.rpcLoadTrack}>
              <View style={styles.rpcLoadEmpty} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function RpcCapabilityCard({ node }: { readonly node: NodeStatusResult }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const capabilityRows = createCapabilityRows(node);

  return (
    <RpcSectionCard iconName="view-grid-outline" title="功能能力">
      <View style={styles.rpcCapabilityGrid}>
        {capabilityRows.map((row) => (
          <RpcCapabilityItem enabled={row.enabled} key={row.title} meta={row.meta} title={row.title} />
        ))}
      </View>
    </RpcSectionCard>
  );
}

function RpcCapabilityItem({
  enabled,
  meta,
  title
}: {
  readonly enabled: boolean;
  readonly meta: string;
  readonly title: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const iconColor = enabled ? colors.success : colors.warning;

  return (
    <View style={styles.rpcCapabilityItem}>
      <View style={[styles.rpcCapabilityIconBadge, enabled ? styles.rpcCapabilityIconBadgeSuccess : styles.rpcCapabilityIconBadgeWarning]}>
        <MaterialCommunityIcons color={iconColor} name={enabled ? 'check-circle' : 'alert-circle-outline'} size={scaled(28, layoutMetrics.scale)} />
      </View>
      <View style={styles.rpcCapabilityTextBlock}>
        <Text numberOfLines={1} style={styles.rpcCapabilityTitle}>{title}</Text>
        <Text numberOfLines={1} style={enabled ? styles.rpcCapabilityMeta : styles.rpcCapabilityMetaWarning}>{meta}</Text>
      </View>
    </View>
  );
}

function RpcPerformanceCard({ data }: { readonly data: RpcNodeDetailData }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const metricItems = [
    { label: 'QPS', meta: '当前', value: unavailableText },
    { label: '突发限制', meta: '5秒内', value: unavailableText },
    { label: '排队交易', meta: '当前', value: formatNumberOrUnavailable(data.health.mempool_size) },
    { label: '拒绝请求', meta: '最近5分钟', value: unavailableText },
    { label: '平均响应', meta: '最近5分钟', value: data.roundTripMs > 0 ? `${data.roundTripMs}ms` : unavailableText }
  ];

  return (
    <RpcSectionCard iconName="speedometer" title="限流与性能">
      <View style={styles.rpcMetricStrip}>
        {metricItems.map((item) => (
          <RpcPerformanceMetric key={item.label} label={item.label} meta={item.meta} value={item.value} />
        ))}
      </View>
      <RpcPerformanceChart roundTripMs={data.roundTripMs} />
    </RpcSectionCard>
  );
}

function RpcPerformanceMetric({
  label,
  meta,
  value
}: {
  readonly label: string;
  readonly meta: string;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.rpcMetricCell}>
      <Text numberOfLines={1} style={styles.rpcMetricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.68} numberOfLines={1} style={styles.rpcMetricValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.rpcMetricMeta}>{meta}</Text>
    </View>
  );
}

// 功能目的：绘制响应曲线；实现原因：设计稿要求曲线图但不能使用整页切图。
function RpcPerformanceChart({ roundTripMs }: { readonly roundTripMs: number }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const points = [
    { x: 24, y: 122 },
    { x: 120, y: 106 },
    { x: 210, y: 116 },
    { x: 318, y: 72 },
    { x: 420, y: 92 },
    { x: 516, y: 58 },
    { x: 608, y: 82 }
  ];

  return (
    <View style={styles.rpcChartPanel}>
      <View style={styles.rpcChartHeader}>
        <Text style={styles.rpcChartTitle}>响应曲线</Text>
        <Text style={styles.rpcChartMeta}>最近检测 {roundTripMs > 0 ? `${roundTripMs}ms` : unavailableText}</Text>
      </View>
      <View style={styles.rpcChartBody}>
        <View style={styles.rpcChartYAxis}>
          <Text style={styles.rpcChartAxisText}>160</Text>
          <Text style={styles.rpcChartAxisText}>80</Text>
          <Text style={styles.rpcChartAxisText}>0</Text>
        </View>
        <View style={styles.rpcChartCanvas}>
          <Svg height="100%" style={styles.rpcChartSvg} viewBox="0 0 640 180" width="100%">
            <Line stroke="#E7EAF2" strokeWidth={1} x1={0} x2={640} y1={36} y2={36} />
            <Line stroke="#E7EAF2" strokeWidth={1} x1={0} x2={640} y1={92} y2={92} />
            <Line stroke="#E7EAF2" strokeWidth={1} x1={0} x2={640} y1={148} y2={148} />
            <Path d="M24 122 C88 112 92 102 120 106 C165 111 178 126 210 116 C260 98 276 72 318 72 C365 72 374 102 420 92 C466 82 480 52 516 58 C562 64 584 82 608 82" fill="none" stroke="#1E6BFF" strokeLinecap="round" strokeWidth={5} />
            <Path d="M24 122 C88 112 92 102 120 106 C165 111 178 126 210 116 C260 98 276 72 318 72 C365 72 374 102 420 92 C466 82 480 52 516 58 C562 64 584 82 608 82 L608 180 L24 180 Z" fill="#1E6BFF" opacity={0.08} />
            {points.map((point) => (
              <Circle cx={point.x} cy={point.y} fill="#FFFFFF" key={`${point.x}-${point.y}`} r={6} stroke="#1E6BFF" strokeWidth={4} />
            ))}
          </Svg>
        </View>
      </View>
      <View style={styles.rpcChartXAxis}>
        <Text style={styles.rpcChartAxisText}>18:10</Text>
        <Text style={styles.rpcChartAxisText}>18:14</Text>
        <Text style={styles.rpcChartAxisText}>18:18</Text>
        <Text style={styles.rpcChartAxisText}>18:24</Text>
      </View>
    </View>
  );
}

function RpcUpstreamValidatorCard({ node }: { readonly node: NodeStatusResult }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const upstreamIds = createRpcUpstreamIds(node);

  return (
    <RpcSectionCard iconName="database-outline" title="上游验证者">
      {upstreamIds.length > 0 ? (
        <View style={styles.rpcTable}>
          {upstreamIds.map((peerID, index) => (
            <RpcUpstreamValidatorRow index={index} key={`${peerID}-${index}`} peerID={peerID} />
          ))}
        </View>
      ) : (
        <InfoMessage text="当前 RPC 未返回上游验证者" />
      )}
    </RpcSectionCard>
  );
}

function RpcUpstreamValidatorRow({
  index,
  peerID
}: {
  readonly index: number;
  readonly peerID: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.rpcTableRow}>
      <View style={styles.rpcValidatorBadge}>
        <Text style={styles.rpcValidatorBadgeText}>V{index + 1}</Text>
      </View>
      <View style={styles.rpcTableMain}>
        <Text numberOfLines={1} style={styles.rpcTableTitle}>{shortValue(peerID)}</Text>
        <Text numberOfLines={1} style={styles.rpcTableMeta}>connected · last forwarded tx {unavailableText}</Text>
      </View>
      <Text style={styles.rpcTableLatency}>延迟 {unavailableText}</Text>
      <MaterialCommunityIcons color={colors.textSoft} name="chevron-right" size={scaled(30, layoutMetrics.scale)} />
    </View>
  );
}

function RpcSecurityBoundaryCard() {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const rows = [
    { iconName: 'key-variant' as MaterialIconName, label: '私钥存储', value: '钱包本地' },
    { iconName: 'shield-off-outline' as MaterialIconName, label: 'Slash / Jail', value: '不暴露' },
    { iconName: 'lock-outline' as MaterialIconName, label: '管理接口', value: '关闭' },
    { iconName: 'file-sign' as MaterialIconName, label: '部署请求', value: '仅已签名交易' }
  ];

  return (
    <RpcSectionCard iconName="shield-check-outline" title="安全边界">
      <View style={styles.rpcSecurityList}>
        {rows.map((row) => (
          <RpcSecurityBoundaryRow iconName={row.iconName} key={row.label} label={row.label} value={row.value} />
        ))}
      </View>
    </RpcSectionCard>
  );
}

function RpcSecurityBoundaryRow({
  iconName,
  label,
  value
}: {
  readonly iconName: MaterialIconName;
  readonly label: string;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.rpcSecurityRow}>
      <View style={styles.rpcSecurityIconBadge}>
        <MaterialCommunityIcons color={colors.violet} name={iconName} size={scaled(28, layoutMetrics.scale)} />
      </View>
      <Text numberOfLines={1} style={styles.rpcSecurityLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.rpcSecurityValue}>{value}</Text>
    </View>
  );
}

function RpcRuntimeLogCard({ data }: { readonly data: RpcNodeDetailData }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const slotText = `Slot ${formatNumberOrUnavailable(data.node.head_slot || data.health.head_slot)}`;
  const rows = [
    {
      iconName: 'send-check-outline' as MaterialIconName,
      label: 'forward tx ok',
      meta: data.node.transaction_fast_path.fast_path_available ? '转发到上游验证者' : unavailableText,
      value: slotText
    },
    {
      iconName: 'access-point-check' as MaterialIconName,
      label: 'peer heartbeat',
      meta: `known peers ${formatNumberOrUnavailable(data.node.known_peer_count)}`,
      value: formatTime(data.loadedAt)
    },
    {
      iconName: 'sync' as MaterialIconName,
      label: 'height sync',
      meta: `同步到高度 ${formatNumberOrUnavailable(data.node.head_height)}`,
      value: slotText
    }
  ];

  return (
    <RpcSectionCard iconName="clock-outline" title="运行日志">
      <View style={styles.rpcLogList}>
        {rows.map((row) => (
          <RpcRuntimeLogRow iconName={row.iconName} key={row.label} label={row.label} meta={row.meta} value={row.value} />
        ))}
      </View>
    </RpcSectionCard>
  );
}

function RpcRuntimeLogRow({
  iconName,
  label,
  meta,
  value
}: {
  readonly iconName: MaterialIconName;
  readonly label: string;
  readonly meta: string;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.rpcLogRow}>
      <View style={styles.rpcLogIconBadge}>
        <MaterialCommunityIcons color={colors.primary} name={iconName} size={scaled(27, layoutMetrics.scale)} />
      </View>
      <View style={styles.rpcLogMain}>
        <Text numberOfLines={1} style={styles.rpcLogTitle}>{label}</Text>
        <Text numberOfLines={1} style={styles.rpcLogMeta}>{meta}</Text>
      </View>
      <Text numberOfLines={1} style={styles.rpcLogValue}>{value}</Text>
      <MaterialCommunityIcons color={colors.textSoft} name="chevron-right" size={scaled(28, layoutMetrics.scale)} />
    </View>
  );
}

function RpcDetailActionBar({
  onCopyEndpoint,
  onRefresh,
  onSetCurrentRpc
}: {
  readonly onCopyEndpoint: () => void;
  readonly onRefresh: () => void;
  readonly onSetCurrentRpc: () => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.rpcActionBar}>
      <Pressable accessibilityRole="button" onPress={onSetCurrentRpc} style={styles.rpcPrimaryAction}>
        <MaterialCommunityIcons color="#FFFFFF" name="check-circle-outline" size={scaled(28, layoutMetrics.scale)} />
        <Text style={styles.rpcPrimaryActionText}>设为当前 RPC</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onCopyEndpoint} style={styles.rpcSecondaryAction}>
        <MaterialCommunityIcons color={colors.text} name="content-copy" size={scaled(28, layoutMetrics.scale)} />
        <Text style={styles.rpcSecondaryActionText}>复制节点地址</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.rpcRefreshAction}>
        <MaterialCommunityIcons color={colors.primary} name="refresh" size={scaled(29, layoutMetrics.scale)} />
        <Text style={styles.rpcRefreshActionText}>重新检测</Text>
      </Pressable>
    </View>
  );
}

function RpcSectionCard({
  children,
  iconName,
  title
}: {
  readonly children: ReactNode;
  readonly iconName: MaterialIconName;
  readonly title: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.rpcSectionCard}>
      <View style={styles.rpcSectionTitleRow}>
        <MaterialCommunityIcons color={colors.violet} name={iconName} size={scaled(25, layoutMetrics.scale)} />
        <Text style={styles.rpcSectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function ValidatorListScreen({
  bottomPadding,
  onBackPress,
  onValidatorPress,
  rpcEndpoint,
  topPadding
}: ChainScreenBaseProps & {
  readonly onValidatorPress?: (validatorAddress: string) => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);
  const [queryState, setQueryState] = useState<QueryState<ValidatorListData>>(() => createInitialQueryState());
  const [selectedFilter, setSelectedFilter] = useState<ValidatorFilterOption>('全部');
  const [searchText, setSearchText] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadValidators() {
      try {
        // 功能目的：分层加载验证者与可达性；实现原因：链上 active 不能代表 P2P 在线。
        const [validatorSetResult, healthResult, nodeResult, peerNetworkResult] = await Promise.allSettled([
          client.getValidatorSet(),
          client.getHealth(),
          client.getNodeStatus(),
          client.getPeerNetwork()
        ]);
        if (validatorSetResult.status === 'rejected') {
          throw validatorSetResult.reason;
        }

        const health = healthResult.status === 'fulfilled' ? healthResult.value : createUnavailableHealth();
        const node = nodeResult.status === 'fulfilled' ? nodeResult.value : createUnavailableNodeStatus();
        const peers = peerNetworkResult.status === 'fulfilled' ? peerNetworkResult.value.peers : [];
        const warning = createValidatorReachabilityWarning([healthResult, nodeResult, peerNetworkResult]);

        if (!cancelled) {
          setQueryState({
            data: {
              health,
              loadedAt: Date.now(),
              networkAvailable: peerNetworkResult.status === 'fulfilled',
              node,
              peers,
              validators: validatorSetResult.value.validators,
              warning
            },
            error: '',
            loading: false
          });
        }
      } catch (error) {
        if (!cancelled) {
          setQueryState({ data: null, error: formatError(error), loading: false });
        }
      }
    }

    void loadValidators();
    return () => {
      cancelled = true;
    };
  }, [client, reloadNonce]);

  const handleRefresh = () => {
    setQueryState({ data: queryState.data, error: '', loading: true });
    setReloadNonce((currentValue) => currentValue + 1);
  };

  const displayValidators = queryState.data
    ? createValidatorDisplayRows(
      queryState.data.validators,
      queryState.data.peers,
      queryState.data.node,
      queryState.data.health,
      queryState.data.networkAvailable
    )
    : [];
  const visibleValidators = filterValidatorRows(displayValidators, searchText, selectedFilter);
  const handleDelegateFirstValidator = () => {
    const validatorAddress = visibleValidators[0]?.account_address ?? displayValidators[0]?.account_address ?? '';
    if (validatorAddress.length > 0) {
      onValidatorPress?.(validatorAddress);
    }
  };

  return (
    <ExplorerShell bottomPadding={bottomPadding} onBackPress={onBackPress} subtitle="在线状态、权重、佣金" title="验证者" topPadding={topPadding}>
      <ValidatorListHero
        data={queryState.data}
        endpoint={client.endpoint}
        hasError={queryState.error.length > 0}
        validators={displayValidators}
      />
      {queryState.loading ? <InfoMessage text="正在同步验证者列表" /> : null}
      {queryState.error.length > 0 ? <InfoMessage text={queryState.error} tone="error" /> : null}
      {queryState.data?.warning ? <InfoMessage text={queryState.data.warning} /> : null}
      <ValidatorSearchPanel
        onFilterChange={setSelectedFilter}
        onSearchTextChange={setSearchText}
        searchText={searchText}
        selectedFilter={selectedFilter}
      />
      <ValidatorListCard onValidatorPress={onValidatorPress} validators={visibleValidators} />
      <ButtonRow buttons={[
        { iconName: 'shield-check-outline', label: '委托给选中验证者', onPress: handleDelegateFirstValidator, variant: 'primary' },
        { iconName: 'refresh', label: '刷新状态', onPress: handleRefresh }
      ]} />
      <Text style={styles.footnote}>数据每 30 秒自动更新</Text>
    </ExplorerShell>
  );
}

function ValidatorListHero({
  data,
  endpoint,
  hasError,
  validators
}: {
  readonly data: ValidatorListData | null;
  readonly endpoint: string;
  readonly hasError: boolean;
  readonly validators: readonly ValidatorDisplayRow[];
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const onlineCount = countOnlineValidatorRows(validators);
  const averageCommission = createAverageCommissionText(validators);
  const latestHeight = data ? formatNumberOrUnavailable(data.health.head_height || data.node.head_height) : unavailableText;
  const onlineTone = createValidatorOnlineTone(onlineCount, hasError, data?.networkAvailable ?? false);

  return (
    <View style={styles.validatorHero}>
      <Image resizeMode="cover" source={explorerImages.validatorBackground} style={styles.heroImage} />
      <LinearGradient colors={['#050507FA', '#050507E6', '#05050730']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <View style={styles.validatorHeroContent}>
        <View style={styles.validatorHeroTitleRow}>
          <MaterialCommunityIcons color={colors.success} name="shield-check-outline" size={scaled(36, layoutMetrics.scale)} />
          <Text style={styles.validatorHeroTitle}>验证者 {validators.length} 个</Text>
        </View>
        <Text numberOfLines={1} style={styles.validatorHeroEndpoint}>当前 RPC {shortValue(endpoint)}</Text>
        <View style={styles.validatorHeroMetricRow}>
          <ValidatorHeroMetric label="已连接" tone={onlineTone} value={String(onlineCount)} />
          <ValidatorHeroMetric label="平均佣金" value={averageCommission} />
          <ValidatorHeroMetric label="同步高度" value={latestHeight} />
        </View>
      </View>
    </View>
  );
}

function ValidatorHeroMetric({
  label,
  tone,
  value
}: {
  readonly label: string;
  readonly tone?: RowTone;
  readonly value: string;
}) {
  const styles = createStyles(useHomeResponsiveLayout().scale);

  return (
    <View style={styles.validatorHeroMetric}>
      <Text style={styles.validatorHeroMetricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={getToneTextStyle(tone, styles.validatorHeroMetricValue, styles.validatorHeroMetricValueSuccess, styles.validatorHeroMetricValueWarning, styles.validatorHeroMetricValueDanger)}>{value}</Text>
    </View>
  );
}

function ValidatorSearchPanel({
  onFilterChange,
  onSearchTextChange,
  searchText,
  selectedFilter
}: {
  readonly onFilterChange: (filter: ValidatorFilterOption) => void;
  readonly onSearchTextChange: (value: string) => void;
  readonly searchText: string;
  readonly selectedFilter: ValidatorFilterOption;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.validatorSearchPanel}>
      <View style={styles.validatorSearchRow}>
        <MaterialCommunityIcons color={colors.textSoft} name="magnify" size={scaled(31, layoutMetrics.scale)} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onSearchTextChange}
          placeholder="搜索验证者地址 / PeerID"
          placeholderTextColor="#8D93A1"
          style={styles.validatorSearchInput}
          underlineColorAndroid="transparent"
          value={searchText}
        />
        <MaterialCommunityIcons color={colors.textMuted} name="filter-variant" size={scaled(36, layoutMetrics.scale)} />
      </View>
      <View style={styles.validatorFilterRow}>
        {validatorFilterOptions.map((filter) => {
          const selected = filter === selectedFilter;
          return (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={filter} onPress={() => onFilterChange(filter)} style={selected ? styles.validatorFilterActive : styles.validatorFilter}>
              <Text style={selected ? styles.validatorFilterTextActive : styles.validatorFilterText}>{filter}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ValidatorListCard({
  onValidatorPress,
  validators
}: {
  readonly onValidatorPress?: (validatorAddress: string) => void;
  readonly validators: readonly ValidatorDisplayRow[];
}) {
  const styles = createStyles(useHomeResponsiveLayout().scale);

  return (
    <View style={styles.validatorListCard}>
      <Text style={styles.validatorListCount}>共 {validators.length} 个验证者</Text>
      {validators.length > 0 ? (
        validators.map((validator, index) => (
          <ValidatorListRow
            isLast={index === validators.length - 1}
            key={validator.account_address}
            onPress={() => onValidatorPress?.(validator.account_address)}
            validator={validator}
          />
        ))
      ) : (
        <InfoMessage text="当前筛选条件下暂无验证者" />
      )}
    </View>
  );
}

function ValidatorListRow({
  isLast,
  onPress,
  validator
}: {
  readonly isLast: boolean;
  readonly onPress?: () => void;
  readonly validator: ValidatorDisplayRow;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const addressText = shortValue(validator.account_address);
  const bestAddressText = shortValue(validator.staker_address ?? validator.account_address);
  const selfStake = validator.self_stake_lamports ?? validator.stake_lamports;
  const delegatedStake = validator.delegated_lamports ?? 0;
  const delegatorCount = validator.delegator_count ?? 0;
  const commissionText = `${Math.round((validator.commission_bps / 10000) * 100)}%`;
  const reachabilityDotStyle = getValidatorReachabilityDotStyle(validator.reachabilityStatus, styles);
  const reachabilityTextStyle = getValidatorReachabilityTextStyle(validator.reachabilityStatus, styles);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.validatorRow, isLast ? styles.validatorRowLast : null]}>
      <View style={styles.validatorRowHeader}>
        <View style={styles.validatorAvatar}>
          <Text style={styles.validatorAvatarText}>{validator.account_address.startsWith('3GT') ? 'AC' : 'VF'}</Text>
        </View>
        <View style={styles.validatorIdentity}>
          <View style={styles.validatorNameLine}>
            <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.validatorAddressText}>{addressText}</Text>
            <Text style={styles.validatorStatusChip}>{validator.status || 'unknown'}</Text>
          </View>
        </View>
        <View style={styles.validatorOnlineBadge}>
          <View style={reachabilityDotStyle} />
          <Text style={reachabilityTextStyle}>{validator.reachabilityLabel}</Text>
        </View>
        <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={scaled(30, layoutMetrics.scale)} />
      </View>
      <View style={styles.validatorMetricGrid}>
        <ValidatorRowMetric label="总权重" value={formatNumber(selfStake + delegatedStake)} />
        <ValidatorRowMetric label="自质押" value={formatNumber(selfStake)} />
        <ValidatorRowMetric label="委托质押" value={formatNumber(delegatedStake)} />
        <ValidatorRowMetric label="委托人数" value={formatNumber(delegatorCount)} />
      </View>
      <View style={styles.validatorSecondaryGrid}>
        <ValidatorRowMetric label="佣金" value={commissionText} />
        <ValidatorRowMetric label="最佳地址" value={bestAddressText} wide />
      </View>
    </Pressable>
  );
}

function ValidatorRowMetric({
  label,
  value,
  wide = false
}: {
  readonly label: string;
  readonly value: string;
  readonly wide?: boolean;
}) {
  const styles = createStyles(useHomeResponsiveLayout().scale);

  return (
    <View style={wide ? styles.validatorMetricWide : styles.validatorMetric}>
      <Text numberOfLines={1} style={styles.validatorMetricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.validatorMetricValue}>{value}</Text>
    </View>
  );
}

function getValidatorReachabilityDotStyle(
  reachabilityStatus: ValidatorDisplayRow['reachabilityStatus'],
  styles: ReturnType<typeof createStyles>
) {
  if (reachabilityStatus === 'offline') {
    return [styles.validatorOnlineDot, styles.validatorOnlineDotOffline];
  }

  if (reachabilityStatus === 'unknown') {
    return [styles.validatorOnlineDot, styles.validatorOnlineDotUnknown];
  }

  return styles.validatorOnlineDot;
}

function getValidatorReachabilityTextStyle(
  reachabilityStatus: ValidatorDisplayRow['reachabilityStatus'],
  styles: ReturnType<typeof createStyles>
) {
  if (reachabilityStatus === 'offline') {
    return [styles.validatorOnlineText, styles.validatorOnlineTextOffline];
  }

  if (reachabilityStatus === 'unknown') {
    return [styles.validatorOnlineText, styles.validatorOnlineTextUnknown];
  }

  return styles.validatorOnlineText;
}

export function ValidatorDetailStakeScreen({
  bottomPadding,
  currentWalletAddress,
  currentWalletSigningSeed,
  initialMode = 'delegate',
  onBackPress,
  onUnlockWalletPress,
  rpcEndpoint,
  topPadding,
  validatorAddress
}: ChainScreenBaseProps & {
  readonly currentWalletAddress: string | null;
  readonly currentWalletSigningSeed: string | null;
  readonly initialMode?: ValidatorOperationMode;
  readonly onUnlockWalletPress?: () => void;
  readonly validatorAddress: string;
}) {
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);
  const [portfolio, setPortfolio] = useState<WalletPortfolio>(() => createEmptyWalletPortfolio(currentWalletAddress));
  const [stakeDataError, setStakeDataError] = useState('');
  const [stakeDataLoading, setStakeDataLoading] = useState(true);
  const [amount, setAmount] = useState('10000000');
  const [mode, setMode] = useState<ValidatorOperationMode>(initialMode);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('操作提示');
  const [dialogMessage, setDialogMessage] = useState('正在提交质押交易。');
  const [dialogStatus, setDialogStatus] = useState('处理中');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedValidator = findPortfolioValidator(portfolio, validatorAddress);

  const refreshStakeSnapshot = useCallback(async (silent = false) => {
    if (!silent) {
      setStakeDataLoading(true);
    }

    try {
      // 功能目的：加载验证者详情页真实仓位；实现原因：委托成功后必须立即反映链上 pending stake。
      const nextPortfolio = await loadWalletPortfolio(currentWalletAddress, client);
      setPortfolio(nextPortfolio);
      setStakeDataError(nextPortfolio.chain.error);
    } catch (error) {
      setPortfolio(createEmptyWalletPortfolio(currentWalletAddress));
      setStakeDataError(formatError(error));
    } finally {
      setStakeDataLoading(false);
    }
  }, [client, currentWalletAddress]);

  useEffect(() => {
    void refreshStakeSnapshot(true);
  }, [refreshStakeSnapshot, validatorAddress]);

  const handleSubmitStake = async () => {
    const operationLabel = getValidatorOperationLabel(mode);
    if (isSubmitting) {
      return;
    }
    if (!currentWalletSigningSeed) {
      if (onUnlockWalletPress) {
        onUnlockWalletPress();
        return;
      }

      setDialogVisible(true);
      setDialogTitle('钱包未解锁');
      setDialogMessage('请先导入助记词解锁本机签名权限，再提交质押交易。');
      setDialogStatus('待处理');
      return;
    }

    setDialogVisible(true);
    setDialogTitle(operationLabel);
    setDialogMessage('正在获取最新区块哈希、本地签名并提交到当前 RPC。');
    setDialogStatus('提交中');
    setIsSubmitting(true);

    try {
      const result = await submitValidatorOperation({
        amount,
        client,
        mode,
        signingSeed: currentWalletSigningSeed,
        validatorAddress
      });
      await saveValidatorOperationHistorySnapshot({
        amountLamports: result.lamports,
        blockHeight: result.latestBlockhash.height,
        blockhash: result.latestBlockhash.blockhash,
        currentWalletAddress,
        finalized: false,
        location: 'mempool',
        mode,
        signature: result.signature,
        slot: result.latestBlockhash.slot,
        status: 'pending',
        validatorAddress
      });
      setDialogTitle('交易已提交');
      setDialogMessage(`${operationLabel}签名：${shortValue(result.signature)}，等待链上确认。`);
      setDialogStatus('处理中');
      const finalityClient = result.rpcEndpoint === undefined || result.rpcEndpoint === client.endpoint
        ? client
        : new JsonRpcClient(result.rpcEndpoint);
      const detail = await waitForTransactionFinality({
        client: finalityClient,
        delayMillis: 1200,
        maxAttempts: 20,
        signature: result.signature
      });

      if (detail?.found && detail.status !== 'pending' && detail.status !== 'not_found') {
        await saveValidatorOperationHistorySnapshot({
          amountLamports: result.lamports,
          blockHeight: detail.block_height,
          blockhash: detail.blockhash ?? result.latestBlockhash.blockhash,
          currentWalletAddress,
          finalized: detail.finalized,
          location: detail.location === 'block' || detail.location === 'mempool' ? detail.location : 'unknown',
          mode,
          signature: result.signature,
          slot: detail.slot,
          status: detail.status,
          validatorAddress
        });
        await refreshStakeSnapshot(true);
        setDialogTitle('交易已确认');
        setDialogMessage(`${operationLabel}已写入区块 ${formatNumberOrUnavailable(detail.block_height)}，签名：${shortValue(result.signature)}。`);
        setDialogStatus('成功');
        return;
      }

      setDialogMessage(`${operationLabel}签名：${shortValue(result.signature)}，当前 RPC 暂未返回最终确认，请稍后刷新仓位。`);
    } catch (error) {
      setDialogTitle('提交失败');
      setDialogMessage(formatError(error));
      setDialogStatus('失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectMode = (key: string) => {
    const nextMode = key as ValidatorOperationMode;
    setMode(nextMode);
    if (nextMode === 'commission') {
      setAmount('0');
      return;
    }
    if (mode === 'commission') {
      setAmount('10000000');
    }
  };

  return (
    <ExplorerShell bottomPadding={bottomPadding} onBackPress={onBackPress} subtitle={shortValue(validatorAddress)} title="验证者详情" topPadding={topPadding}>
      <ValidatorStakeHero isLoading={stakeDataLoading} validator={selectedValidator} validatorAddress={validatorAddress} />
      <ValidatorStakeMetricStrip portfolio={portfolio} validator={selectedValidator} />
      {stakeDataError.length > 0 ? <InfoMessage text={stakeDataError} tone="error" /> : null}
      <ValidatorPositionCard isLoading={stakeDataLoading} onRefresh={() => void refreshStakeSnapshot()} portfolio={portfolio} />
      <ValidatorStakeOperationCard
        amount={amount}
        availableSolText={portfolio.availableSolText}
        currentWalletSigningSeed={currentWalletSigningSeed}
        isSubmitting={isSubmitting}
        mode={mode}
        onAmountChange={setAmount}
        onModeChange={handleSelectMode}
        onSubmit={handleSubmitStake}
      />
      <InfoCard rows={[
        { label: '验证者地址', value: validatorAddress },
        { label: '钱包解锁', value: currentWalletSigningSeed ? '已解锁，可签名' : '未解锁，需重新导入助记词' },
        { label: '当前动作', value: getValidatorOperationDescription(mode) },
        { label: '提交方式', value: '本地签名 + 当前 RPC sendTransaction' }
      ]} />
      <OperationTipDialog
        blockEstimate={createDialogBlockEstimate(dialogStatus)}
        message={dialogMessage}
        onClose={() => setDialogVisible(false)}
        scale={1}
        statusText={dialogStatus}
        title={dialogTitle}
        visible={dialogVisible}
      />
    </ExplorerShell>
  );
}

function ValidatorStakeHero({
  isLoading,
  validator,
  validatorAddress
}: {
  readonly isLoading: boolean;
  readonly validator: WalletValidatorSummary | null;
  readonly validatorAddress: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const loadingText = isLoading ? '加载中' : unavailableText;

  return (
    <View style={styles.validatorStakeHero}>
      <Image resizeMode="cover" source={explorerImages.validatorBackground} style={styles.heroImage} />
      <LinearGradient colors={['#050507FA', '#050507E8', '#05050730']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <View style={styles.validatorStakeHeroContent}>
        <View style={styles.validatorStakeStatusRow}>
          <MaterialCommunityIcons color="#C7CCD6" name="shield-outline" size={scaled(30, layoutMetrics.scale)} />
          <Text style={styles.validatorStakeStatusText}>{validator?.reachabilityLabel ?? loadingText}</Text>
        </View>
        <View style={styles.validatorStakeAddressRow}>
          <Text adjustsFontSizeToFit minimumFontScale={0.68} numberOfLines={2} style={styles.validatorStakeAddress}>{validatorAddress}</Text>
          <MaterialCommunityIcons color="#FFFFFF" name="content-copy" size={scaled(27, layoutMetrics.scale)} />
        </View>
        <View style={styles.validatorStakeHeroMetricGrid}>
          <ValidatorStakeHeroMetric label="佣金" value={validator ? `${validator.commissionBps / 100}%` : loadingText} />
          <ValidatorStakeHeroMetric label="总权重" value={validator ? formatWalletLamports(validator.totalStakeLamports) : loadingText} />
          <ValidatorStakeHeroMetric label="自质押" value={validator ? formatWalletLamports(validator.selfStakeLamports) : loadingText} />
          <ValidatorStakeHeroMetric label="委托质押" value={validator ? formatWalletLamports(validator.delegatedLamports) : loadingText} />
        </View>
      </View>
    </View>
  );
}

function ValidatorStakeHeroMetric({ label, value }: { readonly label: string; readonly value: string }) {
  const styles = createStyles(useHomeResponsiveLayout().scale);
  return (
    <View style={styles.validatorStakeHeroMetric}>
      <Text style={styles.validatorStakeHeroMetricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.validatorStakeHeroMetricValue}>{value}</Text>
    </View>
  );
}

function ValidatorStakeMetricStrip({
  portfolio,
  validator
}: {
  readonly portfolio: WalletPortfolio;
  readonly validator: WalletValidatorSummary | null;
}) {
  const metrics = [
    { iconName: 'account-group-outline' as MaterialIconName, label: '委托人数', value: validator ? formatNumber(validator.delegatorCount) : unavailableText },
    { iconName: 'clock-outline' as MaterialIconName, label: '出块状态', value: portfolio.chain.isHealthy ? '正常' : '待检测' },
    { iconName: 'cube-outline' as MaterialIconName, label: '最近高度', value: formatNumberOrUnavailable(portfolio.chain.headHeight) },
    { iconName: 'shield-check-outline' as MaterialIconName, label: 'Slash 风险', value: createSlashRiskText(validator) }
  ];
  const styles = createStyles(useHomeResponsiveLayout().scale);

  return (
    <View style={styles.validatorStakeMetricStrip}>
      {metrics.map((metric) => (
        <ValidatorStakeStripMetric iconName={metric.iconName} key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </View>
  );
}

function ValidatorStakeStripMetric({
  iconName,
  label,
  value
}: {
  readonly iconName: MaterialIconName;
  readonly label: string;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.validatorStakeStripMetric}>
      <MaterialCommunityIcons color={colors.primary} name={iconName} size={scaled(30, layoutMetrics.scale)} />
      <Text numberOfLines={1} style={styles.validatorStakeStripLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.validatorStakeStripValue}>{value}</Text>
    </View>
  );
}

function ValidatorPositionCard({
  isLoading,
  onRefresh,
  portfolio
}: {
  readonly isLoading: boolean;
  readonly onRefresh: () => void;
  readonly portfolio: WalletPortfolio;
}) {
  const delegatedLockedLamports = portfolio.dpos.delegatedLamports + portfolio.dpos.delegatedPendingLamports;
  const loadingValue = isLoading ? '加载中' : '';
  const rows = [
    { label: '已委托', suffix: 'lamports', value: loadingValue || formatWalletLamports(delegatedLockedLamports) },
    { label: '待领取委托收益', suffix: 'lamports', value: loadingValue || formatWalletLamports(portfolio.dpos.delegatedRewardLamports) },
    { label: '冷却中', suffix: 'lamports', value: loadingValue || formatWalletLamports(portfolio.dpos.delegatedUnlockingLamports) },
    { label: '可用余额', suffix: 'SOL', value: loadingValue || portfolio.availableSolText }
  ];
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.validatorPositionCard}>
      <View style={styles.validatorPositionHeader}>
        <Text style={styles.validatorPositionTitle}>我的仓位</Text>
        <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.validatorPositionRefresh}>
          <MaterialCommunityIcons color={colors.textMuted} name="refresh" size={scaled(27, layoutMetrics.scale)} />
          <Text style={styles.validatorPositionRefreshText}>刷新</Text>
        </Pressable>
      </View>
      <View style={styles.validatorPositionGrid}>
        {rows.map((row) => (
          <View key={row.label} style={styles.validatorPositionMetric}>
            <Text numberOfLines={1} style={styles.validatorPositionLabel}>{row.label}</Text>
            <Text adjustsFontSizeToFit minimumFontScale={0.62} numberOfLines={1} style={styles.validatorPositionValue}>{row.value}</Text>
            <Text numberOfLines={1} style={styles.validatorPositionSuffix}>{row.suffix}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ValidatorStakeOperationCard({
  amount,
  availableSolText,
  currentWalletSigningSeed,
  isSubmitting,
  mode,
  onAmountChange,
  onModeChange,
  onSubmit
}: {
  readonly amount: string;
  readonly availableSolText: string;
  readonly currentWalletSigningSeed: string | null;
  readonly isSubmitting: boolean;
  readonly mode: ValidatorOperationMode;
  readonly onAmountChange: (value: string) => void;
  readonly onModeChange: (value: string) => void;
  readonly onSubmit: () => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const submitLabel = currentWalletSigningSeed ? createValidatorOperationSubmitLabel(mode) : '导入助记词解锁';
  const visibleSubmitLabel = isSubmitting ? '提交中' : submitLabel;

  return (
    <View style={styles.validatorOperationCard}>
      <View style={styles.validatorOperationHeader}>
        <Text style={styles.validatorOperationTitle}>{getValidatorOperationLabel(mode)}</Text>
        <Text numberOfLines={1} style={styles.validatorOperationBalance}>可用余额：{availableSolText} SOL</Text>
      </View>
      <View style={styles.validatorOperationGrid}>
        {validatorOperationOptions.map((option) => {
          const selected = option.key === mode;
          return (
            <Pressable accessibilityRole="button" key={option.key} onPress={() => onModeChange(option.key)} style={selected ? styles.validatorOperationChipActive : styles.validatorOperationChip}>
              <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={selected ? styles.validatorOperationChipTextActive : styles.validatorOperationChipText}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {requiresValidatorOperationAmount(mode) ? (
        <View style={styles.validatorAmountInputPanel}>
          <Text style={styles.validatorAmountLabel}>{getValidatorOperationInputLabel(mode)}</Text>
          <View style={styles.validatorAmountInputRow}>
            <TextInput
              keyboardType="number-pad"
              onChangeText={onAmountChange}
              placeholder={getValidatorOperationInputPlaceholder(mode)}
              placeholderTextColor="#8D93A1"
              style={styles.validatorAmountInput}
              underlineColorAndroid="transparent"
              value={amount}
            />
            <Text style={styles.validatorAmountUnit}>{mode === 'commission' ? 'bps' : 'lamports'}</Text>
            <View style={styles.validatorAmountDivider} />
            <Text style={styles.validatorAmountMax}>最大</Text>
          </View>
          <View style={styles.validatorRatioRow}>
            {['25%', '50%', '75%', '全部'].map((ratio) => (
              <Pressable accessibilityRole="button" key={ratio} style={styles.validatorRatioChip}>
                <Text style={styles.validatorRatioText}>{ratio}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.validatorEstimateRow}>
        <ValidatorEstimateMetric label="预计份额" value={requiresValidatorOperationAmount(mode) ? `${amount || '--'} lamports` : '-- lamports'} />
        <ValidatorEstimateMetric label="预计收益" value="-- SOL / epoch" />
        <ValidatorEstimateMetric label="解除锁定" value="约 2~3 个 epoch" />
      </View>
      <View style={styles.validatorStakeButtonRow}>
        <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={onSubmit} style={isSubmitting ? [styles.validatorStakePrimaryButton, styles.validatorStakePrimaryButtonDisabled] : styles.validatorStakePrimaryButton}>
          <Text style={styles.validatorStakePrimaryButtonText}>{visibleSubmitLabel}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onModeChange('withdrawDelegation')} style={styles.validatorStakeSecondaryButton}>
          <Text style={styles.validatorStakeSecondaryButtonText}>领取收益</Text>
        </Pressable>
      </View>
      <View style={styles.validatorStakeNoteRow}>
        <MaterialCommunityIcons color={colors.textSoft} name="shield-outline" size={scaled(26, layoutMetrics.scale)} />
        <Text style={styles.validatorStakeNote}>委托质押后，资金将锁定约 2~3 个 epoch 才可解除锁定。</Text>
      </View>
    </View>
  );
}

function ValidatorEstimateMetric({ label, value }: { readonly label: string; readonly value: string }) {
  const styles = createStyles(useHomeResponsiveLayout().scale);

  return (
    <View style={styles.validatorEstimateMetric}>
      <Text numberOfLines={1} style={styles.validatorEstimateLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.validatorEstimateValue}>{value}</Text>
    </View>
  );
}

function findPortfolioValidator(portfolio: WalletPortfolio, validatorAddress: string) {
  return portfolio.dpos.validators.find((validator) => validator.accountAddress === validatorAddress) ?? null;
}

function createSlashRiskText(validator: WalletValidatorSummary | null) {
  const status = validator?.status.trim().toLowerCase() ?? '';
  if (status.includes('jail') || status.includes('slash')) {
    return '风险';
  }
  return validator ? '正常' : unavailableText;
}

function createDialogBlockEstimate(dialogStatus: string) {
  if (dialogStatus === '失败') {
    return '未上链';
  }
  if (dialogStatus === '成功') {
    return '已上链';
  }
  return '预计 1-2 个区块';
}

async function saveValidatorOperationHistorySnapshot(input: {
  readonly amountLamports: bigint;
  readonly blockHeight: number;
  readonly blockhash: string;
  readonly currentWalletAddress: string | null;
  readonly finalized: boolean;
  readonly location: AccountTransactionRecordResult['location'];
  readonly mode: ValidatorOperationMode;
  readonly signature: string;
  readonly slot: number;
  readonly status: AccountTransactionRecordResult['status'];
  readonly validatorAddress: string;
}) {
  if (input.currentWalletAddress === null) {
    return;
  }

  try {
    // 功能目的：保存本机提交的 DPoS 历史；实现原因：当前 RPC 地址历史只返回余额变化，委托交易需要本地补齐。
    await saveLocalTransactionRecord({
      amountLamports: input.amountLamports,
      blockHeight: input.blockHeight,
      blockhash: input.blockhash,
      counterparty: input.validatorAddress,
      direction: 'outgoing',
      finalized: input.finalized,
      kind: createValidatorOperationHistoryKind(input.mode),
      location: input.location,
      ownerAddress: input.currentWalletAddress,
      signature: input.signature,
      slot: input.slot,
      status: input.status,
      submitTimeUnixMilli: Date.now()
    });
  } catch (error) {
    console.info('[transaction-history] save local dpos record failed', { message: formatError(error) });
  }
}

function createValidatorOperationHistoryKind(mode: ValidatorOperationMode): AccountTransactionRecordResult['kind'] {
  if (mode === 'commission') {
    return 'validator_commission';
  }

  if (mode === 'delegate' || mode === 'stake') {
    return 'stake_deposit';
  }

  return 'stake_withdraw';
}

async function submitValidatorOperation(input: {
  readonly amount: string;
  readonly client: JsonRpcClient;
  readonly mode: ValidatorOperationMode;
  readonly signingSeed: string | null;
  readonly validatorAddress: string;
}) {
  const baseInput = {
    client: input.client,
    signingSeed: input.signingSeed,
    validatorAddress: input.validatorAddress
  };

  if (input.mode === 'delegate') {
    return submitDelegateStakeTransaction({ ...baseInput, lamports: input.amount });
  }

  if (input.mode === 'stake') {
    return submitStakeTransaction({ ...baseInput, lamports: input.amount });
  }

  if (input.mode === 'undelegate') {
    return submitUndelegateStakeTransaction({ ...baseInput, lamports: input.amount });
  }

  if (input.mode === 'unstake') {
    return submitUnstakeTransaction({ ...baseInput, lamports: input.amount });
  }

  if (input.mode === 'withdrawDelegation') {
    return submitWithdrawDelegationTransaction({ ...baseInput, lamports: '0' });
  }

  if (input.mode === 'commission') {
    return submitUpdateValidatorCommissionTransaction({ ...baseInput, commissionBps: input.amount });
  }

  return submitWithdrawUnstakedTransaction({ ...baseInput, lamports: '0' });
}

function requiresValidatorOperationAmount(mode: ValidatorOperationMode) {
  return mode === 'commission' || mode === 'delegate' || mode === 'stake' || mode === 'undelegate' || mode === 'unstake';
}

function getValidatorOperationLabel(mode: ValidatorOperationMode) {
  const option = validatorOperationOptions.find((item) => item.key === mode);
  return option?.label ?? '质押操作';
}

function getValidatorOperationInputLabel(mode: ValidatorOperationMode) {
  return mode === 'commission' ? '佣金 bps' : `${getValidatorOperationLabel(mode)} lamports`;
}

function getValidatorOperationInputPlaceholder(mode: ValidatorOperationMode) {
  return mode === 'commission' ? '0..10000' : '不少于 10000000';
}

function createValidatorOperationSubmitLabel(mode: ValidatorOperationMode) {
  if (mode === 'delegate') {
    return '确认委托';
  }

  if (mode === 'stake') {
    return '确认自质押';
  }

  if (mode === 'withdrawDelegation' || mode === 'withdrawUnstaked') {
    return '确认领取';
  }

  if (mode === 'commission') {
    return '确认调整';
  }

  return '确认提交';
}

function getValidatorOperationDescription(mode: ValidatorOperationMode) {
  if (mode === 'withdrawDelegation') {
    return '领取已到解锁 epoch 的委托资金';
  }

  if (mode === 'withdrawUnstaked') {
    return '领取已到解锁 epoch 的自质押资金';
  }

  if (mode === 'commission') {
    return '调整委托奖励佣金，单位 bps，100 bps = 1%';
  }

  if (mode === 'undelegate') {
    return '将 active 委托转入解锁队列';
  }

  if (mode === 'unstake') {
    return '将 active 自质押转入解锁队列';
  }

  return mode === 'delegate' ? '新增委托质押' : '新增自质押';
}

export function ContractDeployConfirmScreen({
  bottomPadding,
  currentWalletAddress,
  currentWalletSigningSeed,
  onBackPress,
  onUnlockWalletPress,
  rpcEndpoint,
  scannedDeployPayload,
  topPadding
}: ChainScreenBaseProps & {
  readonly currentWalletAddress: string | null;
  readonly currentWalletSigningSeed: string | null;
  readonly onUnlockWalletPress?: () => void;
  readonly scannedDeployPayload?: string | null;
}) {
  const [requestId, setRequestId] = useState(`deploy-${Date.now()}`);
  const [bytecodeBase64, setBytecodeBase64] = useState('');
  const [bytecodeHash, setBytecodeHash] = useState('');
  const [depositLamports, setDepositLamports] = useState('1000000');
  const [deployRequest, setDeployRequest] = useState<LoadedDeployRequest | null>(null);
  const [deployRequestMessage, setDeployRequestMessage] = useState('');
  const [isDeployRequestLoading, setIsDeployRequestLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('合约部署');
  const [dialogMessage, setDialogMessage] = useState('正在提交部署交易。');
  const [dialogStatus, setDialogStatus] = useState('处理中');
  const manualClient = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);

  useEffect(() => {
    if (!scannedDeployPayload) {
      setDeployRequest(null);
      setDeployRequestMessage('手动部署模式：请粘贴 SVM1 字节码和 SHA-256。');
      return;
    }

    let cancelled = false;
    setIsDeployRequestLoading(true);
    setDeployRequestMessage('正在拉取扫码部署请求');

    // 功能目的：加载扫码部署请求；实现原因：二维码只应携带请求地址，字节码必须拉取后校验 hash 再签名。
    void loadDeployRequestFromQRCode(scannedDeployPayload)
      .then((loadedRequest) => {
        if (cancelled) {
          return;
        }

        setDeployRequest(loadedRequest);
        setRequestId(loadedRequest.id);
        setBytecodeBase64(loadedRequest.bytecodeBase64);
        setBytecodeHash(loadedRequest.bytecodeHash);
        setDepositLamports(loadedRequest.depositLamports.toString());
        setDeployRequestMessage('部署请求已加载，bytecode hash 已校验');
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setDeployRequest(null);
        setDeployRequestMessage(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsDeployRequestLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scannedDeployPayload]);

  const handleSubmitDeploy = async () => {
    if (!currentWalletSigningSeed) {
      if (onUnlockWalletPress) {
        onUnlockWalletPress();
        return;
      }

      setDialogVisible(true);
      setDialogTitle('钱包未解锁');
      setDialogMessage('请先导入助记词解锁本机签名权限，再提交合约部署。');
      setDialogStatus('待处理');
      return;
    }

    if (deployRequest !== null && !currentWalletAddress) {
      setDialogVisible(true);
      setDialogTitle('钱包未选择');
      setDialogMessage('扫码部署请求需要当前钱包地址用于回传部署结果。');
      setDialogStatus('失败');
      return;
    }

    setDialogVisible(true);
    setDialogTitle('合约部署');
    setDialogMessage('正在校验字节码哈希、本地签名并提交到当前 RPC。');
    setDialogStatus('提交中');

    try {
      const deployClient = deployRequest === null ? manualClient : new JsonRpcClient(deployRequest.rpcUrl);
      const result = await submitDeployContractTransaction({
        client: deployClient,
        signingSeed: currentWalletSigningSeed,
        requestId,
        bytecodeBase64,
        bytecodeHash,
        depositLamports
      });

      if (deployRequest !== null && currentWalletAddress !== null) {
        await postDeployRequestResult(deployRequest, {
          programAddress: result.programAddress,
          signature: result.signature,
          status: 'submitted',
          submittedAtUnixMillis: Date.now(),
          walletAddress: currentWalletAddress
        }).catch((error: unknown) => {
          console.info('[contract-deploy] result callback failed', {
            message: error instanceof Error ? error.message : String(error),
            requestId: deployRequest.id
          });
        });
      }

      setDialogTitle('部署已提交');
      setDialogMessage(`程序地址：${shortValue(result.programAddress)}，签名：${shortValue(result.signature)}。`);
      setDialogStatus('处理中');
    } catch (error) {
      if (deployRequest !== null && currentWalletAddress !== null) {
        await postDeployRequestResult(deployRequest, {
          error: error instanceof Error ? error.message : String(error),
          status: 'failed',
          submittedAtUnixMillis: Date.now(),
          walletAddress: currentWalletAddress
        }).catch((callbackError: unknown) => {
          console.info('[contract-deploy] failure callback failed', {
            message: callbackError instanceof Error ? callbackError.message : String(callbackError),
            requestId: deployRequest.id
          });
        });
      }

      setDialogTitle('部署失败');
      setDialogMessage(formatError(error));
      setDialogStatus('失败');
    }
  };

  const handleRejectDeploy = () => {
    setDialogVisible(true);
    setDialogTitle('已拒绝部署');
    setDialogMessage('合约部署请求未签名、未提交到 RPC。');
    setDialogStatus('已取消');
  };

  return (
    <ExplorerShell bottomPadding={bottomPadding} onBackPress={onBackPress} title="部署确认" topPadding={topPadding}>
      <HeroPanel backgroundSource={explorerImages.contractBackground} eyebrow="Contract" title="合约部署确认" value={deployRequest?.contractName ?? 'SVM1 Bytecode'} />
      {isDeployRequestLoading ? <InfoMessage text="正在加载扫码部署请求" /> : null}
      {deployRequestMessage.length > 0 ? <InfoMessage text={deployRequestMessage} tone={deployRequest === null && scannedDeployPayload ? 'error' : 'info'} /> : null}
      <DeployInputPanel label="请求 ID" onChangeText={setRequestId} placeholder="deploy request id" value={requestId} />
      <DeployInputPanel label="字节码 Base64" multiline onChangeText={setBytecodeBase64} placeholder="粘贴 SVM1 字节码 base64" value={bytecodeBase64} />
      <DeployInputPanel label="字节码 SHA-256" onChangeText={setBytecodeHash} placeholder="hex hash" value={bytecodeHash} />
      <DeployInputPanel label="押金 lamports" keyboardType="number-pad" onChangeText={setDepositLamports} placeholder="1000000" value={depositLamports} />
      <InfoCard rows={[
        { label: '钱包解锁', value: currentWalletSigningSeed ? '已解锁，可签名' : '未解锁，需重新导入助记词' },
        { label: '部署来源', value: deployRequest === null ? '手动输入' : deployRequest.requestUrl },
        { label: '目标 RPC', value: deployRequest?.rpcUrl ?? manualClient.endpoint },
        { label: '过期时间', value: deployRequest === null ? '-' : formatTimestamp(deployRequest.expiresAtUnixMillis) },
        { label: '提交方式', value: '本地签名 + sendTransaction' }
      ]} />
      <ButtonRow buttons={[
        { iconName: 'file-sign', label: currentWalletSigningSeed ? '签名并部署' : '导入助记词解锁', onPress: handleSubmitDeploy, variant: 'primary' },
        { iconName: 'close-circle-outline', label: '拒绝', onPress: handleRejectDeploy }
      ]} />
      <OperationTipDialog
        blockEstimate={dialogStatus === '失败' ? '未上链' : '预计 1-2 个区块'}
        message={dialogMessage}
        onClose={() => setDialogVisible(false)}
        scale={1}
        statusText={dialogStatus}
        title={dialogTitle}
        visible={dialogVisible}
      />
    </ExplorerShell>
  );
}

function ExplorerShell({
  bottomPadding,
  children,
  onBackPress,
  subtitle,
  title,
  topPadding
}: ChainScreenBaseProps & {
  readonly children: ReactNode;
  readonly subtitle?: string;
  readonly title: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;

  return (
    <View style={styles.root}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: resolvedBottomPadding + scaled(24, layoutMetrics.scale), paddingTop: resolvedTopPadding }]}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.canvas}>
          <View style={styles.headerRow}>
            <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          </View>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

function HeroPanel({
  backgroundSource,
  eyebrow,
  title,
  value
}: {
  readonly backgroundSource: number;
  readonly eyebrow: string;
  readonly title: string;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.heroPanel}>
      <Image resizeMode="cover" source={backgroundSource} style={styles.heroImage} />
      <LinearGradient colors={['#050507F4', '#050507B8', '#05050720']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.heroShade} />
      <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text numberOfLines={1} style={styles.heroValue}>{value}</Text>
    </View>
  );
}

function ExplorerHeroCard({
  backgroundSource,
  footerMetrics = [],
  metrics,
  primaryLabel,
  primaryValue,
  statusLabel,
  statusTone,
  subtitle,
  title
}: {
  readonly backgroundSource: number;
  readonly footerMetrics?: readonly { label: string; tone?: RowTone; value: string }[];
  readonly metrics: readonly { label: string; tone?: RowTone; value: string }[];
  readonly primaryLabel: string;
  readonly primaryValue: string;
  readonly statusLabel: string;
  readonly statusTone: RowTone;
  readonly subtitle: string;
  readonly title: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.visualHero}>
      <Image resizeMode="cover" source={backgroundSource} style={styles.heroImage} />
      <LinearGradient colors={['#050507F8', '#050507E8', '#05050744']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <View style={styles.heroStatusLine}>
        <View style={getToneStyle(statusTone, styles.heroStatusDot, styles.heroStatusDotWarning, styles.heroStatusDotDanger)} />
        <Text style={getToneTextStyle(statusTone, styles.heroStatusText, styles.heroStatusTextSuccess, styles.heroStatusTextWarning, styles.heroStatusTextDanger)}>{statusLabel}</Text>
      </View>
      <Text numberOfLines={1} style={styles.visualHeroTitle}>{title}</Text>
      <Text numberOfLines={1} style={styles.visualHeroSubtitle}>{subtitle}</Text>
      <Text style={styles.heroPrimaryLabel}>{primaryLabel}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.55} numberOfLines={1} style={styles.heroPrimaryValue}>{primaryValue}</Text>
      <View style={styles.heroMetricGridModern}>
        {metrics.map((metric) => (
          <View key={`${metric.label}-${metric.value}`} style={styles.heroMetricModern}>
            <Text numberOfLines={1} style={styles.heroMetricLabelSmall}>{metric.label}</Text>
            <Text adjustsFontSizeToFit minimumFontScale={0.68} numberOfLines={1} style={getToneTextStyle(metric.tone, styles.heroMetricValueSmall, styles.metricSuccessText, styles.metricWarningText, styles.metricDangerText)}>{metric.value}</Text>
          </View>
        ))}
      </View>
      {footerMetrics.length > 0 ? (
        <View style={styles.heroFooterBar}>
          {footerMetrics.map((metric) => (
            <View key={`${metric.label}-${metric.value}`} style={styles.heroFooterItem}>
              <Text numberOfLines={1} style={styles.heroFooterLabel}>{metric.label}</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={getToneTextStyle(metric.tone, styles.heroFooterValue, styles.metricSuccessText, styles.metricWarningText, styles.metricDangerText)}>{metric.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ExplorerCard({
  actionLabel,
  children,
  onActionPress,
  title
}: {
  readonly actionLabel?: string;
  readonly children: ReactNode;
  readonly onActionPress?: () => void;
  readonly title: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.explorerCard}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>{title}</Text>
        {actionLabel ? (
          <Pressable accessibilityRole={onActionPress ? 'button' : undefined} onPress={onActionPress} style={styles.cardAction}>
            <Text style={styles.cardActionText}>{actionLabel}</Text>
            {onActionPress ? <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={scaled(26, layoutMetrics.scale)} /> : null}
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function FilterTabs({
  onSelect,
  options,
  selectedOption
}: {
  readonly onSelect: (option: TransactionFilterOption) => void;
  readonly options: readonly TransactionFilterOption[];
  readonly selectedOption: TransactionFilterOption;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.filterTabs}>
      {options.map((option) => {
        const selected = option === selectedOption;
        return (
          <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={option} onPress={() => onSelect(option)} style={selected ? styles.filterTabActive : styles.filterTab}>
            <Text style={selected ? styles.filterTabTextActive : styles.filterTabText}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HashRow({
  label,
  onCopyPress,
  value
}: {
  readonly label: string;
  readonly onCopyPress?: () => void;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.hashRow}>
      <Text style={styles.hashLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.hashValue}>{value}</Text>
      {onCopyPress ? (
        <Pressable accessibilityRole="button" onPress={onCopyPress} style={styles.copyIconButton}>
          <MaterialCommunityIcons color={colors.textMuted} name="content-copy" size={scaled(25, layoutMetrics.scale)} />
        </Pressable>
      ) : null}
    </View>
  );
}

function StatusBanner({
  iconName,
  meta,
  title,
  tone
}: {
  readonly iconName: MaterialIconName;
  readonly meta: string;
  readonly title: string;
  readonly tone: RowTone;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.statusBanner}>
      <View style={styles.statusBannerIcon}>
        <MaterialCommunityIcons color={getToneColor(tone)} name={iconName} size={scaled(34, layoutMetrics.scale)} />
      </View>
      <View style={styles.statusBannerText}>
        <Text style={styles.statusBannerTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.statusBannerMeta}>{meta}</Text>
      </View>
    </View>
  );
}

// 功能目的：渲染区块详情主卡；实现原因：通用 Hero 会把哈希不可用放大成主视觉，信息层级错误。
function BlockDetailHero({ detail }: { readonly detail: BlockDetailData | null }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const block = detail?.block ?? null;
  const transactions = block?.transactions;
  const transactionCountText = Array.isArray(transactions) ? String(transactions.length) : unavailableText;
  const leaderAddress = readBlockLeaderAddress(block);
  const statusText = createBlockFinalityText(detail);
  const isFinalized = statusText === 'Finalized';
  const metrics = [
    { label: '区块高度', value: block ? formatNumber(block.slot) : unavailableText },
    { label: 'Slot', value: block ? formatNumber(block.slot) : unavailableText },
    { label: '区块时间', value: formatBlockTimestamp(block?.block_time_unix_milli) },
    { label: '交易数量', value: transactionCountText },
    { label: '出块验证者', value: leaderAddress ? shortValue(leaderAddress) : rpcFieldNotProvidedText },
    { label: '总手续费', value: formatOptionalLamports(block?.total_fee_lamports) }
  ];

  return (
    <View style={styles.blockHero}>
      <Image resizeMode="cover" source={explorerImages.blockBackground} style={styles.heroImage} />
      <LinearGradient colors={['#050507FA', '#050507E8', '#0505072A']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <View style={styles.blockHeroContent}>
        <View style={styles.blockHeroStatusRow}>
          <View style={isFinalized ? styles.blockHeroStatusDot : styles.blockHeroStatusDotWarning} />
          <Text style={isFinalized ? styles.blockHeroStatusText : styles.blockHeroStatusTextWarning}>{statusText}</Text>
          <Text numberOfLines={1} style={styles.blockHeroLatency}>RPC {detail ? `${detail.roundTripMs}ms` : unavailableText}</Text>
        </View>
        <View style={styles.blockHeroMetricGrid}>
          {metrics.map((metric, index) => (
            <BlockHeroMetric
              isLowerRow={index >= 2}
              isRightColumn={index % 2 === 1}
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function BlockHeroMetric({
  isLowerRow,
  isRightColumn,
  label,
  value
}: {
  readonly isLowerRow: boolean;
  readonly isRightColumn: boolean;
  readonly label: string;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={[styles.blockHeroMetric, isRightColumn ? styles.blockHeroMetricRight : null, isLowerRow ? styles.blockHeroMetricLower : null]}>
      <Text numberOfLines={1} style={styles.blockHeroMetricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.blockHeroMetricValue}>{value}</Text>
    </View>
  );
}

function BlockSlotQueryPanel({
  onChangeText,
  onSubmit,
  value
}: {
  readonly onChangeText: (value: string) => void;
  readonly onSubmit: () => void;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.blockQueryPanel}>
      <MaterialCommunityIcons color={colors.textSoft} name="database-search-outline" size={scaled(30, layoutMetrics.scale)} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="number-pad"
        onChangeText={onChangeText}
        placeholder="输入 Slot / Height 查询区块"
        placeholderTextColor="#8D93A1"
        style={styles.blockQueryInput}
        underlineColorAndroid="transparent"
        value={value}
      />
      <Pressable accessibilityRole="button" onPress={onSubmit} style={styles.blockQueryButton}>
        <Text style={styles.blockQueryButtonText}>查询</Text>
      </Pressable>
    </View>
  );
}

function BlockHashPanel({
  block,
  onCopyBlockHash
}: {
  readonly block: BlockResult;
  readonly onCopyBlockHash: () => void;
}) {
  const hashRows = [
    { copyable: true, label: 'Block Hash', value: block.blockhash ?? unavailableText },
    { label: 'Parent Slot', value: typeof block.parentSlot === 'number' && Number.isSafeInteger(block.parentSlot) ? formatNumber(block.parentSlot) : unavailableText },
    { label: 'State Root', value: readNonEmptyString(block.state_root) ?? unavailableText },
    { label: 'Tx Root', value: readNonEmptyString(block.tx_root) ?? unavailableText }
  ];

  return (
    <BlockSectionCard>
      {hashRows.map((row) => (
        <BlockHashRow
          key={row.label}
          label={row.label}
          onCopyPress={row.copyable ? onCopyBlockHash : undefined}
          value={row.value}
        />
      ))}
    </BlockSectionCard>
  );
}

function BlockValidatorPanel({
  block,
  onValidatorListPress
}: {
  readonly block: BlockResult;
  readonly onValidatorListPress?: () => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const leaderAddress = readBlockLeaderAddress(block);
  const hasLeaderAddress = leaderAddress !== null;
  const metricItems = [
    { label: '佣金', value: formatBasisPoints(block.leader_commission_bps) },
    { label: '质押数量', value: formatOptionalLamports(block.leader_stake_lamports) },
    { label: '投票积分', value: formatOptionalCount(block.leader_vote_credits) },
    { label: '出块奖励', value: formatOptionalLamports(block.leader_reward_lamports) }
  ];
  const leaderSource = readBlockLeaderSource(block);
  const validatorName = leaderAddress ?? 'RPC 未提供出块者';
  const validatorMeta = createBlockLeaderMeta(hasLeaderAddress, leaderSource);

  return (
    <View style={styles.blockValidatorCard}>
      <View style={styles.blockValidatorHeader}>
        <Text style={styles.blockSectionTitle}>出块验证者</Text>
        <Pressable accessibilityRole="button" onPress={onValidatorListPress} style={styles.blockValidatorActionButton}>
          <Text style={styles.blockValidatorActionText}>查看验证者</Text>
          <MaterialCommunityIcons color={colors.text} name="chevron-right" size={scaled(24, layoutMetrics.scale)} />
        </Pressable>
      </View>
      <View style={styles.blockValidatorSummary}>
        <View style={styles.blockValidatorLogo}>
          <Image resizeMode="contain" source={explorerImages.solMark} style={styles.blockValidatorLogoImage} />
        </View>
        <View style={styles.blockValidatorIdentity}>
          <Text numberOfLines={1} style={styles.blockValidatorName}>{validatorName}</Text>
          <View style={styles.blockValidatorStatusRow}>
            <View style={hasLeaderAddress ? styles.blockValidatorStatusDotSuccess : styles.blockValidatorStatusDot} />
            <Text numberOfLines={1} style={styles.blockValidatorMeta}>{validatorMeta}</Text>
          </View>
        </View>
      </View>
      <BlockValidatorMetricStrip items={metricItems} />
    </View>
  );
}

function BlockTransactionPanel({
  block,
  transactionCount
}: {
  readonly block: BlockResult;
  readonly transactionCount: string;
}) {
  return (
    <BlockSectionCard actionLabel={`共 ${transactionCount} 笔`} title="区块交易">
      <BlockTransactionList block={block} />
    </BlockSectionCard>
  );
}

function BlockRuntimePanel({
  block,
  confirmationText,
  finalizedHeight,
  rpcEndpoint
}: {
  readonly block: BlockResult;
  readonly confirmationText: string;
  readonly finalizedHeight: string;
  readonly rpcEndpoint: string;
}) {
  const feeItems = [
    { iconName: 'feeBase' as BlockDetailIconName, label: 'Base Fee', value: formatOptionalLamports(block.base_fee_lamports) },
    { iconName: 'feePriority' as BlockDetailIconName, label: 'Priority Fee', value: formatOptionalLamports(block.prioritization_fee_lamports) },
    { iconName: 'feeBurned' as BlockDetailIconName, label: 'Burned', value: formatOptionalLamports(block.burned_fee_lamports) },
    { iconName: 'computeUsed' as BlockDetailIconName, label: 'Compute Used', value: formatOptionalCount(block.compute_units_used) }
  ];
  const statusItems = [
    { iconName: 'statusConfirmations' as BlockDetailIconName, label: '确认数', value: confirmationText },
    { iconName: 'statusFinalized' as BlockDetailIconName, label: 'Finalized 高度', value: finalizedHeight },
    { iconName: 'statusMempool' as BlockDetailIconName, label: 'Mempool', value: unavailableText },
    { iconName: 'statusRpc' as BlockDetailIconName, label: 'RPC 来源', value: shortValue(rpcEndpoint) }
  ];

  return (
    <>
      <BlockIconMetricStrip items={feeItems} />
      <BlockIconMetricStrip items={statusItems} />
    </>
  );
}

function BlockDetailButtonRow({
  onCopyBlockHash,
  onTransactionHistoryPress
}: {
  readonly onCopyBlockHash: () => void;
  readonly onTransactionHistoryPress?: () => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.blockButtonRow}>
      <Pressable accessibilityRole="button" onPress={onCopyBlockHash} style={styles.blockPrimaryButton}>
        <BlockDetailIcon name="buttonCopy" size={scaled(34, layoutMetrics.scale)} />
        <Text style={styles.blockPrimaryButtonText}>复制区块哈希</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onTransactionHistoryPress} style={styles.blockSecondaryButton}>
        <BlockDetailIcon name="buttonTransactions" size={scaled(34, layoutMetrics.scale)} />
        <Text style={styles.blockSecondaryButtonText}>查看全部交易</Text>
      </Pressable>
    </View>
  );
}

function BlockSectionCard({
  actionLabel,
  children,
  title
}: {
  readonly actionLabel?: string;
  readonly children: ReactNode;
  readonly title?: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.blockSectionCard}>
      {title ? (
        <View style={styles.blockSectionHeader}>
          <Text style={styles.blockSectionTitle}>{title}</Text>
          {actionLabel ? (
            <View style={styles.blockSectionAction}>
              <Text style={styles.blockSectionActionText}>{actionLabel}</Text>
              <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={scaled(25, layoutMetrics.scale)} />
            </View>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

function BlockHashRow({
  label,
  onCopyPress,
  value
}: {
  readonly label: string;
  readonly onCopyPress?: () => void;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.blockHashRow}>
      <Text style={styles.blockHashLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.blockHashValue}>{value}</Text>
      {onCopyPress ? (
        <Pressable accessibilityRole="button" onPress={onCopyPress} style={styles.blockHashCopyButton}>
          <BlockDetailIcon name="copySmall" size={scaled(28, layoutMetrics.scale)} />
        </Pressable>
      ) : null}
      <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={scaled(24, layoutMetrics.scale)} />
    </View>
  );
}

function BlockValidatorMetricStrip({ items }: { readonly items: readonly { label: string; value: string }[] }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.blockValidatorMetricStrip}>
      {items.map((item) => (
        <View key={item.label} style={styles.blockValidatorMetric}>
          <Text numberOfLines={1} style={styles.blockValidatorMetricLabel}>{item.label}</Text>
          <Text numberOfLines={1} style={styles.blockValidatorMetricValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function BlockIconMetricStrip({
  items
}: {
  readonly items: readonly { iconName: BlockDetailIconName; label: string; value: string }[];
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.blockIconMetricStrip}>
      {items.map((item) => (
        <View key={item.label} style={styles.blockIconMetric}>
          <BlockDetailIcon name={item.iconName} size={scaled(31, layoutMetrics.scale)} />
          <View style={styles.blockIconMetricText}>
            <Text numberOfLines={1} style={styles.blockIconMetricLabel}>{item.label}</Text>
            <Text numberOfLines={1} style={styles.blockIconMetricValue}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// 功能目的：渲染交易历史主卡；实现原因：通用 Hero 会让标题、地址和指标互相挤压。
function TransactionHistoryHero({
  currentWalletAddress,
  hasError,
  summary
}: {
  readonly currentWalletAddress: string | null;
  readonly hasError: boolean;
  readonly summary: ReturnType<typeof createTransactionSummary>;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const accountText = currentWalletAddress ? `当前账户：${shortValue(currentWalletAddress)}` : '当前账户：未选择钱包';
  const heroToneStyle = hasError ? styles.transactionHeroStatusDotWarning : styles.transactionHeroStatusDot;

  return (
    <View style={styles.transactionHero}>
      <Image resizeMode="cover" source={explorerImages.transactionHistoryBackground} style={styles.heroImage} />
      <LinearGradient colors={['#050507FA', '#050507E8', '#05050720']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <View style={styles.transactionHeroContent}>
        <View style={styles.transactionHeroTopRow}>
          <View style={styles.transactionHeroStatusRow}>
            <View style={heroToneStyle} />
            <Text style={styles.transactionHeroEyebrow}>本月交易概览</Text>
            <MaterialCommunityIcons color="#FFFFFF" name="eye-outline" size={scaled(26, layoutMetrics.scale)} />
          </View>
          <View style={styles.transactionHeroAccount}>
            <Text numberOfLines={1} style={styles.transactionHeroAccountText}>{accountText}</Text>
          </View>
        </View>
        <View style={styles.transactionHeroStats}>
          <TransactionHeroMetric label="本月交易" value={summary.total} />
          <TransactionHeroMetric label="成功" tone="success" value={summary.success} />
          <TransactionHeroMetric label="处理中" tone="warning" value={summary.pending} />
          <TransactionHeroMetric label="失败" tone="danger" value={summary.failed} />
        </View>
        <View style={styles.transactionHeroFee}>
          <Text style={styles.transactionHeroFeeLabel}>总手续费</Text>
          <Text style={styles.transactionHeroFeeValue}>{summary.feeText}</Text>
        </View>
      </View>
    </View>
  );
}

function TransactionHeroMetric({
  label,
  tone,
  value
}: {
  readonly label: string;
  readonly tone?: RowTone;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.transactionHeroMetric}>
      <Text numberOfLines={1} style={styles.transactionHeroMetricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={getToneTextStyle(tone, styles.transactionHeroMetricValue, styles.transactionHeroMetricValueSuccess, styles.transactionHeroMetricValueWarning, styles.transactionHeroMetricValueDanger)}>{value}</Text>
    </View>
  );
}

function BlockTransactionList({ block }: { readonly block: BlockResult }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const transactions = block.transactions ?? [];

  if (transactions.length === 0) {
    return (
      <View style={styles.blockTransactionEmptyBox}>
        <Text style={styles.blockTransactionEmptyText}>当前区块未返回交易列表</Text>
      </View>
    );
  }

  return (
    <View style={styles.blockTransactionList}>
      {transactions.slice(0, 4).map((transaction, index) => (
        <BlockTransactionRow
          isLast={index === Math.min(transactions.length, 4) - 1}
          key={`block-transaction-${block.slot}-${index}`}
          slot={block.slot}
          transaction={transaction}
          transactionIndex={index}
        />
      ))}
    </View>
  );
}

function BlockTransactionRow({
  isLast,
  slot,
  transaction,
  transactionIndex
}: {
  readonly isLast: boolean;
  readonly slot: number;
  readonly transaction: unknown;
  readonly transactionIndex: number;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const display = createBlockTransactionDisplay(transaction, transactionIndex);

  return (
    <View style={[styles.blockTransactionRow, isLast ? styles.blockTransactionRowLast : null]}>
      <BlockDetailIcon name={display.iconName} size={scaled(40, layoutMetrics.scale)} />
      <View style={styles.blockTransactionMain}>
        <Text numberOfLines={1} style={styles.blockTransactionTitle}>{display.title}</Text>
        <Text numberOfLines={1} style={styles.blockTransactionMeta}>Slot {formatNumber(slot)}</Text>
      </View>
      <Text numberOfLines={1} style={styles.blockTransactionTag}>{display.kindLabel}</Text>
      <View style={styles.blockTransactionAmountBlock}>
        <Text numberOfLines={1} style={display.amountText === unavailableText ? styles.blockTransactionUnavailableValue : styles.blockTransactionAmount}>{display.amountText}</Text>
      </View>
      <View style={styles.blockTransactionMetaBlock}>
        <Text numberOfLines={1} style={styles.blockTransactionFee}>{display.feeText}</Text>
        <Text numberOfLines={1} style={styles.blockTransactionStatus}>{display.statusText}</Text>
      </View>
      <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={scaled(28, layoutMetrics.scale)} />
    </View>
  );
}

function RecentBlockTable({ blocks }: { readonly blocks: readonly BlockResult[] }) {
  if (blocks.length === 0) {
    return <InfoMessage text="当前 RPC 未返回最近区块" />;
  }

  return (
    <>
      {blocks.map((block) => (
        <RecordRow
          key={`recent-block-${block.slot}`}
          label="BL"
          meta={`Parent ${block.parentSlot ?? unavailableText} · ${block.transactions?.length ?? 0} 笔交易`}
          value={`Height ${formatNumber(block.slot)} · ${shortValue(block.blockhash ?? unavailableText)}`}
        />
      ))}
    </>
  );
}

function HealthStatusGrid({
  items
}: {
  readonly items: readonly { label: string; meta: string; tone: RowTone }[];
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.healthGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.healthItem}>
          <MaterialCommunityIcons color={getToneColor(item.tone)} name={getToneIconName(item.tone)} size={scaled(30, layoutMetrics.scale)} />
          <Text numberOfLines={1} style={styles.healthLabel}>{item.label}</Text>
          <Text numberOfLines={1} style={getToneTextStyle(item.tone, styles.healthMeta, styles.metricSuccessText, styles.metricWarningText, styles.metricDangerText)}>{item.meta}</Text>
        </View>
      ))}
    </View>
  );
}

// 功能目的：渲染交易日期分组；实现原因：分组列表比卡片套卡片更接近交易历史设计稿。
function TransactionHistoryGroupCard({
  currentWalletAddress,
  group,
  onTransactionDetailPress
}: {
  readonly currentWalletAddress: string | null;
  readonly group: { readonly records: readonly AccountTransactionRecordResult[]; readonly title: string };
  readonly onTransactionDetailPress?: (detailData: TransactionDetailData) => void;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.transactionGroupCard}>
      <View style={styles.transactionGroupHeader}>
        <Text style={styles.transactionGroupTitle}>{group.title}</Text>
        <View style={styles.transactionGroupCount}>
          <Text style={styles.transactionGroupCountText}>共 {group.records.length} 笔</Text>
          <MaterialCommunityIcons color={colors.textMuted} name="chevron-down" size={scaled(26, layoutMetrics.scale)} />
        </View>
      </View>
      {group.records.map((record, index) => (
        <TransactionHistoryRow
          currentWalletAddress={currentWalletAddress}
          isLast={index === group.records.length - 1}
          key={`${record.signature}-${record.slot}-${record.kind}`}
          onPress={() => onTransactionDetailPress?.(mapHistoryRecordToDetailData(record, currentWalletAddress))}
          record={record}
        />
      ))}
    </View>
  );
}

// 功能目的：保留交易列表空态结构；实现原因：RPC 失败不能让页面退化成单条错误提示。
function TransactionHistoryEmptyCard({ hasError }: { readonly hasError: boolean }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const title = hasError ? '当前 RPC 暂不可用' : '暂无交易记录';
  const meta = hasError ? '保留交易列表结构，可稍后重试同步链上记录' : '当前地址暂无符合筛选条件的链上记录';

  return (
    <ExplorerCard title="交易记录">
      <View style={styles.transactionEmptyState}>
        <View style={styles.transactionEmptyIcon}>
          <MaterialCommunityIcons color={colors.primary} name="history" size={scaled(34, layoutMetrics.scale)} />
        </View>
        <View style={styles.transactionEmptyTextBlock}>
          <Text style={styles.transactionEmptyTitle}>{title}</Text>
          <Text style={styles.transactionEmptyMeta}>{meta}</Text>
        </View>
      </View>
    </ExplorerCard>
  );
}

function TransactionHistoryRow({
  currentWalletAddress,
  isLast,
  onPress,
  record
}: {
  readonly currentWalletAddress: string | null;
  readonly isLast: boolean;
  readonly onPress?: () => void;
  readonly record: AccountTransactionRecordResult;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const amountPrefix = record.direction === 'outgoing' ? '-' : '+';
  const counterparty = record.counterparty ?? currentWalletAddress ?? unavailableText;
  const value = `${amountPrefix}${formatLamports(record.amount_lamports)} lamports`;
  const metaText = createTransactionRowMeta(record, counterparty);
  const statusTone = record.status === 'finalized' ? 'success' : 'warning';
  const statusText = record.status === 'finalized' ? '成功' : '处理中';

  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={[styles.transactionRow, isLast ? styles.transactionRowLast : null]}>
      <View style={getTransactionIconStyle(record, styles)}>
        <MaterialCommunityIcons color="#FFFFFF" name={getTransactionIconName(record)} size={scaled(30, layoutMetrics.scale)} />
      </View>
      <View style={styles.transactionRowMain}>
        <Text numberOfLines={1} style={styles.transactionRowTitle}>{createTransactionKindTitle(record.kind)}</Text>
        <Text numberOfLines={1} style={styles.transactionRowMeta}>{metaText}</Text>
      </View>
      <View style={styles.transactionAmountBlock}>
        <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.transactionAmount}>{value}</Text>
        <View style={styles.transactionStatusLine}>
          <Text style={getTransactionStatusTextStyle(statusTone, styles)}>{statusText}</Text>
          <Text numberOfLines={1} style={styles.transactionRowTime}>{formatCompactTimestamp(record.submit_time_unix_milli)}</Text>
        </View>
      </View>
      <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={scaled(30, layoutMetrics.scale)} />
    </Pressable>
  );
}

function ConnectionPath({ data }: { readonly data: NetworkStatusData }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const connectedValidators = data.network.peers.filter((peer) => peer.connected && peer.validator).length;
  const latencyText = data.roundTripMs > 0 ? `${data.roundTripMs}ms` : unavailableText;
  const pathItems = [
    { label: 'APP', meta: data.health.ok ? '正常' : '待检测', value: latencyText },
    { label: '公网 RPC', meta: data.health.ok ? '正常' : '待检测', value: latencyText },
    { label: 'P2P Relay', meta: data.node.rpc_forwarding || data.node.transaction_fast_path.fast_path_available ? '正常' : unavailableText, value: unavailableText },
    { label: '内网验证者', meta: `${connectedValidators} 已连接`, value: unavailableText }
  ];

  return (
    <View style={styles.pathRow}>
      {pathItems.map((item, index) => (
        <View key={item.label} style={styles.pathItem}>
          <View style={styles.pathIcon}>
            <MaterialCommunityIcons color={colors.primary} name={getPathIconName(index)} size={scaled(32, layoutMetrics.scale)} />
          </View>
          <Text style={styles.pathLabel}>{item.label}</Text>
          <Text style={styles.pathMeta}>{item.meta}</Text>
          {index < pathItems.length - 1 ? <Text style={styles.pathConnector}>{item.value}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function RpcEndpointTable({
  currentEndpoint,
  data,
  onCopyPress,
  onEndpointSelect,
  onRpcNodePress
}: {
  readonly currentEndpoint: string;
  readonly data: NetworkStatusData;
  readonly onCopyPress: () => void;
  readonly onEndpointSelect?: (endpoint: string) => void;
  readonly onRpcNodePress?: () => void;
}) {
  const rows = buildRpcEndpointRows(currentEndpoint, data);

  return (
    <>
      {rows.map((row) => (
        <RecordRow
          key={row.endpoint}
          label={row.badge}
          meta={`${row.status} · ${row.height}`}
          onPress={row.current ? onCopyPress : () => onEndpointSelect?.(row.endpoint)}
          value={`${row.name}  ${row.endpoint}`}
        />
      ))}
      {onRpcNodePress ? (
        <RecordRow
          label="详情"
          meta="查看当前 RPC 能力"
          onPress={onRpcNodePress}
          value="RPC 节点详情"
        />
      ) : null}
    </>
  );
}

function ValidatorReachabilityTable({ peers }: { readonly peers: readonly PeerNetworkPeer[] }) {
  const validatorPeers = peers.filter((peer) => peer.validator).slice(0, 4);

  if (validatorPeers.length === 0) {
    return <InfoMessage text="当前 RPC 未返回验证者 peer" />;
  }

  return (
    <>
      {validatorPeers.map((peer) => (
        <RecordRow
          key={peer.peer_id}
          label={peer.role || 'peer'}
          meta={`${peer.connected ? '已连接' : '未连接'} · Slot ${formatNumber(peer.latest_slot)}`}
          value={`${shortValue(peer.peer_id)}  ${peer.best_address ?? unavailableText}`}
        />
      ))}
    </>
  );
}

function CapabilityGrid({ node }: { readonly node: NodeStatusResult }) {
  const capabilityRows = createCapabilityRows(node);

  return (
    <>
      {capabilityRows.map((row) => (
        <StatusBanner iconName={row.enabled ? 'check-circle' : 'alert-circle-outline'} key={row.title} meta={row.meta} title={row.title} tone={row.enabled ? 'success' : 'warning'} />
      ))}
    </>
  );
}

function PerformanceTrace({ roundTripMs }: { readonly roundTripMs: number }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const bars = [0.42, 0.52, 0.48, 0.58, 0.45, 0.64, 0.6, 0.5, 0.56, 0.62, 0.54, 0.66];

  return (
    <View style={styles.tracePanel}>
      <Text style={styles.traceLabel}>响应曲线</Text>
      <View style={styles.traceBars}>
        {bars.map((ratio, index) => (
          <View key={`trace-${index}`} style={[styles.traceBar, { height: scaled(72 * ratio, layoutMetrics.scale) }]} />
        ))}
      </View>
      <Text style={styles.traceMeta}>最近检测 {roundTripMs}ms，QPS 未返回</Text>
    </View>
  );
}

function UpstreamValidatorTable({ node }: { readonly node: NodeStatusResult }) {
  const upstreamIds = [
    ...(node.transaction_fast_path.validator_peer_ids ?? []),
    ...(node.transaction_fast_path.preferred_peer_ids ?? [])
  ].slice(0, 4);

  if (upstreamIds.length === 0) {
    return <InfoMessage text="当前 RPC 未返回上游验证者" />;
  }

  return (
    <>
      {upstreamIds.map((peerID, index) => (
        <RecordRow
          key={`${peerID}-${index}`}
          label={`V${index + 1}`}
          meta={`中继延迟 ${unavailableText} · 最近转发交易 ${unavailableText}`}
          value={shortValue(peerID)}
        />
      ))}
    </>
  );
}

function RuntimeLogList({ data }: { readonly data: RpcNodeDetailData }) {
  const rows = [
    { label: 'height sync', meta: `同步到高度 ${formatNumber(data.node.head_height)}`, value: formatTime(data.loadedAt) },
    { label: 'peer heartbeat', meta: `known peers ${formatNumber(data.node.known_peer_count)}`, value: formatTime(data.loadedAt) },
    { label: 'forward tx', meta: data.node.transaction_fast_path.fast_path_available ? 'fast path ok' : unavailableText, value: formatTime(data.loadedAt) }
  ];

  return (
    <>
      {rows.map((row) => (
        <RecordRow key={row.label} label="log" meta={`${row.meta} · ${row.value}`} value={row.label} />
      ))}
    </>
  );
}

function DeployInputPanel({
  keyboardType,
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value
}: {
  readonly keyboardType?: 'default' | 'number-pad';
  readonly label: string;
  readonly multiline?: boolean;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly value: string;
}) {
  const styles = createStyles(useHomeResponsiveLayout().scale);

  return (
    <View style={styles.inputPanel}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8D93A1"
        style={multiline ? styles.multilineInput : styles.textInput}
        underlineColorAndroid="transparent"
        value={value}
      />
    </View>
  );
}

function InputPanel({
  buttonLabel,
  keyboardType,
  label,
  multiline = false,
  onChangeText,
  onSubmit,
  placeholder,
  value
}: {
  readonly buttonLabel: string;
  readonly keyboardType?: 'default' | 'number-pad';
  readonly label: string;
  readonly multiline?: boolean;
  readonly onChangeText: (value: string) => void;
  readonly onSubmit: () => void;
  readonly placeholder: string;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.inputPanel}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8D93A1"
        style={multiline ? styles.multilineInput : styles.textInput}
        underlineColorAndroid="transparent"
        value={value}
      />
      <Pressable accessibilityRole="button" onPress={onSubmit} style={styles.inputButton}>
        <Text style={styles.inputButtonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

function QueryBody<T>({
  children,
  emptyText,
  state
}: {
  readonly children: (data: T) => ReactNode;
  readonly emptyText: string;
  readonly state: QueryState<T>;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  if (state.loading) {
    return (
      <View style={styles.statePanel}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.stateText}>加载中</Text>
      </View>
    );
  }

  if (state.error.length > 0) {
    return <InfoMessage text={state.error} tone="error" />;
  }

  if (Array.isArray(state.data) && state.data.length === 0) {
    return <InfoMessage text={emptyText} />;
  }

  if (state.data === null) {
    return <InfoMessage text={emptyText} />;
  }

  return <>{children(state.data)}</>;
}

function SectionTitle({ title }: { readonly title: string }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InfoMessage({ text, tone = 'info' }: { readonly text: string; readonly tone?: 'error' | 'info' }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  return (
    <View style={tone === 'error' ? styles.errorPanel : styles.infoPanel}>
      <Text style={tone === 'error' ? styles.errorText : styles.infoText}>{text}</Text>
    </View>
  );
}

function RecordRow({
  label,
  meta,
  onPress,
  value
}: {
  readonly label: string;
  readonly meta: string;
  readonly onPress?: () => void;
  readonly value: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={styles.recordRow}>
      <View style={styles.recordBadge}>
        <Text style={styles.recordBadgeText}>{label.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={styles.recordTextGroup}>
        <Text numberOfLines={1} style={styles.recordValue}>{value}</Text>
        <Text numberOfLines={1} style={styles.recordMeta}>{meta}</Text>
      </View>
      <Text style={styles.recordChevron}>›</Text>
    </Pressable>
  );
}

function MetricGrid({ items }: { readonly items: readonly { label: string; value: string }[] }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.metricGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.metricItem}>
          <Text numberOfLines={1} style={styles.metricLabel}>{item.label}</Text>
          <Text numberOfLines={1} style={styles.metricValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function InfoCard({ rows }: { readonly rows: readonly { label: string; value: string }[] }) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.infoCard}>
      {rows.map((row) => (
        <View key={row.label} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{row.label}</Text>
          <Text numberOfLines={2} style={styles.infoValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function ButtonRow({
  buttons
}: {
  readonly buttons: readonly {
    readonly compact?: boolean;
    readonly iconName?: MaterialIconName;
    readonly label: string;
    readonly onPress?: () => void;
    readonly variant?: 'primary' | 'secondary';
  }[];
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  return (
    <View style={styles.buttonRow}>
      {buttons.map((button) => (
        <Pressable
          accessibilityRole="button"
          key={button.label}
          onPress={button.onPress}
          style={[
            button.variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
            button.compact ? styles.compactButton : null
          ]}
        >
          {button.iconName ? (
            <MaterialCommunityIcons
              color={button.variant === 'primary' ? '#FFFFFF' : colors.text}
              name={button.iconName}
              size={scaled(28, layoutMetrics.scale)}
            />
          ) : null}
          <Text style={button.variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText}>{button.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SegmentedControl({
  onSelect,
  options,
  selectedKey
}: {
  readonly onSelect: (key: string) => void;
  readonly options: readonly { key: string; label: string }[];
  readonly selectedKey: string;
}) {
  const layoutMetrics = useHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = option.key === selectedKey;
        return (
          <Pressable accessibilityRole="button" key={option.key} onPress={() => onSelect(option.key)} style={selected ? styles.segmentActive : styles.segment}>
            <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={selected ? styles.segmentTextActive : styles.segmentText}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function mapHistoryRecordToDetailData(record: AccountTransactionRecordResult, currentWalletAddress: string | null): TransactionDetailData {
  return {
    amountLamports: formatLamports(record.amount_lamports),
    blockHash: record.blockhash,
    blockHeight: String(record.block_height),
    computeUsed: '-',
    direction: record.direction,
    feeLamports: '-',
    instructions: [
      { accountCount: '2', id: '1', name: record.kind, program: 'Chain Program', writableAccountCount: '1' }
    ],
    location: record.location,
    receiverAddress: record.direction === 'incoming' ? (currentWalletAddress ?? '-') : (record.counterparty ?? '-'),
    recentBlockhash: record.blockhash,
    senderAddress: record.direction === 'outgoing' ? (currentWalletAddress ?? '-') : (record.counterparty ?? '-'),
    signature: record.signature,
    slot: String(record.slot),
    /*
    status: record.status === 'finalized' ? 'Finalized' : '处理中',
    */
    status: record.status === 'finalized' ? 'Finalized' : '\u5904\u7406\u4e2d',
    submitTime: formatTimestamp(record.submit_time_unix_milli),
    transactionType: record.kind
  };
}

function mapRpcTransactionToDetailData(detail: TransactionDetailResult): TransactionDetailData {
  return createTransactionDetailFromRpc(detail);
  /*
  const accounts = detail.account_addresses ?? [];
  return {
    amountLamports: '-',
    blockHash: detail.blockhash || '-',
    blockHeight: String(detail.block_height || 0),
    computeUsed: '-',
    direction: 'outgoing',
    feeLamports: String(detail.fee_lamports),
    instructions: [
      { accountCount: String(accounts.length), id: '1', name: 'rpc_transaction', program: 'Runtime', writableAccountCount: String(detail.writable_addresses?.length ?? 0) }
    ],
    location: detail.location,
    receiverAddress: accounts[1] ?? '-',
    recentBlockhash: detail.recent_blockhash || '-',
    senderAddress: detail.sender || accounts[0] || '-',
    signature: detail.signature,
    slot: String(detail.slot || 0),
    status: detail.status === 'finalized' ? 'Finalized' : '处理中',
    submitTime: formatTimestamp(detail.submit_time_unix_milli),
    transactionType: '链上交易'
  };
  */
}

function formatLamports(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatTimestamp(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '-';
  }
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function shortValue(value: string) {
  if (value.length <= 18) {
    return value;
  }
  return `${value.slice(0, 8)}...${value.slice(-8)}`;
}

async function loadLatestBlocks(client: JsonRpcClient, headSlot: number): Promise<readonly BlockResult[]> {
  const slots = [headSlot, headSlot - 1, headSlot - 2, headSlot - 3].filter((slot) => Number.isSafeInteger(slot) && slot > 0);
  const results = await Promise.allSettled(slots.map((slot) => client.getBlock(slot)));
  return results
    .filter((result): result is PromiseFulfilledResult<BlockResult> => result.status === 'fulfilled')
    .map((result) => result.value);
}

async function resolveBlockLeaderFromTransaction(client: JsonRpcClient, block: BlockResult): Promise<BlockResult> {
  if (readBlockLeaderAddress(block) !== null) {
    return block;
  }

  const transactionSignature = readFirstBlockTransactionSignature(block.transactions);
  if (transactionSignature === null) {
    return block;
  }

  try {
    const transactionDetail = await client.getTransaction(transactionSignature);
    const leaderAddress = readTransactionLeaderAddress(transactionDetail);
    if (leaderAddress === null) {
      return block;
    }
    return {
      ...block,
      leader_address: leaderAddress,
      leader_address_source: 'transaction_detail'
    };
  } catch (error) {
    // 功能目的：保留区块详情主流程；实现原因：leader 兜底查询失败不能阻断区块展示。
    console.info('[block-detail] resolve block leader from transaction failed', {
      message: formatError(error),
      slot: block.slot,
      transaction_signature: transactionSignature
    });
    return block;
  }
}

function createEmptyHistoryResult(address: string | null): AccountTransactionHistoryResult {
  return {
    address: address ?? '',
    has_more: false,
    records: [],
    scope: 'account'
  };
}

async function loadLocalTransactionRecordsSafely(address: string) {
  try {
    return await loadLocalTransactionRecords(address);
  } catch (error) {
    console.info('[transaction-history] load local records failed', { message: formatError(error) });
    return [];
  }
}

function createUnavailableHealth(): HealthResult {
  return {
    finalized_height: 0,
    head_height: 0,
    head_slot: 0,
    mempool_size: 0,
    ok: false
  };
}

function createUnavailableNodeStatus(): NodeStatusResult {
  return {
    consensus: {
      available: false,
      validator_count: 0,
      validators: []
    },
    finalized_height: 0,
    head_height: 0,
    head_slot: 0,
    known_peer_count: 0,
    mempool_size: 0,
    node_capability_names: [],
    node_mode: unavailableText,
    node_name: unavailableText,
    node_role: unavailableText,
    node_roles: [],
    p2p_secure_session: false,
    peer_id: unavailableText,
    rpc_forwarding: false,
    transaction_fast_path: {
      fast_path_available: false,
      preferred_peer_ids: [],
      validator_peer_ids: []
    },
    validator_count: 0
  };
}

function createUnavailableChainStatusData(): ChainStatusData {
  return {
    health: createUnavailableHealth(),
    latestBlocks: [],
    loadedAt: Date.now(),
    node: createUnavailableNodeStatus(),
    roundTripMs: 0
  };
}

function createUnavailableNetworkStatusData(): NetworkStatusData {
  return {
    health: createUnavailableHealth(),
    loadedAt: Date.now(),
    network: {
      local_peer_id: unavailableText,
      peers: []
    },
    node: createUnavailableNodeStatus(),
    roundTripMs: 0
  };
}

function createUnavailableRpcNodeDetailData(): RpcNodeDetailData {
  return {
    health: createUnavailableHealth(),
    loadedAt: Date.now(),
    node: createUnavailableNodeStatus(),
    roundTripMs: 0
  };
}

function filterValidatorRows(
  validators: readonly ValidatorDisplayRow[],
  searchText: string,
  selectedFilter: ValidatorFilterOption
) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  return validators.filter((validator) => {
    const matchesFilter = selectedFilter === '全部'
      || (selectedFilter === '在线' && isValidatorRowOnline(validator))
      || (selectedFilter === '低佣金' && validator.commission_bps <= 100)
      || (selectedFilter === '推荐' && validator.status === 'active' && isValidatorRowOnline(validator));

    if (!matchesFilter) {
      return false;
    }

    if (normalizedSearchText.length === 0) {
      return true;
    }

    const searchableText = `${validator.account_address} ${validator.p2p_peer_id} ${validator.consensus_public_key}`.toLowerCase();
    return searchableText.includes(normalizedSearchText);
  });
}

function createAverageCommissionText(validators: readonly ValidatorInfo[]) {
  if (validators.length === 0) {
    return unavailableText;
  }

  const totalBps = validators.reduce((total, validator) => total + validator.commission_bps, 0);
  const averagePercent = Math.round(totalBps / validators.length) / 100;
  return `${averagePercent}%`;
}

function createValidatorReachabilityWarning(results: readonly PromiseSettledResult<unknown>[]) {
  const rejected = results.find((result) => result.status === 'rejected');
  if (rejected?.status !== 'rejected') {
    return '';
  }

  return `验证者在线状态待检测：${formatError(rejected.reason)}`;
}

function createValidatorOnlineTone(onlineCount: number, hasError: boolean, networkAvailable: boolean): RowTone {
  if (hasError || !networkAvailable) {
    return 'warning';
  }

  return onlineCount > 0 ? 'success' : 'danger';
}

function formatNumberOrUnavailable(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return unavailableText;
  }

  return formatNumber(value);
}

function filterTransactionRecords(
  records: readonly AccountTransactionRecordResult[],
  searchText: string,
  selectedFilter: TransactionFilterOption
) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  return records.filter((record) => {
    const matchesFilter = selectedFilter === '全部'
      || selectedFilter === '交易'
      || (selectedFilter === '转账' && record.kind === 'transfer')
      || (selectedFilter === '隐私' && record.kind.startsWith('privacy_'))
      || (selectedFilter === 'DPoS' && isDposTransactionKind(record.kind));

    if (!matchesFilter) {
      return false;
    }

    if (normalizedSearchText.length === 0) {
      return true;
    }

    const searchableText = `${record.signature} ${record.counterparty ?? ''} ${record.kind} ${record.blockhash}`.toLowerCase();
    return searchableText.includes(normalizedSearchText);
  });
}

function groupTransactionRecords(records: readonly AccountTransactionRecordResult[]) {
  const groups: { records: AccountTransactionRecordResult[]; title: string }[] = [];

  for (const record of records) {
    const title = createDateGroupTitle(record.submit_time_unix_milli);
    const existingGroup = groups.find((group) => group.title === title);

    if (existingGroup) {
      existingGroup.records.push(record);
      continue;
    }

    groups.push({ records: [record], title });
  }

  return groups;
}

function createTransactionSummary(records: readonly AccountTransactionRecordResult[]) {
  const finalizedCount = records.filter((record) => record.status === 'finalized').length;
  const pendingCount = records.filter((record) => record.status === 'confirmed' || record.status === 'pending').length;

  return {
    failed: unavailableText,
    feeText: unavailableText,
    pending: String(pendingCount),
    success: String(finalizedCount),
    total: String(records.length)
  };
}

function createDateGroupTitle(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '时间不可用';
  }

  const recordDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDate(recordDate, today)) {
    return '今天';
  }

  if (isSameDate(recordDate, yesterday)) {
    return '昨天';
  }

  return recordDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function isSameDate(leftDate: Date, rightDate: Date) {
  return leftDate.getFullYear() === rightDate.getFullYear()
    && leftDate.getMonth() === rightDate.getMonth()
    && leftDate.getDate() === rightDate.getDate();
}

function isDposTransactionKind(kind: AccountTransactionRecordResult['kind']) {
  return kind === 'validator_register'
    || kind === 'validator_commission'
    || kind === 'stake_deposit'
    || kind === 'stake_withdraw'
    || kind === 'slash';
}

function createTransactionKindTitle(kind: AccountTransactionRecordResult['kind']) {
  if (kind === 'transfer') {
    return '转出 LAMPORTS';
  }

  if (kind === 'privacy_deposit' || kind === 'privacy_withdraw') {
    return '隐私交易';
  }

  if (kind === 'validator_register') {
    return '验证者注册';
  }

  if (kind === 'validator_commission') {
    return '调整佣金';
  }

  if (kind === 'stake_deposit') {
    return '委托质押';
  }

  if (kind === 'stake_withdraw') {
    return '解除质押';
  }

  return 'Slash';
}

function createTransactionKindLabel(kind: AccountTransactionRecordResult['kind']) {
  if (kind === 'transfer') {
    return '转';
  }

  if (kind.startsWith('privacy_')) {
    return '隐';
  }

  if (isDposTransactionKind(kind)) {
    return 'DP';
  }

  return 'TX';
}

function createTransactionRowMeta(record: AccountTransactionRecordResult, counterparty: string) {
  const counterpartyText = counterparty === unavailableText ? unavailableText : shortValue(counterparty);
  const slotText = Number.isFinite(record.slot) && record.slot > 0 ? `Slot ${formatNumber(record.slot)}` : '';
  const metaParts = [counterpartyText, slotText].filter((part) => part.length > 0);
  return metaParts.length > 0 ? metaParts.join(' · ') : unavailableText;
}

function formatCompactTimestamp(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return unavailableText;
  }

  return new Date(value).toLocaleTimeString('zh-CN', { hour12: false });
}

function getTransactionIconName(record: AccountTransactionRecordResult): MaterialIconName {
  if (record.kind.startsWith('privacy_')) {
    return 'eye-off-outline';
  }

  if (isDposTransactionKind(record.kind)) {
    return 'shield-check-outline';
  }

  return record.direction === 'outgoing' ? 'arrow-up' : 'arrow-down';
}

function getTransactionIconStyle(record: AccountTransactionRecordResult, styles: ReturnType<typeof createStyles>) {
  if (record.kind.startsWith('privacy_')) {
    return [styles.transactionIconBadge, styles.transactionIconBadgePrivacy];
  }

  if (isDposTransactionKind(record.kind)) {
    return [styles.transactionIconBadge, styles.transactionIconBadgeDpos];
  }

  return record.direction === 'outgoing'
    ? [styles.transactionIconBadge, styles.transactionIconBadgeOutgoing]
    : [styles.transactionIconBadge, styles.transactionIconBadgeIncoming];
}

function getTransactionStatusTextStyle(statusTone: 'success' | 'warning', styles: ReturnType<typeof createStyles>) {
  return statusTone === 'success' ? styles.transactionStatusSuccessText : styles.transactionStatusWarningText;
}

function getBlockTransactionIconName(transaction: unknown): BlockDetailIconName {
  if (!transaction || typeof transaction !== 'object') {
    return 'txTransfer';
  }

  const transactionText = stringifyBlockTransaction(transaction).toLowerCase();
  if (transactionText.includes('privacy')) {
    return 'txPrivacy';
  }

  if (transactionText.includes('stake') || transactionText.includes('validator')) {
    return 'txStake';
  }

  if (transactionText.includes('contract') || transactionText.includes('program')) {
    return 'txContract';
  }

  return 'txTransfer';
}

function stringifyBlockTransaction(transaction: object) {
  try {
    return JSON.stringify(transaction);
  } catch {
    return '';
  }
}

function extractTransactionTitle(transaction: unknown, index: number) {
  if (transaction && typeof transaction === 'object' && 'signature' in transaction) {
    return shortValue(String((transaction as { signature?: unknown }).signature ?? `交易 #${index + 1}`));
  }

  return `交易 #${index + 1}`;
}

function createBlockTransactionDisplay(transaction: unknown, index: number): BlockTransactionDisplay {
  const transactionRecord = getPlainTransactionRecord(transaction);
  const iconName = getBlockTransactionIconName(transaction);

  return {
    amountText: readLamportsText(transactionRecord, ['amount_lamports', 'lamports']),
    feeText: readLamportsText(transactionRecord, ['fee_lamports', 'fee']),
    iconName,
    kindLabel: createBlockTransactionKindLabel(transaction, iconName),
    statusText: createBlockTransactionStatusText(transactionRecord),
    title: extractTransactionTitle(transaction, index)
  };
}

function getPlainTransactionRecord(transaction: unknown): Record<string, unknown> | null {
  if (transaction === null || typeof transaction !== 'object' || Array.isArray(transaction)) {
    return null;
  }

  return transaction as Record<string, unknown>;
}

function readLamportsText(record: Record<string, unknown> | null, keys: readonly string[]) {
  if (record === null) {
    return unavailableText;
  }

  for (const key of keys) {
    const formattedValue = formatLamportsValue(record[key]);
    if (formattedValue !== null) {
      return formattedValue;
    }
  }

  return unavailableText;
}

function formatLamportsValue(value: unknown) {
  if (typeof value === 'bigint' && value >= 0n) {
    return formatLamports(value.toString());
  }

  if (Number.isSafeInteger(value) && Number(value) >= 0) {
    return formatLamports(String(value));
  }

  if (typeof value === 'string' && /^[0-9]+$/.test(value.trim())) {
    return formatLamports(value.trim());
  }

  return null;
}

// 功能目的：只展示 RPC 返回的真实 leader 字段；实现原因：不能用验证者列表补偿区块生产者，避免链上数据失真。
function readBlockLeaderAddress(block: BlockResult | null | undefined) {
  const blockRecord = getPlainTransactionRecord(block);
  const directAddress = readFirstStringField(blockRecord, [
    'leader_address',
    'leaderAddress',
    'leader',
    'leader_id',
    'leaderId',
    'producer_address',
    'producerAddress',
    'block_producer',
    'blockProducer',
    'validator_address',
    'validatorAddress'
  ]);
  if (directAddress !== null) {
    return directAddress;
  }

  return readFirstStringField(getPlainTransactionRecord(blockRecord?.header), [
    'leader_address',
    'leaderAddress',
    'leader_id',
    'leaderId',
    'validator_address',
    'validatorAddress'
  ]);
}

function readBlockLeaderSource(block: BlockResult | null | undefined) {
  const source = readFirstStringField(getPlainTransactionRecord(block), ['leader_address_source']);
  if (source === 'transaction_detail') {
    return source;
  }
  return readBlockLeaderAddress(block) === null ? null : 'block';
}

function createBlockLeaderMeta(hasLeaderAddress: boolean, source: string | null) {
  if (!hasLeaderAddress) {
    return '当前 RPC 未提供出块者字段';
  }
  if (source === 'transaction_detail') {
    return '通过 getTransaction 确认出块 leader';
  }
  return '当前区块出块 leader 地址';
}

function readTransactionLeaderAddress(detail: TransactionDetailResult | null | undefined) {
  return readFirstStringField(getPlainTransactionRecord(detail), [
    'leader_address',
    'leaderAddress',
    'leader',
    'leader_id',
    'leaderId',
    'validator_address',
    'validatorAddress'
  ]);
}

function readFirstBlockTransactionSignature(transactions: BlockResult['transactions']) {
  if (!Array.isArray(transactions)) {
    return null;
  }

  for (const transaction of transactions) {
    const directSignature = readNonEmptyString(transaction);
    if (directSignature !== null) {
      return directSignature;
    }
    const recordSignature = readFirstStringField(getPlainTransactionRecord(transaction), [
      'signature',
      'txid',
      'transaction_id',
      'transactionId'
    ]);
    if (recordSignature !== null) {
      return recordSignature;
    }
  }

  return null;
}

function readFirstStringField(record: Record<string, unknown> | null, keys: readonly string[]) {
  if (record === null) {
    return null;
  }

  for (const key of keys) {
    const value = readNonEmptyString(record[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function readNonEmptyString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function formatOptionalLamports(value: unknown) {
  return formatLamportsValue(value) ?? unavailableText;
}

function formatOptionalCount(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    return unavailableText;
  }

  return formatNumber(Number(value));
}

function formatBasisPoints(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 10000) {
    return unavailableText;
  }

  const percentageText = (Number(value) / 100).toFixed(2).replace(/\.?0+$/, '');
  return `${percentageText}%`;
}

function formatBlockTimestamp(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    return unavailableText;
  }

  return formatTimestamp(Number(value));
}

function createBlockTransactionKindLabel(transaction: unknown, iconName: BlockDetailIconName) {
  const transactionText = transaction && typeof transaction === 'object' ? stringifyBlockTransaction(transaction).toLowerCase() : '';
  const kindMatch = /"(kind|type|instruction)"\s*:\s*"([^"]+)"/i.exec(transactionText);

  if (kindMatch?.[2]) {
    return kindMatch[2].slice(0, 14);
  }

  if (iconName === 'txStake') {
    return 'stake';
  }

  if (iconName === 'txContract') {
    return 'contract';
  }

  if (iconName === 'txPrivacy') {
    return 'privacy';
  }

  return 'transfer';
}

function createBlockTransactionStatusText(record: Record<string, unknown> | null) {
  if (record === null) {
    return '已返回';
  }

  const finalized = record.finalized;
  if (finalized === true) {
    return 'Finalized';
  }

  const statusText = typeof record.status === 'string' ? record.status.trim() : '';
  if (statusText.length > 0) {
    return statusText;
  }

  return '已返回';
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return unavailableText;
  }

  return Math.trunc(value).toLocaleString('en-US');
}

function formatTime(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return unavailableText;
  }

  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false });
}

function createFinalityLagText(health: HealthResult) {
  const lag = Math.max(0, health.head_height - health.finalized_height);
  return lag === 0 ? '已最终' : `${lag} 高度`;
}

function createConfirmationText(health: HealthResult | null, slot: number) {
  if (!health || !Number.isFinite(slot)) {
    return unavailableText;
  }

  if (slot <= health.finalized_height) {
    return 'Finalized';
  }

  return `${Math.max(0, health.head_slot - slot)} 块确认`;
}

function createBlockFinalityText(detail: BlockDetailData | null) {
  if (detail === null) {
    return '等待查询';
  }

  if (detail.health === null) {
    return unavailableText;
  }

  return detail.block.slot <= detail.health.finalized_height ? 'Finalized' : 'Confirmed';
}

function createOnlineRateText(peers: readonly PeerNetworkPeer[]) {
  if (peers.length === 0) {
    return unavailableText;
  }

  const connectedCount = countConnectedPeers(peers);
  const rate = Math.round((connectedCount / peers.length) * 10000) / 100;
  return `${rate.toFixed(2)}%`;
}

function createValidatorReachabilityText(peers: readonly PeerNetworkPeer[], node: NodeStatusResult) {
  const validatorPeers = peers.filter((peer) => peer.validator);
  const connectedValidators = validatorPeers.filter((peer) => peer.connected).length;
  const totalValidators = validatorPeers.length || node.consensus.validator_count || node.validator_count;
  return totalValidators > 0 ? `${connectedValidators} / ${totalValidators}` : unavailableText;
}

function countConnectedPeers(peers: readonly PeerNetworkPeer[]) {
  return peers.filter((peer) => peer.connected).length;
}

function buildRpcEndpointRows(currentEndpoint: string, data: NetworkStatusData) {
  const candidates = [
    { endpoint: currentEndpoint, name: '当前节点', current: true },
    ...PUBLIC_VALIDATOR_RPC_URLS.map((endpoint, index) => ({
      endpoint,
      name: `公网验证者 ${index + 1}`,
      current: currentEndpoint === endpoint
    })),
    { endpoint: DEFAULT_LOCAL_RPC_URL, name: '本地节点', current: currentEndpoint === DEFAULT_LOCAL_RPC_URL }
  ];
  const seenEndpoints = new Set<string>();

  return candidates
    .filter((candidate) => {
      if (seenEndpoints.has(candidate.endpoint)) {
        return false;
      }
      seenEndpoints.add(candidate.endpoint);
      return true;
    })
    .map((candidate, index) => ({
      badge: index === 0 ? 'RPC' : '备',
      current: candidate.current,
      endpoint: candidate.endpoint,
      height: candidate.current ? `高度 ${formatNumberOrUnavailable(data.health.head_height)}` : '未检测',
      name: candidate.name,
      status: candidate.current ? (data.health.ok ? '正常' : '待检测') : '未检测'
    }));
}

function formatNodeRoles(node: NodeStatusResult) {
  const roles = node.node_roles && node.node_roles.length > 0 ? node.node_roles : node.node_role ? [node.node_role] : [];
  if (roles.length > 0) {
    return roles.join(' / ');
  }

  return node.node_mode || unavailableText;
}

function createRpcRoleBadges(node: NodeStatusResult) {
  const roleCandidates = node.node_roles && node.node_roles.length > 0 ? node.node_roles : node.node_role ? [node.node_role] : [];
  if (roleCandidates.length > 0) {
    return roleCandidates.slice(0, 2);
  }

  if (node.node_mode) {
    return [node.node_mode];
  }

  return [unavailableText];
}

function createRpcSecurityText(endpoint: string, node: NodeStatusResult) {
  if (endpoint.startsWith('https://') || node.p2p_secure_session) {
    return 'TLS 1.3 已启用';
  }

  return createSecurityText(endpoint, node);
}

function createRpcUpstreamIds(node: NodeStatusResult) {
  const upstreamIds = [
    ...(node.transaction_fast_path.validator_peer_ids ?? []),
    ...(node.transaction_fast_path.preferred_peer_ids ?? [])
  ].filter((peerID) => peerID.length > 0);

  return Array.from(new Set(upstreamIds)).slice(0, 2);
}

function createSecurityText(endpoint: string, node: NodeStatusResult) {
  const transportText = endpoint.startsWith('https://') ? 'HTTPS' : 'HTTP 明文';
  const p2pText = node.p2p_secure_session ? 'P2P 加密' : 'P2P 未加密';
  return `${transportText} · ${p2pText}`;
}

function createCapabilityRows(node: NodeStatusResult) {
  const names = new Set(node.node_capability_names ?? []);
  return [
    { enabled: names.has('transaction') || node.transaction_fast_path.fast_path_available, meta: names.has('transaction') ? '支持' : unavailableText, title: '接收交易' },
    { enabled: true, meta: '支持', title: '查询链状态' },
    { enabled: node.transaction_fast_path.fast_path_available, meta: node.transaction_fast_path.fast_path_available ? '支持' : unavailableText, title: '转发到验证者' },
    { enabled: false, meta: unavailableText, title: '不暴露管理 RPC' },
    { enabled: true, meta: '仅已签名交易', title: '本地签名要求' },
    { enabled: names.has('payment') || names.has('query'), meta: names.has('payment') || names.has('query') ? '支持' : unavailableText, title: '支付/查询隔离' }
  ];
}

function getPathIconName(index: number): MaterialIconName {
  if (index === 0) {
    return 'cellphone';
  }

  if (index === 1) {
    return 'web';
  }

  if (index === 2) {
    return 'source-branch';
  }

  return 'shield-check-outline';
}

function getToneIconName(tone: RowTone): MaterialIconName {
  if (tone === 'warning') {
    return 'alert-circle-outline';
  }

  if (tone === 'danger') {
    return 'close-circle-outline';
  }

  if (tone === 'primary') {
    return 'cube-outline';
  }

  return 'check-circle-outline';
}

function getToneColor(tone: RowTone) {
  if (tone === 'warning') {
    return colors.warning;
  }

  if (tone === 'danger') {
    return colors.negative;
  }

  if (tone === 'muted') {
    return colors.textMuted;
  }

  if (tone === 'primary') {
    return colors.primary;
  }

  return colors.success;
}

function getToneStyle(
  tone: RowTone | undefined,
  defaultStyle: StyleProp<ViewStyle>,
  warningStyle: StyleProp<ViewStyle>,
  dangerStyle: StyleProp<ViewStyle>
): StyleProp<ViewStyle> {
  if (tone === 'warning') {
    return warningStyle;
  }

  if (tone === 'danger') {
    return dangerStyle;
  }

  return defaultStyle;
}

function getToneTextStyle(
  tone: RowTone | undefined,
  defaultStyle: StyleProp<TextStyle>,
  successStyle: StyleProp<TextStyle>,
  warningStyle: StyleProp<TextStyle>,
  dangerStyle: StyleProp<TextStyle>
): StyleProp<TextStyle> {
  if (tone === 'success') {
    return successStyle;
  }

  if (tone === 'warning') {
    return warningStyle;
  }

  if (tone === 'danger') {
    return dangerStyle;
  }

  return defaultStyle;
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    backButton: {
      alignItems: 'center',
      height: scaled(58, scale),
      justifyContent: 'center',
      width: scaled(58, scale)
    },
    backIcon: {
      color: colors.text,
      fontSize: scaled(54, scale),
      lineHeight: scaled(58, scale),
      ...textBase
    },
    blockHashCopyButton: {
      alignItems: 'center',
      height: scaled(42, scale),
      justifyContent: 'center',
      marginLeft: scaled(10, scale),
      width: scaled(42, scale)
    },
    blockHashLabel: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(28, scale),
      width: scaled(198, scale),
      ...textBase
    },
    blockHashRow: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(58, scale)
    },
    blockHashValue: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(20, scale),
      lineHeight: scaled(28, scale),
      ...textBase
    },
    blockHero: {
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(372, scale),
      marginTop: scaled(16, scale),
      overflow: 'hidden',
      position: 'relative'
    },
    blockHeroContent: {
      bottom: 0,
      left: 0,
      paddingHorizontal: scaled(30, scale),
      paddingVertical: scaled(27, scale),
      position: 'absolute',
      right: 0,
      top: 0
    },
    blockHeroLatency: {
      color: '#B9C0CE',
      flex: 1,
      fontSize: scaled(21, scale),
      lineHeight: scaled(29, scale),
      marginLeft: scaled(14, scale),
      textAlign: 'right',
      ...textBase
    },
    blockHeroMetric: {
      minHeight: scaled(75, scale),
      paddingHorizontal: scaled(20, scale),
      paddingVertical: scaled(10, scale),
      width: '50%'
    },
    blockHeroMetricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: scaled(34, scale),
      maxWidth: scaled(560, scale)
    },
    blockHeroMetricLabel: {
      color: '#C3C8D4',
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      ...textBase
    },
    blockHeroMetricValue: {
      color: '#FFFFFF',
      fontSize: scaled(30, scale),
      fontWeight: '900',
      lineHeight: scaled(38, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    blockHeroMetricLower: {
      borderTopColor: '#FFFFFF26',
      borderTopWidth: 1
    },
    blockHeroMetricRight: {
      borderLeftColor: '#FFFFFF26',
      borderLeftWidth: 1
    },
    blockHeroStatusDot: {
      backgroundColor: colors.success,
      borderRadius: scaled(8, scale),
      height: scaled(16, scale),
      width: scaled(16, scale)
    },
    blockHeroStatusDotWarning: {
      backgroundColor: colors.warning,
      borderRadius: scaled(8, scale),
      height: scaled(16, scale),
      width: scaled(16, scale)
    },
    blockHeroStatusRow: {
      alignItems: 'center',
      flexDirection: 'row'
    },
    blockHeroStatusText: {
      color: colors.success,
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      marginLeft: scaled(10, scale),
      ...textBase
    },
    blockHeroStatusTextWarning: {
      color: colors.warning,
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      marginLeft: scaled(10, scale),
      ...textBase
    },
    blockIconMetric: {
      alignItems: 'center',
      borderRightColor: colors.border,
      borderRightWidth: 1,
      flexDirection: 'row',
      flex: 1,
      minHeight: scaled(76, scale),
      paddingHorizontal: scaled(12, scale)
    },
    blockIconMetricLabel: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      ...textBase
    },
    blockIconMetricStrip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: scaled(18, scale),
      minHeight: scaled(104, scale),
      paddingHorizontal: scaled(16, scale),
      paddingVertical: scaled(15, scale),
      ...shadows.card
    },
    blockIconMetricText: {
      flex: 1,
      marginLeft: scaled(10, scale)
    },
    blockIconMetricValue: {
      color: colors.text,
      fontSize: scaled(20, scale),
      fontWeight: '800',
      lineHeight: scaled(28, scale),
      marginTop: scaled(3, scale),
      ...textBase
    },
    blockSectionAction: {
      alignItems: 'center',
      flexDirection: 'row'
    },
    blockSectionActionText: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(27, scale),
      ...textBase
    },
    blockSectionCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(18, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(26, scale),
      paddingVertical: scaled(21, scale),
      ...shadows.card
    },
    blockSectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: scaled(14, scale)
    },
    blockSectionTitle: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '900',
      lineHeight: scaled(36, scale),
      ...textBase
    },
    blockTransactionFee: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(27, scale),
      textAlign: 'right',
      ...textBase
    },
    blockTransactionList: {
      marginTop: scaled(2, scale)
    },
    blockTransactionMain: {
      flex: 1,
      marginLeft: scaled(16, scale),
      minWidth: 0
    },
    blockTransactionMeta: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    blockTransactionMetaBlock: {
      alignItems: 'flex-end',
      marginLeft: scaled(16, scale),
      width: scaled(90, scale)
    },
    blockTransactionRow: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(62, scale),
      paddingVertical: scaled(12, scale)
    },
    blockTransactionRowLast: {
      borderBottomWidth: 0
    },
    blockTransactionStatus: {
      color: colors.success,
      fontSize: scaled(18, scale),
      fontWeight: '900',
      lineHeight: scaled(25, scale),
      marginTop: scaled(3, scale),
      ...textBase
    },
    blockTransactionAmount: {
      color: colors.negative,
      fontSize: scaled(20, scale),
      fontWeight: '800',
      lineHeight: scaled(27, scale),
      textAlign: 'right',
      ...textBase
    },
    blockTransactionAmountBlock: {
      marginLeft: scaled(14, scale),
      width: scaled(96, scale)
    },
    blockTransactionEmptyBox: {
      backgroundColor: '#F6F8FE',
      borderColor: '#E5E7F4',
      borderRadius: scaled(16, scale),
      borderWidth: 1,
      minHeight: scaled(72, scale),
      justifyContent: 'center',
      paddingHorizontal: scaled(24, scale)
    },
    blockTransactionEmptyText: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    blockTransactionTag: {
      backgroundColor: '#EEF3FF',
      borderRadius: scaled(7, scale),
      color: colors.primary,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      marginLeft: scaled(12, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(9, scale),
      textAlign: 'center',
      width: scaled(82, scale),
      ...textBase
    },
    blockTransactionTitle: {
      color: colors.text,
      fontSize: scaled(21, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    blockTransactionUnavailableValue: {
      color: colors.text,
      fontSize: scaled(20, scale),
      fontWeight: '800',
      lineHeight: scaled(27, scale),
      textAlign: 'right',
      ...textBase
    },
    blockButtonRow: {
      flexDirection: 'row',
      gap: scaled(18, scale),
      marginTop: scaled(20, scale)
    },
    blockPrimaryButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderColor: colors.primary,
      borderRadius: scaled(16, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(10, scale),
      height: scaled(72, scale),
      justifyContent: 'center'
    },
    blockPrimaryButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(23, scale),
      fontWeight: '900',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    blockQueryButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(14, scale),
      height: scaled(52, scale),
      justifyContent: 'center',
      paddingHorizontal: scaled(24, scale)
    },
    blockQueryButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(21, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    blockQueryInput: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(22, scale),
      height: scaled(56, scale),
      lineHeight: scaled(30, scale),
      paddingHorizontal: scaled(12, scale),
      ...textBase
    },
    blockQueryPanel: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(20, scale),
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: scaled(16, scale),
      minHeight: scaled(76, scale),
      paddingHorizontal: scaled(18, scale),
      ...shadows.card
    },
    blockSecondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: '#151927',
      borderRadius: scaled(16, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(10, scale),
      height: scaled(72, scale),
      justifyContent: 'center'
    },
    blockSecondaryButtonText: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '900',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    blockValidatorActionButton: {
      alignItems: 'center',
      borderColor: '#C8CEDA',
      borderRadius: scaled(8, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(49, scale),
      justifyContent: 'center',
      minWidth: scaled(138, scale),
      paddingHorizontal: scaled(16, scale)
    },
    blockValidatorActionText: {
      color: colors.text,
      fontSize: scaled(20, scale),
      lineHeight: scaled(28, scale),
      ...textBase
    },
    blockValidatorCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(18, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(26, scale),
      paddingVertical: scaled(24, scale),
      ...shadows.card
    },
    blockValidatorHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: scaled(21, scale)
    },
    blockValidatorIdentity: {
      flex: 1,
      marginLeft: scaled(20, scale),
      minWidth: 0
    },
    blockValidatorLogo: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(38, scale),
      height: scaled(76, scale),
      justifyContent: 'center',
      overflow: 'hidden',
      width: scaled(76, scale)
    },
    blockValidatorLogoImage: {
      height: scaled(52, scale),
      width: scaled(52, scale)
    },
    blockValidatorMeta: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      ...textBase
    },
    blockValidatorMetric: {
      borderRightColor: colors.border,
      borderRightWidth: 1,
      flex: 1,
      minHeight: scaled(78, scale),
      paddingHorizontal: scaled(12, scale)
    },
    blockValidatorMetricLabel: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      ...textBase
    },
    blockValidatorMetricStrip: {
      flexDirection: 'row',
      marginTop: scaled(30, scale)
    },
    blockValidatorMetricValue: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '900',
      lineHeight: scaled(30, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    blockValidatorName: {
      color: colors.text,
      fontSize: scaled(26, scale),
      fontWeight: '900',
      lineHeight: scaled(35, scale),
      ...textBase
    },
    blockValidatorStatusDot: {
      backgroundColor: colors.warning,
      borderRadius: scaled(5, scale),
      height: scaled(10, scale),
      width: scaled(10, scale)
    },
    blockValidatorStatusDotSuccess: {
      backgroundColor: colors.success,
      borderRadius: scaled(5, scale),
      height: scaled(10, scale),
      width: scaled(10, scale)
    },
    blockValidatorStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(8, scale),
      marginTop: scaled(6, scale)
    },
    blockValidatorSummary: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: scaled(86, scale)
    },
    buttonRow: {
      flexDirection: 'row',
      gap: scaled(14, scale),
      marginTop: scaled(18, scale)
    },
    canvas: {
      paddingHorizontal: scaled(26, scale),
      paddingTop: scaled(18, scale)
    },
    cardAction: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(4, scale),
      minHeight: scaled(34, scale)
    },
    cardActionText: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(27, scale),
      ...textBase
    },
    cardTitle: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(27, scale),
      fontWeight: '900',
      lineHeight: scaled(36, scale),
      ...textBase
    },
    cardTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: scaled(16, scale)
    },
    compactButton: {
      flex: 0.72
    },
    copyIconButton: {
      alignItems: 'center',
      height: scaled(44, scale),
      justifyContent: 'center',
      width: scaled(44, scale)
    },
    epochMeta: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(28, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    epochRemaining: {
      color: colors.primary,
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    epochRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    epochTitle: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '900',
      lineHeight: scaled(36, scale),
      ...textBase
    },
    errorPanel: {
      backgroundColor: '#FFF2F2',
      borderColor: '#FFD1D1',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      marginTop: scaled(16, scale),
      padding: scaled(20, scale)
    },
    errorText: {
      color: '#B42318',
      fontSize: scaled(23, scale),
      lineHeight: scaled(31, scale),
      ...textBase
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: scaled(72, scale)
    },
    explorerCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(18, scale),
      padding: scaled(22, scale),
      ...shadows.card
    },
    filterTab: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderRadius: scaled(24, scale),
      height: scaled(52, scale),
      justifyContent: 'center',
      minWidth: scaled(92, scale),
      paddingHorizontal: scaled(20, scale)
    },
    filterTabActive: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(52, scale),
      justifyContent: 'center',
      minWidth: scaled(92, scale),
      paddingHorizontal: scaled(20, scale)
    },
    filterTabText: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    filterTabTextActive: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    filterTabs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaled(12, scale),
      marginTop: scaled(16, scale)
    },
    footnote: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(27, scale),
      marginTop: scaled(14, scale),
      textAlign: 'center',
      ...textBase
    },
    hashLabel: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(28, scale),
      width: scaled(170, scale),
      ...textBase
    },
    hashRow: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(58, scale)
    },
    hashValue: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(20, scale),
      lineHeight: scaled(28, scale),
      ...textBase
    },
    healthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaled(12, scale)
    },
    healthItem: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: scaled(16, scale),
      borderWidth: 1,
      flexBasis: '47%',
      flexGrow: 1,
      minHeight: scaled(116, scale),
      padding: scaled(14, scale)
    },
    healthLabel: {
      color: colors.text,
      fontSize: scaled(20, scale),
      fontWeight: '700',
      lineHeight: scaled(28, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    healthMeta: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    heroEyebrow: {
      color: '#B9C0CE',
      fontSize: scaled(24, scale),
      fontWeight: '600',
      left: scaled(28, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(28, scale),
      ...textBase
    },
    heroImage: {
      height: '100%',
      position: 'absolute',
      right: 0,
      top: 0,
      width: '100%'
    },
    heroFooterBar: {
      borderColor: '#FFFFFF22',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      bottom: scaled(22, scale),
      flexDirection: 'row',
      left: scaled(20, scale),
      minHeight: scaled(78, scale),
      overflow: 'hidden',
      position: 'absolute',
      right: scaled(20, scale)
    },
    heroFooterItem: {
      borderRightColor: '#FFFFFF22',
      borderRightWidth: 1,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: scaled(14, scale)
    },
    heroFooterLabel: {
      color: '#C3C8D4',
      fontSize: scaled(17, scale),
      lineHeight: scaled(24, scale),
      ...textBase
    },
    heroFooterValue: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      fontWeight: '900',
      lineHeight: scaled(30, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    heroMetricGridModern: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaled(12, scale),
      left: scaled(24, scale),
      position: 'absolute',
      right: scaled(24, scale),
      top: scaled(188, scale)
    },
    heroMetricLabelSmall: {
      color: '#C3C8D4',
      fontSize: scaled(17, scale),
      lineHeight: scaled(24, scale),
      ...textBase
    },
    heroMetricModern: {
      borderLeftColor: '#FFFFFF22',
      borderLeftWidth: 1,
      minHeight: scaled(72, scale),
      paddingLeft: scaled(14, scale),
      width: '31%'
    },
    heroMetricValueSmall: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '900',
      lineHeight: scaled(33, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    heroPanel: {
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(260, scale),
      marginTop: scaled(16, scale),
      overflow: 'hidden',
      position: 'relative'
    },
    heroShade: {
      ...StyleSheet.absoluteFillObject
    },
    heroPrimaryLabel: {
      color: '#C3C8D4',
      fontSize: scaled(19, scale),
      left: scaled(24, scale),
      lineHeight: scaled(26, scale),
      position: 'absolute',
      top: scaled(104, scale),
      ...textBase
    },
    heroPrimaryValue: {
      color: '#FFFFFF',
      fontSize: scaled(30, scale),
      fontWeight: '900',
      left: scaled(24, scale),
      lineHeight: scaled(40, scale),
      position: 'absolute',
      right: scaled(24, scale),
      top: scaled(132, scale),
      ...textBase
    },
    heroStatusDot: {
      backgroundColor: colors.success,
      borderRadius: scaled(8, scale),
      height: scaled(16, scale),
      width: scaled(16, scale)
    },
    heroStatusDotDanger: {
      backgroundColor: colors.negative,
      borderRadius: scaled(8, scale),
      height: scaled(16, scale),
      width: scaled(16, scale)
    },
    heroStatusDotWarning: {
      backgroundColor: colors.warning,
      borderRadius: scaled(8, scale),
      height: scaled(16, scale),
      width: scaled(16, scale)
    },
    heroStatusLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(12, scale),
      left: scaled(24, scale),
      position: 'absolute',
      top: scaled(28, scale)
    },
    heroStatusText: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    heroStatusTextDanger: {
      color: colors.negative,
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    heroStatusTextSuccess: {
      color: colors.success,
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    heroStatusTextWarning: {
      color: colors.warning,
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    heroTitle: {
      color: '#FFFFFF',
      fontSize: scaled(40, scale),
      fontWeight: '900',
      left: scaled(28, scale),
      lineHeight: scaled(50, scale),
      position: 'absolute',
      top: scaled(76, scale),
      ...textBase
    },
    heroValue: {
      bottom: scaled(32, scale),
      color: '#DDE3F0',
      fontSize: scaled(24, scale),
      left: scaled(28, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      right: scaled(28, scale),
      ...textBase
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(20, scale),
      borderWidth: 1,
      marginTop: scaled(16, scale),
      paddingHorizontal: scaled(22, scale),
      paddingVertical: scaled(16, scale),
      ...shadows.card
    },
    infoLabel: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      lineHeight: scaled(29, scale),
      width: scaled(180, scale),
      ...textBase
    },
    infoPanel: {
      backgroundColor: '#F6F8FF',
      borderColor: '#E2E7FF',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      marginTop: scaled(16, scale),
      padding: scaled(20, scale)
    },
    infoRow: {
      flexDirection: 'row',
      paddingVertical: scaled(8, scale)
    },
    infoText: {
      color: colors.text,
      fontSize: scaled(23, scale),
      lineHeight: scaled(31, scale),
      ...textBase
    },
    infoValue: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(22, scale),
      lineHeight: scaled(30, scale),
      ...textBase
    },
    metricDangerText: {
      color: colors.negative,
      fontSize: scaled(25, scale),
      fontWeight: '900',
      lineHeight: scaled(33, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    metricSuccessText: {
      color: colors.success,
      fontSize: scaled(25, scale),
      fontWeight: '900',
      lineHeight: scaled(33, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    metricWarningText: {
      color: colors.warning,
      fontSize: scaled(25, scale),
      fontWeight: '900',
      lineHeight: scaled(33, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    inputButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(14, scale),
      height: scaled(58, scale),
      justifyContent: 'center',
      marginTop: scaled(14, scale)
    },
    inputButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '800',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    inputLabel: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      marginBottom: scaled(12, scale),
      ...textBase
    },
    inputPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(20, scale),
      borderWidth: 1,
      marginTop: scaled(16, scale),
      padding: scaled(20, scale),
      ...shadows.card
    },
    miniActionButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(14, scale),
      height: scaled(52, scale),
      justifyContent: 'center',
      paddingHorizontal: scaled(22, scale)
    },
    miniActionText: {
      color: '#FFFFFF',
      fontSize: scaled(21, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaled(14, scale),
      marginTop: scaled(16, scale)
    },
    metricItem: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      minHeight: scaled(112, scale),
      padding: scaled(18, scale),
      width: '47%',
      ...shadows.card
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(27, scale),
      ...textBase
    },
    metricValue: {
      color: colors.text,
      fontSize: scaled(30, scale),
      fontWeight: '900',
      lineHeight: scaled(39, scale),
      marginTop: scaled(12, scale),
      ...textBase
    },
    multilineInput: {
      borderColor: colors.border,
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      color: colors.text,
      fontSize: scaled(22, scale),
      minHeight: scaled(130, scale),
      paddingHorizontal: scaled(16, scale),
      paddingVertical: scaled(14, scale),
      textAlignVertical: 'top',
      ...textBase
    },
    recordBadge: {
      alignItems: 'center',
      backgroundColor: '#EFF0FF',
      borderRadius: scaled(18, scale),
      height: scaled(62, scale),
      justifyContent: 'center',
      width: scaled(62, scale)
    },
    recordBadgeText: {
      color: colors.primary,
      fontSize: scaled(20, scale),
      fontWeight: '900',
      lineHeight: scaled(26, scale),
      ...textBase
    },
    recordChevron: {
      color: colors.textMuted,
      fontSize: scaled(40, scale),
      lineHeight: scaled(44, scale),
      marginLeft: scaled(8, scale),
      ...textBase
    },
    recordMeta: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(28, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    recordRow: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(20, scale),
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: scaled(14, scale),
      minHeight: scaled(104, scale),
      paddingHorizontal: scaled(18, scale),
      ...shadows.card
    },
    recordTextGroup: {
      flex: 1,
      marginLeft: scaled(18, scale)
    },
    recordValue: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    pathConnector: {
      color: colors.textMuted,
      fontSize: scaled(17, scale),
      lineHeight: scaled(24, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    pathIcon: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: scaled(28, scale),
      borderWidth: 1,
      height: scaled(56, scale),
      justifyContent: 'center',
      width: scaled(56, scale)
    },
    pathItem: {
      alignItems: 'center',
      flex: 1,
      minHeight: scaled(124, scale)
    },
    pathLabel: {
      color: colors.text,
      fontSize: scaled(19, scale),
      fontWeight: '800',
      lineHeight: scaled(26, scale),
      marginTop: scaled(10, scale),
      ...textBase
    },
    pathMeta: {
      color: colors.success,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    pathRow: {
      flexDirection: 'row',
      gap: scaled(12, scale)
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderColor: colors.primary,
      borderRadius: scaled(16, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(10, scale),
      height: scaled(72, scale),
      justifyContent: 'center'
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(23, scale),
      fontWeight: '900',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    progressTrack: {
      backgroundColor: '#E7E9F0',
      borderRadius: scaled(6, scale),
      height: scaled(10, scale),
      marginTop: scaled(22, scale),
      overflow: 'hidden'
    },
    progressUnavailable: {
      backgroundColor: colors.borderStrong,
      height: '100%',
      width: '100%'
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    searchInput: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(22, scale),
      height: scaled(56, scale),
      lineHeight: scaled(30, scale),
      paddingHorizontal: scaled(10, scale),
      ...textBase
    },
    searchPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(20, scale),
      borderWidth: 1,
      marginTop: scaled(16, scale),
      padding: scaled(16, scale),
      ...shadows.card
    },
    searchRow: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderRadius: scaled(16, scale),
      flexDirection: 'row',
      minHeight: scaled(62, scale),
      paddingHorizontal: scaled(14, scale)
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: '#2E3344',
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(10, scale),
      height: scaled(66, scale),
      justifyContent: 'center'
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '800',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    sectionTitle: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '900',
      lineHeight: scaled(36, scale),
      marginTop: scaled(24, scale),
      ...textBase
    },
    segment: {
      alignItems: 'center',
      borderRadius: scaled(14, scale),
      flexBasis: '31%',
      flexGrow: 1,
      height: scaled(64, scale),
      justifyContent: 'center'
    },
    segmentActive: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(14, scale),
      flexBasis: '31%',
      flexGrow: 1,
      height: scaled(64, scale),
      justifyContent: 'center'
    },
    segmentText: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    segmentTextActive: {
      color: '#FFFFFF',
      fontSize: scaled(23, scale),
      fontWeight: '800',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    segmented: {
      backgroundColor: '#F2F3F7',
      borderRadius: scaled(18, scale),
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaled(8, scale),
      marginTop: scaled(16, scale),
      padding: scaled(6, scale)
    },
    stackGap: {
      gap: scaled(0, scale)
    },
    statePanel: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(20, scale),
      borderWidth: 1,
      marginTop: scaled(16, scale),
      minHeight: scaled(130, scale),
      justifyContent: 'center'
    },
    stateText: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      lineHeight: scaled(30, scale),
      marginTop: scaled(12, scale),
      ...textBase
    },
    textInput: {
      borderColor: colors.border,
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      color: colors.text,
      fontSize: scaled(23, scale),
      height: scaled(62, scale),
      paddingHorizontal: scaled(16, scale),
      ...textBase
    },
    titleBlock: {
      flex: 1,
      marginLeft: scaled(8, scale)
    },
    title: {
      color: colors.text,
      fontSize: scaled(34, scale),
      fontWeight: fontWeights.pageTitle,
      lineHeight: scaled(43, scale),
      ...textBase
    },
    statusBanner: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: scaled(10, scale),
      minHeight: scaled(82, scale),
      paddingHorizontal: scaled(16, scale)
    },
    statusBannerIcon: {
      alignItems: 'center',
      height: scaled(52, scale),
      justifyContent: 'center',
      width: scaled(52, scale)
    },
    statusBannerMeta: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    statusBannerText: {
      flex: 1,
      marginLeft: scaled(12, scale)
    },
    statusBannerTitle: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '800',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: scaled(23, scale),
      lineHeight: scaled(31, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    traceBar: {
      backgroundColor: '#5A66FF',
      borderRadius: scaled(5, scale),
      width: scaled(18, scale)
    },
    traceBars: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: scaled(10, scale),
      height: scaled(84, scale),
      marginTop: scaled(10, scale)
    },
    traceLabel: {
      color: colors.text,
      fontSize: scaled(20, scale),
      fontWeight: '800',
      lineHeight: scaled(28, scale),
      ...textBase
    },
    traceMeta: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    tracePanel: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      marginTop: scaled(16, scale),
      paddingTop: scaled(14, scale)
    },
    transactionAmount: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '900',
      lineHeight: scaled(31, scale),
      textAlign: 'right',
      ...textBase
    },
    transactionAmountBlock: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginLeft: scaled(12, scale),
      width: scaled(250, scale)
    },
    transactionEmptyIcon: {
      alignItems: 'center',
      backgroundColor: '#EEF3FF',
      borderRadius: scaled(22, scale),
      height: scaled(72, scale),
      justifyContent: 'center',
      width: scaled(72, scale)
    },
    transactionEmptyMeta: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      lineHeight: scaled(29, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    transactionEmptyState: {
      alignItems: 'center',
      backgroundColor: '#F8FAFF',
      borderColor: '#E3E9F8',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      paddingHorizontal: scaled(22, scale),
      paddingVertical: scaled(22, scale)
    },
    transactionEmptyTextBlock: {
      flex: 1,
      marginLeft: scaled(18, scale),
      minWidth: 0
    },
    transactionEmptyTitle: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    transactionGroupCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(18, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(20, scale),
      paddingTop: scaled(18, scale),
      ...shadows.card
    },
    transactionGroupCount: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(4, scale)
    },
    transactionGroupCountText: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(27, scale),
      ...textBase
    },
    transactionGroupHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: scaled(6, scale)
    },
    transactionGroupTitle: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '900',
      lineHeight: scaled(36, scale),
      ...textBase
    },
    transactionHero: {
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(344, scale),
      marginTop: scaled(16, scale),
      overflow: 'hidden',
      position: 'relative'
    },
    transactionHeroAccount: {
      alignItems: 'flex-end',
      flex: 1,
      marginLeft: scaled(16, scale)
    },
    transactionHeroAccountText: {
      color: '#FFFFFF',
      fontSize: scaled(21, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      maxWidth: scaled(330, scale),
      textAlign: 'right',
      ...textBase
    },
    transactionHeroContent: {
      bottom: 0,
      left: 0,
      paddingHorizontal: scaled(26, scale),
      paddingVertical: scaled(24, scale),
      position: 'absolute',
      right: 0,
      top: 0
    },
    transactionHeroEyebrow: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    transactionHeroFee: {
      marginTop: scaled(34, scale)
    },
    transactionHeroFeeLabel: {
      color: '#DDE3F0',
      fontSize: scaled(21, scale),
      lineHeight: scaled(29, scale),
      ...textBase
    },
    transactionHeroFeeValue: {
      color: '#FFFFFF',
      fontSize: scaled(38, scale),
      fontWeight: '900',
      lineHeight: scaled(48, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    transactionHeroMetric: {
      borderRightColor: '#FFFFFF33',
      borderRightWidth: 1,
      flex: 1,
      minHeight: scaled(76, scale),
      paddingHorizontal: scaled(14, scale)
    },
    transactionHeroMetricLabel: {
      color: '#DDE3F0',
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      ...textBase
    },
    transactionHeroMetricValue: {
      color: '#FFFFFF',
      fontSize: scaled(34, scale),
      fontWeight: '900',
      lineHeight: scaled(43, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    transactionHeroMetricValueDanger: {
      color: colors.negative,
      fontSize: scaled(34, scale),
      fontWeight: '900',
      lineHeight: scaled(43, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    transactionHeroMetricValueSuccess: {
      color: colors.success,
      fontSize: scaled(34, scale),
      fontWeight: '900',
      lineHeight: scaled(43, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    transactionHeroMetricValueWarning: {
      color: colors.warning,
      fontSize: scaled(34, scale),
      fontWeight: '900',
      lineHeight: scaled(43, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    transactionHeroStats: {
      flexDirection: 'row',
      marginTop: scaled(50, scale),
      maxWidth: scaled(460, scale)
    },
    rpcActionBar: {
      flexDirection: 'row',
      gap: scaled(14, scale),
      marginTop: scaled(18, scale)
    },
    rpcCapabilityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: scaled(4, scale)
    },
    rpcCapabilityIconBadge: {
      alignItems: 'center',
      borderRadius: scaled(24, scale),
      height: scaled(48, scale),
      justifyContent: 'center',
      width: scaled(48, scale)
    },
    rpcCapabilityIconBadgeSuccess: {
      backgroundColor: '#EAFBF3'
    },
    rpcCapabilityIconBadgeWarning: {
      backgroundColor: '#FFF4E8'
    },
    rpcCapabilityItem: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(92, scale),
      paddingRight: scaled(18, scale),
      width: '50%'
    },
    rpcCapabilityMeta: {
      color: colors.success,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      marginTop: scaled(7, scale),
      ...textBase
    },
    rpcCapabilityMetaWarning: {
      color: colors.warning,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      marginTop: scaled(7, scale),
      ...textBase
    },
    rpcCapabilityTextBlock: {
      flex: 1,
      marginLeft: scaled(16, scale)
    },
    rpcCapabilityTitle: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '800',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    rpcChartAxisText: {
      color: colors.textSoft,
      fontSize: scaled(16, scale),
      lineHeight: scaled(22, scale),
      ...textBase
    },
    rpcChartBody: {
      flexDirection: 'row',
      height: scaled(184, scale),
      marginTop: scaled(16, scale)
    },
    rpcChartCanvas: {
      flex: 1,
      overflow: 'hidden'
    },
    rpcChartHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    rpcChartMeta: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      ...textBase
    },
    rpcChartPanel: {
      backgroundColor: '#F8FAFF',
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(20, scale),
      paddingHorizontal: scaled(22, scale),
      paddingVertical: scaled(18, scale)
    },
    rpcChartSvg: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    rpcChartTitle: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '900',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    rpcChartXAxis: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginLeft: scaled(58, scale),
      marginTop: scaled(8, scale)
    },
    rpcChartYAxis: {
      justifyContent: 'space-between',
      paddingBottom: scaled(22, scale),
      paddingTop: scaled(18, scale),
      width: scaled(52, scale)
    },
    rpcEndpointRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(12, scale),
      marginTop: scaled(17, scale)
    },
    rpcEndpointText: {
      color: '#FFFFFF',
      flexShrink: 1,
      fontSize: scaled(33, scale),
      fontWeight: '900',
      letterSpacing: 0,
      lineHeight: scaled(42, scale),
      maxWidth: scaled(430, scale),
      ...textBase
    },
    rpcFootnote: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(26, scale),
      marginTop: scaled(14, scale),
      paddingHorizontal: scaled(8, scale),
      ...textBase
    },
    rpcHeroCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(370, scale),
      marginTop: scaled(16, scale),
      overflow: 'hidden',
      position: 'relative'
    },
    rpcHeroContent: {
      bottom: 0,
      left: 0,
      paddingLeft: scaled(34, scale),
      paddingTop: scaled(34, scale),
      position: 'absolute',
      top: 0,
      width: scaled(548, scale)
    },
    rpcHeroCopyButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF22',
      borderColor: '#FFFFFF66',
      borderRadius: scaled(19, scale),
      borderWidth: 1,
      height: scaled(38, scale),
      justifyContent: 'center',
      width: scaled(38, scale)
    },
    rpcHeroDivider: {
      backgroundColor: '#FFFFFF24',
      height: 1,
      marginTop: scaled(22, scale),
      width: scaled(470, scale)
    },
    rpcHeroIconValueRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(8, scale),
      maxWidth: scaled(228, scale)
    },
    rpcHeroLabel: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      fontWeight: '800',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    rpcHeroMetricCell: {
      marginBottom: scaled(18, scale),
      minHeight: scaled(58, scale),
      paddingRight: scaled(18, scale),
      width: '50%'
    },
    rpcHeroMetricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: scaled(20, scale),
      width: scaled(500, scale)
    },
    rpcHeroMetricLabel: {
      color: '#B9C0CE',
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      marginBottom: scaled(8, scale),
      ...textBase
    },
    rpcHeroMetricValue: {
      color: '#FFFFFF',
      flexShrink: 1,
      fontSize: scaled(21, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    rpcHeroStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: scaled(20, scale)
    },
    rpcLoadEmpty: {
      backgroundColor: colors.primary,
      borderRadius: scaled(4, scale),
      height: scaled(8, scale),
      width: 0
    },
    rpcLoadTrack: {
      backgroundColor: '#FFFFFF22',
      borderRadius: scaled(4, scale),
      height: scaled(8, scale),
      marginTop: scaled(9, scale),
      overflow: 'hidden',
      width: scaled(128, scale)
    },
    rpcLogIconBadge: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: scaled(24, scale),
      height: scaled(48, scale),
      justifyContent: 'center',
      width: scaled(48, scale)
    },
    rpcLogList: {
      marginTop: scaled(2, scale)
    },
    rpcLogMain: {
      flex: 1,
      marginLeft: scaled(18, scale),
      minWidth: 0
    },
    rpcLogMeta: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    rpcLogRow: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(82, scale)
    },
    rpcLogTitle: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '900',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    rpcLogValue: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      marginLeft: scaled(12, scale),
      maxWidth: scaled(142, scale),
      textAlign: 'right',
      ...textBase
    },
    rpcMetricCell: {
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      paddingHorizontal: scaled(8, scale)
    },
    rpcMetricLabel: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      ...textBase
    },
    rpcMetricMeta: {
      color: colors.textSoft,
      fontSize: scaled(16, scale),
      lineHeight: scaled(22, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    rpcMetricStrip: {
      alignItems: 'stretch',
      flexDirection: 'row',
      marginTop: scaled(10, scale)
    },
    rpcMetricValue: {
      color: colors.text,
      fontSize: scaled(26, scale),
      fontWeight: '900',
      lineHeight: scaled(34, scale),
      marginTop: scaled(7, scale),
      ...textBase
    },
    rpcPrimaryAction: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderColor: colors.violet,
      borderRadius: scaled(23, scale),
      borderWidth: 1,
      flex: 1.16,
      flexDirection: 'row',
      gap: scaled(9, scale),
      height: scaled(74, scale),
      justifyContent: 'center'
    },
    rpcPrimaryActionText: {
      color: '#FFFFFF',
      fontSize: scaled(21, scale),
      fontWeight: '900',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    rpcRefreshAction: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
      borderRadius: scaled(23, scale),
      borderWidth: 1,
      height: scaled(74, scale),
      justifyContent: 'center',
      width: scaled(142, scale)
    },
    rpcRefreshActionText: {
      color: colors.primary,
      fontSize: scaled(18, scale),
      fontWeight: '800',
      lineHeight: scaled(25, scale),
      marginTop: scaled(2, scale),
      ...textBase
    },
    rpcRoleChip: {
      backgroundColor: '#1E6BFF33',
      borderColor: '#7CA6FFAA',
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      color: '#FFFFFF',
      fontSize: scaled(17, scale),
      fontWeight: '800',
      lineHeight: scaled(24, scale),
      maxWidth: scaled(104, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(10, scale),
      ...textBase
    },
    rpcRoleChipRow: {
      flexDirection: 'row',
      gap: scaled(8, scale)
    },
    rpcSecondaryAction: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
      borderRadius: scaled(23, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(9, scale),
      height: scaled(74, scale),
      justifyContent: 'center'
    },
    rpcSecondaryActionText: {
      color: colors.text,
      fontSize: scaled(21, scale),
      fontWeight: '900',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    rpcSectionCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      marginTop: scaled(16, scale),
      paddingHorizontal: scaled(28, scale),
      paddingVertical: scaled(24, scale),
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.035,
      shadowRadius: 10,
      elevation: 1
    },
    rpcSectionTitle: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '900',
      lineHeight: scaled(34, scale),
      ...textBase
    },
    rpcSectionTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(10, scale),
      marginBottom: scaled(12, scale)
    },
    rpcSecurityIconBadge: {
      alignItems: 'center',
      backgroundColor: '#F2ECFF',
      borderRadius: scaled(22, scale),
      height: scaled(44, scale),
      justifyContent: 'center',
      width: scaled(44, scale)
    },
    rpcSecurityLabel: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(22, scale),
      fontWeight: '800',
      lineHeight: scaled(30, scale),
      marginLeft: scaled(16, scale),
      ...textBase
    },
    rpcSecurityList: {
      marginTop: scaled(2, scale)
    },
    rpcSecurityRow: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(78, scale)
    },
    rpcSecurityValue: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      maxWidth: scaled(240, scale),
      textAlign: 'right',
      ...textBase
    },
    rpcStatusDivider: {
      backgroundColor: '#FFFFFF38',
      height: scaled(26, scale),
      marginHorizontal: scaled(18, scale),
      width: 1
    },
    rpcStatusDot: {
      backgroundColor: colors.success,
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      width: scaled(14, scale)
    },
    rpcStatusDotDanger: {
      backgroundColor: colors.negative,
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      width: scaled(14, scale)
    },
    rpcStatusDotWarning: {
      backgroundColor: colors.warning,
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      width: scaled(14, scale)
    },
    rpcStatusText: {
      color: '#D7DCE8',
      fontSize: scaled(21, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    rpcStatusTextDanger: {
      color: colors.negative,
      fontSize: scaled(21, scale),
      fontWeight: '900',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    rpcStatusTextSuccess: {
      color: colors.success,
      fontSize: scaled(21, scale),
      fontWeight: '900',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    rpcStatusTextWarning: {
      color: colors.warning,
      fontSize: scaled(21, scale),
      fontWeight: '900',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    rpcTable: {
      marginTop: scaled(2, scale)
    },
    rpcTableLatency: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(27, scale),
      marginLeft: scaled(12, scale),
      textAlign: 'right',
      width: scaled(142, scale),
      ...textBase
    },
    rpcTableMain: {
      flex: 1,
      marginLeft: scaled(17, scale),
      minWidth: 0
    },
    rpcTableMeta: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    rpcTableRow: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(92, scale)
    },
    rpcTableTitle: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '900',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    rpcValidatorBadge: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(19, scale),
      height: scaled(38, scale),
      justifyContent: 'center',
      width: scaled(54, scale)
    },
    rpcValidatorBadgeText: {
      color: '#FFFFFF',
      fontSize: scaled(18, scale),
      fontWeight: '900',
      lineHeight: scaled(25, scale),
      ...textBase
    },
    transactionHeroStatusDot: {
      backgroundColor: colors.success,
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      width: scaled(14, scale)
    },
    transactionHeroStatusDotWarning: {
      backgroundColor: colors.warning,
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      width: scaled(14, scale)
    },
    transactionHeroStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(8, scale)
    },
    transactionHeroTopRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    transactionIconBadge: {
      alignItems: 'center',
      borderRadius: scaled(28, scale),
      height: scaled(56, scale),
      justifyContent: 'center',
      width: scaled(56, scale)
    },
    transactionIconBadgeDpos: {
      backgroundColor: '#3F63F2'
    },
    transactionIconBadgeIncoming: {
      backgroundColor: '#1D8CFF'
    },
    transactionIconBadgeOutgoing: {
      backgroundColor: '#5C5CFF'
    },
    transactionIconBadgePrivacy: {
      backgroundColor: '#8D42F6'
    },
    transactionRow: {
      alignItems: 'center',
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(104, scale),
      paddingVertical: scaled(14, scale)
    },
    transactionRowLast: {
      borderBottomWidth: 0
    },
    transactionRowMain: {
      flex: 1,
      marginLeft: scaled(18, scale)
    },
    transactionRowMeta: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      marginTop: scaled(5, scale),
      ...textBase
    },
    transactionRowTime: {
      color: colors.textMuted,
      flexShrink: 1,
      fontSize: scaled(18, scale),
      lineHeight: scaled(25, scale),
      marginLeft: scaled(8, scale),
      ...textBase
    },
    transactionRowTitle: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '900',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    transactionStatusLine: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: scaled(5, scale)
    },
    transactionStatusSuccessText: {
      backgroundColor: '#EAF2FF',
      borderRadius: scaled(13, scale),
      color: colors.primary,
      fontSize: scaled(17, scale),
      fontWeight: '900',
      lineHeight: scaled(24, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(10, scale),
      ...textBase
    },
    transactionStatusWarningText: {
      backgroundColor: '#FFF3E6',
      borderRadius: scaled(13, scale),
      color: colors.warning,
      fontSize: scaled(17, scale),
      fontWeight: '900',
      lineHeight: scaled(24, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(10, scale),
      ...textBase
    },
    validatorAddressText: {
      color: colors.text,
      flexShrink: 1,
      fontSize: scaled(28, scale),
      fontWeight: '900',
      lineHeight: scaled(37, scale),
      maxWidth: scaled(300, scale),
      ...textBase
    },
    validatorAmountDivider: {
      backgroundColor: colors.border,
      height: scaled(42, scale),
      marginHorizontal: scaled(18, scale),
      width: 1
    },
    validatorAmountInput: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(24, scale),
      height: scaled(74, scale),
      lineHeight: scaled(32, scale),
      paddingHorizontal: scaled(18, scale),
      ...textBase
    },
    validatorAmountInputPanel: {
      marginTop: scaled(22, scale)
    },
    validatorAmountInputRow: {
      alignItems: 'center',
      borderColor: colors.borderStrong,
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(80, scale)
    },
    validatorAmountLabel: {
      color: colors.text,
      fontSize: scaled(22, scale),
      lineHeight: scaled(30, scale),
      marginBottom: scaled(12, scale),
      ...textBase
    },
    validatorAmountMax: {
      color: colors.primary,
      fontSize: scaled(23, scale),
      fontWeight: '900',
      lineHeight: scaled(31, scale),
      paddingRight: scaled(22, scale),
      ...textBase
    },
    validatorAmountUnit: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      lineHeight: scaled(30, scale),
      ...textBase
    },
    validatorAvatar: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(36, scale),
      height: scaled(72, scale),
      justifyContent: 'center',
      width: scaled(72, scale)
    },
    validatorAvatarText: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    validatorEstimateLabel: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      lineHeight: scaled(27, scale),
      ...textBase
    },
    validatorEstimateMetric: {
      borderRightColor: colors.border,
      borderRightWidth: 1,
      flex: 1,
      minHeight: scaled(80, scale),
      paddingHorizontal: scaled(18, scale),
      paddingVertical: scaled(12, scale)
    },
    validatorEstimateRow: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: scaled(24, scale),
      overflow: 'hidden'
    },
    validatorEstimateValue: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '800',
      lineHeight: scaled(30, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    validatorFilter: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderRadius: scaled(18, scale),
      height: scaled(64, scale),
      justifyContent: 'center',
      minWidth: scaled(130, scale),
      paddingHorizontal: scaled(22, scale)
    },
    validatorFilterActive: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(18, scale),
      height: scaled(64, scale),
      justifyContent: 'center',
      minWidth: scaled(130, scale),
      paddingHorizontal: scaled(22, scale)
    },
    validatorFilterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaled(26, scale),
      marginTop: scaled(28, scale)
    },
    validatorFilterText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    validatorFilterTextActive: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    validatorHero: {
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(292, scale),
      marginTop: scaled(16, scale),
      overflow: 'hidden',
      position: 'relative'
    },
    validatorHeroContent: {
      bottom: 0,
      left: 0,
      paddingHorizontal: scaled(38, scale),
      paddingVertical: scaled(36, scale),
      position: 'absolute',
      right: 0,
      top: 0
    },
    validatorHeroEndpoint: {
      color: '#B9C0CE',
      fontSize: scaled(20, scale),
      lineHeight: scaled(27, scale),
      marginTop: scaled(10, scale),
      maxWidth: scaled(420, scale),
      ...textBase
    },
    validatorHeroMetric: {
      borderRightColor: '#FFFFFF33',
      borderRightWidth: 1,
      flex: 1,
      minHeight: scaled(84, scale),
      paddingRight: scaled(24, scale)
    },
    validatorHeroMetricLabel: {
      color: '#DDE3F0',
      fontSize: scaled(22, scale),
      lineHeight: scaled(30, scale),
      ...textBase
    },
    validatorHeroMetricRow: {
      flexDirection: 'row',
      gap: scaled(30, scale),
      marginTop: scaled(48, scale),
      maxWidth: scaled(470, scale)
    },
    validatorHeroMetricValue: {
      color: '#FFFFFF',
      fontSize: scaled(38, scale),
      fontWeight: '900',
      lineHeight: scaled(48, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    validatorHeroMetricValueDanger: {
      color: colors.negative,
      fontSize: scaled(38, scale),
      fontWeight: '900',
      lineHeight: scaled(48, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    validatorHeroMetricValueSuccess: {
      color: colors.success,
      fontSize: scaled(38, scale),
      fontWeight: '900',
      lineHeight: scaled(48, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    validatorHeroMetricValueWarning: {
      color: colors.warning,
      fontSize: scaled(38, scale),
      fontWeight: '900',
      lineHeight: scaled(48, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    validatorHeroTitle: {
      color: '#FFFFFF',
      fontSize: scaled(30, scale),
      fontWeight: '900',
      lineHeight: scaled(40, scale),
      ...textBase
    },
    validatorHeroTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(14, scale)
    },
    validatorIdentity: {
      flex: 1,
      marginLeft: scaled(20, scale),
      minWidth: 0
    },
    validatorListCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(18, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(28, scale),
      paddingTop: scaled(26, scale),
      ...shadows.card
    },
    validatorListCount: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      lineHeight: scaled(30, scale),
      marginBottom: scaled(10, scale),
      ...textBase
    },
    validatorMetric: {
      borderRightColor: colors.border,
      borderRightWidth: 1,
      flex: 1,
      minHeight: scaled(72, scale),
      paddingHorizontal: scaled(16, scale)
    },
    validatorMetricGrid: {
      flexDirection: 'row',
      marginLeft: scaled(92, scale),
      marginTop: scaled(24, scale)
    },
    validatorMetricLabel: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      ...textBase
    },
    validatorMetricValue: {
      color: colors.text,
      fontSize: scaled(23, scale),
      lineHeight: scaled(31, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    validatorMetricWide: {
      borderLeftColor: colors.border,
      borderLeftWidth: 1,
      flex: 2,
      minHeight: scaled(72, scale),
      paddingHorizontal: scaled(28, scale)
    },
    validatorNameLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(14, scale)
    },
    validatorOnlineBadge: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(8, scale),
      marginLeft: scaled(12, scale)
    },
    validatorOnlineDot: {
      backgroundColor: colors.success,
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      width: scaled(14, scale)
    },
    validatorOnlineDotOffline: {
      backgroundColor: '#D84D4D'
    },
    validatorOnlineDotUnknown: {
      backgroundColor: '#A0A6B2'
    },
    validatorOnlineText: {
      color: colors.success,
      fontSize: scaled(22, scale),
      lineHeight: scaled(30, scale),
      ...textBase
    },
    validatorOnlineTextOffline: {
      color: '#D84D4D'
    },
    validatorOnlineTextUnknown: {
      color: colors.textMuted
    },
    validatorOperationBalance: {
      color: colors.textMuted,
      flex: 1,
      fontSize: scaled(20, scale),
      lineHeight: scaled(27, scale),
      marginLeft: scaled(20, scale),
      textAlign: 'right',
      ...textBase
    },
    validatorOperationCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(18, scale),
      padding: scaled(26, scale),
      ...shadows.card
    },
    validatorOperationChip: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderRadius: scaled(16, scale),
      height: scaled(54, scale),
      justifyContent: 'center',
      width: '31%'
    },
    validatorOperationChipActive: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(16, scale),
      height: scaled(54, scale),
      justifyContent: 'center',
      width: '31%'
    },
    validatorOperationChipText: {
      color: colors.text,
      fontSize: scaled(20, scale),
      fontWeight: '800',
      lineHeight: scaled(27, scale),
      ...textBase
    },
    validatorOperationChipTextActive: {
      color: '#FFFFFF',
      fontSize: scaled(20, scale),
      fontWeight: '900',
      lineHeight: scaled(27, scale),
      ...textBase
    },
    validatorOperationGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaled(12, scale),
      marginTop: scaled(18, scale)
    },
    validatorOperationHeader: {
      alignItems: 'center',
      flexDirection: 'row'
    },
    validatorOperationTitle: {
      color: colors.text,
      fontSize: scaled(30, scale),
      fontWeight: '900',
      lineHeight: scaled(39, scale),
      ...textBase
    },
    validatorPositionCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(18, scale),
      padding: scaled(26, scale),
      ...shadows.card
    },
    validatorPositionGrid: {
      flexDirection: 'row',
      marginTop: scaled(28, scale)
    },
    validatorPositionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    validatorPositionLabel: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      ...textBase
    },
    validatorPositionMetric: {
      borderRightColor: colors.border,
      borderRightWidth: 1,
      flex: 1,
      minHeight: scaled(100, scale),
      paddingRight: scaled(14, scale)
    },
    validatorPositionRefresh: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(8, scale)
    },
    validatorPositionRefreshText: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      lineHeight: scaled(29, scale),
      ...textBase
    },
    validatorPositionSuffix: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      lineHeight: scaled(26, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    validatorPositionTitle: {
      color: colors.text,
      fontSize: scaled(31, scale),
      fontWeight: '900',
      lineHeight: scaled(40, scale),
      ...textBase
    },
    validatorPositionValue: {
      color: colors.text,
      fontSize: scaled(24, scale),
      lineHeight: scaled(32, scale),
      marginTop: scaled(14, scale),
      ...textBase
    },
    validatorRatioChip: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderRadius: scaled(16, scale),
      flex: 1,
      height: scaled(54, scale),
      justifyContent: 'center'
    },
    validatorRatioRow: {
      flexDirection: 'row',
      gap: scaled(30, scale),
      marginTop: scaled(22, scale)
    },
    validatorRatioText: {
      color: colors.textMuted,
      fontSize: scaled(23, scale),
      lineHeight: scaled(31, scale),
      ...textBase
    },
    validatorRow: {
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      paddingVertical: scaled(28, scale)
    },
    validatorRowHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: scaled(76, scale)
    },
    validatorRowLast: {
      borderBottomWidth: 0
    },
    validatorSearchInput: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(23, scale),
      height: scaled(62, scale),
      lineHeight: scaled(31, scale),
      paddingHorizontal: scaled(14, scale),
      ...textBase
    },
    validatorSearchPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      marginTop: scaled(18, scale),
      padding: scaled(30, scale),
      ...shadows.card
    },
    validatorSearchRow: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderRadius: scaled(16, scale),
      flexDirection: 'row',
      minHeight: scaled(70, scale),
      paddingHorizontal: scaled(18, scale)
    },
    validatorSecondaryGrid: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      marginLeft: scaled(92, scale),
      marginTop: scaled(22, scale),
      paddingTop: scaled(18, scale)
    },
    validatorStakeAddress: {
      color: '#FFFFFF',
      flex: 1,
      fontSize: scaled(29, scale),
      fontWeight: '900',
      lineHeight: scaled(40, scale),
      marginRight: scaled(14, scale),
      maxWidth: scaled(520, scale),
      ...textBase
    },
    validatorStakeAddressRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: scaled(22, scale),
      maxWidth: scaled(570, scale)
    },
    validatorStakeButtonRow: {
      flexDirection: 'row',
      gap: scaled(34, scale),
      marginTop: scaled(24, scale)
    },
    validatorStakeHero: {
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(410, scale),
      marginTop: scaled(16, scale),
      overflow: 'hidden',
      position: 'relative'
    },
    validatorStakeHeroContent: {
      bottom: 0,
      left: 0,
      paddingHorizontal: scaled(36, scale),
      paddingVertical: scaled(34, scale),
      position: 'absolute',
      right: 0,
      top: 0
    },
    validatorStakeHeroMetric: {
      borderRightColor: '#FFFFFF33',
      borderRightWidth: 1,
      flex: 1,
      minHeight: scaled(86, scale),
      paddingHorizontal: scaled(22, scale)
    },
    validatorStakeHeroMetricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: scaled(32, scale),
      maxWidth: scaled(470, scale)
    },
    validatorStakeHeroMetricLabel: {
      color: '#B9C0CE',
      fontSize: scaled(21, scale),
      lineHeight: scaled(29, scale),
      ...textBase
    },
    validatorStakeHeroMetricValue: {
      color: '#FFFFFF',
      fontSize: scaled(30, scale),
      fontWeight: '900',
      lineHeight: scaled(39, scale),
      marginTop: scaled(7, scale),
      ...textBase
    },
    validatorStakeMetricStrip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: scaled(18, scale),
      minHeight: scaled(112, scale),
      paddingVertical: scaled(20, scale),
      ...shadows.card
    },
    validatorStakeNote: {
      color: colors.textMuted,
      flex: 1,
      fontSize: scaled(20, scale),
      lineHeight: scaled(28, scale),
      ...textBase
    },
    validatorStakeNoteRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(12, scale),
      justifyContent: 'center',
      marginTop: scaled(22, scale)
    },
    validatorStakePrimaryButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderColor: colors.violet,
      borderRadius: scaled(18, scale),
      borderWidth: 2,
      flex: 1,
      height: scaled(72, scale),
      justifyContent: 'center'
    },
    validatorStakePrimaryButtonDisabled: {
      opacity: 0.62
    },
    validatorStakePrimaryButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '900',
      lineHeight: scaled(33, scale),
      ...textBase
    },
    validatorStakeSecondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: '#151927',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flex: 0.56,
      height: scaled(72, scale),
      justifyContent: 'center'
    },
    validatorStakeSecondaryButtonText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    validatorStakeStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(12, scale)
    },
    validatorStakeStatusText: {
      color: colors.success,
      fontSize: scaled(24, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    validatorStakeStripLabel: {
      color: colors.text,
      fontSize: scaled(20, scale),
      fontWeight: '800',
      lineHeight: scaled(27, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    validatorStakeStripMetric: {
      alignItems: 'center',
      borderRightColor: colors.border,
      borderRightWidth: 1,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: scaled(8, scale)
    },
    validatorStakeStripValue: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '900',
      lineHeight: scaled(33, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    validatorStatusChip: {
      backgroundColor: '#F1E9FF',
      borderRadius: scaled(9, scale),
      color: colors.violet,
      fontSize: scaled(20, scale),
      lineHeight: scaled(28, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(12, scale),
      ...textBase
    },
    visualHero: {
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(344, scale),
      marginTop: scaled(16, scale),
      overflow: 'hidden',
      position: 'relative'
    },
    visualHeroSubtitle: {
      color: '#B9C0CE',
      fontSize: scaled(21, scale),
      left: scaled(24, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      right: scaled(24, scale),
      top: scaled(76, scale),
      ...textBase
    },
    visualHeroTitle: {
      color: '#FFFFFF',
      fontSize: scaled(34, scale),
      fontWeight: '900',
      left: scaled(24, scale),
      lineHeight: scaled(43, scale),
      position: 'absolute',
      right: scaled(24, scale),
      top: scaled(36, scale),
      ...textBase
    }
  });
}
