import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Headphones, Leaf, Pause, Play, Sparkles, Volume2, Wind, X } from 'lucide-react';
import { CareAudio } from './audio';
import './care.css';

type Category = '呼吸' | '冥想' | '音乐' | '运动';
type Item = { id: string; title: string; category: Category; description: string; seconds: number; steps: string[]; tag: string };
const items: Item[] = [
  { id: 'breathing', title: '给自己，两分钟', category: '呼吸', description: '跟随圆圈的起伏，慢慢回到此刻。', seconds: 120, steps: ['找一个舒服的位置，双脚自然放下。', '轻轻吸气，再缓缓呼气，无需屏息或刻意深呼吸。', '如果节奏不适合你，就回到自己的自然呼吸。'], tag: '2 分钟 · 呼吸练习' },
  { id: 'meditation-body', title: '听听身体的声音', category: '冥想', description: '从脚尖到肩膀，留意身体此刻的感受。', seconds: 180, steps: ['坐好或躺好。眼睛可以睁着，让视线自然落下。', '注意双脚与地面接触的感觉，再留意腿部和背部。', '把注意力带到双肩和脸颊。不需要改变感受。', '轻轻动一动手指，把注意力带回身边。'], tag: '3 分钟 · 身体觉察' },
  { id: 'meditation-present', title: '把心带回这里', category: '冥想', description: '留意身边的小事，为纷乱的思绪留一点空间。', seconds: 120, steps: ['看看身边，找到三样你能看见的东西。', '留意两种声音，不判断它们好不好听。', '感受一处身体与椅子或地面接触的位置。', '对自己说：此刻，我在这里。'], tag: '2 分钟 · 当下觉察' },
  { id: 'meditation-kind', title: '像对朋友一样', category: '冥想', description: '给正在努力的自己，一句温和的话。', seconds: 180, steps: ['给自己找一个不必赶时间的姿势。', '承认此刻的感受：这对我来说，可能有些不容易。', '想象朋友经历同样的事，你会怎样陪伴对方？', '把那句温柔的话，也送给自己。'], tag: '3 分钟 · 自我关怀' },
  { id: 'music-day', title: '午后的光', category: '音乐', description: '缓慢起伏的明亮和弦，陪你短暂放空。', seconds: 300, steps: ['原创程序合成音乐 · 无人声', '调整到舒适的音量，给自己留一会儿空白。'], tag: '原创合成 · 温暖和弦' },
  { id: 'music-cloud', title: '云朵慢行', category: '音乐', description: '轻盈的五声音阶，让思绪慢慢飘过。', seconds: 300, steps: ['原创程序合成音乐 · 无人声', '不必集中注意力，让声音自然陪伴。'], tag: '原创合成 · 轻柔和声' },
  { id: 'music-evening', title: '晚安，小世界', category: '音乐', description: '低柔的音色，为今天留一个安静的结尾。', seconds: 300, steps: ['原创程序合成音乐 · 无人声', '把音量调低，让肩膀自然放松。'], tag: '原创合成 · 低柔和弦' },
  { id: 'ambient-rain', title: '窗边的雨', category: '音乐', description: '均匀细密的声音纹理。合成雨声，非实景录音。', seconds: 300, steps: ['原创程序合成雨声 · 非实景录音'], tag: '环境音 · 合成雨声' },
  { id: 'ambient-sea', title: '海边来信', category: '音乐', description: '缓缓涨落的声音纹理。合成海浪，非实景录音。', seconds: 300, steps: ['原创程序合成海浪 · 非实景录音'], tag: '环境音 · 合成海浪' },
  { id: 'ambient-wind', title: '风经过树梢', category: '音乐', description: '轻轻流动的声音纹理。合成微风，非实景录音。', seconds: 300, steps: ['原创程序合成微风 · 非实景录音'], tag: '环境音 · 合成微风' },
  { id: 'move-shoulder', title: '肩膀，休息一下', category: '运动', description: '离开紧绷的姿势，让双肩轻轻活动。', seconds: 120, steps: ['坐稳或站稳，双臂自然垂下。', '在舒适范围内缓慢向后转动双肩，重复几次。', '轻轻抬起双肩，再自然放下，不用用力。', '回到舒服的位置，留意现在的感觉。'], tag: '2 分钟 · 肩部活动' },
  { id: 'move-walk', title: '去走一小段路', category: '运动', description: '在安全的地方走一走，不追求速度与步数。', seconds: 300, steps: ['选择平坦、安全的路线，穿舒适的鞋。', '以自己的节奏行走，留意脚下。', '看看周围的颜色、光线和小细节。', '慢慢停下，感受一下此刻的自己。'], tag: '5 分钟 · 轻松走走' },
  { id: 'move-hands', title: '让双手松一松', category: '运动', description: '暂时放下键盘，让手指自然舒展。', seconds: 120, steps: ['坐在舒服的位置，前臂有支撑。', '缓慢张开手掌，再轻轻合拢，不要握紧。', '在舒适范围内缓慢转动手腕。', '放下双手，轻松停留一会儿。'], tag: '2 分钟 · 双手活动' },
];
const iconFor = (category: Category, size = 22) => category === '呼吸' ? <Wind size={size} /> : category === '音乐' ? <Headphones size={size} /> : category === '运动' ? <Leaf size={size} /> : <Sparkles size={size} />;
const formatTime = (value: number) => `${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
type Feedback = 'better' | 'same' | 'worse';
export default function CareSpace({ onComplete }: { onComplete: (session: { id: string; contentId: string; title: string; completedAt: string; feedback: Feedback }) => Promise<void> }) {
  const [filter, setFilter] = useState('全部');
  const [selected, setSelected] = useState<Item | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timer, setTimer] = useState(300);
  const [volume, setVolume] = useState(0.5);
  const [feedback, setFeedback] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const audio = useRef(new CareAudio());
  const start = useRef(0);
  const carried = useRef(0);
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const selectedRef = useRef<Item | null>(null);
  const close = () => { selectedRef.current = null; setSelected(null); setPlaying(false); void audio.current.stop(); trigger.current?.focus(); };
  useEffect(() => () => { selectedRef.current = null; void audio.current.stop(); }, []);
  useEffect(() => {
    if (!selected) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => { document.body.style.overflow = oldOverflow; };
  }, [selected, feedback]);
  useEffect(() => {
    if (!playing || !selected) return;
    const tick = () => {
      const value = carried.current + (Date.now() - start.current) / 1000;
      const limit = selected.category === '音乐' ? timer : selected.seconds;
      setElapsed(limit ? Math.min(value, limit) : value);
      if (limit && value >= limit) { setPlaying(false); setFeedback(true); void audio.current.stop(); }
    };
    tick();
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [playing, selected, timer]);
  const open = (item: Item) => {
    trigger.current = document.activeElement as HTMLElement;
    selectedRef.current = item;
    setSelected(item); setPlaying(false); setElapsed(0); setTimer(300); setFeedback(false); setError(''); setNotice(''); carried.current = 0;
  };
  const toggle = async () => {
    if (!selected || audioBusy) return;
    setError('');
    setAudioBusy(true);
    try {
      if (playing) { carried.current += (Date.now() - start.current) / 1000; setPlaying(false); await audio.current.pause(); }
      else {
        if (selected.category === '音乐') {
          if (carried.current === 0) await audio.current.start(selected.id, volume); else await audio.current.resume();
          if (selectedRef.current !== selected) { await audio.current.stop(); return; }
        }
        start.current = Date.now(); setPlaying(true);
      }
    } catch { setError('声音暂时无法播放，请再试一次。'); }
    finally { setAudioBusy(false); }
  };
  const finish = () => { setPlaying(false); void audio.current.stop(); setFeedback(true); };
  const save = async (value: Feedback) => {
    if (!selected || saving) return;
    setSaving(true); setError('');
    try { await onComplete({ id: crypto.randomUUID(), contentId: selected.id, title: selected.title, completedAt: new Date().toISOString(), feedback: value }); close(); setNotice('这次关怀与感受，已经为你记下。'); }
    catch { setError('暂时没能保存，请重试。你的感受仍保留在这里。'); }
    finally { setSaving(false); }
  };
  const limit = selected?.category === '音乐' ? timer : selected?.seconds || 120;
  const step = selected ? Math.min(selected.steps.length - 1, Math.floor(elapsed / (selected.seconds / selected.steps.length))) : 0;
  return <section className="care-space">
    <div className="care-heading"><span className="care-eyebrow">A LITTLE SPACE FOR YOURSELF</span><h1>把一点时间，留给自己 <span>☘</span></h1><p>不必马上变好。先从一件让自己舒服的小事开始。</p></div>
    <div className="care-feature"><div><span className="care-feature-label"><Wind size={16} /> 此刻的小休息</span><h2>世界很忙，你可以慢一点。</h2><p>两分钟，跟着呼吸的节奏，回到自己的步调。</p><button className="care-primary" onClick={() => open(items[0])}><Play size={16} /> 开始呼吸练习 <span>2 分钟</span></button></div><div className="care-feature-art" aria-hidden="true"><div><Wind size={42} /></div><span>吸一口气，慢慢来</span></div></div>
    <div className="care-tabs" aria-label="关怀类型">{['全部', '呼吸', '冥想', '音乐', '运动'].map(category => <button key={category} aria-pressed={filter === category} className={filter === category ? 'care-tab-active' : ''} onClick={() => setFilter(category)}>{category}</button>)}</div>
    {notice && <p className="care-notice" role="status"><Check size={16} />{notice}</p>}
    <div className="care-grid">{items.filter(item => filter === '全部' || item.category === filter).map((item, index) => <button className={`care-card care-tone-${index % 4}`} key={item.id} onClick={() => open(item)}><span className="care-card-top"><span className="care-icon">{iconFor(item.category)}</span><span className="care-category">{item.category}</span></span><h3>{item.title}</h3><p>{item.description}</p><span className="care-card-bottom"><span>{item.tag}</span><ArrowUpRight size={18} /></span></button>)}</div>
    <p className="care-footnote">按自己的节奏进行，任何时候都可以暂停。动作或呼吸让你不舒服时，请停止并回到自然状态。</p>
    {selected && <div className="care-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !saving) close(); }}><div className="care-dialog" role="dialog" aria-modal="true" aria-labelledby="care-dialog-title" ref={dialog} tabIndex={-1} onKeyDown={event => {
      if (event.key === 'Escape' && !saving) close();
      if (event.key === 'Tab') { const focusable = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select') || [])]; const first = focusable[0]; const last = focusable[focusable.length - 1]; if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
    }}><button className="care-close" aria-label="关闭练习" disabled={saving} onClick={close}><X size={21} /></button><span className="care-dialog-icon">{iconFor(selected.category, 28)}</span><span className="care-eyebrow">{selected.tag}</span><h2 id="care-dialog-title">{feedback ? '现在，感觉怎么样？' : selected.title}</h2>
      {feedback ? <><p>你已经为自己留出了 {Math.max(1, Math.round(elapsed))} 秒。任何感受都可以。</p><div className="care-feedback">{([['better', '☺', '更轻松'], ['same', '◡', '差不多'], ['worse', '☁', '更难受']] as const).map(([value, face, label]) => <button key={value} disabled={saving} onClick={() => void save(value)}><span>{face}</span>{label}</button>)}</div><button className="care-secondary" disabled={saving} onClick={close}>暂不记录</button>{saving && <p role="status">正在保存…</p>}</> : <>
        {selected.category === '呼吸' ? <div className="care-breath-stage"><div className="care-breath-circle" style={{ transform: `scale(${1 + (elapsed % 10 < 4 ? (elapsed % 10) / 4 : 1 - ((elapsed % 10) - 4) / 6) * 0.3})` }}><strong>{!playing && elapsed === 0 ? '准备好了' : !playing ? '已暂停' : elapsed % 10 < 4 ? '轻轻吸气' : '缓缓呼气'}</strong><span>不需要屏息</span></div></div> : <div className="care-guidance"><span>{selected.category === '音乐' ? '♪' : `0${step + 1}`}</span><p>{selected.steps[step]}</p></div>}
        {selected.category === '呼吸' && <p className="care-hint">{selected.steps[2]}</p>}
        <div className="care-time">{formatTime(limit ? Math.max(0, Math.ceil(limit - elapsed)) : elapsed)}<span>{limit ? '剩余时间' : '已播放'}</span></div>
        {selected.category === '音乐' && <div className="care-audio-controls"><label><Volume2 size={18} /><span className="care-sr-only">音量</span><input type="range" aria-label="音量" min="0" max="1" step="0.01" value={volume} onChange={event => { setVolume(Number(event.target.value)); audio.current.volume(Number(event.target.value)); }} /></label><label>定时停止<select value={timer} onChange={event => setTimer(Number(event.target.value))}><option value={300}>5 分钟</option><option value={600}>10 分钟</option><option value={0}>关闭定时</option></select></label></div>}
        <div className="care-session-actions"><button className="care-primary" disabled={audioBusy} onClick={() => void toggle()}>{playing ? <Pause size={17} /> : <Play size={17} />}{audioBusy ? '准备声音…' : playing ? '暂停' : elapsed > 0 ? '继续' : selected.category === '音乐' ? '播放声音' : '开始练习'}</button><button className="care-secondary" onClick={finish} disabled={elapsed < 1 || audioBusy}>结束练习</button></div>
        {selected.category !== '音乐' && selected.category !== '呼吸' && <details className="care-all-steps"><summary>查看完整引导</summary><ol>{selected.steps.map(text => <li key={text}>{text}</li>)}</ol></details>}
      </>}{error && <p className="care-error" role="alert">{error}</p>}</div></div>}
  </section>;
}
