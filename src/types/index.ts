// Types for the Chinese Learning App

export interface VocabEntry {
  p: string;       // pinyin
  t: string;       // english translation
  simp: string;    // simplified chinese
  trad: string;    // traditional chinese
  s: string;       // part of speech
  l: number;       // HSK level (1-9)
  n: number;       // index within level
  alt?: {          // alternate senses
    p: string;
    t: string;
  }[];
}

export interface HSKData {
  maxLen: number;
  count: number;
  schema: {
    p: string;
    t: string;
    simp: string;
    trad: string;
    s: string;
    l: string;
    n: string;
    alt: string;
  };
  dict: Record<string, VocabEntry>;
}

export interface BookmarkedWord {
  hanzi: string;
  pinyin: string;
  english: string;
  hskLevel: number;
  pos: string;
  trad?: string;
  bookmarkedAt: number; // timestamp
}

export interface FlashCard {
  hanzi: string;
  pinyin: string;
  english: string;
  hskLevel: number;
  interval: number;     // days until next review
  dueDate: number;      // timestamp for next review
  repetitions: number;  // number of successful reviews
  easeFactor: number;   // ease factor for SRS (default 2.5)
  lastReviewed: number | null; // timestamp
}

export interface AppSettings {
  showPinyin: boolean;
  hskLevelFilter: number[]; // enabled HSK levels
  dailyReviewGoal: number;  // cards per day
  gameDifficulty: 'easy' | 'medium' | 'hard';
}

export interface GameResult {
  gameType: 'grid-connect' | 'line-sort' | 'memory-match';
  score: number;
  timeSeconds: number;
  date: number;
  wordsUsed: number;
}

export type RootTabParamList = {
  home: undefined;
  dictionary: undefined;
  reader: undefined;
  games: undefined;
  bookmarks: undefined;
};
