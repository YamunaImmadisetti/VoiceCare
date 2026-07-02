import { Colors, Font, Radius } from '@/constants/theme';
import { useVoice } from '@/hooks/useVoice';
import { useRouter } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function VoiceScreen() {
  const router = useRouter();
  const { state, transcript, response, error, startListening, stopListening } = useVoice();

  const isActive = state !== 'idle';

  const handleOrbPress = () => {
    if (state === 'idle') {
      startListening();
    } else {
      stopListening();
    }
  };

  const getOrbLabel = () => {
    switch (state) {
      case 'listening': return 'Listening…';
      case 'thinking':  return 'Thinking…';
      case 'speaking':  return 'Speaking…';
      default:          return 'Tap to Speak';
    }
  };

  const getOrbSublabel = () => {
    switch (state) {
      case 'listening': return 'Tap to stop';
      case 'thinking':  return 'Getting your answer';
      case 'speaking':  return 'Tap to stop';
      default:          return 'Ask me anything';
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CareVoice</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Main orb area */}
      <View style={styles.body}>

        {/* Orb */}
        <TouchableOpacity
          style={[styles.orb, isActive && styles.orbActive]}
          onPress={handleOrbPress}
          activeOpacity={0.8}
        >
          {state === 'thinking' ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Text style={styles.orbIcon}>🎙️</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.orbLabel}>{getOrbLabel()}</Text>
        <Text style={styles.orbSublabel}>{getOrbSublabel()}</Text>

        {/* Transcript bubble */}
        {transcript ? (
          <View style={styles.transcriptBubble}>
            <Text style={styles.transcriptText}>&ldquo;{transcript}&rdquo;</Text>
          </View>
        ) : null}

        {/* Response bubble */}
        {response ? (
          <View style={styles.responseBubble}>
            <Text style={styles.responseLabel}>CareVoice</Text>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        ) : null}

        {/* Error */}
        {error ? (
          <View style={styles.errorBubble}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

      </View>

      {/* Emergency button */}
      <TouchableOpacity
        style={styles.emergencyBtn}
        onPress={() => router.push('/sos' as any)}
      >
        <Text style={styles.emergencyText}>🚨 Emergency</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.sageDark,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#fff',
    fontSize: 18,
  },
  headerTitle: {
    fontFamily: Font.serif,
    fontSize: 18,
    color: '#fff',
  },

  // Orb
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  orb: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  orbActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  orbIcon: {
    fontSize: 48,
  },
  orbLabel: {
    fontFamily: Font.sans,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  orbSublabel: {
    fontFamily: Font.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 32,
  },

  // Transcript
  transcriptBubble: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  transcriptText: {
    fontFamily: Font.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Response
  responseBubble: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  responseLabel: {
    fontFamily: Font.sans,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  responseText: {
    fontFamily: Font.sans,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },

  // Error
  errorBubble: {
    width: '100%',
    backgroundColor: 'rgba(201,64,64,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontFamily: Font.sans,
    fontSize: 13,
    color: '#ffaaaa',
  },

  // Emergency
  emergencyBtn: {
    margin: 20,
    padding: 16,
    backgroundColor: '#C94040',
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  emergencyText: {
    fontFamily: Font.sans,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});