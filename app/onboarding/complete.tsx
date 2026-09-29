// app/onboarding/complete.tsx
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Easing, ActivityIndicator, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useRef, useState } from 'react'
import { Colors, Font, Radius, Shadow } from '@/constants/theme'
import { useOnboarding } from '@/context/OnboardingContext'
import { supabase } from '@/lib/supabase'
import { syncMedicationReminders } from '@/lib/medReminders'

// ── Summary items ──────────────────────────────
const SUMMARY_ITEMS = [
  { emoji: '👤', bg: Colors.sagePale,  label: 'Account',            },
  { emoji: '❤️', bg: Colors.redSoft,   label: 'Vitals',             },
  { emoji: '🩺', bg: Colors.skySoft,   label: 'Medical History',    },
  { emoji: '💊', bg: Colors.amberSoft, label: 'Medications',        },
  { emoji: '🚨', bg: Colors.redSoft,   label: 'Emergency Contacts', },
]

// ── Animated checkmark ring ────────────────────
function SuccessRing() {
  const scale   = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1, tension: 60, friction: 8, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 300,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[styles.ring, { transform: [{ scale }], opacity }]}>
      <Text style={styles.ringCheck}>✓</Text>
    </Animated.View>
  )
}

// ── Summary row ────────────────────────────────
function SummaryItem({
  emoji, bg, label, value
}: {
  emoji: string
  bg: string
  label: string
  value: string
}) {
  return (
    <View style={styles.summaryItem}>
      <View style={[styles.summaryIcon, { backgroundColor: bg }]}>
        <Text style={styles.summaryEmoji}>{emoji}</Text>
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
      <View style={styles.summaryCheck}>
        <Text style={styles.summaryCheckMark}>✓</Text>
      </View>
    </View>
  )
}

