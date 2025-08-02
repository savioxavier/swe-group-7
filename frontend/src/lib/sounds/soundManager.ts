import { Howl } from 'howler'
import { UISoundGenerator } from './uiSounds'
import { PlantSoundGenerator } from './plantSounds'
import { AchievementSoundGenerator } from './achievementSounds'
import type { SoundType, AdvancedSoundConfig } from './types'

export class SoundManager {
  private sounds: Map<SoundType, Howl> = new Map()
  private isEnabled: boolean = true
  private masterVolume: number = 1.0
  private debugMode: boolean = false
  private audioContext: AudioContext | null = null
  private isAudioContextReady: boolean = false
  
  private uiSounds: UISoundGenerator | null = null
  private plantSounds: PlantSoundGenerator | null = null
  private achievementSounds: AchievementSoundGenerator | null = null

  constructor() {
    this.debugMode = localStorage.getItem('taskgarden_sound_debug') === 'true'
    this.initializeAudioContext()
    this.initializeSounds()
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        // Audio context will resume on user interaction
      } else {
        this.isAudioContextReady = true
      }

      // Initialize sound generators
      this.uiSounds = new UISoundGenerator(this.audioContext, this.masterVolume)
      this.plantSounds = new PlantSoundGenerator(this.audioContext, this.masterVolume)
      this.achievementSounds = new AchievementSoundGenerator(this.audioContext, this.masterVolume)
    } catch (error) {
      console.error('Failed to create audio context:', error)
    }
  }

  private async ensureAudioContextReady(): Promise<boolean> {
    if (!this.audioContext) {
      await this.initializeAudioContext()
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
        this.isAudioContextReady = true
        return true
      } catch {
        return false
      }
    }

    return this.isAudioContextReady
  }

  async initializeAudio(): Promise<boolean> {
    return this.ensureAudioContextReady()
  }

  private initializeSounds() {
    this.createProceduralSounds()
    this.createBackgroundMusic()
  }

  private createProceduralSounds() {
    // UI Sounds
    this.createAdvancedSound('ui_click', {
      type: 'crystal_click',
      frequency: 600,
      duration: 0.12,
      volume: 0.6
    })
    
    this.createAdvancedSound('ui_button', {
      type: 'harmonic_button',
      frequencies: [523.25, 659.25, 783.99],
      duration: 0.15,
      volume: 0.7
    })
    
    this.createAdvancedSound('ui_hover', {
      type: 'gentle_chime',
      frequency: 880,
      duration: 0.08,
      volume: 0.5
    })
    
    this.createAdvancedSound('ui_modal_open', {
      type: 'ethereal_rise',
      frequency: 220,
      endFrequency: 880,
      duration: 0.4,
      volume: 0.5
    })
    
    this.createAdvancedSound('ui_modal_close', {
      type: 'soft_descent',
      frequency: 880,
      endFrequency: 220,
      duration: 0.35,
      volume: 0.4
    })

    this.createAdvancedSound('ui_tab_switch', {
      type: 'smooth_transition',
      frequencies: [440, 554.37],
      duration: 0.2,
      volume: 0.3
    })
    
    this.createAdvancedSound('ui_dropdown_open', {
      type: 'cascade_down',
      frequencies: [880, 659.25, 523.25, 392.00],
      duration: 0.25,
      volume: 0.4
    })
    
    this.createAdvancedSound('ui_dropdown_close', {
      type: 'cascade_up',
      frequencies: [392.00, 523.25, 659.25, 880],
      duration: 0.2,
      volume: 0.35
    })
    
    this.createAdvancedSound('ui_zoom_in', {
      type: 'zoom_sweep',
      frequency: 220,
      endFrequency: 880,
      duration: 0.4,
      volume: 0.5
    })
    
    this.createAdvancedSound('ui_zoom_out', {
      type: 'zoom_sweep',
      frequency: 880,
      endFrequency: 220,
      duration: 0.3,
      volume: 0.4
    })
    
    this.createAdvancedSound('ui_success', {
      type: 'triumph_bells',
      frequencies: [523.25, 659.25, 783.99, 1046.50, 1318.51],
      duration: 0.8,
      volume: 0.6
    })
    
    this.createAdvancedSound('ui_error', {
      type: 'warning_tone',
      frequencies: [277.18, 293.66],
      duration: 0.4,
      volume: 0.5
    })
    
    this.createAdvancedSound('ui_notification', {
      type: 'gentle_ping',
      frequencies: [1046.50, 1318.51],
      duration: 0.3,
      volume: 0.4
    })

    // Plant Sounds
    this.createAdvancedSound('plant_click', {
      type: 'leaf_rustle',
      frequency: 180,
      duration: 0.2,
      volume: 0.8
    })
    
    this.createAdvancedSound('plant_water', {
      type: 'rain_drops',
      frequency: 120,
      duration: 2.0,
      volume: 0.5
    })
    
    this.createAdvancedSound('plant_grow', {
      type: 'organic_bloom',
      frequency: 110,
      endFrequency: 440,
      duration: 1.8,
      volume: 0.6
    })
    
    this.createAdvancedSound('plant_stage_up', {
      type: 'nature_symphony',
      frequencies: [146.83, 220.00, 293.66, 440.00, 659.25],
      duration: 2.5,
      volume: 0.7
    })
    
    this.createAdvancedSound('plant_harvest', {
      type: 'harvest_chime',
      frequencies: [261.63, 329.63, 392.00, 523.25],
      duration: 1.2,
      volume: 0.6
    })
    
    this.createAdvancedSound('plant_wilt', {
      type: 'sad_descent',
      frequency: 440,
      endFrequency: 110,
      duration: 1.5,
      volume: 0.4
    })
    
    this.createAdvancedSound('plant_create', {
      type: 'genesis_burst',
      frequency: 220,
      duration: 1.0,
      volume: 0.55
    })

    // Task & Achievement Sounds
    this.createAdvancedSound('task_complete', {
      type: 'victory_chord',
      frequencies: [261.63, 329.63, 392.00, 523.25],
      duration: 1.2,
      volume: 0.65
    })
    
    this.createAdvancedSound('task_create', {
      type: 'inspiration_tone',
      frequencies: [440, 554.37, 659.25],
      duration: 0.6,
      volume: 0.5
    })
    
    this.createAdvancedSound('task_delete', {
      type: 'gentle_fade',
      frequency: 440,
      endFrequency: 220,
      duration: 0.5,
      volume: 0.3
    })
    
    this.createAdvancedSound('xp_gain', {
      type: 'crystal_sparkle',
      frequency: 1760,
      duration: 0.4,
      volume: 0.45
    })
    
    this.createAdvancedSound('achievement', {
      type: 'grand_fanfare',
      frequencies: [130.81, 261.63, 329.63, 392.00, 523.25, 659.25, 783.99],
      duration: 3.0,
      volume: 0.8
    })
    
    this.createAdvancedSound('level_up', {
      type: 'ascension_theme',
      frequencies: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
      duration: 2.0,
      volume: 0.75
    })
    
    this.createAdvancedSound('streak_milestone', {
      type: 'cosmic_celebration',
      frequencies: [65.41, 130.81, 261.63, 523.25, 1046.50],
      duration: 3.5,
      volume: 0.85
    })
  }

  private createAdvancedSound(type: SoundType, config: AdvancedSoundConfig) {
    try {
      const soundGenerator = () => {
        if (!this.audioContext || this.audioContext.state !== 'running') {
          return
        }
        
        switch (config.type) {
          // UI Sounds
          case 'crystal_click':
            this.uiSounds?.createCrystalClick(config)
            break
          case 'harmonic_button':
            this.uiSounds?.createHarmonicButton(config)
            break
          case 'gentle_chime':
            this.uiSounds?.createGentleChime(config)
            break
          case 'ethereal_rise':
          case 'soft_descent':
            this.uiSounds?.createEtherealSweep(config)
            break
          case 'smooth_transition':
            this.uiSounds?.createSmoothTransition(config)
            break
          case 'cascade_down':
          case 'cascade_up':
            this.uiSounds?.createCascadeEffect(config)
            break
          case 'zoom_sweep':
            this.uiSounds?.createEtherealSweep(config)
            break
          case 'triumph_bells':
            this.achievementSounds?.createTriumphBells(config)
            break
          case 'warning_tone':
            this.createBasicTone(config)
            break
          case 'gentle_ping':
            this.uiSounds?.createGentleChime(config)
            break
          
          // Plant Sounds
          case 'leaf_rustle':
            this.plantSounds?.createLeafRustle(config)
            break
          case 'rain_drops':
            this.plantSounds?.createRainDrops(config)
            break
          case 'organic_bloom':
            this.plantSounds?.createOrganicBloom(config)
            break
          case 'nature_symphony':
            this.plantSounds?.createNatureSymphony(config)
            break
          case 'harvest_chime':
            this.achievementSounds?.createTriumphBells(config)
            break
          case 'sad_descent':
            this.plantSounds?.createOrganicBloom(config)
            break
          case 'genesis_burst':
            this.plantSounds?.createOrganicBloom(config)
            break
          
          // Achievement Sounds
          case 'victory_chord':
            this.achievementSounds?.createVictoryChord(config)
            break
          case 'inspiration_tone':
            this.achievementSounds?.createTriumphBells(config)
            break
          case 'gentle_fade':
            this.createBasicTone(config)
            break
          case 'crystal_sparkle':
            this.achievementSounds?.createCrystalSparkle(config)
            break
          case 'grand_fanfare':
            this.achievementSounds?.createGrandFanfare(config)
            break
          case 'ascension_theme':
            this.achievementSounds?.createAscensionTheme(config)
            break
          case 'cosmic_celebration':
            this.achievementSounds?.createGrandFanfare(config)
            break
          
          default:
            this.createBasicTone(config)
        }
      }
      
      const advancedHowl = {
        play: () => {
          soundGenerator()
          return Math.random() * 1000
        },
        playing: () => false,
        volume: (vol?: number) => {
          if (vol !== undefined) return vol
          return config.volume * this.masterVolume
        },
        rate: () => 1,
        stop: () => {},
        loop: () => false
      } as Howl
      
      this.sounds.set(type, advancedHowl)
      
    } catch (error) {
      console.error(`Failed to create advanced sound ${type}:`, error)
    }
  }

  private createBasicTone(config: AdvancedSoundConfig) {
    if (!this.audioContext) return
    
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(config.frequency || 440, this.audioContext.currentTime)
    
    const now = this.audioContext.currentTime
    const volume = config.volume * this.masterVolume
    
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration)
    
    osc.connect(gain).connect(this.audioContext.destination)
    osc.start(now)
    osc.stop(now + config.duration)
  }

  private createBackgroundMusic() {
    const musicPaths = [
      '/assets/Virtual-Bloom.mp3',
      '/Virtual-Bloom.mp3',
      './Virtual-Bloom.mp3'
    ]
    
    this.sounds.set('background_music', new Howl({
      src: musicPaths,
      loop: true,
      volume: 0.2 * this.masterVolume,
      preload: true,
      html5: true
    }))
  }

  // Public API methods
  play(type: SoundType) {
    if (!this.isEnabled) return
    
    const sound = this.sounds.get(type)
    if (sound) {
      sound.play()
    }
  }

  playUI(type: 'click' | 'button' | 'modal_open' | 'modal_close' | 'success') {
    this.play(`ui_${type}` as SoundType)
  }

  playPlant(type: 'click' | 'water' | 'grow' | 'stage_up' | 'create') {
    this.play(`plant_${type}` as SoundType)
  }

  playAchievement(type: 'task_complete' | 'xp_gain' | 'achievement' | 'streak_milestone') {
    this.play(type)
  }

  async startBackgroundMusic() {
    if (!this.isEnabled) {
      return
    }

    const isReady = await this.ensureAudioContextReady()
    if (!isReady) {
      return
    }

    const music = this.sounds.get('background_music')
    if (!music) {
      return
    }

    if (!music.playing()) {
      music.volume(0.2 * this.masterVolume)
      
      const randomRate = 0.9 + Math.random() * 0.2
      music.rate(randomRate)
      
      try {
        music.play()
        
        music.on('end', () => {
          if (music.loop()) {
            const newRate = 0.9 + Math.random() * 0.2
            music.rate(newRate)
          }
        })
      } catch (error) {
        console.error('Background music play failed', error)
      }
    }
  }

  stopBackgroundMusic() {
    const music = this.sounds.get('background_music')
    if (music && music.playing()) {
      music.stop()
    }
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    localStorage.setItem('taskgarden_sound_volume', this.masterVolume.toString())
    
    // Update generator volumes
    if (this.uiSounds && this.audioContext) {
      this.uiSounds = new UISoundGenerator(this.audioContext, this.masterVolume)
    }
    if (this.plantSounds && this.audioContext) {
      this.plantSounds = new PlantSoundGenerator(this.audioContext, this.masterVolume)
    }
    if (this.achievementSounds && this.audioContext) {
      this.achievementSounds = new AchievementSoundGenerator(this.audioContext, this.masterVolume)
    }
  }

  getMasterVolume(): number {
    return this.masterVolume
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    localStorage.setItem('taskgarden_sound_enabled', enabled.toString())
  }

  isAudioEnabled(): boolean {
    return this.isEnabled
  }

  setBackgroundMusicVolume(volume: number) {
    const bgMusic = this.sounds.get('background_music')
    if (bgMusic) {
      bgMusic.volume(Math.max(0, Math.min(1, volume)))
      localStorage.setItem('taskgarden_background_music_volume', volume.toString())
    }
  }

  playXPGainSequence(xpAmount: number) {
    // XP gain sound sequence - can be enhanced based on amount
    this.playAchievement('xp_gain')
    
    if (xpAmount > 50) {
      setTimeout(() => this.playAchievement('streak_milestone'), 200)
    }
  }

  enableDebugMode(enabled: boolean = true) {
    this.debugMode = enabled
    localStorage.setItem('taskgarden_sound_debug', enabled.toString())
    
    if (enabled) {
      console.log('Sound debug mode enabled')
      console.log('Available sounds:', Array.from(this.sounds.keys()))
      console.log('Master volume:', this.masterVolume)
      console.log('Audio enabled:', this.isEnabled)
    }
  }

  getDebugInfo() {
    return {
      soundCount: this.sounds.size,
      availableSounds: Array.from(this.sounds.keys()),
      masterVolume: this.masterVolume,
      audioEnabled: this.isEnabled,
      debugMode: this.debugMode
    }
  }

  getBackgroundMusic() {
    return this.sounds.get('background_music')
  }

  playGrowthSequence(stage?: number) {
    this.playPlant('water')
    setTimeout(() => this.playPlant('grow'), 500)
    setTimeout(() => this.playAchievement('xp_gain'), 1000)
    
    // Play additional sounds for higher stages
    if (stage && stage >= 3) {
      setTimeout(() => this.playPlant('stage_up'), 1200)
    }
  }
}
