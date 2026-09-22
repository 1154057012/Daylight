import { z } from 'zod';

export type MoodScore = 1 | 2 | 3 | 4 | 5;
export interface Entry {
  id: string; date: string; createdAt: string; updatedAt: string;
  mood: MoodScore; emotions: string[]; tags: string[]; body: string;
}
export interface Session {
  id: string; contentId: string; title: string; completedAt: string;
  feedback: 'better' | 'same' | 'worse';
}
export interface Backup { version: 1; entries: Entry[]; sessions: Session[] }
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export const MOODS: { score: MoodScore; label: string; color: string; emoji: string }[] = [
  { score: 1, label: '低落', color: '#919bc3', emoji: '🌧️' },
  { score: 2, label: '有点低落', color: '#a9b9bf', emoji: '☁️' },
  { score: 3, label: '平静', color: '#95bca7', emoji: '🌤️' },
  { score: 4, label: '不错', color: '#e2bd77', emoji: '🌥️' },
  { score: 5, label: '很开心', color: '#efb360', emoji: '☀️' },
];
export const EMOTIONS = ['开心', '平静', '期待', '感激', '疲惫', '焦虑', '低落', '孤独', '生气', '委屈'];
export const TAGS = ['学习', '工作', '人际', '睡眠', '身体', '家庭', '独处', '运动', '其他'];

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getStats(entries: Entry[], days: 7 | 30, now = new Date()) {
  const dates = Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date.setDate(date.getDate() - days + 1 + index);
    return localDate(date);
  });
  const selected = entries.filter(entry => entry.date >= dates[0] && entry.date <= dates[dates.length - 1]);
  const trend = dates.map(date => {
    const daily = selected.filter(entry => entry.date === date);
    return { date, label: `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`, score: daily.length ? daily.reduce((sum, entry) => sum + entry.mood, 0) / daily.length : null, count: daily.length };
  });
  const tagCounts = new Map<string, number>();
  selected.forEach(entry => new Set(entry.tags).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
  return {
    total: selected.length,
    average: selected.length ? selected.reduce((sum, entry) => sum + entry.mood, 0) / selected.length : null,
    activeDays: trend.filter(day => day.count > 0).length,
    trend,
    tags: [...tagCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh')),
    distribution: MOODS.map(mood => ({ score: mood.score, label: mood.label, color: mood.color, count: selected.filter(entry => entry.mood === mood.score).length })),
  };
}

export function getRecommendations(entries: Entry[]): { title: string; description: string; category: '呼吸' | '冥想' | '音乐' | '运动' }[] {
  const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))[0];
  if (!latest) return [
    { title: '留两分钟给自己', description: '从一次轻缓的呼吸开始，按舒服的节奏进行。', category: '呼吸' },
    { title: '听一会儿柔和的声音', description: '选择喜欢的声音，为此刻留一点安静。', category: '音乐' },
    { title: '让身体动一动', description: '短暂离开座位，活动一下肩膀。', category: '运动' },
  ];
  const anxious = latest.emotions.includes('焦虑') || latest.mood <= 2;
  const tired = latest.emotions.includes('疲惫') || latest.tags.includes('睡眠');
  return [
    anxious ? { title: '先陪自己慢慢呼吸', description: '你最近记录了低落或焦虑，可以试试两分钟轻缓呼吸。', category: '呼吸' } : { title: '留意一个美好的小细节', description: '延续这次记录，给当下的感受一点专注。', category: '冥想' },
    tired ? { title: '给自己一段安静时间', description: '最近记录提到疲惫或睡眠，试着听一段舒缓声音。', category: '音乐' } : { title: '用轻运动换个节奏', description: '如果身体状态允许，起身走一小段路。', category: '运动' },
    { title: '回到此刻', description: '跟随简短的文字引导，感受身边的声音与触感。', category: '冥想' },
  ];
}

