import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WebContainer from '../components/WebContainer';
import { CacheProvider } from '../contexts/CacheContext';
import { ToastProvider } from '../contexts/ToastContext';
import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <CacheProvider>
          <WebContainer>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(student)" />
              <Stack.Screen name="(staff)" />
            </Stack>
          </WebContainer>
        </CacheProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

