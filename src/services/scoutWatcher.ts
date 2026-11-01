import { WormholeSystemInfo, getWormholeSystemMetadata } from '../data/wormholeDatabase';
import { parseDScan } from './dscanParser';
import { DScanReport } from '../types/dscan';

export interface ScoutAlertEvent {
  id: string;
  timestamp: Date;
  systemName: string;
  source: 'dscan_paste' | 'system_detected' | 'clipboard_auto' | 'esi_jump';
  wormholeInfo: WormholeSystemInfo;
  dscanReport?: DScanReport;
  structuresDetected: { name: string; type: string; distance: string }[];
}

export type ScoutAlertCallback = (event: ScoutAlertEvent) => void;
export type RawClipboardCallback = (text: string) => void;

class ScoutWatcherService {
  private isWatching: boolean = false;
  private intervalId: any = null;
  private lastClipboardText: string = '';
  private listeners: ScoutAlertCallback[] = [];
  private clipboardListeners: RawClipboardCallback[] = [];

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

  // Analyzes real text from clipboard, logs, or user input
  public evaluateText(text: string, source: ScoutAlertEvent['source'] = 'clipboard_auto'): boolean {
    if (!text || text.trim() === '') return false;
    const clean = text.trim();

    // Notify D-Scan parser view
    this.notifyRawClipboard(clean);

    // Check if text directly contains or is a J-system (e.g. J152438 or J105312)
    const jMatch = clean.match(/\b(J\d{6})\b/i);
    const systemName = jMatch ? jMatch[1].toUpperCase() : '';

    // Parse potential D-Scan
    let dscanReport: DScanReport | undefined = undefined;
    const structures: { name: string; type: string; distance: string }[] = [];

    if (clean.includes('\t') || clean.toLowerCase().includes('astrahus') || clean.toLowerCase().includes('fortizar') || clean.toLowerCase().includes('athanor') || clean.toLowerCase().includes('km') || clean.toLowerCase().includes('au')) {
      try {
        dscanReport = parseDScan(clean);
        // Extract real structures seen on scan
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
        console.error("DScan parse error", e);
      }
    }

    // Trigger alert if real J-system is recognized OR structures found OR D-scan has targets
    if (systemName || structures.length > 0) {
      const whInfo = getWormholeSystemMetadata(systemName || 'J-Space System');

      this.notify({
        id: `scout-${Date.now()}`,
        timestamp: new Date(),
        systemName: systemName || 'Wormhole System',
        source,
        wormholeInfo: whInfo,
        dscanReport,
        structuresDetected: structures
      });
      return true;
    }

    return false;
  }

  public startClipboardPolling(intervalMs: number = 2000) {
    if (this.isWatching) return;
    this.isWatching = true;

    // Connect to local EVE Log Watcher SSE stream via Vite proxy
    try {
      const eventSource = new EventSource('/api/map/stream');
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'JUMP' && payload.systemName) {
            console.log(`[EVE Log Bridge] Jumped to ${payload.systemName}`);
            this.evaluateText(payload.systemName, 'esi_jump');
          } else if (payload.type === 'CLIPBOARD_TEXT' && payload.text) {
            console.log(`[OS Background Clipboard] Auto-detected EVE scan without tabbing out!`);
            this.evaluateText(payload.text, 'clipboard_auto');
          }
        } catch (err) {}
      };
    } catch {}

    // Browser focus fallback
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
