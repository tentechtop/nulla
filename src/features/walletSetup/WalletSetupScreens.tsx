import { useEffect, useState, type ReactNode } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { getRandomBytesAsync } from 'expo-crypto';
import { LinearGradient } from 'expo-linear-gradient';
import { AddressActionDialog } from '../../components/AddressActionDialog';
import { FastDialogModal } from '../../components/FastDialogModal';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { copyTextToClipboard } from '../../utils/clipboard';
import {
  createMnemonicWords,
  formatShortAddress,
  normalizeWalletAccountLabel,
  parseMnemonicText,
  sanitizeWalletAccountLabelInput,
  validateMnemonicWords,
  verifyMnemonicWord,
  type WalletAccount
} from '../../utils/walletSetup';
import { walletSetupImages } from './designAssets';
import {
  AddCircleIcon,
  BackIcon,
  CardCopyIcon,
  CardQrIcon,
  ChevronRightIcon,
  SelectedCheckIcon,
  SolAvatarIcon,
  WalletSetupIcon,
  type WalletSetupIconKey
} from './WalletSetupSvgIcons';
import { useWalletSetupResponsiveLayout } from './useWalletSetupResponsiveLayout';

const TOP_NAVIGATION_DESIGN_HEIGHT = 177;
const WORD_COUNT_OPTIONS = [12, 18, 24] as const;
const VERIFY_WORD_NUMBERS = [3, 9] as const;
const MNEMONIC_WORD_COLUMNS = 3;
const MNEMONIC_WORD_BASE_ROWS = 4;
const MNEMONIC_WORD_ROW_STEP = 72;
const MNEMONIC_ACTION_BAR_BASE_TOP = 360;
const MNEMONIC_CARD_BASE_HEIGHT = 462;

type MnemonicWordCount = (typeof WORD_COUNT_OPTIONS)[number];
type MnemonicVerifyWordNumber = (typeof VERIFY_WORD_NUMBERS)[number];

export type WalletBackupProgress = {
  readonly copied: boolean;
  readonly completed: boolean;
  readonly ninthWordVerified: boolean;
  readonly thirdWordVerified: boolean;
};

type WalletSetupScreenBaseProps = {
  readonly bottomPadding?: number;
  readonly topPadding?: number;
};

type WalletCreateMnemonicEntryScreenProps = WalletSetupScreenBaseProps & {
  readonly defaultWalletName: string;
  readonly onGenerateMnemonic: (words: readonly string[], walletName: string) => void;
  readonly onImportWalletPress: () => void;
};

type WalletImportMnemonicScreenProps = WalletSetupScreenBaseProps & {
  readonly onBackPress: () => void;
  readonly onImportMnemonic: (words: readonly string[]) => void;
};

type WalletMnemonicBackupScreenProps = WalletSetupScreenBaseProps & {
  readonly backupProgress: WalletBackupProgress;
  readonly mnemonicWords: readonly string[];
  readonly onBackPress: () => void;
  readonly onBackupProgressChange: (progress: WalletBackupProgress) => void;
  readonly onCompleteBackup: () => void;
  readonly onRegenerateMnemonic: (words: readonly string[]) => void;
};

type WalletSwitchAccountScreenProps = WalletSetupScreenBaseProps & {
  readonly backupProgress: WalletBackupProgress;
  readonly currentAddress: string;
  readonly onBackPress: () => void;
  readonly onConfirmSwitch: (address: string) => void;
  readonly onCreateWalletPress: () => void;
  readonly onImportWalletPress: () => void;
  readonly onRemoveWallet: (address: string) => void;
  readonly walletAccounts: readonly WalletAccount[];
};

const webNoFocusOutline = Platform.OS === 'web'
  ? ({ outlineColor: 'transparent', outlineStyle: 'none', outlineWidth: 0 } as unknown as ViewStyle)
  : undefined;

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function scaledBelowTopNavigation(value: number, scale: number) {
  return scaled(value - TOP_NAVIGATION_DESIGN_HEIGHT, scale);
}

function createInitialBackupProgress(): WalletBackupProgress {
  return {
    copied: false,
    completed: false,
    ninthWordVerified: false,
    thirdWordVerified: false
  };
}

export function createEmptyWalletBackupProgress() {
  return createInitialBackupProgress();
}

function getMnemonicBackupLayout(wordCount: number) {
  const rowCount = Math.max(MNEMONIC_WORD_BASE_ROWS, Math.ceil(wordCount / MNEMONIC_WORD_COLUMNS));
  const contentOffsetDesign = (rowCount - MNEMONIC_WORD_BASE_ROWS) * MNEMONIC_WORD_ROW_STEP;

  return {
    actionBarTopDesign: MNEMONIC_ACTION_BAR_BASE_TOP + contentOffsetDesign,
    canvasHeightDesign: 1618 + contentOffsetDesign,
    cardHeightDesign: MNEMONIC_CARD_BASE_HEIGHT + contentOffsetDesign,
    contentOffsetDesign
  };
}

function resolveMnemonicWordCount(wordCount: number): MnemonicWordCount {
  if (wordCount === 18 || wordCount === 24) {
    return wordCount;
  }

  return 12;
}

export function WalletCreateMnemonicEntryScreen({
  bottomPadding,
  defaultWalletName,
  onGenerateMnemonic,
  onImportWalletPress,
  topPadding
}: WalletCreateMnemonicEntryScreenProps) {
  const layoutMetrics = useWalletSetupResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const resolvedPadding = getResolvedPadding(layoutMetrics, topPadding, bottomPadding);
  const [wordCount, setWordCount] = useState<MnemonicWordCount>(12);
  const [walletName, setWalletName] = useState(() => sanitizeWalletAccountLabelInput(defaultWalletName));
  const [isLossAccepted, setIsLossAccepted] = useState(true);
  const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setWalletName(sanitizeWalletAccountLabelInput(defaultWalletName));
  }, [defaultWalletName]);

  const handleWalletNameChange = (value: string) => {
    setWalletName(sanitizeWalletAccountLabelInput(value));
  };

  const handleClearWalletName = () => {
    setWalletName('');
    setMessage('');
  };

  const handleGenerateMnemonic = () => {
    if (isGeneratingMnemonic) {
      return;
    }

    let normalizedWalletName = '';
    try {
      normalizedWalletName = normalizeWalletAccountLabel(walletName);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      return;
    }

    if (!isLossAccepted) {
      setMessage('请先确认助记词丢失后无法找回');
      return;
    }

    setIsGeneratingMnemonic(true);
    setMessage('正在调用系统安全随机数...');

    void createMnemonicWordsWithSystemRandom(wordCount)
      .then((words) => {
        setMessage('');
        onGenerateMnemonic(words, normalizedWalletName);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setIsGeneratingMnemonic(false);
      });
  };

  return (
    <WalletSetupFrame bottomPadding={resolvedPadding.bottom} styles={styles} topPadding={resolvedPadding.top}>
      <PageHeading subtitle="本地生成、离线保存" title="创建钱包" top={scaledBelowTopNavigation(189, layoutMetrics.scale)} styles={styles} />
      <HeroCard
        badges={[
          { iconKey: 'shield', label: '本地签名' },
          { iconKey: 'document', label: `${wordCount} 词助记词` },
          { iconKey: 'privateLock', label: '私钥不上链' }
        ]}
        imageSource={walletSetupImages.createCardBackground}
        subtitle="助记词仅在本机生成，不上传节点"
        title="生成新的 SOL 钱包"
        top={scaledBelowTopNavigation(300, layoutMetrics.scale)}
        styles={styles}
      />
      <WalletInfoCard
        isLossAccepted={isLossAccepted}
        onLossAcceptedChange={setIsLossAccepted}
        onWalletNameChange={handleWalletNameChange}
        onWalletNameClear={handleClearWalletName}
        onWordCountChange={setWordCount}
        scale={layoutMetrics.scale}
        styles={styles}
        walletName={walletName}
        wordCount={wordCount}
      />
      <CreateConfirmCard scale={layoutMetrics.scale} styles={styles} />
      {message ? <Text style={styles.createMessage}>{message}</Text> : null}
      <PrimaryButton label={isGeneratingMnemonic ? '正在生成' : '生成助记词'} onPress={handleGenerateMnemonic} styles={styles} top={scaledBelowTopNavigation(1500, layoutMetrics.scale)} />
      <SecondaryButton label="导入已有钱包" onPress={onImportWalletPress} styles={styles} top={scaledBelowTopNavigation(1604, layoutMetrics.scale)} />
    </WalletSetupFrame>
  );
}

