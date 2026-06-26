# Nulla

> 面向移动端的 SOL 钱包与链上操作控制台。用 Expo / React Native 构建，覆盖钱包创建、收款转账、DPoS、合约、行情、链浏览器和账户 RPC 管理，目标是把「可用的钱包客户端」做成一套可维护、可测试、可发布的工程。

![Expo](https://img.shields.io/badge/Expo-51-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.74-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?logo=typescript)
![Tests](https://img.shields.io/badge/tests-node--test-16a34a)

## 项目定位

Nulla 不是一张设计稿切出来的壳，也不是只能演示静态页面的 Demo。它把移动钱包的核心链路拆成清晰的业务模块：钱包状态、地址规范、交易构建、RPC 访问、DPoS 数据、合约确认、二维码扫描和本地持久化都各自收敛在独立文件里，页面层只负责组织交互和展示。

当前应用名为 `SOL`，Android 包名为 `com.nulla.dex`。

## 核心能力

| 模块 | 能力 |
| --- | --- |
| 钱包生命周期 | 创建助记词、导入助记词、备份确认、账户切换、本地账户状态恢复 |
| 资产工作台 | SOL / Lamports 资产总览、收款地址、转账入口、交易详情、交易历史 |
| 扫码链路 | 相机扫码、图片二维码识别、收款 / 转账 / 合约载荷解析 |
| DPoS | 验证者列表、节点详情、质押、委托、解锁、赎回、验证者注册和佣金更新 |
| 合约 | 合约列表、合约调用确认、部署请求解析、链上提交结果展示 |
| 链浏览器 | 区块详情、链状态、网络状态、RPC 节点详情 |
| 市场页 | 行情首页、资产行情、合约市场工作区 |
| 安全基础 | 地址格式校验、RPC 地址规范化、输入边界清洗、签名种子本地安全存储 |

## 技术架构

```text
App.tsx
  ├─ 路由栈与钱包状态边界
  ├─ 全局 Header / Bottom Navigation
  └─ 页面级业务编排

src/components
  ├─ 全局导航、弹窗、布局壳、Logo 等通用 UI
  └─ 保持展示组件可复用、低副作用

src/features
  ├─ home / marketHome / accountHome
  ├─ walletSetup / transferSend / receiveAddress / scanResult
  ├─ dposOverview / chainExplorer / contractsList
  └─ 每个页面独立维护 layout、assets、screen、icons

src/utils
  ├─ addressSpec       地址规范与签名公钥派生
  ├─ chainRpc          RPC 请求与端点规范化
  ├─ chainTransactions 链上交易构建
  ├─ chainOperations   交易提交与确认
  ├─ walletSetup       助记词和账户模型
  └─ walletPersistence 本地状态与安全存储

tests
  └─ Node 原生 test runner，覆盖主要业务函数、页面布局和边界行为
```

## 状态边界

| 状态 | 入口 | 允许行为 |
| --- | --- | --- |
| 空钱包 | `walletCreateMnemonicEntry` | 创建、导入、备份、扫码 |
| 已有钱包 | `home` | 资产、转账、收款、DPoS、隐私、账户、市场 |
| 市场工作区 | `marketHome` | 行情和合约市场，不强依赖钱包账户 |
| 链上提交中 | 交易 / DPoS / 合约确认页 | 使用最新 blockhash 签名并提交，失败时给出明确错误 |
| RPC 自定义 | 账户页 | 校验 URL，旧公网端点自动迁移到当前公网端点 |

## 快速启动

环境要求：

- Node.js 18+
- npm
- Android Studio / Android SDK（仅 Android 真机或模拟器需要）
- 已授权的 Android 设备（仅执行安装脚本时需要）

安装依赖：

```powershell
npm install
```

启动 Expo：

```powershell
npm run start
```

启动 Web 预览：

```powershell
npm run web
```

运行 Android 调试：

```powershell
npm run android
```

## 测试

```powershell
npm test
```

测试覆盖重点：

- 钱包创建、持久化、地址规范和敏感信息展示
- 转账、扫码、部署请求、交易历史等业务工具函数
- 首页、市场、DPoS、链浏览器、收款、交易详情等页面布局
- 弹窗动效、全局 Header、底部导航和路由状态

## 打包并安装到 Android 手机

项目已经封装一键安装脚本：

```powershell
npm run android:install
```

脚本会自动完成：

- 检测已连接且授权的 Android 设备
- 缺少 `node_modules` 时执行 `npm install`
- 缺少 `android` 工程时执行 Expo prebuild
- 同步 App 图标和启动图
- 构建内置 JS Bundle 的 Release APK
- 通过 `adb install -r` 覆盖安装
- 自动启动 `com.nulla.dex`

多设备时指定设备：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-install-android.ps1 -DeviceId 设备ID
```

## 工程原则

- 页面不是整图切片，所有核心界面都由 React Native 组件实现。
- 通用业务逻辑集中在 `src/utils`，页面层不堆复杂算法。
- 输入进入业务前先校验和归一化，避免脏数据穿透到交易构建层。
- 交易提交前获取最新 blockhash，并对可恢复场景做有限重试。
- 本地持久化分层处理：账户元数据和签名种子分开读写，原生端优先使用 Secure Store。
- 所有关键业务函数配套测试，避免靠手工点页面验证核心链路。

## 安全说明

Nulla 已经实现基础输入校验、地址规范化、RPC 端点清洗和本地敏感数据存储，但钱包属于高风险软件。接入真实资金或主网资产前，必须完成：

- 独立安全审计
- 密钥管理和备份流程审查
- Release 签名、混淆和供应链检查
- RPC 端点可信性和 TLS 策略确认
- 真实设备上的异常断网、重复提交、低电量和系统回收测试

## 目录速览

```text
assets/        品牌图、页面图标和静态资源
android/       Expo prebuild 后的 Android 原生工程
design-draft/ 设计稿、资产抽取结果和页面验收资料
scripts/       Android 构建安装、品牌资源生成和同步脚本
src/           应用源码
tests/         自动化测试
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run start` | 启动 Expo Metro |
| `npm run web` | 启动 Web 预览 |
| `npm run android` | 运行 Android 调试版本 |
| `npm run android:install` | 构建并安装 Release APK 到手机 |
| `npm test` | 运行全部自动化测试 |

## License

本项目使用 Apache License 2.0。详见 `LICENSE`。
