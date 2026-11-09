import { ReactNode, useEffect, useState } from "react";
import { AccessibilityInfo, Animated, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../constants/theme";

// Follows the system "Reduce motion" setting, including changes while open.
const useReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
};

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Pulses its whole subtree as one, so every placeholder inside fades in step
// and only a single native-driven animation runs per list.
const Skeleton = ({ children, style }: Props) => {
  const reduceMotion = useReduceMotion();
  // Held in state rather than a ref so it can be read during render.
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      style={[style, { opacity }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
    >
      {children}
    </Animated.View>
  );
};

// A static grey shape; give it the size of the content it stands in for.
export const SkeletonBlock = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.block, style]} />
);

// Text-line placeholder: the height of a line of text, rounded like a pill.
export const SkeletonLine = ({ width, style }: { width: ViewStyle["width"]; style?: StyleProp<ViewStyle> }) => (
  <SkeletonBlock style={[styles.line, { width }, style]} />
);

export default Skeleton;

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surfaceMuted, borderRadius: 6 },
  line: { height: 12, borderRadius: 6 },
});
