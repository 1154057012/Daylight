import { describe, expect, it } from 'vitest';
import { MAX_BACKUP_BYTES, getStats, localDate, makeDemoEntries, parseBackup, serializeBackup, type Entry } from './domain';

const entry = (id: string, date: string, mood: Entry['mood'], tags: string[] = []): Entry => ({
  id, date, mood, tags, emotions: ['平静'], body: '今天给自己留了一些时间。',
  createdAt: `${date}T10:00:00.000Z`, updatedAt: `${date}T10:00:00.000Z`,
});

describe('personal mood statistics', () => {
  it('uses a local seven-day window, excludes older and future dates, averages repeated days', () => {
    const result = getStats([
      entry('a', '2026-09-16', 1, ['工作']), entry('b', '2026-09-16', 5, ['工作']),
      entry('c', '2026-09-22', 4, ['睡眠']), entry('old', '2026-09-15', 1),
      entry('future', '2026-09-23', 5),
    ], 7, new Date(2026, 8, 22, 12));
    expect(result.total).toBe(3);
    expect(result.activeDays).toBe(2);
    expect(result.average).toBeCloseTo(10 / 3);
    expect(result.trend).toHaveLength(7);
    expect(result.trend[0]).toMatchObject({ date: '2026-09-16', score: 3, count: 2 });
    expect(result.trend[1]).toMatchObject({ score: null, count: 0 });
    expect(result.tags).toEqual([{ name: '工作', count: 2 }, { name: '睡眠', count: 1 }]);
  });

  it('handles month boundaries and empty records without fabricating a mood', () => {
    const result = getStats([], 7, new Date(2026, 0, 2, 12));
    expect(result.trend[0].date).toBe('2025-12-27');
    expect(result.average).toBeNull();
    expect(result.distribution.every(item => item.count === 0)).toBe(true);
    expect(localDate(new Date(2026, 8, 2, 0, 1))).toBe('2026-09-02');
  });
});

describe('backup import boundary', () => {
  it('round-trips Chinese records and session feedback', () => {
    const entries = [entry('a', '2026-09-22', 3)];
    const sessions = [{ id: 's', contentId: 'breathe', title: '慢慢呼吸', completedAt: '2026-09-22T10:00:00.000Z', feedback: 'better' as const }];
    expect(parseBackup(serializeBackup(entries, sessions))).toEqual({ version: 1, entries, sessions });
  });

  it('accepts leap days and the complete demo without introducing future record dates', () => {
    const leapEntry = entry('leap', '2024-02-29', 4);
    expect(parseBackup(serializeBackup([leapEntry], [])).entries[0].date).toBe('2024-02-29');
    const demo = makeDemoEntries();
    expect(parseBackup(serializeBackup(demo, [])).entries).toHaveLength(demo.length);
    expect(demo.every(item => item.date <= localDate())).toBe(true);
  });

  it.each([
    { version: 2, entries: [], sessions: [] },
    { version: 1, entries: [entry('a', '2026-02-30', 3)], sessions: [] },
    { version: 1, entries: [{ ...entry('a', '2026-09-22', 3), mood: 0 }], sessions: [] },
    { version: 1, entries: [entry('a', '2026-09-22', 3), entry('a', '2026-09-22', 5)], sessions: [] },
    { version: 1, entries: [{ ...entry('a', '2026-09-22', 3), body: '长'.repeat(10001) }], sessions: [] },
    { version: 1, entries: [], sessions: [], unexpected: 'field' },
  ])('rejects invalid or ambiguous backup data %#', value => {
    expect(() => parseBackup(JSON.stringify(value))).toThrow();
  });

  it('rejects duplicate session IDs and oversized input before parsing', () => {
    const session = { id: 's', contentId: 'b', title: '呼吸', completedAt: '2026-09-22T10:00:00Z', feedback: 'same' };
    expect(() => parseBackup(JSON.stringify({ version: 1, entries: [], sessions: [session, session] }))).toThrow();
    expect(() => parseBackup(' '.repeat(5 * 1024 * 1024 + 1))).toThrow();
  });

  it('keeps UTF-8 backup exactly at capacity restorable and rejects one additional character', () => {
    const entries = Array.from({ length: 172 }, (_, index) => ({ ...entry(`full-${index}`, '2026-09-22', 3), body: '晴'.repeat(10000) }));
    const remainder = MAX_BACKUP_BYTES - new TextEncoder().encode(JSON.stringify({ version: 1, entries, sessions: [] })).byteLength;
    // Add empty records before filling the final gap, so every body respects its own limit.
    for (let index = 0; index < Math.ceil(remainder / 10000); index++) entries.push({ ...entry(`tail-${index}`, '2026-09-22', 3), body: '' });
    let remaining = MAX_BACKUP_BYTES - new TextEncoder().encode(JSON.stringify({ version: 1, entries, sessions: [] })).byteLength;
    for (const item of entries.filter(item => item.id.startsWith('tail-'))) {
      item.body = 'a'.repeat(Math.min(remaining, 10000));
      remaining -= item.body.length;
    }
    expect(remaining).toBe(0);
    const serialized = serializeBackup(entries, []);
    expect(new TextEncoder().encode(serialized).byteLength).toBe(MAX_BACKUP_BYTES);
    expect(parseBackup(serialized).entries).toEqual(entries);
    entries[entries.length - 1].body += 'a';
    expect(() => serializeBackup(entries, [])).toThrow('当前空间已达到 5 MB');
  });

  it('rejects export exceeding supported record count', () => {
    const entries = Array.from({ length: 20001 }, (_, index) => entry(String(index), '2026-09-22', 3));
    expect(() => serializeBackup(entries, [])).toThrow();
  });
});
