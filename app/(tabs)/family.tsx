import { Colors, Font, Shadow } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { fetchTakenToday, getDoseStatus, sortByDoseTime } from '@/lib/medReminders'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'

type Med = { name: string; dosage: string; status: 'taken' | 'missed' | 'pending' }
type TimelineItem = { time: string; dot: string; event: string; detail: string }

export default function FamilyScreen() {
  const [profileName, setProfileName]   = useState('')
  const [meds, setMeds]                 = useState<Med[]>([])
  const [timeline, setTimeline]         = useState<TimelineItem[]>([])
  const [adherencePct, setAdherencePct] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) {
        const first = profile.full_name.split(' ')[0]
        setProfileName(first)
      }

      // Load medications
      const [{ data: medsData }, takenMap] = await Promise.all([
        supabase
          .from('medications')
          .select('id, name, dosage, time, frequencies, active')
          .eq('user_id', user.id),
        fetchTakenToday(user.id),
      ])

      const now = new Date()
      const timeStr = (d: Date) =>
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

      const activeMeds = sortByDoseTime((medsData ?? []).filter(m => m.active !== false))

      const medsWithStatus: Med[] = activeMeds.map(m => {
        const s = getDoseStatus(m.time, takenMap.has(m.id), now)
        const status: Med['status'] = s === 'taken' ? 'taken' : s === 'missed' ? 'missed' : 'pending'
        return { name: m.name, dosage: m.dosage, status }
      })

      setMeds(medsWithStatus)
      const taken = medsWithStatus.filter(m => m.status === 'taken').length
      setAdherencePct(medsWithStatus.length > 0 ? Math.round((taken / medsWithStatus.length) * 100) : 0)

      // Timeline from real dose logs (newest first)
      const doseEvents: TimelineItem[] = activeMeds
        .filter(m => takenMap.has(m.id))
        .map(m => ({ at: new Date(takenMap.get(m.id)!), m }))
        .sort((x, y) => y.at.getTime() - x.at.getTime())
        .map(({ at, m }) => ({
          time:   timeStr(at),
          dot:    Colors.amber,
          event:  'Medication taken',
          detail: `${m.name} ${m.dosage ?? ''} confirmed`.trim(),
        }))

      setTimeline([
        { time: timeStr(now), dot: Colors.sage, event: 'App active', detail: 'User is currently using CareVoice' },
        ...doseEvents,
      ])

    } catch (e) {
      console.log('Family load error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function onRefresh() {
    setRefreshing(true)
    load()
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#fff" size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Health Overview</Text>
          <Text style={styles.sub}>Updated just now</Text>
        </View>
        <View style={styles.notifBtn}>
          <Text>🔔</Text>
          <View style={styles.notifDot} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statRow}>
        {[
          { val: 'Active',         lbl: 'STATUS'       },
          { val: `${adherencePct}%`, lbl: 'MED ADHERENCE' },
          { val: '0',              lbl: 'ALERTS TODAY'  },
        ].map((s, i) => (
          <View key={i} style={styles.statBox}>
            <Text style={styles.statVal}>{s.val}</Text>
            <Text style={styles.statLbl}>{s.lbl}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.sage} />}
      >

        {/* Timeline */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Today&apos;s Activity</Text>
          {timeline.map((item, i) => (
            <View key={i} style={[styles.timelineRow, i < timeline.length - 1 && styles.timelineBorder]}>
              <Text style={styles.timelineTime}>{item.time}</Text>
              <View style={styles.timelineDotCol}>
                <View style={[styles.timelineDot, { backgroundColor: item.dot }]} />
                {i < timeline.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineEvent}>{item.event}</Text>
                <Text style={styles.timelineDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Adherence */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Medication Adherence</Text>
          <View style={styles.adherenceRow}>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { width: `${adherencePct}%` }]} />
            </View>
            <Text style={styles.adherencePct}>{adherencePct}%</Text>
          </View>
          {meds.length === 0 ? (
            <Text style={styles.emptyText}>No medications on record.</Text>
          ) : (
            meds.map((m, i) => (
              <View key={i} style={[styles.medRow, i < meds.length - 1 && styles.medBorder]}>
                <Text style={{ fontSize: 14 }}>💊</Text>
                <Text style={styles.medName}>{m.name} {m.dosage}</Text>
                <View style={[styles.medIcon, {
                  backgroundColor:
                    m.status === 'taken'  ? Colors.sagePale :
                    m.status === 'missed' ? Colors.redSoft  : Colors.amberSoft,
                }]}>
                  <Text style={{ fontSize: 10 }}>
                    {m.status === 'taken' ? '✓' : m.status === 'missed' ? '✗' : '·'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoText}>
            💡 Pull down to refresh the latest activity data.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.sageDark },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 16, paddingBottom: 14 },
  title:   { fontFamily: 'Lora_600SemiBold', fontSize: 19, color: '#fff' },
  sub:     { fontFamily: Font.sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  notifBtn:{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot:{ position: 'absolute', top: 5, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.amber, borderWidth: 1.5, borderColor: Colors.sageDark },
  statRow: { flexDirection: 'row', gap: 9, paddingHorizontal: 22, marginBottom: 0 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, alignItems: 'center' },
  statVal: { fontFamily: Font.sansBold, fontSize: 18, color: '#fff' },
  statLbl: { fontFamily: Font.sans, fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2, letterSpacing: 0.3 },
  body:    { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 16, padding: 16 },
  card:    { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontFamily: Font.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, color: Colors.textMuted, marginBottom: 11 },
  timelineRow:    { flexDirection: 'row', gap: 11, paddingVertical: 7 },
  timelineBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  timelineTime:   { fontFamily: Font.sans, fontSize: 10, color: Colors.textMuted, width: 44, paddingTop: 2 },
  timelineDotCol: { alignItems: 'center', paddingTop: 3 },
  timelineDot:    { width: 7, height: 7, borderRadius: 4 },
  timelineLine:   { width: 1, flex: 1, backgroundColor: Colors.border, marginTop: 3 },
  timelineEvent:  { fontFamily: Font.sansBold, fontSize: 12, color: Colors.text },
  timelineDetail: { fontFamily: Font.sans, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  adherenceRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 11 },
  barWrap:        { flex: 1, height: 8, backgroundColor: Colors.sagePale, borderRadius: 4, overflow: 'hidden' },
  bar:            { height: '100%', backgroundColor: Colors.sage, borderRadius: 4 },
  adherencePct:   { fontFamily: Font.sansBold, fontSize: 13, color: Colors.sageDark },
  medRow:         { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 7 },
  medBorder:      { borderBottomWidth: 1, borderBottomColor: Colors.border },
  medName:        { fontFamily: Font.sans, fontSize: 12, color: Colors.text, flex: 1 },
  medIcon:        { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyText:      { fontFamily: Font.sans, fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  infoNote:       { backgroundColor: Colors.skySoft, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(56,118,176,0.12)' },
  infoText:       { fontFamily: Font.sans, fontSize: 12, color: Colors.sky, lineHeight: 18 },
})