import { Colors, Font, Radius, Shadow } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'

type AppointmentType = 'appointment' | 'test' | 'therapy' | 'medication-review' | 'other'

type Schedule = {
  id: string
  title: string
  type: AppointmentType
  date: string
  time: string
  doctor_name: string | null
  location: string | null
  notes: string | null
}

const TYPE_CONFIG: Record<AppointmentType, { icon: string; color: string; bg: string; label: string }> = {
  'appointment':       { icon: '🩺', color: Colors.sky,   bg: Colors.skySoft,   label: 'Doctor Visit'       },
  'test':              { icon: '🩸', color: Colors.red,   bg: Colors.redSoft,   label: 'Medical Test'       },
  'therapy':           { icon: '🧘', color: Colors.sage,  bg: Colors.sagePale,  label: 'Therapy'            },
  'medication-review': { icon: '💊', color: Colors.amber, bg: Colors.amberSoft, label: 'Medication Review'  },
  'other':             { icon: '📋', color: Colors.textMid, bg: Colors.border,  label: 'Other'              },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (date.toDateString() === today.toDateString())    return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) >= new Date(new Date().toDateString())
}

export default function ScheduleScreen() {
  const router = useRouter()

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)

  // Form state
  const [form, setForm] = useState({
    title:       '',
    type:        'appointment' as AppointmentType,
    date:        '',
    time:        '',
    doctor_name: '',
    location:    '',
    notes:       '',
  })

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const loadSchedules = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (error) throw error
      setSchedules(data ?? [])
    } catch (e) {
      console.log('Schedule load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSchedules() }, [loadSchedules])

  async function handleSave() {
    if (!form.title.trim()) {
      Alert.alert('Missing title', 'Please enter an appointment title.')
      return
    }
    if (!form.date.trim()) {
      Alert.alert('Missing date', 'Please enter a date (e.g. 2026-07-15).')
      return
    }
    if (!form.time.trim()) {
      Alert.alert('Missing time', 'Please enter a time (e.g. 10:30 AM).')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('schedules').insert({
        user_id:     user.id,
        title:       form.title.trim(),
        type:        form.type,
        date:        form.date.trim(),
        time:        form.time.trim(),
        doctor_name: form.doctor_name.trim() || null,
        location:    form.location.trim()    || null,
        notes:       form.notes.trim()       || null,
      })

      if (error) throw error

      setShowModal(false)
      setForm({ title: '', type: 'appointment', date: '', time: '', doctor_name: '', location: '', notes: '' })
      loadSchedules()
      Alert.alert('✓ Saved', 'Appointment added to your schedule.')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save appointment.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    Alert.alert(
      'Delete appointment',
      'Are you sure you want to remove this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await supabase.from('schedules').delete().eq('id', id)
            loadSchedules()
          },
        },
      ]
    )
  }

  const upcoming = schedules.filter(s => isUpcoming(s.date))
  const past     = schedules.filter(s => !isUpcoming(s.date))

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Schedule</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} size="large" />
      ) : (
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

          {/* Upcoming */}
          <Text style={styles.sectionLabel}>Upcoming</Text>
          {upcoming.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No upcoming appointments</Text>
              <Text style={styles.emptySub}>Tap + Add to schedule one.</Text>
            </View>
          ) : (
            upcoming.map(s => {
              const cfg = TYPE_CONFIG[s.type] ?? TYPE_CONFIG.other
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.card, Shadow.sm]}
                  onLongPress={() => handleDelete(s.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.cardIcon, { backgroundColor: cfg.bg }]}>
                    <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{s.title}</Text>
                    {s.doctor_name ? <Text style={styles.cardSub}>{s.doctor_name}</Text> : null}
                    {s.location    ? <Text style={styles.cardSub}>📍 {s.location}</Text>    : null}
                    {s.notes       ? <Text style={styles.cardNotes}>{s.notes}</Text>        : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.cardDate}>{formatDate(s.date)}</Text>
                    <Text style={styles.cardTime}>{s.time}</Text>
                  </View>
                </TouchableOpacity>
              )
            })
          )}

          {/* Past */}
          {past.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Past</Text>
              {past.map(s => {
                const cfg = TYPE_CONFIG[s.type] ?? TYPE_CONFIG.other
                return (
                  <View key={s.id} style={[styles.card, styles.cardPast, Shadow.sm]}>
                    <View style={[styles.cardIcon, { backgroundColor: cfg.bg, opacity: 0.5 }]}>
                      <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: Colors.textMuted }]}>{s.title}</Text>
                      {s.doctor_name ? <Text style={styles.cardSub}>{s.doctor_name}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardDate}>{formatDate(s.date)}</Text>
                      <Text style={styles.cardTime}>{s.time}</Text>
                    </View>
                  </View>
                )
              })}
            </>
          )}

          <Text style={styles.hint}>Long press any appointment to delete it.</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Add Appointment Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Appointment</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color={Colors.sage} />
                : <Text style={styles.modalSave}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">

            {/* Type selector */}
            <Text style={styles.fieldLabel}>TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(Object.keys(TYPE_CONFIG) as AppointmentType[]).map(t => {
                  const cfg = TYPE_CONFIG[t]
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typePill, form.type === t && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                      onPress={() => setForm(prev => ({ ...prev, type: t }))}
                    >
                      <Text>{cfg.icon}</Text>
                      <Text style={[styles.typePillText, form.type === t && { color: cfg.color }]}>
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>TITLE *</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={set('title')}
              placeholder="e.g. Dr. Patel - Cardiology"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>DATE * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={form.date}
                  onChangeText={set('date')}
                  placeholder="2026-07-15"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>TIME *</Text>
                <TextInput
                  style={styles.input}
                  value={form.time}
                  onChangeText={set('time')}
                  placeholder="10:30 AM"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>DOCTOR / SPECIALIST</Text>
            <TextInput
              style={styles.input}
              value={form.doctor_name}
              onChangeText={set('doctor_name')}
              placeholder="Dr. Ananya Patel"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fieldLabel}>LOCATION</Text>
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={set('location')}
              placeholder="City Hospital, Room 204"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fieldLabel}>NOTES</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={form.notes}
              onChangeText={set('notes')}
              placeholder="Bring blood test results..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.sageDark },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  backArrow:  { color: '#fff', fontSize: 18 },
  title:      { fontFamily: 'Lora_600SemiBold', fontSize: 20, color: '#fff' },
  addBtn:     { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  addBtnText: { fontFamily: Font.sansBold, fontSize: 13, color: '#fff' },
  body:       { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 8, padding: 20 },
  sectionLabel: { fontFamily: Font.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: Colors.textMuted, marginBottom: 12 },
  card:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  cardPast:   { opacity: 0.6 },
  cardIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle:  { fontFamily: Font.sansBold, fontSize: 13, color: Colors.text, marginBottom: 2 },
  cardSub:    { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  cardNotes:  { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginTop: 3, fontStyle: 'italic' },
  cardDate:   { fontFamily: Font.sansBold, fontSize: 11, color: Colors.sage },
  cardTime:   { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted },
  typeBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeBadgeText: { fontFamily: Font.sansBold, fontSize: 9 },
  emptyWrap:  { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Font.sansBold, fontSize: 15, color: Colors.text, marginBottom: 6 },
  emptySub:   { fontFamily: Font.sans, fontSize: 13, color: Colors.textMuted },
  hint:       { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 16 },
  // Modal
  modalSafe:    { flex: 1, backgroundColor: Colors.cream },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalCancel:  { fontFamily: Font.sans, fontSize: 15, color: Colors.textMuted },
  modalTitle:   { fontFamily: 'Lora_600SemiBold', fontSize: 17, color: Colors.text },
  modalSave:    { fontFamily: Font.sansBold, fontSize: 15, color: Colors.sage },
  modalBody:    { padding: 20 },
  fieldLabel:   { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMid, letterSpacing: 0.5, marginBottom: 5, marginTop: 12 },
  fieldRow:     { flexDirection: 'row', gap: 10 },
  input:        { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, padding: 12, fontSize: 14, fontFamily: Font.sans, color: Colors.text },
  typePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.borderMid, backgroundColor: Colors.white },
  typePillText: { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMid },
})