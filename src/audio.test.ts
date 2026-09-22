import { afterEach, describe, expect, it, vi } from 'vitest';
import { CareAudio } from './audio';

const contexts: FakeContext[] = [];
function node() { return { connect: vi.fn(function(this: unknown) { return this; }), gain: { value: 0, setTargetAtTime: vi.fn() }, frequency: { value: 0 }, start: vi.fn() }; }
class FakeContext {
  state = 'suspended';
  sampleRate = 10;
  currentTime = 0;
  destination = {};
  close = vi.fn(async () => { this.state = 'closed'; });
  resume = vi.fn(async () => { this.state = 'running'; });
  suspend = vi.fn(async () => { this.state = 'suspended'; });
  createGain = vi.fn(node);
  createOscillator = vi.fn(node);
  createBiquadFilter = vi.fn(node);
  createBufferSource = vi.fn(node);
  createBuffer = vi.fn(() => ({ getChannelData: () => new Float32Array(50) }));
  constructor() { contexts.push(this); }
}
afterEach(() => { contexts.length = 0; vi.unstubAllGlobals(); });
describe('care audio lifecycle', () => {
  it('closes the previous track before changing sound and releases the active audio on stop', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const audio = new CareAudio();
    await audio.start('music-day', .5);
    await audio.start('ambient-sea', .5);
    expect(contexts[0].state).toBe('closed');
    expect(contexts[1].state).toBe('running');
    await audio.stop();
    await audio.stop();
    expect(contexts[1].close).toHaveBeenCalledTimes(1);
  });
  it('pauses without destroying playback and resumes the same context', async () => {
    vi.stubGlobal('AudioContext', FakeContext);
    const audio = new CareAudio();
    await audio.start('music-cloud', .5);
    await audio.pause();
    expect(contexts[0].state).toBe('suspended');
    await audio.resume();
    expect(contexts[0].state).toBe('running');
    expect(contexts).toHaveLength(1);
    audio.volume(.2);
    expect(contexts[0].createGain.mock.results[0].value.gain.setTargetAtTime).toHaveBeenCalledWith(.2 * .28, 0, .1);
    await audio.stop();
  });
});
