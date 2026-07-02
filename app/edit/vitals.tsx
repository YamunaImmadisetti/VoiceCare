import { Colors, Font, Radius } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator, Alert,
    SafeAreaView, ScrollView,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

export default function EditVitalsScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    bpm:        '',
    systolic:   '',
    diastolic:  '',
    weight:     '',
    height:     '',
    blood_type: '',
  })

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  useEffect(() => { loadVitals() }, [])

  async function loadVitals() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('vitals')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setForm({
          bpm:        data.bpm?.toString()       ?? '',
          systolic:   data.systolic?.toString()  ?? '',
          diastolic:  data.diastolic?.toString() ?? '',
          weight:     data.weight?.toString()    ?? '',
          height:     data.height?.toString()    ?? '',
          blood_type: data.blood_type            ?? '',
        })
      }
    } catch (e) {
      console.log('Load vitals error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('vitals')
        .update({
          bpm:        parseInt(form.bpm)       || null,
          systolic:   parseInt(form.systolic)  || null,
          diastolic:  parseInt(form.diastolic) || null,
          weight:     parseFloat(form.weight)  || null,
          height:     parseFloat(form.height)  || null,
          blood_type: form.blood_type          || null,
        })
        .eq('user_id', user.id)
      if (error) throw error
      Alert.alert('✓ Saved', 'Your vitals have been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#fff" size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Vitals & Measurements</Text>
          <Text style={styles.sub}>Update your health readings</Text>
        </View>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">

        {/* Heart Rate */}
        <View style={styles.vitalCard}>
          <Text style={styles.vitalTitle}>❤️ Heart Rate</Text>
          <Text style={styles.vitalHint}>Normal: 60–100 bpm</Text>
          <View style={styles.vitalRow}>
            <TextInput style={[styles.vitalInput, { flex: 1 }]} value={form.bpm} onChangeText={set('bpm')} placeholder="72" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
            <Text style={styles.vitalUnit}>bpm</Text>
          </View>
        </View>

        {/* Blood Pressure */}
        <View style={styles.vitalCard}>
          <Text style={styles.vitalTitle}>🩺 Blood Pressure</Text>
          <Text style={styles.vitalHint}>Normal: &lt;120/&lt;80 mmHg</Text>
          <View style={styles.vitalRow}>
            <TextInput style={[styles.vitalInput, { flex: 1 }]} value={form.systolic} onChangeText={set('systolic')} placeholder="118" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
            <Text style={styles.vitalSep}>/</Text>
            <TextInput style={[styles.vitalInput, { flex: 1 }]} value={form.diastolic} onChangeText={set('diastolic')} placeholder="76" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
            <Text style={styles.vitalUnit}>mmHg</Text>
          </View>
        </View>

        {/* Weight & Height */}
        <View style={styles.fieldRow}>
          <View style={[styles.vitalCard, { flex: 1 }]}>
            <Text style={styles.vitalTitle}>⚖️ Weight</Text>
            <View style={styles.vitalRow}>
              <TextInput style={[styles.vitalInput, { flex: 1 }]} value={form.weight} onChangeText={set('weight')} placeholder="68" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
              <Text style={styles.vitalUnit}>kg</Text>
            </View>
          </View>
          <View style={[styles.vitalCard, { flex: 1 }]}>
            <Text style={styles.vitalTitle}>📏 Height</Text>
            <View style={styles.vitalRow}>
              <TextInput style={[styles.vitalInput, { flex: 1 }]} value={form.height} onChangeText={set('height')} placeholder="162" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
              <Text style={styles.vitalUnit}>cm</Text>
            </View>
          </View>
        </View>

        {/* Blood Type */}
        <Text style={styles.label}>BLOOD TYPE</Text>
        <View style={styles.pillRow}>
          {BLOOD_TYPES.map(bt => (
            <TouchableOpacity
              key={bt}
              style={[styles.pill, form.blood_type === bt && styles.pillActive]}
              onPress={() => setForm(prev => ({ ...prev, blood_type: bt }))}
            >
              <Text style={[styles.pillText, form.blood_type === bt && styles.pillTextActive]}>{bt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Changes ✓</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.sageDark },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  backArrow:     { color: '#fff', fontSize: 18 },
  title:         { fontFamily: 'Lora_600SemiBold', fontSize: 18, color: '#fff' },
  sub:           { fontFamily: Font.sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  body:          { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 8, padding: 20 },
  vitalCard:     { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  vitalTitle:    { fontFamily: Font.sansBold, fontSize: 13, color: Colors.text, marginBottom: 2 },
  vitalHint:     { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginBottom: 10 },
  vitalRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vitalInput:    { backgroundColor: Colors.sagePale, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, padding: 10, fontSize: 20, fontFamily: Font.sansBold, color: Colors.text, textAlign: 'center' },
  vitalSep:      { fontSize: 20, color: Colors.textMuted },
  vitalUnit:     { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMuted, minWidth: 36 },
  fieldRow:      { flexDirection: 'row', gap: 10 },
  label:         { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMid, letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  pillRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.borderMid, backgroundColor: Colors.white },
  pillActive:    { backgroundColor: Colors.sage, borderColor: Colors.sage },
  pillText:      { fontFamily: Font.sansBold, fontSize: 12, color: Colors.textMid },
  pillTextActive:{ color: '#fff' },
  saveBtn:       { backgroundColor: Colors.sageDark, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  saveBtnText:   { fontFamily: Font.sansBold, fontSize: 15, color: '#fff' },
})