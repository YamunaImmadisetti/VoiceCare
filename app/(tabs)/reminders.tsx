import { Colors, Font, Radius, Shadow } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type MedStatus = 'done' | 'upcoming' | 'missed'
type TabKey = 'today' | 'upcoming' | 'all'

type Medication = {
  id: string
  name: string
  dosage: string
  form: string
  frequencies: string[]
  time: string
  with_food: string
  status: MedStatus
}

function getStatus(time: string, frequencies: string[]): MedStatus {
  const now = new Date()
  const hour = now.getHours()

  // Simple logic: morning = before 12, afternoon = 12-17, evening/bedtime = after 17
  const isMorning   = frequencies.includes('Morning')   && hour >= 12
  const isAfternoon = frequencies.includes('Afternoon') && hour >= 17
  const isEvening   = frequencies.includes('Evening')   && hour >= 21
  const isBedtime   = frequencies.includes('Bedtime')   && hour >= 22

  if (isMorning || isAfternoon || isEvening || isBedtime) return 'missed'

  // Parse time string like "08:00 AM"
  const [timePart, meridiem] = time.split(' ')
  const [h, m] = timePart.split(':').map(Number)
  let medHour = h
  if (meridiem === 'PM' && h !== 12) medHour += 12
  if (meridiem === 'AM' && h === 12) medHour = 0

  if (hour > medHour) return 'done'
  return 'upcoming'
}

function MedCard({ med, onMarkDone }: { med: Medication; onMarkDone: (id: string) => void }) {
  const statusColor = {
    done:     Colors.sage,
    upcoming: Colors.amber,
    missed:   Colors.red,
  }[med.status]

  const statusBg = {
    done:     Colors.sagePale,
    upcoming: Colors.amberSoft,
    missed:   Colors.redSoft,
  }[med.status]

  const statusLabel = {
    done:     '✓ Taken',
    upcoming: 'Upcoming',
    missed:   'Missed',
  }[med.status]

  return (
    <View style={styles.medCard}>
      <View style={styles.medCardLeft}>
        <View style={[styles.medDot, { backgroundColor: statusColor }]} />
        <View style={styles.medInfo}>
          <Text style={styles.medName}>{med.name} {med.dosage}</Text>
          <Text style={styles.medTime}>{med.time} · {med.with_food}</Text>
          <Text style={styles.medFreq}>{med.frequencies.join(', ')}</Text>
        </View>
      </View>
      <View style={styles.medCardRight}>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {med.status === 'upcoming' && (
          <TouchableOpacity
            style={styles.markDoneBtn}
            onPress={() => onMarkDone(med.id)}
          >
            <Text style={styles.markDoneText}>Mark Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default function RemindersScreen() {
  const [activeTab, setActiveTab]   = useState<TabKey>('today')
  const [meds, setMeds]             = useState<Medication[]>([])
  const [loading, setLoading]       = useState(true)
  const [markedDone, setMarkedDone] = useState<Set<string>>(new Set())

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'today',    label: 'Today'    },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'all',      label: 'All'      },
  ]

  const loadMeds = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: true })

      if (error) throw error

      const medsWithStatus: Medication[] = (data ?? []).map(m => ({
        id:          m.id,
        name:        m.name,
        dosage:      m.dosage,
        form:        m.form,
        frequencies: m.frequencies ?? [],
        time:        m.time,
        with_food:   m.with_food,
        status:      markedDone.has(m.id) ? 'done' : getStatus(m.time, m.frequencies ?? []),
      }))

      setMeds(medsWithStatus)
    } catch (e) {
      console.log('Meds load error:', e)
    } finally {
      setLoading(false)
    }
  }, [markedDone])

  useEffect(() => {
    loadMeds()
  }, [loadMeds])

  function handleMarkDone(id: string) {
    setMarkedDone(prev => new Set([...prev, id]))
    Alert.alert('✓ Marked as taken', 'Great job staying on track!')
  }

  const filteredMeds = meds.filter(m => {
    if (activeTab === 'today')    return m.status === 'done' || m.status === 'upcoming'
    if (activeTab === 'upcoming') return m.status === 'upcoming'
    return true
  })

  const takenCount = meds.filter(m => m.status === 'done').length
  const totalCount = meds.length
  const adherencePct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Medications</Text>
        <Text style={styles.sub}>Track your daily doses</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Adherence bar */}
        <View style={[styles.adherenceCard, Shadow.sm]}>
          <Text style={styles.adherenceTitle}>Today&apos;s Adherence</Text>
          <View style={styles.adherenceRow}>
            <View style={styles.adherenceBarWrap}>
              <View style={[styles.adherenceBar, { width: `${adherencePct}%` }]} />
            </View>
            <Text style={styles.adherencePct}>{adherencePct}%</Text>
          </View>
          <Text style={styles.adherenceSub}>{takenCount} of {totalCount} medications taken</Text>
        </View>

        {/* Med list */}
        {loading ? (
          <ActivityIndicator color={Colors.sage} style={{ marginTop: 40 }} />
        ) : filteredMeds.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyTitle}>No medications found</Text>
            <Text style={styles.emptySub}>
              {activeTab === 'upcoming'
                ? 'No upcoming medications for today.'
                : 'Add medications in your profile to see them here.'}
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, Shadow.sm]}>
            {filteredMeds.map((m, i) => (
              <View key={m.id}>
                <MedCard med={m} onMarkDone={handleMarkDone} />
                {i < filteredMeds.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.sageDark },
  header: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 12 },
  title:  { fontFamily: 'Lora_600SemiBold', fontSize: 22, color: '#fff' },
  sub:    { fontFamily: Font.sans, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 22, marginBottom: 0 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive:     { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabText:       { fontFamily: Font.sans, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  tabTextActive: { color: '#fff', fontFamily: Font.sansBold },
  body: {
    flex: 1, backgroundColor: Colors.cream,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: 16, padding: 18,
  },
  adherenceCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  adherenceTitle:   { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.7 },
  adherenceRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adherenceBarWrap: { flex: 1, height: 8, backgroundColor: Colors.sagePale, borderRadius: 4, overflow: 'hidden' },
  adherenceBar:     { height: '100%', backgroundColor: Colors.sage, borderRadius: 4 },
  adherencePct:     { fontFamily: Font.sansBold, fontSize: 14, color: Colors.sageDark },
  adherenceSub:     { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginTop: 8 },
  listCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  medCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', paddingVertical: 10,
  },
  medCardLeft:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  medCardRight: { alignItems: 'flex-end', gap: 6 },
  medDot:   { width: 9, height: 9, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  medInfo:  { flex: 1 },
  medName:  { fontFamily: Font.sansBold, fontSize: 13, color: Colors.text },
  medTime:  { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  medFreq:  { fontFamily: Font.sans, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  statusText:  { fontFamily: Font.sansBold, fontSize: 10 },
  markDoneBtn: {
    backgroundColor: Colors.sage, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  markDoneText: { fontFamily: Font.sansBold, fontSize: 10, color: '#fff' },
  divider: { height: 1, backgroundColor: Colors.border },
  emptyWrap:  { alignItems: 'center', paddingTop: 48 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Font.sansBold, fontSize: 15, color: Colors.text, marginBottom: 6 },
  emptySub:   { fontFamily: Font.sans, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
})