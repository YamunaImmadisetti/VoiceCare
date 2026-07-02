// app/onboarding/account.tsx
import { Colors, Font, Radius } from '@/constants/theme'
import { useOnboarding } from '@/context/OnboardingContext'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

//  import shared components instead of defining them locally
import { NavRow } from '@/components/ui/NavRow'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { StepBar } from '@/components/ui/StepBar'

function Field({
  label, placeholder, value, onChangeText, secureTextEntry = false,
  hint, autoCapitalize, keyboardType,
}: {
  label: string
  placeholder: string
  value: string
  onChangeText: (v: string) => void
  secureTextEntry?: boolean
  hint?: string
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.field}>
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
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? (secureTextEntry ? 'none' : 'words')}
        keyboardType={keyboardType}
      />
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  )
}

export default function AccountScreen() {
  const router = useRouter()
  const { data, setAccount } = useOnboarding() 

  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  })

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))
  function handleNext() {
    //  save to context before navigating
    setAccount({
      fullName:    form.fullName,
      dateOfBirth: form.dob,
      phone:       form.phone,
      email:       form.email,
      address:     form.address,
      password:    form.password,
    })
    router.push('/onboarding/vitals')
  }
  return (
    <SafeAreaView style={styles.safe}>
      <StepBar current={0} total={6} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          stepLabel="Step 1 of 6 · Account"
          title="Create your account"
          sub="Personal details and login info"
        />
        <Field label="FULL NAME" placeholder="Margaret Wilson"
          value={form.fullName} onChangeText={set('fullName')} />
        <Field label="DATE OF BIRTH" placeholder="DD / MM / YYYY"
          value={form.dob} onChangeText={set('dob')} />
        <Field label="PHONE NUMBER" placeholder="+49 170 000 0000"
          value={form.phone} onChangeText={set('phone')}
          hint="Used for emergency SMS alerts" />
        <Field label="EMAIL ADDRESS" placeholder="you@example.com"
          value={form.email} onChangeText={set('email')}
          autoCapitalize="none" keyboardType="email-address" />
        <Field label="HOME ADDRESS" placeholder="Street, City, Postcode"
          value={form.address} onChangeText={set('address')}
          hint="Shared with emergency services if needed" />
        <View style={styles.divider} />
        <Field label="PASSWORD" placeholder="Create a password"
          value={form.password} onChangeText={set('password')} secureTextEntry />
        <Field label="CONFIRM PASSWORD" placeholder="Repeat password"
          value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry />
      </ScrollView>

      {/*  onNext now calls handleNext instead of router.push directly */}
      <NavRow
        onBack={() => router.back()}
        onNext={handleNext}
      />
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: { paddingHorizontal: 22, paddingBottom: 24 },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontFamily: Font.sansBold,
    fontSize: 11,
    color: Colors.textMid,
    letterSpacing: 0.5,
    marginBottom: 5,
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
  fieldInputFocused: { borderColor: Colors.sage },
  fieldInputFilled: {
    borderColor: Colors.sageLight,
    backgroundColor: Colors.sagePale,
  },
  fieldHint: {
    fontFamily: Font.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    paddingLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
})