import { AudioUtils } from './audioUtils'
import type { AdvancedSoundConfig } from './types'

export class UISoundGenerator {
  constructor(
    private audioContext: AudioContext,
    private masterVolume: number
  ) {}

  createCrystalClick(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    for (let i = 1; i <= 3; i++) {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime((config.frequency || 1200) * i, now)
      
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(800, now)
      filter.Q.setValueAtTime(3, now)
      
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume / i, now + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration)
      
      osc.connect(filter).connect(gain).connect(this.audioContext.destination)
      osc.start(now)
      osc.stop(now + config.duration)
    }
  }

  createHarmonicButton(config: AdvancedSoundConfig) {
    if (!this.audioContext || !config.frequencies) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume / config.frequencies.length
    
    config.frequencies.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2000, now)
      filter.Q.setValueAtTime(1, now)
      
      const startTime = now + (index * 0.015)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration)
      
      osc.connect(filter).connect(gain).connect(this.audioContext!.destination)
      osc.start(startTime)
      osc.stop(startTime + config.duration)
    })
  }

  createGentleChime(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(config.frequency || 880, this.audioContext.currentTime)
    
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(config.frequency || 880, this.audioContext.currentTime)
    filter.Q.setValueAtTime(8, this.audioContext.currentTime)
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration)
    
    osc.connect(filter).connect(gain).connect(this.audioContext.destination)
    osc.start(now)
    osc.stop(now + config.duration)
  }

  createEtherealSweep(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()
    const reverb = AudioUtils.createSimpleReverb(this.audioContext)
    
    osc.type = 'sine'
    const startFreq = config.frequency || 220
    const endFreq = config.endFrequency || (startFreq * 4)
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    osc.frequency.setValueAtTime(startFreq, now)
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + config.duration)
    
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(startFreq * 2, now)
    filter.frequency.exponentialRampToValueAtTime(endFreq * 1.5, now + config.duration)
    filter.Q.setValueAtTime(2, now)
    
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + config.duration * 0.2)
    gain.gain.linearRampToValueAtTime(volume * 0.8, now + config.duration * 0.8)
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration)
    
    osc.connect(filter).connect(gain).connect(reverb).connect(this.audioContext.destination)
    osc.start(now)
    osc.stop(now + config.duration)
  }

  createModalOpen(config: AdvancedSoundConfig) {
    AudioUtils.createFrequencySweep(this.audioContext, this.masterVolume, {
      startFreq: config.frequency || 220,
      endFreq: config.endFrequency || 880,
      duration: config.duration,
      volume: config.volume,
      type: 'sine'
    })
  }

  createModalClose(config: AdvancedSoundConfig) {
    AudioUtils.createFrequencySweep(this.audioContext, this.masterVolume, {
      startFreq: config.frequency || 880,
      endFreq: config.endFrequency || 220,
      duration: config.duration,
      volume: config.volume,
      type: 'sine'
    })
  }

  createSmoothTransition(config: AdvancedSoundConfig) {
    if (!this.audioContext || !config.frequencies) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    // Crossfade between frequencies
    config.frequencies.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      
      const fadeInTime = (config.duration / config.frequencies!.length) * index
      const fadeOutTime = (config.duration / config.frequencies!.length) * (index + 1)
      
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume / 2, now + fadeInTime + 0.05)
      gain.gain.linearRampToValueAtTime(0, now + fadeOutTime)
      
      osc.connect(gain).connect(this.audioContext!.destination)
      osc.start(now + fadeInTime)
      osc.stop(now + fadeOutTime + 0.1)
    })
  }

  createCascadeEffect(config: AdvancedSoundConfig) {
    if (!this.audioContext || !config.frequencies) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume / config.frequencies.length
    const noteLength = config.duration / config.frequencies.length
    
    // Reverse order for cascade_up
    const frequencies = config.type === 'cascade_up' ? 
      [...config.frequencies].reverse() : config.frequencies
    
    frequencies.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(freq * 3, now)
      filter.Q.setValueAtTime(1, now)
      
      const startTime = now + (index * noteLength * 0.5)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength)
      
      osc.connect(filter).connect(gain).connect(this.audioContext!.destination)
      osc.start(startTime)
      osc.stop(startTime + noteLength)
    })
  }
}
