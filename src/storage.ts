import Dexie, { type Table } from 'dexie';
import { makeDemoEntries, parseBackup, serializeBackup, type Backup, type Entry, type Session } from './domain';

export type DataMode = 'personal' | 'demo';
class DaylightDatabase extends Dexie {
  entries!: Table<Entry, string>;
  sessions!: Table<Session, string>;
  meta!: Table<{ key: string; value: boolean }, string>;
  constructor(mode: DataMode) {
    super(`daylight-${mode}-v1`);
    this.version(1).stores({ entries: 'id,date,createdAt', sessions: 'id,completedAt', meta: 'key' });
  }
}
const databases = new Map<DataMode, DaylightDatabase>();
function database(mode: DataMode) {
  let db = databases.get(mode);
  if (!db) { db = new DaylightDatabase(mode); databases.set(mode, db); }
  return db;
}
async function initialize(mode: DataMode) {
  const db = database(mode);
  await db.transaction('rw', db.entries, db.meta, async () => {
    if (!(await db.meta.get('initialized'))) {
      if (mode === 'demo') await db.entries.bulkPut(makeDemoEntries());
      await db.meta.put({ key: 'initialized', value: true });
    }
  });
  return db;
}
export async function loadData(mode: DataMode): Promise<Backup> {
  const db = await initialize(mode);
  return db.transaction('r', db.entries, db.sessions, async () => ({
    version: 1 as const,
    entries: await db.entries.orderBy('createdAt').reverse().toArray(),
    sessions: await db.sessions.orderBy('completedAt').reverse().toArray(),
  }));
}
export async function saveEntry(mode: DataMode, entry: Entry): Promise<void> {
  const validated = parseBackup(JSON.stringify({ version: 1, entries: [entry], sessions: [] }));
  const db = await initialize(mode);
  await db.transaction('rw', db.entries, db.sessions, async () => {
    const entries = await db.entries.toArray();
    const sessions = await db.sessions.toArray();
    const nextEntries = [...entries.filter(item => item.id !== entry.id), validated.entries[0]];
    // Check the snapshot within this transaction so concurrent writes cannot exceed the cap.
    serializeBackup(nextEntries, sessions);
    await db.entries.put(validated.entries[0]);
  });
}
export async function removeEntry(mode: DataMode, id: string): Promise<void> {
  const db = await initialize(mode); await db.entries.delete(id);
}
export async function saveSession(mode: DataMode, session: Session): Promise<void> {
  const validated = parseBackup(JSON.stringify({ version: 1, entries: [], sessions: [session] }));
  const db = await initialize(mode);
  await db.transaction('rw', db.entries, db.sessions, async () => {
    const entries = await db.entries.toArray();
    const sessions = await db.sessions.toArray();
    const nextSessions = [...sessions.filter(item => item.id !== session.id), validated.sessions[0]];
    serializeBackup(entries, nextSessions);
    await db.sessions.put(validated.sessions[0]);
  });
}
export async function replaceData(mode: DataMode, backup: Backup): Promise<void> {
  const validated = parseBackup(JSON.stringify(backup));
  const db = database(mode);
  await db.transaction('rw', db.entries, db.sessions, db.meta, async () => {
    await db.entries.clear(); await db.sessions.clear();
    await db.entries.bulkPut(validated.entries); await db.sessions.bulkPut(validated.sessions);
    await db.meta.put({ key: 'initialized', value: true });
  });
}
export async function clearData(mode: DataMode): Promise<void> {
  await replaceData(mode, { version: 1, entries: [], sessions: [] });
}
