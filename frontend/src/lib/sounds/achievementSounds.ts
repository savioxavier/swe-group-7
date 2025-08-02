import { AudioUtils } from './audioUtils'
import type { AdvancedSoundConfig } from './types'

export class AchievementSoundGenerator {
  constructor(
    private audioContext: AudioContext,
    private masterVolume: number
  ) {}

  createVictoryChord(config: AdvancedSoundConfig) {
    if (!this.audioContext || !config.frequencies) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume / config.frequencies.length
    
    config.frequencies.forEach((freq) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(freq * 3, now)
      filter.Q.setValueAtTime(1, now)
      
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume, now + 0.1)
      gain.gain.linearRampToValueAtTime(volume * 0.8, now + config.duration * 0.8)
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration)
      
      osc.connect(filter).connect(gain).connect(this.audioContext!.destination)
      osc.start(now)
      osc.stop(now + config.duration)
    })
  }

  createCrystalSparkle(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    // Handle both single frequency and frequency arrays
    const frequencies = config.frequencies || (config.frequency ? [config.frequency] : [880])
    
    frequencies.forEach((freq, index) => {
      // Multiple harmonic layers for sparkle effect
      for (let h = 1; h <= 3; h++) {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()
        const filter = this.audioContext!.createBiquadFilter()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq * h, now)
        
        // High-pass filter for crystalline quality
        filter.type = 'highpass'
        filter.frequency.setValueAtTime(800, now)
        filter.Q.setValueAtTime(3, now)
        
        const startTime = now + (index * 0.02) + (h * 0.01)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(volume * 0.6 / h, startTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1)
        
        osc.connect(filter).connect(gain).connect(this.audioContext!.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.1)
      }
    })
  }

  createGrandFanfare(config: AdvancedSoundConfig) {
    if (!this.audioContext || !config.frequencies) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    config.frequencies.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now)
      
      filter.type = 'peaking'
      filter.frequency.setValueAtTime(freq * 1.5, now)
      filter.Q.setValueAtTime(3, now)
      filter.gain.setValueAtTime(6, now)
      
      const startTime = now + (index * 0.2)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume / 2, startTime + 0.1)
      gain.gain.linearRampToValueAtTime(volume / 3, startTime + config.duration * 0.8)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration)
      
      osc.connect(filter).connect(gain).connect(this.audioContext!.destination)
      osc.start(startTime)
      osc.stop(startTime + config.duration)
    })
  }

  createAscensionTheme(config: AdvancedSoundConfig) {
    if (!this.audioContext || !config.frequencies) return
    
    const now = this.audioContext.currentTime
    
    const ascendingFreqs = [...config.frequencies].sort((a, b) => a - b)
    
    ascendingFreqs.forEach((freq, index) => {
      AudioUtils.createSingleOscillator(this.audioContext, this.masterVolume, {
        frequency: freq,
        type: 'sine',
        volume: config.volume / ascendingFreqs.length,
        duration: config.duration / 2,
        startTime: now + (index * 0.1),
        fadeIn: 0.05,
        fadeOut: 0.2
      })
    })
  }

  createTriumphBells(config: AdvancedSoundConfig) {
    if (!this.audioContext || !config.frequencies) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    const noteLength = config.duration / config.frequencies.length
    
    config.frequencies.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      
      filter.type = 'peaking'
      filter.frequency.setValueAtTime(freq * 2, now)
      filter.Q.setValueAtTime(5, now)
      filter.gain.setValueAtTime(6, now)
      
      const startTime = now + (index * noteLength * 0.3)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume / 3, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength * 2)
      
      osc.connect(filter).connect(gain).connect(this.audioContext!.destination)
      osc.start(startTime)
      osc.stop(startTime + noteLength * 2)
    })
  }
}
