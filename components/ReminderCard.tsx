// components/ReminderCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, Font, Radius } from '@/constants/theme'

type ReminderStatus = 'done' | 'upcoming' | 'overdue' | 'pending'

type Props = {
  name: string
  dosage: string
  time: string
  status: ReminderStatus
  onMark?: () => void
}

const STATUS_CONFIG: Record<ReminderStatus, { dot: string; badgeBg: string; badgeText: string; label: string }> = {
  done:     { dot: Colors.sage,   badgeBg: Colors.sagePale,  badgeText: Colors.sageDark, label: '✓ Done' },
  upcoming: { dot: Colors.amber,  badgeBg: Colors.amberSoft, badgeText: Colors.amber,    label: 'Upcoming' },
  overdue:  { dot: Colors.red,    badgeBg: Colors.redSoft,   badgeText: Colors.red,      label: 'Overdue' },
  pending:  { dot: Colors.sky,    badgeBg: Colors.skySoft,   badgeText: Colors.sky,      label: 'Pending' },
}

export function ReminderCard({ name, dosage, time, status, onMark }: Props) {
  const cfg = STATUS_CONFIG[status]

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />

      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>{dosage} · {time}</Text>
      </View>

      <TouchableOpacity
        onPress={onMark}
        style={[styles.badge, { backgroundColor: cfg.badgeBg }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.badgeText, { color: cfg.badgeText }]}>{cfg.label}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    flexShrink: 0,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: Font.sansMedium,
    fontSize: 13,
    color: Colors.text,
  },
  detail: {
    fontFamily: Font.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontFamily: Font.sansBold,
    fontSize: 11,
  },
})