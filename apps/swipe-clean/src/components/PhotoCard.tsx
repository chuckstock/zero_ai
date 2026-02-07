import React from 'react';
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Photo } from '../types';
import { COLORS, SWIPE_THRESHOLD } from '../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.7;

interface PhotoCardProps {
  photo: Photo;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const shouldDismiss = Math.abs(translateX.value) > SWIPE_THRESHOLD;

      if (shouldDismiss) {
        // Animate off screen
        translateX.value = withSpring(
          translateX.value > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          {},
          () => {
            // Call callback on JS thread
            if (translateX.value > 0) {
              runOnJS(onSwipeRight)();
            } else {
              runOnJS(onSwipeLeft)();
            }
          }
        );
      } else {
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-30, 0, 30]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const deleteIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0]
    );

    return { opacity: Math.max(0, opacity) };
  });

  const keepIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1]
    );

    return { opacity: Math.max(0, opacity) };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
        
        {/* Delete Indicator */}
        <Animated.View style={[styles.indicator, styles.deleteIndicator, deleteIndicatorStyle]}>
          <Text style={styles.indicatorText}>DELETE</Text>
        </Animated.View>

        {/* Keep Indicator */}
        <Animated.View style={[styles.indicator, styles.keepIndicator, keepIndicatorStyle]}>
          <Text style={styles.indicatorText}>KEEP</Text>
        </Animated.View>

        {/* Photo Info */}
        <View style={styles.info}>
          <Text style={styles.filename} numberOfLines={1}>
            {photo.filename}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
  },
  filename: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    top: 60,
    padding: 16,
    borderRadius: 12,
    borderWidth: 4,
  },
  deleteIndicator: {
    left: 20,
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  keepIndicator: {
    right: 20,
    borderColor: COLORS.success,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  indicatorText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
});
