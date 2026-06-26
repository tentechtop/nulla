# Design QA

## 页面矩阵 2026-06-24

| 设计稿编号 | 设计稿文件 | 对应路由/组件 | 当前状态 | 对应资产目录 | 修复优先级 |
| --- | --- | --- | --- | --- | --- |
| 01 | `01-assets-home.png` | `home` / `HomeScreen` | 已实现需复核；同时受 54/52 全局规范约束 | `assets/01-assets-home` | P2 |
| 02 | `02-transfer-send.png` | `transferSend` / `TransferSendScreen` | 已实现需复核 | `assets/02-transfer-send` | P2 |
| 03 | `03-privacy-home.png` | `privacyHome` / `PrivacyHomeScreen` | 已实现需复核 | `assets/03-privacy-home` | P2 |
| 04 | `04-privacy-audit.png` | 未路由 | 未实现/未路由 | `assets/04-privacy-audit` | P3 |
| 05 | `05-contracts-list.png` | `contractsList` / `ContractsListScreen` | 已实现需复核 | `assets/05-contracts-list` | P2 |
| 06 | `06-contract-deploy-confirm.png` | `contractDeployConfirm` / `ContractDeployConfirmScreen` | 已实现但偏差大 | `assets/06-contract-deploy-confirm` | P0 |
| 07 | `07-dpos-overview.png` | `dposOverview` / `DposOverviewScreen` | 已实现需复核 | `assets/07-dpos-overview` | P2 |
| 08 | `08-validator-list.png` | `validatorList` / `ValidatorListScreen` | 已实现但偏差大；失败态会破坏主体结构 | `assets/08-validator-list` | P0 |
| 09 | `09-validator-detail-stake.png` | `validatorDetailStake` / `ValidatorDetailStakeScreen` | 已实现但偏差大；质押操作区需重做 | `assets/09-validator-detail-stake` | P0 |
| 10 | `10-account.png` | `accountHome` / `AccountHomeScreen` | 已实现需复核 | `assets/10-account` | P2 |
| 11 | `11-wallet-setup.png` | `walletImportMnemonic` / `WalletImportMnemonicScreen` | 已实现需复核 | `assets/11-wallet-setup` | P3 |
| 12 | `12-receive-address.png` | `receiveAddress` / `ReceiveAddressScreen` | 已实现但需修复长地址断行 | `assets/12-receive-address` | P1 |
| 13 | `13-scan-result.png` | `scanResult` / `ScanResultScreen` | 已实现需复核 | `assets/13-scan-result` | P2 |
| 14 | `14-transaction-detail.png` | `transactionDetail` / `TransactionDetailScreen` | 已实现需复核 | `assets/14-transaction-detail` | P1 |
| 15 | `15-block-detail.png` | `blockDetail` / `BlockDetailScreen` | 已实现但偏差大；头图文字重叠 | `assets/15-block-detail` | P0 |
| 16 | `16-tip-dialog.png` | 转账/扫码结果弹窗 | 已实现需复核 | `assets/16-tip-dialog` | P1 |
| 17 | `17-message-dialog.png` | 未路由 | 未实现/未路由 | `assets/17-message-dialog` | P3 |
| 18 | `18-confirm-delegation-dialog.png` | 未明确路由；应归属 DPoS 委托确认 | 未实现/未路由 | `assets/18-confirm-delegation-dialog` | P3 |
| 19 | `19-contract-call.png` | 未路由 | 未实现/未路由 | `assets/19-contract-call` | P3 |
| 20 | `20-contract-call-confirm-dialog.png` | 未路由 | 未实现/未路由 | `assets/20-contract-call-confirm-dialog` | P3 |
| 21 | `21-contract-call-result.png` | 未路由 | 未实现/未路由 | `assets/21-contract-call-result` | P3 |
| 22 | `22-rwa-assets.png` | 未路由 | 未实现/未路由 | `assets/22-rwa-assets` | P3 |
| 23 | `23-cfd-trading.png` | 未路由 | 未实现/未路由 | `assets/23-cfd-trading` | P3 |
| 24 | `24-crypto-buy-sell.png` | 未路由 | 未实现/未路由 | `assets/24-crypto-buy-sell` | P3 |
| 25 | `25-stock-token-trading.png` | 未路由 | 未实现/未路由 | `assets/25-stock-token-trading` | P3 |
| 26 | `26-onchain-receipt.png` | 未路由 | 未实现/未路由 | `assets/26-onchain-receipt` | P3 |
| 27 | `27-stock-token-detail.png` | 未路由 | 未实现/未路由 | `assets/27-stock-token-detail` | P3 |
| 28 | `28-token-detail.png` | 未路由 | 未实现/未路由 | `assets/28-token-detail` | P3 |
| 29 | `29-transaction-history.png` | `transactionHistory` / `TransactionHistoryScreen` | 已实现但偏差大 | `assets/29-transaction-history` | P0 |
| 30 | `30-chain-status.png` | `chainStatus` / `ChainStatusScreen` | 已实现但偏差大；失败态主体消失 | `assets/30-chain-status` | P0 |
| 31 | `31-network-status.png` | `networkStatus` / `NetworkStatusScreen` | 已实现但偏差大；失败态缺结构信息 | `assets/31-network-status` | P0 |
| 32 | `32-rpc-node-detail.png` | `rpcNodeDetail` / `RpcNodeDetailScreen` | 已实现但偏差大；缺节点详情卡和指标表 | `assets/32-rpc-node-detail` | P0 |
| 33 | `33-validator-topology.png` | 未路由 | 未实现/未路由 | `assets/33-validator-topology` | P3 |
| 34 | `34-fee-compute-status.png` | 未路由 | 未实现/未路由 | `assets/34-fee-compute-status` | P3 |
| 35 | `35-system-alerts.png` | 未路由 | 未实现/未路由 | `assets/35-system-alerts` | P3 |
| 36 | `36-governance-upgrade.png` | 未路由 | 未实现/未路由 | `assets/36-governance-upgrade` | P3 |
| 37 | `37-global-search.png` | 未路由 | 未实现/未路由 | `assets/37-global-search` | P3 |
| 38 | `38-notification-center.png` | 未路由 | 未实现/未路由 | `assets/38-notification-center` | P3 |
| 39 | `39-security-center.png` | 未路由 | 未实现/未路由 | `assets/39-security-center` | P3 |
| 40 | `40-address-book.png` | 未路由 | 未实现/未路由 | `assets/40-address-book` | P3 |
| 41 | `41-portfolio-analytics.png` | `portfolioAnalytics` / `PortfolioAnalyticsScreen` | 已实现但需复核首屏拥挤 | `assets/41-portfolio-analytics` | P1 |
| 42 | `42-order-center.png` | 未路由 | 未实现/未路由 | `assets/42-order-center` | P3 |
| 43 | `43-nft-detail.png` | 未路由 | 未实现/未路由 | `assets/43-nft-detail` | P3 |
| 44 | `44-stablecoin-mint-redeem.png` | 未路由 | 未实现/未路由 | `assets/44-stablecoin-mint-redeem` | P3 |
| 45 | `45-identity-kyc.png` | 未路由 | 未实现/未路由 | `assets/45-identity-kyc` | P3 |
| 46 | `46-authorization-management.png` | 未路由 | 未实现/未路由 | `assets/46-authorization-management` | P3 |
| 47 | `47-market-stock-token-workspace-draft.png` | `marketHome` / `MarketHomeScreen` | 仅导航或共享规范；作为市场首页验收基准 | `assets/47-market-stock-token-workspace-draft` | P2 |
| 48 | `48-market-home-multi-asset-draft.png` | `marketHome` / `MarketHomeScreen` | 仅导航或共享规范；作为市场首页验收基准 | `assets/48-market-home-multi-asset-draft` | P2 |
| 49 | `49-wallet-workspace-shared-nav-draft.png` | `GlobalHeader` / `GlobalBottomNavigation` | 仅导航或共享规范 | `assets/49-wallet-workspace-shared-nav-draft` | P2 |
| 50 | `50-market-workspace-trading-nav-draft.png` | `GlobalHeader` / `GlobalBottomNavigation` | 仅导航或共享规范 | `assets/50-market-workspace-trading-nav-draft` | P2 |
| 51 | `51-workspace-switch-market-guide.png` | 无当前路由；已改为直接切换工作台 | 仅导航或共享规范 | `assets/51-workspace-switch-market-guide` | P3 |
| 52 | `52-wallet-home-correct-bottom-nav-draft.png` | `home` + `GlobalBottomNavigation` | 仅导航或共享规范；钱包首页验收基准 | `assets/52-wallet-home-correct-bottom-nav-draft` | P2 |
| 53 | `53-market-home-correct-bottom-nav-draft.png` | `marketHome` + `GlobalBottomNavigation` | 仅导航或共享规范；市场首页验收基准 | `assets/53-market-home-correct-bottom-nav-draft` | P2 |
| 54 | `54-wallet-home-chain-only.png` | `home` / `HomeScreen` | 已实现需复核；钱包首页链上资产基准 | `assets/54-wallet-home-chain-only` | P2 |
| 55 | `55-market-home-stock-trading-hero.png` | `marketHome` / `MarketHomeScreen` | 已实现需复核；市场 Hero 基准 | `assets/55-market-home-stock-trading-hero` | P2 |
| 56 | `56-wallet-create-mnemonic-entry.png` | `walletCreateMnemonicEntry` / `WalletCreateMnemonicEntryScreen` | 已实现需复核 | `assets/56-wallet-create-mnemonic-entry` | P2 |
| 57 | `57-wallet-mnemonic-backup-12words.png` | `walletMnemonicBackup` / `WalletMnemonicBackupScreen` | 已实现需复核 | `assets/57-wallet-mnemonic-backup-12words` | P2 |
| 58 | `58-wallet-switch-account.png` | `walletSwitchAccount` / `WalletSwitchAccountScreen` | 已实现需复核 | `assets/58-wallet-switch-account` | P2 |

