import { Colors, Font } from '@/constants/theme'
import { useRouter } from 'expo-router'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function EditSecurityScreen() {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.comingSoonIcon}>🔒</Text>
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <Text style={styles.comingSoonSub}>Password change and privacy settings will be available in the next update.</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.sageDark },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn:          { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  backArrow:        { color: '#fff', fontSize: 18 },
  title:            { fontFamily: 'Lora_600SemiBold', fontSize: 18, color: '#fff' },
  body:             { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 8, alignItems: 'center', justifyContent: 'center', padding: 32 },
  comingSoonIcon:   { fontSize: 48, marginBottom: 16 },
  comingSoonTitle:  { fontFamily: 'Lora_600SemiBold', fontSize: 20, color: Colors.text, marginBottom: 8 },
  comingSoonSub:    { fontFamily: Font.sans, fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
})