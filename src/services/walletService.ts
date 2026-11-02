/**
 * Synd.net Wallet Service
 * -----------------------
 * Reads the pilot's ISK balance and wallet journal from EVE ESI
 * (scope: esi-wallet.read_character_wallet.v1) and derives:
 *   - current balance
 *   - today's income / expenses / net (EVE time = UTC, resets at 00:00 downtime day)
 *   - yesterday + last 7 days net
 *   - session gain (balance change since this browser session started)
 *   - per-category breakdown (ratting, market, missions, transfers, ...)
 *   - hourly net for today (for the sparkline)
 *
 * Results are cached in localStorage so the panel renders instantly on reload.
 */
import { authService, WALLET_SCOPE } from './authService';

export interface JournalEntry {
  id: number;
  date: string;
  ref_type: string;
  amount?: number;
  balance?: number;
  description?: string;
  reason?: string;
}

export type WalletCategory =
  | 'Ratting & ESS'
  | 'Missions'
  | 'Market'
  | 'Taxes & Fees'
  | 'Transfers'
  | 'Industry'
  | 'Other';

export interface CategoryTotal {
  category: WalletCategory;
  income: number;
  expense: number;
  count: number;
}

export interface WalletSummary {
  characterId: number;
  balance: number | null;
  today: { income: number; expense: number; net: number; count: number };
  yesterdayNet: number;
  week: { income: number; expense: number; net: number };
  sessionGain: number | null;
  sessionStartedAt: string | null;
  categoriesToday: CategoryTotal[];
  hourlyToday: number[]; // 24 buckets of net ISK (EVE hours)
  recent: JournalEntry[];
  updatedAt: string;
}

export type WalletStatus =
  | { state: 'no_pilot' }
  | { state: 'no_scope' }
  | { state: 'loading' }
  | { state: 'ready'; summary: WalletSummary }
  | { state: 'error'; message: string; summary?: WalletSummary };

type Listener = (status: WalletStatus) => void;

const ESI = 'https://esi.evetech.net/latest';
const CACHE_KEY = 'synd_wallet_summary_v1';
const SESSION_KEY = 'synd_wallet_session_start';
const POLL_MS = 5 * 60 * 1000; // ESI caches wallet ~2 min, journal ~1h; 5 min is plenty

export function categorize(refType: string): WalletCategory {
  const t = refType.toLowerCase();
  if (t.includes('bounty') || t.includes('ess_escrow') || t === 'corporate_reward_payout') return 'Ratting & ESS';
  if (t.startsWith('agent_') || t.includes('mission')) return 'Missions';
  if (t === 'brokers_fee' || t === 'transaction_tax' || t.includes('_tax') || t.includes('fee')) return 'Taxes & Fees';
  if (t.startsWith('market_') || t.includes('contract')) return 'Market';
  if (t.startsWith('player_') || t.includes('corporation_account') || t.includes('donation')) return 'Transfers';
  if (t.includes('industry') || t.includes('manufactur') || t.includes('reprocess') || t.includes('planetary')) return 'Industry';
  return 'Other';
}

export function prettyRefType(refType: string): string {
  return refType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatIsk(value: number | null | undefined, opts: { sign?: boolean } = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : opts.sign && value > 0 ? '+' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

function eveDayStart(offsetDays = 0): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offsetDays);
}

