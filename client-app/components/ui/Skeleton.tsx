import React, { useEffect, useState } from "react";
import { Animated, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { radius } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = "100%", height = 14, style }: SkeletonProps) {
  const theme = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, backgroundColor: theme.colors.skeleton, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: radius.xs,
  },
});
