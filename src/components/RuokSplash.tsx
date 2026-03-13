import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
// Removed useLocale as it's not directly used for layout in this component
// The root HTML element's dir attribute should handle global RTL.

interface Props {
  onFinish: () => void;
}

export function RuokSplash({ onFinish }: Props): JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, [opacity, onFinish]);

  return (
    <View style={styles.overlay}>
      <Animated.Image
        source={require("@/assets/ruok-splash.png")}
        style={[styles.image, { opacity }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

