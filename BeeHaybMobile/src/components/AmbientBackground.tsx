import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ShapeConfig = {
  color: string;
  width: number;
  height: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  opacity: number;
  translateX: number;
  translateY: number;
  scaleFrom: number;
  scaleTo: number;
  rotateFrom: string;
  rotateTo: string;
  duration: number;
  delay: number;
};

const SHAPES: ShapeConfig[] = [
  {
    color: 'rgba(226, 162, 68, 0.24)',
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_WIDTH * 0.92,
    top: -SCREEN_WIDTH * 0.28,
    left: -SCREEN_WIDTH * 0.34,
    opacity: 1,
    translateX: 26,
    translateY: 30,
    scaleFrom: 1,
    scaleTo: 1.1,
    rotateFrom: '0deg',
    rotateTo: '12deg',
    duration: 24000,
    delay: 0,
  },
  {
    color: 'rgba(90, 162, 154, 0.18)',
    width: SCREEN_WIDTH * 0.72,
    height: SCREEN_WIDTH * 0.96,
    top: SCREEN_HEIGHT * 0.1,
    right: -SCREEN_WIDTH * 0.28,
    opacity: 1,
    translateX: -30,
    translateY: 26,
    scaleFrom: 1,
    scaleTo: 1.08,
    rotateFrom: '-12deg',
    rotateTo: '-1deg',
    duration: 30000,
    delay: 1200,
  },
  {
    color: 'rgba(255, 220, 158, 0.28)',
    width: SCREEN_WIDTH * 0.98,
    height: SCREEN_WIDTH * 0.62,
    bottom: -SCREEN_WIDTH * 0.2,
    left: -SCREEN_WIDTH * 0.02,
    opacity: 1,
    translateX: 22,
    translateY: -16,
    scaleFrom: 1,
    scaleTo: 1.07,
    rotateFrom: '8deg',
    rotateTo: '-3deg',
    duration: 28000,
    delay: 600,
  },
  {
    color: 'rgba(255, 247, 229, 0.26)',
    width: SCREEN_WIDTH * 0.46,
    height: SCREEN_WIDTH * 0.46,
    top: SCREEN_HEIGHT * 0.47,
    left: -SCREEN_WIDTH * 0.12,
    opacity: 0.92,
    translateX: 16,
    translateY: -22,
    scaleFrom: 1,
    scaleTo: 1.11,
    rotateFrom: '0deg',
    rotateTo: '18deg',
    duration: 22000,
    delay: 1800,
  },
  {
    color: 'rgba(214, 149, 61, 0.16)',
    width: SCREEN_WIDTH * 0.84,
    height: SCREEN_WIDTH * 0.34,
    top: SCREEN_HEIGHT * 0.18,
    left: -SCREEN_WIDTH * 0.08,
    opacity: 1,
    translateX: 20,
    translateY: 12,
    scaleFrom: 1,
    scaleTo: 1.06,
    rotateFrom: '14deg',
    rotateTo: '6deg',
    duration: 26000,
    delay: 900,
  },
];

const AmbientBackground: React.FC = () => {
  const progressValues = useRef(SHAPES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = progressValues.map((value, index) => {
      const shape = SHAPES[index];
      return Animated.loop(
        Animated.sequence([
          Animated.delay(shape.delay),
          Animated.timing(value, {
            toValue: 1,
            duration: shape.duration,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: shape.duration,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [progressValues]);

  return (
    <View pointerEvents="none" style={styles.container}>
      {SHAPES.map((shape, index) => {
        const progress = progressValues[index];
        const animatedStyle = {
          opacity: shape.opacity,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, shape.translateX],
              }),
            },
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, shape.translateY],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [shape.scaleFrom, shape.scaleTo],
              }),
            },
            {
              rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [shape.rotateFrom, shape.rotateTo],
              }),
            },
          ],
        };

        return (
          <Animated.View
            key={`ambient-shape-${index}`}
            style={[
              styles.shape,
              {
                backgroundColor: shape.color,
                width: shape.width,
                height: shape.height,
                borderRadius: Math.max(shape.width, shape.height) / 2,
                top: shape.top,
                right: shape.right,
                bottom: shape.bottom,
                left: shape.left,
              },
              animatedStyle,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  shape: {
    position: 'absolute',
  },
});

export default AmbientBackground;
