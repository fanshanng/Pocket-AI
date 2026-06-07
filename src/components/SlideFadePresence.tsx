import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

type SlideFadePresenceProps = {
  children: ReactNode;
  distance?: number;
  from?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
  visible: boolean;
};

export function SlideFadePresence({
  children,
  distance = 14,
  from = 'bottom',
  style,
  visible,
}: SlideFadePresenceProps) {
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    let active = true;
    if (visible) {
      setMounted(true);
    }

    const start = () => {
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue: visible ? 1 : 0,
        duration: visible ? 180 : 130,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (active && finished && !visible) {
          setMounted(false);
        }
      });
    };

    if (visible) {
      requestAnimationFrame(start);
    } else {
      start();
    }

    return () => {
      active = false;
      progress.stopAnimation();
    };
  }, [progress, visible]);

  if (!mounted) {
    return null;
  }

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [from === 'top' ? -distance : distance, 0],
  });

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[style, { opacity: progress, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
}
