// components/ui/ScreenHeader.tsx
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Font } from '@/constants/theme'

interface ScreenHeaderProps {
  stepLabel: string
  title: string
  sub?: string
}

export function ScreenHeader({ stepLabel, title, sub }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.stepLabel}>{stepLabel}</Text>
      <Text style={styles.title}>{title}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    marginTop: 18,
    marginBottom: 18,
  },
  stepLabel: {
    fontFamily: Font.sansBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.sageMid,
    marginBottom: 5,
  },
  title: {
    fontFamily: Font.serif,
    fontSize: 24,
    color: Colors.text,
    lineHeight: 32,
  },
  sub: {
    fontFamily: Font.sans,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
})