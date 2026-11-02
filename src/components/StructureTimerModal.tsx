import React, { useState, useEffect } from 'react';
import { Clock, Shield, Building2, X, Check, Globe, Lock, Users, AlertTriangle } from 'lucide-react';
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
  'Ansiblex',
  'Customs Office (POCO)',
  'Starbase (POS)',
  'Other'
] as const;

const TIMER_TYPES = ['Shield', 'Armor', 'Hull', 'Anchoring', 'Unanchoring'] as const;

export const StructureTimerModal: React.FC<StructureTimerModalProps> = ({
  isOpen,
  defaultSystem = 'Jita',
  availableSystems = [],
  onClose,
  onCreated
}) => {
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>(defaultSystem);
  const [privacy, setPrivacy] = useState<'Private' | 'Corporation' | 'Alliance' | 'Public'>('Corporation');
  const [structureType, setStructureType] = useState<StructureTimer['structureType']>('Astrahus');
  const [timerType, setTimerType] = useState<StructureTimer['timerType']>('Armor');
  const [days, setDays] = useState<number>(1);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [owner, setOwner] = useState<string>('');

  useEffect(() => {
    setLocation(defaultSystem);
  }, [defaultSystem, isOpen]);

  if (!isOpen) return null;

  // Calculate target vulnerable EVE Time
  const now = new Date();
  const targetMs = now.getTime() + (days * 24 * 3600 + hours * 3600 + minutes * 60) * 1000;
  const targetDate = new Date(targetMs);
  const targetEveString = targetDate.toISOString().replace('T', ' ').slice(0, 16) + ' EVE';

  const handleCreate = () => {
    const cleanName = name.trim() || `${structureType} (${location})`;
    const cleanSys = location.trim() || defaultSystem;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="relative w-full max-w-xl bg-[#1e1f22] border border-[#3b3e45] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden text-gray-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2e3136] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-wide">
            Create Structure Timer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Row 1: Name & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="e.g. Primary Astrahus"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#2b2d31] border border-[#3f4248] focus:border-cyan-500 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Location
              </label>
              <input
                type="text"
                list="location-systems"
                value={location}
                onChange={(e) => setLocation(e.target.value.toUpperCase())}
                placeholder="Solar System"
                className="w-full bg-[#2b2d31] border border-[#3f4248] focus:border-cyan-500 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-bold font-mono"
              />
              <datalist id="location-systems">
                {availableSystems.map(sys => (
                  <option key={sys} value={sys} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 2: Security, Structure, Timer */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Security
              </label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as any)}
                className="w-full bg-[#2b2d31] border border-[#3f4248] focus:border-cyan-500 rounded px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Private">Private</option>
                <option value="Corporation">Corporation</option>
                <option value="Alliance">Alliance</option>
                <option value="Public">Public</option>
              </select>
              <span className="text-[10px] text-gray-500 mt-1 block">Select a privacy setting</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Structure
              </label>
              <select
                value={structureType}
                onChange={(e) => setStructureType(e.target.value as any)}
                className="w-full bg-[#2b2d31] border border-[#3f4248] focus:border-cyan-500 rounded px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                {STRUCTURE_TYPES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <span className="text-[10px] text-gray-500 mt-1 block">Select a structure type</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Timer
              </label>
              <select
                value={timerType}
                onChange={(e) => setTimerType(e.target.value as any)}
                className="w-full bg-[#2b2d31] border border-[#3f4248] focus:border-cyan-500 rounded px-2.5 py-2 text-xs text-white focus:outline-none font-bold"
              >
                {TIMER_TYPES.map(tt => (
                  <option key={tt} value={tt}>{tt}</option>
                ))}
              </select>
              <span className="text-[10px] text-gray-500 mt-1 block">Select a timer type</span>
            </div>
          </div>

          {/* Time Until Vulnerable */}
          <div className="pt-2">
            <label className="block text-center text-xs font-bold text-gray-300 mb-2">
              Time Until Vulnerable
            </label>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#2b2d31] border border-[#3f4248] focus:border-cyan-500 rounded px-3 py-2 text-center text-sm font-bold text-white focus:outline-none pr-14"
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
                  className="w-full bg-[#2b2d31] border border-[#3f4248] focus:border-cyan-500 rounded px-3 py-2 text-center text-sm font-bold text-white focus:outline-none pr-14"
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
                  className="w-full bg-[#2b2d31] border border-[#3f4248] focus:border-cyan-500 rounded px-3 py-2 text-center text-sm font-bold text-white focus:outline-none pr-14"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-gray-400 pointer-events-none">
                  Minutes
                </span>
              </div>
            </div>

            {/* Vulnerability Preview */}
            <div className="text-center mt-2.5 text-[11px] text-cyan-400 font-mono">
              Reinforced until: <span className="font-bold underline">{targetEveString}</span>
            </div>
          </div>

          {/* Owner Corporation or Alliance Search */}
          <div>
            <input
              type="text"
              placeholder="Search for owner Corporation or Alliance..."
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full bg-[#2b2d31] border border-[#3f4248] focus:border-cyan-500 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2e3136] flex items-center justify-end gap-3 bg-[#1a1b1e]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs tracking-wider transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            CREATE
          </button>
        </div>

      </div>
    </div>
  );
};
