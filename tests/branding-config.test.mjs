import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appConfig = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));

test('app branding points to generated premium icon assets', () => {
  assert.equal(appConfig.expo.name, 'SOL');
  assert.equal(appConfig.expo.icon, './assets/brand/icon.png');
  assert.equal(appConfig.expo.android.adaptiveIcon.foregroundImage, './assets/brand/adaptive-icon.png');
  assert.equal(appConfig.expo.android.adaptiveIcon.backgroundColor, '#05070B');
});

test('native splash remains static white with centered black logo asset', () => {
  assert.equal(appConfig.expo.splash.image, './assets/brand/splash.png');
  assert.equal(appConfig.expo.splash.backgroundColor, '#FFFFFF');
  assert.equal(appConfig.expo.splash.resizeMode, 'contain');
});
