export class AudioUtils {
  static createSingleOscillator(
    audioContext: AudioContext,
    masterVolume: number,
    params: {
      frequency: number
      type?: OscillatorType
      volume: number
      duration: number
      startTime?: number
      fadeIn?: number
      fadeOut?: number
      detune?: number
    }
  ): void {
    const osc = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    const startTime = params.startTime || audioContext.currentTime
    const fadeIn = params.fadeIn || 0.01
    const fadeOut = params.fadeOut || 0.1
    const volume = params.volume * masterVolume

    osc.frequency.setValueAtTime(params.frequency, startTime)
    osc.type = params.type || 'sine'
    
    if (params.detune) {
      osc.detune.setValueAtTime(params.detune, startTime)
    }

    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(volume, startTime + fadeIn)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + params.duration - fadeOut)

    osc.connect(gainNode).connect(audioContext.destination)
    osc.start(startTime)
    osc.stop(startTime + params.duration)
  }

  static createFrequencySweep(
    audioContext: AudioContext,
    masterVolume: number,
    params: {
      startFreq: number
      endFreq: number
      duration: number
      volume: number
      type?: OscillatorType
      startTime?: number
    }
  ): void {
    const osc = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    const startTime = params.startTime || audioContext.currentTime
    const volume = params.volume * masterVolume

    osc.type = params.type || 'sine'
    osc.frequency.setValueAtTime(params.startFreq, startTime)
    osc.frequency.exponentialRampToValueAtTime(params.endFreq, startTime + params.duration)

    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + params.duration - 0.1)

    osc.connect(gainNode).connect(audioContext.destination)
    osc.start(startTime)
    osc.stop(startTime + params.duration)
  }

  static createSimpleReverb(audioContext: AudioContext): GainNode {
    // Simple reverb simulation using gain node
    const reverbGain = audioContext.createGain()
    reverbGain.gain.setValueAtTime(0.3, audioContext.currentTime)
    return reverbGain
  }
}
