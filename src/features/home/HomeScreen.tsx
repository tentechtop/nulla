import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppShell } from '../../components/AppShell';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors } from '../../theme/tokens';
import { JsonRpcClient } from '../../utils/chainRpc';
import { createEmptyWalletPortfolio, loadWalletPortfolio, type WalletPortfolio } from '../../utils/walletBusiness';
import { AssetHeroCard } from './AssetHeroCard';
import { NetworkStatusPanel } from './NetworkStatusPanel';
import { QuickActionBar } from './QuickActionBar';
import { useHomeResponsiveLayout } from './useHomeResponsiveLayout';

type HomeScreenProps = {
  readonly bottomPadding?: number;
  readonly currentWalletAddress?: string | null;
  readonly onChainStatusPress?: () => void;
  readonly onContractPress?: () => void;
  readonly onNetworkStatusPress?: () => void;
  readonly onReceivePress?: () => void;
  readonly onSendPress?: () => void;
  readonly onStakePress?: () => void;
  readonly onTransactionHistoryPress?: () => void;
  readonly onValidatorListPress?: () => void;
  readonly rpcEndpoint?: string;
  readonly topPadding?: number;
};

export function HomeScreen({
  bottomPadding,
  currentWalletAddress = null,
  onChainStatusPress,
  onContractPress,
  onNetworkStatusPress,
  onReceivePress,
  onSendPress,
  onStakePress,
  onTransactionHistoryPress,
  onValidatorListPress,
  rpcEndpoint,
  topPadding
}: HomeScreenProps) {
  const layoutMetrics = useHomeResponsiveLayout();
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const [portfolio, setPortfolio] = useState<WalletPortfolio>(() => createEmptyWalletPortfolio(currentWalletAddress));
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);

  useEffect(() => {
    let cancelled = false;
    setIsPortfolioLoading(true);

    // 功能目的：刷新首页真实资产；实现原因：余额和 DPoS 状态必须来自公网 RPC，不能展示设计稿样例值。
    void loadWalletPortfolio(currentWalletAddress, client)
      .then((nextPortfolio) => {
        if (!cancelled) {
          setPortfolio(nextPortfolio);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const fallbackPortfolio = createEmptyWalletPortfolio(currentWalletAddress);
          setPortfolio({
            ...fallbackPortfolio,
            chain: {
              ...fallbackPortfolio.chain,
              error: error instanceof Error ? error.message : String(error)
            }
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPortfolioLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, currentWalletAddress]);

  return (
    <View style={styles.root}>
      <AppShell bottomPadding={resolvedBottomPadding} topPadding={resolvedTopPadding}>
        <AssetHeroCard
          isLoading={isPortfolioLoading}
          onContractPress={onContractPress}
          onTransactionHistoryPress={onTransactionHistoryPress}
          portfolio={portfolio}
        />
        <QuickActionBar
          onHistoryPress={onTransactionHistoryPress}
          onReceivePress={onReceivePress}
          onSendPress={onSendPress}
          onStakePress={onStakePress}
        />
        <NetworkStatusPanel
          isLoading={isPortfolioLoading}
          onChainStatusPress={onChainStatusPress}
          onNetworkStatusPress={onNetworkStatusPress}
          onValidatorListPress={onValidatorListPress}
          portfolio={portfolio}
        />
      </AppShell>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  }
});
