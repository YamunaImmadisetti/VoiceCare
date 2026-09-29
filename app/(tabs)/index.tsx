import { ReminderCard } from '@/components/ReminderCard'
import { VoiceButton } from '@/components/VoiceButton'
import { Colors, Font, Shadow } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { DoseStatus, fetchTakenToday, getDoseStatus, logDoseTaken, sortByDoseTime } from '@/lib/medReminders'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type MedStatus = 'done' | 'upcoming' | 'overdue' | 'pending'
type Reminder = { id: string; name: string; dosage: string; time: string; status: MedStatus }

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning,'
  if (hour < 17) return 'Good afternoon,'
  return 'Good evening,'
}

// Maps a real dose status (from medication_logs) to the ReminderCard styles
const CARD_STATUS: Record<DoseStatus, MedStatus> = {
  taken:    'done',
  upcoming: 'upcoming',
  due:      'pending',
  missed:   'overdue',
}

export default function HomeScreen() {
  const router = useRouter()

  const [firstName, setFirstName]   = useState('')
  const [initials, setInitials]     = useState('?')
  const [reminders, setReminders]   = useState<Reminder[]>([])
  const [loadingMeds, setLoadingMeds] = useState(true)
  const [dueCount, setDueCount]       = useState(0)

  useEffect(() => {
    loadUser()
  }, [])

  // Refresh reminders each time Home is shown
  useFocusEffect(
    useCallback(() => {
      loadReminders()
    }, []),
  )

  async function loadUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profile?.full_name) {
        const parts = profile.full_name.trim().split(' ')
        setFirstName(parts[0])
        setInitials(parts.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2))
      }
    } catch (e) {
      console.log('Home user error:', e)
    }
  }

  async function loadReminders() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data }, taken] = await Promise.all([
        supabase
          .from('medications')
          .select('id, name, dosage, time, active')
          .eq('user_id', user.id),
        fetchTakenToday(user.id),
      ])

      if (data) {
        const now = new Date()
        const all = sortByDoseTime(data.filter(m => m.active !== false)).map(m => ({
          id:     m.id,
          name:   m.name,
          dosage: m.dosage,
          time:   m.time,
          status: getDoseStatus(m.time, taken.has(m.id), now),
        }))
        setDueCount(all.filter(m => m.status !== 'taken').length)
        // Show the next doses still to take first, then taken ones
        const pending = all.filter(m => m.status !== 'taken')
        const done    = all.filter(m => m.status === 'taken')
        setReminders([...pending, ...done].slice(0, 3).map(m => ({ ...m, status: CARD_STATUS[m.status] })))
      }
    } catch (e) {
      console.log('Reminders error:', e)
    } finally {
      setLoadingMeds(false)
    }
  }

  async function markTaken(id: string) {
    try {
      await logDoseTaken(id)
      loadReminders()
    } catch (e) {
      console.log('Mark taken error:', e)
    }
  }

  const quickCards = [
    { icon: '💊', bg: Colors.sagePale,  title: 'Medications', sub: `${dueCount} left today`, route: '/reminders' },
    { icon: '📅', bg: Colors.amberSoft, title: 'Schedule',    sub: 'Appointments',                  route: '/schedule'  },
    { icon: '📊', bg: Colors.skySoft, title: 'Overview', sub: 'Health summary', route: '/family' },
    { icon: '🚨', bg: Colors.redSoft,   title: 'SOS',         sub: 'Hold to alert',                 route: '/sos'       },
  ]

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{firstName ? `${firstName} 👋` : '👋'}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile')}>
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* Health strip */}
      <View style={styles.healthStrip}>
        {[
          { val: '72',     lbl: 'BPM'           },
          { val: '118/76', lbl: 'BLOOD PRESSURE' },
          { val: 'Good',   lbl: 'MOOD'           },
        ].map((item, i) => (
          <View key={i} style={[styles.healthItem, i > 0 && styles.healthItemBorder]}>
            <Text style={styles.healthVal}>{item.val}</Text>
            <Text style={styles.healthLbl}>{item.lbl}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Voice CTA */}
        <VoiceButton onPress={() => router.push('/voice' as any)} />

        {/* Quick access */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickGrid}>
          {quickCards.map(c => (
            <TouchableOpacity
              key={c.title}
              style={[styles.quickCard, Shadow.sm]}
              onPress={() => router.push(c.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: c.bg }]}>
                <Text style={{ fontSize: 18 }}>{c.icon}</Text>
              </View>
              <Text style={styles.quickTitle}>{c.title}</Text>
              <Text style={styles.quickSub}>{c.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Reminders */}
        <Text style={styles.sectionTitle}>Today&apos;s Reminders</Text>
        <View style={styles.remindersWrap}>
          {loadingMeds ? (
            <ActivityIndicator color={Colors.sage} style={{ paddingVertical: 20 }} />
          ) : reminders.length === 0 ? (
            <Text style={styles.emptyText}>No medications scheduled for today.</Text>
          ) : (
            reminders.map(r => (
              <ReminderCard
                key={r.id}
                name={r.name}
                dosage={r.dosage}
                time={r.time}
                status={r.status}
                onMark={r.status === 'done' ? undefined : () => markTaken(r.id)}
              />
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.sageDark },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18 },
  greeting:   { fontFamily: Font.sans, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  name:       { fontFamily: 'Lora_600SemiBold', fontSize: 21, color: '#fff' },
  avatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.sageMid, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  avatarText: { fontFamily: Font.sansBold, fontSize: 14, color: '#fff' },
  healthStrip:      { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginHorizontal: 22, paddingVertical: 11 },
  healthItem:       { flex: 1, alignItems: 'center' },
  healthItemBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.12)' },
  healthVal:        { fontFamily: Font.sansBold, fontSize: 16, color: '#fff' },
  healthLbl:        { fontFamily: Font.sans, fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2, letterSpacing: 0.4 },
  body:        { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 16, padding: 18 },
  sectionTitle:{ fontFamily: Font.sansBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.textMuted, marginBottom: 11, marginTop: 18 },
  quickGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  quickCard:   { width: '47%', backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  quickIcon:   { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  quickTitle:  { fontFamily: Font.sansBold, fontSize: 13, color: Colors.text },
  quickSub:    { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  remindersWrap: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  emptyText:   { fontFamily: Font.sans, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
})