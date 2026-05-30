import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { getBookmarks, removeBookmark, importBookmarksToFlashcards } from '../../src/lib/storage';
import { BookmarkedWord } from '../../src/types';

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<BookmarkedWord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  async function loadBookmarks() {
    const b = await getBookmarks();
    setBookmarks(b);
  }

  async function handleDelete(hanzi: string) {
    Alert.alert('Remove Bookmark', 'Remove this word from bookmarks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeBookmark(hanzi);
          loadBookmarks();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookmarks}
        keyExtractor={item => item.hanzi}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Link href={`/dictionary/${encodeURIComponent(item.hanzi)}`} asChild>
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.hanzi}>{item.hanzi}</Text>
                <Text style={styles.pinyin}>{item.pinyin}</Text>
                <Text style={styles.english}>{item.english}</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={styles.levelChip}>
                  <Text style={styles.levelText}>HSK {item.hskLevel}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleDelete(item.hanzi)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔖</Text>
            <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
            <Text style={styles.emptyDesc}>
              Tap a word in the Dictionary or Reader to save it here.
            </Text>
          </View>
        }
      />

      {bookmarks.length > 0 && (
        <Link href="/flashcards" asChild>
          <TouchableOpacity style={styles.studyAllButton}>
            <Text style={styles.studyAllText}>
              Study All ({bookmarks.length} words)
            </Text>
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 16, paddingBottom: 80 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rowMain: { flex: 1 },
  hanzi: { fontSize: 20, fontWeight: '600', color: '#333' },
  pinyin: { fontSize: 13, color: '#888', marginTop: 2 },
  english: { fontSize: 14, color: '#555', marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 8 },
  levelChip: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelText: { fontSize: 11, color: '#007AFF', fontWeight: '600' },
  removeBtn: { padding: 6 },
  removeBtnText: { fontSize: 18, color: '#FF3B30', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
  studyAllButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,122,255,0.3)',
  },
  studyAllText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
