import React, { useState, useEffect } from 'react';
import { 
  Package, DollarSign, AlertCircle, CheckCircle, Clock, Copy, ExternalLink, 
  Trash2, Send, ShieldCheck, RefreshCw, Layers, Sparkles, Filter, ChevronRight, FileText, Check, AlertTriangle
} from 'lucide-react';
import { evaluateAppraisal, AppraisalResult, ParsedInventoryItem } from '../services/buybackService';
import { authService, PilotProfile } from '../services/authService';

export interface BuybackTicket {
  id: string;
  pilotName: string;
  systemName: string;
  stationOrStructure: string;
  submittedAt: string;
  status: 'pending' | 'accepted' | 'paid' | 'rejected';
  items: ParsedInventoryItem[];
  totalJitaValue: number;
  totalBuybackValue: number;
  discountPercent: number;
  totalVolumeM3: number;
  contractNote?: string;
  managerNotes?: string;
}

const SAMPLE_INVENTORY = `Compressed Veldspar\t50000\tCompressed Ore\tOre\t0.001 m3
Compressed Scordite\t25000\tCompressed Ore\tOre\t0.0015 m3
Fullerite-C320\t2500\tGas\tGas\t5 m3
Fullerite-C72\t4000\tGas\tGas\t2 m3
Compressed Gneiss\t1500\tCompressed Ore\tOre\t0.05 m3
Tritanium\t250000\tMineral\tMineral\t0.01 m3`;

