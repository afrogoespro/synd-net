import { WormholeSystemInfo, getWormholeSystemMetadata } from '../data/wormholeDatabase';
import { parseDScan } from './dscanParser';
import { DScanReport } from '../types/dscan';
import { mapperService } from './mapperService';
import { WormholeSignature } from '../types/mapper';

export interface ScoutAlertEvent {
  id: string;
  timestamp: Date;
  systemName: string;
  source: 'dscan_paste' | 'system_detected' | 'clipboard_auto' | 'esi_jump' | 'probe_signatures' | 'remote_clipboard';
  wormholeInfo: WormholeSystemInfo;
  dscanReport?: DScanReport;
  structuresDetected: { name: string; type: string; distance: string }[];
  signaturesDetected?: WormholeSignature[];
}

export type ScoutAlertCallback = (event: ScoutAlertEvent) => void;
export type RawClipboardCallback = (text: string) => void;

const STORAGE_KEY_RECENT_PASTES = 'synd_scout_recent_pastes';

class ScoutWatcherService {
  private isWatching: boolean = false;
  private intervalId: any = null;
  private lastClipboardText: string = '';
  private lastBroadcastText: string = '';
  private lastProcessedText: string = '';
  private lastProcessedTime: number = 0;
  private lastClickCheckTime: number = 0;
  private listeners: ScoutAlertCallback[] = [];
  private clipboardListeners: RawClipboardCallback[] = [];
  private boundGlobalPaste: ((e: ClipboardEvent) => void) | null = null;
  private boundGlobalClick: ((e: MouseEvent | PointerEvent) => void) | null = null;

  constructor() {
    this.initGlobalListeners();
  }

  public subscribe(cb: ScoutAlertCallback) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public onClipboardText(cb: RawClipboardCallback) {
    this.clipboardListeners.push(cb);
    return () => {
      this.clipboardListeners = this.clipboardListeners.filter(l => l !== cb);
    };
  }

  private notify(event: ScoutAlertEvent) {
    this.listeners.forEach(cb => cb(event));
  }

  public notifyRawClipboard(text: string) {
    this.clipboardListeners.forEach(cb => cb(text));
  }

  /**
   * Initializes global paste and click-anywhere listeners.
   * Allows auto-pasting anywhere on screen without requiring an input box to be clicked!
   */
  private initGlobalListeners() {
    if (typeof window === 'undefined') return;

    // 1. Global Keyboard Paste (Ctrl+V anywhere)
    this.boundGlobalPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      if (text && text.trim().length > 3) {
        this.lastClipboardText = text;
        this.evaluateText(text, 'clipboard_auto');
      }
    };
    window.addEventListener('paste', this.boundGlobalPaste);

