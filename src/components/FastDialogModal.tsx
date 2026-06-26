import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
  FAST_DIALOG_ENTER_MS,
  FAST_DIALOG_EXIT_MS,
  normalizeDialogAnimationDuration
} from '../utils/dialogMotion';

type FastDialogModalProps = {
  readonly children: ReactNode;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly enterDurationMs?: number;
  readonly exitDurationMs?: number;
  readonly onRequestClose: () => void;
  readonly visible: boolean;
};

export function FastDialogModal({
  children,
  contentStyle,
  enterDurationMs = FAST_DIALOG_ENTER_MS,
  exitDurationMs = FAST_DIALOG_EXIT_MS,
  onRequestClose,
  visible
}: FastDialogModalProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const animationProgress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const safeEnterDurationMs = normalizeDialogAnimationDuration(enterDurationMs, FAST_DIALOG_ENTER_MS);
  const safeExitDurationMs = normalizeDialogAnimationDuration(exitDurationMs, FAST_DIALOG_EXIT_MS);
  const shouldRenderModal = visible || isMounted;

  // 功能目的：统一弹窗开关动画时长；实现原因：原生 Modal fade 无法设置时长，默认过慢影响流畅度。
  useEffect(() => {
    let isAnimationActive = true;
    animationProgress.stopAnimation();

    if (visible) {
      setIsMounted(true);
      Animated.timing(animationProgress, {
        duration: safeEnterDurationMs,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web'
      }).start();

      return () => {
        isAnimationActive = false;
        animationProgress.stopAnimation();
      };
    }

    Animated.timing(animationProgress, {
      duration: safeExitDurationMs,
      easing: Easing.out(Easing.quad),
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web'
    }).start(({ finished }) => {
      if (isAnimationActive && finished) {
        setIsMounted(false);
      }
    });

    return () => {
      isAnimationActive = false;
      animationProgress.stopAnimation();
    };
  }, [animationProgress, safeEnterDurationMs, safeExitDurationMs, visible]);

  if (!shouldRenderModal) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      hardwareAccelerated
      onRequestClose={onRequestClose}
      statusBarTranslucent
      transparent
      visible={shouldRenderModal}
    >
      <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.root, contentStyle, { opacity: animationProgress }]}>
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});