export function WalletImportMnemonicScreen({
  bottomPadding,
  onBackPress,
  onImportMnemonic,
  topPadding
}: WalletImportMnemonicScreenProps) {
  const layoutMetrics = useWalletSetupResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const resolvedPadding = getResolvedPadding(layoutMetrics, topPadding, bottomPadding);
  const [mnemonicText, setMnemonicText] = useState('');
  const [message, setMessage] = useState('');
  const importedWords = parseMnemonicText(mnemonicText);
  const importedWordCount = importedWords.length;

  const handleImportMnemonic = () => {
    // 功能目的：导入已有助记词；实现原因：恢复钱包必须使用用户提供的离线备份而不是重新生成。
    try {
      const words = parseMnemonicText(mnemonicText);
      const validationMessage = validateMnemonicWords(words);

      if (validationMessage) {
        setMessage(validationMessage);
        return;
      }

      setMessage('');
      onImportMnemonic(words);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <WalletSetupFrame bottomPadding={resolvedPadding.bottom} styles={styles} topPadding={resolvedPadding.top}>
      <BackHeading onBackPress={onBackPress} subtitle="只恢复本地账户" title="导入钱包" top={scaledBelowTopNavigation(193, layoutMetrics.scale)} styles={styles} />
      <HeroCard
        badges={[
          { iconKey: 'document', label: '12/18/24 词' },
          { iconKey: 'shield', label: '本地校验' },
          { iconKey: 'noScreenshot', label: '不上传' }
        ]}
        imageSource={walletSetupImages.createCardBackground}
        subtitle="输入已有助记词，本机恢复地址"
        title="导入已有 SOL 钱包"
        top={scaledBelowTopNavigation(286, layoutMetrics.scale)}
        styles={styles}
      />
      <ImportMnemonicCard
        message={message}
        mnemonicText={mnemonicText}
        onMnemonicTextChange={setMnemonicText}
        styles={styles}
        wordCount={importedWordCount}
      />
      <ImportConfirmCard scale={layoutMetrics.scale} styles={styles} />
      <PrimaryButton label="导入钱包" onPress={handleImportMnemonic} styles={styles} top={scaledBelowTopNavigation(1501, layoutMetrics.scale)} />
      <SecondaryButton label="返回创建" onPress={onBackPress} styles={styles} top={scaledBelowTopNavigation(1600, layoutMetrics.scale)} />
    </WalletSetupFrame>
  );
}

export function WalletMnemonicBackupScreen({
  backupProgress,
  bottomPadding,
  mnemonicWords,
  onBackPress,
  onBackupProgressChange,
  onCompleteBackup,
  onRegenerateMnemonic,
  topPadding
}: WalletMnemonicBackupScreenProps) {
  const layoutMetrics = useWalletSetupResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const resolvedPadding = getResolvedPadding(layoutMetrics, topPadding, bottomPadding);
  const [isMnemonicHidden, setIsMnemonicHidden] = useState(false);
  const [isRegeneratingMnemonic, setIsRegeneratingMnemonic] = useState(false);
  const [activeVerifyWordNumber, setActiveVerifyWordNumber] = useState<MnemonicVerifyWordNumber | null>(null);
  const [verifyAnswer, setVerifyAnswer] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [message, setMessage] = useState('');
  const mnemonicBackupLayout = getMnemonicBackupLayout(mnemonicWords.length);
  const getShiftedBackupTop = (designTop: number) => scaledBelowTopNavigation(designTop + mnemonicBackupLayout.contentOffsetDesign, layoutMetrics.scale);

  const updateBackupProgress = (patch: Partial<WalletBackupProgress>) => {
    onBackupProgressChange({ ...backupProgress, ...patch });
  };

  const handleCopyMnemonic = () => {
    setMessage('正在复制助记词...');

    void copyTextToClipboard(mnemonicWords.join(' '), '助记词已复制，请只保存到离线介质')
      .then((result) => {
        updateBackupProgress({ copied: true });
        setMessage(result.message);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : String(error)));
  };

  const handleRegenerateMnemonic = () => {
    if (isRegeneratingMnemonic) {
      return;
    }

    setIsRegeneratingMnemonic(true);
    setMessage('正在调用系统安全随机数...');

    void createMnemonicWordsWithSystemRandom(resolveMnemonicWordCount(mnemonicWords.length))
      .then((words) => {
        setMessage('');
        onRegenerateMnemonic(words);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setIsRegeneratingMnemonic(false);
      });
  };

  const handleOpenVerifyWord = (wordNumber: MnemonicVerifyWordNumber) => {
    // 功能目的：打开指定助记词校验；实现原因：备份确认必须由用户输入原词完成。
    setIsMnemonicHidden(true);
    setVerifyAnswer('');
    setVerifyMessage('');
    setActiveVerifyWordNumber(wordNumber);
    setMessage(`请输入第 ${wordNumber} 个助记词完成校验`);
  };

  const handleCloseVerifyWord = () => {
    setActiveVerifyWordNumber(null);
    setVerifyAnswer('');
    setVerifyMessage('');
  };

  const handleSubmitVerifyWord = () => {
    if (activeVerifyWordNumber === null) {
      return;
    }

    try {
      if (!verifyMnemonicWord(mnemonicWords, activeVerifyWordNumber, verifyAnswer)) {
        setVerifyMessage(`第 ${activeVerifyWordNumber} 词不正确，请重新核对`);
        return;
      }

      updateBackupProgress(getVerifyProgressPatch(activeVerifyWordNumber));
      setMessage(`第 ${activeVerifyWordNumber} 词校验通过`);
      handleCloseVerifyWord();
    } catch (error) {
      setVerifyMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCompleteBackup = () => {
    if (!backupProgress.thirdWordVerified || !backupProgress.ninthWordVerified) {
      setMessage('请先完成第 3 词和第 9 词校验');
      return;
    }

    setMessage('');
    onCompleteBackup();
  };

  return (
    <WalletSetupFrame bottomPadding={resolvedPadding.bottom} canvasHeight={scaled(mnemonicBackupLayout.canvasHeightDesign, layoutMetrics.scale)} styles={styles} topPadding={resolvedPadding.top}>
      <BackHeading onBackPress={onBackPress} subtitle={`${mnemonicWords.length} 词，仅本机显示`} title="备份助记词" top={scaledBelowTopNavigation(193, layoutMetrics.scale)} styles={styles} />
      <HeroCard
        badges={[
          { iconKey: 'shield', label: backupProgress.completed ? '已备份' : '未备份' },
          { iconKey: 'eye', label: isMnemonicHidden ? '已隐藏' : '本地显示' },
          { iconKey: 'noScreenshot', label: '禁止上传' }
        ]}
        imageSource={walletSetupImages.mnemonicCardBackground}
        subtitle="任何人获取助记词都能控制资产"
        title={`请离线抄写 ${mnemonicWords.length} 个助记词`}
        top={scaledBelowTopNavigation(286, layoutMetrics.scale)}
        styles={styles}
      />
      <MnemonicWordsCard
        isMnemonicHidden={isMnemonicHidden}
        mnemonicWords={mnemonicWords}
        onCopyPress={handleCopyMnemonic}
        onToggleHidden={() => setIsMnemonicHidden(!isMnemonicHidden)}
        layout={mnemonicBackupLayout}
        scale={layoutMetrics.scale}
        styles={styles}
      />
      <SecurityBoundaryCard scale={layoutMetrics.scale} styles={styles} top={getShiftedBackupTop(1101)} />
      <BackupVerifyCard backupProgress={backupProgress} message={message} onVerifyWordPress={handleOpenVerifyWord} scale={layoutMetrics.scale} styles={styles} top={getShiftedBackupTop(1386)} />
      <PrimaryButton label="我已离线备份" onPress={handleCompleteBackup} styles={styles} top={getShiftedBackupTop(1501)} />
      <SecondaryButton label={isRegeneratingMnemonic ? '正在生成' : '重新生成'} onPress={handleRegenerateMnemonic} styles={styles} top={getShiftedBackupTop(1600)} />
      <MnemonicVerifyDialog
        answer={verifyAnswer}
        message={verifyMessage}
        onAnswerChange={setVerifyAnswer}
        onClose={handleCloseVerifyWord}
        onSubmit={handleSubmitVerifyWord}
        styles={styles}
        visible={activeVerifyWordNumber !== null}
        wordNumber={activeVerifyWordNumber ?? 3}
      />
    </WalletSetupFrame>
  );
}

function getVerifyProgressPatch(wordNumber: MnemonicVerifyWordNumber): Partial<WalletBackupProgress> {
  if (wordNumber === 3) {
    return { thirdWordVerified: true };
  }

  return { ninthWordVerified: true };
}

async function createMnemonicWordsWithSystemRandom(wordCount: MnemonicWordCount) {
  try {
    const randomBytes = await getRandomBytesAsync(wordCount);
    return createMnemonicWords(wordCount, randomBytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`无法生成助记词: 系统安全随机数不可用，${message}`);
  }
}

export function WalletSwitchAccountScreen({
  backupProgress,
  bottomPadding,
  currentAddress,
  onBackPress,
  onConfirmSwitch,
  onCreateWalletPress,
  onImportWalletPress,
  onRemoveWallet,
  topPadding,
  walletAccounts
}: WalletSwitchAccountScreenProps) {
  const layoutMetrics = useWalletSetupResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const resolvedPadding = getResolvedPadding(layoutMetrics, topPadding, bottomPadding);
  const [selectedAddress, setSelectedAddress] = useState(currentAddress);
  const [message, setMessage] = useState('');
  const [isAddressDialogVisible, setIsAddressDialogVisible] = useState(false);
  const [addressDialogMessage, setAddressDialogMessage] = useState('请核对完整地址后扫码或复制。');
  useEffect(() => {
    setSelectedAddress(currentAddress);
  }, [currentAddress]);

  if (walletAccounts.length === 0) {
    throw new Error('本地钱包列表不能为空');
  }

  const currentAccount = walletAccounts.find((account) => account.address === currentAddress) ?? walletAccounts[0];
  const selectedAccount = walletAccounts.find((account) => account.address === selectedAddress) ?? currentAccount;
  const isSelectedCurrentAccount = selectedAccount.address === currentAccount.address;

  const handleCopyCurrentAddress = () => {
    setIsAddressDialogVisible(true);
    setAddressDialogMessage('正在复制地址...');

    void copyTextToClipboard(selectedAccount.address, '地址已复制')
      .then((result) => setAddressDialogMessage(result.message))
      .catch((error) => setAddressDialogMessage(error instanceof Error ? error.message : String(error)));
  };

  const handleShowCurrentQr = () => {
    setAddressDialogMessage('请核对完整地址后扫码或复制。');
    setIsAddressDialogVisible(true);
  };

  const handleConfirmSwitch = () => {
    setMessage('');
    onConfirmSwitch(selectedAccount.address);
  };

  const handleRemoveWallet = () => {
    try {
      onRemoveWallet(selectedAccount.address);
      setMessage('已移除本地账户记录');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <WalletSetupFrame bottomPadding={resolvedPadding.bottom} styles={styles} topPadding={resolvedPadding.top}>
      <PageHeading subtitle="本地账户，不上传私钥" title="切换钱包" top={scaledBelowTopNavigation(176, layoutMetrics.scale)} styles={styles} />
      <Pressable accessibilityLabel="返回账户页" accessibilityRole="button" onPress={onBackPress} style={[styles.switchBackButton, webNoFocusOutline]}>
        <BackIcon size={scaled(40, layoutMetrics.scale)} />
      </Pressable>
      <SwitchHeroCard
        account={selectedAccount}
        backupProgress={backupProgress}
        label={isSelectedCurrentAccount ? '当前钱包' : '待切换钱包'}
        onCopyPress={handleCopyCurrentAddress}
        onQrPress={handleShowCurrentQr}
        scale={layoutMetrics.scale}
        styles={styles}
      />
      <LocalWalletCard
        currentAddress={currentAddress}
        onSelectAddress={setSelectedAddress}
        scale={layoutMetrics.scale}
        selectedAddress={selectedAddress}
        styles={styles}
        walletAccounts={walletAccounts}
      />
      <SwitchConfirmCard scale={layoutMetrics.scale} styles={styles} />
      <SwitchActionCard
        message={message}
        onCreateWalletPress={onCreateWalletPress}
        onImportWalletPress={onImportWalletPress}
        onRemoveWallet={handleRemoveWallet}
        scale={layoutMetrics.scale}
        styles={styles}
      />
      <PrimaryButton label="确认切换" onPress={handleConfirmSwitch} styles={styles} top={scaledBelowTopNavigation(1537, layoutMetrics.scale)} />
      <SecondaryButton label="返回账户" onPress={onBackPress} styles={styles} top={scaledBelowTopNavigation(1630, layoutMetrics.scale)} />
      <AddressActionDialog
        address={selectedAccount.address}
        message={addressDialogMessage}
        onClose={() => setIsAddressDialogVisible(false)}
        onCopyPress={handleCopyCurrentAddress}
        scale={layoutMetrics.scale}
        visible={isAddressDialogVisible}
      />
    </WalletSetupFrame>
  );
}

function WalletSetupFrame({
  bottomPadding,
  canvasHeight,
  children,
  styles,
  topPadding
}: {
  readonly bottomPadding: number;
  readonly canvasHeight?: number;
  readonly children: ReactNode;
  readonly styles: ReturnType<typeof createStyles>;
  readonly topPadding: number;
}) {
  return (
    <View style={styles.root}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding, paddingTop: topPadding }]}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={[styles.canvas, canvasHeight === undefined ? null : { height: canvasHeight }]}>{children}</View>
      </ScrollView>
    </View>
  );
}

function PageHeading({
  styles,
  subtitle,
  title,
  top
}: {
  readonly styles: ReturnType<typeof createStyles>;
  readonly subtitle: string;
  readonly title: string;
  readonly top: number;
}) {
  return (
    <View style={[styles.pageHeading, { top }]}>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.pageSubtitle}>{subtitle}</Text>
    </View>
  );
}

