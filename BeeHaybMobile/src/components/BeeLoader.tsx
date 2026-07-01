import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface BeeLoaderProps {
  label?: string;
}

const DOT_COUNT = 3;

const BeeLoader: React.FC<BeeLoaderProps> = ({ label = 'Syncing hive data' }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const dots = useRef(Array.from({ length: DOT_COUNT }, () => new Animated.Value(0.35))).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );

    const dotAnimations = dots.map((dot, index) => (
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 180),
          Animated.timing(dot, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: 380,
            useNativeDriver: true,
          }),
        ])
      )
    ));

    pulseLoop.start();
    dotAnimations.forEach((animation) => animation.start());

    return () => {
      pulseLoop.stop();
      dotAnimations.forEach((animation) => animation.stop());
    };
  }, [dots, pulse]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.12],
  });

  return (
    <View style={styles.container}>
      <View style={styles.coreWrap}>
        <Animated.View style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
        <View style={styles.core}>
          <Text style={styles.coreText}>BH</Text>
        </View>
      </View>

      <View style={styles.dotsRow}>
        {dots.map((dot, index) => (
          <Animated.View key={`dot-${index}`} style={[styles.dot, { opacity: dot, transform: [{ scale: dot }] }]} />
        ))}
      </View>

      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreWrap: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#D9A25F',
  },
  core: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF5E2',
    borderWidth: 1,
    borderColor: '#E3BF89',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreText: {
    color: '#B6792E',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D19A56',
    marginHorizontal: 4,
  },
  label: {
    marginTop: 12,
    fontSize: 13,
    color: '#736858',
    fontWeight: '700',
  },
});

export default BeeLoader;