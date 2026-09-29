// lib/medReminders.ts
// Real medicine reminders: daily local notifications + dose logging in Supabase.
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'

export const MED_CHANNEL_ID  = 'med-reminders'
export const MED_CATEGORY_ID = 'med-reminder'
export const TAKEN_ACTION_ID = 'MED_TAKEN'
const MED_NOTIFICATION_TYPE  = 'med-reminder'

// A dose counts as "missed" this many minutes after its scheduled time.
const MISSED_AFTER_MIN = 120

export type DoseStatus = 'taken' | 'upcoming' | 'due' | 'missed'
export type PermissionState = 'granted' | 'denied' | 'unsupported'

const isNative = Platform.OS === 'android' || Platform.OS === 'ios'

// ── Time helpers ──────────────────────────────────────────────

// Accepts "08:00 AM", "8:00 pm", "8 AM", "20:00", "20.30"
export function parseMedTime(time?: string | null): { hour: number; minute: number } | null {
  if (!time) return null
  const m = time.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*([AaPp]\.?[Mm]\.?)?$/)
  if (!m) return null
  let hour = Number(m[1])
  const minute = Number(m[2] ?? 0)
  const meridiem = m[3]?.replace(/\./g, '').toUpperCase()
  if (minute > 59) return null
  if (meridiem) {
    if (hour < 1 || hour > 12) return null
    if (meridiem === 'PM' && hour !== 12) hour += 12
    if (meridiem === 'AM' && hour === 12) hour = 0
  } else if (hour > 23) {
    return null
  }
  return { hour, minute }
}

export function minutesOfDay(time?: string | null): number | null {
  const t = parseMedTime(time)
  return t ? t.hour * 60 + t.minute : null
}

export function sortByDoseTime<T extends { time?: string | null }>(meds: T[]): T[] {
  return [...meds].sort((a, b) => (minutesOfDay(a.time) ?? 9999) - (minutesOfDay(b.time) ?? 9999))
}

export function getDoseStatus(time: string | null | undefined, takenToday: boolean, now = new Date()): DoseStatus {
  if (takenToday) return 'taken'
  const mins = minutesOfDay(time)
  if (mins === null) return 'upcoming'
  const nowMins = now.getHours() * 60 + now.getMinutes()
  if (nowMins < mins) return 'upcoming'
  if (nowMins < mins + MISSED_AFTER_MIN) return 'due'
  return 'missed'
}

// Local calendar date as YYYY-MM-DD (not UTC, so "today" matches the user's day)
export function todayKey(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// ── Dose logging (Supabase table: medication_logs) ────────────

// Returns medication_id → taken_at for today's logged doses
export async function fetchTakenToday(userId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('medication_id, taken_at')
    .eq('user_id', userId)
    .eq('log_date', todayKey())
  if (error) {
    console.log('Dose log load error:', error.message)
    return new Map()
  }
  return new Map((data ?? []).map(r => [r.medication_id as string, r.taken_at as string]))
}

export async function logDoseTaken(medicationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase
    .from('medication_logs')
    .upsert(
      { user_id: user.id, medication_id: medicationId, log_date: todayKey(), taken_at: new Date().toISOString() },
      { onConflict: 'medication_id,log_date', ignoreDuplicates: true },
    )
  if (error) throw error
}

// ── Notifications ─────────────────────────────────────────────

let configured = false

async function configureOnce() {
  if (configured || !isNative) return
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList:   true,
      shouldPlaySound:  true,
      shouldSetBadge:   false,
    }),
  })
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(MED_CHANNEL_ID, {
      name: 'Medicine reminders',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 400, 200, 400],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    })
  }
  await Notifications.setNotificationCategoryAsync(MED_CATEGORY_ID, [
    { identifier: TAKEN_ACTION_ID, buttonTitle: "✓ I've taken it", options: { opensAppToForeground: true } },
  ])
  configured = true
}

export async function getNotificationPermission(): Promise<PermissionState> {
  if (!isNative) return 'unsupported'
  const { granted } = await Notifications.getPermissionsAsync()
  return granted ? 'granted' : 'denied'
}

// Sets up the channel and asks for permission if it hasn't been refused permanently
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative) return false
  await configureOnce()
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  if (!current.canAskAgain) return false
  const req = await Notifications.requestPermissionsAsync()
  return req.granted
}

export async function cancelMedicationReminders(): Promise<void> {
  if (!isNative) return
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(
    scheduled
      .filter(n => (n.content.data as any)?.type === MED_NOTIFICATION_TYPE)
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  )
}

// Re-creates one daily notification per active medication. Call after any medication change.
export async function syncMedicationReminders(): Promise<number> {
  if (!isNative) return 0
  const granted = await ensureNotificationPermission()
  await cancelMedicationReminders()
  if (!granted) return 0

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase
    .from('medications')
    .select('id, name, dosage, time, with_food, active')
    .eq('user_id', user.id)
  if (error) throw error

  let count = 0
  for (const med of data ?? []) {
    if (med.active === false) continue
    const t = parseMedTime(med.time)
    if (!t) {
      console.log(`Reminder skipped for ${med.name}: can't read time "${med.time}"`)
      continue
    }
    await Notifications.scheduleNotificationAsync({
      identifier: `med-${med.id}`,
      content: {
        title: '💊 Time for your medicine',
        body: [`${med.name} ${med.dosage ?? ''}`.trim(), med.with_food].filter(Boolean).join(' · '),
        sound: 'default',
        categoryIdentifier: MED_CATEGORY_ID,
        data: { type: MED_NOTIFICATION_TYPE, medicationId: med.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: t.hour,
        minute: t.minute,
        channelId: MED_CHANNEL_ID,
      },
    })
    count++
  }
  return count
}

// Handles a tap on a reminder (or its "I've taken it" button).
// Returns true if it was a medicine reminder, so the caller can open the Reminders tab.
export async function handleMedNotificationResponse(
  response: Notifications.NotificationResponse,
): Promise<boolean> {
  const data = response.notification.request.content.data as any
  if (data?.type !== MED_NOTIFICATION_TYPE) return false
  if (response.actionIdentifier === TAKEN_ACTION_ID && data.medicationId) {
    try {
      await logDoseTaken(data.medicationId)
    } catch (e: any) {
      console.log('Could not log dose from notification:', e?.message ?? e)
    }
  }
  try {
    await Notifications.dismissNotificationAsync(response.notification.request.identifier)
  } catch {}
  return true
}
