// A synthesized impact — noise burst + a falling low-end thud — so a crash
// doesn't need a shipped audio asset. Lazily creates one AudioContext and
// reuses it; fails silently if Web Audio is unavailable or blocked.
let ctx: AudioContext | null = null

export function playCrashSound() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    ctx ??= new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime

    // Noise burst: the "crunch"
    const bufferSize = Math.floor(ctx.sampleRate * 0.22)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.setValueAtTime(2600, now)
    noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 0.22)
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.5, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination)

    // Low thud: a fast pitch drop underneath the noise
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.3)
    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(0.4, now)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)
    osc.connect(oscGain).connect(ctx.destination)

    noise.start(now)
    noise.stop(now + 0.22)
    osc.start(now)
    osc.stop(now + 0.32)
  } catch {
    /* Web Audio unavailable or blocked — no sound, no crash */
  }
}
