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

interface GameTile {
  id: string;
  text: string;
  groupId: string;
  isWord: boolean; // true = word, false = group label
  matched: boolean;
  selected: boolean;
  wrong: boolean;
}

interface WordGroup {
  id: string;
  name: string;
  words: string[];
}

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 60) / 3;

export default function GridConnectScreen() {
  const [tiles, setTiles] = useState<GameTile[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (gameStarted && !won) {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [gameStarted, won]);

  async function initGame() {
    setLoading(true);
    const settings = await getSettings();
    const words = await getRandomWords(8, settings.hskLevelFilter);

    // Create groups of 2 words each
    const groups: WordGroup[] = [];
    for (let i = 0; i < words.length; i += 2) {
      if (i + 1 < words.length) {
        const groupId = `group_${i}`;
        groups.push({
          id: groupId,
          name: words[i].t.split(';')[0].trim() + ' / ' + words[i + 1].t.split(';')[0].trim(),
          words: [words[i].simp, words[i + 1].simp],
        });
      }
    }

    const gameTiles: GameTile[] = [];
    groups.forEach(group => {
      gameTiles.push({
        id: `${group.id}_label`,
        text: group.name,
        groupId: group.id,
        isWord: false,
        matched: false,
        selected: false,
        wrong: false,
      });
      group.words.forEach((word, idx) => {
        gameTiles.push({
          id: `${group.id}_word_${idx}`,
          text: word,
          groupId: group.id,
          isWord: true,
          matched: false,
          selected: false,
          wrong: false,
        });
      });
    });

    // Shuffle
    for (let i = gameTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameTiles[i], gameTiles[j]] = [gameTiles[j], gameTiles[i]];
    }

    setTiles(gameTiles);
    setLoading(false);
  }

  function handleTap(tileId: string) {
    if (!gameStarted) setGameStarted(true);

    const tappedTile = tiles.find(t => t.id === tileId);
    if (!tappedTile || tappedTile.matched) return;

    if (selectedTile === null) {
      setTiles(tiles.map(t => ({ ...t, selected: t.id === tileId })));
      setSelectedTile(tileId);
    } else {
      const firstTile = tiles.find(t => t.id === selectedTile);
      if (!firstTile) return;

      if (firstTile.id === tileId) {
        // Deselect
        setTiles(tiles.map(t => ({ ...t, selected: false })));
        setSelectedTile(null);
        return;
      }

      // Check if one is word and one is label, same group
      if (
        firstTile.groupId === tappedTile.groupId &&
        firstTile.isWord !== tappedTile.isWord
      ) {
        // Correct match
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newTiles = tiles.map(t =>
          t.id === firstTile.id || t.id === tappedTile.id
            ? { ...t, matched: true, selected: false }
            : { ...t, selected: false }
        );
        setTiles(newTiles);
        setScore(s => s + 1);
        setSelectedTile(null);

        if (newTiles.every(t => t.matched || !t.isWord)) {
          setWon(true);
          saveGameResult({
            gameType: 'grid-connect',
            score: score + 1,
            timeSeconds: timer,
            date: Date.now(),
            wordsUsed: tiles.filter(t => t.isWord).length,
          });
        }
      } else {
        // Wrong match - show flash
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTiles(
          tiles.map(t =>
            t.id === firstTile.id || t.id === tappedTile.id
              ? { ...t, wrong: true, selected: false }
              : t
          )
        );
        setTimeout(() => {
          setTiles(prev =>
            prev.map(t => (t.wrong ? { ...t, wrong: false } : t))
          );
        }, 600);
        setSelectedTile(null);
      }
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  if (won) {
    return (
      <View style={styles.centered}>
        <Text style={styles.winEmoji}>🎉</Text>
        <Text style={styles.winTitle}>You Win!</Text>
        <Text style={styles.winScore}>Score: {score}</Text>
        <Text style={styles.winTime}>Time: {timer}s</Text>
        <TouchableOpacity style={styles.playAgain} onPress={initGame}>
          <Text style={styles.playAgainText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.scoreText}>Matches: {score}</Text>
        <Text style={styles.timerText}>{timer}s</Text>
      </View>

      <Text style={styles.instruction}>
        Tap a group label, then tap the words that belong to it.
      </Text>

      <View style={styles.grid}>
        {tiles.map(tile => (
          <TouchableOpacity
            key={tile.id}
            style={[
              styles.tile,
              tile.isWord ? styles.wordTile : styles.groupTile,
              tile.selected && styles.tileSelected,
              tile.matched && styles.tileMatched,
              tile.wrong && styles.tileWrong,
            ]}
            onPress={() => handleTap(tile.id)}
            disabled={tile.matched}
          >
            <Text
              style={[
                styles.tileText,
                tile.isWord ? styles.wordTileText : styles.groupTileText,
                tile.selected && styles.tileTextSelected,
                tile.matched && styles.tileTextMatched,
              ]}
              numberOfLines={2}
            >
              {tile.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 30 },
  loadingText: { fontSize: 16, color: '#888' },
  winEmoji: { fontSize: 64, marginBottom: 16 },
  winTitle: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 12 },
  winScore: { fontSize: 18, color: '#333', marginBottom: 4 },
  winTime: { fontSize: 16, color: '#888', marginBottom: 24 },
  playAgain: { backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  playAgainText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  scoreText: { fontSize: 17, fontWeight: '600', color: '#333' },
  timerText: { fontSize: 17, color: '#888', fontVariant: ['tabular-nums'] as any },
  instruction: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 20, marginBottom: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 30,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    borderWidth: 2,
  },
  wordTile: { backgroundColor: '#f0f4ff', borderColor: '#c8d8ff' },
  groupTile: { backgroundColor: '#fff8f0', borderColor: '#ffe0b0' },
  tileSelected: { borderColor: '#007AFF', backgroundColor: '#e8f0ff', borderWidth: 3 },
  tileMatched: { backgroundColor: '#e8f8e8', borderColor: '#b0e0b0', opacity: 0.5 },
  tileWrong: { backgroundColor: '#ffe0e0', borderColor: '#ff6b6b' },
  tileText: { textAlign: 'center' },
  wordTileText: { fontSize: 20, fontWeight: '600', color: '#333' },
  groupTileText: { fontSize: 12, color: '#996600', fontWeight: '500' },
  tileTextSelected: { color: '#007AFF' },
  tileTextMatched: { color: '#888' },
});
