import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

test('workspace switch no longer mounts the temporary guide page', () => {
  assert.doesNotMatch(appSource, /WorkspaceSwitchGuideScreen/);
  assert.doesNotMatch(appSource, /WorkspaceSwitchGuideTarget/);
  assert.doesNotMatch(appSource, /WORKSPACE_SWITCH_GUIDE_MS/);
  assert.doesNotMatch(appSource, /workspaceSwitchGuideTarget/);
  assert.doesNotMatch(appSource, /workspaceSwitchGuideOverlay/);
  assert.doesNotMatch(appSource, /setTimeout\(\(\) => \{\s+workspaceSwitchTimerRef/);
});

test('top workspace buttons switch directly to wallet or market routes', () => {
  assert.match(appSource, /const handleOpenMarketHome = \(\) => \{\s+openRoute\('marketHome'\);\s+\};/);
  assert.match(appSource, /const handleOpenHome = \(\) => \{\s+openRoute\('home'\);\s+\};/);
  assert.match(appSource, /onMarketPress=\{handleOpenMarketHome\}/);
  assert.match(appSource, /onWalletPress=\{handleOpenHome\}/);
});
