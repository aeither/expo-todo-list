import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { getWordByHanzi } from '../../src/lib/database';
import { addBookmark, removeBookmark } from '../../src/lib/storage';
import { VocabEntry } from '../../src/types';
import { useTTS } from '../../src/hooks/useTTS';

const SAMPLE_TEXTS = [
  '你好！今天天气很好。我们去公园散步吧。',
  '我喜欢学习中文。中文很有意思，也很有用。',
  '中国有很多好吃的食物。我最喜欢饺子和面条。',
  '我的朋友在北京工作。他每天坐地铁上班。',
];

function segmentChinese(text: string): string[] {
  const words: string[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (/[\u4e00-\u9fff]/.test(char)) {
      words.push(char);
      i++;
    } else if (/\s/.test(char)) {
      i++;
    } else {
      let chunk = '';
      while (i < text.length && !/[\u4e00-\u9fff\s]/.test(text[i])) {
        chunk += text[i];
        i++;
      }
      if (chunk) words.push(chunk);
    }
  }
  return words;
}

export default function ReaderScreen() {
  const [text, setText] = useState('');
  const [segments, setSegments] = useState<string[]>([]);
  const [lookupWord, setLookupWord] = useState<VocabEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [pinyinMap, setPinyinMap] = useState<Record<number, string>>({});

  function handleTextChange(t: string) {
    setText(t);
    const segs = segmentChinese(t);
    setSegments(segs);
    // Look up pinyin for all Chinese chars
    lookupPinyin(segs);
  }

  async function lookupPinyin(segs: string[]) {
    const map: Record<number, string> = {};
    for (let i = 0; i < segs.length; i++) {
      if (/[\u4e00-\u9fff]/.test(segs[i])) {
        const entry = await getWordByHanzi(segs[i]);
        if (entry) {
          map[i] = entry.p;
        }
      }
    }
    setPinyinMap(map);
  }

  async function handleWordTap(word: string) {
    if (!/[\u4e00-\u9fff]/.test(word)) return;
    setLookingUp(true);
    setModalVisible(true);
    const entry = await getWordByHanzi(word);
    setLookupWord(entry);
    setLookingUp(false);
  }

  async function handleBookmark(entry: VocabEntry) {
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

  async function handleUnbookmark(hanzi: string) {
    await removeBookmark(hanzi);
  }

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
    >
      {/* Text Input */}
      <View style={styles.inputSection}>
        <View style={styles.inputHeader}>
          <Text style={styles.sectionTitle}>Paste Chinese Text</Text>
          <TouchableOpacity
            style={[styles.pinyinToggle, showPinyin && styles.pinyinToggleOn]}
            onPress={() => setShowPinyin(!showPinyin)}
          >
            <Text style={[styles.pinyinToggleText, showPinyin && styles.pinyinToggleTextOn]}>
              Pinyin {showPinyin ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.textArea}
          placeholder="Paste Chinese text here to read and look up words..."
          value={text}
          onChangeText={handleTextChange}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Sample Texts */}
      {!text && (
        <View style={styles.samplesSection}>
          <Text style={styles.samplesTitle}>Sample Texts</Text>
          {SAMPLE_TEXTS.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.sampleCard}
              onPress={() => handleTextChange(s)}
            >
              <Text style={styles.sampleText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Rendered Text with Pinyin */}
      {segments.length > 0 && (
        <View style={styles.readingArea}>
          <Text style={styles.sectionTitle}>Reading View</Text>
          <View style={styles.readingContent}>
            {segments.map((seg, i) => (
              <TouchableOpacity
                key={i}
                style={styles.wordBlock}
                onPress={() => handleWordTap(seg)}
              >
                {showPinyin && pinyinMap[i] && (
                  <Text style={styles.pinyinText}>{pinyinMap[i]}</Text>
                )}
                <Text
                  style={[
                    styles.charText,
                    /[\u4e00-\u9fff]/.test(seg) && styles.chineseChar,
                  ]}
                >
                  {seg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Word Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          {lookingUp ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 60 }} />
          ) : lookupWord ? (
            <ReaderModalContent lookupWord={lookupWord} onBookmark={handleBookmark} />
          ) : (
            <Text style={styles.notFound}>Word not found in dictionary</Text>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

function ReaderModalContent({
  lookupWord,
  onBookmark,
}: {
  lookupWord: VocabEntry;
  onBookmark: (entry: VocabEntry) => void;
}) {
  const { speak, speaking } = useTTS();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={styles.wordDetail}>
        <Text style={styles.detailHanzi}>{lookupWord.simp}</Text>
        {lookupWord.trad !== lookupWord.simp && (
          <Text style={styles.detailTrad}>{lookupWord.trad}</Text>
        )}
        <View style={styles.detailPinyinRow}>
          <Text style={styles.detailPinyin}>{lookupWord.p}</Text>
          <TouchableOpacity
            style={[styles.speakerBtnSmall, speaking && styles.speakerBtnActive]}
            onPress={() => speak(lookupWord.simp)}
          >
            <Text style={styles.speakerIconSmall}>{speaking ? '🔊' : '🔈'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.detailEnglish}>{lookupWord.t}</Text>
        <View style={styles.detailMeta}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>HSK {lookupWord.l}</Text>
          </View>
          {lookupWord.s && (
            <View style={[styles.badge, styles.posBadge]}>
              <Text style={styles.badgeText}>{lookupWord.s}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.modalActions}>
        <Link href={`/word/${encodeURIComponent(lookupWord.simp)}`} asChild>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Full Details</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          style={[styles.actionButton, styles.bookmarkButton]}
          onPress={() => onBookmark(lookupWord)}
        >
          <Text style={styles.actionButtonText}>Bookmark</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inputSection: { padding: 16 },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  pinyinToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
  },
  pinyinToggleOn: { backgroundColor: '#007AFF' },
  pinyinToggleText: { fontSize: 13, color: '#666', fontWeight: '600' },
  pinyinToggleTextOn: { color: '#fff' },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#f9f9f9',
    lineHeight: 24,
  },
  samplesSection: { padding: 16 },
  samplesTitle: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 10 },
  sampleCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sampleText: { fontSize: 16, lineHeight: 24, color: '#333' },
  readingArea: { padding: 16 },
  readingContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 2,
  },
  wordBlock: { alignItems: 'center', paddingHorizontal: 4, paddingVertical: 6 },
  pinyinText: { fontSize: 11, color: '#888', marginBottom: 2 },
  charText: { fontSize: 20, color: '#333' },
  chineseChar: { fontSize: 22, fontWeight: '500' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16 },
  modalClose: { color: '#007AFF', fontSize: 17 },
  wordDetail: { alignItems: 'center', padding: 24 },
  detailHanzi: { fontSize: 48, fontWeight: '600', color: '#333', marginBottom: 4 },
  detailTrad: { fontSize: 18, color: '#999', marginBottom: 12 },
  detailPinyinRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  detailPinyin: { fontSize: 22, color: '#007AFF' },
  detailEnglish: { fontSize: 18, color: '#333', textAlign: 'center' },
  detailMeta: { flexDirection: 'row', gap: 8, marginTop: 16 },
  badge: { backgroundColor: '#e8f0fe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  posBadge: { backgroundColor: '#f0f0f0' },
  badgeText: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  notFound: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 16 },
  modalActions: { flexDirection: 'row', padding: 16, gap: 12, justifyContent: 'center' },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bookmarkButton: { backgroundColor: '#34C759' },
  actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  speakerBtnSmall: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  speakerBtnActive: {
    backgroundColor: '#007AFF20',
  },
  speakerIconSmall: { fontSize: 18 },
});
