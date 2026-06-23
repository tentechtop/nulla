---
name: nulla-design-to-code
description: Project-only React Native design-to-code workflow for F:\workSpace2029\nulla. Use when the user provides a Nulla design draft image under design-draft and a matching static asset folder, and asks to implement, restore, or one-to-one recreate a mobile page in this project with code.
---

# Nulla Design To Code

## Scope

Use this skill only inside `F:\workSpace2029\nulla`.

Build high-fidelity mobile pages from:
- a design draft image, usually `design-draft\NN-name.png`
- a matching asset folder, usually `design-draft\assets\NN-name`

The output must be maintainable React Native/Expo code. Do not use the full design image as a page cutout.

## Required Workflow

1. Read the requested design image and asset folder.
2. Inspect existing app structure before editing:
   - `App.tsx`
   - `src\components\GlobalHeader.tsx`
   - `src\components\GlobalBottomNavigation.tsx`
   - nearby feature folders under `src\features`
   - existing tests under `tests`
3. Measure the design at mobile scale and map it to this project layout model:
   - `DESIGN_WIDTH = 864`
   - `TOP_NAVIGATION_DESIGN_HEIGHT = 117`
   - `scale = viewportWidth / DESIGN_WIDTH`
   - feature screens render below the global header with `topPadding={0}` from `App.tsx`
4. Create a feature folder:
   - `src\features\<featureName>\layout.js`
   - `src\features\<featureName>\layout.d.ts`
   - `src\features\<featureName>\use<FeatureName>ResponsiveLayout.ts`
   - `src\features\<featureName>\designAssets.ts`
   - `src\features\<featureName>\<FeatureName>SvgIcons.tsx`
   - `src\features\<featureName>\<FeatureName>Screen.tsx`
5. Implement the page with native components:
   - `View`, `Text`, `Image`, `Pressable`, `ScrollView`
   - `react-native-svg` components for SVG icons
   - `expo-linear-gradient` only where the design needs gradients
   - existing `colors`, `fontFamilies`, and `fontWeights` from `src\theme\tokens.ts`
6. Wire routing in `App.tsx` only when the page needs a tab or header entry.
7. Add focused tests in `tests\<feature-name>-layout.test.mjs`.
8. Update shared navigation/header tests when routing changes.
9. Run verification:
   - `npm test`
   - `npx tsc --noEmit`
   - if the page uses native assets or routing, run `android\gradlew.bat assembleRelease --console=plain` from `android`
10. Capture Web QA when local preview is available:
   - use viewport `393 x 852`
   - click the real route entry
   - save `<feature-name>-web-qa.png`
   - append a concise section to `design-qa.md`

## Project Rules

- Use Windows PowerShell commands. Do not use `rg` or `ripgrep`.
- Keep `openapi.yml` unchanged.
- Use UTF-8.
- Use `apply_patch` for manual edits.
- Keep feature screens free of local top headers and local bottom navs.
- The global top header belongs in `App.tsx` through `GlobalHeader`.
- The global bottom nav belongs in `App.tsx` through `GlobalBottomNavigation`.
- Keep `ScrollView` screens with:
  - `bounces={false}`
  - `overScrollMode="never"`
  - `showsVerticalScrollIndicator={false}`
  - `scrollView` and `canvas` backgrounds equal to `colors.background`
- Add short Chinese comments only for non-obvious implementation blocks, using `功能目的 + 实现原因`.

## Asset Rules

- Use provided bitmap assets only as local artwork, hero/card backgrounds, logos, or thumbnails.
- Never render the whole page by placing `NN-name.png` as one image.
- Require project assets from `designAssets.ts`.
- Convert supplied SVG files into typed `react-native-svg` components.
- Do not use `SvgXml`.
- Do not depend on external icon libraries for supplied custom icons.
- Keep text that is UI text as `Text`, not baked into a bitmap, unless the source asset itself contains fixed artwork text.

## Layout Rules

- Use absolute positioning inside a scaled `canvas` when matching a static mobile design.
- Keep repeated rows and card contents data-driven where it does not hurt fidelity.
- Use fixed row heights, stable card dimensions, and explicit `numberOfLines` only when needed.
- Prevent text clipping:
  - use wider text boxes before lowering font size
  - use `adjustsFontSizeToFit` for long account/address/amount strings
  - verify long labels such as `Privacy Router` and addresses render fully
- For card backgrounds, adjust `Image` width/position and overlay gradients so the visible subject matches the design; do not rely blindly on centered `cover`.
- Respect existing title weight by using `fontWeights.pageTitle`.

## Routing Patterns

For a new bottom-tab page:
1. Add a route to `AppRoute`.
2. Add an `handleOpen...` function that calls `openRoute`.
3. Map `activeBottomTab` to the new tab key.
4. Pass the handler into `GlobalBottomNavigation`.
5. Render the feature from `ActiveScreen` with `bottomPadding={bottomPadding}` and `topPadding={0}`.

For a page that needs top segmented state:
- Use the shared `GlobalHeader` and `activeHeaderWorkspace`.
- Keep the project-wide rule: market discovery/trading/application pages select `market`; wallet/asset/privacy/DPoS/account pages select `wallet`.
- The visible top labels are `市场 / 钱包`, not implementation terms such as `资产 / 合约`.
- Do not add page-specific inactive segmented states to the global header.

## Test Requirements

Each new page should have tests that assert:
- layout metrics scale by viewport width
- safe areas stay outside design scale
- invalid viewport inputs throw
- supplied bitmap asset is referenced
- key visible copy is present
- the full design image is not referenced as a page asset
- supplied SVG geometry is represented in component code
- `SvgXml` is absent

When routing changes, update tests to assert:
- feature screens do not mount local navigation
- the bottom tab opens and highlights the page
- global header remains mounted once at `App.tsx`
- Android side-back still uses the route stack

## Verification Gate

Do not hand off until:
- unit tests pass
- TypeScript check passes
- `openapi.yml` has no diff
- Web QA or DOM QA confirms the requested page opens through the real route
- Android Release build passes when native bundling may be affected

If any check is blocked, state the exact blocker and the command or artifact involved.
