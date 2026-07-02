// components/ui/NavRow.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, Font, Radius, Shadow } from '@/constants/theme'

interface NavRowProps {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextColor?: string
  showBack?: boolean
}

export function NavRow({
  onBack,
  onNext,
  nextLabel = 'Continue →',
  nextColor = Colors.sageDark,
  showBack = true,
}: NavRowProps) {
  return (
    <View style={styles.navRow}>
      {showBack && (
        <TouchableOpacity
          style={styles.btnBack}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.btnBackText}>← Back</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.btnNext, { backgroundColor: nextColor }]}
        onPress={onNext}
        activeOpacity={0.85}
      >
        <Text style={styles.btnNextText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnBack: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
  },
  btnBackText: {
    fontFamily: Font.sansMedium,
    fontSize: 13,
    color: Colors.textMid,
  },
  btnNext: {
    flex: 1,
    borderRadius: Radius.sm,
    paddingVertical: 13,
    alignItems: 'center',
    ...Shadow.sm,
  },
  btnNextText: {
    fontFamily: Font.sansBold,
    fontSize: 14,
    color: Colors.white,
  },
})