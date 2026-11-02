// Sound & Music service for Synd.net Tactical Intel

export interface AudioPlaybackState {
  isPlaying: boolean;
  trackName: string;
  volume: number; // 0 to 1, default 0.50
  currentTime: number;
  duration: number;
  startTime: number; // default 8s
  endTime: number; // default 16s
  isPopupVisible: boolean;
  activeGifUrl: string;
}

export const JACKPOT_GIFS = [
  { id: 'donald_duck_money', name: 'Donald Duck Cash', url: '/gifs/donald_duck_money.gif' },
  { id: 'money_rain', name: 'Money Rain', url: 'https://media.giphy.com/media/67ThRZlYBvibtdF9UC/giphy.gif' },
  { id: 'vegas_jackpot', name: 'Vegas 777', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { id: 'dance_rave', name: 'Cyber Rave', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
];

type AudioListener = (state: AudioPlaybackState) => void;

class SoundManager {
  private audioElement: HTMLAudioElement | null = null;
  private listeners: Set<AudioListener> = new Set();
  private lastPlayTime = 0;
  private startTime: number = 8.0;
  private endTime: number = 16.0;
  
  private state: AudioPlaybackState = {
    isPlaying: false,
    trackName: 'High-Value Ore Jackpot',
    volume: (() => {
      const saved = localStorage.getItem('synd_music_volume');
      return saved !== null ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.50; // default 50%
    })(),
    currentTime: 8.0,
    duration: 16.0,
    startTime: 8.0,
    endTime: 16.0,
    isPopupVisible: false,
    activeGifUrl: (() => {
      return localStorage.getItem('synd_jackpot_gif') || JACKPOT_GIFS[0].url;
    })(),
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
      if (!this.audioElement) return;
      this.state.currentTime = this.audioElement.currentTime;
      this.state.duration = this.audioElement.duration || this.endTime;

      // Restrict playback to 8s -> 16s range
      if (this.audioElement.currentTime >= this.endTime) {
        this.audioElement.pause();
        this.audioElement.currentTime = this.startTime;
        this.state.isPlaying = false;
        this.state.currentTime = this.startTime;
        this.notify();

        // Auto-dismiss popup 3 seconds after clip finishes
        setTimeout(() => {
          if (!this.state.isPlaying) {
            this.state.isPopupVisible = false;
            this.notify();
          }
        }, 3000);
      } else {
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
      this.state.currentTime = this.startTime;
      this.notify();
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.audioElement) {
        this.state.duration = this.audioElement.duration || this.endTime;
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

  public setRange(start: number, end: number) {
    this.startTime = Math.max(0, start);
    this.endTime = Math.max(this.startTime + 1, end);
    this.state.startTime = this.startTime;
    this.state.endTime = this.endTime;
    this.notify();
  }

  public setGifUrl(url: string) {
    this.state.activeGifUrl = url;
    localStorage.setItem('synd_jackpot_gif', url);
    this.notify();
  }

  public setPopupVisible(visible: boolean) {
    this.state.isPopupVisible = visible;
    this.notify();
  }

  /**
   * Plays the designated segment (starts from 8s to 16s) and brings up the GIF popup.
   */
  public play(
    trackName: string = 'High-Value Ore Jackpot',
    src: string = '/sounds/jackpot.mp3',
    force: boolean = false,
    startTime: number = 8.0,
    endTime: number = 16.0
  ) {
    const now = Date.now();
    if (!force && now - this.lastPlayTime < 3000) {
      return;
    }
    this.lastPlayTime = now;

    this.initAudio();
    if (!this.audioElement) return;

    this.startTime = startTime;
    this.endTime = endTime;
    this.state.startTime = startTime;
    this.state.endTime = endTime;

    if (this.audioElement.src !== new URL(src, window.location.href).href) {
      this.audioElement.src = src;
    }

    this.state.trackName = trackName;
    this.state.volume = Math.max(0, Math.min(1, this.state.volume || 0.50));
    this.audioElement.volume = this.state.volume;
    
    // Jump directly to 8.0 seconds
    try {
      this.audioElement.currentTime = startTime;
      this.state.currentTime = startTime;
    } catch (e) {
      console.warn('Could not set currentTime immediately:', e);
    }

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
      if (this.audioElement.currentTime < this.startTime || this.audioElement.currentTime >= this.endTime) {
        this.audioElement.currentTime = this.startTime;
      }
      this.audioElement.play().catch(() => {});
    }
  }

  public stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = this.startTime;
    }
    this.state.isPlaying = false;
    this.state.currentTime = this.startTime;
    this.state.isPopupVisible = false;
    this.notify();
  }
}

export const soundManager = new SoundManager();

// Backward compatibility export: starts from 8.0s, plays to 16.0s
export const playJackpotSound = (force: boolean = false) => {
  soundManager.play('High-Value Ore Jackpot', '/sounds/jackpot.mp3', force, 8.0, 16.0);
};
