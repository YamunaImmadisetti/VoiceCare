import { useCallback, useEffect, useState } from 'react'
import {
  SafeAreaView, ScrollView, View, Text, TextInput,
  TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors, Font, Radius } from '@/constants/theme'

type Contact = {
  id: string
  first_name: string
  last_name: string
  relationship: string
  phone: string
  notify_via: string
  priority: number
}

const RELATIONSHIPS = ['Son', 'Daughter', 'Spouse', 'Sibling', 'Friend', 'Caregiver', 'Other']
const NOTIFY_OPTIONS = ['Call + SMS', 'SMS only', 'App only']
const EMPTY_CONTACT  = { first_name: '', last_name: '', relationship: 'Son', phone: '', notify_via: 'Call + SMS' }

export default function EditContactsScreen() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newContact, setNewContact] = useState({ ...EMPTY_CONTACT })

  const setField = (key: keyof typeof newContact) => (val: string) =>
    setNewContact(prev => ({ ...prev, [key]: val }))

  const loadContacts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
      setContacts(data ?? [])
    } catch (e) {
      console.log('Load contacts error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadContacts() }, [loadContacts])

  async function handleAdd() {
    if (!newContact.first_name.trim()) {
      Alert.alert('Missing name', 'Please enter the contact first name.')
      return
    }
    if (!newContact.phone.trim()) {
      Alert.alert('Missing phone', 'Please enter the contact phone number.')
      return
    }
    if (contacts.length >= 3) {
      Alert.alert('Limit reached', 'You can only add up to 3 emergency contacts.')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('emergency_contacts').insert({
        user_id:      user.id,
        first_name:   newContact.first_name.trim(),
        last_name:    newContact.last_name.trim(),
        relationship: newContact.relationship,
        phone:        newContact.phone.trim(),
        notify_via:   newContact.notify_via,
        priority:     contacts.length + 1,
      })
      if (error) throw error
      setNewContact({ ...EMPTY_CONTACT })
      setShowForm(false)
      loadContacts()
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert(
      'Remove contact',
      `Remove ${name} from emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await supabase.from('emergency_contacts').delete().eq('id', id)
            loadContacts()
          },
        },
      ]
    )
  }

  const priorityColor = (i: number) => i === 0 ? Colors.red : i === 1 ? Colors.amber : Colors.sky
  const priorityBg    = (i: number) => i === 0 ? Colors.redSoft : i === 1 ? Colors.amberSoft : Colors.skySoft
  const priorityLabel = (i: number) => i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'

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
          <Text style={styles.title}>Emergency Contacts</Text>
          <Text style={styles.sub}>Called in priority order during alerts</Text>
        </View>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">

        {contacts.map((c, i) => (
          <View key={c.id} style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={[styles.avatar, { backgroundColor: priorityBg(i) }]}>
                <Text style={[styles.avatarText, { color: priorityColor(i) }]}>
                  {c.first_name[0]}{c.last_name[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{c.first_name} {c.last_name}</Text>
                <Text style={styles.contactDetail}>{c.relationship} · {c.phone}</Text>
                <Text style={styles.contactDetail}>{c.notify_via}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[styles.priorityBadge, { backgroundColor: priorityBg(i) }]}>
                  <Text style={[styles.priorityText, { color: priorityColor(i) }]}>{priorityLabel(i)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(c.id, `${c.first_name} ${c.last_name}`)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Contact</Text>

            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>FIRST NAME</Text>
                <TextInput style={styles.input} value={newContact.first_name} onChangeText={setField('first_name')} placeholder="John" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>LAST NAME</Text>
                <TextInput style={styles.input} value={newContact.last_name} onChangeText={setField('last_name')} placeholder="Wilson" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <Text style={styles.label}>RELATIONSHIP</Text>
            <View style={styles.pillRow}>
              {RELATIONSHIPS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, newContact.relationship === r && styles.pillActive]}
                  onPress={() => setNewContact(prev => ({ ...prev, relationship: r }))}
                >
                  <Text style={[styles.pillText, newContact.relationship === r && styles.pillTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>PHONE NUMBER</Text>
            <TextInput style={styles.input} value={newContact.phone} onChangeText={setField('phone')} placeholder="+49 170 000 0000" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

            <Text style={styles.label}>NOTIFY VIA</Text>
            <View style={styles.pillRow}>
              {NOTIFY_OPTIONS.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.pill, newContact.notify_via === n && styles.pillActive]}
                  onPress={() => setNewContact(prev => ({ ...prev, notify_via: n }))}
                >
                  <Text style={[styles.pillText, newContact.notify_via === n && styles.pillTextActive]}>{n}</Text>
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
                  : <Text style={styles.saveBtnText}>Add Contact</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : contacts.length < 3 ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ Add Emergency Contact</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.infoNote}>
            <Text style={styles.infoText}>Maximum 3 emergency contacts added.</Text>
          </View>
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
  contactCard:    { backgroundColor: Colors.white, borderRadius: 13, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  contactHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:         { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontFamily: Font.sansBold, fontSize: 13 },
  contactName:    { fontFamily: Font.sansBold, fontSize: 13, color: Colors.text },
  contactDetail:  { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  priorityBadge:  { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  priorityText:   { fontFamily: Font.sansBold, fontSize: 10 },
  deleteBtn:      { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText:  { fontSize: 12, color: Colors.red, fontFamily: Font.sansBold },
  formCard:       { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  formTitle:      { fontFamily: 'Lora_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 4 },
  fieldRow:       { flexDirection: 'row', gap: 10 },
  label:          { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMid, letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  input:          { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, padding: 12, fontSize: 14, fontFamily: Font.sans, color: Colors.text },
  pillRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.borderMid, backgroundColor: Colors.white },
  pillActive:     { backgroundColor: Colors.sage, borderColor: Colors.sage },
  pillText:       { fontFamily: Font.sansBold, fontSize: 11, color: Colors.textMid },
  pillTextActive: { color: '#fff' },
  formBtns:       { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:      { paddingHorizontal: 18, paddingVertical: 13, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.borderMid },
  cancelBtnText:  { fontFamily: Font.sansBold, fontSize: 13, color: Colors.textMid },
  saveBtn:        { backgroundColor: Colors.sageDark, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  saveBtnText:    { fontFamily: Font.sansBold, fontSize: 14, color: '#fff' },
  addBtn:         { borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.borderMid, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  addBtnText:     { fontFamily: Font.sansBold, fontSize: 13, color: Colors.sage },
  infoNote:       { backgroundColor: Colors.skySoft, borderRadius: 10, padding: 12, alignItems: 'center' },
  infoText:       { fontFamily: Font.sans, fontSize: 12, color: Colors.sky },
})