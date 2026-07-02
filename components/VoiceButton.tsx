// components/VoiceButton.tsx
import { useEffect, useRef } from 'react'
import {
  TouchableOpacity,
  View,
  Text,
  Animated,
  StyleSheet,
} from 'react-native'
import { Colors, Font, Shadow } from '@/constants/theme'

type Props = {
  onPress: () => void
  listening?: boolean
  label?: string
  sublabel?: string
}

export function VoiceButton({
  onPress,
  listening = false,
  label = 'Tap to Speak',
  sublabel = 'Ask me anything • Just talk naturally',
}: Props) {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!listening) {
      pulse.setValue(1)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [listening])

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.wrap}>
      {/* Outer pulse ring */}
      <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]} />

      {/* Mic orb */}
      <View style={[styles.orb, listening && styles.orbActive]}>
        {/* Mic icon — simple SVG-like shapes with RN Views */}
        <View style={styles.micBody} />
        <View style={styles.micStand} />
        <View style={styles.micBase} />
      </View>

      <Text style={styles.label}>{label}</Text>
      <Text style={styles.sub}>{sublabel}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.sage,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    top: 18,
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  orbActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  // Simple mic icon drawn with Views
  micBody: {
    width: 14,
    height: 20,
    borderRadius: 7,
    backgroundColor: '#fff',
    marginBottom: 2,
  },
  micStand: {
    width: 20,
    height: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    borderTopWidth: 0,
    marginTop: -2,
  },
  micBase: {
    width: 2,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  label: {
    fontFamily: Font.sansBold,
    fontSize: 15,
    color: '#fff',
    marginBottom: 3,
  },
  sub: {
    fontFamily: Font.sans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
})