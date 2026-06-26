export type MarketRow = {
  readonly symbol: string;
  readonly name: string;
  readonly price: string;
  readonly fiat: string;
  readonly changePercent: number;
  readonly turnover: string;
  readonly accentColor: string;
};

export type StatusItem = {
  readonly title: string;
  readonly value: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly tone: 'blue' | 'green' | 'violet' | 'orange';
};

export const assetSummary = {
  total: '99,999,999.958218',
  symbol: 'SOL',
  available: '99,999,999.958218',
  privateAvailable: '0.000000',
  tokenName: 'LAMPORTS',
  tokenDescription: 'Solana 原生代币',
  contracts: '12 个'
} as const;

export const quickActions = [
  { key: 'send', label: '发送', icon: 'arrow-up-right' },
  { key: 'receive', label: '接收', icon: 'download' },
  { key: 'stake', label: '质押', icon: 'shield' },
  { key: 'history', label: '历史', icon: 'history' }
] as const;

export const statusItems: readonly StatusItem[] = [
  { title: '节点连接', value: '正常', subtitle: '101.35.87.31:8899', icon: 'radio', tone: 'blue' },
  { title: '验证者', value: '2 个', subtitle: '同步高度 1,180', icon: 'shield-check', tone: 'green' },
  { title: '隐私账户', value: '0 个', subtitle: '已解锁', icon: 'lock', tone: 'violet' },
  { title: '网络状态', value: '正常', subtitle: '延迟 32ms', icon: 'network', tone: 'orange' }
];

export const marketRows: readonly MarketRow[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: '63,990.01',
    fiat: '$433,212.37',
    changePercent: -1.23,
    turnover: '315.05亿',
    accentColor: '#FF9500'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: '1,742.69',
    fiat: '$11,798.01',
    changePercent: 0.85,
    turnover: '147.82亿',
    accentColor: '#E5E7EC'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: '71.28',
    fiat: '$482.57',
    changePercent: 2.56,
    turnover: '24.67亿',
    accentColor: '#050507'
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    price: '1.1691',
    fiat: '$7.91',
    changePercent: -0.45,
    turnover: '18.96亿',
    accentColor: '#171717'
  },
  {
    symbol: 'WLD',
    name: 'Worldcoin',
    price: '0.6299',
    fiat: '$4.26',
    changePercent: 1.12,
    turnover: '15.78亿',
    accentColor: '#050507'
  }
];

export const marketTabs = ['自选', '主流', '涨幅榜', '跌幅榜', '24h 成交额'] as const;

export const bottomTabs = [
  { key: 'assets', label: '资产', icon: 'home' },
  { key: 'privacy', label: '隐私', icon: 'shield' },
  { key: 'contract', label: '合约', icon: 'code-braces' },
  { key: 'dpos', label: 'DPoS', icon: 'circle-slice-8' },
  { key: 'account', label: '账户', icon: 'account-outline' }
] as const;
