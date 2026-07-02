// components/SOSButton.tsx
import { useRef, useState } from 'react'
import {
  Animated,
  Text,
  StyleSheet,
  PanResponder,
  Vibration,
  View,
} from 'react-native'
import { Colors, Font } from '@/constants/theme'

type Props = {
  onActivate: () => void
  holdDurationMs?: number
}

export function SOSButton({ onActivate, holdDurationMs = 3000 }: Props) {
  const progress   = useRef(new Animated.Value(0)).current
  const scale      = useRef(new Animated.Value(1)).current
  const [holding, setHolding] = useState(false)
  const timerRef   = useRef<ReturnType<typeof setTimeout>>()
  const animRef    = useRef<Animated.CompositeAnimation>()

  const startHold = () => {
    setHolding(true)
    Vibration.vibrate(50)

    animRef.current = Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: holdDurationMs, useNativeDriver: false }),
      Animated.timing(scale,    { toValue: 1.08, duration: 300, useNativeDriver: true }),
    ])
    animRef.current.start()

    timerRef.current = setTimeout(() => {
      Vibration.vibrate([0, 100, 80, 100])
      onActivate()
      resetHold()
    }, holdDurationMs)
  }

  const resetHold = () => {
    setHolding(false)
    clearTimeout(timerRef.current)
    animRef.current?.stop()
    Animated.parallel([
      Animated.timing(progress, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(scale,    { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start()
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant:  startHold,
    onPanResponderRelease: resetHold,
    onPanResponderTerminate: resetHold,
  })

  const ringSize = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  })
  const ringColor = progress.interpolate({
    inputRange:  [0, 0.6, 1],
    outputRange: [Colors.red, Colors.red, '#8B0000'],
  })

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.btn, { transform: [{ scale }] }]}
        {...panResponder.panHandlers}
      >
        {/* Progress ring */}
        <Animated.View
          style={[
            styles.progressRing,
            {
              borderColor: ringColor,
              // Fake progress by scaling border width
              borderWidth: progress.interpolate({
                inputRange: [0, 1], outputRange: [0, 4],
              }),
            },
          ]}
        />
        <Text style={styles.label}>SOS</Text>
        <Text style={styles.sub}>{holding ? 'Keep holding…' : 'Hold to alert'}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  btn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  progressRing: {
    position: 'absolute',
    width: 154,
    height: 154,
    borderRadius: 77,
    borderColor: '#fff',
  },
  label: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 32,
    color: '#fff',
    letterSpacing: 2,
  },
  sub: {
    fontFamily: Font.sans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
})