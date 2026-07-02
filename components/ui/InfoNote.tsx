// components/ui/InfoNote.tsx
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Font, Radius } from '@/constants/theme'

interface InfoNoteProps {
  text: string
  color?: string
  bg?: string
  borderColor?: string
}

export function InfoNote({
  text,
  color = Colors.sky,
  bg = Colors.skySoft,
  borderColor = 'rgba(56,118,176,0.15)',
}: InfoNoteProps) {
  return (
    <View style={[styles.wrap, { backgroundColor: bg, borderColor }]}>
      <Text style={styles.icon}>ℹ️</Text>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 9,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 11,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  icon: { fontSize: 13 },
  text: {
    flex: 1,
    fontFamily: Font.sans,
    fontSize: 12,
    lineHeight: 18,
  },
})