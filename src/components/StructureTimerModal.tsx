import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { StructureTimer } from '../types/mapper';
import { mapperService } from '../services/mapperService';

interface StructureTimerModalProps {
  isOpen: boolean;
  defaultSystem?: string;
  availableSystems?: string[];
  onClose: () => void;
  onCreated?: (timer: StructureTimer) => void;
}

const STRUCTURE_TYPES = [
  'Astrahus',
  'Fortizar',
  'Keepstar',
  'Raitaru',
  'Azbel',
  'Sotiyo',
  'Athanor',
  'Tatara',
  'Ansiblex Jump Gate',
  'Pharolux Cyno Beacon',
  'Tenebrex Cyno Jammer',
  'Customs Office (POCO)',
  'Starbase (POS)'
] as const;

const TIMER_TYPES = ['Shield', 'Armor', 'Hull', 'Anchoring', 'Unanchoring'] as const;
const PRIVACY_TYPES = ['Private', 'Corporation', 'Alliance', 'Public'] as const;

export const StructureTimerModal: React.FC<StructureTimerModalProps> = ({
  isOpen,
  defaultSystem = 'Uemisaisen',
  availableSystems = [],
  onClose,
  onCreated
}) => {
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>(defaultSystem);
  const [privacy, setPrivacy] = useState<'Private' | 'Corporation' | 'Alliance' | 'Public'>('Private');
  const [structureType, setStructureType] = useState<StructureTimer['structureType']>('Astrahus');
  const [timerType, setTimerType] = useState<StructureTimer['timerType']>('Armor');
  const [days, setDays] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [owner, setOwner] = useState<string>('');

  useEffect(() => {
    if (defaultSystem) setLocation(defaultSystem);
  }, [defaultSystem, isOpen]);

  if (!isOpen) return null;

  // Calculate vulnerable EVE Time
  const now = new Date();
  const targetMs = now.getTime() + (days * 24 * 3600 + hours * 3600 + minutes * 60) * 1000;
  const targetDate = new Date(targetMs);
  const targetEveString = targetDate.toISOString().replace('T', ' ').slice(0, 16) + ' EVE';

  const handleCreate = () => {
    const cleanName = name.trim() || `${structureType} (${location})`;
    const cleanSys = location.trim() || defaultSystem || 'Jita';

    const newTimer: StructureTimer = {
      id: `timer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: cleanName,
      systemName: cleanSys,
      privacy,
      structureType,
      timerType,
      vulnerableTime: targetDate.toISOString(),
      owner: owner.trim() || undefined
    };

    mapperService.addStructureTimer(newTimer);
    if (onCreated) onCreated(newTimer);
    onClose();
  };

  const systemList = Array.from(new Set([location, defaultSystem, ...availableSystems])).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 font-sans select-none text-xs">
      <div className="relative w-full max-w-lg bg-[#2a2b2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden text-gray-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-black/20">
          <h2 className="text-base font-bold text-white tracking-tight">
            Create Structure Timer
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 space-y-5">
          {/* Row 1: Name & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Structure Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1e1f22] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Location
              </label>
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full appearance-none bg-[#1e1f22] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none pr-8 font-medium font-mono"
                >
                  {systemList.map(sys => (
                    <option key={sys} value={sys}>{sys}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Security, Structure, Timer */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Security
              </label>
              <div className="relative">
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="w-full appearance-none bg-[#1e1f22] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none pr-7"
                >
                  {PRIVACY_TYPES.map(pt => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Select a privacy setting</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Structure
              </label>
              <div className="relative">
                <select
                  value={structureType}
                  onChange={(e) => setStructureType(e.target.value as any)}
                  className="w-full appearance-none bg-[#1e1f22] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none pr-7"
                >
                  {STRUCTURE_TYPES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Select a structure type</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Timer
              </label>
              <div className="relative">
                <select
                  value={timerType}
                  onChange={(e) => setTimerType(e.target.value as any)}
                  className="w-full appearance-none bg-[#1e1f22] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none pr-7 font-semibold"
                >
                  {TIMER_TYPES.map(tt => (
                    <option key={tt} value={tt}>{tt}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Select a timer type</span>
            </div>
          </div>

          {/* Row 3: Time Until Vulnerable */}
          <div className="pt-2">
            <div className="text-center text-xs font-semibold text-gray-300 mb-3">
              Time Until Vulnerable
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#1e1f22] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-center font-bold text-white focus:outline-none pr-12"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-gray-400 pointer-events-none">
                  Days
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="w-full bg-[#1e1f22] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-center font-bold text-white focus:outline-none pr-12"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-gray-400 pointer-events-none">
                  Hours
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full bg-[#1e1f22] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-center font-bold text-white focus:outline-none pr-14"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-gray-400 pointer-events-none">
                  Minutes
                </span>
              </div>
            </div>

            {/* Target vulnerability hint */}
            <div className="text-center text-[11px] text-cyan-400 mt-2 font-mono">
              Vulnerable at: {targetEveString}
            </div>
          </div>

          {/* Row 4: Search for owner Corporation or Alliance */}
          <div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for owner Corporation or Alliance..."
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-[#1e1f22] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none pr-8"
              />
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-4 border-t border-black/20">
          <button
            onClick={handleCreate}
            className="text-xs font-bold text-gray-200 hover:text-white uppercase tracking-wider px-3 py-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            CREATE
          </button>
          <button
            onClick={onClose}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider px-3 py-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            CANCEL
          </button>
        </div>

      </div>
    </div>
  );
};