// ── Main Screen ────────────────────────────────
export default function CompleteScreen() {
  const router  = useRouter()
  const { data } = useOnboarding()
  const [loading, setLoading] = useState(false)

  // Staggered animation for list items
  const itemAnims = useRef(SUMMARY_ITEMS.map(() => new Animated.Value(0))).current

  useEffect(() => {
    Animated.parallel(
      itemAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: 400 + i * 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      )
    ).start()
  }, [])

  // Build summary values from context data
  const summaryValues = [
    data.account.fullName || 'Not provided',
    `${data.vitals.bpm || '–'} bpm · ${data.vitals.systolic || '–'}/${data.vitals.diastolic || '–'} mmHg`,
    `${data.medical.conditions.length} conditions · ${data.medical.allergies.length} allergies`,
    `${data.medications.length} medication${data.medications.length !== 1 ? 's' : ''} added`,
    data.contacts.map(c => c.firstName).join(' & ') || 'None added',
  ]

  // ── Save everything to Supabase ────────────────
  async function handleSave() {
    setLoading(true)

    try {
      // 1️⃣ Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    data.account.email,
        password: data.account.password,
      })

      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('No user ID returned')

      // Ensure we have an authenticated session before inserting a profile.
      let session = authData.session

      if (!session) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        session = sessionData.session
      }

      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email:    data.account.email,
          password: data.account.password,
        })
        if (signInError) throw signInError
        session = signInData.session
      }

      if (!session) throw new Error('Unable to authenticate user before saving profile')

      // 2️⃣ Save profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id:            userId,
          full_name:     data.account.fullName,
          date_of_birth: data.account.dateOfBirth,
          phone:         data.account.phone,
          address:       data.account.address,
        })

      if (profileError) throw profileError

      // 3️⃣ Save vitals
      const { error: vitalsError } = await supabase
        .from('vitals')
        .insert({
          user_id:    userId,
          bpm:        data.vitals.bpm,
          systolic:   data.vitals.systolic,
          diastolic:  data.vitals.diastolic,
          height:     data.vitals.height,
          weight:     data.vitals.weight,
          blood_type: data.vitals.bloodType,
        })

      if (vitalsError) throw vitalsError

      // 4️⃣ Save medical history
      const { error: medicalError } = await supabase
        .from('medical_history')
        .insert({
          user_id:    userId,
          conditions: data.medical.conditions,
          allergies:  data.medical.allergies,
          notes:      data.medical.notes,
        })

      if (medicalError) throw medicalError

      // 5️⃣ Save medications — one row per medication
      if (data.medications.length > 0) {
        const { error: medsError } = await supabase
          .from('medications')
          .insert(
            data.medications.map(m => ({
              user_id:     userId,
              name:        m.name,
              dosage:      m.dosage,
              form:        m.form,
              frequencies: m.frequencies,
              time:        m.time,
              with_food:   m.withFood,
            }))
          )

        if (medsError) throw medsError

        // Schedule daily medicine reminder notifications
        syncMedicationReminders().catch(e => console.log('Reminder sync error:', e))
      }

      // 6️⃣ Save emergency contacts — one row per contact
      if (data.contacts.length > 0) {
        const { error: contactsError } = await supabase
          .from('emergency_contacts')
          .insert(
            data.contacts.map((c, i) => ({
              user_id:      userId,
              first_name:   c.firstName,
              last_name:    c.lastName,
              relationship: c.relationship,
              phone:        c.phone,
              notify_via:   c.notifyVia,
              priority:     i + 1,
            }))
          )

        if (contactsError) throw contactsError
      }

      // 7️⃣ All done — go to home
      // replace() so user can't go back to onboarding
      router.replace('/(tabs)' as any)

    } catch (err: any) {
      Alert.alert(
        'Something went wrong',
        err.message || 'Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <SuccessRing />
          <Text style={styles.heroTitle}>
            {'You\'re all set,\n'}<Text style={styles.heroItalic}>
              {data.account.fullName.split(' ')[0] || 'there'}!
            </Text>
          </Text>
          <Text style={styles.heroSub}>
            Your profile is complete. CareVoice{'\n'}is now watching over you 💚
          </Text>
        </View>

        {/* Summary list */}
        <View style={styles.summaryList}>
          {SUMMARY_ITEMS.map((item, i) => (
            <Animated.View
              key={i}
              style={{
                opacity: itemAnims[i],
                transform: [{
                  translateY: itemAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                }],
              }}
            >
              <SummaryItem
                emoji={item.emoji}
                bg={item.bg}
                label={item.label}
                value={summaryValues[i]}
              />
            </Animated.View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Save &amp; Go to Home →</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.sageDark },
  scroll: { flexGrow: 1 },

  hero: {
    backgroundColor: Colors.sageDark,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 40,
  },
  ring: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
  },
  ringCheck: { fontSize: 38, color: Colors.white },
  heroTitle: {
    fontFamily: Font.serif, fontSize: 28,
    color: Colors.white, textAlign: 'center',
    lineHeight: 36, marginBottom: 12,
  },
  heroItalic: { fontFamily: Font.serif, color: Colors.sageLight },
  heroSub: {
    fontFamily: Font.sans, fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 22,
  },

  summaryList: {
    flex: 1, backgroundColor: Colors.cream,
    paddingHorizontal: 20, paddingTop: 20,
    paddingBottom: 8, gap: 8,
  },
  summaryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: 12,
  },
  summaryIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryEmoji: { fontSize: 16 },
  summaryText: { flex: 1 },
  summaryLabel: { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted },
  summaryValue: {
    fontFamily: Font.sansBold, fontSize: 13,
    color: Colors.text, marginTop: 1,
  },
  summaryCheck: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.sagePale,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryCheckMark: {
    fontFamily: Font.sansBold, fontSize: 11, color: Colors.sage,
  },

  footer: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32,
  },
  btn: {
    backgroundColor: '#2A6E40',
    borderRadius: Radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
    ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: Font.sansBold, fontSize: 15, color: Colors.white },
})