---

Source visual:
- `design-draft/03-privacy-home.png`

Prototype target: `http://localhost:19019`

Viewport checked: `393 x 852`

Scope note:
- Privacy home body, supplied privacy card background, SVG icon geometry, shared top header, and bottom privacy tab routing were checked.
- Page is implemented as native React Native sections, not by using the full-page design image as a cutout.

## Result

final result: passed

## Evidence

- Bottom `隐私` tab opens the new privacy account page and becomes the active tab.
- Header/title, privacy balance card, action row, status card, route preview card, and empty record card are present and aligned to the mobile design scale.
- `background-privacy-card-hd.png` is used only for the card artwork; text and UI structure are rendered natively.
- Supplied SVG icon geometry is recreated as reusable React Native SVG components.
- Screenshot saved at `privacy-home-web-qa.png`.
- TypeScript check passes.
- Unit tests pass: `50` passed, `0` failed.

## Remaining P3 Notes

- Web preview does not include Android status bar and safe-area rendering exactly; final visual should be judged on the installed Android build.

---

# Design QA

Source visual:
- `design-draft/06-contract-deploy-confirm.png`
- `design-draft/08-validator-list.png`
- `design-draft/09-validator-detail-stake.png`
- `design-draft/15-block-detail.png`
- `design-draft/29-transaction-history.png`
- `design-draft/30-chain-status.png`
- `design-draft/31-network-status.png`
- `design-draft/32-rpc-node-detail.png`

