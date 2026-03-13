import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Image } from "react-native";
import { useLocale } from 'next-intl';

interface Props {
  onFinish: () => void;
}

export function RuokSplash({ onFinish }: Props): JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

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
    <View style={[styles.overlay, { direction }]}>
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