function BackHeading({
  onBackPress,
  styles,
  subtitle,
  title,
  top
}: {
  readonly onBackPress: () => void;
  readonly styles: ReturnType<typeof createStyles>;
  readonly subtitle: string;
  readonly title: string;
  readonly top: number;
}) {
  return (
    <View style={[styles.backHeading, { top }]}>
      <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={onBackPress} style={[styles.backButton, webNoFocusOutline]}>
        <BackIcon size={styles.iconSizeMedium.width} />
      </Pressable>
      <Text style={styles.backHeadingTitle}>{title}</Text>
      <Text style={styles.backHeadingSubtitle}>{subtitle}</Text>
    </View>
  );
}

function HeroCard({
  badges,
  imageSource,
  styles,
  subtitle,
  title,
  top
}: {
  readonly badges: readonly { readonly iconKey: WalletSetupIconKey; readonly label: string }[];
  readonly imageSource: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly subtitle: string;
  readonly title: string;
  readonly top: number;
}) {
  return (
    <View style={[styles.heroCard, { top }]}>
      <Image resizeMode="cover" source={imageSource} style={styles.heroCardImage} />
      <LinearGradient colors={['#050507F8', '#050507CC', '#05050700']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
      <View style={styles.heroBadgeRow}>
        {badges.map((badge) => (
          <View key={badge.label} style={styles.heroBadge}>
            <WalletSetupIcon iconKey={badge.iconKey} size={styles.iconSizeTiny.width} />
            <Text numberOfLines={1} style={styles.heroBadgeText}>{badge.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function WalletInfoCard({
  isLossAccepted,
  onLossAcceptedChange,
  onWalletNameChange,
  onWalletNameClear,
  onWordCountChange,
  scale,
  styles,
  walletName,
  wordCount
}: {
  readonly isLossAccepted: boolean;
  readonly onLossAcceptedChange: (value: boolean) => void;
  readonly onWalletNameChange: (value: string) => void;
  readonly onWalletNameClear: () => void;
  readonly onWordCountChange: (value: MnemonicWordCount) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly walletName: string;
  readonly wordCount: MnemonicWordCount;
}) {
  return (
    <View style={styles.walletInfoCard}>
      <Text style={styles.cardTitle}>钱包信息</Text>
      <WalletNameLine
        onChangeText={onWalletNameChange}
        onClearPress={onWalletNameClear}
        scale={scale}
        styles={styles}
        top={88}
        value={walletName}
      />
      <View style={styles.wordCountLine}>
        <Text style={styles.infoLineLabel}>助记词长度</Text>
        <View style={styles.wordCountSegment}>
          {WORD_COUNT_OPTIONS.map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: wordCount === option }}
              key={option}
              onPress={() => onWordCountChange(option)}
              style={[wordCount === option ? styles.wordCountOptionActive : styles.wordCountOption, webNoFocusOutline]}
            >
              <Text style={wordCount === option ? styles.wordCountTextActive : styles.wordCountText}>{option} 词</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={() => onLossAcceptedChange(!isLossAccepted)} style={[styles.backupStatusLine, webNoFocusOutline]}>
        <Text style={styles.infoLineLabel}>备份状态</Text>
        <Text style={styles.backupStatusText}>待确认</Text>
        <ChevronRightIcon size={scaled(32, scale)} />
      </Pressable>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: isLossAccepted }} onPress={() => onLossAcceptedChange(!isLossAccepted)} style={[styles.lossCheckRow, webNoFocusOutline]}>
        <View style={isLossAccepted ? styles.checkboxActive : styles.checkbox}>
          {isLossAccepted ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
        <Text style={styles.lossCheckText}>我知道丢失助记词将无法找回</Text>
      </Pressable>
    </View>
  );
}

function ImportMnemonicCard({
  message,
  mnemonicText,
  onMnemonicTextChange,
  styles,
  wordCount
}: {
  readonly message: string;
  readonly mnemonicText: string;
  readonly onMnemonicTextChange: (value: string) => void;
  readonly styles: ReturnType<typeof createStyles>;
  readonly wordCount: number;
}) {
  const wordCountText = wordCount === 0 ? '等待输入' : `${wordCount} 词`;
  const isSupportedWordCount = wordCount === 12 || wordCount === 18 || wordCount === 24;

  return (
    <View style={styles.importMnemonicCard}>
      <Text style={styles.cardTitle}>输入助记词</Text>
      <View style={isSupportedWordCount ? styles.importWordCountBadgeActive : styles.importWordCountBadge}>
        <Text style={isSupportedWordCount ? styles.importWordCountTextActive : styles.importWordCountText}>{wordCountText}</Text>
      </View>
      <TextInput
        accessibilityLabel="输入已有钱包助记词"
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        onChangeText={onMnemonicTextChange}
        placeholder="按顺序粘贴 12、18 或 24 个英文单词，空格或换行分隔"
        placeholderTextColor="#9AA1B2"
        style={styles.importMnemonicInput}
        textAlignVertical="top"
        value={mnemonicText}
      />
      <Text style={message ? styles.importMessageError : styles.importMessageHint}>
        {message || '不会生成新助记词；导入只恢复你已有备份对应的钱包地址'}
      </Text>
    </View>
  );
}

function ImportConfirmCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  const rows: readonly { readonly iconKey: WalletSetupIconKey; readonly title: string; readonly subtitle: string }[] = [
    { iconKey: 'privateLock', title: '不会生成新助记词', subtitle: '只使用你输入的已有备份恢复账户' },
    { iconKey: 'noScreenshot', title: '助记词不上传', subtitle: '仅在本机校验，恢复地址后清空输入' },
    { iconKey: 'shield', title: '导入后视为已备份', subtitle: '仍需妥善保管原助记词' }
  ];

  return (
    <View style={styles.importConfirmCard}>
      <Text style={styles.cardTitle}>导入前确认</Text>
      {rows.map((row, index) => (
        <ConfirmRequirementRow index={index} key={row.title} row={row} scale={scale} styles={styles} />
      ))}
    </View>
  );
}

function CreateConfirmCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  const rows: readonly { readonly iconKey: WalletSetupIconKey; readonly title: string; readonly subtitle: string }[] = [
    { iconKey: 'offline', title: '断网也可查看助记词', subtitle: '助记词仅在本机生成，离线保存更安全' },
    { iconKey: 'noScreenshot', title: '禁止截图和云端同步', subtitle: '截图或云端同步可能导致资产被盗' },
    { iconKey: 'shield', title: '完成备份后才能转账', subtitle: '请先抄写并验证助记词，再使用钱包' }
  ];

  return (
    <View style={styles.createConfirmCard}>
      <Text style={styles.cardTitle}>创建前确认</Text>
      {rows.map((row, index) => (
        <ConfirmRequirementRow index={index} key={row.title} row={row} scale={scale} styles={styles} />
      ))}
    </View>
  );
}

function ConfirmRequirementRow({
  index,
  row,
  scale,
  styles
}: {
  readonly index: number;
  readonly row: { readonly iconKey: WalletSetupIconKey; readonly subtitle: string; readonly title: string };
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.confirmRequirementRow, { top: scaled(83 + index * 103, scale) }]}>
      <View style={styles.confirmIconSlot}>
        <WalletSetupIcon iconKey={row.iconKey} size={scaled(48, scale)} />
      </View>
      <Text style={styles.confirmRowTitle}>{row.title}</Text>
      <Text style={styles.confirmRowSubtitle}>{row.subtitle}</Text>
      <View style={styles.confirmChevron}>
        <ChevronRightIcon size={scaled(32, scale)} />
      </View>
      {index < 2 ? <View style={styles.confirmDivider} /> : null}
    </View>
  );
}

function MnemonicWordsCard({
  isMnemonicHidden,
  layout,
  mnemonicWords,
  onCopyPress,
  onToggleHidden,
  scale,
  styles
}: {
  readonly isMnemonicHidden: boolean;
  readonly layout: ReturnType<typeof getMnemonicBackupLayout>;
  readonly mnemonicWords: readonly string[];
  readonly onCopyPress: () => void;
  readonly onToggleHidden: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.mnemonicCard, { height: scaled(layout.cardHeightDesign, scale) }]}>
      <Text style={styles.cardTitle}>助记词 / {mnemonicWords.length} 词</Text>
      <View style={styles.mnemonicGrid}>
        {mnemonicWords.map((word, index) => (
          <View key={`${word}-${index}`} style={styles.mnemonicWordCell}>
            <Text style={styles.mnemonicWordIndex}>{String(index + 1).padStart(2, '0')}</Text>
            <Text numberOfLines={1} style={styles.mnemonicWordText}>{isMnemonicHidden ? '••••••' : word}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.mnemonicActionBar, { top: scaled(layout.actionBarTopDesign, scale) }]}>
        <Pressable accessibilityRole="button" onPress={onToggleHidden} style={[styles.mnemonicActionButton, webNoFocusOutline]}>
          <WalletSetupIcon iconKey="eye" size={scaled(42, scale)} />
          <Text style={styles.mnemonicActionText}>{isMnemonicHidden ? '点击显示助记词' : '点击隐藏助记词'}</Text>
        </Pressable>
        <View style={styles.mnemonicActionDivider} />
        <Pressable accessibilityRole="button" onPress={onCopyPress} style={[styles.mnemonicActionButton, webNoFocusOutline]}>
          <WalletSetupIcon iconKey="copy" size={scaled(42, scale)} />
          <Text style={styles.mnemonicActionText}>复制仅用于离线备份</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SecurityBoundaryCard({
  scale,
  styles,
  top
}: {
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly top: number;
}) {
  const warnings = ['不要截图或发送给他人', '不要保存到云盘或聊天记录', '验证完成后才能解锁转账'];

  return (
    <View style={[styles.securityBoundaryCard, { top }]}>
      <Text style={styles.cardTitle}>安全边界</Text>
      {warnings.map((warning, index) => (
        <View key={warning} style={[styles.warningRow, { top: scaled(92 + index * 60, scale) }]}>
          <WalletSetupIcon iconKey="warning" size={scaled(36, scale)} />
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      ))}
    </View>
  );
}

function BackupVerifyCard({
  backupProgress,
  message,
  onVerifyWordPress,
  scale,
  styles,
  top
}: {
  readonly backupProgress: WalletBackupProgress;
  readonly message: string;
  readonly onVerifyWordPress: (wordNumber: MnemonicVerifyWordNumber) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly top: number;
}) {
  return (
    <View style={[styles.backupVerifyCard, { top }]}>
      <Text style={styles.verifyTitle}>备份校验</Text>
      <Text style={backupProgress.thirdWordVerified && backupProgress.ninthWordVerified ? styles.verifyDone : styles.verifyPending}>
        {backupProgress.thirdWordVerified && backupProgress.ninthWordVerified ? '已完成' : '待完成'}
      </Text>
      {message ? <Text style={styles.verifyMessage}>{message}</Text> : null}
      <VerifyChip
        isActive={backupProgress.thirdWordVerified}
        label="第 3 词"
        left={scaled(529, scale)}
        onPress={() => onVerifyWordPress(3)}
        styles={styles}
      />
      <VerifyChip
        isActive={backupProgress.ninthWordVerified}
        label="第 9 词"
        left={scaled(665, scale)}
        onPress={() => onVerifyWordPress(9)}
        styles={styles}
      />
    </View>
  );
}

function VerifyChip({
  isActive,
  label,
  left,
  onPress,
  styles
}: {
  readonly isActive: boolean;
  readonly label: string;
  readonly left: number;
  readonly onPress: () => void;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: isActive }} onPress={onPress} style={[isActive ? styles.verifyChipActive : styles.verifyChip, { left }, webNoFocusOutline]}>
      <Text style={isActive ? styles.verifyChipTextActive : styles.verifyChipText}>{label}</Text>
    </Pressable>
  );
}

