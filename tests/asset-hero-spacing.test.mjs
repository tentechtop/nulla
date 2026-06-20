import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const assetHeroSource = readFileSync(new URL('../src/features/home/AssetHeroCard.tsx', import.meta.url), 'utf8');
const homeDesignAssetsSource = readFileSync(new URL('../src/features/home/designAssets.ts', import.meta.url), 'utf8');

test('asset hero card uses balanced horizontal content padding', () => {
  assert.match(assetHeroSource, /const HERO_CARD_CONTENT_PADDING = 24/);
  assert.match(assetHeroSource, /const HERO_CARD_CONTENT_WIDTH = HERO_CARD_WIDTH - HERO_CARD_CONTENT_PADDING \* 2/);
  assert.match(assetHeroSource, /const HERO_CARD_CURRENCY_LEFT = HERO_CARD_WIDTH - HERO_CARD_CONTENT_PADDING - HERO_CARD_CURRENCY_WIDTH/);
});

test('asset hero card avoids mismatched legacy left padding', () => {
  assert.doesNotMatch(assetHeroSource, /left: scaled\(54, scale\)/);
  assert.doesNotMatch(assetHeroSource, /width: scaled\(744, scale\)/);
  assert.doesNotMatch(assetHeroSource, /left: scaled\(674, scale\)/);
});

test('asset hero LAMPORTS row uses prototype token image with centered bordered slot', () => {
  assert.match(homeDesignAssetsSource, /lamportsTokenIcon: require\('\.\.\/\.\.\/\.\.\/design-draft\/common\/Size=96, Color=color@2x\.png'\)/);
  assert.match(assetHeroSource, /<Image resizeMode="contain" source=\{homeAssetImages\.lamportsTokenIcon\} style=\{styles\.tokenIconImage\} \/>/);
  assert.match(assetHeroSource, /borderColor: 'rgba\(255,255,255,0\.72\)'/);
  assert.match(assetHeroSource, /tokenIconSlot: \{\s*alignItems: 'center'[\s\S]*justifyContent: 'center'/);
  assert.doesNotMatch(assetHeroSource, /tokenStripeTop|tokenStripeMiddle|tokenStripeBottom/);
});