    // 2. Global Pointerdown / Click anywhere
    this.boundGlobalClick = async () => {
      const now = Date.now();
      if (now - this.lastClickCheckTime < 500) return; // Debounce rapid clicking
      this.lastClickCheckTime = now;

      if (navigator.clipboard?.readText) {
        try {
          const clipText = await navigator.clipboard.readText();
          if (clipText && clipText !== this.lastClipboardText && clipText.trim().length > 4) {
            this.lastClipboardText = clipText;
            this.evaluateText(clipText, 'clipboard_auto');
          }
        } catch {
          // Browser permission not granted yet or window lost focus
        }
      }
    };
    window.addEventListener('pointerdown', this.boundGlobalClick);
  }

  /**
   * Broadcasts text to backend wireless clipboard bridge so all connected buddies receive it
   */
  public async broadcastClipboard(text: string, pilotName: string = 'Fleet Scout') {
    if (!text || !text.trim()) return;
    try {
      await fetch('/api/map/clipboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), pilotName })
      });
    } catch {}
  }

  /**
   * Evaluates text from clipboard, global paste, user gesture, or SSE log bridge.
   */
  public evaluateText(text: string, source: ScoutAlertEvent['source'] = 'clipboard_auto'): boolean {
    if (!text || text.trim() === '') return false;
    const clean = text.trim();

    // Prevent echo loops: only broadcast to fleet if this originated locally from user gesture / local clipboard
    if (source === 'dscan_paste' || source === 'clipboard_auto') {
      if (clean !== this.lastBroadcastText) {
        this.lastBroadcastText = clean;
        this.broadcastClipboard(clean);
      }
    }

    // Deduplicate rapid processing of identical text
    if (clean === this.lastProcessedText && (Date.now() - this.lastProcessedTime < 3000)) {
      return false;
    }
    this.lastProcessedText = clean;
    this.lastProcessedTime = Date.now();

    // Notify raw clipboard subscribers (e.g. D-Scan live view)
    this.notifyRawClipboard(clean);

    // 1. Check for J-System directly (e.g. J152438, J103955)
    const jMatch = clean.match(/\b(J\d{6})\b/i);
    let systemName = jMatch ? jMatch[1].toUpperCase() : '';

    // Check for known K-space solar systems if not a J-system
    if (!systemName) {
      const knownSystems = Object.keys(mapperService.getState().systems);
      const match = knownSystems.find(s => s.toLowerCase() === clean.toLowerCase());
      if (match) {
        systemName = match;
      } else if (/^[A-Z][a-z0-9\- ]{2,18}$/.test(clean) && !clean.includes('\t') && !clean.includes('\n')) {
        systemName = clean;
      }
    }

    // 2. Check for Probe Scanner Cosmic Signatures (EVE Probe Scan copy format)
    const signatures: WormholeSignature[] = [];
    const lines = clean.split(/\r?\n/);
    lines.forEach(line => {
      const parts = line.split('\t');
      // Format: ID (e.g. ABC-123), Group, Type, Name, Signal (e.g. 100.0%), Distance
      if (parts.length >= 3) {
        const idMatch = parts[0].trim().match(/^([A-Z]{3}-\d{3})$/i);
        if (idMatch) {
          const sigId = idMatch[1].toUpperCase();
          const group = parts[1]?.trim() || 'Unknown';
          const type = parts[2]?.trim() || 'Cosmic Signature';
          const name = parts[3]?.trim() || group;
          const sigPercent = parts[4] ? parseFloat(parts[4].replace('%', '')) : 0;
          const distance = parts[5]?.trim() || '';

          signatures.push({
            id: `sig-${Date.now()}-${sigId}`,
            sigId,
            type: group.toLowerCase().includes('wormhole') ? 'Wormhole' : 'Anomaly',
            name: name || 'Cosmic Signature',
            group,
            distance,
            signalPercent: isNaN(sigPercent) ? 100 : sigPercent,
            createdTime: new Date().toISOString().slice(11, 16)
          });
        }
      }
    });

    // If Probe Signatures detected, sync them into the active chain system and local memory
    if (signatures.length > 0) {
      const activeSys = systemName || mapperService.getActiveSystem()?.id || 'J103955';
      mapperService.syncSystemSignatures(activeSys, signatures);
      try {
        localStorage.setItem(`synd_sigs_${activeSys}`, JSON.stringify(signatures));
      } catch {}

      const whInfo = getWormholeSystemMetadata(activeSys);
      this.notify({
        id: `scout-${Date.now()}`,
        timestamp: new Date(),
        systemName: activeSys,
        source: 'probe_signatures',
        wormholeInfo: whInfo,
        structuresDetected: [],
        signaturesDetected: signatures
      });
      return true;
    }

    // 3. Parse D-Scan structures
    let dscanReport: DScanReport | undefined = undefined;
    const structures: { name: string; type: string; distance: string }[] = [];

    if (
      clean.includes('\t') || 
      clean.toLowerCase().includes('astrahus') || 
      clean.toLowerCase().includes('fortizar') || 
      clean.toLowerCase().includes('athanor') || 
      clean.toLowerCase().includes('keepstar') ||
      clean.toLowerCase().includes('km') || 
      clean.toLowerCase().includes('au')
    ) {
      try {
        dscanReport = parseDScan(clean);
        dscanReport.items.forEach(item => {
          if (
            item.shipInfo.role === 'Citadel / Upwell' ||
            item.itemType.toLowerCase().includes('astrahus') ||
            item.itemType.toLowerCase().includes('fortizar') ||
            item.itemType.toLowerCase().includes('raitaru') ||
            item.itemType.toLowerCase().includes('azbel') ||
            item.itemType.toLowerCase().includes('athanor') ||
            item.itemType.toLowerCase().includes('tatara') ||
            item.itemType.toLowerCase().includes('keepstar') ||
            item.itemType.toLowerCase().includes('citadel')
          ) {
            structures.push({
              name: item.itemName,
              type: item.itemType,
              distance: item.distanceStr
            });
          }
        });
      } catch (e) {
        console.error('DScan parse error', e);
      }
    }

    // Trigger alert if real J-system is recognized OR structures found OR D-scan has targets
    if (systemName || structures.length > 0) {
      const activeSysName = systemName || mapperService.getActiveSystem()?.id || 'Wormhole System';
      const whInfo = getWormholeSystemMetadata(activeSysName);

      // Save to local memory history
      this.persistRecentPaste(activeSysName, clean);

      this.notify({
        id: `scout-${Date.now()}`,
        timestamp: new Date(),
        systemName: activeSysName,
        source,
        wormholeInfo: whInfo,
        dscanReport,
        structuresDetected: structures
      });
      return true;
    }

    return false;
  }

  private persistRecentPaste(systemName: string, text: string) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT_PASTES);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({ systemName, snippet: text.slice(0, 80), time: new Date().toISOString() });
      if (list.length > 20) list.pop();
      localStorage.setItem(STORAGE_KEY_RECENT_PASTES, JSON.stringify(list));
    } catch {}
  }

  public startClipboardPolling(intervalMs: number = 2000) {
    if (this.isWatching) return;
    this.isWatching = true;

    // Focus interval fallback
    this.intervalId = setInterval(async () => {
      if (typeof window !== 'undefined' && document.hasFocus && document.hasFocus() && navigator.clipboard?.readText) {
        try {
          const clipText = await navigator.clipboard.readText();
          if (clipText && clipText !== this.lastClipboardText && clipText.length > 5) {
            this.lastClipboardText = clipText;
            this.evaluateText(clipText, 'clipboard_auto');
          }
        } catch {}
      }
    }, intervalMs);
  }

  public stopClipboardPolling() {
    this.isWatching = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getIsWatching(): boolean {
    return this.isWatching;
  }
}

export const scoutWatcher = new ScoutWatcherService();
