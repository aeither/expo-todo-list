import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getRandomWords } from '../../src/lib/database';
import { getSettings, saveGameResult } from '../../src/lib/storage';
import { VocabEntry } from '../../src/types';

interface GameTile {
  id: string;
  text: string;
  groupId: string;
  pinyin: string;
  selected: boolean;
}

interface GroupRow {
  id: string;
  label: string;
  tiles: GameTile[];
  completed: boolean;
}

export default function LineSortScreen() {
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [unassigned, setUnassigned] = useState<GameTile[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
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

    const groupMap: Record<string, { label: string; tiles: GameTile[] }> = {};
    const allTiles: GameTile[] = [];

    words.forEach(w => {
      const groupLabel = w.t.split(';')[0].trim();
      const groupId = groupLabel.toLowerCase().replace(/\s+/g, '_');
      const tile: GameTile = {
        id: w.simp,
        text: w.simp,
        groupId,
        pinyin: w.p,
        selected: false,
      };
      allTiles.push(tile);

      if (!groupMap[groupId]) {
        groupMap[groupId] = { label: groupLabel, tiles: [] };
      }
      groupMap[groupId].tiles.push(tile);
    });

    // Filter groups with at least 2 items
    const validGroups = Object.entries(groupMap).filter(([_, g]) => g.tiles.length >= 2);

    // Create 3 rows from first 3 groups with mixed tiles
    const selected = validGroups.slice(0, 3);
    const gameRows: GroupRow[] = selected.map(([id, group]) => ({
      id,
      label: group.label,
      tiles: [],
      completed: false,
    }));

    // Collect all tiles from selected groups, shuffle into unassigned
    const pool: GameTile[] = [];
    selected.forEach(([_, group]) => {
      pool.push(...group.tiles);
    });

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    setRows(gameRows);
    setUnassigned(pool);
    setSelectedTile(null);
    setMoves(0);
    setWon(false);
    setTimer(0);
    setGameStarted(false);
    setLoading(false);
  }

  function selectTile(tileId: string) {
    if (!gameStarted) setGameStarted(true);

    setSelectedTile(prev => prev === tileId ? null : tileId);
    setUnassigned(prev =>
      prev.map(t => ({ ...t, selected: t.id === tileId && !t.selected ? true : false }))
    );
    setRows(prev =>
      prev.map(row => ({
        ...row,
        tiles: row.tiles.map(t => ({ ...t, selected: t.id === tileId && !t.selected ? true : false })),
      }))
    );
  }

  function moveToRow(rowId: string) {
    if (!selectedTile) return;
    if (!gameStarted) setGameStarted(true);

    // Find the tile
    let tile = unassigned.find(t => t.id === selectedTile);
    let fromUnassigned = true;

    if (!tile) {
      // Check rows
      for (const row of rows) {
        const found = row.tiles.find(t => t.id === selectedTile);
        if (found) {
          tile = found;
          fromUnassigned = false;
          break;
        }
      }
    }

    if (!tile) return;

    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const newTiles = [...row.tiles, { ...tile!, selected: false }];
        const allSameGroup = newTiles.every(t => t.groupId === rowId);
        const nowCompleted = newTiles.length >= 2 && allSameGroup;
        if (nowCompleted && !row.completed) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return {
          ...row,
          tiles: newTiles,
          completed: nowCompleted,
        };
      } else {
        return {
          ...row,
          tiles: row.tiles.filter(t => t.id !== selectedTile),
        };
      }
    });

    setRows(newRows);
    setUnassigned(prev =>
      fromUnassigned
        ? prev.filter(t => t.id !== selectedTile)
        : prev.map(t => ({ ...t, selected: false }))
    );
    setSelectedTile(null);
    setMoves(m => m + 1);

    // Check win
    if (newRows.every(r => r.completed)) {
      setWon(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      saveGameResult({
        gameType: 'line-sort',
        score: moves + 1,
        timeSeconds: timer,
        date: Date.now(),
        wordsUsed: poolSize(),
      });
    }
  }

  function poolSize() {
    return rows.reduce((sum, r) => sum + r.tiles.length, 0) + unassigned.length;
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
        <Text style={styles.winTitle}>All Sorted!</Text>
        <Text style={styles.winScore}>Moves: {moves}</Text>
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
        <Text style={styles.scoreText}>Moves: {moves}</Text>
        <Text style={styles.timerText}>{timer}s</Text>
      </View>

      <Text style={styles.instruction}>
        Tap a word, then tap a group row to sort it there.
      </Text>

      {/* Unassigned pool */}
      <View style={styles.poolSection}>
        <Text style={styles.sectionLabel}>Words</Text>
        <View style={styles.poolGrid}>
          {unassigned.map(tile => (
            <TouchableOpacity
              key={tile.id}
              style={[styles.poolTile, tile.selected && styles.tileSelected]}
              onPress={() => selectTile(tile.id)}
            >
              <Text style={styles.poolTileText}>{tile.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Group Rows */}
      <View style={styles.rowsSection}>
        <Text style={styles.sectionLabel}>Groups</Text>
        {rows.map(row => (
          <TouchableOpacity
            key={row.id}
            style={[
              styles.groupRow,
              row.completed && styles.groupRowComplete,
              selectedTile && styles.groupRowTarget,
            ]}
            onPress={() => moveToRow(row.id)}
          >
            <View style={styles.rowHeader}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.completed && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <View style={styles.rowTiles}>
              {row.tiles.map(tile => (
                <TouchableOpacity
                  key={tile.id}
                  style={[styles.rowTile, tile.selected && styles.tileSelected]}
                  onPress={() => selectTile(tile.id)}
                >
                  <Text style={styles.rowTileText}>{tile.text}</Text>
                </TouchableOpacity>
              ))}
              {row.tiles.length === 0 && (
                <Text style={styles.dropHint}>Drop words here</Text>
              )}
            </View>
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
  poolSection: { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase' },
  poolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  poolTile: {
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#d0d8ff',
  },
  poolTileText: { fontSize: 18, fontWeight: '600', color: '#333' },
  tileSelected: { borderColor: '#007AFF', backgroundColor: '#e8f0ff', borderWidth: 3 },
  rowsSection: { paddingHorizontal: 16, paddingBottom: 30, gap: 12 },
  groupRow: {
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  groupRowComplete: { backgroundColor: '#e8f8e8', borderColor: '#34C759', borderStyle: 'solid' },
  groupRowTarget: { borderColor: '#007AFF', borderStyle: 'solid' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#555' },
  checkMark: { fontSize: 18, color: '#34C759', fontWeight: '700' },
  rowTiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowTile: {
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowTileText: { fontSize: 16, fontWeight: '500', color: '#333' },
  dropHint: { fontSize: 13, color: '#ccc', fontStyle: 'italic' },
});
