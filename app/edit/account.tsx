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

export default function EditAccountScreen() {
  const router = useRouter()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [form, setForm] = useState({
    full_name:     '',
    phone:         '',
    address:       '',
    date_of_birth: '',
  })

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setForm({
          full_name:     data.full_name     ?? '',
          phone:         data.phone         ?? '',
          address:       data.address       ?? '',
          date_of_birth: data.date_of_birth ?? '',
        })
      }
    } catch (e) {
      console.log('Load error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.full_name.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name:     form.full_name.trim(),
          phone:         form.phone.trim(),
          address:       form.address.trim(),
          date_of_birth: form.date_of_birth.trim() || null,
        })
        .eq('id', user.id)
      if (error) throw error
      Alert.alert('✓ Saved', 'Your details have been updated.', [
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
          <Text style={styles.title}>Personal Details</Text>
          <Text style={styles.sub}>Update your account information</Text>
        </View>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>FULL NAME</Text>
        <TextInput style={styles.input} value={form.full_name} onChangeText={set('full_name')} placeholder="Your full name" placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>DATE OF BIRTH (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={form.date_of_birth} onChangeText={set('date_of_birth')} placeholder="1948-03-12" placeholderTextColor={Colors.textMuted} keyboardType="numbers-and-punctuation" />

        <Text style={styles.label}>PHONE NUMBER</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={set('phone')} placeholder="+49 170 000 0000" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

        <Text style={styles.label}>HOME ADDRESS</Text>
        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.address} onChangeText={set('address')} placeholder="Street, City, Postcode" placeholderTextColor={Colors.textMuted} multiline />

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
  safe:       { flex: 1, backgroundColor: Colors.sageDark },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  backArrow:  { color: '#fff', fontSize: 18 },
  title:      { fontFamily: 'Lora_600SemiBold', fontSize: 18, color: '#fff' },
  sub:        { fontFamily: Font.sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  body:       { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 8, padding: 20 },
  label:      { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMid, letterSpacing: 0.5, marginBottom: 5, marginTop: 14 },
  input:      { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, padding: 12, fontSize: 14, fontFamily: Font.sans, color: Colors.text },
  saveBtn:    { backgroundColor: Colors.sageDark, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  saveBtnText:{ fontFamily: Font.sansBold, fontSize: 15, color: '#fff' },
})