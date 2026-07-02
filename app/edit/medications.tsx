import { useCallback, useEffect, useState } from 'react'
import {
  SafeAreaView, ScrollView, View, Text, TextInput,
  TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors, Font, Radius } from '@/constants/theme'

type Med = {
  id: string
  name: string
  dosage: string
  form: string
  frequencies: string[]
  time: string
  with_food: string
}

const FREQUENCIES = ['Morning', 'Afternoon', 'Evening', 'Bedtime']
const FORMS       = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops']
const WITH_FOOD   = ['With food', 'Before food', 'After food', 'Anytime']

const EMPTY_MED = { name: '', dosage: '', form: 'Tablet', frequencies: ['Morning'], time: '08:00 AM', with_food: 'With food' }

export default function EditMedicationsScreen() {
  const router = useRouter()
  const [meds, setMeds]       = useState<Med[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newMed, setNewMed]   = useState({ ...EMPTY_MED })

  const setField = (key: keyof typeof newMed) => (val: string) =>
    setNewMed(prev => ({ ...prev, [key]: val }))

  const toggleFreq = (freq: string) => {
    setNewMed(prev => ({
      ...prev,
      frequencies: prev.frequencies.includes(freq)
        ? prev.frequencies.filter(f => f !== freq)
        : [...prev.frequencies, freq],
    }))
  }

  const loadMeds = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      setMeds(data ?? [])
    } catch (e) {
      console.log('Load meds error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMeds() }, [loadMeds])

  async function handleAdd() {
    if (!newMed.name.trim()) {
      Alert.alert('Missing name', 'Please enter the medication name.')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('medications').insert({
        user_id:     user.id,
        name:        newMed.name.trim(),
        dosage:      newMed.dosage.trim(),
        form:        newMed.form,
        frequencies: newMed.frequencies,
        time:        newMed.time,
        with_food:   newMed.with_food,
        active:      true,
      })
      if (error) throw error
      setNewMed({ ...EMPTY_MED })
      setShowForm(false)
      loadMeds()
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert(
      'Remove medication',
      `Remove ${name} from your medications?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await supabase.from('medications').delete().eq('id', id)
            loadMeds()
          },
        },
      ]
    )
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Medications</Text>
          <Text style={styles.sub}>{meds.length} active medications</Text>
        </View>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">

        {/* Existing meds */}
        {meds.map(m => (
          <View key={m.id} style={styles.medCard}>
            <View style={styles.medCardHeader}>
              <View style={styles.medBadge}>
                <Text style={styles.medBadgeText}>💊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{m.name} {m.dosage}</Text>
                <Text style={styles.medDetail}>{m.frequencies?.join(', ')} · {m.time} · {m.with_food}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(m.id, m.name)}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add new med form */}
        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Medication</Text>

            <Text style={styles.label}>MEDICATION NAME</Text>
            <TextInput style={styles.input} value={newMed.name} onChangeText={setField('name')} placeholder="e.g. Metformin" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.label}>DOSAGE</Text>
            <TextInput style={styles.input} value={newMed.dosage} onChangeText={setField('dosage')} placeholder="e.g. 500mg" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.label}>FORM</Text>
            <View style={styles.pillRow}>
              {FORMS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.pill, newMed.form === f && styles.pillActive]}
                  onPress={() => setNewMed(prev => ({ ...prev, form: f }))}
                >
                  <Text style={[styles.pillText, newMed.form === f && styles.pillTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>FREQUENCY</Text>
            <View style={styles.pillRow}>
              {FREQUENCIES.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.pill, newMed.frequencies.includes(f) && styles.pillActive]}
                  onPress={() => toggleFreq(f)}
                >
                  <Text style={[styles.pillText, newMed.frequencies.includes(f) && styles.pillTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>TIME</Text>
            <TextInput style={styles.input} value={newMed.time} onChangeText={setField('time')} placeholder="08:00 AM" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.label}>WITH FOOD?</Text>
            <View style={styles.pillRow}>
              {WITH_FOOD.map(w => (
                <TouchableOpacity
                  key={w}
                  style={[styles.pill, newMed.with_food === w && styles.pillActive]}
                  onPress={() => setNewMed(prev => ({ ...prev, with_food: w }))}
                >
                  <Text style={[styles.pillText, newMed.with_food === w && styles.pillTextActive]}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { flex: 1 }, saving && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Add Medication</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ Add Medication</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.sageDark },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  backArrow:      { color: '#fff', fontSize: 18 },
  title:          { fontFamily: 'Lora_600SemiBold', fontSize: 18, color: '#fff' },
  sub:            { fontFamily: Font.sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  body:           { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 8, padding: 20 },
  medCard:        { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  medCardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medBadge:       { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.amberSoft, alignItems: 'center', justifyContent: 'center' },
  medBadgeText:   { fontSize: 16 },
  medName:        { fontFamily: Font.sansBold, fontSize: 13, color: Colors.text },
  medDetail:      { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  deleteBtn:      { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText:  { fontSize: 12, color: Colors.red, fontFamily: Font.sansBold },
  formCard:       { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  formTitle:      { fontFamily: 'Lora_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 4 },
  label:          { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMid, letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  input:          { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, padding: 12, fontSize: 14, fontFamily: Font.sans, color: Colors.text },
  pillRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.borderMid, backgroundColor: Colors.white },
  pillActive:     { backgroundColor: Colors.amber, borderColor: Colors.amber },
  pillText:       { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMid },
  pillTextActive: { color: '#fff' },
  formBtns:       { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:      { paddingHorizontal: 18, paddingVertical: 13, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.borderMid },
  cancelBtnText:  { fontFamily: Font.sansBold, fontSize: 13, color: Colors.textMid },
  saveBtn:        { backgroundColor: Colors.sageDark, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  saveBtnText:    { fontFamily: Font.sansBold, fontSize: 14, color: '#fff' },
  addBtn:         { borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.borderMid, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  addBtnText:     { fontFamily: Font.sansBold, fontSize: 13, color: Colors.sage },
})