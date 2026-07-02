// components/ContactCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, Font, Radius, Shadow } from '@/constants/theme'

type Props = {
  firstName: string
  lastName: string
  relationship: string
  phone: string
  priority?: number   // 1, 2, 3
  status?: 'calling' | 'no-answer' | 'responded' | 'idle'
  onPress?: () => void
}

const AVATAR_PALETTES = [
  { bg: Colors.skySoft,  text: Colors.sky },
  { bg: Colors.sagePale, text: Colors.sage },
  { bg: Colors.amberSoft,text: Colors.amber },
]

const STATUS_LABELS: Record<string, { bg: string; text: string; label: string }> = {
  calling:   { bg: Colors.amberSoft, text: Colors.amber, label: 'Calling…' },
  'no-answer':{ bg: Colors.redSoft,  text: Colors.red,   label: 'No answer' },
  responded: { bg: Colors.sagePale, text: Colors.sage,   label: 'Responded ✓' },
  idle:      { bg: Colors.sagePale, text: Colors.sageDark,label: '' },
}

export function ContactCard({
  firstName, lastName, relationship, phone, priority = 1, status = 'idle', onPress,
}: Props) {
  const palette = AVATAR_PALETTES[(priority - 1) % AVATAR_PALETTES.length]
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const st = STATUS_LABELS[status] ?? STATUS_LABELS.idle

  return (
    <TouchableOpacity
      style={[styles.card, Shadow.sm]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
        <Text style={[styles.initials, { color: palette.text }]}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{firstName} {lastName}</Text>
        <Text style={styles.detail}>{relationship} · {phone}</Text>
      </View>

      {/* Status or priority badge */}
      {st.label ? (
        <View style={[styles.badge, { backgroundColor: st.bg }]}>
          <Text style={[styles.badgeText, { color: st.text }]}>{st.label}</Text>
        </View>
      ) : (
        <View style={[styles.badge, {
          backgroundColor: priority === 1 ? Colors.redSoft : priority === 2 ? Colors.amberSoft : Colors.skySoft,
        }]}>
          <Text style={[styles.badgeText, {
            color: priority === 1 ? Colors.red : priority === 2 ? Colors.amber : Colors.sky,
          }]}>{priority === 1 ? '1st' : priority === 2 ? '2nd' : '3rd'}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 13,
    marginBottom: 9,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontFamily: Font.sansBold,
    fontSize: 12,
  },
  info: { flex: 1 },
  name: {
    fontFamily: Font.sansBold,
    fontSize: 13,
    color: Colors.text,
  },
  detail: {
    fontFamily: Font.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontFamily: Font.sansBold,
    fontSize: 10,
  },
})