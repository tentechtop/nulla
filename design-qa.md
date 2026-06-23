# Design QA

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
