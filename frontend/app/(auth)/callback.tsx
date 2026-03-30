import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import * as Linking from 'expo-linking';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuthStore();
  const hasProcessed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        // Get the URL
        const url = await Linking.getInitialURL();
        let sessionId: string | null = null;
        
        if (Platform.OS === 'web') {
          // On web, check hash fragment
          const hash = window.location.hash;
          if (hash) {
            const params = new URLSearchParams(hash.slice(1));
            sessionId = params.get('session_id');
          }
        } else if (url) {
          // On mobile, parse the URL
          const parsed = Linking.parse(url);
          sessionId = parsed.queryParams?.session_id as string;
        }

        if (sessionId) {
          await login(sessionId);
          
          // Clear the hash on web
          if (Platform.OS === 'web') {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          router.replace('/(tabs)/play');
        } else {
          setError('No session ID found');
          setTimeout(() => router.replace('/(auth)/login'), 2000);
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.subText}>Redirecting to login...</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.text}>Signing you in...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#E74C3C',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: '#888888',
  },
});
