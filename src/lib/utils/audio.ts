let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    // Standard AudioContext initialization
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext)
    audioContext = new AudioContextClass()
  }
  return audioContext
}

/**
 * Initializes/Resumes the audio context.
 * MUST be called from a user interaction (like a button click)
 * to work on iOS/iPadOS.
 */
export async function initAudio() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    
    // Play a nearly silent note to "unlock" the hardware on some mobile devices
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.01)
    
    console.log('[Audio] Context initialized/resumed successfully')
    return true
  } catch (e) {
    console.warn('[Audio] Failed to initialize:', e)
    return false
  }
}

export function playNewOrderSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      // On mobile, this will likely fail unless initAudio was called recently on interaction
      ctx.resume()
    }
    
    const now = ctx.currentTime
    ;[880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + i * 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.15)
      osc.stop(now + 1 + i * 0.2)
    })
  } catch (e) {
    console.warn('Audio failed:', e)
  }
}