export const BuybackProgramView: React.FC = () => {
  const [currentPilot, setCurrentPilot] = useState<PilotProfile | null>(() => authService.getPilot());
  const [inventoryText, setInventoryText] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [appraisal, setAppraisal] = useState<AppraisalResult | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(10); // Standard -10% of Jita
  const [dropoffSystem, setDropoffSystem] = useState<string>('J121452');
  const [dropoffStructure, setDropoffStructure] = useState<string>('Caldari Control Tower / Astrahus');
  const [tickets, setTickets] = useState<BuybackTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'tickets'>('calculator');
  const [copiedContract, setCopiedContract] = useState<boolean>(false);
  const [submitSuccessNotice, setSubmitSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    return authService.subscribe(setCurrentPilot);
  }, []);

  // Fetch submitted buyback tickets
  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch('/api/buyback/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.warn('Failed to fetch buyback tickets:', e);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  // Run appraisal when text changes (or when Evaluate is clicked)
  const handleAppraise = async (textToEvaluate: string = inventoryText) => {
    if (!textToEvaluate.trim()) {
      setAppraisal(null);
      return;
    }
    setIsEvaluating(true);
    try {
      const res = await evaluateAppraisal(textToEvaluate, discountPercent);
      setAppraisal(res);
    } catch (e) {
      console.error('Appraisal evaluation error:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Submit Buyback Ticket to Corp Sync Server
  const handleSubmitTicket = async () => {
    if (!appraisal || appraisal.items.length === 0) return;
    if (!appraisal.allEligible) {
      alert('Cannot submit ticket with uncompressed raw ore! Please reprocess or compress ore first.');
      return;
    }

    const payload = {
      pilotName: currentPilot?.characterName || 'Syndra en Tilavine',
      systemName: dropoffSystem,
      stationOrStructure: dropoffStructure,
      items: appraisal.items.filter(i => i.isEligible),
      totalJitaValue: appraisal.totalJitaValue,
      totalBuybackValue: appraisal.totalBuybackValue,
      discountPercent,
      totalVolumeM3: appraisal.totalVolumeM3,
      contractNote: `Synd.net Buyback -10% Jita [${appraisal.totalBuybackValue.toLocaleString()} ISK]`
    };

    try {
      const res = await fetch('/api/buyback/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitSuccessNotice(`Ticket #${data.ticket.id} submitted successfully! Issue in-game item exchange contract to Corp.`);
        fetchTickets();
        setInventoryText('');
        setAppraisal(null);
        setActiveTab('tickets');
        setTimeout(() => setSubmitSuccessNotice(null), 8000);
      }
    } catch (e) {
      console.error('Failed to submit buyback ticket:', e);
    }
  };

  // Update ticket status (e.g. Corp Director accepting or paying)
  const handleUpdateStatus = async (ticketId: string, status: BuybackTicket['status']) => {
    try {
      await fetch('/api/buyback/tickets/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status })
      });
      fetchTickets();
    } catch (e) {
      console.error('Status update error:', e);
    }
  };

  // Copy In-Game Contract Summary
  const copyContractSummary = (t?: BuybackTicket) => {
    const val = t ? t.totalBuybackValue : (appraisal?.totalBuybackValue || 0);
    const id = t ? t.id : 'DRAFT';
    const pilot = t ? t.pilotName : (currentPilot?.characterName || 'Pilot');
    const summary = `SYND.NET BUYBACK CONTRACT\nTicket ID: ${id}\nPilot: ${pilot}\nPrice: ${val.toLocaleString()} ISK\nTerms: -${discountPercent}% of Jita 4-4\nDropoff: ${dropoffSystem} (${dropoffStructure})\nCompressed Ore / Gas Verified.`;
    navigator.clipboard.writeText(summary);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#070b14] text-slate-200 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#091120] to-[#0d1627] border border-cyan-500/30 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Package className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">CORPORATION LOGISTICS</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  -10% JITA 4-4 BUYBACK
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
                Corp Buyback &amp; Inventory Appraisal
              </h1>
            </div>
          </div>

          {/* Tab Selector & Stats */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Appraisal Calculator</span>
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                activeTab === 'tickets'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Submitted Tickets</span>
              {tickets.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-400 text-black font-black">
                  {tickets.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {submitSuccessNotice && (
          <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 flex items-center justify-between shadow-xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-bold text-sm">{submitSuccessNotice}</span>
            </div>
            <button
              onClick={() => copyContractSummary()}
              className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 cursor-pointer"
            >
              Copy In-Game Contract Details
            </button>
          </div>
        )}

        {/* TAB 1: CALCULATOR & TICKET CREATION */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Inventory Paste Input & Terms */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-[#0b101d] border border-white/10 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Paste Inventory (Ctrl+C in EVE)</h2>
                  </div>
                  <button
                    onClick={() => {
                      setInventoryText(SAMPLE_INVENTORY);
                      handleAppraise(SAMPLE_INVENTORY);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                  >
                    Load Sample Ore &amp; Gas
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={12}
                    value={inventoryText}
                    onChange={(e) => {
                      setInventoryText(e.target.value);
                      handleAppraise(e.target.value);
                    }}
                    placeholder={`Paste inventory list from EVE Online client here...\n\nExample:\nCompressed Veldspar  50000\nFullerite-C320  2500\nCompressed Gneiss  1500`}
                    className="w-full p-3.5 rounded-xl bg-[#060911] border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs font-mono text-slate-100 placeholder:text-slate-600 outline-none resize-none leading-relaxed"
                  />
                  {inventoryText && (
                    <button
                      onClick={() => {
                        setInventoryText('');
                        setAppraisal(null);
                      }}
                      className="absolute top-3 right-3 p-1 rounded-lg bg-white/10 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors"
                      title="Clear input"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropoff Location Settings */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Dropoff System
                    </label>
                    <input
                      type="text"
                      value={dropoffSystem}
                      onChange={(e) => setDropoffSystem(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#060911] border border-white/10 text-white font-mono font-bold focus:border-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Structure / Hangar
                    </label>
                    <input
                      type="text"
                      value={dropoffStructure}
                      onChange={(e) => setDropoffStructure(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#060911] border border-white/10 text-white text-xs focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                {/* Buyback Policy Rule Callout */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Corp Buyback Rules</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5 leading-relaxed">
                    <li><strong className="text-white">Must be Compressed Ore or Gas/Minerals</strong>. Raw ore is rejected due to hauler m³ cargo limits.</li>
                    <li>Payout is calculated at <strong className="text-emerald-400">90% of Jita 4-4 Lowest Sell (-10%)</strong>.</li>
                    <li>Issue an in-game <strong className="text-white">Item Exchange Contract</strong> to the Corp with the calculated ISK value.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column: Appraisal Breakdown & Action Bar */}
            <div className="lg:col-span-7 space-y-4">
              {appraisal && appraisal.items.length > 0 ? (
                <div className="p-5 rounded-2xl bg-[#0b101d] border border-white/10 shadow-xl space-y-5">
                  {/* Total Value Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-[#070b14] border border-white/10">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Jita 4-4 Gross Value</span>
                      <div className="text-xl font-black text-slate-200 tabular-nums">
                        {appraisal.totalJitaValue.toLocaleString()} <span className="text-xs font-normal text-slate-400">ISK</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">100% Market Base</span>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c261e] to-[#071612] border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">Corp Payout (-10%)</span>
                      <div className="text-2xl font-black text-emerald-300 tabular-nums">
                        {appraisal.totalBuybackValue.toLocaleString()} <span className="text-xs font-normal text-emerald-400">ISK</span>
                      </div>
                      <span className="text-[10px] text-emerald-400/80 mt-0.5 block">You Receive In-Game</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#070b14] border border-white/10">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Cargo &amp; Items</span>
                      <div className="text-xl font-black text-cyan-300 tabular-nums">
                        {appraisal.totalVolumeM3.toLocaleString()} <span className="text-xs font-normal text-slate-400">m³</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {appraisal.eligibleItemCount} item types verified
                      </span>
                    </div>
                  </div>

                  {/* Warning if Raw Uncompressed Ore Detected */}
                  {!appraisal.allEligible && (
                    <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                        <strong className="block font-bold">Uncompressed Ore Detected!</strong>
                        Some items cannot be accepted raw. Compress your ore at a station/citadel before submitting.
                      </div>
                    </div>
                  )}

                  {/* Evaluated Items Table */}
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-[#060911]">
                    <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Item Breakdown ({appraisal.items.length})</span>
                      <span className="text-[11px] text-slate-400 font-mono">Live Jita 4-4 Pricing</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-white/5 text-xs font-mono">
                      {appraisal.items.map((item) => (
                        <div key={item.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs truncate">{item.name}</span>
                              {item.isCompressed && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 font-sans font-bold">
                                  COMPRESSED
                                </span>
                              )}
                              {item.isGas && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-sans font-bold">
                                  GAS
                                </span>
                              )}
                              {!item.isEligible && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 font-sans font-bold">
                                  REJECTED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Quantity: <span className="text-white font-bold">{item.quantity.toLocaleString()}</span> units • Volume: {item.volumeM3?.toLocaleString()} m³
                            </div>
                            {item.ineligibleReason && (
                              <div className="text-[10px] text-red-400 font-sans mt-0.5">{item.ineligibleReason}</div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-emerald-300 font-bold text-sm tabular-nums">
                              {item.buybackTotalValue.toLocaleString()} ISK
                            </div>
                            <div className="text-[10px] text-slate-400 tabular-nums">
                              Jita: {item.jitaUnitPrice.toLocaleString()} / ea (-10%)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission and In-Game Contract Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => copyContractSummary()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-cyan-400" />
                      <span>{copiedContract ? 'Copied Contract Info!' : 'Copy Contract Info'}</span>
                    </button>

                    <button
                      onClick={handleSubmitTicket}
                      disabled={!appraisal.allEligible || appraisal.items.length === 0}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xl transition-all ${
                        appraisal.allEligible && appraisal.items.length > 0
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-emerald-500/25 cursor-pointer'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Buyback Ticket ({appraisal.totalBuybackValue.toLocaleString()} ISK)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="p-12 rounded-2xl bg-[#0b101d] border border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-slate-500">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">No Inventory Evaluated Yet</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Copy your items from your EVE inventory (Ctrl+A ➔ Ctrl+C in View as Detail mode) and paste them on the left to calculate your instant -10% Jita buyback payout!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setInventoryText(SAMPLE_INVENTORY);
                      handleAppraise(SAMPLE_INVENTORY);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    Load Sample Compressed Ore &amp; Gas
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SUBMITTED TICKETS MANAGER */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Active Corporation Buyback Tickets</h2>
                <p className="text-xs text-slate-400">Track pending payouts, accept contracts, and mark payouts complete.</p>
              </div>
              <button
                onClick={fetchTickets}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-white/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ticketsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#0b101d] border border-white/10 text-center text-slate-400 text-xs">
                No buyback tickets submitted yet. Use the Appraisal Calculator to submit your first ticket!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tickets.map((t) => (
                  <div key={t.id} className="p-5 rounded-2xl bg-[#0b101d] border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold block">{t.id}</span>
                          <span className="font-bold text-white text-sm">{t.pilotName}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${
                          t.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' :
                          t.status === 'accepted' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' :
                          t.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                        }`}>
                          {t.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Payout (-10% Jita):</span>
                          <span className="text-emerald-300 font-bold text-sm tabular-nums">{t.totalBuybackValue.toLocaleString()} ISK</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Gross Jita Value:</span>
                          <span className="text-slate-300 tabular-nums">{t.totalJitaValue.toLocaleString()} ISK</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Total Volume:</span>
                          <span className="text-cyan-300">{t.totalVolumeM3.toLocaleString()} m³</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Dropoff Location:</span>
                          <span className="text-white font-bold">{t.systemName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{t.stationOrStructure}</div>
                      </div>

                      {/* Items Preview */}
                      <div className="p-2.5 rounded-xl bg-[#060911] border border-white/5 space-y-1 text-[11px]">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">Items Included:</span>
                        {t.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-300 truncate">
                            <span className="truncate">{item.name}</span>
                            <span className="text-slate-500 font-mono shrink-0 ml-2">x{item.quantity.toLocaleString()}</span>
                          </div>
                        ))}
                        {t.items.length > 3 && (
                          <span className="text-[10px] text-cyan-400 block pt-0.5">+{t.items.length - 3} more items...</span>
                        )}
                      </div>
                    </div>

                    {/* Ticket Action Buttons */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => copyContractSummary(t)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        title="Copy contract info"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {t.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'accepted')}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-[11px] font-bold"
                            >
                              Accept Contract
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'paid')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-[11px] font-black"
                            >
                              Mark Paid
                            </button>
                          </>
                        )}
                        {t.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'paid')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-sm"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