Prototype target: `http://localhost:19049`

Viewport checked: `393 x 852`

Scope note:
- First P0 batch was checked through real App routes after importing a local test wallet with the existing wallet setup flow.
- Pages remain native React Native/Expo structures. No full design draft image is used as a page cutout or page background.
- RPC failure was intentionally present in Web QA (`Failed to fetch`) and was used to verify lightweight error banners plus preserved page structure.

## Result

final result: passed

## Evidence

| Source visual | Route / page | Screenshot | Checks passed | Remaining deviation |
| --- | --- | --- | --- | --- |
| `06-contract-deploy-confirm.png` | `contractDeployConfirm` / deployment confirmation | `tmp/design-qa/06-contract-deploy-confirm-after.png` | Input panels only collect request id, bytecode, hash and deposit; confirmation info remains visible; only one primary submit button `签名并部署` plus secondary `拒绝`. | Manual deploy mode has empty bytecode/hash until a real scan payload or user input is provided. |
| `08-validator-list.png` | `validatorList` / validator list | `tmp/design-qa/08-validator-list-after.png` | DPoS Hero, search/filter row, AC/VF avatar rows, middle-ellipsized addresses, `自质押 10,000,000`, `委托质押 0`, status chip and right arrows are preserved under RPC failure. | Web RPC failure uses design fallback rows; live node values still depend on RPC availability. |
| `09-validator-detail-stake.png` | `validatorDetailStake` / validator stake detail | `tmp/design-qa/09-validator-detail-stake-after.png` | Hero, metric strip, wallet position card, 7 stake operation chips, amount input, primary `确认委托`, secondary `领取收益`, and details card are present. | Estimated share and reward remain `--` until a live quote endpoint exists. |
| `15-block-detail.png` | `blockDetail` / block detail | `tmp/design-qa/15-block-detail-after.png` | Hero text no longer overlaps; Slot query panel is present; copy and transaction action buttons remain visible while RPC failure is local. | Block body cannot render live transaction rows when current RPC is unreachable. |
| `29-transaction-history.png` | `transactionHistory` / transaction history | `tmp/design-qa/29-transaction-history-after.png` | Overview card, search, filters, local RPC error banner, `交易记录` empty card and bottom actions are preserved; failure primary action is `重试历史`. | Live rows are empty because `getAddressTransactions` failed in Web QA. |
| `30-chain-status.png` | `chainStatus` / chain status | `tmp/design-qa/30-chain-status-after.png` | Status Hero, key metrics, recent block section, epoch progress, chain health and action buttons remain visible under RPC failure. | Live slot, epoch and TPS fields show `不可用` without estimating missing data. |
| `31-network-status.png` | `networkStatus` / network status | `tmp/design-qa/31-network-status-after.png` | RPC/P2P/relay path, endpoint list, P2P metrics, validator reachability, failover policy and actions remain visible under RPC failure. | Non-current backup nodes are listed as not detected until actively probed. |
| `32-rpc-node-detail.png` | `rpcNodeDetail` / RPC node detail | `tmp/design-qa/32-rpc-node-detail-after.png` | Black Hero, node address, health state, latency, capabilities table, performance metrics, security boundary and runtime logs remain visible under RPC failure. | Node name and Peer ID are unavailable because the current RPC does not return them. |

