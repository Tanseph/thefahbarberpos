// Sound & Tactile Haptics Utility
// Uses Web Audio API for zero-latency, offline, dependency-free audio feedback

const SOUND_STORAGE_KEY = 'barbershop_click_sound_enabled';

let audioCtx: AudioContext | null = null;
let lastSoundTime = 0;

/**
 * Check if click sound is currently enabled (default: true)
 */
export function isSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Set sound enabled state and persist to localStorage
 */
export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
    // Dispatch custom event so UI components (e.g., Header) can re-render immediately
    window.dispatchEvent(new CustomEvent('barbershop:sound-toggle', { detail: { enabled } }));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Toggle sound enabled state
 */
export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  if (next) {
    // Play a preview click when turning on
    playClickSound();
  }
  return next;
}

/**
 * Get or initialize the shared AudioContext lazily
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Play a crisp, pleasant mechanical micro-click sound
 * Duration ~30ms, frequency sweep 950Hz -> 450Hz with exponential decay
 */
export function playClickSound(): void {
  if (!isSoundEnabled()) return;

  const now = Date.now();
  // Throttle to prevent distorted clipping if rapidly clicking within 25ms
  if (now - lastSoundTime < 25) return;
  lastSoundTime = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // High-pitched initial attack falling to a warm body
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.032);

    // Subtle gentle volume envelope (no harsh popping, smooth fade-out)
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.038);
  } catch (err) {
    // Audio playback failed (e.g. browser policy before interaction)
  }
}

/**
 * Play a subtle two-tone success / complete chime (for save/checkout)
 */
export function playSuccessSound(): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, t); // D5
    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.linearRampToValueAtTime(0.09, t + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.075);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, t + 0.06); // A5
    gain2.gain.setValueAtTime(0.001, t + 0.06);
    gain2.gain.linearRampToValueAtTime(0.11, t + 0.068);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.06);
    osc2.stop(t + 0.17);
  } catch {
    // Ignore audio error
  }
}

/**
 * Initialize global document-level click sound listeners.
 * Listens for pointerdown on interactive elements (buttons, links, clickable chips)
 * for instant zero-latency feedback before mouse-up.
 */
let isListenerInitialized = false;

export function initGlobalClickSoundListener(): void {
  if (typeof window === 'undefined' || isListenerInitialized) return;
  isListenerInitialized = true;

  // Pointerdown gives instant tactile feedback when touching or clicking
  document.addEventListener(
    'pointerdown',
    (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest interactive element
      const interactiveEl = target.closest(
        'button, [role="button"], a[href], input[type="button"], input[type="submit"], input[type="reset"], summary, select, [data-sound="true"]'
      ) as HTMLElement | null;

      if (!interactiveEl) return;

      // Check if disabled
      if (
        (interactiveEl as HTMLButtonElement).disabled ||
        interactiveEl.getAttribute('aria-disabled') === 'true' ||
        interactiveEl.classList.contains('disabled') ||
        interactiveEl.classList.contains('pointer-events-none')
      ) {
        return;
      }

      playClickSound();
    },
    { passive: true, capture: true }
  );

  // Keyboard accessibility: trigger sound when Space or Enter is pressed on focused button
  document.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        const interactiveEl = target.closest('button, [role="button"]') as HTMLElement | null;
        if (
          interactiveEl &&
          !(interactiveEl as HTMLButtonElement).disabled &&
          interactiveEl.getAttribute('aria-disabled') !== 'true'
        ) {
          playClickSound();
        }
      }
    },
    { passive: true, capture: true }
  );
}
