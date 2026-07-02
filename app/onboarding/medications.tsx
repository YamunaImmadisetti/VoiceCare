// app/onboarding/medications.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { Colors, Font, Radius, Shadow } from '@/constants/theme'
import { StepBar } from '@/components/ui/StepBar'
import { NavRow } from '@/components/ui/NavRow'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { useOnboarding } from '@/context/OnboardingContext'

// ── Types ──────────────────────────────────────
type Frequency = 'Morning' | 'Afternoon' | 'Evening' | 'Bedtime'
type MedForm   = 'Tablet' | 'Capsule' | 'Syrup' | 'Injection'

interface Medication {
  id: string
  name: string
  dosage: string
  form: MedForm
  frequencies: Frequency[]
  time: string
  withFood: string
}

const FREQUENCIES: Frequency[] = ['Morning', 'Afternoon', 'Evening', 'Bedtime']
const FORMS: MedForm[]         = ['Tablet', 'Capsule', 'Syrup', 'Injection']
const WITH_FOOD                = ['With food', 'Before food', 'After food', 'Anytime']

function makeEmptyMed(): Medication {
  return {
    id: Date.now().toString(),
    name: '',
    dosage: '',
    form: 'Tablet',
    frequencies: [],
    time: '',
    withFood: 'With food',
  }
}

// ── Med Input ──────────────────────────────────
function MedInput({
  label, placeholder, value, onChangeText,
}: {
  label: string
  placeholder: string
  value: string
  onChangeText: (v: string) => void
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  )
}

// ── Med Card ───────────────────────────────────
function MedCard({
  med, index, onChange, onRemove,
}: {
  med: Medication
  index: number
  onChange: (updated: Medication) => void
  onRemove: () => void
}) {
  const set = <K extends keyof Medication>(key: K, val: Medication[K]) =>
    onChange({ ...med, [key]: val })

  function toggleFreq(freq: Frequency) {
    const next = med.frequencies.includes(freq)
      ? med.frequencies.filter(f => f !== freq)
      : [...med.frequencies, freq]
    set('frequencies', next)
  }

  return (
    <View style={styles.medCard}>

      {/* Header */}
      <View style={styles.medCardHead}>
        <View style={styles.medNumBadge}>
          <Text style={styles.medNumText}>{index + 1}</Text>
        </View>
        <Text style={styles.medCardTitle}>Medication details</Text>
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove} activeOpacity={0.7}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Name */}
      <View style={{ marginBottom: 10 }}>
        <MedInput
          label="MEDICATION NAME" placeholder="e.g. Metformin"
          value={med.name} onChangeText={v => set('name', v)}
        />
      </View>

      {/* Dosage + Form */}
      <View style={[styles.row, { marginBottom: 10 }]}>
        <MedInput
          label="DOSAGE" placeholder="e.g. 500 mg"
          value={med.dosage} onChangeText={v => set('dosage', v)}
        />
        <View style={{ width: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>FORM</Text>
          <View style={styles.pillRow}>
            {FORMS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.pill, styles.pillSm, med.form === f && styles.pillOnGreen]}
                onPress={() => set('form', f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, med.form === f && styles.pillTextOn]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Frequency */}
      <View style={{ marginBottom: 10 }}>
        <Text style={styles.fieldLabel}>FREQUENCY</Text>
        <View style={styles.freqGrid}>
          {FREQUENCIES.map(freq => (
            <TouchableOpacity
              key={freq}
              style={[styles.freqPill, med.frequencies.includes(freq) && styles.freqPillOn]}
              onPress={() => toggleFreq(freq)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.freqPillText,
                med.frequencies.includes(freq) && styles.freqPillTextOn,
              ]}>
                {freq}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time + With food */}
      <View style={styles.row}>
        <MedInput
          label="TIME" placeholder="08:00 AM"
          value={med.time} onChangeText={v => set('time', v)}
        />
        <View style={{ width: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>WITH FOOD?</Text>
          <View style={styles.pillRow}>
            {WITH_FOOD.map(wf => (
              <TouchableOpacity
                key={wf}
                style={[styles.pill, styles.pillSm, med.withFood === wf && styles.pillOnAmber]}
                onPress={() => set('withFood', wf)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, med.withFood === wf && styles.pillTextOn]}>
                  {wf}
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
export default function MedicationsScreen() {
  const router = useRouter()
  const { data, setMedications } = useOnboarding()
  const [meds, setMeds] = useState<Medication[]>(
    data.medications.length > 0
      ? data.medications                             // 👈 restore if user went back
      : [makeEmptyMed()]
  )

  function updateMed(id: string, updated: Medication) {
    setMeds(prev => prev.map(m => m.id === id ? updated : m))
  }

  function removeMed(id: string) {
    setMeds(prev => prev.filter(m => m.id !== id))
  }

  function addMed() {
    setMeds(prev => [...prev, makeEmptyMed()])
  }
  function handleNext() {
    setMedications(meds)                             // 👈 save to context
    router.push('/onboarding/contacts')
  }
  return (
    <SafeAreaView style={styles.safe}>

      <StepBar current={3} total={6} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          stepLabel="Step 4 of 6 · Medications"
          title="Current medications"
          sub="Set dosage, timing and reminders"
        />

        {meds.map((med, index) => (
          <MedCard
            key={med.id}
            med={med}
            index={index}
            onChange={updated => updateMed(med.id, updated)}
            onRemove={() => removeMed(med.id)}
          />
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addMed} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+ Add Medication</Text>
        </TouchableOpacity>

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

  medCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 12,
  },
  medCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  medNumBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.amberSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  medNumText: { fontFamily: Font.sansBold, fontSize: 13, color: Colors.amber },
  medCardTitle: { flex: 1, fontFamily: Font.sansBold, fontSize: 13, color: Colors.text },
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

  freqGrid: { flexDirection: 'row', gap: 6 },
  freqPill: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: Colors.borderMid, alignItems: 'center',
  },
  freqPillOn: { backgroundColor: Colors.amber, borderColor: Colors.amber },
  freqPillText: { fontFamily: Font.sansMedium, fontSize: 11, color: Colors.textMid },
  freqPillTextOn: { color: Colors.white },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.borderMid, backgroundColor: Colors.white,
  },
  pillSm: { paddingVertical: 5, paddingHorizontal: 8 },
  pillOnGreen: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  pillOnAmber: { backgroundColor: Colors.amber, borderColor: Colors.amber },
  pillText: { fontFamily: Font.sansMedium, fontSize: 11, color: Colors.textMid },
  pillTextOn: { color: Colors.white },

  addBtn: {
    borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: Colors.borderMid, borderRadius: Radius.sm,
    paddingVertical: 13, alignItems: 'center', marginBottom: 8,
  },
  addBtnText: { fontFamily: Font.sansBold, fontSize: 13, color: Colors.sage },
})