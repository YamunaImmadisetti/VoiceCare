// components/ui/StepBar.tsx
import { View, StyleSheet } from 'react-native'
import { Colors } from '@/constants/theme'

interface StepBarProps {
  current: number
  total: number
}

export function StepBar({ current, total }: StepBarProps) {
  return (
    <View style={styles.stepBar}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.pip,
            i < current ? styles.pipDone :
            i === current ? styles.pipActive :
            styles.pipTodo,
            i === 0 ? { width: 28 } : { flex: 1 },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  stepBar: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 4,
  },
  pip: {
    height: 4,
    borderRadius: 2,
  },
  pipDone:   { backgroundColor: Colors.sage },
  pipActive: { backgroundColor: Colors.sage },
  pipTodo:   { backgroundColor: Colors.borderMid },
})