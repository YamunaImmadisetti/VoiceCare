import { SOSButton } from '@/components/SOSButton'
import { Colors, Font, Radius, Shadow } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type ContactStatus = 'idle' | 'calling' | 'no-answer' | 'responded'
type AlertState    = 'idle' | 'active' | 'cancelled'

type Contact = {
  id: string
  first_name: string
  last_name: string
  relationship: string
  phone: string
  priority: number
  status: ContactStatus
}

export default function SOSScreen() {
  const [alertState, setAlertState] = useState<AlertState>('idle')
  const [countdown, setCountdown]   = useState(167)
  const [contacts, setContacts]     = useState<Contact[]>([])
  const [loading, setLoading]       = useState(true)
  const intervalRef = useRef<any>(null)
  const timeoutRef  = useRef<any>(null)
  const clearAllTimers = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (timeoutRef.current)  { clearTimeout(timeoutRef.current);   timeoutRef.current  = null }
  }

  const loadContacts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })

      setContacts((data ?? []).map(c => ({ ...c, status: 'idle' as ContactStatus })))
    } catch (e) {
      console.log('Contacts load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadContacts() }, [loadContacts])

  useEffect(() => {
    if (alertState === 'active') {
      // Simulate calling contacts sequentially
      setContacts(prev => prev.map((c, i) => ({
        ...c,
        status: i === 0 ? 'calling' : 'idle',
      })))

      // Start countdown
      intervalRef.current = setInterval(() => {
        setCountdown(s => {
          if (s <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return 0
          }
          return s - 1
        })
      }, 1000)

      // After 30s mark first as no-answer, call second
      timeoutRef.current = setTimeout(() => {
        setContacts(prev => prev.map((c, i) => ({
          ...c,
          status: i === 0 ? 'no-answer' : i === 1 ? 'calling' : 'idle',
        })))
      }, 30000)

    } else {
      clearAllTimers()
      if (alertState === 'idle') {
        setCountdown(167)
        setContacts(prev => prev.map(c => ({ ...c, status: 'idle' })))
      }
    }

    return () => clearAllTimers()
  }, [alertState])

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60

  const statusColor: Record<ContactStatus, string> = {
    idle:          Colors.textMuted,
    calling:       Colors.amber,
    'no-answer':   Colors.red,
    responded:     Colors.sage,
  }
  const statusLabel: Record<ContactStatus, string> = {
    idle:          'On standby',
    calling:       'Calling…',
    'no-answer':   'No answer',
    responded:     'Responded ✓',
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#fff" size="large" />
      </SafeAreaView>
    )
  }

  if (alertState === 'idle') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Emergency SOS</Text>
          <Text style={styles.sub}>Hold button for 3 seconds to activate</Text>
        </View>

        <ScrollView
          style={styles.idleBody}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
        >
          <SOSButton onActivate={() => setAlertState('active')} />

          <Text style={styles.idleNote}>
            This will immediately notify your emergency contacts and share your live location.
          </Text>

          <Text style={styles.sectionTitle}>Your Emergency Contacts</Text>

          {contacts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📞</Text>
              <Text style={styles.emptyTitle}>No contacts added</Text>
              <Text style={styles.emptySub}>
                Add emergency contacts in your Profile → Emergency Contacts.
              </Text>
            </View>
          ) : (
            contacts.map((c, i) => (
              <View key={c.id} style={[styles.contactCard, Shadow.sm]}>
                <View style={[styles.contactAvatar, {
                  backgroundColor: i === 0 ? Colors.skySoft : Colors.sagePale,
                }]}>
                  <Text style={[styles.contactInitials, {
                    color: i === 0 ? Colors.sky : Colors.sage,
                  }]}>
                    {c.first_name[0]}{c.last_name[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{c.first_name} {c.last_name}</Text>
                  <Text style={styles.contactRel}>{c.relationship} · {c.phone}</Text>
                </View>
                <View style={[styles.priorityBadge, {
                  backgroundColor: i === 0 ? Colors.redSoft : Colors.amberSoft,
                }]}>
                  <Text style={[styles.priorityText, {
                    color: i === 0 ? Colors.red : Colors.amber,
                  }]}>
                    {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.red }]}>

      {/* Active / Cancelled header */}
      <View style={styles.activeHeader}>
        <View style={styles.activeBadge}>
          <View style={styles.blinkDot} />
          <Text style={styles.activeBadgeText}>
            {alertState === 'cancelled' ? 'ALERT CANCELLED' : 'EMERGENCY ACTIVE'}
          </Text>
        </View>
        <Text style={styles.activeTitle}>
          {alertState === 'cancelled' ? 'Alert Cancelled' : 'Alert Triggered'}
        </Text>
        <Text style={styles.activeSub}>
          {alertState === 'cancelled'
            ? 'Your contacts have been informed you are safe.'
            : 'Distress detected · Notifying contacts'}
        </Text>
      </View>

      <ScrollView style={styles.activeBody}>

        {/* Timer */}
        {alertState === 'active' && (
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Escalating to 112 in</Text>
            <Text style={styles.timerCount}>{mins}:{String(secs).padStart(2, '0')}</Text>
            <Text style={styles.timerSub}>unless a family member responds</Text>
          </View>
        )}

        {alertState === 'cancelled' && (
          <View style={[styles.timerCard, {
            backgroundColor: Colors.sagePale,
            borderColor: Colors.border,
          }]}>
            <Text style={{ fontSize: 32, textAlign: 'center' }}>✅</Text>
            <Text style={[styles.timerLabel, { color: Colors.sageDark }]}>Alert Cancelled</Text>
          </View>
        )}

        {/* Contacts notified */}
        <Text style={styles.sectionTitleDark}>Contacts Notified</Text>
        {contacts.map(c => (
          <View key={c.id} style={styles.alertContactCard}>
            <View style={styles.contactAvatar}>
              <Text style={[styles.contactInitials, { color: Colors.sky }]}>
                {c.first_name[0]}{c.last_name[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{c.first_name} ({c.relationship})</Text>
              <Text style={styles.contactRel}>{c.phone}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: Colors.amberSoft }]}>
              <Text style={[styles.statusPillText, { color: statusColor[c.status] }]}>
                {statusLabel[c.status]}
              </Text>
            </View>
          </View>
        ))}

        {/* Location */}
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Text style={{ fontSize: 18 }}>📍</Text>
          </View>
          <View>
            <Text style={styles.locationTitle}>Live Location Shared</Text>
            <Text style={styles.locationAddr}>Shared with all contacts</Text>
          </View>
        </View>

        {alertState === 'active' && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setAlertState('cancelled')}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelText}>I&apos;m Safe — Cancel Alert</Text>
          </TouchableOpacity>
        )}

        {alertState === 'cancelled' && (
          <TouchableOpacity
            style={[styles.cancelBtn, {
              backgroundColor: Colors.sageDark,
              borderColor: Colors.sageDark,
            }]}
            onPress={() => setAlertState('idle')}
          >
            <Text style={[styles.cancelText, { color: '#fff' }]}>← Back to Home</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.sageDark },
  header:           { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 12 },
  title:            { fontFamily: 'Lora_600SemiBold', fontSize: 22, color: '#fff' },
  sub:              { fontFamily: Font.sans, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  idleBody:         { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 16, padding: 24 },
  idleNote:         { fontFamily: Font.sans, fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 20, marginBottom: 28, paddingHorizontal: 12 },
  sectionTitle:     { alignSelf: 'flex-start', fontFamily: Font.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: Colors.textMuted, marginBottom: 11 },
  sectionTitleDark: { fontFamily: Font.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: Colors.textMuted, marginBottom: 11 },
  contactCard:      { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: Colors.white, borderRadius: 13, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, width: '100%' },
  alertContactCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: Colors.white, borderRadius: 13, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  contactAvatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.skySoft, alignItems: 'center', justifyContent: 'center' },
  contactInitials:  { fontFamily: Font.sansBold, fontSize: 12 },
  contactName:      { fontFamily: Font.sansBold, fontSize: 12, color: Colors.text },
  contactRel:       { fontFamily: Font.sans, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  priorityBadge:    { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  priorityText:     { fontFamily: Font.sansBold, fontSize: 10 },
  statusPill:       { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  statusPillText:   { fontFamily: Font.sansBold, fontSize: 10 },
  emptyWrap:        { alignItems: 'center', paddingTop: 20 },
  emptyIcon:        { fontSize: 36, marginBottom: 10 },
  emptyTitle:       { fontFamily: Font.sansBold, fontSize: 14, color: Colors.text, marginBottom: 6 },
  emptySub:         { fontFamily: Font.sans, fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  activeHeader:     { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 26 },
  activeBadge:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  blinkDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  activeBadgeText:  { fontFamily: Font.sansBold, fontSize: 11, color: '#fff', letterSpacing: 0.4 },
  activeTitle:      { fontFamily: 'Lora_600SemiBold', fontSize: 22, color: '#fff', marginBottom: 5 },
  activeSub:        { fontFamily: Font.sans, fontSize: 12, color: 'rgba(255,255,255,0.78)' },
  activeBody:       { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 },
  timerCard:        { backgroundColor: Colors.redSoft, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,64,64,0.15)', marginBottom: 14 },
  timerLabel:       { fontFamily: Font.sansBold, fontSize: 11, color: Colors.red, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 7 },
  timerCount:       { fontFamily: 'Lora_600SemiBold', fontSize: 48, color: Colors.red, lineHeight: 52 },
  timerSub:         { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginTop: 5 },
  locationCard:     { backgroundColor: Colors.skySoft, borderRadius: 13, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(56,118,176,0.12)' },
  locationIcon:     { width: 34, height: 34, backgroundColor: Colors.sky, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  locationTitle:    { fontFamily: Font.sansBold, fontSize: 12, color: Colors.sky },
  locationAddr:     { fontFamily: Font.sans, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  cancelBtn:        { width: '100%', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.red, borderRadius: 13, padding: 14, alignItems: 'center' },
  cancelText:       { fontFamily: Font.sansBold, fontSize: 14, color: Colors.red },
})