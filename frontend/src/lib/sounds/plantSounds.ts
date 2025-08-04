import { AudioUtils } from './audioUtils'
import type { AdvancedSoundConfig } from './types'

export class PlantSoundGenerator {
  constructor(
    private audioContext: AudioContext,
    private masterVolume: number
  ) {}

  createLeafRustle(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    for (let i = 0; i < 5; i++) {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()
      
      osc.type = 'triangle'
      const freq = (config.frequency || 180) + (Math.random() * 40 - 20)
      osc.frequency.setValueAtTime(freq, now)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(400, now)
      
      const startTime = now + (Math.random() * 0.1)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration)
      
      osc.connect(filter).connect(gain).connect(this.audioContext.destination)
      osc.start(startTime)
      osc.stop(startTime + config.duration)
    }
  }

  createRainDrops(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const now = this.audioContext.currentTime
    const dropCount = 8
    const volume = config.volume * this.masterVolume
    
    for (let i = 0; i < dropCount; i++) {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()
      
      osc.type = 'sine'
      const freq = (config.frequency || 150) + (Math.random() * 100 - 50)
      osc.frequency.setValueAtTime(freq, now)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(600, now)
      
      const startTime = now + (i * config.duration / dropCount) + (Math.random() * 0.1)
      const dropDuration = 0.15
      
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dropDuration)
      
      osc.connect(filter).connect(gain).connect(this.audioContext.destination)
      osc.start(startTime)
      osc.stop(startTime + dropDuration)
    }
  }

  createOrganicBloom(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    if (config.frequencies) {
      config.frequencies.forEach((freq, index) => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()
        const filter = this.audioContext!.createBiquadFilter()
        
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now)
        
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(freq * 2, now)
        filter.Q.setValueAtTime(0.8, now)
        
        const startTime = now + (index * 0.1)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(volume / 3, startTime + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration)
        
        osc.connect(filter).connect(gain).connect(this.audioContext!.destination)
        osc.start(startTime)
        osc.stop(startTime + config.duration)
      })
    } else if (config.frequency) {
      AudioUtils.createFrequencySweep(this.audioContext, this.masterVolume, {
        startFreq: config.frequency,
        endFreq: config.endFrequency || (config.frequency * 2),
        duration: config.duration,
        volume: config.volume,
        type: 'triangle'
      })
    }
  }

  createGrowthSweep(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()
    
    osc.type = 'sawtooth'
    const startFreq = config.frequency || 180
    const endFreq = config.endFrequency || (startFreq * 2)
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    osc.frequency.setValueAtTime(startFreq, now)
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + config.duration)
    
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, now)
    filter.frequency.exponentialRampToValueAtTime(2000, now + config.duration)
    
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + 0.2)
    gain.gain.linearRampToValueAtTime(volume * 0.8, now + config.duration * 0.8)
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration)
    
    osc.connect(filter).connect(gain).connect(this.audioContext.destination)
    osc.start(now)
    osc.stop(now + config.duration)
  }

  createNatureSymphony(config: AdvancedSoundConfig) {
    if (!this.audioContext || !config.frequencies) return
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    config.frequencies.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()
      
      osc.type = index % 2 === 0 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq + (Math.random() * 10 - 5), now)
      
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(freq, now)
      filter.Q.setValueAtTime(3, now)
      
      const startTime = now + (Math.random() * 0.2)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume / 4, startTime + 0.2)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration)
      
      osc.connect(filter).connect(gain).connect(this.audioContext!.destination)
      osc.start(startTime)
      osc.stop(startTime + config.duration)
    })
  }

  createWaterDrops(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const now = this.audioContext.currentTime
    const dropCount = 8
    const volume = config.volume * this.masterVolume
    
    for (let i = 0; i < dropCount; i++) {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()
      
      osc.type = 'sine'
      const freq = (config.frequency || 150) + (Math.random() * 100 - 50)
      osc.frequency.setValueAtTime(freq, now)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(600, now)
      
      const startTime = now + (i * config.duration / dropCount) + (Math.random() * 0.1)
      const dropDuration = 0.15
      
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dropDuration)
      
      osc.connect(filter).connect(gain).connect(this.audioContext.destination)
      osc.start(startTime)
      osc.stop(startTime + dropDuration)
    }
  }
}
