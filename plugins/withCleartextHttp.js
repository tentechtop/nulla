const fs = require('node:fs');
const path = require('node:path');
const {
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist
} = require('expo/config-plugins');

// 功能目的：生成明文网络配置；实现原因：Expo 重新生成原生工程时需要稳定保留 HTTP RPC 访问能力。
const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system"/>
    </trust-anchors>
  </base-config>
</network-security-config>
`;

function getAndroidApplication(manifest) {
  const applications = manifest.manifest.application;
  if (!Array.isArray(applications) || applications.length === 0) {
    throw new Error('AndroidManifest.xml missing application node.');
  }

  return applications[0];
}

function withAndroidCleartextManifest(config) {
  return withAndroidManifest(config, (pluginConfig) => {
    const application = getAndroidApplication(pluginConfig.modResults);
    application.$ = application.$ || {};
    application.$['android:usesCleartextTraffic'] = 'true';
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return pluginConfig;
  });
}

function withAndroidNetworkSecurityFile(config) {
  return withDangerousMod(config, [
    'android',
    async (pluginConfig) => {
      const xmlDirectory = path.join(
        pluginConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );
      const xmlFile = path.join(xmlDirectory, 'network_security_config.xml');

      // 功能目的：写入 Android 网络安全配置；实现原因：Android 9 以上默认禁止 HTTP，需要显式放行 RPC 节点明文访问。
      fs.mkdirSync(xmlDirectory, { recursive: true });
      fs.writeFileSync(xmlFile, NETWORK_SECURITY_CONFIG, 'utf8');
      return pluginConfig;
    }
  ]);
}

function withIosCleartextTransport(config) {
  return withInfoPlist(config, (pluginConfig) => {
    const appTransportSecurity = pluginConfig.modResults.NSAppTransportSecurity || {};

    // 功能目的：放行 iOS HTTP 调试链路；实现原因：本地和内网 RPC 节点在开发部署中可能没有 TLS 证书。
    appTransportSecurity.NSAllowsArbitraryLoads = true;
    appTransportSecurity.NSAllowsLocalNetworking = true;
    pluginConfig.modResults.NSAppTransportSecurity = appTransportSecurity;
    return pluginConfig;
  });
}

function withCleartextHttp(config) {
  const manifestConfig = withAndroidCleartextManifest(config);
  const networkSecurityConfig = withAndroidNetworkSecurityFile(manifestConfig);
  return withIosCleartextTransport(networkSecurityConfig);
}

module.exports = withCleartextHttp;