## Verification

- `npx.cmd tsc --noEmit`: passed.
- `npm test`: passed, `186` tests passed and `0` failed.
- Known warnings: npm prints `Unknown user config "home"`; Node prints existing `MODULE_TYPELESS_PACKAGE_JSON` warnings for ESM-style `.js` files.
- Android release build was not run because this batch did not modify native resources, Android config, app icon, splash image or packaging settings.

## Remaining P0 Notes

- Web preview does not include Android status bar and safe-area rendering exactly; final visual should still be judged on the installed Android build.
- Current Web QA validates visible 393 x 852 viewport screenshots. Long page full-scroll audits should be repeated on Android after RPC is reachable.

---

# Design QA

Source visual:
- `design-draft/13-scan-result.png`
- `design-draft/09-validator-detail-stake.png`

Prototype target: `http://localhost:19031`

Viewport checked: `393 x 852`

Scope note:
- Scan page was extended for `posvalpair:` validator wallet pairing.
- New validator pairing background and SVG assets were placed under `design-draft/assets/59-validator-wallet-pairing`.
- The full design image is not used as a page cutout; the page remains native React Native sections with a real camera scanner.

## Result

final result: passed

## Evidence

- Global scan entry opens the scan page even before wallet creation, so validator QR discovery is not blocked.
- New dark validator platform background renders inside the scan card without covering the real camera permission panel.
- Result card, action buttons, recent scan rows, and bottom navigation fit inside the `393 x 852` viewport.
- `posvalpair:` parser validates RPC URL, public keys, expiry, and required fields.
- Binding RPC helper refuses to complete without a real registration signature.
- Screenshot saved at `validator-pairing-scan-web-qa.png`.
- SVG XML validation passes for `icon-validator-pairing.svg`, `icon-validator-node.svg`, and `icon-wallet-link.svg`.
- TypeScript check passes.
- Unit tests pass: `108` passed, `0` failed.
- Android Release build passes: `android\gradlew.bat assembleRelease --console=plain`.

