// app/onboarding/contacts.tsx
import { InfoNote } from '@/components/ui/InfoNote'
import { NavRow } from '@/components/ui/NavRow'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { StepBar } from '@/components/ui/StepBar'
import { Colors, Font, Radius } from '@/constants/theme'
import { useOnboarding } from '@/context/OnboardingContext'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// ── Types ──────────────────────────────────────
type Relationship = 'Son' | 'Daughter' | 'Spouse' | 'Sibling' | 'Friend' | 'Other'
type NotifyMethod = 'Call + SMS' | 'SMS only' | 'App only'

interface Contact {
  id: string
  firstName: string
  lastName: string
  relationship: Relationship | ''
  phone: string
  notifyVia: NotifyMethod
}

const RELATIONSHIPS: Relationship[] = ['Son', 'Daughter', 'Spouse', 'Sibling', 'Friend', 'Other']
const NOTIFY_METHODS: NotifyMethod[] = ['Call + SMS', 'SMS only', 'App only']
const PRIORITY_LABELS = ['Primary', 'Secondary', 'Tertiary']
const PRIORITY_COLORS = [Colors.sky, Colors.sage, Colors.amber]

function makeEmptyContact(): Contact {
  return {
    id: Date.now().toString(),
    firstName: '',
    lastName: '',
    relationship: '',
    phone: '',
    notifyVia: 'Call + SMS',
  }
}

// ── Field ──────────────────────────────────────
function Field({
  label, placeholder, value, onChangeText, keyboardType = 'default',
}: {
  label: string
  placeholder: string
  value: string
  onChangeText: (v: string) => void
  keyboardType?: 'default' | 'phone-pad' | 'email-address'
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          focused && styles.fieldInputFocused,
          value.length > 0 && styles.fieldInputFilled,
        ]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="words"
      />
    </View>
  )
}

// ── Avatar ─────────────────────────────────────
function Avatar({ firstName, lastName, color }: {
  firstName: string; lastName: string; color: string
}) {
  const initials = `${firstName[0] ?? '?'}${lastName[0] ?? ''}`.toUpperCase()
  return (
    <View style={[styles.avatar, { backgroundColor: color + '22' }]}>
      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
    </View>
  )
}

