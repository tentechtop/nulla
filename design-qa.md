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
