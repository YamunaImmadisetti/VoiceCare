import { Colors, Font, Radius } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator, Alert,
    SafeAreaView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  async function handleReset() {
    if (!email) {
      Alert.alert('Enter your email', 'Please enter the email you registered with.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {sent ? (
          // ── Success state ──
          <View style={styles.sentWrap}>
            <Text style={styles.sentIcon}>📧</Text>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.sub}>
              We sent a password reset link to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.hint}>
              Check your inbox and follow the link to reset your password. It may take a minute to arrive.
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => router.replace('/onboarding/login' as any)}
            >
              <Text style={styles.btnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── Form state ──
          <>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.sub}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </Text>

            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Send Reset Link →</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => router.back()}
            >
              <Text style={styles.backLinkText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.sageDark },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 18 },
  body: {
    flex: 1, backgroundColor: Colors.cream,
    marginTop: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28,
  },
  title: {
    fontFamily: Font.serif, fontSize: 26,
    color: Colors.text, marginBottom: 8,
  },
  sub: {
    fontFamily: Font.sans, fontSize: 14,
    color: Colors.textMuted, marginBottom: 28, lineHeight: 22,
  },
  emailHighlight: {
    fontFamily: Font.sansBold, color: Colors.sage,
  },
  label: {
    fontFamily: Font.sansBold, fontSize: 11,
    color: Colors.textMid, letterSpacing: 0.5,
    marginBottom: 5, marginTop: 4,
  },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5,
    borderColor: Colors.borderMid, borderRadius: Radius.sm,
    padding: 12, fontSize: 14,
    fontFamily: Font.sans, color: Colors.text,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: Colors.sageDark, borderRadius: Radius.sm,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: Font.sansBold, fontSize: 15, color: '#fff' },
  backLink: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontFamily: Font.sans, fontSize: 13, color: Colors.textMuted },
  hint: {
    fontFamily: Font.sans, fontSize: 13,
    color: Colors.textMuted, lineHeight: 20,
    marginTop: 12, marginBottom: 8,
  },
  sentWrap: { alignItems: 'center', paddingTop: 40 },
  sentIcon: { fontSize: 52, marginBottom: 20 },
})