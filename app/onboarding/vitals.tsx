// app/onboarding/vitals.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { Colors, Font, Radius } from '@/constants/theme'
import { StepBar } from '@/components/ui/StepBar'
import { NavRow } from '@/components/ui/NavRow'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { InfoNote } from '@/components/ui/InfoNote'
import { useOnboarding } from '@/context/OnboardingContext'

// ── Vital Card ─────────────────────────────────
function VitalCard({
  emoji, bg, title, desc, hint, children,
}: {
  emoji: string
  bg: string
  title: string
  desc: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.vitalCard}>
      <View style={styles.vitalCardTop}>
        <View style={[styles.vitalIcon, { backgroundColor: bg }]}>
          <Text style={styles.vitalEmoji}>{emoji}</Text>
        </View>
        <View>
          <Text style={styles.vitalName}>{title}</Text>
          <Text style={styles.vitalDesc}>{desc}</Text>
        </View>
      </View>
      <View style={styles.vitalInputRow}>{children}</View>
      {hint && <Text style={styles.vitalHint}>{hint}</Text>}
    </View>
  )
}

// ── Vital Input ────────────────────────────────
function VitalInput({
  value, onChangeText, unit,
}: {
  value: string
  onChangeText: (v: string) => void
  unit?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <>
      <TextInput
        style={[styles.vitalInp, focused && styles.vitalInpFocused]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {unit && <Text style={styles.vitalUnit}>{unit}</Text>}
    </>
  )
}

// ── Blood Type Picker ──────────────────────────
const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']

function BloodTypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>BLOOD TYPE</Text>
      <View style={styles.pillGroup}>
        {BLOOD_TYPES.map(bt => (
          <TouchableOpacity
            key={bt}
            style={[styles.pill, value === bt && styles.pillOn]}
            onPress={() => onChange(bt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, value === bt && styles.pillTextOn]}>
              {bt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

// ── Main Screen ────────────────────────────────
export default function VitalsScreen() {
  const router = useRouter()
  const { data, setVitals } = useOnboarding()        // 👈 add this

  const [vitals, setVitalsLocal] = useState({        // 👈 rename setter to setVitalsLocal
    bpm:       data.vitals.bpm,                      // 👈 init from context
    systolic:  data.vitals.systolic,
    diastolic: data.vitals.diastolic,
    height:    data.vitals.height,
    weight:    data.vitals.weight,
    bloodType: data.vitals.bloodType,
  })

  const set = (key: keyof typeof vitals) => (val: string) =>
    setVitalsLocal(prev => ({ ...prev, [key]: val }))

  function handleNext() {
    setVitals(vitals)                                 // 👈 save to context
    router.push('/onboarding/medical')
  }
  return (
    <SafeAreaView style={styles.safe}>

      <StepBar current={1} total={6} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          stepLabel="Step 2 of 6 · Vitals"
          title="Your baseline vitals"
          sub="Helps detect anomalies and emergencies"
        />

        <InfoNote text="Enter your most recent readings. CareVoice will alert your family if readings are abnormal." />

        <VitalCard
          emoji="❤️" bg={Colors.redSoft}
          title="Heart Rate (BPM)" desc="Resting heart rate"
          hint="Normal: 60–100 bpm"
        >
          <VitalInput value={vitals.bpm} onChangeText={set('bpm')} unit="bpm" />
        </VitalCard>

        <VitalCard
          emoji="🩺" bg={Colors.skySoft}
          title="Blood Pressure" desc="Systolic / Diastolic"
          hint="Normal: <120 / <80 mmHg"
        >
          <VitalInput value={vitals.systolic} onChangeText={set('systolic')} />
          <Text style={styles.vitalSep}>/</Text>
          <VitalInput value={vitals.diastolic} onChangeText={set('diastolic')} unit="mmHg" />
        </VitalCard>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <VitalCard emoji="📏" bg={Colors.sagePale} title="Height" desc="">
              <VitalInput value={vitals.height} onChangeText={set('height')} unit="cm" />
            </VitalCard>
          </View>
          <View style={{ flex: 1 }}>
            <VitalCard emoji="⚖️" bg={Colors.amberSoft} title="Weight" desc="">
              <VitalInput value={vitals.weight} onChangeText={set('weight')} unit="kg" />
            </VitalCard>
          </View>
        </View>

        <BloodTypePicker value={vitals.bloodType} onChange={set('bloodType')} />

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

  vitalCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm + 3,
    padding: 13,
    marginBottom: 11,
  },
  vitalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 11,
  },
  vitalIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  vitalEmoji: { fontSize: 16 },
  vitalName: { fontFamily: Font.sansBold, fontSize: 13, color: Colors.text },
  vitalDesc: { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted },
  vitalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vitalInp: {
    flex: 1,
    backgroundColor: Colors.sagePale,
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontFamily: Font.sansBold,
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
  },
  vitalInpFocused: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberSoft,
  },
  vitalUnit: {
    fontFamily: Font.sansBold,
    fontSize: 11,
    color: Colors.textMuted,
    minWidth: 32,
    textAlign: 'center',
  },
  vitalSep: {
    fontFamily: Font.sans,
    fontSize: 22,
    color: Colors.textMuted,
  },
  vitalHint: {
    fontFamily: Font.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 7,
  },
  twoCol: { flexDirection: 'row', gap: 10 },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontFamily: Font.sansBold,
    fontSize: 11,
    color: Colors.textMid,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pillGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderMid,
    backgroundColor: Colors.white,
  },
  pillOn: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  pillText: { fontFamily: Font.sansMedium, fontSize: 12, color: Colors.textMid },
  pillTextOn: { color: Colors.white },
})
