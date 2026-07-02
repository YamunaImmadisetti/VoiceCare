// app/onboarding/medical.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { Colors, Font, Radius } from '@/constants/theme'
import { StepBar } from '@/components/ui/StepBar'
import { NavRow } from '@/components/ui/NavRow'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { useOnboarding } from '@/context/OnboardingContext'

// ── Constants ──────────────────────────────────
const CONDITIONS = [
  { id: 'heart',        emoji: '🫀', label: 'Heart Disease' },
  { id: 'diabetes',     emoji: '🩸', label: 'Diabetes' },
  { id: 'asthma',       emoji: '🫁', label: 'Asthma' },
  { id: 'arthritis',    emoji: '🦴', label: 'Arthritis' },
  { id: 'dementia',     emoji: '🧠', label: 'Dementia' },
  { id: 'glaucoma',     emoji: '👁️', label: 'Glaucoma' },
  { id: 'osteo',        emoji: '🦷', label: 'Osteoporosis' },
  { id: 'hypertension', emoji: '🩻', label: 'Hypertension' },
]

// ── Condition Card ─────────────────────────────
function ConditionCard({
  emoji, label, selected, onPress,
}: {
  emoji: string
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.condCard, selected && styles.condCardOn]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.condEmoji}>{emoji}</Text>
      <Text style={[styles.condLabel, selected && styles.condLabelOn]}>{label}</Text>
      <View style={[styles.condCheck, selected && styles.condCheckOn]}>
        {selected && <Text style={styles.condCheckMark}>✓</Text>}
      </View>
    </TouchableOpacity>
  )
}

// ── Allergy Tag ────────────────────────────────
function AllergyTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={styles.allergyTag}>
      <Text style={styles.allergyText}>{label}</Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.allergyRemove}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Main Screen ────────────────────────────────
export default function MedicalScreen() {
  const router = useRouter()
  const { data, setMedical } = useOnboarding()

  const [selected, setSelected]       = useState<string[]>([])
  const [allergies, setAllergies]     = useState<string[]>([])
  const [allergyInput, setAllergyInput] = useState('')
  const [notes, setNotes]             = useState('')

  function toggleCondition(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function addAllergy() {
    const trimmed = allergyInput.trim()
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies(prev => [...prev, trimmed])
    }
    setAllergyInput('')
  }

  function removeAllergy(index: number) {
    setAllergies(prev => prev.filter((_, i) => i !== index))
  }
  function handleNext() {
    setMedical({ conditions: selected, allergies, notes })  // 👈 save to context
    router.push('/onboarding/medications')
  }
  return (
    <SafeAreaView style={styles.safe}>

      <StepBar current={2} total={6} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          stepLabel="Step 3 of 6 · Medical History"
          title="Existing conditions"
          sub="Select all that apply"
        />

        <View style={styles.condGrid}>
          {CONDITIONS.map(c => (
            <ConditionCard
              key={c.id}
              emoji={c.emoji}
              label={c.label}
              selected={selected.includes(c.id)}
              onPress={() => toggleCondition(c.id)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/* Allergies */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>ALLERGIES</Text>
          {allergies.length > 0 && (
            <View style={styles.allergyWrap}>
              {allergies.map((a, i) => (
                <AllergyTag key={i} label={a} onRemove={() => removeAllergy(i)} />
              ))}
            </View>
          )}
          <TextInput
            style={styles.fieldInput}
            placeholder="Type allergy and press Enter…"
            placeholderTextColor={Colors.textMuted}
            value={allergyInput}
            onChangeText={setAllergyInput}
            onSubmitEditing={addAllergy}
            returnKeyType="done"
          />
          <Text style={styles.fieldHint}>Medications, foods, environmental</Text>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>PAST SURGERIES / NOTES</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldTextarea]}
            placeholder="e.g. Hip replacement 2019…"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

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

  condGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  condCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: 11,
  },
  condCardOn: {
    borderColor: Colors.sage,
    backgroundColor: Colors.sagePale,
  },
  condEmoji: { fontSize: 18 },
  condLabel: {
    flex: 1,
    fontFamily: Font.sansMedium,
    fontSize: 12,
    color: Colors.text,
  },
  condLabelOn: { color: Colors.sageDark },
  condCheck: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: Colors.borderMid,
    alignItems: 'center', justifyContent: 'center',
  },
  condCheckOn: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  condCheckMark: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: Font.sansBold,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },

  field: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: Font.sansBold,
    fontSize: 11,
    color: Colors.textMid,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  allergyWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 9,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: Colors.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(201,64,64,0.2)',
    borderRadius: Radius.full,
  },
  allergyText: {
    fontFamily: Font.sansMedium,
    fontSize: 12,
    color: Colors.red,
  },
  allergyRemove: {
    fontFamily: Font.sansBold,
    fontSize: 11,
    color: Colors.red,
    opacity: 0.5,
  },
  fieldInput: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
    borderRadius: Radius.sm,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontFamily: Font.sans,
    fontSize: 14,
    color: Colors.text,
  },
  fieldTextarea: {
    height: 100,
    paddingTop: 11,
  },
  fieldHint: {
    fontFamily: Font.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 5,
  },
})