# SOL Professional Neon Design Drafts

本目录保存 SOL 钱包统一视觉方向设计稿。实现时以本目录为准，避免首页和其他页面风格断裂。

## 页面清单

- `01-assets-home.png`：资产首页
- `02-transfer-send.png`：发送 / 转账
- `03-privacy-home.png`：隐私账户
- `04-privacy-audit.png`：隐私审计
- `05-contracts-list.png`：链上合约列表
- `06-contract-deploy-confirm.png`：合约部署确认
- `07-dpos-overview.png`：DPoS 总览
- `08-validator-list.png`：验证者列表
- `09-validator-detail-stake.png`：验证者详情 / 委托质押
- `10-account.png`：账户管理
- `11-wallet-setup.png`：钱包解锁 / 初始账户
- `12-receive-address.png`：收款地址
- `13-scan-result.png`：扫码 / 扫描结果
- `14-transaction-detail.png`：交易详情
- `15-block-detail.png`：区块详情
- `16-tip-dialog.png`：提示弹窗
- `17-message-dialog.png`：消息弹窗
- `18-confirm-delegation-dialog.png`：确认委托弹窗
- `19-contract-call.png`：合约详情 / 调用合约
- `20-contract-call-confirm-dialog.png`：合约调用确认弹窗
- `21-contract-call-result.png`：合约调用结果
- `22-rwa-assets.png`：RWA 现实资产
- `23-cfd-trading.png`：CFD 差价合约
- `24-crypto-buy-sell.png`：买卖虚拟货币
- `25-stock-token-trading.png`：股票代币交易
- `26-onchain-receipt.png`：链上回执
- `27-stock-token-detail.png`：股票代币详情
- `28-token-detail.png`：代币详情
- `29-transaction-history.png`：交易历史
- `30-chain-status.png`：链状态
- `31-network-status.png`：网络状态
- `32-rpc-node-detail.png`：RPC 节点详情
- `33-validator-topology.png`：验证者拓扑
- `34-fee-compute-status.png`：费用与 Compute
- `35-system-alerts.png`：系统告警
- `36-governance-upgrade.png`：治理与升级
- `37-global-search.png`：全局搜索
- `38-notification-center.png`：通知中心
- `39-security-center.png`：安全中心
- `40-address-book.png`：地址簿
- `41-portfolio-analytics.png`：资产组合分析
- `42-order-center.png`：订单中心
- `43-nft-detail.png`：NFT 详情
- `44-stablecoin-mint-redeem.png`：稳定币铸造 / 赎回
- `45-identity-kyc.png`：身份 / KYC 中心
- `46-authorization-management.png`：授权管理
- `47-market-stock-token-workspace-draft.png`：股票代币交易工作台草稿
- `48-market-home-multi-asset-draft.png`：多资产市场首页草稿
- `49-wallet-workspace-shared-nav-draft.png`：钱包工作台共享导航草稿
- `50-market-workspace-trading-nav-draft.png`：市场交易工作台导航草稿
- `51-workspace-switch-market-guide.png`：工作台切换市场引导
- `52-wallet-home-correct-bottom-nav-draft.png`：钱包首页正确底部导航草稿
- `53-market-home-correct-bottom-nav-draft.png`：市场首页正确底部导航草稿
- `54-wallet-home-chain-only.png`：钱包链上资产首页
- `55-market-home-stock-trading-hero.png`：市场首页股票交易主视觉
- `56-wallet-create-mnemonic-entry.png`：创建钱包 / 助记词入口
- `57-wallet-mnemonic-backup-12words.png`：12 词助记词备份
- `58-wallet-switch-account.png`：切换钱包

## 统一视觉约束

- 主风格：专业交易所风格，白底、黑卡、信息密度高。
- 视觉重点：黑色主卡可嵌入 SOL 全息科技背景，但必须作为背景层，不影响文字可读性。
- 强调色：蓝紫霓虹为主，绿色只用于必要的成功状态，禁止其他页面花花绿绿。
- 资产首页：资产金额不显示 USD 兑换行。
- 导航：底部固定 5 个入口，分别是资产、隐私、合约、DPoS、账户。
- DPoS：首屏必须展示自质押、委托质押、自质押收益、委托收益，账户管理不放在 DPoS 中。
- 弹窗：禁止直接使用系统默认 Alert 视觉，统一使用暗色遮罩、圆角弹层、黑色主按钮和蓝紫强调。
- 交易类页面：必须展示报价、费用、风险、结算状态和权限边界，不做单按钮式交易入口。
- 详情/历史页面：必须展示签名、状态、区块、费用、账户/合约关系，并提供复制和继续查看入口。
- 链与网络页面：必须明确区分 APP 公网 RPC、P2P 转发、内网验证者、费用/Compute、治理升级和系统告警边界。
- 未来扩展页面：必须复用统一顶部导航、黑色全息主卡、白色信息卡、紧凑列表、黑色主按钮和蓝紫强调，避免临时页面风格漂移。
