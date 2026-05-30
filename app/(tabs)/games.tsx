import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const GAMES = [
  {
    id: 'grid-connect',
    title: 'Grid Connect',
    icon: 'grid-outline',
    color: '#FF9500',
    desc: 'Match Chinese words to their groups',
    route: '/games/grid-connect',
  },
  {
    id: 'line-sort',
    title: 'Line Sort',
    icon: 'list-outline',
    color: '#5856D6',
    desc: 'Drag words into the correct group rows',
    route: '/games/line-sort',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    icon: 'extension-puzzle-outline',
    color: '#FF2D55',
    desc: 'Flip cards to find matching pairs',
    route: '/games/memory-match',
  },
];

export default function GamesScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Learn Through Play</Text>
        <Text style={styles.subtitle}>
          Choose a game to practice your Chinese vocabulary
        </Text>
      </View>

      <View style={styles.gamesList}>
        {GAMES.map(game => (
          <Link key={game.id} href={game.route as any} asChild>
            <TouchableOpacity 
              style={styles.gameCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            >
              <View style={[styles.iconContainer, { backgroundColor: game.color + '15' }]}>
                <Ionicons name={game.icon as any} size={28} color={game.color} />
              </View>
              <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameDesc}>{game.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, paddingTop: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 15, color: '#888', marginTop: 6 },
  gamesList: { padding: 16, gap: 12 },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gameInfo: { flex: 1 },
  gameTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  gameDesc: { fontSize: 13, color: '#888', marginTop: 4 },
});