class WalletService {
  private status: WalletStatus = { state: 'no_pilot' };
  private listeners: Listener[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private inFlight = false;

  constructor() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const summary: WalletSummary = JSON.parse(cached);
        if (summary.characterId === authService.getPilot()?.characterId) {
          this.status = { state: 'ready', summary };
        }
      }
    } catch { /* ignore corrupt cache */ }

    authService.subscribe(() => {
      this.refresh();
    });
  }

  public getStatus(): WalletStatus {
    return this.status;
  }

  public subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    fn(this.status);
    if (!this.timer) {
      this.refresh();
      this.timer = setInterval(() => this.refresh(), POLL_MS);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
      if (this.listeners.length === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  }

  public resetSession() {
    localStorage.removeItem(SESSION_KEY);
    this.refresh();
  }

  private setStatus(s: WalletStatus) {
    this.status = s;
    this.listeners.forEach(l => l(s));
  }

  public async refresh(): Promise<void> {
    const pilot = authService.getPilot();
    if (!pilot) return this.setStatus({ state: 'no_pilot' });

    const tokens = authService.getTokens();
    const scopes = tokens?.scopes || pilot.scopes || [];
    if (!tokens?.accessToken || !scopes.includes(WALLET_SCOPE)) {
      return this.setStatus({ state: 'no_scope' });
    }
    if (this.inFlight) return;
    this.inFlight = true;

    const previous = this.status.state === 'ready' ? this.status.summary : undefined;
    if (!previous) this.setStatus({ state: 'loading' });

    try {
      const token = await authService.getValidAccessToken();
      if (!token) throw new Error('SSO token missing — please sign in again.');
      const headers = { Authorization: `Bearer ${token}` };
      const cid = pilot.characterId;

      const balRes = await fetch(`${ESI}/characters/${cid}/wallet/?datasource=tranquility`, { headers });
      if (balRes.status === 403) return this.setStatus({ state: 'no_scope' });
      if (!balRes.ok) throw new Error(`ESI wallet error ${balRes.status}`);
      const balance = Number(await balRes.json());

      // Journal: newest first, paginated. Stop once we're past 7 days.
      const weekStart = eveDayStart(6);
      const entries: JournalEntry[] = [];
      let page = 1;
      let pages = 1;
      do {
        const r = await fetch(`${ESI}/characters/${cid}/wallet/journal/?datasource=tranquility&page=${page}`, { headers });
        if (!r.ok) break;
        pages = Number(r.headers.get('x-pages') || '1');
        const batch: JournalEntry[] = await r.json();
        entries.push(...batch);
        const oldest = batch[batch.length - 1];
        if (!oldest || new Date(oldest.date).getTime() < weekStart) break;
        page++;
      } while (page <= pages && page <= 5);

      const summary = this.summarize(cid, balance, entries);
      localStorage.setItem(CACHE_KEY, JSON.stringify(summary));
      this.setStatus({ state: 'ready', summary });
    } catch (err: any) {
      this.setStatus({ state: 'error', message: err?.message || 'Failed to load wallet', summary: previous });
    } finally {
      this.inFlight = false;
    }
  }

  private summarize(characterId: number, balance: number, entries: JournalEntry[]): WalletSummary {
    const todayStart = eveDayStart(0);
    const yesterdayStart = eveDayStart(1);
    const weekStart = eveDayStart(6);

    const today = { income: 0, expense: 0, net: 0, count: 0 };
    const week = { income: 0, expense: 0, net: 0 };
    let yesterdayNet = 0;
    const hourlyToday = new Array(24).fill(0);
    const cats = new Map<WalletCategory, CategoryTotal>();

    for (const e of entries) {
      const ts = new Date(e.date).getTime();
      const amt = e.amount || 0;
      if (ts >= weekStart) {
        if (amt >= 0) week.income += amt; else week.expense += -amt;
        week.net += amt;
      }
      if (ts >= todayStart) {
        if (amt >= 0) today.income += amt; else today.expense += -amt;
        today.net += amt;
        today.count++;
        hourlyToday[new Date(e.date).getUTCHours()] += amt;
        const c = categorize(e.ref_type);
        const cur = cats.get(c) || { category: c, income: 0, expense: 0, count: 0 };
        if (amt >= 0) cur.income += amt; else cur.expense += -amt;
        cur.count++;
        cats.set(c, cur);
      } else if (ts >= yesterdayStart) {
        yesterdayNet += amt;
      }
    }

    // Session tracking: first balance seen this browser session (per character)
    let sessionGain: number | null = null;
    let sessionStartedAt: string | null = null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      let sess = raw ? JSON.parse(raw) : null;
      if (!sess || sess.characterId !== characterId || Date.now() - new Date(sess.at).getTime() > 24 * 3600 * 1000) {
        sess = { characterId, balance, at: new Date().toISOString() };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
        localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      }
      sessionGain = balance - sess.balance;
      sessionStartedAt = sess.at;
    } catch { /* storage unavailable */ }

    return {
      characterId,
      balance,
      today,
      yesterdayNet,
      week,
      sessionGain,
      sessionStartedAt,
      categoriesToday: [...cats.values()].sort((a, b) => (b.income + b.expense) - (a.income + a.expense)),
      hourlyToday,
      recent: entries.slice(0, 25),
      updatedAt: new Date().toISOString()
    };
  }
}

export const walletService = new WalletService();
