import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="word/[hanzi]"
        options={{
          headerShown: true,
          title: 'Word Detail',
          headerBackTitle: 'Back',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="games/grid-connect"
        options={{
          headerShown: true,
          title: 'Grid Connect',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="games/line-sort"
        options={{
          headerShown: true,
          title: 'Line Sort',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="games/memory-match"
        options={{
          headerShown: true,
          title: 'Memory Match',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="flashcards"
        options={{
          headerShown: true,
          title: 'Flashcards',
          headerBackTitle: 'Back',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
