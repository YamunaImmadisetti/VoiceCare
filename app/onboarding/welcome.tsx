// app/onboarding/welcome.tsx
import { Colors, Font, Radius, Shadow } from '@/constants/theme'
import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Each feature row shown on the welcome screen
const FEATURES = [
  {
    emoji: '🎙️',
    bg: Colors.sagePale,
    title: 'Voice-first interface',
    desc: 'Just speak — no typing needed',
  },
  {
    emoji: '💊',
    bg: Colors.amberSoft,
    title: 'Medication reminders',
    desc: 'Never miss a dose again',
  },
  {
    emoji: '🚨',
    bg: Colors.redSoft,
    title: 'Emergency alerts',
    desc: 'Auto-notifies family & services',
  },
]

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          {/* App icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>🎙️</Text>
          </View>

          <Text style={styles.heroTitle}>Your Voice,{'\n'}
            <Text style={styles.heroItalic}>Your Safety</Text>
          </Text>

          <Text style={styles.heroSub}>
            Set up your profile so CareVoice{'\n'}can keep you safe every day.
          </Text>
        </View>

        {/* ── Feature list ── */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureBorder]}
            >
              <View style={[styles.featureDot, { backgroundColor: f.bg }]}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureName}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── CTA button ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={() => router.push('/onboarding/account'as any)}
          >
            <Text style={styles.btnText}>Get Started →</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
  style={styles.loginLink}
  onPress={() => router.push('/onboarding/login' as any)}
>
  <Text style={styles.loginLinkText}>
    Already have an account? <Text style={styles.loginLinkBold}>Sign in</Text>
  </Text>
</TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loginLink: {
  marginTop: 14,
  alignItems: 'center',
  paddingVertical: 8,
},
loginLinkText: {
  fontFamily: Font.sans,
  fontSize: 13,
  color: Colors.textMuted,
},
loginLinkBold: {
  fontFamily: Font.sansBold,
  color: Colors.sage,
},
  safe: {
    flex: 1,
    backgroundColor: Colors.sageDark,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Hero ──
  hero: {
    backgroundColor: Colors.sageDark,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 36,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconEmoji: {
    fontSize: 32,
  },
  heroTitle: {
    fontFamily: Font.serif,
    fontSize: 30,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  heroItalic: {
    fontFamily: Font.serif,   // Lora is naturally elegant — italics look great
    color: Colors.sageLight,
  },
  heroSub: {
    fontFamily: Font.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Features ──
  features: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  featureBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  featureDot: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontFamily: Font.sansBold,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: Font.sans,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ── Footer / CTA ──
  footer: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  btn: {
    backgroundColor: Colors.sageDark,
    borderRadius: Radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
    ...Shadow.sm,
  },
  btnText: {
    fontFamily: Font.sansBold,
    fontSize: 15,
    color: Colors.white,
  },
})