import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { getDueCards, getStreakData, getBookmarks } from '../../src/lib/storage';
import { FlashCard } from '../../src/types';

export default function HomeScreen() {
  const [dueCards, setDueCards] = useState<FlashCard[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [streak, setStreak] = useState({ currentStreak: 0, totalCardsStudied: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setLoading(true);
    const [cards, bms, strk] = await Promise.all([
      getDueCards(),
      getBookmarks(),
      getStreakData(),
    ]);
    setDueCards(cards);
    setBookmarkCount(bms.length);
    setStreak(strk);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Streak + Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak.totalCardsStudied}</Text>
          <Text style={styles.statLabel}>Cards Studied</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bookmarkCount}</Text>
          <Text style={styles.statLabel}>Bookmarks</Text>
        </View>
      </View>

      {/* Flashcard Review CTA */}
      {dueCards.length > 0 && (
        <Link href="/flashcards" asChild>
          <TouchableOpacity style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Review Due!</Text>
            <Text style={styles.reviewSubtitle}>
              {dueCards.length} cards waiting for review
            </Text>
          </TouchableOpacity>
        </Link>
      )}

      {/* Quick Access Grid */}
      <Text style={styles.sectionTitle}>Explore</Text>
      <View style={styles.grid}>
        <Link href="/dictionary" asChild>
          <TouchableOpacity style={styles.gridCard}>
            <Text style={styles.gridEmoji}>📖</Text>
            <Text style={styles.gridTitle}>Dictionary</Text>
            <Text style={styles.gridDesc}>Search 11,000+ words</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/reader" asChild>
          <TouchableOpacity style={styles.gridCard}>
            <Text style={styles.gridEmoji}>📰</Text>
            <Text style={styles.gridTitle}>Reader</Text>
            <Text style={styles.gridDesc}>Read & learn Chinese</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/games" asChild>
          <TouchableOpacity style={styles.gridCard}>
            <Text style={styles.gridEmoji}>🎮</Text>
            <Text style={styles.gridTitle}>Games</Text>
            <Text style={styles.gridDesc}>Learn through play</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/flashcards" asChild>
          <TouchableOpacity style={styles.gridCard}>
            <Text style={styles.gridEmoji}>🃏</Text>
            <Text style={styles.gridTitle}>Flashcards</Text>
            <Text style={styles.gridDesc}>Spaced repetition</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/bookmarks" asChild>
          <TouchableOpacity style={styles.gridCard}>
            <Text style={styles.gridEmoji}>🔖</Text>
            <Text style={styles.gridTitle}>Bookmarks</Text>
            <Text style={styles.gridDesc}>{bookmarkCount} saved words</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Recent Bookmarks Preview */}
      {bookmarkCount > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Bookmarks</Text>
          <RecentBookmarks />
        </>
      )}
    </ScrollView>
  );
}

function RecentBookmarks() {
  const [recent, setRecent] = useState<{ hanzi: string; pinyin: string; english: string }[]>([]);

  useEffect(() => {
    getBookmarks().then(b => setRecent(b.slice(0, 5)));
  }, []);

  return (
    <View style={styles.recentList}>
      {recent.map((b, i) => (
        <Link key={i} href={`/word/${encodeURIComponent(b.hanzi)}`} asChild>
          <TouchableOpacity style={styles.recentItem}>
            <View>
              <Text style={styles.recentHanzi}>{b.hanzi}</Text>
              <Text style={styles.recentPinyin}>{b.pinyin}</Text>
            </View>
            <Text style={styles.recentEnglish}>{b.english}</Text>
          </TouchableOpacity>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  reviewCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    padding: 20,
  },
  reviewTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  reviewSubtitle: { color: '#fff', opacity: 0.8, fontSize: 14, marginTop: 4 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 24,
  },
  gridCard: {
    width: '47%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  gridEmoji: { fontSize: 28, marginBottom: 8 },
  gridTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  gridDesc: { fontSize: 12, color: '#888', marginTop: 4 },
  recentList: { marginHorizontal: 16, marginBottom: 24, gap: 8 },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  recentHanzi: { fontSize: 18, fontWeight: '600', color: '#333' },
  recentPinyin: { fontSize: 13, color: '#888', marginTop: 2 },
  recentEnglish: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
});
