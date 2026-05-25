# Chinese Learning App - Implementation Checklist

Transforming the Expo todo-list app into a comprehensive Chinese learning app with games, dictionary, text reader, bookmarks, and SRS flashcards.

## 1. Project Setup & Dependencies
- [x] Install core dependencies (expo-sqlite, async-storage, expo-haptics, expo-image)
- [x] Update app.json with new app name and configuration
- [x] Copy HSK vocabulary JSON (11,643 words) into project assets
- [x] Set up TypeScript types for vocabulary, bookmarks, flashcards

## 2. Data Layer
- [x] Create SQLite database helper with initialization
- [x] Create HSK vocabulary seeding script (load JSON → SQLite)
- [x] Implement dictionary queries (search by hanzi, pinyin, english, HSK level)
- [x] Create AsyncStorage wrapper for bookmarks
- [x] Create AsyncStorage wrapper for flashcard SRS data
- [x] Create AsyncStorage wrapper for app settings
- [x] Create AsyncStorage wrapper for game results
- [x] Create AsyncStorage wrapper for streak tracking
- [x] Add bulk bookmarks-to-flashcards import function

## 3. Navigation Structure
- [x] Create tab-based navigation layout (Home, Dictionary, Reader, Games, Bookmarks)
- [x] Stack navigation for detail screens (word detail, games, flashcards)
- [x] Set up proper screen titles and header styles

## 4. Home Screen (Dashboard)
- [x] Daily stats display (streak, cards studied, bookmarks)
- [x] Flashcard review CTA when cards are due
- [x] Quick access cards to Dictionary, Reader, Games, Flashcards
- [x] Recent bookmarked words preview

## 5. Dictionary Screen
- [x] Search bar with real-time filtering (search on submit)
- [x] HSK level filter chips (1-6)
- [x] Word list with hanzi, pinyin, english, HSK badge
- [x] Tap word to navigate to word detail
- [x] Auto-seed HSK database on first launch

## 6. Word Detail Screen
- [x] Full display: hanzi (simp+trad), pinyin, definitions
- [x] HSK level and part of speech metadata
- [x] Alternate meanings display
- [x] Bookmark/unbookmark toggle
- [x] Add to Flashcards button

## 7. Text Reader Screen
- [x] Text input area (paste Chinese text)
- [x] Character-by-character display with pinyin overlay
- [x] Tap word to see definition + pinyin in modal
- [x] Bookmark words from the modal popup
- [x] Pinyin toggle (show/hide above characters)
- [x] Pre-loaded sample texts

## 8. Bookmarks Screen
- [x] List of all bookmarked words with hanzi, pinyin, english
- [x] Delete/remove bookmark button
- [x] Tap to view word detail
- [x] "Study All" button to bulk-import into flashcards
- [x] HSK level badge on each word

## 9. Flashcards (SRS) Screen
- [x] Spaced repetition algorithm (intervals: 1,2,4,7,15,30,60,120 days)
- [x] Card display with tap-to-reveal (hanzi → pinyin + english)
- [x] "Know" / "Don't Know" rating buttons
- [x] Progress tracking (progress bar, card count)
- [x] Streak counter (updates on session complete)
- [x] Session summary after completing review (stats + streak)

## 10. Games Hub Screen
- [x] Game selection cards with emoji, title, description
- [x] GridConnect, LineSort, MemoryMatch games listed
- [x] Navigation to each game

## 11. GridConnect Game (Match Chinese → Group)
- [x] Grid of tiles (words + group labels randomly placed)
- [x] Tap word tile + group tile to match
- [x] Visual feedback (selected, matched, wrong state colors)
- [x] Score tracking (matches found)
- [x] Timer
- [x] Win detection + celebration screen
- [x] Game result saved to history
- [x] Restart/play again option

## 12. LineSort Game (Sort words into groups)
- [x] Tap-to-select words from unassigned pool
- [x] Tap group row to place selected word there
- [x] Row completion detection (all same group)
- [x] Moves counter
- [x] Timer
- [x] Win detection when all rows complete
- [x] Game result saved to history
- [x] Play again option

## 13. MemoryMatch Game (Card flip pairs)
- [x] Difficulty selection (easy:4, medium:6, hard:8 pairs)
- [x] Grid of face-down cards (hanzi + pinyin pairs to match)
- [x] Flip two cards to find matching pairs
- [x] Visual feedback (matched/not matched states)
- [x] Move counter and timer
- [x] Win detection + celebration screen
- [x] Game result saved to history
- [x] Play again option

## 14. TypeScript Typecheck & Error Fixes
- [x] Fixed useState→useEffect in word detail screen
- [x] Fixed Alert import position
- [x] Fixed PlatformColor→string types in tab layout
- [x] Fixed import paths in flashcards screen
- [x] Fixed missing bookmarkedAt property
- [x] Fixed streak counter to use actual card count
- [x] TypeScript typecheck passes with zero errors

## 15. Code Review & Polish
- [x] Applied code review feedback
- [x] Fixed bookmarks→flashcards auto-import flow
- [x] Added importBookmarksToFlashcards function
- [x] All imports resolve correctly

## 16. Final Verification
- [x] All checklist items marked complete
- [x] TypeScript compiles with zero errors
- [ ] Run `npx expo start` and verify in Expo Go
