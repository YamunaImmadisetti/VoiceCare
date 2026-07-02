# CareVoice 🎙️

A voice-first elderly care mobile app built with React Native (Expo) and Supabase.

## Overview

CareVoice is designed to help elderly users manage their daily health needs through a simple voice interface. Family members can monitor their loved one's health, medications, and activity remotely.

## Features

- 🎙️ **Voice Assistant** — Speak naturally to get help with medications and health questions
- 💊 **Medication Reminders** — Track daily doses with adherence monitoring
- 🚨 **Emergency SOS** — Hold button to alert emergency contacts with live location
- 📅 **Schedule** — Manage doctor appointments and medical tests
- 📊 **Health Overview** — Family dashboard with activity timeline and adherence stats
- 👤 **Profile Management** — Update vitals, medical history, and emergency contacts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router (file-based) |
| Backend | Supabase (Auth + PostgreSQL) |
| AI/Voice | Gemini API + expo-speech-recognition + expo-speech |
| Fonts | Lora (serif) + Nunito (sans) via Google Fonts |
| Platform | Android (custom dev build) | VisualStudio Code

## Project Structure
CareVoice/

├── app/

│   ├── (tabs)/          # Main tab screens

│   │   ├── index.tsx    # Home screen

│   │   ├── reminders.tsx # Medications

│   │   ├── sos.tsx      # Emergency SOS

│   │   ├── family.tsx   # Health overview

│   │   └── profile.tsx  # User profile

│   ├── edit/            # Edit screens

│   │   ├── account.tsx

│   │   ├── vitals.tsx

│   │   ├── medications.tsx

│   │   ├── contacts.tsx

│   │   ├── medical.tsx

│   │   ├── security.tsx

│   │   └── notifications.tsx

│   ├── onboarding/      # Registration flow

│   │   ├── welcome.tsx

│   │   ├── account.tsx

│   │   ├── vitals.tsx

│   │   ├── medical.tsx

│   │   ├── medications.tsx

│   │   ├── contacts.tsx

│   │   ├── complete.tsx

│   │   ├── login.tsx

│   │   └── forgot-password.tsx

│   ├── voice.tsx        # Voice interaction screen

│   └── schedule.tsx     # Appointments screen

├── components/          # Reusable components

│   └── ui/             # Shared UI components

├── constants/

│   └── theme.ts        # Design tokens

├── context/

│   └── OnboardingContext.tsx

├── hooks/

│   └── useVoice.ts     # Voice + AI hook

└── lib/

└── supabase.ts     # Supabase client

## Supabase Database Schema

```sql
-- Core tables
profiles          -- User profile (name, DOB, phone, address)
vitals            -- Health readings (BPM, BP, weight, height, blood type)
medical_history   -- Conditions, allergies, notes, doctor info
medications       -- Medications with dosage, frequency, timing
emergency_contacts -- Emergency contacts with priority order
schedules         -- Appointments and medical events
```

## Getting Started

### Prerequisites

- Node.js 18+
- Android Studio (for Android SDK + ADB)
- Expo CLI
- Supabase account
- Gemini API key (with billing enabled)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/CareVoice.git
cd CareVoice

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys
```

### Environment Variables

Create a `.env` file in the project root:
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url

EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

### Running the App

```bash
# Set JAVA_HOME (Windows)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH += ";C:\Program Files\Android\Android Studio\jbr\bin"

# Build and run on Android
npx expo run:android

# Or start Metro only (if app already installed)
npx expo start --host lan
```

## Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in order:

```sql
-- Enable RLS on all tables
-- profiles, vitals, medical_history, medications, emergency_contacts, schedules

-- Each table needs RLS policies:
CREATE POLICY "Users can manage own data" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

3. Disable email confirmation for development:
   - Authentication → Settings → Disable "Enable email confirmations"

## Known Limitations

- Voice feature requires a custom dev build (not compatible with Expo Go)
- Gemini API requires billing account for production use
- Schedule screen uses manual date entry (YYYY-MM-DD format)
- Family dashboard shows user's own data (multi-user family linking planned for v2)

## Roadmap

- [ ] Claude API integration for voice (more reliable than Gemini)
- [ ] Push notifications for medication reminders
- [ ] Calendar date picker for schedule
- [ ] Family member accounts linked to elderly user
- [ ] Medication barcode scanner
- [ ] Vitals from wearable devices (Apple Watch, Fitbit)
- [ ] Offline mode for core features

## Development Notes

- **Windows dev environment**: Must set `JAVA_HOME` in each new PowerShell session
- **New architecture**: `newArchEnabled=true` required by `react-native-worklets`
- **API keys**: Never commit `.env` — verify `.gitignore` before every push
- **Custom dev build**: Required for `expo-speech-recognition` native module

## License

MIT
