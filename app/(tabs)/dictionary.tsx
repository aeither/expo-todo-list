import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Link } from 'expo-router';
import { searchDictionary, isDatabaseSeeded, seedDatabase } from '../../src/lib/database';
import { getSettings } from '../../src/lib/storage';
import { VocabEntry } from '../../src/types';
import { useTTS } from '../../src/hooks/useTTS';

const HSK_LEVELS = [1, 2, 3, 4, 5, 6];

export default function DictionaryScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VocabEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1, 2, 3]);

  useEffect(() => {
    initDatabase();
  }, []);

  async function initDatabase() {
    const seeded = await isDatabaseSeeded();
    if (!seeded) {
      try {
        const data = require('../../assets/data/hsk.json');
        await seedDatabase(data);
      } catch (e) {
        console.error('Failed to seed database:', e);
      }
    }
    setSeeding(false);
    const settings = await getSettings();
    setSelectedLevels(settings.hskLevelFilter);
  }

  async function doSearch() {
    if (query.trim().length === 0) return;
    setLoading(true);
    const res = await searchDictionary(query.trim(), selectedLevels);
    setResults(res);
    setLoading(false);
  }

  function toggleLevel(level: number) {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level].sort()
    );
  }

  if (seeding) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.seedingText}>Loading dictionary...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search hanzi, pinyin, or english..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={doSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* HSK Level Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {HSK_LEVELS.map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterChip,
              selectedLevels.includes(level) && styles.filterChipActive,
            ]}
            onPress={() => toggleLevel(level)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedLevels.includes(level) && styles.filterChipTextActive,
              ]}
            >
              HSK {level}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#007AFF" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.simp}
          renderItem={({ item }) => <DictRow entry={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            query.length > 0 ? (
              <Text style={styles.emptyText}>
                No results found. Try a different search.
              </Text>
            ) : (
              <Text style={styles.emptyText}>
                Search for Chinese words above.{'\n'}
                Try "你好", "pinyin", or "hello"
              </Text>
            )
          }
        />
      )}
    </View>
  );
}

function DictRow({ entry }: { entry: VocabEntry }) {
  const { speak, speaking } = useTTS();

  return (
    <View style={styles.resultRow}>
      <Link href={`/word/${encodeURIComponent(entry.simp)}`} asChild>
        <TouchableOpacity style={styles.resultContent}>
          <View style={styles.resultLeft}>
            <Text style={styles.resultHanzi}>{entry.simp}</Text>
            {entry.trad !== entry.simp && (
              <Text style={styles.resultTrad}>{entry.trad}</Text>
            )}
          </View>
          <View style={styles.resultRight}>
            <Text style={styles.resultPinyin}>{entry.p}</Text>
            <Text style={styles.resultEnglish} numberOfLines={1}>
              {entry.t.split(';')[0].trim()}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>HSK {entry.l}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity
        style={[styles.speakerBtn, speaking && styles.speakerBtnActive]}
        onPress={() => speak(entry.simp)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.speakerIcon}>{speaking ? '🔊' : '🔈'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  seedingText: { marginTop: 12, color: '#666', fontSize: 15 },
  container: { flex: 1, backgroundColor: '#fff' },
  searchContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  filterRow: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterChipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  loader: { marginTop: 40 },
  listContent: { paddingHorizontal: 12, paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 15, marginTop: 60 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  resultLeft: { width: 60, alignItems: 'center' },
  resultHanzi: { fontSize: 22, fontWeight: '600', color: '#333' },
  resultTrad: { fontSize: 12, color: '#999', marginTop: 2 },
  resultRight: { flex: 1, marginLeft: 14 },
  resultPinyin: { fontSize: 14, color: '#888' },
  resultEnglish: { fontSize: 15, color: '#333', marginTop: 2 },
  levelBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: { fontSize: 11, color: '#007AFF', fontWeight: '600' },
  speakerBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  speakerBtnActive: {
    backgroundColor: '#007AFF20',
  },
  speakerIcon: { fontSize: 18 },
});
