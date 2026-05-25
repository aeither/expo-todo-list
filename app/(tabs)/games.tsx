import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const GAMES = [
  {
    id: 'grid-connect',
    title: 'Grid Connect',
    emoji: '🔗',
    desc: 'Match Chinese words to their groups',
    route: '/games/grid-connect',
  },
  {
    id: 'line-sort',
    title: 'Line Sort',
    emoji: '📋',
    desc: 'Drag words into the correct group rows',
    route: '/games/line-sort',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    emoji: '🧠',
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
            <TouchableOpacity style={styles.gameCard}>
              <Text style={styles.gameEmoji}>{game.emoji}</Text>
              <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameDesc}>{game.desc}</Text>
              </View>
              <Text style={styles.gameArrow}>›</Text>
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
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eee',
  },
  gameEmoji: { fontSize: 32, marginRight: 16 },
  gameInfo: { flex: 1 },
  gameTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  gameDesc: { fontSize: 13, color: '#888', marginTop: 4 },
  gameArrow: { fontSize: 24, color: '#ccc', fontWeight: '300' },
});
