import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import * as Linking from 'expo-linking';

export default function Index() {
  const router = useRouter();
  const { checkAuth, isLoading, isAuthenticated, login, setLoading } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      // Check for OAuth callback with session_id
      const url = await Linking.getInitialURL();
      if (url) {
        const parsed = Linking.parse(url);
        // Handle session_id from hash fragment
        if (parsed.queryParams?.session_id) {
          try {
            await login(parsed.queryParams.session_id as string);
            router.replace('/(tabs)/play');
            return;
          } catch (error) {
            console.error('Login error:', error);
          }
        }
      }
      
      // Check existing auth
      const authenticated = await checkAuth();
      setChecking(false);
      
      if (authenticated) {
        router.replace('/(tabs)/play');
      } else {
        router.replace('/(auth)/login');
      }
    };

    handleAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>♔</Text>
      <Text style={styles.title}>Chess Master</Text>
      <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
      <Text style={styles.loadingText}>Loading...</Text>
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
  logo: {
    fontSize: 80,
    color: '#FFD700',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
  },
});