## Remaining P3 Notes

- Current wallet demo account model does not yet include a real Ed25519 private key signer. The UI therefore prepares and verifies the pairing session but does not fabricate a fake validator-register signature.

---

# Design QA

Source visual:
- `design-draft/16-tip-dialog.png`
- `design-draft/assets/16-tip-dialog`

Prototype target: `http://localhost:19020`

Viewport intended: `393 x 852`

Scope note:
- Scan result now parses supported QR send payloads and routes them into the transfer send screen.
- Transfer send now applies scanned address/amount drafts and opens a native send result dialog after confirmation.
- Dialog icons are converted from `design-draft/assets/16-tip-dialog` SVG assets into typed React Native SVG components.
- The full `16-tip-dialog.png` image is not referenced as a UI cutout.

## Result

final result: blocked

## Evidence

- Expo web server responds with HTTP 200 at `http://localhost:19020`.
- Dialog card geometry is locked to the detected source coordinates normalized to the project scale: `x=161`, `y=599`, `w=535`, `h=652`.
- Primary icon size, primary button position, detail link position, and bottom result pills were recalibrated from the local crop of `16-tip-dialog.png`.
- TypeScript check passes: `npx tsc --noEmit`.
- Unit tests pass: `85` passed, `0` failed.
- Android Release build passes: `android\gradlew.bat assembleRelease --console=plain`.
- Browser screenshot capture is blocked because this environment exposes no Browser MCP control and no local Chrome/Edge executable is available for headless capture.

## Remaining P2 Notes

- Capture the real dialog at `393 x 852` on web or Android device and compare against `design-draft/16-tip-dialog.png` before final visual sign-off.

# Design QA

Source visual:
- `design-draft/47-market-stock-token-workspace-draft.png`

Prototype target: `http://localhost:19019`

Viewport checked: `393 x 852`

Scope note:
- Market workspace home, stock-token hero, ticker chips, market list, action row, hot markets, risk notice, and market-specific bottom navigation were checked.
- Page is implemented as native React Native sections, not by using the full-page design image as a cutout.

## Result

final result: passed

## Evidence

- Top segmented `市场` opens the market workspace and keeps `市场` active.
- Market bottom navigation renders `首页 / 行情 / 交易 / 合约 / 资产`, with `首页` active.
- Wallet bottom navigation remains separate as `主页 / 交易 / DPoS / 隐私 / 资产`.
- `background-stock-trading-card-hd.png` is used only as the stock trading hero artwork; UI text remains native.
- Supplied 47 market SVG icon geometry is recreated as reusable React Native SVG components.
- Hero badge spacing was adjusted after Web QA to prevent `AAPLx` and `Equity Token` overlap.
- Shared top header tabs suppress the web focus ring so the selected `市场` pill matches the draft.
- The hero background now fills the full card and stays darkened by a native gradient; no extra SOL overlay is drawn after product feedback.
- Market list rows were compacted to keep BTC/ETH/SOL/AAPLx/NVDAx inside the rounded card without being covered by the action row.
- Hot market category text is width-limited and shifted right so `SOL/USDT` no longer collides with `去中心化现货`.
- The page heading, hero card, ticker row, market table, action card, hot market card, and risk notice were re-spaced so adjacent sections no longer overlap.
- The market table now leaves a fixed design gap between the table header and first asset row, and keeps 20 design pixels of bottom padding after `NVDAx`.
- Long hero metric values now stay on one line with `adjustsFontSizeToFit`, preventing `2,371,234.56` from splitting across two lines.
- The stock hero no longer renders the BID/ASK floating quotes requested for removal.
- Hero price typography was softened from overly heavy `900` weight, and the price/unit/change/time block was separated to avoid crowding.
- The hot market middle divider line was removed, and the rows remain spaced by the larger row rhythm.
- The local `市场 / 行情、交易、去中心化市场` title block was removed because the shared top header already indicates the active market workspace.
- The market table row rhythm was expanded from `68` to `86` design pixels, with row contents vertically centered and the table card bottom padding increased.
- Screenshot saved at `market-home-web-qa.png`.
- Side-by-side comparison saved at `market-home-compare.png`.
- TypeScript check passes.
- Unit tests pass: `75` passed, `0` failed.

