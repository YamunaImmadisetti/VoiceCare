// app/onboarding/_layout.tsx
import { Stack } from 'expo-router'
import { OnboardingProvider } from '@/context/OnboardingContext'

export default function OnboardingLayout() {
  return (
    // 👇 all onboarding screens now share the same data
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </OnboardingProvider>
  )
}