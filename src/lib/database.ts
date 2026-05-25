import * as SQLite from 'expo-sqlite';
import { VocabEntry } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('chinese_learner.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hanzi TEXT NOT NULL,
      traditional TEXT,
      pinyin TEXT NOT NULL,
      english TEXT NOT NULL,
      pos TEXT,
      hsk_level INTEGER NOT NULL,
      level_index INTEGER,
      alternates TEXT,
      UNIQUE(hanzi)
    );
    CREATE INDEX IF NOT EXISTS idx_vocab_hanzi ON vocabulary(hanzi);
    CREATE INDEX IF NOT EXISTS idx_vocab_pinyin ON vocabulary(pinyin);
    CREATE INDEX IF NOT EXISTS idx_vocab_hsk ON vocabulary(hsk_level);
  `);

  return db;
}

export async function isDatabaseSeeded(): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM vocabulary'
  );
  return (result?.count ?? 0) > 0;
}

export async function seedDatabase(hskData: { dict: Record<string, VocabEntry> }): Promise<void> {
  const database = await getDatabase();

  const entries = Object.entries(hskData.dict);
  let batch: string[] = [];

  for (const [hanzi, entry] of entries) {
    const alternates = entry.alt ? JSON.stringify(entry.alt) : null;
    batch.push(
      `('${hanzi.replace(/'/g, "''")}', '${(entry.trad || entry.simp).replace(/'/g, "''")}', '${entry.p.replace(/'/g, "''")}', '${entry.t.replace(/'/g, "''")}', '${entry.s.replace(/'/g, "''")}', ${entry.l}, ${entry.n}, ${alternates ? `'${alternates.replace(/'/g, "''")}'` : 'NULL'})`
    );

    if (batch.length >= 500) {
      await database.execAsync(
        `INSERT OR IGNORE INTO vocabulary (hanzi, traditional, pinyin, english, pos, hsk_level, level_index, alternates) VALUES ${batch.join(',')}`
      );
      batch = [];
    }
  }

  if (batch.length > 0) {
    await database.execAsync(
      `INSERT OR IGNORE INTO vocabulary (hanzi, traditional, pinyin, english, pos, hsk_level, level_index, alternates) VALUES ${batch.join(',')}`
    );
  }
}

export async function searchDictionary(query: string, hskLevels?: number[]): Promise<VocabEntry[]> {
  const database = await getDatabase();

  let sql = 'SELECT * FROM vocabulary WHERE (hanzi LIKE ? OR pinyin LIKE ? OR english LIKE ?)';
  const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];

  if (hskLevels && hskLevels.length > 0) {
    sql += ` AND hsk_level IN (${hskLevels.map(() => '?').join(',')})`;
    params.push(...hskLevels);
  }

  sql += ' ORDER BY hsk_level ASC, level_index ASC LIMIT 100';

  const results = await database.getAllAsync<any>(sql, params);
  return results.map(mapRowToVocabEntry);
}

export async function getWordByHanzi(hanzi: string): Promise<VocabEntry | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<any>(
    'SELECT * FROM vocabulary WHERE hanzi = ?',
    [hanzi]
  );
  return result ? mapRowToVocabEntry(result) : null;
}

export async function getWordsByHSKLevel(level: number, limit?: number): Promise<VocabEntry[]> {
  const database = await getDatabase();
  const limitClause = limit ? ` LIMIT ${limit}` : '';
  const results = await database.getAllAsync<any>(
    `SELECT * FROM vocabulary WHERE hsk_level = ? ORDER BY level_index ASC${limitClause}`,
    [level]
  );
  return results.map(mapRowToVocabEntry);
}

export async function getRandomWords(count: number, hskLevels?: number[]): Promise<VocabEntry[]> {
  const database = await getDatabase();

  let sql = 'SELECT * FROM vocabulary';
  const params: any[] = [];

  if (hskLevels && hskLevels.length > 0) {
    sql += ` WHERE hsk_level IN (${hskLevels.map(() => '?').join(',')})`;
    params.push(...hskLevels);
  }

  sql += ` ORDER BY RANDOM() LIMIT ${count}`;

  const results = await database.getAllAsync<any>(sql, params);
  return results.map(mapRowToVocabEntry);
}

function mapRowToVocabEntry(row: any): VocabEntry {
  return {
    p: row.pinyin,
    t: row.english,
    simp: row.hanzi,
    trad: row.traditional || row.hanzi,
    s: row.pos || '',
    l: row.hsk_level,
    n: row.level_index || 0,
    alt: row.alternates ? JSON.parse(row.alternates) : undefined,
  };
}