// ── Contact Card ───────────────────────────────
function ContactCard({
  contact, index, onChange, onRemove, canRemove,
}: {
  contact: Contact
  index: number
  onChange: (updated: Contact) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const priorityColor = PRIORITY_COLORS[index] ?? Colors.sage
  const set = <K extends keyof Contact>(key: K, val: Contact[K]) =>
    onChange({ ...contact, [key]: val })

  return (
    <View style={styles.contactCard}>

      {/* Header */}
      <View style={styles.contactHead}>
        <Avatar firstName={contact.firstName} lastName={contact.lastName} color={priorityColor} />
        <View style={styles.contactHeadText}>
          <Text style={styles.contactNum}>Contact #{index + 1}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {PRIORITY_LABELS[index]}
            </Text>
          </View>
        </View>
        {canRemove && (
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove} activeOpacity={0.7}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Name row */}
      <View style={[styles.row, { marginBottom: 10 }]}>
        <Field label="FIRST NAME" placeholder="John"
          value={contact.firstName} onChangeText={v => set('firstName', v)} />
        <View style={{ width: 10 }} />
        <Field label="LAST NAME" placeholder="Wilson"
          value={contact.lastName} onChangeText={v => set('lastName', v)} />
      </View>

      {/* Relationship */}
      <View style={{ marginBottom: 10 }}>
        <Text style={styles.fieldLabel}>RELATIONSHIP</Text>
        <View style={styles.pillRow}>
          {RELATIONSHIPS.map(r => (
            <TouchableOpacity
              key={r}
              style={[
                styles.pill,
                contact.relationship === r && {
                  backgroundColor: priorityColor,
                  borderColor: priorityColor,
                },
              ]}
              onPress={() => set('relationship', r)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.pillText,
                contact.relationship === r && styles.pillTextOn,
              ]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Phone + Notify */}
      <View style={styles.row}>
        <Field
          label="PHONE NUMBER" placeholder="+49 170 000 0000"
          value={contact.phone} onChangeText={v => set('phone', v)}
          keyboardType="phone-pad"
        />
        <View style={{ width: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>NOTIFY VIA</Text>
          <View style={styles.pillRow}>
            {NOTIFY_METHODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.pill, styles.pillSm,
                  contact.notifyVia === m && {
                    backgroundColor: Colors.sageDark,
                    borderColor: Colors.sageDark,
                  },
                ]}
                onPress={() => set('notifyVia', m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, contact.notifyVia === m && styles.pillTextOn]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

    </View>
  )
}

// ── Main Screen ────────────────────────────────
export default function ContactsScreen() {
  const router = useRouter()
  const { data, setContacts } = useOnboarding()                    // 👈 move this above
  const [contacts, setContactsLocal] = useState<Contact[]>(        // 👈 rename to setContactsLocal
  data.contacts.length > 0
    ? data.contacts
    : [makeEmptyContact()]
)

  function updateContact(id: string, updated: Contact) {
    setContactsLocal(prev => prev.map(c => c.id === id ? updated : c))
  }

  function removeContact(id: string) {
    setContactsLocal(prev => prev.filter(c => c.id !== id))
  }

  function addContact() {
    if (contacts.length >= 3) return
    setContactsLocal(prev => [...prev, makeEmptyContact()])
  }
   // 3. Add handleNext
  function handleNext() {
    setContacts(contacts)                              // 👈 save to context
    router.push('/onboarding/complete')
  }

  return (
    <SafeAreaView style={styles.safe}>

      <StepBar current={4} total={6} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          stepLabel="Step 5 of 6 · Emergency Contacts"
          title={"Who do we call\nin an emergency?"}
          sub="Add up to 3 contacts in priority order."
        />

        {contacts.map((contact, index) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            index={index}
            onChange={updated => updateContact(contact.id, updated)}
            onRemove={() => removeContact(contact.id)}
            canRemove={contacts.length > 1}
          />
        ))}

        {contacts.length < 3 && (
          <TouchableOpacity style={styles.addBtn} onPress={addContact} activeOpacity={0.7}>
            <Text style={styles.addBtnText}>
              + Add {contacts.length === 1 ? 'Second' : 'Third'} Contact
            </Text>
          </TouchableOpacity>
        )}

        <InfoNote text="Contacts are called in order. If the 1st doesn't respond within 3 minutes, the 2nd is called automatically." />

      </ScrollView>

      <NavRow
        onBack={() => router.back()}
        onNext={handleNext}
      />

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  contactCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 14, marginBottom: 12,
  },
  contactHead: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 14,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.sansBold, fontSize: 13 },
  contactHeadText: { flex: 1, gap: 3 },
  contactNum: {
    fontFamily: Font.sansBold, fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2, paddingHorizontal: 9,
    borderRadius: Radius.full,
  },
  priorityText: { fontFamily: Font.sansBold, fontSize: 10 },
  removeBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.redSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontFamily: Font.sansBold, fontSize: 11, color: Colors.red },

  row: { flexDirection: 'row', alignItems: 'flex-start' },
  fieldLabel: {
    fontFamily: Font.sansBold, fontSize: 11,
    color: Colors.textMid, letterSpacing: 0.5, marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.borderMid,
    borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: Font.sans, fontSize: 13, color: Colors.text,
  },
  fieldInputFocused: { borderColor: Colors.sage },
  fieldInputFilled: { borderColor: Colors.sageLight, backgroundColor: Colors.sagePale },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.borderMid, backgroundColor: Colors.white,
  },
  pillSm: { paddingVertical: 5, paddingHorizontal: 8 },
  pillText: { fontFamily: Font.sansMedium, fontSize: 11, color: Colors.textMid },
  pillTextOn: { color: Colors.white },

  addBtn: {
    borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: Colors.borderMid, borderRadius: Radius.sm,
    paddingVertical: 13, alignItems: 'center', marginBottom: 12,
  },
  addBtnText: { fontFamily: Font.sansBold, fontSize: 13, color: Colors.sage },
})