function MnemonicVerifyDialog({
  answer,
  message,
  onAnswerChange,
  onClose,
  onSubmit,
  styles,
  visible,
  wordNumber
}: {
  readonly answer: string;
  readonly message: string;
  readonly onAnswerChange: (answer: string) => void;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly styles: ReturnType<typeof createStyles>;
  readonly visible: boolean;
  readonly wordNumber: MnemonicVerifyWordNumber;
}) {
  return (
    <FastDialogModal onRequestClose={onClose} visible={visible}>
      <View style={styles.verifyDialogOverlay}>
        <View style={styles.verifyDialogCard}>
          <Text style={styles.verifyDialogTitle}>校验第 {wordNumber} 个助记词</Text>
          <Text style={styles.verifyDialogSubtitle}>请输入你离线抄写的第 {wordNumber} 个单词</Text>
          <TextInput
            accessibilityLabel={`输入第 ${wordNumber} 个助记词`}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onAnswerChange}
            onSubmitEditing={onSubmit}
            placeholder={`第 ${wordNumber} 个助记词`}
            placeholderTextColor="#9AA1B2"
            returnKeyType="done"
            selectTextOnFocus
            style={styles.verifyDialogInput}
            value={answer}
          />
          <Text style={message ? styles.verifyDialogError : styles.verifyDialogHint}>
            {message || '校验通过后才可以解锁后续转账流程'}
          </Text>
          <View style={styles.verifyDialogActionRow}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.verifyDialogCancelButton, webNoFocusOutline]}>
              <Text style={styles.verifyDialogCancelText}>取消</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onSubmit} style={[styles.verifyDialogSubmitButton, webNoFocusOutline]}>
              <Text style={styles.verifyDialogSubmitText}>确认校验</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </FastDialogModal>
  );
}

