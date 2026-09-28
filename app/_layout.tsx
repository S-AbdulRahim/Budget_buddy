import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/theme';

export default function RootLayout() {
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
