// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const SUPABASE_URL = 'https://fdgezgkkmjngnoglxcol.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZ2V6Z2trbWpuZ25vZ2x4Y29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzgwMDAsImV4cCI6MjA5MDk1NDAwMH0.2kAn-YMaemtluXP2DhbUrEHvTDEQrl7d6ZT_ibFSqMw'

const storage = Platform.OS === 'web'
  ? {
      getItem: (key: string) => {
        return Promise.resolve(localStorage.getItem(key))
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value)
        return Promise.resolve()
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key)
        return Promise.resolve()
      },
    }
  : {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    }
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// ── Types ──────────────────────────────────────────────────────
export type Profile = {
  id: string
  name: string
  dob: string
  gender: string
  phone: string
  email: string
  address: string
  blood_type: string
  vitals: {
    bpm: number
    bp_sys: number
    bp_dia: number
    weight: number
    height: number
  }
  conditions: string[]
  allergies: string[]
  surgery_notes: string
  doctor_name: string
  doctor_phone: string
}

export type Medication = {
  id: string
  user_id: string
  name: string
  dosage: string
  form: string
  times: string[]   // ['Morning', 'Evening']
  time: string      // '08:00'
  with_food: string
  active: boolean
}

export type EmergencyContact = {
  id: string
  user_id: string
  first_name: string
  last_name: string
  relationship: string
  phone: string
  notify_via: string
  priority: number  // 1, 2, 3
}