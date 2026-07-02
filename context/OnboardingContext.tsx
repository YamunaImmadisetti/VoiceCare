// context/OnboardingContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'

// ── Types ──────────────────────────────────────
export interface AccountData {
  fullName: string
  dateOfBirth: string
  phone: string
  email: string
  address: string
  password: string
}

export interface VitalsData {
  bpm: string
  systolic: string
  diastolic: string
  height: string
  weight: string
  bloodType: string
}

export interface MedicalData {
  conditions: string[]
  allergies: string[]
  notes: string
}

export type MedForm   = 'Tablet' | 'Capsule' | 'Syrup' | 'Injection'
export type Frequency = 'Morning' | 'Afternoon' | 'Evening' | 'Bedtime'

export interface Medication {
  id: string
  name: string
  dosage: string
  form: MedForm
  frequencies: Frequency[]
  time: string
  withFood: string
}

export type Relationship = 'Son' | 'Daughter' | 'Spouse' | 'Sibling' | 'Friend' | 'Other'
export type NotifyMethod = 'Call + SMS' | 'SMS only' | 'App only'

export interface Contact {
  id: string
  firstName: string
  lastName: string
  relationship: Relationship | ''
  phone: string
  notifyVia: NotifyMethod
}

// ── Full state ─────────────────────────────────
interface OnboardingState {
  account:     AccountData
  vitals:      VitalsData
  medical:     MedicalData
  medications: Medication[]
  contacts:    Contact[]
}

// ── Context shape ──────────────────────────────
interface OnboardingContextType {
  data:           OnboardingState
  setAccount:     (v: AccountData)  => void
  setVitals:      (v: VitalsData)   => void
  setMedical:     (v: MedicalData)  => void
  setMedications: (v: Medication[]) => void
  setContacts:    (v: Contact[])    => void
}

// ── Default values ─────────────────────────────
const defaultState: OnboardingState = {
  account: {
    fullName: '', dateOfBirth: '', phone: '',
    email: '', address: '', password: '',
  },
  vitals: {
    bpm: '', systolic: '', diastolic: '',
    height: '', weight: '', bloodType: '',
  },
  medical: {
    conditions: [], allergies: [], notes: '',
  },
  medications: [],
  contacts: [],
}

// ── Context ────────────────────────────────────
const OnboardingContext = createContext<OnboardingContextType | null>(null)

// ── Provider ───────────────────────────────────
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingState>(defaultState)

  const setAccount     = (v: AccountData)  => setData(p => ({ ...p, account: v }))
  const setVitals      = (v: VitalsData)   => setData(p => ({ ...p, vitals: v }))
  const setMedical     = (v: MedicalData)  => setData(p => ({ ...p, medical: v }))
  const setMedications = (v: Medication[]) => setData(p => ({ ...p, medications: v }))
  const setContacts    = (v: Contact[])    => setData(p => ({ ...p, contacts: v }))

  return (
    <OnboardingContext.Provider value={{
      data,
      setAccount,
      setVitals,
      setMedical,
      setMedications,
      setContacts,
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────
export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider')
  return ctx
}