// AFTER — replace the whole file with this
import { Lora_400Regular, Lora_600SemiBold } from '@expo-google-fonts/lora'
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { supabase } from '@/lib/supabase'
import {
  cancelMedicationReminders,
  handleMedNotificationResponse,
  syncMedicationReminders,
} from '@/lib/medReminders'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const router   = useRouter()
  const segments = useSegments()

  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_600SemiBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  })

  const [session, setSession] = useState<any>(null)
  const [checked, setChecked] = useState(false)

  // Check if user already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  // Redirect based on auth state
  useEffect(() => {
    if (!fontsLoaded || !checked) return

    SplashScreen.hideAsync()

    const inOnboarding = segments[0] === 'onboarding'

    if (!session && !inOnboarding) {
      // No user → go to onboarding
      router.replace('/onboarding/welcome' as any)
    } else if (session && inOnboarding) {
      // Already logged in → skip onboarding
      router.replace('/(tabs)' as any)
    }
  }, [fontsLoaded, checked, session])

  // Medicine reminders: schedule on login, clear on logout, handle notification taps
  const ready  = fontsLoaded && checked
  const userId = session?.user?.id as string | undefined
  const lastHandledResponse = useRef<string | null>(null)

  useEffect(() => {
    if (!ready || Platform.OS === 'web') return

    if (!userId) {
      cancelMedicationReminders().catch(e => console.log('Reminder cancel error:', e))
      return
    }

    syncMedicationReminders().catch(e => console.log('Reminder sync error:', e))

    const onResponse = async (response: Notifications.NotificationResponse) => {
      const key = `${response.notification.request.identifier}|${response.notification.date}|${response.actionIdentifier}`
      if (lastHandledResponse.current === key) return
      lastHandledResponse.current = key
      if (await handleMedNotificationResponse(response)) {
        router.push('/(tabs)/reminders' as any)
      }
    }

    // App opened from a notification while it was closed
    Notifications.getLastNotificationResponseAsync()
      .then(r => { if (r) onResponse(r) })
      .catch(() => {})

    const sub = Notifications.addNotificationResponseReceivedListener(onResponse)
    return () => sub.remove()
  }, [ready, userId])

  if (!fontsLoaded || !checked) return null

  return <Stack screenOptions={{ headerShown: false }} />
}