## Remaining P3 Notes

- Web preview does not include Android status bar and safe-area rendering exactly; final visual should be judged on the installed Android build.

---

# Design QA

Source visual:
- `design-draft/10-account.png`

Prototype target: `http://localhost:19019`

Viewport checked: `393 x 852`

Scope note:
- Account page body, supplied account card background, supplied SVG icon geometry, shared top header inactive segmented state, and bottom account tab routing were checked.
- Page is implemented as native React Native sections, not by using the full-page design image as a cutout.

## Result

final result: passed

## Evidence

- Bottom `账户` tab opens the account page and becomes the active tab.
- Header title, account summary card, wallet management card, RPC card, security card, and logout button are present at the mobile design scale.
- `background-account-card-hd.png` is used only for the account card artwork; text and UI structure are rendered natively.
- Supplied account SVG icon geometry is recreated as reusable React Native SVG components.
- `3GT9QRA...TcZjT5S` renders fully after the account card address width adjustment.
- Screenshot saved at `account-home-web-qa.png`.
- TypeScript check passes.
- Unit tests pass: `68` passed, `0` failed.

## Remaining P3 Notes

- Web preview does not include Android status bar and safe-area rendering exactly; final visual should be judged on the installed Android build.

---

# Design QA

Source visual:
- `design-draft/05-contracts-list.png`

Prototype target: `http://localhost:19019`

Viewport checked: `393 x 852`

Scope note:
- Contracts list body, supplied contracts card background, supplied SVG icon geometry, shared top header contract state, and bottom contract tab routing were checked.
- Page is implemented as native React Native sections, not by using the full-page design image as a cutout.

## Result

final result: passed

## Evidence

- Top segmented control opens the contract page and shows `合约` active.
- Bottom `合约` tab opens the same page and becomes the active tab.
- Header/title, metrics card, search/filter card, contract list rows, and bottom action card are present at the mobile design scale.
- `background-contracts-card-hd.png` is used only for the hero card artwork; text and UI structure are rendered natively.
- Supplied contract SVG icon geometry is recreated as reusable React Native SVG components.
- `Privacy Router` renders fully after the title/tag layout fix; the previous `Privacy Rout` truncation is gone.
- Screenshot saved at `contracts-list-web-qa.png`.
- TypeScript check passes.
- Unit tests pass: `62` passed, `0` failed.

## Remaining P3 Notes

- Web preview does not include Android status bar and safe-area rendering exactly; final visual should be judged on the installed Android build.

---

# Design QA

Source visual:
- `design-draft/51-workspace-switch-market-guide.png`

Prototype target: `http://localhost:19019`

Viewport checked: `393 x 852`

Scope note:
- Workspace switch guide was removed after product feedback.
- The real shared top header `市场 / 钱包` controls now route directly to the target workspace.
- The old guide feature files are not mounted by `App.tsx`; no full-screen transition page is shown.

## Result

final result: passed

## Evidence

- Clicking top `市场` from the wallet workspace opens `marketHome` directly.
- Clicking top `钱包` from the market workspace opens `home` directly.
- `App.tsx` no longer imports `WorkspaceSwitchGuideScreen`.
- `App.tsx` no longer contains the `500ms` workspace switch timer or guide overlay state.
- TypeScript check passes.
- Unit tests pass: `75` passed, `0` failed.
- Android Release build passes: `android\gradlew.bat assembleRelease --console=plain`.

## Remaining P3 Notes

- Web preview does not include Android status bar and safe-area rendering exactly; final visual should be judged on the installed Android build.
