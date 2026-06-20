# Design QA

Source visual: `design-draft/01-assets-home.png`

Prototype target: `http://localhost:19017`

Viewport checked: `393 x 852`

## Result

final result: passed

## Evidence

- The homepage is rendered from exact design slices cropped from the source PNG.
- The rendered page width equals the viewport width, with no horizontal overflow.
- Asset card, SOL hologram background, icon buttons, status icons, market icons, and bottom navigation are all sourced from the design image.
- Transparent touch zones are layered over visible controls so the screen is not just inert chrome.

## Remaining P3 Notes

- Text is currently rasterized inside design slices for maximum visual fidelity. A later production pass can replace text with semantic React Native text once all visual coordinates are locked.

## Brand Update

final result: passed

- App display name is now `NULLA`.
- App icon uses a dedicated NULLA N mark, avoiding SOL brand confusion.
- Splash image uses a clean hologram platform crop with no SOL text, no asset figures, and no homepage UI residue.
- Expo config references `assets/brand/icon.png`, `assets/brand/adaptive-icon.png`, and `assets/brand/splash.png`.

## Responsive Update

final result: passed

- Home screen now derives bottom navigation height from the active viewport width.
- Safe-area top and bottom insets are reserved through `react-native-safe-area-context`.
- Verified phone viewports: `320 x 693`, `393 x 852`, and `430 x 932`.
- All checked viewports reported `scrollWidth === clientWidth`, so there is no horizontal overflow.
