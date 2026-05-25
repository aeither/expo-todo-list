import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getRandomWords } from '../../src/lib/database';
import { getSettings, saveGameResult } from '../../src/lib/storage';
import { VocabEntry } from '../../src/types';

interface Card {
  id: string;
  pairId: number;
  hanzi: string;
  pinyin: string;
  flipped: boolean;
  matched: boolean;
  isHanzi: boolean; // true = shows hanzi, false = shows pinyin
}

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTY_PAIRS: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 8 };

const { width } = Dimensions.get('window');
const CARD_GAP = 8;

export default function MemoryMatchScreen() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'won'>('setup');

  useEffect(() => {
    if (gamePhase === 'playing' && !won) {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [gamePhase, won]);

  async function startGame() {
    setLoading(true);
    setGamePhase('playing');
    const settings = await getSettings();
    const pairCount = DIFFICULTY_PAIRS[difficulty];
    const words = await getRandomWords(pairCount, settings.hskLevelFilter);

    const newCards: Card[] = [];
    words.forEach((w, i) => {
      newCards.push({
        id: `${i}_hanzi`,
        pairId: i,
        hanzi: w.simp,
        pinyin: w.p,
        flipped: false,
        matched: false,
        isHanzi: true,
      });
      newCards.push({
        id: `${i}_pinyin`,
        pairId: i,
        hanzi: w.simp,
        pinyin: w.p,
        flipped: false,
        matched: false,
        isHanzi: false,
      });
    });

    // Shuffle
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }

    setCards(newCards);
    setFlippedIds([]);
    setMoves(0);
    setMatchedCount(0);
    setWon(false);
    setTimer(0);
    setLoading(false);
  }

  function flipCard(cardId: string) {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;
    if (flippedIds.length >= 2) return;

    const newFlipped = [...flippedIds, cardId];
    setFlippedIds(newFlipped);

    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, flipped: true } : c))
    );

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstId, secondId] = newFlipped;
      const first = cards.find(c => c.id === firstId)!;
      const second = cards.find(c => c.id === secondId)!;

      if (first.pairId === second.pairId && first.isHanzi !== second.isHanzi) {
        // Match!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.pairId === first.pairId ? { ...c, matched: true, flipped: true } : c
            )
          );
          setFlippedIds([]);
          const newCount = matchedCount + 1;
          setMatchedCount(newCount);

          if (newCount >= cards.length / 2) {
            setWon(true);
            setGamePhase('won');
            saveGameResult({
              gameType: 'memory-match',
              score: moves + 1,
              timeSeconds: timer,
              date: Date.now(),
              wordsUsed: cards.length,
            });
          }
        }, 500);
      } else {
        // No match
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, flipped: false }
                : c
            )
          );
          setFlippedIds([]);
        }, 800);
      }
    }
  }

  const cols = difficulty === 'easy' ? 4 : 4;
  const cardSize = (width - 32 - CARD_GAP * (cols - 1)) / cols;

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  if (gamePhase === 'setup') {
    return (
      <View style={styles.centered}>
        <Text style={styles.setupTitle}>Memory Match</Text>
        <Text style={styles.setupDesc}>Match Chinese characters with their pinyin</Text>
        <Text style={styles.diffLabel}>Difficulty</Text>
        <View style={styles.diffRow}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.diffChip, difficulty === d && styles.diffChipActive]}
              onPress={() => setDifficulty(d)}
            >
              <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
              <Text style={[styles.diffSub, difficulty === d && styles.diffSubActive]}>
                {DIFFICULTY_PAIRS[d]} pairs
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (won) {
    return (
      <View style={styles.centered}>
        <Text style={styles.winEmoji}>🎉</Text>
        <Text style={styles.winTitle}>All Matched!</Text>
        <Text style={styles.winScore}>Moves: {moves}</Text>
        <Text style={styles.winTime}>Time: {timer}s</Text>
        <TouchableOpacity style={styles.playAgain} onPress={() => setGamePhase('setup')}>
          <Text style={styles.playAgainText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.scoreText}>
          Pairs: {matchedCount}/{cards.length / 2}
        </Text>
        <Text style={styles.scoreText}>Moves: {moves}</Text>
        <Text style={styles.timerText}>{timer}s</Text>
      </View>

      <View style={styles.grid}>
        {cards.map(card => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.card,
              { width: cardSize, height: cardSize },
              card.flipped && !card.matched && styles.cardFlipped,
              card.matched && styles.cardMatched,
            ]}
            onPress={() => flipCard(card.id)}
            activeOpacity={0.8}
          >
            {card.flipped || card.matched ? (
              <View style={styles.cardContent}>
                <Text style={styles.cardMainText}>
                  {card.isHanzi ? card.hanzi : card.pinyin}
                </Text>
                {card.matched && (
                  <Text style={styles.cardSubText}>
                    {card.isHanzi ? card.pinyin : card.hanzi}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.cardBack}>?</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 30 },
  loadingText: { fontSize: 16, color: '#888' },
  setupTitle: { fontSize: 32, fontWeight: '700', color: '#333', marginBottom: 8 },
  setupDesc: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 30 },
  diffLabel: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 12 },
  diffRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  diffChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
  },
  diffChipActive: { backgroundColor: '#e8f0ff', borderColor: '#007AFF' },
  diffText: { fontSize: 15, fontWeight: '600', color: '#666' },
  diffTextActive: { color: '#007AFF' },
  diffSub: { fontSize: 12, color: '#999', marginTop: 4 },
  diffSubActive: { color: '#007AFF' },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  winEmoji: { fontSize: 64, marginBottom: 16 },
  winTitle: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 12 },
  winScore: { fontSize: 18, color: '#333', marginBottom: 4 },
  winTime: { fontSize: 16, color: '#888', marginBottom: 24 },
  playAgain: { backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  playAgainText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  scoreText: { fontSize: 14, fontWeight: '600', color: '#333' },
  timerText: { fontSize: 14, color: '#888', fontVariant: ['tabular-nums'] as any },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: CARD_GAP,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderWidth: 2,
    borderColor: '#d0d8ff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  cardFlipped: { backgroundColor: '#fff', borderColor: '#007AFF' },
  cardMatched: { backgroundColor: '#e8f8e8', borderColor: '#34C759' },
  cardContent: { alignItems: 'center', padding: 4 },
  cardMainText: { fontSize: 20, fontWeight: '600', color: '#333' },
  cardSubText: { fontSize: 11, color: '#888', marginTop: 4 },
  cardBack: { fontSize: 28, color: '#ccc', fontWeight: '700' },
});
