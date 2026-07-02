import { Colors, Font, Radius, Shadow } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const MENU = [
  { section: 'Health Data', items: [
    { icon: '❤️', bg: Colors.redSoft,   label: 'Vitals & Measurements', sub: 'BPM, blood pressure, weight', route: '/edit/vitals'        },
    { icon: '💊', bg: Colors.amberSoft, label: 'Medications',           sub: 'Active medications',          route: '/edit/medications'   },
    { icon: '🩺', bg: Colors.skySoft,   label: 'Medical History',       sub: 'Conditions, allergies',       route: '/edit/medical'       },
  ]},
  { section: 'Safety', items: [
    { icon: '🚨', bg: Colors.redSoft,   label: 'Emergency Contacts',    sub: 'Contacts configured',         route: '/edit/contacts'      },
  ]},
  { section: 'Account', items: [
    { icon: '👤', bg: Colors.sagePale,  label: 'Personal Details',      sub: 'Name, phone, address',        route: '/edit/account'       },
    { icon: '🔒', bg: '#F0EBF8',        label: 'Privacy & Security',    sub: 'Password, permissions',       route: '/edit/security'      },
    { icon: '🔔', bg: Colors.sagePale,  label: 'Notification Settings', sub: 'Reminders, alerts',           route: '/edit/notifications' },
  ]},
]

type ProfileData = {
  full_name: string
  email: string
  date_of_birth: string | null
}

type Stats = {
  age: string
  meds: string
  contacts: string
}

export default function ProfileScreen() {
  const router = useRouter()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats]     = useState<Stats>({ age: '–', meds: '–', contacts: '–' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load profile row
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Merge email from auth user into profile
      setProfile({
        full_name:     profileData?.full_name ?? '',
        email:         user.email ?? '',
        date_of_birth: profileData?.date_of_birth ?? null,
      })

      // Medication count
      const { count: medCount } = await supabase
        .from('medications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Contact count
      const { count: contactCount } = await supabase
        .from('emergency_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Age from date_of_birth
      let age = '–'
      if (profileData?.date_of_birth) {
        const dob  = new Date(profileData.date_of_birth)
        const diff = Date.now() - dob.getTime()
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)).toString()
      }

      setStats({
        age,
        meds:     (medCount     ?? 0).toString(),
        contacts: (contactCount ?? 0).toString(),
      })
    } catch (e) {
      console.log('Profile load error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/onboarding/welcome' as any)
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator color="#fff" size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.editBadge}>
            <Text style={{ fontSize: 10 }}>✏️</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile?.full_name || 'No name'}</Text>
          <Text style={styles.email}>{profile?.email || '–'}</Text>
        </View>
      </View>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        {[
          { val: stats.age,      lbl: 'AGE'       },
          { val: stats.meds,     lbl: 'MEDS'      },
          { val: stats.contacts, lbl: 'CONTACTS'  },
          { val: '–',            lbl: 'ADHERENCE' },
        ].map((s, i) => (
          <View key={i} style={[styles.statBox, i > 0 && styles.statBorder]}>
            <Text style={styles.statVal}>{s.val}</Text>
            <Text style={styles.statLbl}>{s.lbl}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {MENU.map(section => (
          <View key={section.section}>
            <Text style={styles.sectionLabel}>{section.section}</Text>
            {section.items.map(item => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, Shadow.sm]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                  <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.sageDark },
  centered:     { alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  avatarWrap:   { position: 'relative' },
  avatar:       { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.sageMid, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText:   { fontFamily: Font.sansBold, fontSize: 20, color: '#fff' },
  editBadge:    { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.amber, borderWidth: 2, borderColor: Colors.sageDark, alignItems: 'center', justifyContent: 'center' },
  name:         { fontFamily: 'Lora_600SemiBold', fontSize: 17, color: '#fff' },
  email:        { fontFamily: Font.sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statsRow:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 11, marginHorizontal: 20, paddingVertical: 9, paddingHorizontal: 12 },
  statBox:      { flex: 1, alignItems: 'center' },
  statBorder:   { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.12)' },
  statVal:      { fontFamily: Font.sansBold, fontSize: 15, color: '#fff' },
  statLbl:      { fontFamily: Font.sans, fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2, letterSpacing: 0.3 },
  body:         { flex: 1, backgroundColor: Colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 16, paddingHorizontal: 14, paddingTop: 10 },
  sectionLabel: { fontFamily: Font.sansBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: Colors.textMuted, paddingVertical: 9, paddingLeft: 4 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, backgroundColor: Colors.white, borderRadius: 11, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  menuIcon:     { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  menuLabel:    { fontFamily: Font.sansBold, fontSize: 13, color: Colors.text },
  menuSub:      { fontFamily: Font.sans, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  arrow:        { color: Colors.textMuted, fontSize: 18, opacity: 0.4 },
  signOutBtn:   { marginTop: 24, padding: 14, backgroundColor: Colors.redSoft, borderRadius: Radius.sm, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,64,64,0.2)' },
  signOutText:  { fontFamily: Font.sansBold, fontSize: 14, color: Colors.red },
})