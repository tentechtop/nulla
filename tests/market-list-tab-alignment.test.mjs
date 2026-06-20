import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const marketListSource = readFileSync(new URL('../src/features/home/MarketList.tsx', import.meta.url), 'utf8');

test('market list tabs and menu icon share the same vertical alignment slot', () => {
  assert.match(marketListSource, /<View style=\{styles\.tabLabelSlot\}>/);
  assert.match(marketListSource, /const MARKET_TAB_MENU_TOP = 10/);
  assert.match(marketListSource, /tabLabelSlot: \{\s+alignItems: 'center',\s+height: scaled\(34, scale\),\s+justifyContent: 'center'/);
  assert.match(marketListSource, /menuIcon: \{\s+alignItems: 'center',\s+height: scaled\(34, scale\),\s+justifyContent: 'center'/);
  assert.match(marketListSource, /top: scaled\(MARKET_TAB_MENU_TOP, scale\)/);
});
