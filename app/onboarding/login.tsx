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

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      const message =
        error.code === 'invalid_credentials'
          ? 'Incorrect email or password.\n\nIf you just registered, please check your inbox for a confirmation email and click the link before signing in.'
          : error.message || 'Something went wrong. Please try again.'
      Alert.alert('Login failed', message)
    }
    // No need to navigate — the auth listener in _layout.tsx will
    // detect the session and redirect to /(tabs) automatically
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
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your CareVoice account</Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/onboarding/account' as any)}
          >
            <Text style={styles.forgotLinkText}>Forgot your password?</Text>
            <Text style={styles.registerLinkText}>
              Don&apos;t have an account?{' '}
              <Text style={styles.registerLinkBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({

  forgotLink: {
  marginTop: 8,
  alignItems: 'center',
  paddingVertical: 8,
},
forgotLinkText: {
  fontFamily: Font.sans,
  fontSize: 13,
  color: Colors.textMuted,
},
  safe: { flex: 1, backgroundColor: Colors.sageDark },
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
    color: Colors.text, marginBottom: 6,
  },
  sub: {
    fontFamily: Font.sans, fontSize: 14,
    color: Colors.textMuted, marginBottom: 28,
  },
  form: { gap: 6 },
  label: {
    fontFamily: Font.sansBold, fontSize: 11,
    color: Colors.textMid, letterSpacing: 0.5,
    marginBottom: 5, marginTop: 10,
  },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5,
    borderColor: Colors.borderMid, borderRadius: Radius.sm,
    padding: 12, fontSize: 14,
    fontFamily: Font.sans, color: Colors.text,
  },
  btn: {
    backgroundColor: Colors.sageDark, borderRadius: Radius.sm,
    paddingVertical: 15, alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: Font.sansBold, fontSize: 15, color: '#fff' },
  registerLink: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  registerLinkText: { fontFamily: Font.sans, fontSize: 13, color: Colors.textMuted },
  registerLinkBold: { fontFamily: Font.sansBold, color: Colors.sage },
})