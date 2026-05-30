import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getWordByHanzi } from '../../src/lib/database';
import { addBookmark, removeBookmark, isBookmarked, addFlashcard } from '../../src/lib/storage';
import { VocabEntry } from '../../src/types';
import { useTTS } from '../../src/hooks/useTTS';

export default function WordDetailScreen() {
  const { hanzi } = useLocalSearchParams<{ hanzi: string }>();
  const [entry, setEntry] = useState<VocabEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const { speak, speaking } = useTTS();

  useEffect(() => {
    loadWord();
  }, [hanzi]);

  async function loadWord() {
    if (!hanzi) return;
    const word = await getWordByHanzi(decodeURIComponent(hanzi));
    setEntry(word);
    if (word) {
      const bm = await isBookmarked(word.simp);
      setBookmarked(bm);
    }
    setLoading(false);
  }

  async function toggleBookmark() {
    if (!entry) return;
    if (bookmarked) {
      await removeBookmark(entry.simp);
    } else {
      await addBookmark({
        hanzi: entry.simp,
        pinyin: entry.p,
        english: entry.t,
        hskLevel: entry.l,
        pos: entry.s,
        trad: entry.trad,
        bookmarkedAt: Date.now(),
      });
    }
    setBookmarked(!bookmarked);
  }

  async function handleAddFlashcard() {
    if (!entry) return;
    await addFlashcard({
      hanzi: entry.simp,
      pinyin: entry.p,
      english: entry.t,
      hskLevel: entry.l,
      pos: entry.s,
      trad: entry.trad,
      bookmarkedAt: Date.now(),
    });
    Alert.alert('Added', 'Word added to flashcards for review!');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Word not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text style={styles.hanzi}>{entry.simp}</Text>
        {entry.trad !== entry.simp && (
          <Text style={styles.trad}>{entry.trad}</Text>
        )}
        <View style={styles.pinyinRow}>
          <Text style={styles.pinyin}>{entry.p}</Text>
          <TouchableOpacity
            style={[styles.speakerBtn, speaking && styles.speakerBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              speak(entry.simp);
            }}
          >
            <Ionicons 
              name={speaking ? "volume-high" : "volume-medium"} 
              size={24} 
              color={speaking ? "#007AFF" : "#666"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Definition</Text>
        {entry.t.split(';').map((def, i) => (
          <Text key={i} style={styles.definitionItem}>
            {i + 1}. {def.trim()}
          </Text>
        ))}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>HSK Level</Text>
          <Text style={styles.metaValue}>{entry.l}</Text>
        </View>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Part of Speech</Text>
          <Text style={styles.metaValue}>{entry.s || '---'}</Text>
        </View>
      </View>

      {entry.alt && entry.alt.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alternate Meanings</Text>
          {entry.alt.map((alt, i) => (
            <View key={i} style={styles.altRow}>
              <Text style={styles.altPinyin}>{alt.p}</Text>
              <Text style={styles.altMeaning}>{alt.t}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, bookmarked && styles.actionBtnActive]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toggleBookmark();
          }}
        >
          <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={bookmarked ? "#fff" : "#007AFF"} style={{ marginRight: 8 }} />
          <Text style={[styles.actionBtnText, bookmarked && styles.actionBtnTextActive]}>
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.flashcardBtn]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleAddFlashcard();
          }}
        >
          <Ionicons name="layers-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.flashcardBtnText}>Add to Flashcards</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  notFound: { fontSize: 17, color: '#999' },
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#f5f8ff' },
  hanzi: { fontSize: 56, fontWeight: '700', color: '#333' },
  trad: { fontSize: 20, color: '#999', marginTop: 8 },
  pinyinRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  pinyin: { fontSize: 24, color: '#007AFF' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
  definitionItem: { fontSize: 16, color: '#333', lineHeight: 24, marginBottom: 4 },
  metaRow: { flexDirection: 'row', padding: 16, gap: 12 },
  metaCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metaLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  metaValue: { fontSize: 20, fontWeight: '600', color: '#333' },
  altRow: { flexDirection: 'row', paddingVertical: 6, gap: 12, alignItems: 'center' },
  altPinyin: { fontSize: 14, color: '#007AFF', width: 100 },
  altMeaning: { fontSize: 14, color: '#333', flex: 1 },
  actions: { padding: 20, gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  actionBtnActive: { backgroundColor: '#007AFF' },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  actionBtnTextActive: { color: '#fff' },
  flashcardBtn: { backgroundColor: '#34C759', borderColor: '#34C759' },
  flashcardBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  speakerBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  speakerBtnActive: {
    backgroundColor: '#007AFF20',
  },
  speakerIcon: { fontSize: 20 },
});
