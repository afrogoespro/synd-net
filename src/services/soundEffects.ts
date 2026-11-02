// Sound & Music service for Synd.net Tactical Intel

export interface AudioPlaybackState {
  isPlaying: boolean;
  trackName: string;
  volume: number; // 0 to 1, default 0.50
  currentTime: number;
  duration: number;
  isPopupVisible: boolean;
}

type AudioListener = (state: AudioPlaybackState) => void;

class SoundManager {
  private audioElement: HTMLAudioElement | null = null;
  private listeners: Set<AudioListener> = new Set();
  private lastPlayTime = 0;
  
  private state: AudioPlaybackState = {
    isPlaying: false,
    trackName: 'Jackpot Alert',
    volume: (() => {
      const saved = localStorage.getItem('synd_music_volume');
      return saved !== null ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.50; // default 50%
    })(),
    currentTime: 0,
    duration: 0,
    isPopupVisible: false,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audioElement) return;
    this.audioElement = new Audio('/sounds/jackpot.mp3');
    this.audioElement.volume = this.state.volume;

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this.state.currentTime = this.audioElement.currentTime;
        this.state.duration = this.audioElement.duration || 0;
        this.notify();
      }
    });

    this.audioElement.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.state.isPopupVisible = true;
      this.notify();
    });

    this.audioElement.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.notify();
    });

    this.audioElement.addEventListener('ended', () => {
      this.state.isPlaying = false;
      this.state.currentTime = 0;
      this.notify();
      // Auto-hide popup after 3 seconds of track completion
      setTimeout(() => {
        if (!this.state.isPlaying) {
          this.state.isPopupVisible = false;
          this.notify();
        }
      }, 3000);
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.audioElement) {
        this.state.duration = this.audioElement.duration || 0;
        this.notify();
      }
    });
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach(fn => fn(copy));
  }

  public getState(): AudioPlaybackState {
    return { ...this.state };
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.state.volume = clamped;
    localStorage.setItem('synd_music_volume', clamped.toString());
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
    this.notify();
  }

  public setPopupVisible(visible: boolean) {
    this.state.isPopupVisible = visible;
    this.notify();
  }

  public play(trackName: string = 'Jackpot Alert', src: string = '/sounds/jackpot.mp3', force: boolean = false) {
    const now = Date.now();
    if (!force && now - this.lastPlayTime < 3000) {
      return;
    }
    this.lastPlayTime = now;

    this.initAudio();
    if (!this.audioElement) return;

    if (this.audioElement.src !== new URL(src, window.location.href).href) {
      this.audioElement.src = src;
    }

    this.state.trackName = trackName;
    this.state.volume = Math.max(0, Math.min(1, this.state.volume || 0.50));
    this.audioElement.volume = this.state.volume;
    this.state.isPopupVisible = true;

    this.audioElement.play().catch(e => {
      console.warn('[Synd.net Audio] Playback prevented by browser policy:', e);
    });
    this.notify();
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public resume() {
    if (this.audioElement) {
      this.audioElement.play().catch(() => {});
    }
  }

  public stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.state.isPlaying = false;
    this.state.isPopupVisible = false;
    this.notify();
  }
}

export const soundManager = new SoundManager();

// Backward compatibility export
export const playJackpotSound = (force: boolean = false) => {
  soundManager.play('Jackpot Alert', '/sounds/jackpot.mp3', force);
};