function SwitchHeroCard({
  account,
  backupProgress,
  label,
  onCopyPress,
  onQrPress,
  scale,
  styles
}: {
  readonly account: WalletAccount;
  readonly backupProgress: WalletBackupProgress;
  readonly label: string;
  readonly onCopyPress: () => void;
  readonly onQrPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.switchHeroCard}>
      <Image resizeMode="cover" source={walletSetupImages.switchCardBackground} style={styles.heroCardImage} />
      <LinearGradient colors={['#050507FA', '#050507CC', '#05050700']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <Text style={styles.switchHeroLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.switchHeroAddress}>{formatShortAddress(account.address, 7, 7)}</Text>
      <Pressable accessibilityLabel="复制当前钱包地址" accessibilityRole="button" onPress={onCopyPress} style={[styles.switchCopyButton, webNoFocusOutline]}>
        <CardCopyIcon size={scaled(64, scale)} />
      </Pressable>
      <Pressable accessibilityLabel="显示当前钱包二维码" accessibilityRole="button" onPress={onQrPress} style={[styles.switchQrButton, webNoFocusOutline]}>
        <CardQrIcon size={scaled(64, scale)} />
      </Pressable>
      <View style={styles.switchStatusRow}>
        <StatusBadge iconKey="lock" label="已解锁" tone="green" styles={styles} />
        <StatusBadge label="公网 RPC" tone="blue" styles={styles} />
        <StatusBadge iconKey="shield" label={backupProgress.completed ? '助记词已备份' : '助记词待备份'} tone="purple" styles={styles} />
      </View>
    </View>
  );
}

