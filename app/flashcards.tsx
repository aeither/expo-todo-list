import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  getDueCards,
  updateFlashcard,
  updateStreak,
  getStreakData,
} from '../src/lib/storage';
import { FlashCard } from '../src/types';
import { useTTS } from '../src/hooks/useTTS';

const SR_INTERVALS = [1, 2, 4, 7, 15, 30, 60, 120];

export default function FlashcardsScreen() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ known: 0, unknown: 0 });
  const [streak, setStreak] = useState({ currentStreak: 0 });
  const { speak, speaking } = useTTS();

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  async function loadCards() {
    const due = await getDueCards();
    setCards(due);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionComplete(false);
    setSessionStats({ known: 0, unknown: 0 });
    const s = await getStreakData();
    setStreak(s);
  }

  function flipCard() {
    setShowAnswer(true);
  }

  async function answer(known: boolean) {
    const card = cards[currentIndex];
    if (!card) return;

    Haptics.notificationAsync(
      known
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );

    const newReps = known ? card.repetitions + 1 : 0;
    const intervalIdx = Math.min(newReps, SR_INTERVALS.length - 1);
    const newInterval = known ? SR_INTERVALS[intervalIdx] : 0;
    const newEase = known
      ? Math.min(card.easeFactor + 0.1, 3.0)
      : Math.max(card.easeFactor - 0.2, 1.3);

    await updateFlashcard(card.hanzi, {
      interval: newInterval,
      dueDate: Date.now() + newInterval * 86400000,
      repetitions: newReps,
      easeFactor: newEase,
      lastReviewed: Date.now(),
    });

    const newStats = {
      known: sessionStats.known + (known ? 1 : 0),
      unknown: sessionStats.unknown + (known ? 0 : 1),
    };
    setSessionStats(newStats);

    if (currentIndex + 1 >= cards.length) {
      setSessionComplete(true);
      await updateStreak(newStats.known + newStats.unknown);
    } else {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  }

  if (sessionComplete) {
    const total = sessionStats.known + sessionStats.unknown;
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeEmoji}>🎉</Text>
        <Text style={styles.completeTitle}>Session Complete!</Text>
        <View style={styles.statsBox}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Reviewed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#34C759' }]}>
              {sessionStats.known}
            </Text>
            <Text style={styles.statLabel}>Known</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF3B30' }]}>
              {sessionStats.unknown}
            </Text>
            <Text style={styles.statLabel}>Review</Text>
          </View>
        </View>
        <Text style={styles.streakText}>
          🔥 {streak.currentStreak} day streak
        </Text>
        <TouchableOpacity style={styles.doneButton} onPress={loadCards}>
          <Text style={styles.doneButtonText}>Review Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📚</Text>
        <Text style={styles.emptyTitle}>All Caught Up!</Text>
        <Text style={styles.emptyDesc}>
          No cards due for review. Add words to flashcards from the Dictionary or Bookmarks tabs.
        </Text>
      </View>
    );
  }

  const card = cards[currentIndex];
  const progress = `${currentIndex + 1}/${cards.length}`;

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>{progress}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / cards.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={flipCard}
        activeOpacity={0.9}
        disabled={showAnswer}
      >
        <View style={styles.cardInner}>
          <Text style={styles.cardHanzi}>{card.hanzi}</Text>
          {showAnswer ? (
            <View style={styles.answerArea}>
              <Text style={styles.cardPinyin}>{card.pinyin}</Text>
              <Text style={styles.cardEnglish}>{card.english}</Text>
              <Text style={styles.cardLevel}>HSK {card.hskLevel}</Text>
            </View>
          ) : (
            <View style={styles.frontActions}>
              <TouchableOpacity
                style={[styles.speakerBtn, speaking && styles.speakerBtnActive]}
                onPress={() => speak(card.hanzi)}
              >
                <Text style={styles.speakerIcon}>{speaking ? '🔊' : '🔈'}</Text>
              </TouchableOpacity>
              <Text style={styles.tapHint}>Tap card to reveal</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Buttons */}
      {showAnswer && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.rateButton, styles.dontKnowButton]}
            onPress={() => answer(false)}
          >
            <Text style={styles.dontKnowText}>Don't Know</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rateButton, styles.knowButton]}
            onPress={() => answer(true)}
          >
            <Text style={styles.knowText}>Know</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  progressBar: { marginBottom: 24 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 14, color: '#888' },
  progressTrack: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f8ff',
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e8ff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  cardInner: { alignItems: 'center', padding: 30 },
  cardHanzi: { fontSize: 64, fontWeight: '700', color: '#333' },
  answerArea: { marginTop: 30, alignItems: 'center' },
  cardPinyin: { fontSize: 24, color: '#007AFF', marginBottom: 10 },
  cardEnglish: { fontSize: 20, color: '#333', textAlign: 'center' },
  cardLevel: { fontSize: 14, color: '#888', marginTop: 12, fontWeight: '500' },
  frontActions: { alignItems: 'center', gap: 16, marginTop: 8 },
  tapHint: { fontSize: 16, color: '#aaa' },
  speakerBtn: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  speakerBtnActive: {
    backgroundColor: '#007AFF20',
  },
  speakerIcon: { fontSize: 22 },
  buttonRow: { flexDirection: 'row', gap: 12, paddingBottom: 20 },
  rateButton: { flex: 1, borderRadius: 14, padding: 18, alignItems: 'center' },
  dontKnowButton: { backgroundColor: '#FFF1F0', borderWidth: 2, borderColor: '#FF3B30' },
  dontKnowText: { fontSize: 17, fontWeight: '600', color: '#FF3B30' },
  knowButton: { backgroundColor: '#007AFF' },
  knowText: { fontSize: 17, fontWeight: '600', color: '#fff' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
  completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  completeEmoji: { fontSize: 64, marginBottom: 16 },
  completeTitle: { fontSize: 26, fontWeight: '700', color: '#333', marginBottom: 24 },
  statsBox: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '700', color: '#333' },
  statLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  streakText: { fontSize: 16, color: '#FF9500', fontWeight: '600', marginBottom: 24 },
  doneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
