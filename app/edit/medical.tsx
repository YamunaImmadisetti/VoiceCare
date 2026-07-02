import { useEffect, useState } from 'react'
import {
  SafeAreaView, ScrollView, View, Text, TextInput,
  TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors, Font, Radius } from '@/constants/theme'

const CONDITIONS = [
  { id: 'heart_disease',  label: 'Heart Disease',  icon: '🫀' },
  { id: 'diabetes',       label: 'Diabetes',        icon: '🩸' },
  { id: 'asthma',         label: 'Asthma',          icon: '🫁' },
  { id: 'arthritis',      label: 'Arthritis',       icon: '🦴' },
  { id: 'dementia',       label: 'Dementia',        icon: '🧠' },
  { id: 'hypertension',   label: 'Hypertension',    icon: '🩻' },
  { id: 'glaucoma',       label: 'Glaucoma',        icon: '👁️' },
  { id: 'osteoporosis',   label: 'Osteoporosis',    icon: '🦷' },
]

export default function EditMedicalScreen() {
  const router = useRouter()
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [conditions, setConditions] = useState<string[]>([])
  const [allergies, setAllergies]   = useState<string[]>([])
  const [allergyInput, setAllergyInput] = useState('')
  const [notes, setNotes]           = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [doctorPhone, setDoctorPhone] = useState('')

  useEffect(() => { loadMedical() }, [])

  async function loadMedical() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('medical_history')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setConditions(data.conditions ?? [])
        setAllergies(data.allergies   ?? [])
        setNotes(data.notes           ?? '')
        setDoctorName(data.doctor_name   ?? '')
        setDoctorPhone(data.doctor_phone ?? '')
      }
    } catch (e) {
      console.log('Load medical error:', e)
    } finally {
      setLoading(false)
    }
  }

  function toggleCondition(id: string) {
    setConditions(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function addAllergy() {
    const trimmed = allergyInput.trim()
    if (!trimmed || allergies.includes(trimmed)) return
    setAllergies(prev => [...prev, trimmed])
    setAllergyInput('')
  }

  function removeAllergy(a: string) {
    setAllergies(prev => prev.filter(x => x !== a))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('medical_history')
        .update({
          conditions,
          allergies,
          notes:        notes.trim()       || null,
          doctor_name:  doctorName.trim()  || null,
          doctor_phone: doctorPhone.trim() || null,
        })
        .eq('user_id', user.id)
      if (error) throw error
      Alert.alert('✓ Saved', 'Medical history updated.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save.')
    } finally {
      setSaving(false)
    }
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
          <Text style={styles.title}>Medical History</Text>
          <Text style={styles.sub}>Conditions, allergies & notes</Text>
        </View>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>CONDITIONS</Text>
        <View style={styles.conditionGrid}>
          {CONDITIONS.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.conditionCard, conditions.includes(c.id) && styles.conditionCardActive]}
              onPress={() => toggleCondition(c.id)}
            >
              <Text style={styles.conditionIcon}>{c.icon}</Text>
              <Text style={[styles.conditionLabel, conditions.includes(c.id) && styles.conditionLabelActive]}>
                {c.label}
              </Text>
              <View style={[styles.conditionCheck, conditions.includes(c.id) && styles.conditionCheckActive]}>
                {conditions.includes(c.id) && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ALLERGIES</Text>
        <View style={styles.allergyWrap}>
          {allergies.map(a => (
            <TouchableOpacity key={a} style={styles.allergyTag} onPress={() => removeAllergy(a)}>
              <Text style={styles.allergyText}>{a} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.allergyInputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={allergyInput}
            onChangeText={setAllergyInput}
            placeholder="Type allergy and press Add"
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={addAllergy}
          />
          <TouchableOpacity style={styles.addAllergyBtn} onPress={addAllergy}>
            <Text style={styles.addAllergyText}>Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>PAST SURGERIES / NOTES</Text>
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Hip replacement 2019…"
          placeholderTextColor={Colors.textMuted}
          multiline
        />

        <Text style={styles.label}>PRIMARY DOCTOR</Text>
        <TextInput style={styles.input} value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Ananya Patel" placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>DOCTOR&apos;S PHONE</Text>
        <TextInput style={styles.input} value={doctorPhone} onChangeText={setDoctorPhone} placeholder="+49 421 000 1234" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

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
  safe:                 { flex: 1, backgroundColor: Colors.sageDark },
  header:               { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn:              { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  backArrow:            { color: '#fff', fontSize: 18 },
  title:                { fontFamily: 'Lora_600SemiBold', fontSize: 18, color: '#fff' },
  sub:                  { fontFamily: Font.sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  body:                 { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 8, padding: 20 },
  label:                { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMid, letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  conditionGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  conditionCard:        { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: 10, padding: 10, borderWidth: 1.5, borderColor: Colors.border },
  conditionCardActive:  { borderColor: Colors.sage, backgroundColor: Colors.sagePale },
  conditionIcon:        { fontSize: 16 },
  conditionLabel:       { flex: 1, fontFamily: Font.sansBold, fontSize: 11, color: Colors.text },
  conditionLabelActive: { color: Colors.sageDark },
  conditionCheck:       { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.borderMid, alignItems: 'center', justifyContent: 'center' },
  conditionCheckActive: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  allergyWrap:          { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 },
  allergyTag:           { backgroundColor: Colors.redSoft, borderWidth: 1, borderColor: 'rgba(201,64,64,0.2)', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  allergyText:          { fontFamily: Font.sansBold, fontSize: 11, color: Colors.red },
  allergyInputRow:      { flexDirection: 'row', gap: 8, marginBottom: 4 },
  addAllergyBtn:        { backgroundColor: Colors.sageDark, borderRadius: Radius.sm, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },
  addAllergyText:       { fontFamily: Font.sansBold, fontSize: 13, color: '#fff' },
  input:                { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, padding: 12, fontSize: 14, fontFamily: Font.sans, color: Colors.text },
  saveBtn:              { backgroundColor: Colors.sageDark, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  saveBtnText:          { fontFamily: Font.sansBold, fontSize: 15, color: '#fff' },
})