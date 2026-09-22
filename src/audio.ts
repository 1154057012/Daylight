/** Original, locally synthesized sound. No recordings or remote media are used. */
export class CareAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  async start(kind: string, volume: number) {
    await this.stop();
    const context = new AudioContext();
    this.context = context;
    const master = context.createGain();
    master.gain.value = volume * 0.28;
    master.connect(context.destination);
    this.gain = master;
    if (kind.startsWith('ambient')) {
      const buffer = context.createBuffer(1, context.sampleRate * 5, context.sampleRate);
      const samples = buffer.getChannelData(0);
      let previous = 0;
      for (let i = 0; i < samples.length; i++) {
        previous = (previous + (Math.random() * 2 - 1) * 0.04) / 1.02;
        samples[i] = kind === 'ambient-rain' ? Math.random() * 2 - 1 : previous * 4;
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = kind === 'ambient-rain' ? 1500 : 650;
      const breath = context.createGain();
      breath.gain.value = 0.55;
      const lfo = context.createOscillator();
      lfo.frequency.value = kind === 'ambient-sea' ? 0.1 : 0.045;
      const depth = context.createGain();
      depth.gain.value = 0.35;
      lfo.connect(depth).connect(breath.gain);
      source.connect(filter).connect(breath).connect(master);
      source.start();
      lfo.start();
    } else {
      const base = kind === 'music-evening' ? 174.61 : kind === 'music-cloud' ? 196 : 220;
      [1, 1.5, 2, 2.5, 3].forEach((ratio, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = base * ratio;
        const voice = context.createGain();
        voice.gain.value = 0.06;
        const lfo = context.createOscillator();
        lfo.frequency.value = 0.07 + index * 0.021;
        const depth = context.createGain();
        depth.gain.value = 0.05;
        lfo.connect(depth).connect(voice.gain);
        oscillator.connect(voice).connect(master);
        oscillator.start();
        lfo.start();
      });
    }
    try { await context.resume(); } catch (error) { await this.stop(); throw error; }
  }
  volume(value: number) {
    if (this.gain && this.context) this.gain.gain.setTargetAtTime(value * 0.28, this.context.currentTime, 0.1);
  }
  async pause() { if (this.context?.state === 'running') await this.context.suspend(); }
  async resume() { if (this.context?.state === 'suspended') await this.context.resume(); }
  async stop() {
    const context = this.context;
    this.context = null;
    this.gain = null;
    if (context && context.state !== 'closed') await context.close();
  }
}