const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const identifier = z.string().trim().min(1).max(128);
const labels = z.array(z.string().trim().min(1).max(30)).max(20).refine(values => new Set(values).size === values.length, '标签不能重复');
const timestamp = z.string().max(40).datetime({ offset: true });
const entrySchema = z.object({
  id: identifier, date: z.string().refine(validDate, '日期无效'),
  createdAt: timestamp, updatedAt: timestamp,
  mood: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  emotions: labels, tags: labels, body: z.string().max(10000),
}).strict();
const sessionSchema = z.object({
  id: identifier, contentId: identifier, title: z.string().trim().min(1).max(200),
  completedAt: timestamp, feedback: z.enum(['better', 'same', 'worse']),
}).strict();
const backupSchema = z.object({
  version: z.literal(1), entries: z.array(entrySchema).max(20000), sessions: z.array(sessionSchema).max(20000),
}).strict().superRefine((backup, context) => {
  if (new Set(backup.entries.map(entry => entry.id)).size !== backup.entries.length)
    context.addIssue({ code: 'custom', message: '日记 ID 重复', path: ['entries'] });
  if (new Set(backup.sessions.map(session => session.id)).size !== backup.sessions.length)
    context.addIssue({ code: 'custom', message: '练习 ID 重复', path: ['sessions'] });
});

export function parseBackup(text: string): Backup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new Error('备份文件不能超过 5 MB');
  try { return backupSchema.parse(JSON.parse(text)); }
  catch { throw new Error('备份格式无效：请检查版本、日期、字段长度和重复记录。'); }
}
export function serializeBackup(entries: Entry[], sessions: Session[]): string {
  if (entries.length > 20000 || sessions.length > 20000) throw new Error('当前空间的记录数量已达到上限，请先导出备份并整理记录。');
  const serialized = JSON.stringify({ version: 1, entries, sessions });
  if (new TextEncoder().encode(serialized).byteLength > MAX_BACKUP_BYTES)
    throw new Error('当前空间已达到 5 MB，请先导出备份并整理部分记录，再保存新内容。');
  return JSON.stringify(parseBackup(serialized));
}

export function makeDemoEntries(): Entry[] {
  const stories: { offset: number; mood: MoodScore; emotions: string[]; tags: string[]; body: string }[] = [
    { offset: 13, mood: 3, emotions: ['平静'], tags: ['独处'], body: '下班绕了点路，看到路边的树开始换颜色。慢慢走回家也很好。' },
    { offset: 12, mood: 2, emotions: ['疲惫', '焦虑'], tags: ['工作', '睡眠'], body: '昨晚睡得有点晚，今天开会时总担心漏掉事情。今晚想早点放下手机。' },
    { offset: 10, mood: 4, emotions: ['开心', '感激'], tags: ['人际'], body: '和朋友一起吃了晚饭，聊了最近的小事。被认真听见的感觉真好。' },
    { offset: 8, mood: 3, emotions: ['平静'], tags: ['运动', '身体'], body: '午后在楼下走了一会儿，肩膀没有刚才那么紧了。' },
    { offset: 6, mood: 2, emotions: ['焦虑', '委屈'], tags: ['工作'], body: '方案又要调整，感觉自己前面的努力没有被看到。写下来之后，决定明天先问清楚优先级。' },
    { offset: 5, mood: 3, emotions: ['疲惫', '平静'], tags: ['工作', '独处'], body: '把大任务拆成了三件小事，今天完成了一件。允许自己慢一点。' },
    { offset: 4, mood: 4, emotions: ['期待', '开心'], tags: ['学习'], body: '学会了一个一直觉得很难的方法，做出来的时候很有成就感。' },
    { offset: 3, mood: 3, emotions: ['平静'], tags: ['睡眠'], body: '昨晚没有熬夜，今天起床舒服了一些。想继续保留睡前读几页书的习惯。' },
    { offset: 2, mood: 5, emotions: ['开心', '感激'], tags: ['人际', '运动'], body: '和朋友去公园散步，阳光刚刚好。拍到一片很好看的叶子，想记住今天。' },
    { offset: 1, mood: 4, emotions: ['平静', '期待'], tags: ['家庭'], body: '和家里通了电话，还做了一顿简单的晚饭。普通的一天也有踏实的幸福。' },
    { offset: 0, mood: 4, emotions: ['平静'], tags: ['独处'], body: '给自己泡了一杯热茶，整理好桌面。今天想把注意力放在能做到的小事上。' },
  ];
  return stories.map((story, index) => {
    const day = new Date(); day.setDate(day.getDate() - story.offset); day.setHours(9, 0, 0, 0);
    return { id: `demo-entry-${index}`, date: localDate(day), createdAt: day.toISOString(), updatedAt: day.toISOString(), mood: story.mood, emotions: story.emotions, tags: story.tags, body: story.body };
  });
}