function LocalWalletCard({
  currentAddress,
  onSelectAddress,
  scale,
  selectedAddress,
  styles,
  walletAccounts
}: {
  readonly currentAddress: string;
  readonly onSelectAddress: (address: string) => void;
  readonly scale: number;
  readonly selectedAddress: string;
  readonly styles: ReturnType<typeof createStyles>;
  readonly walletAccounts: readonly WalletAccount[];
}) {
  return (
    <View style={styles.localWalletCard}>
      <Text style={styles.cardTitle}>本地钱包</Text>
      <View style={styles.walletListBox}>
        {walletAccounts.map((account, index) => (
          <WalletAccountRow
            account={account}
            currentAddress={currentAddress}
            index={index}
            key={account.address}
            onSelectAddress={onSelectAddress}
            scale={scale}
            selectedAddress={selectedAddress}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
}

function WalletAccountRow({
  account,
  currentAddress,
  index,
  onSelectAddress,
  scale,
  selectedAddress,
  styles
}: {
  readonly account: WalletAccount;
  readonly currentAddress: string;
  readonly index: number;
  readonly onSelectAddress: (address: string) => void;
  readonly scale: number;
  readonly selectedAddress: string;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const isCurrent = account.address === currentAddress;
  const isSelected = account.address === selectedAddress;
  const statusLabel = isCurrent ? '当前账户' : account.status === '当前账户' ? '已备份' : account.status;

  return (
    <Pressable accessibilityRole="button" onPress={() => onSelectAddress(account.address)} style={[styles.walletAccountRow, { top: scaled(index * 129, scale) }, webNoFocusOutline]}>
      <WalletAvatar account={account} scale={scale} styles={styles} />
      <Text style={styles.walletAccountName}>{account.label}</Text>
      <Text style={styles.walletAccountAddress}>{formatShortAddress(account.address, 7, 5)}</Text>
      <View style={isCurrent ? styles.currentAccountPill : styles.accountStatusPill}>
        <Text style={isCurrent ? styles.currentAccountPillText : styles.accountStatusPillText}>{statusLabel}</Text>
      </View>
      {isSelected ? (
        <View style={styles.walletSelectedIcon}>
          <SelectedCheckIcon size={scaled(40, scale)} />
        </View>
      ) : (
        <View style={styles.walletSwitchButton}>
          <Text style={styles.walletSwitchButtonText}>切换</Text>
        </View>
      )}
      {index < 2 ? <View style={styles.walletRowDivider} /> : null}
    </Pressable>
  );
}

function WalletAvatar({
  account,
  scale,
  styles
}: {
  readonly account: WalletAccount;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  if (account.tone === 'main') {
    return (
      <View style={styles.walletAvatar}>
        <SolAvatarIcon size={scaled(70, scale)} />
      </View>
    );
  }

  return (
    <LinearGradient colors={account.tone === 'trade' ? ['#0C7CFF', '#236EFF'] : ['#7B45FF', '#A155FF']} style={styles.walletAvatar}>
      <WalletSetupIcon iconKey={account.tone === 'trade' ? 'document' : 'copy'} size={scaled(42, scale)} />
    </LinearGradient>
  );
}

function SwitchConfirmCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  const rows: readonly { readonly iconKey: WalletSetupIconKey; readonly title: string }[] = [
    { iconKey: 'shield', title: '切换不会导出私钥' },
    { iconKey: 'lock', title: '锁定钱包需重新验证' },
    { iconKey: 'globe', title: 'RPC 节点跟随当前钱包' }
  ];

  return (
    <View style={styles.switchConfirmCard}>
      <Text style={styles.cardTitle}>切换前确认</Text>
      {rows.map((row, index) => (
        <View key={row.title} style={[styles.switchConfirmRow, { top: scaled(74 + index * 64, scale) }]}>
          <WalletSetupIcon iconKey={row.iconKey} size={scaled(42, scale)} />
          <Text style={styles.switchConfirmText}>{row.title}</Text>
          <View style={styles.switchConfirmChevron}>
            <ChevronRightIcon size={scaled(32, scale)} />
          </View>
          {index < 2 ? <View style={styles.switchConfirmDivider} /> : null}
        </View>
      ))}
    </View>
  );
}

function SwitchActionCard({
  message,
  onCreateWalletPress,
  onImportWalletPress,
  onRemoveWallet,
  scale,
  styles
}: {
  readonly message: string;
  readonly onCreateWalletPress: () => void;
  readonly onImportWalletPress: () => void;
  readonly onRemoveWallet: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.switchActionCard}>
      <Pressable accessibilityRole="button" onPress={onCreateWalletPress} style={[styles.createWalletSmallButton, webNoFocusOutline]}>
        <AddCircleIcon size={scaled(40, scale)} />
        <Text style={styles.smallActionText}>创建新钱包</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onImportWalletPress} style={[styles.importWalletSmallButton, webNoFocusOutline]}>
        <WalletSetupIcon iconKey="import" size={scaled(40, scale)} />
        <Text style={styles.smallActionText}>导入助记词</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onRemoveWallet} style={[styles.removeWalletButton, webNoFocusOutline]}>
        <WalletSetupIcon iconKey="trash" size={scaled(42, scale)} />
        <Text style={styles.removeWalletText}>移除本地账户</Text>
      </Pressable>
      {message ? <Text style={styles.switchActionMessage}>{message}</Text> : null}
    </View>
  );
}

function StatusBadge({
  iconKey,
  label,
  styles,
  tone
}: {
  readonly iconKey?: WalletSetupIconKey;
  readonly label: string;
  readonly styles: ReturnType<typeof createStyles>;
  readonly tone: 'blue' | 'green' | 'purple';
}) {
  return (
    <View style={tone === 'green' ? styles.statusBadgeGreen : tone === 'purple' ? styles.statusBadgePurple : styles.statusBadgeBlue}>
      {iconKey ? <WalletSetupIcon iconKey={iconKey} size={styles.iconSizeMini.width} /> : <View style={styles.statusBlueDot} />}
      <Text style={tone === 'green' ? styles.statusBadgeGreenText : styles.statusBadgeText}>{label}</Text>
    </View>
  );
}

function WalletNameLine({
  onChangeText,
  onClearPress,
  scale,
  styles,
  top,
  value
}: {
  readonly onChangeText: (value: string) => void;
  readonly onClearPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly top: number;
  readonly value: string;
}) {
  return (
    <View style={[styles.infoLine, { top: scaled(top, scale) }]}>
      <Text style={styles.infoLineLabel}>钱包名称</Text>
      <TextInput
        accessibilityLabel="钱包名称"
        autoCorrect={false}
        maxLength={24}
        onChangeText={onChangeText}
        placeholder="请输入钱包名称"
        placeholderTextColor="#9AA1B2"
        returnKeyType="done"
        selectTextOnFocus
        style={styles.walletNameInput}
        value={value}
      />
      <Pressable accessibilityLabel="清空钱包名称" accessibilityRole="button" onPress={onClearPress} style={[styles.clearNameButton, webNoFocusOutline]}>
        <Text style={styles.clearNameText}>×</Text>
      </Pressable>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  styles,
  top
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly styles: ReturnType<typeof createStyles>;
  readonly top: number;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.primaryButton, { top }, webNoFocusOutline]}>
      <LinearGradient colors={['#050507', '#050507']} style={styles.buttonFill}>
        <Text style={styles.primaryButtonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  styles,
  top
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly styles: ReturnType<typeof createStyles>;
  readonly top: number;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.secondaryButton, { top }, webNoFocusOutline]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function getResolvedPadding(
  layoutMetrics: ReturnType<typeof useWalletSetupResponsiveLayout>,
  topPadding: number | undefined,
  bottomPadding: number | undefined
) {
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);

  return {
    bottom: bottomPadding ?? layoutMetrics.bottomNavHeight,
    top: topPadding ?? layoutMetrics.topSafeArea + headerHeight
  };
}

function createStyles(scale: number) {
  // 功能目的：按 56-58 钱包设计稿坐标还原页面；实现原因：避免整页切图导致真实交互和状态不可维护。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    accountStatusPill: {
      alignItems: 'center',
      backgroundColor: '#F1F2F6',
      borderRadius: scaled(9, scale),
      height: scaled(27, scale),
      justifyContent: 'center',
      left: scaled(116, scale),
      position: 'absolute',
      top: scaled(82, scale),
      width: scaled(76, scale)
    },
    accountStatusPillText: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '600',
      lineHeight: scaled(24, scale),
      ...textBase
    },
    backButton: {
      alignItems: 'center',
      height: scaled(56, scale),
      justifyContent: 'center',
      left: scaled(16, scale),
      position: 'absolute',
      top: scaled(4, scale),
      width: scaled(56, scale)
    },
    backHeading: {
      height: scaled(80, scale),
      left: 0,
      position: 'absolute',
      width: '100%'
    },
    backHeadingSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(23, scale),
      fontWeight: '400',
      left: scaled(88, scale),
      lineHeight: scaled(30, scale),
      position: 'absolute',
      top: scaled(57, scale),
      ...textBase
    },
    backHeadingTitle: {
      color: colors.text,
      fontSize: scaled(40, scale),
      fontWeight: fontWeights.pageTitle,
      left: scaled(88, scale),
      lineHeight: scaled(50, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    backupStatusLine: {
      alignItems: 'center',
      borderTopColor: '#E6E8EF',
      borderTopWidth: 1,
      flexDirection: 'row',
      height: scaled(82, scale),
      left: scaled(28, scale),
      position: 'absolute',
      top: scaled(239, scale),
      width: scaled(738, scale)
    },
    backupStatusText: {
      color: '#FF7A1A',
      fontSize: scaled(26, scale),
      fontWeight: '600',
      lineHeight: scaled(34, scale),
      marginLeft: 'auto',
      marginRight: scaled(15, scale),
      ...textBase
    },
    backupVerifyCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      height: scaled(96, scale),
      left: scaled(29, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1386, scale),
      width: scaled(795, scale)
    },
    buttonFill: {
      alignItems: 'center',
      borderRadius: scaled(18, scale),
      flex: 1,
      justifyContent: 'center'
    },
    canvas: {
      backgroundColor: colors.background,
      height: scaled(1618, scale),
      position: 'relative',
      width: '100%'
    },
    cardTitle: {
      color: colors.text,
      fontSize: scaled(30, scale),
      fontWeight: '800',
      left: scaled(28, scale),
      lineHeight: scaled(38, scale),
      position: 'absolute',
      top: scaled(27, scale),
      ...textBase
    },
    checkbox: {
      borderColor: colors.borderStrong,
      borderRadius: scaled(5, scale),
      borderWidth: 1,
      height: scaled(28, scale),
      width: scaled(28, scale)
    },
    checkboxActive: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: scaled(5, scale),
      height: scaled(28, scale),
      justifyContent: 'center',
      width: scaled(28, scale)
    },
    checkboxMark: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      fontWeight: '900',
      lineHeight: scaled(25, scale),
      ...textBase
    },
    clearNameButton: {
      alignItems: 'center',
      backgroundColor: '#8E93A3',
      borderRadius: scaled(13, scale),
      height: scaled(26, scale),
      justifyContent: 'center',
      marginLeft: scaled(13, scale),
      width: scaled(26, scale)
    },
    clearNameText: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(24, scale),
      ...textBase
    },
    confirmChevron: {
      alignItems: 'center',
      height: scaled(40, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(7, scale),
      top: scaled(29, scale),
      width: scaled(40, scale)
    },
    confirmDivider: {
      backgroundColor: '#E6E8EF',
      bottom: 0,
      height: 1,
      left: scaled(102, scale),
      position: 'absolute',
      right: 0
    },
    confirmIconSlot: {
      alignItems: 'center',
      backgroundColor: '#F3F1FA',
      borderRadius: scaled(14, scale),
      height: scaled(72, scale),
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      top: scaled(14, scale),
      width: scaled(72, scale)
    },
    confirmRequirementRow: {
      height: scaled(103, scale),
      left: scaled(28, scale),
      position: 'absolute',
      width: scaled(738, scale)
    },
    confirmRowSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      fontWeight: '400',
      left: scaled(102, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(54, scale),
      ...textBase
    },
    confirmRowTitle: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(102, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(20, scale),
      ...textBase
    },
    createConfirmCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(387, scale),
      left: scaled(29, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(1082, scale),
      width: scaled(795, scale)
    },
    createMessage: {
      color: '#FF3B30',
      fontSize: scaled(20, scale),
      fontWeight: '600',
      left: scaled(33, scale),
      lineHeight: scaled(27, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1472, scale),
      ...textBase
    },
    createWalletSmallButton: {
      alignItems: 'center',
      borderColor: colors.borderStrong,
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(62, scale),
      justifyContent: 'center',
      left: scaled(28, scale),
      position: 'absolute',
      top: scaled(18, scale),
      width: scaled(361, scale)
    },
    currentAccountPill: {
      alignItems: 'center',
      backgroundColor: '#EAF1FF',
      borderRadius: scaled(9, scale),
      height: scaled(27, scale),
      justifyContent: 'center',
      left: scaled(116, scale),
      position: 'absolute',
      top: scaled(82, scale),
      width: scaled(85, scale)
    },
    currentAccountPillText: {
      color: colors.primary,
      fontSize: scaled(18, scale),
      fontWeight: '700',
      lineHeight: scaled(24, scale),
      ...textBase
    },
    heroBadge: {
      alignItems: 'center',
      backgroundColor: '#050507A8',
      borderColor: '#FFFFFF44',
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(52, scale),
      marginRight: scaled(12, scale),
      paddingHorizontal: scaled(12, scale)
    },
    heroBadgeRow: {
      flexDirection: 'row',
      height: scaled(54, scale),
      left: scaled(38, scale),
      position: 'absolute',
      top: scaled(220, scale)
    },
    heroBadgeText: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      fontWeight: '500',
      lineHeight: scaled(29, scale),
      marginLeft: scaled(7, scale),
      maxWidth: scaled(158, scale),
      ...textBase
    },
    heroCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(345, scale),
      left: scaled(29, scale),
      overflow: 'hidden',
      position: 'absolute',
      width: scaled(795, scale)
    },
    heroCardImage: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    heroShade: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    heroSubtitle: {
      color: '#C6CAD4',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(42, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(139, scale),
      ...textBase
    },
    heroTitle: {
      color: '#FFFFFF',
      fontSize: scaled(38, scale),
      fontWeight: '800',
      left: scaled(42, scale),
      lineHeight: scaled(50, scale),
      position: 'absolute',
      top: scaled(74, scale),
      ...textBase
    },
    iconSizeMedium: {
      height: scaled(42, scale),
      width: scaled(42, scale)
    },
    iconSizeMini: {
      height: scaled(28, scale),
      width: scaled(28, scale)
    },
    iconSizeTiny: {
      height: scaled(28, scale),
      width: scaled(28, scale)
    },
    importWalletSmallButton: {
      alignItems: 'center',
      borderColor: colors.borderStrong,
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(62, scale),
      justifyContent: 'center',
      left: scaled(407, scale),
      position: 'absolute',
      top: scaled(18, scale),
      width: scaled(360, scale)
    },
    importConfirmCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(405, scale),
      left: scaled(29, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(1014, scale),
      width: scaled(795, scale)
    },
    importMessageError: {
      color: '#FF3B30',
      fontSize: scaled(20, scale),
      fontWeight: '700',
      left: scaled(28, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(354, scale),
      width: scaled(738, scale),
      ...textBase
    },
    importMessageHint: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      fontWeight: '600',
      left: scaled(28, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(354, scale),
      width: scaled(738, scale),
      ...textBase
    },
    importMnemonicCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(423, scale),
      left: scaled(29, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(570, scale),
      width: scaled(795, scale)
    },
    importMnemonicInput: {
      backgroundColor: '#FBFBFD',
      borderColor: colors.borderStrong,
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      color: colors.text,
      fontFamily: fontFamilies.system,
      fontSize: scaled(24, scale),
      fontWeight: '600',
      height: scaled(238, scale),
      left: scaled(28, scale),
      lineHeight: scaled(34, scale),
      paddingHorizontal: scaled(20, scale),
      paddingTop: scaled(18, scale),
      position: 'absolute',
      top: scaled(86, scale),
      width: scaled(738, scale)
    },
    importWordCountBadge: {
      alignItems: 'center',
      backgroundColor: '#F3F5FA',
      borderRadius: scaled(13, scale),
      height: scaled(44, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(28, scale),
      top: scaled(24, scale),
      width: scaled(134, scale)
    },
    importWordCountBadgeActive: {
      alignItems: 'center',
      backgroundColor: '#EAF1FF',
      borderColor: colors.primary,
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      height: scaled(44, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(28, scale),
      top: scaled(24, scale),
      width: scaled(134, scale)
    },
    importWordCountText: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      fontWeight: '700',
      lineHeight: scaled(28, scale),
      ...textBase
    },
    importWordCountTextActive: {
      color: colors.primary,
      fontSize: scaled(20, scale),
      fontWeight: '800',
      lineHeight: scaled(28, scale),
      ...textBase
    },
    infoLine: {
      alignItems: 'center',
      borderBottomColor: '#E6E8EF',
      borderBottomWidth: 1,
      flexDirection: 'row',
      height: scaled(66, scale),
      left: scaled(28, scale),
      position: 'absolute',
      width: scaled(738, scale)
    },
    infoLineLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(33, scale),
      ...textBase
    },
    walletNameInput: {
      color: colors.text,
      flex: 1,
      fontFamily: fontFamilies.system,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      height: scaled(52, scale),
      lineHeight: scaled(33, scale),
      marginLeft: scaled(24, scale),
      minWidth: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'right'
    },
    infoLineValue: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(33, scale),
      marginLeft: 'auto',
      ...textBase
    },
    localWalletCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(476, scale),
      left: scaled(31, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(570, scale),
      width: scaled(791, scale)
    },
    lossCheckRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(52, scale),
      left: scaled(28, scale),
      position: 'absolute',
      top: scaled(334, scale),
      width: scaled(738, scale)
    },
    lossCheckText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      marginLeft: scaled(15, scale),
      ...textBase
    },
    mnemonicActionBar: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(66, scale),
      left: scaled(36, scale),
      position: 'absolute',
      top: scaled(MNEMONIC_ACTION_BAR_BASE_TOP, scale),
      width: scaled(723, scale)
    },
    mnemonicActionButton: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center'
    },
    mnemonicActionDivider: {
      backgroundColor: colors.borderStrong,
      height: scaled(34, scale),
      width: 1
    },
    mnemonicActionText: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      marginLeft: scaled(12, scale),
      ...textBase
    },
    mnemonicCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      height: scaled(MNEMONIC_CARD_BASE_HEIGHT, scale),
      left: scaled(29, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(627, scale),
      width: scaled(795, scale)
    },
    mnemonicGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaled(16, scale),
      left: scaled(29, scale),
      position: 'absolute',
      top: scaled(83, scale),
      width: scaled(738, scale)
    },
    mnemonicWordCell: {
      alignItems: 'center',
      backgroundColor: '#FBFBFD',
      borderColor: colors.borderStrong,
      borderRadius: scaled(12, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(56, scale),
      paddingHorizontal: scaled(25, scale),
      width: scaled(232, scale)
    },
    mnemonicWordIndex: {
      color: colors.primary,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(32, scale),
      marginRight: scaled(28, scale),
      ...textBase
    },
    mnemonicWordText: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    pageHeading: {
      height: scaled(88, scale),
      left: 0,
      position: 'absolute',
      width: '100%'
    },
    pageSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(37, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(58, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(42, scale),
      fontWeight: fontWeights.pageTitle,
      left: scaled(37, scale),
      lineHeight: scaled(52, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    primaryButton: {
      borderColor: '#1E6BFF',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      height: scaled(80, scale),
      left: scaled(30, scale),
      overflow: 'hidden',
      position: 'absolute',
      width: scaled(793, scale)
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(27, scale),
      fontWeight: '800',
      lineHeight: scaled(35, scale),
      ...textBase
    },
    removeWalletButton: {
      alignItems: 'center',
      borderColor: '#FF2D20',
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(62, scale),
      justifyContent: 'center',
      left: scaled(28, scale),
      position: 'absolute',
      top: scaled(98, scale),
      width: scaled(739, scale)
    },
    removeWalletText: {
      color: '#FF2D20',
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(33, scale),
      marginLeft: scaled(12, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: '#1D2435',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      height: scaled(80, scale),
      justifyContent: 'center',
      left: scaled(30, scale),
      position: 'absolute',
      width: scaled(793, scale)
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '800',
      lineHeight: scaled(35, scale),
      ...textBase
    },
    securityBoundaryCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      height: scaled(265, scale),
      left: scaled(29, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1101, scale),
      width: scaled(795, scale)
    },
    smallActionText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(32, scale),
      marginLeft: scaled(12, scale),
      ...textBase
    },
    statusBadgeBlue: {
      alignItems: 'center',
      backgroundColor: '#050507CC',
      borderColor: '#FFFFFF44',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(45, scale),
      marginRight: scaled(12, scale),
      paddingHorizontal: scaled(14, scale)
    },
    statusBadgeGreen: {
      alignItems: 'center',
      backgroundColor: '#0E3B26CC',
      borderColor: '#1CBF72',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(45, scale),
      marginRight: scaled(12, scale),
      paddingHorizontal: scaled(14, scale)
    },
    statusBadgeGreenText: {
      color: '#38E38E',
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(29, scale),
      marginLeft: scaled(7, scale),
      ...textBase
    },
    statusBadgePurple: {
      alignItems: 'center',
      backgroundColor: '#050507CC',
      borderColor: '#FFFFFF44',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(45, scale),
      marginRight: scaled(12, scale),
      paddingHorizontal: scaled(14, scale)
    },
    statusBadgeText: {
      color: '#FFFFFF',
      fontSize: scaled(21, scale),
      fontWeight: '600',
      lineHeight: scaled(29, scale),
      marginLeft: scaled(7, scale),
      ...textBase
    },
    statusBlueDot: {
      backgroundColor: colors.primary,
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      width: scaled(14, scale)
    },
    switchActionCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      height: scaled(193, scale),
      left: scaled(31, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1341, scale),
      width: scaled(791, scale)
    },
    switchActionMessage: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '600',
      left: scaled(28, scale),
      lineHeight: scaled(24, scale),
      position: 'absolute',
      top: scaled(164, scale),
      ...textBase
    },
    switchBackButton: {
      alignItems: 'center',
      height: scaled(54, scale),
      justifyContent: 'center',
      left: scaled(20, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(82, scale),
      width: scaled(54, scale)
    },
    switchConfirmCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      height: scaled(257, scale),
      left: scaled(31, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1064, scale),
      width: scaled(791, scale)
    },
    switchConfirmChevron: {
      alignItems: 'center',
      height: scaled(40, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: 0,
      top: scaled(8, scale),
      width: scaled(40, scale)
    },
    switchConfirmDivider: {
      backgroundColor: '#E6E8EF',
      bottom: 0,
      height: 1,
      left: scaled(60, scale),
      position: 'absolute',
      right: 0
    },
    switchConfirmRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(64, scale),
      left: scaled(28, scale),
      position: 'absolute',
      width: scaled(735, scale)
    },
    switchConfirmText: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(33, scale),
      marginLeft: scaled(18, scale),
      ...textBase
    },
    switchCopyButton: {
      height: scaled(64, scale),
      left: scaled(404, scale),
      position: 'absolute',
      top: scaled(94, scale),
      width: scaled(64, scale)
    },
    switchHeroAddress: {
      color: '#FFFFFF',
      fontSize: scaled(40, scale),
      fontWeight: '900',
      left: scaled(28, scale),
      lineHeight: scaled(52, scale),
      position: 'absolute',
      top: scaled(97, scale),
      width: scaled(360, scale),
      ...textBase
    },
    switchHeroCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(24, scale),
      height: scaled(270, scale),
      left: scaled(31, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaledBelowTopNavigation(281, scale),
      width: scaled(791, scale)
    },
    switchHeroLabel: {
      color: '#FFFFFF',
      fontSize: scaled(23, scale),
      fontWeight: '500',
      left: scaled(29, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(41, scale),
      ...textBase
    },
    switchQrButton: {
      height: scaled(64, scale),
      left: scaled(483, scale),
      position: 'absolute',
      top: scaled(94, scale),
      width: scaled(64, scale)
    },
    switchStatusRow: {
      flexDirection: 'row',
      height: scaled(45, scale),
      left: scaled(29, scale),
      position: 'absolute',
      top: scaled(179, scale)
    },
    verifyChip: {
      alignItems: 'center',
      borderColor: '#A9C8FF',
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      height: scaled(46, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(25, scale),
      width: scaled(122, scale)
    },
    verifyChipActive: {
      alignItems: 'center',
      backgroundColor: '#EAF1FF',
      borderColor: colors.primary,
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      height: scaled(46, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(25, scale),
      width: scaled(122, scale)
    },
    verifyChipText: {
      color: colors.primary,
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    verifyChipTextActive: {
      color: '#0F54D8',
      fontSize: scaled(22, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    verifyDone: {
      color: colors.success,
      fontSize: scaled(22, scale),
      fontWeight: '700',
      left: scaled(171, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      top: scaled(33, scale),
      ...textBase
    },
    verifyMessage: {
      color: '#FF3B30',
      fontSize: scaled(17, scale),
      fontWeight: '600',
      left: scaled(29, scale),
      lineHeight: scaled(23, scale),
      position: 'absolute',
      top: scaled(65, scale),
      ...textBase
    },
    verifyPending: {
      color: colors.primary,
      fontSize: scaled(22, scale),
      fontWeight: '700',
      left: scaled(171, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      top: scaled(33, scale),
      ...textBase
    },
    verifyTitle: {
      color: colors.text,
      fontSize: scaled(29, scale),
      fontWeight: '800',
      left: scaled(28, scale),
      lineHeight: scaled(37, scale),
      position: 'absolute',
      top: scaled(28, scale),
      ...textBase
    },
    verifyDialogActionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: scaled(28, scale),
      width: '100%'
    },
    verifyDialogCancelButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: '#1D2435',
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      height: scaled(68, scale),
      justifyContent: 'center',
      width: '47%'
    },
    verifyDialogCancelText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    verifyDialogCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      paddingBottom: scaled(32, scale),
      paddingHorizontal: scaled(31, scale),
      paddingTop: scaled(34, scale),
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      width: Math.max(320, Math.min(scaled(710, scale), 520))
    },
    verifyDialogError: {
      color: '#FF3B30',
      fontSize: scaled(20, scale),
      fontWeight: '700',
      lineHeight: scaled(28, scale),
      marginTop: scaled(14, scale),
      minHeight: scaled(28, scale),
      ...textBase
    },
    verifyDialogHint: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      fontWeight: '600',
      lineHeight: scaled(28, scale),
      marginTop: scaled(14, scale),
      minHeight: scaled(28, scale),
      ...textBase
    },
    verifyDialogInput: {
      backgroundColor: '#FBFBFD',
      borderColor: colors.borderStrong,
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      color: colors.text,
      fontFamily: fontFamilies.system,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      height: scaled(70, scale),
      marginTop: scaled(28, scale),
      paddingHorizontal: scaled(20, scale),
      width: '100%'
    },
    verifyDialogOverlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(9, 11, 18, 0.52)',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24
    },
    verifyDialogSubmitButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderColor: colors.primary,
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      height: scaled(68, scale),
      justifyContent: 'center',
      width: '47%'
    },
    verifyDialogSubmitText: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    verifyDialogSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(23, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      marginTop: scaled(14, scale),
      ...textBase
    },
    verifyDialogTitle: {
      color: colors.text,
      fontSize: scaled(34, scale),
      fontWeight: '900',
      lineHeight: scaled(43, scale),
      ...textBase
    },
    walletAccountAddress: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(116, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      top: scaled(52, scale),
      ...textBase
    },
    walletAccountName: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(116, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(18, scale),
      ...textBase
    },
    walletAccountRow: {
      height: scaled(129, scale),
      left: scaled(20, scale),
      position: 'absolute',
      width: scaled(715, scale)
    },
    walletAvatar: {
      alignItems: 'center',
      borderRadius: scaled(36, scale),
      height: scaled(72, scale),
      justifyContent: 'center',
      left: scaled(20, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaled(29, scale),
      width: scaled(72, scale)
    },
    walletInfoCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(24, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(405, scale),
      left: scaled(29, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(660, scale),
      width: scaled(795, scale)
    },
    walletListBox: {
      borderColor: colors.border,
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      height: scaled(387, scale),
      left: scaled(28, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaled(75, scale),
      width: scaled(735, scale)
    },
    walletRowDivider: {
      backgroundColor: '#E6E8EF',
      bottom: 0,
      height: 1,
      left: scaled(100, scale),
      position: 'absolute',
      right: 0
    },
    walletSelectedIcon: {
      alignItems: 'center',
      height: scaled(52, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(14, scale),
      top: scaled(39, scale),
      width: scaled(52, scale)
    },
    walletSwitchButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderRadius: scaled(10, scale),
      borderWidth: 1,
      height: scaled(46, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(26, scale),
      top: scaled(42, scale),
      width: scaled(148, scale)
    },
    walletSwitchButtonText: {
      color: colors.primary,
      fontSize: scaled(23, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    warningRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(44, scale),
      left: scaled(29, scale),
      position: 'absolute',
      width: scaled(720, scale)
    },
    warningText: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      marginLeft: scaled(22, scale),
      ...textBase
    },
    wordCountLine: {
      alignItems: 'center',
      borderBottomColor: '#E6E8EF',
      borderBottomWidth: 1,
      flexDirection: 'row',
      height: scaled(82, scale),
      left: scaled(28, scale),
      position: 'absolute',
      top: scaled(157, scale),
      width: scaled(738, scale)
    },
    wordCountOption: {
      alignItems: 'center',
      flex: 1,
      height: scaled(50, scale),
      justifyContent: 'center'
    },
    wordCountOptionActive: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(11, scale),
      flex: 1,
      height: scaled(50, scale),
      justifyContent: 'center'
    },
    wordCountSegment: {
      borderColor: colors.borderStrong,
      borderRadius: scaled(12, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(52, scale),
      marginLeft: 'auto',
      overflow: 'hidden',
      width: scaled(342, scale)
    },
    wordCountText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    wordCountTextActive: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    }
  });
}
