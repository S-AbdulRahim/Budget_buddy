import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Colors } from '../src/theme';

// Prevent splash screen from auto-hiding before fonts are ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore when unsupported on platform */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'budget-buddy-global-web-styles';
      let style = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        body, input, textarea, select, button {
          font-family: 'Inter_400Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        input, textarea, select {
          outline: none !important;
          outline-style: none !important;
          box-shadow: none !important;
          caret-color: ${Colors.primaryLight} !important;
        }
        input:focus, textarea:focus, select:focus,
        input:focus-visible, textarea:focus-visible, select:focus-visible {
          outline: none !important;
          outline-style: none !important;
          box-shadow: none !important;
          caret-color: ${Colors.primaryLight} !important;
        }
        input::selection, textarea::selection {
          background-color: rgba(15, 155, 142, 0.35);
        }
      `;
    }
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      {Platform.OS === 'web' && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              input, textarea, select {
                outline: none !important;
                outline-style: none !important;
                box-shadow: none !important;
                caret-color: ${Colors.primaryLight} !important;
              }
              input:focus, textarea:focus, select:focus,
              input:focus-visible, textarea:focus-visible, select:focus-visible {
                outline: none !important;
                outline-style: none !important;
                box-shadow: none !important;
                caret-color: ${Colors.primaryLight} !important;
              }
              input::selection, textarea::selection {
                background-color: rgba(15, 155, 142, 0.35);
              }
            `,
          }}
        />
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
    </>
  );
}
