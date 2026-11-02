import React, { useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, RefreshCw, KeyRound, Clock, Timer,
  CalendarDays, ArrowUpRight, ArrowDownRight, RotateCcw, Lock
} from 'lucide-react';
import {
  walletService, WalletStatus, WalletSummary, formatIsk, categorize, prettyRefType, WalletCategory
} from '../services/walletService';
import { authService, PilotProfile } from '../services/authService';
import { PilotLoginModal } from './PilotLoginModal';

const CATEGORY_COLORS: Record<WalletCategory, string> = {
  'Ratting & ESS': '#22c55e',
  'Missions': '#38bdf8',
  'Market': '#a78bfa',
  'Taxes & Fees': '#f97316',
  'Transfers': '#facc15',
  'Industry': '#2dd4bf',
  'Other': '#94a3b8'
};

function useWallet(): WalletStatus {
  const [status, setStatus] = useState<WalletStatus>(walletService.getStatus());
  useEffect(() => walletService.subscribe(setStatus), []);
  return status;
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
}

/* ------------------------------------------------------------------ */
/* Compact header pill: today's net at a glance                         */
/* ------------------------------------------------------------------ */
export const WalletPill: React.FC<{ onClick: () => void; isDark?: boolean }> = ({ onClick, isDark = true }) => {
  const status = useWallet();
  const summary = status.state === 'ready' ? status.summary : status.state === 'error' ? status.summary : undefined;
  if (!summary) return null;
  const net = summary.today.net;
  return (
    <button
      onClick={onClick}
      title={`Balance ${formatIsk(summary.balance)} ISK • Today ${formatIsk(net, { sign: true })} ISK`}
      className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50'
      }`}
    >
      <Wallet className="w-3.5 h-3.5 text-emerald-400" />
      <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{formatIsk(summary.balance)}</span>
      <span className={net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatIsk(net, { sign: true })}</span>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Full wallet view                                                     */
/* ------------------------------------------------------------------ */
const StatCard: React.FC<{
  label: string; value: string; sub?: React.ReactNode; icon: React.ReactNode; tone?: 'pos' | 'neg' | 'neutral'
}> = ({ label, value, sub, icon, tone = 'neutral' }) => (
  <div className="rounded-3xl p-5 bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
      <span>{label}</span>
      <span className="opacity-80">{icon}</span>
    </div>
    <div className={`mt-2 text-3xl font-semibold tracking-tight ${
      tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-rose-400' : 'text-white'
    }`}>
      {value}
      <span className="text-sm font-medium text-slate-500 ml-1">ISK</span>
    </div>
    {sub && <div className="mt-1 text-[11px] text-slate-400">{sub}</div>}
  </div>
);

const HourlyChart: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(1, ...data.map(Math.abs));
  const nowHour = new Date().getUTCHours();
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((v, h) => {
        const pct = (Math.abs(v) / max) * 100;
        return (
          <div key={h} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div
              className={`w-full rounded-t-md transition-all ${v >= 0 ? 'bg-emerald-400/80' : 'bg-rose-400/80'} ${
                h > nowHour ? 'opacity-20' : ''
              } group-hover:opacity-100`}
              style={{ height: `${Math.max(v === 0 ? 2 : 6, pct)}%` }}
            />
            <div className="absolute -top-6 hidden group-hover:block text-[10px] px-1.5 py-0.5 rounded bg-black/90 border border-white/10 whitespace-nowrap z-10">
              {String(h).padStart(2, '0')}:00 • {formatIsk(v, { sign: true })}
            </div>
            {h % 6 === 0 && <span className="text-[9px] text-slate-500 mt-1">{String(h).padStart(2, '0')}</span>}
          </div>
        );
      })}
    </div>
  );
};

const Breakdown: React.FC<{ summary: WalletSummary }> = ({ summary }) => {
  const total = summary.categoriesToday.reduce((s, c) => s + c.income + c.expense, 0) || 1;
  if (summary.categoriesToday.length === 0) {
    return <div className="text-xs text-slate-500 py-6 text-center">No wallet activity yet today.</div>;
  }
  return (
    <div className="space-y-3">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
        {summary.categoriesToday.map(c => (
          <div key={c.category} style={{ width: `${((c.income + c.expense) / total) * 100}%`, background: CATEGORY_COLORS[c.category] }} />
        ))}
      </div>
      {summary.categoriesToday.map(c => {
        const net = c.income - c.expense;
        return (
          <div key={c.category} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[c.category] }} />
              <span className="text-slate-200">{c.category}</span>
              <span className="text-slate-500 text-[10px]">{c.count} tx</span>
            </div>
            <span className={`font-semibold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatIsk(net, { sign: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const WalletView: React.FC = () => {
  const status = useWallet();
  const [pilot, setPilot] = useState<PilotProfile | null>(authService.getPilot());
  const [loginOpen, setLoginOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => authService.subscribe(setPilot), []);

  const summary = status.state === 'ready' ? status.summary : status.state === 'error' ? status.summary : undefined;

  const doRefresh = async () => {
    setRefreshing(true);
    await walletService.refresh();
    setRefreshing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 font-sans text-slate-200">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Wallet
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mt-1">
            {pilot ? pilot.characterName : 'Pilot Wallet'}
          </h1>
          {summary && (
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Updated {timeAgo(summary.updatedAt)} • EVE day resets 00:00 UTC
            </div>
          )}
        </div>
        {summary && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => walletService.resetSession()}
              className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-1.5"
              title="Start a new session counter from the current balance"
            >
              <RotateCcw className="w-3.5 h-3.5" /> New Session
            </button>
            <button
              onClick={doRefresh}
              className="px-3 py-1.5 rounded-full text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        )}
      </div>

      {/* Gated states */}
      {(status.state === 'no_pilot' || status.state === 'no_scope') && (
        <div className="rounded-3xl p-8 bg-white/[0.04] border border-white/10 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Connect your wallet</h2>
          <p className="text-sm text-slate-400 mt-2">
            {status.state === 'no_pilot'
              ? 'Sign in with EVE SSO to see your balance and how much you made today.'
              : 'Your current login doesn’t include wallet access. Sign in again with EVE SSO to grant the wallet scope.'}
          </p>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">esi-wallet.read_character_wallet.v1</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Your CCP application must also have this scope enabled at developers.eveonline.com.
          </p>
          <button
            onClick={() => setLoginOpen(true)}
            className="mt-5 px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm inline-flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" /> Sign in with EVE SSO
          </button>
        </div>
      )}

      {status.state === 'loading' && (
        <div className="py-20 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading wallet from ESI…
        </div>
      )}

      {status.state === 'error' && (
        <div className="mb-4 rounded-2xl px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {status.message}{summary ? ' — showing last cached data.' : ''}
        </div>
      )}

      {summary && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Balance" value={formatIsk(summary.balance)} icon={<Wallet className="w-4 h-4 text-emerald-400" />}
              sub={<span>{(summary.balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ISK</span>} />
            <StatCard label="Made Today" value={formatIsk(summary.today.net, { sign: true })}
              tone={summary.today.net >= 0 ? 'pos' : 'neg'}
              icon={summary.today.net >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
              sub={<span>
                <span className="text-emerald-400">+{formatIsk(summary.today.income)}</span> in •{' '}
                <span className="text-rose-400">-{formatIsk(summary.today.expense)}</span> out • vs yesterday{' '}
                <span className={summary.yesterdayNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatIsk(summary.yesterdayNet, { sign: true })}</span>
              </span>} />
            <StatCard label="This Session" value={formatIsk(summary.sessionGain, { sign: true })}
              tone={(summary.sessionGain ?? 0) >= 0 ? 'pos' : 'neg'}
              icon={<Timer className="w-4 h-4 text-sky-400" />}
              sub={summary.sessionStartedAt ? <span>Since {new Date(summary.sessionStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {timeAgo(summary.sessionStartedAt)}</span> : undefined} />
            <StatCard label="Last 7 Days" value={formatIsk(summary.week.net, { sign: true })}
              tone={summary.week.net >= 0 ? 'pos' : 'neg'}
              icon={<CalendarDays className="w-4 h-4 text-violet-400" />}
              sub={<span>Avg {formatIsk(summary.week.net / 7, { sign: true })} / day</span>} />
          </div>

          {/* Chart + breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="lg:col-span-2 rounded-3xl p-5 bg-white/[0.04] border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Today by hour <span className="text-slate-500 font-normal">(EVE time)</span></h3>
                <span className="text-[11px] text-slate-500">{summary.today.count} transactions</span>
              </div>
              <HourlyChart data={summary.hourlyToday} />
            </div>
            <div className="rounded-3xl p-5 bg-white/[0.04] border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-4">Where it came from</h3>
              <Breakdown summary={summary} />
            </div>
          </div>

          {/* Recent journal */}
          <div className="rounded-3xl mt-4 bg-white/[0.04] border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Recent transactions</h3>
              <span className="text-[11px] text-slate-500">Wallet journal</span>
            </div>
            <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
              {summary.recent.length === 0 && (
                <div className="px-5 py-8 text-center text-xs text-slate-500">No journal entries.</div>
              )}
              {summary.recent.map(e => {
                const amt = e.amount || 0;
                const cat = categorize(e.ref_type);
                return (
                  <div key={e.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${amt >= 0 ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                        {amt >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">{prettyRefType(e.ref_type)}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          <span style={{ color: CATEGORY_COLORS[cat] }}>{cat}</span> • {e.description || e.reason || ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-semibold ${amt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatIsk(amt, { sign: true })}</div>
                      <div className="text-[10px] text-slate-500">{new Date(e.date).toISOString().slice(5, 16).replace('T', ' ')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <PilotLoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={() => walletService.refresh()} />
    </div>
  );
};
