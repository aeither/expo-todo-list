import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookmarkedWord, FlashCard, AppSettings, GameResult } from '../types';

// ---- Bookmarks ----

const BOOKMARKS_KEY = 'bookmarks';

export async function getBookmarks(): Promise<BookmarkedWord[]> {
  try {
    const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addBookmark(word: BookmarkedWord): Promise<void> {
  const bookmarks = await getBookmarks();
  if (!bookmarks.some(b => b.hanzi === word.hanzi)) {
    bookmarks.unshift({ ...word, bookmarkedAt: Date.now() });
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }
}

export async function removeBookmark(hanzi: string): Promise<void> {
  const bookmarks = await getBookmarks();
  const filtered = bookmarks.filter(b => b.hanzi !== hanzi);
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
}

export async function isBookmarked(hanzi: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  return bookmarks.some(b => b.hanzi === hanzi);
}

// ---- Flashcards (SRS) ----

const FLASHCARDS_KEY = 'flashcards';

export async function getFlashcards(): Promise<FlashCard[]> {
  try {
    const data = await AsyncStorage.getItem(FLASHCARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addFlashcard(word: BookmarkedWord): Promise<void> {
  const cards = await getFlashcards();
  if (!cards.some(c => c.hanzi === word.hanzi)) {
    cards.push({
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      english: word.english,
      hskLevel: word.hskLevel,
      interval: 0,
      dueDate: Date.now(),
      repetitions: 0,
      easeFactor: 2.5,
      lastReviewed: null,
    });
    await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  }
}

export async function importBookmarksToFlashcards(): Promise<number> {
  const bookmarks = await getBookmarks();
  const cards = await getFlashcards();
  let added = 0;

  for (const bm of bookmarks) {
    if (!cards.some(c => c.hanzi === bm.hanzi)) {
      cards.push({
        hanzi: bm.hanzi,
        pinyin: bm.pinyin,
        english: bm.english,
        hskLevel: bm.hskLevel,
        interval: 0,
        dueDate: Date.now(),
        repetitions: 0,
        easeFactor: 2.5,
        lastReviewed: null,
      });
      added++;
    }
  }

  if (added > 0) {
    await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  }

  return added;
}

export async function removeFlashcard(hanzi: string): Promise<void> {
  const cards = await getFlashcards();
  const filtered = cards.filter(c => c.hanzi !== hanzi);
  await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(filtered));
}

export async function updateFlashcard(
  hanzi: string,
  updates: Partial<FlashCard>
): Promise<void> {
  const cards = await getFlashcards();
  const index = cards.findIndex(c => c.hanzi === hanzi);
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updates };
    await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  }
}

export async function getDueCards(): Promise<FlashCard[]> {
  const cards = await getFlashcards();
  const now = Date.now();
  return cards.filter(c => c.dueDate <= now);
}

// ---- App Settings ----

const SETTINGS_KEY = 'settings';

const DEFAULT_SETTINGS: AppSettings = {
  showPinyin: true,
  hskLevelFilter: [1, 2, 3],
  dailyReviewGoal: 20,
  gameDifficulty: 'medium',
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

// ---- Game Results ----

const GAME_RESULTS_KEY = 'game_results';

export async function getGameResults(): Promise<GameResult[]> {
  try {
    const data = await AsyncStorage.getItem(GAME_RESULTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveGameResult(result: GameResult): Promise<void> {
  const results = await getGameResults();
  results.unshift(result);
  const trimmed = results.slice(0, 50);
  await AsyncStorage.setItem(GAME_RESULTS_KEY, JSON.stringify(trimmed));
}

// ---- Streak ----

const STREAK_KEY = 'streak_data';

interface StreakData {
  lastStudyDate: string | null; // YYYY-MM-DD
  currentStreak: number;
  bestStreak: number;
  totalCardsStudied: number;
}

export async function getStreakData(): Promise<StreakData> {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : { lastStudyDate: null, currentStreak: 0, bestStreak: 0, totalCardsStudied: 0 };
  } catch {
    return { lastStudyDate: null, currentStreak: 0, bestStreak: 0, totalCardsStudied: 0 };
  }
}

export async function updateStreak(cardsStudied: number): Promise<StreakData> {
  const data = await getStreakData();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  data.totalCardsStudied += cardsStudied;

  if (data.lastStudyDate === today) {
    // Already studied today, just update totals
  } else if (data.lastStudyDate === yesterday) {
    data.currentStreak += 1;
  } else {
    data.currentStreak = 1;
  }

  data.lastStudyDate = today;
  if (data.currentStreak > data.bestStreak) {
    data.bestStreak = data.currentStreak;
  }

  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
  return data;
}
