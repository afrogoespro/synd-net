// Sound utility for Synd.net Tactical Intel

let lastPlayTime = 0;

export const playJackpotSound = (force: boolean = false) => {
  const now = Date.now();
  // Prevent audio spam (minimum 4 seconds between triggers unless forced)
  if (!force && now - lastPlayTime < 4000) {
    return;
  }
  lastPlayTime = now;

  try {
    const audio = new Audio('/sounds/jackpot.mp3');
    audio.volume = 0.85;
    audio.play().catch(e => {
      console.warn('[Synd.net Audio] Audio autoplay blocked or failed:', e);
    });
  } catch (e) {
    console.warn('[Synd.net Audio] Failed to initialize Audio:', e);
  }
};
