import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Network, Compass, Building2, Users, Plus, Trash2, 
  Check, Share2, ZoomIn, ZoomOut, Maximize2, Crosshair, Grid, Palette,
  User, MapPin, Eye, Radio, ExternalLink, Layers, Sparkles, KeyRound, LogOut,
  Sun, Moon, ChevronDown, ChevronRight, FolderTree, GitFork, Copy, Route, Navigation, Zap,
  Clock, Hourglass, Skull, ShieldAlert, X, Cpu, BoxSelect, ArrowRight,
  Link2, ClipboardCheck, ClipboardPaste
} from 'lucide-react';
import { mapperService } from '../services/mapperService';
import { ChainMapState, WormholeNode, WormholeConnection, WormholeSignature, StructureTimer } from '../types/mapper';
import { KillmailItem } from '../types/killmail';
import { authService, PilotProfile } from '../services/authService';
import { calculateTradeHubRoutes, findShortestRoute, WH_SYSTEM_EFFECTS, TradeHubRoute } from '../services/routeService';
import { fetchLiveSystemKills } from '../services/zkillService';
import { PilotLoginModal } from './PilotLoginModal';
import { SignaturePromptModal } from './SignaturePromptModal';
import { StructureTimerModal } from './StructureTimerModal';
import { IntegratedIntelDeck } from './IntegratedIntelDeck';
import { ShipFittingsModal } from './ShipFittingsModal';
import { getWormholeSystemMetadata } from '../data/wormholeDatabase';

const getStructureInfo = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('keepstar')) return { role: 'XL Citadel', typeId: 35834, badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-600', cat: 'citadel', isUpwell: true };
  if (t.includes('fortizar')) return { role: 'Large Citadel', typeId: 35833, badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-600', cat: 'citadel', isUpwell: true };
  if (t.includes('astrahus')) return { role: 'Medium Citadel', typeId: 35832, badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-600', cat: 'citadel', isUpwell: true };
  if (t.includes('sotiyo')) return { role: 'XL Engineering', typeId: 35827, badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-600', cat: 'industry', isUpwell: true };
  if (t.includes('azbel')) return { role: 'Large EC', typeId: 35826, badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-600', cat: 'industry', isUpwell: true };
  if (t.includes('raitaru')) return { role: 'Medium EC', typeId: 35825, badgeColor: 'text-sky-400 bg-sky-950/60 border-sky-600', cat: 'industry', isUpwell: true };
  if (t.includes('tatara')) return { role: 'Large Refinery', typeId: 35836, badgeColor: 'text-orange-400 bg-orange-950/60 border-orange-600', cat: 'industry', isUpwell: true };
  if (t.includes('athanor')) return { role: 'Medium Refinery', typeId: 35835, badgeColor: 'text-yellow-400 bg-yellow-950/60 border-yellow-600', cat: 'industry', isUpwell: true };
  if (t.includes('customs office') || t.includes('poco')) return { role: 'Customs Office', typeId: 2233, badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-600', cat: 'poco', isUpwell: false };
  if (t.includes('control tower') || t.includes('starbase')) return { role: 'Starbase POS', typeId: 12235, badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-600', cat: 'poco', isUpwell: false };
  if (t.includes('ansiblex')) return { role: 'Jump Gate', typeId: 35841, badgeColor: 'text-teal-400 bg-teal-950/60 border-teal-600', cat: 'citadel', isUpwell: true };
  if (t.includes('pharolux')) return { role: 'Cyno Beacon', typeId: 35840, badgeColor: 'text-violet-400 bg-violet-950/60 border-violet-600', cat: 'citadel', isUpwell: true };
  if (t.includes('tenebrex')) return { role: 'Cyno Jammer', typeId: 37534, badgeColor: 'text-red-400 bg-red-950/60 border-red-600', cat: 'citadel', isUpwell: true };
  if (t.includes('depot') || t.includes('mobile')) return { role: 'Mobile Depot', typeId: 33474, badgeColor: 'text-slate-400 bg-slate-900 border-slate-700', cat: 'deployable', isUpwell: false };
  return { role: 'Structure', typeId: 35832, badgeColor: 'text-slate-300 bg-slate-900 border-slate-700', cat: 'citadel', isUpwell: false };
};

export const ChainMapperView: React.FC = () => {
  const [mapState, setMapState] = useState<ChainMapState>(mapperService.getState());
  const [selectedSystemId, setSelectedSystemId] = useState<string>(() => {
    const state = mapperService.getState();
    const active = Object.values(state.systems).find(s => s.activePilots && s.activePilots.length > 0);
    return active?.id || Object.keys(state.systems)[0] || 'Jita';
  });
  const [newSystemInput, setNewSystemInput] = useState<string>('');
  const [whTypeInput, setWhTypeInput] = useState<string>('K162');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showInspector, setShowInspector] = useState<boolean>(true);
  const [isFittingModalOpen, setIsFittingModalOpen] = useState<boolean>(false);

  // In-Depth Structures Dossier State
  const [structureFilter, setStructureFilter] = useState<'all' | 'citadel' | 'industry' | 'poco' | 'deployable'>('all');
  const [isAddingStructure, setIsAddingStructure] = useState<boolean>(false);
  const [newStructName, setNewStructName] = useState<string>('');
  const [newStructType, setNewStructType] = useState<string>('Astrahus');
  const [newStructDistance, setNewStructDistance] = useState<string>('1.0 AU');
  const [copiedStructId, setCopiedStructId] = useState<string | null>(null);
  const [timerModalPrefill, setTimerModalPrefill] = useState<{ name: string; type: StructureTimer['structureType'] } | null>(null);
  
  // Canvas Pan & Zoom State
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 20 });
  const [zoom, setZoom] = useState<number>(0.85);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeOffset, setNodeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Multi-Selection & Mass Manipulation State
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set());
  const [boxSelectMode, setBoxSelectMode] = useState<boolean>(false);
  const [boxSelectRect, setBoxSelectRect] = useState<{ startX: number; startY: number; currX: number; currY: number } | null>(null);

  // Interactive Linking Mode (Click Node A -> Click Node B to connect)
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null);
  const [quickConnectTarget, setQuickConnectTarget] = useState<string>('');
  const [quickConnectType, setQuickConnectType] = useState<string>('Wormhole');

  // Wireless Clipboard State & Quick Paste Drawer
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [manualPasteText, setManualPasteText] = useState<string>('');
  const [lastClipboardNotice, setLastClipboardNotice] = useState<{
    text: string;
    systemName?: string;
    sigCount?: number;
    dscanCount?: number;
    timestamp: number;
  } | null>(null);
  const dragInitialPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const dragStartMouseRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const hasDraggedRef = useRef<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const [currentPilot, setCurrentPilot] = useState<PilotProfile | null>(authService.getPilot());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Theme state: dark (tactical night) vs light (clean daylight mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('synd_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('synd_theme', next);
  };

  const isDark = theme === 'dark';

  // Canvas Background Presets (Deep Space Void, Infinite Tactical Grid, Void Grid, Blueprint)
  const [bgTheme, setBgTheme] = useState<'classic_void' | 'tactical_grey_grid' | 'void_grid' | 'blueprint_light'>(() => {
    return (localStorage.getItem('synd_bg_theme') as any) || 'classic_void';
  });
  const [showBgMenu, setShowBgMenu] = useState<boolean>(false);

  const selectBgTheme = (themeName: 'classic_void' | 'tactical_grey_grid' | 'void_grid' | 'blueprint_light') => {
    setBgTheme(themeName);
    localStorage.setItem('synd_bg_theme', themeName);
    setShowBgMenu(false);
  };

  // Computes truly infinite CSS background for any pan & zoom position
  const getCanvasBackground = () => {
    const cellSize = Math.round(40 * zoom);
    const majorSize = Math.round(200 * zoom);
    const px = Math.round(pan.x % cellSize);
    const py = Math.round(pan.y % cellSize);
    const mpx = Math.round(pan.x % majorSize);
    const mpy = Math.round(pan.y % majorSize);

    if (bgTheme === 'classic_void') {
      // The original beloved deep space void with nebula and stars
      return {
        backgroundColor: '#050813',
        backgroundImage: `
          radial-gradient(ellipse 70% 45% at 90% 15%, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.05) 45%, transparent 75%),
          radial-gradient(ellipse 60% 40% at 10% 85%, rgba(168, 85, 247, 0.10) 0%, transparent 60%),
          radial-gradient(1.5px 1.5px at 30px 40px, rgba(255,255,255,0.25), transparent),
          radial-gradient(1px 1px at 80px 120px, rgba(56,189,248,0.20), transparent),
          radial-gradient(1.5px 1.5px at 180px 70px, rgba(168,85,247,0.20), transparent)
        `,
        backgroundSize: '100% 100%, 100% 100%, 260px 260px, 260px 260px, 260px 260px',
        backgroundPosition: 'center, center, 0 0, 0 0, 0 0'
      };
    }

    if (bgTheme === 'tactical_grey_grid') {
      // Truly infinite tactical slate grey grid
      return {
        backgroundColor: '#121620',
        backgroundImage: `
          linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
          linear-gradient(to right, rgba(56, 189, 248, 0.18) 1.5px, transparent 1.5px),
          linear-gradient(to bottom, rgba(56, 189, 248, 0.18) 1.5px, transparent 1.5px),
          radial-gradient(ellipse 75% 50% at 85% 15%, rgba(56, 189, 248, 0.08) 0%, transparent 70%),
          radial-gradient(ellipse 65% 45% at 15% 85%, rgba(168, 85, 247, 0.06) 0%, transparent 60%)
        `,
        backgroundSize: `
          ${cellSize}px ${cellSize}px,
          ${cellSize}px ${cellSize}px,
          ${majorSize}px ${majorSize}px,
          ${majorSize}px ${majorSize}px,
          100% 100%,
          100% 100%
        `,
        backgroundPosition: `
          ${px}px ${py}px,
          ${px}px ${py}px,
          ${mpx}px ${mpy}px,
          ${mpx}px ${mpy}px,
          center,
          center
        `
      };
    }

    if (bgTheme === 'void_grid') {
      // The original nebula + stars combined with the infinite square grid
      return {
        backgroundColor: '#050813',
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
          linear-gradient(to right, rgba(56, 189, 248, 0.16) 1.5px, transparent 1.5px),
          linear-gradient(to bottom, rgba(56, 189, 248, 0.16) 1.5px, transparent 1.5px),
          radial-gradient(ellipse 70% 45% at 90% 15%, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.05) 45%, transparent 75%),
          radial-gradient(ellipse 60% 40% at 10% 85%, rgba(168, 85, 247, 0.10) 0%, transparent 60%),
          radial-gradient(1.5px 1.5px at 30px 40px, rgba(255,255,255,0.25), transparent),
          radial-gradient(1px 1px at 80px 120px, rgba(56,189,248,0.20), transparent)
        `,
        backgroundSize: `
          ${cellSize}px ${cellSize}px,
          ${cellSize}px ${cellSize}px,
          ${majorSize}px ${majorSize}px,
          ${majorSize}px ${majorSize}px,
          100% 100%,
          100% 100%,
          260px 260px,
          260px 260px
        `,
        backgroundPosition: `
          ${px}px ${py}px,
          ${px}px ${py}px,
          ${mpx}px ${mpy}px,
          ${mpx}px ${mpy}px,
          center,
          center,
          0 0,
          0 0
        `
      };
    }

    // Daylight blueprint mode
    return {
      backgroundColor: '#f8fafc',
      backgroundImage: `
        linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px),
        linear-gradient(to right, rgba(14, 165, 233, 0.25) 1.5px, transparent 1.5px),
        linear-gradient(to bottom, rgba(14, 165, 233, 0.25) 1.5px, transparent 1.5px)
      `,
      backgroundSize: `${cellSize}px ${cellSize}px, ${cellSize}px ${cellSize}px, ${majorSize}px ${majorSize}px, ${majorSize}px ${majorSize}px`,
      backgroundPosition: `${px}px ${py}px, ${px}px ${py}px, ${mpx}px ${mpy}px, ${mpx}px ${mpy}px`
    };
  };

  // Connection signature & status edit modal
  const [selectedConnection, setSelectedConnection] = useState<WormholeConnection | null>(null);
  const [isConnModalOpen, setIsConnModalOpen] = useState<boolean>(false);

  // Structure Timer Modal & List State
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [systemThreatMap, setSystemThreatMap] = useState<Record<string, { kills24h: number; threat: string }>>({});
  const [selectedSystemKills, setSelectedSystemKills] = useState<KillmailItem[]>([]);
  const [selectedSystemKillsLoading, setSelectedSystemKillsLoading] = useState<boolean>(false);
  const [floatingTab, setFloatingTab] = useState<'hubs' | 'timers' | 'zkill'>('zkill');

  // GalaxyFinder Follow-Me Mode
  const [followMe, setFollowMe] = useState<boolean>(true);

  // Live Jump HUD Notification
  const [lastJumpAlert, setLastJumpAlert] = useState<{
    systemName: string;
    fromSystem?: string;
    pilotName?: string;
    shipName?: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (!lastJumpAlert) return;
    const t = setTimeout(() => setLastJumpAlert(null), 8000);
    return () => clearTimeout(t);
  }, [lastJumpAlert]);

  // Wireless Clipboard Listener & Parser for Live Scanning
  useEffect(() => {
    let unsubClip: (() => void) | null = null;
    import('../services/scoutWatcher').then(({ scoutWatcher }) => {
      scoutWatcher.startClipboardPolling();
      unsubClip = scoutWatcher.onClipboardText((rawText) => {
        const clean = rawText.trim();
        if (clean.length < 3) return;

        // Check for signatures
        const isSigs = clean.includes('\t') && /[A-Z]{3}-\d{3}/.test(clean);
        // Check for D-Scan
        const isDscan = clean.includes('\t') && (clean.includes('km') || clean.includes('AU') || clean.includes('m'));
        // Check for J-System
        const jMatch = clean.match(/\b(J\d{6})\b/i);
        // Check for known system name
        const known = Object.keys(mapState.systems).find(s => s.toLowerCase() === clean.toLowerCase());
        const systemName = jMatch ? jMatch[1].toUpperCase() : (known || (/^[A-Z][a-z0-9\- ]{2,18}$/.test(clean) && !clean.includes('\t') && !clean.includes('\n') ? clean : undefined));

        setLastClipboardNotice({
          text: clean.slice(0, 80),
          systemName,
          sigCount: isSigs ? clean.split('\n').filter(l => /[A-Z]{3}-\d{3}/.test(l)).length : undefined,
          dscanCount: isDscan ? clean.split('\n').filter(l => l.includes('\t')).length : undefined,
          timestamp: Date.now()
        });
      });
    });

    return () => {
      if (unsubClip) unsubClip();
    };
  }, [mapState.systems]);

  // Auto-dismiss clipboard notification after 10s
  useEffect(() => {
    if (!lastClipboardNotice) return;
    const t = setTimeout(() => setLastClipboardNotice(null), 10000);
    return () => clearTimeout(t);
  }, [lastClipboardNotice]);

  // Calculate hidden / collapsed descendant nodes
  const hiddenNodeIds = useMemo(() => {
    const hidden = new Set<string>();

    function hideChildren(parentId: string) {
      mapState.connections.forEach(conn => {
        if (conn.from === parentId && conn.to !== parentId) {
          if (!hidden.has(conn.to)) {
            hidden.add(conn.to);
            hideChildren(conn.to);
          }
        }
      });
    }

    Object.values(mapState.systems).forEach(node => {
      if (node.isCollapsed) {
        hideChildren(node.id);
      }
    });

    return hidden;
  }, [mapState.systems, mapState.connections]);

  useEffect(() => {
    const unsubAuth = authService.subscribe((pilot) => {
      setCurrentPilot(pilot);
      if (pilot) {
        authService.startLocationTracking();
      }
    });

    const unsubLoc = authService.onLocationUpdate(({ systemName, shipName }) => {
      const pilot = authService.getPilot();
      if (pilot && systemName) {
        mapperService.setPilotLocation(pilot.characterName, systemName, shipName);
        setSelectedSystemId(systemName);
        setLastJumpAlert({
          systemName,
          pilotName: pilot.characterName,
          shipName: shipName || pilot.activeShip,
          timestamp: Date.now()
        });
        if (followMe) {
          centerOnSystem(systemName);
        }
      }
    });

    const unsubMap = mapperService.subscribe((state) => {
      setMapState({ ...state });
    });

    return () => {
      unsubAuth();
      unsubLoc();
      unsubMap();
    };
  }, [followMe]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const selectedSystem: WormholeNode | undefined = 
    mapState.systems[selectedSystemId] || Object.values(mapState.systems)[0];

  // Active player system
  const activeSystem = Object.values(mapState.systems).find(s => 
    s.activePilots && currentPilot && s.activePilots.some(p => p.toLowerCase().includes(currentPilot.characterName.toLowerCase()))
  ) || Object.values(mapState.systems).find(s => s.activePilots && s.activePilots.length > 0) || selectedSystem || Object.values(mapState.systems)[0];

  // Extract all active pilots across the chain
  const allActivePilots = Object.entries(mapState.systems).flatMap(([sysName, s]) => 
    (s.activePilots || []).map(p => ({ pilotName: p, systemName: sysName }))
  );

  // GalaxyFinder Center on System
  const centerOnSystem = (sysId: string) => {
    const target = mapState.systems[sysId];
    if (target && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(rect.width, 300);
      const h = Math.max(rect.height, 250);
      const tx = target.x !== undefined ? target.x : 578;
      const ty = target.y !== undefined ? target.y : 160;
      const targetCenterX = tx + NODE_W / 2;
      const targetCenterY = ty + NODE_H / 2;
      setPan({
        x: Math.round(w / 2 - targetCenterX * zoom),
        y: Math.round(h / 2 - targetCenterY * zoom)
      });
    } else {
      handleFit();
    }
  };

  // Live GalaxyFinder Follow-Me auto-tracking
  useEffect(() => {
    const unsubJump = mapperService.onJump((jump) => {
      setSelectedSystemId(jump.systemName);
      setLastJumpAlert({
        systemName: jump.systemName,
        fromSystem: jump.fromSystem,
        pilotName: jump.pilot,
        timestamp: Date.now()
      });
      if (followMe) {
        setTimeout(() => {
          centerOnSystem(jump.systemName);
        }, 120);
      }
    });
    return () => unsubJump();
  }, [followMe, zoom, mapState.systems]);

  const prevActiveSysId = useRef<string | null>(null);
  useEffect(() => {
    if (activeSystem && activeSystem.id !== prevActiveSysId.current) {
      prevActiveSysId.current = activeSystem.id;
      setSelectedSystemId(activeSystem.id);
      if (followMe) {
        setTimeout(() => {
          centerOnSystem(activeSystem.id);
        }, 100);
      }
    }
  }, [activeSystem?.id, followMe]);

  // Route to Jita from active pilot location
  const jitaRoute = useMemo(() => {
    const fromSys = activeSystem?.id || selectedSystem?.id || 'J103955';
    return findShortestRoute(mapState.connections, fromSys, 'Jita');
  }, [mapState.connections, activeSystem?.id, selectedSystem?.id]);

  // Trade hub routes from currently selected system
  const tradeHubRoutes = useMemo(() => {
    const sysId = selectedSystem?.id || 'J103955';
    return calculateTradeHubRoutes(mapState.connections, sysId);
  }, [mapState.connections, selectedSystem?.id]);

  // Helper to format remaining timer time
  const formatTimeRemaining = (isoDateString: string): { text: string; isPast: boolean; isUrgent: boolean } => {
    const target = new Date(isoDateString).getTime();
    const diff = target - Date.now();
    if (diff <= 0) return { text: 'VULNERABLE NOW', isPast: true, isUrgent: true };

    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);

    let text = '';
    if (days > 0) text += `${days}d `;
    text += `${hours}h ${minutes}m`;

    const isUrgent = diff < 2 * 3600 * 1000; // < 2 hours
    return { text, isPast: false, isUrgent };
  };

  // Fetch zKill threat metrics and detailed kills for selected system
  useEffect(() => {
    if (!selectedSystem?.name) return;
    let isMounted = true;
    setSelectedSystemKillsLoading(true);

    fetchLiveSystemKills(selectedSystem.name, 12).then(res => {
      if (isMounted) {
        setSelectedSystemKills(res.kills);
        setSelectedSystemKillsLoading(false);
        setSystemThreatMap(prev => ({
          ...prev,
          [selectedSystem.name]: { kills24h: res.totalKills24h, threat: res.threatLevel }
        }));
      }
    }).catch(() => {
      if (isMounted) setSelectedSystemKillsLoading(false);
    });

    const otherSystems = Array.from(new Set([
      activeSystem?.name,
      'Jita',
      'Uemisaisen',
      'J103955'
    ])).filter(s => s && s !== selectedSystem.name) as string[];

    otherSystems.forEach(sys => {
      fetchLiveSystemKills(sys, 5).then(res => {
        if (isMounted) {
          setSystemThreatMap(prev => ({
            ...prev,
            [sys]: { kills24h: res.totalKills24h, threat: res.threatLevel }
          }));
        }
      }).catch(() => {});
    });

    return () => { isMounted = false; };
  }, [selectedSystem?.name, activeSystem?.name]);

  // Global Keyboard Shortcuts (Escape to clear selection, Delete/Backspace for batch deletion)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'Escape') {
        if (multiSelectedIds.size > 0) {
          setMultiSelectedIds(new Set());
        }
        if (boxSelectMode) {
          setBoxSelectMode(false);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (multiSelectedIds.size > 0) {
          if (window.confirm(`Mass delete ${multiSelectedIds.size} selected systems and all their connections?`)) {
            mapperService.deleteSystemsBatch(Array.from(multiSelectedIds));
            setMultiSelectedIds(new Set());
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [multiSelectedIds, boxSelectMode]);

  // Pan canvas handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only proceed if clicking canvas background (not a node or control button)
    if ((e.target as HTMLElement).closest('.canvas-node') || (e.target as HTMLElement).closest('.canvas-control')) {
      return;
    }

    // If Box Select mode is toggled OR Shift key is held while clicking canvas, start Box Selection
    if (boxSelectMode || e.shiftKey) {
      const canvasX = (e.clientX - pan.x) / zoom;
      const canvasY = (e.clientY - pan.y) / zoom;
      setBoxSelectRect({
        startX: canvasX,
        startY: canvasY,
        currX: canvasX,
        currY: canvasY
      });
      if (!e.shiftKey) {
        setMultiSelectedIds(new Set());
      }
      return;
    }

    // Clicking plain background clears selection
    if (multiSelectedIds.size > 0) {
      setMultiSelectedIds(new Set());
    }

    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (boxSelectRect) {
      const canvasX = (e.clientX - pan.x) / zoom;
      const canvasY = (e.clientY - pan.y) / zoom;
      setBoxSelectRect(prev => prev ? { ...prev, currX: canvasX, currY: canvasY } : null);

      const left = Math.min(boxSelectRect.startX, canvasX);
      const right = Math.max(boxSelectRect.startX, canvasX);
      const top = Math.min(boxSelectRect.startY, canvasY);
      const bottom = Math.max(boxSelectRect.startY, canvasY);

      const selected = new Set<string>();
      Object.values(mapState.systems).forEach(node => {
        if (hiddenNodeIds.has(node.id)) return;
        const nx = node.x || 0;
        const ny = node.y || 0;
        if (nx + NODE_W >= left && nx <= right && ny + NODE_H >= top && ny <= bottom) {
          selected.add(node.id);
        }
      });
      setMultiSelectedIds(selected);
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingNodeId) {
      const deltaX = (e.clientX - dragStartMouseRef.current.clientX) / zoom;
      const deltaY = (e.clientY - dragStartMouseRef.current.clientY) / zoom;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        hasDraggedRef.current = true;
      }

      const initialMap = dragInitialPositionsRef.current;
      const nodeIds = Object.keys(initialMap);
      nodeIds.forEach(id => {
        const initial = initialMap[id];
        const sys = mapState.systems[id];
        if (initial && sys) {
          sys.x = Math.round(initial.x + deltaX);
          sys.y = Math.round(initial.y + deltaY);
        }
      });
      setMapState({ ...mapState });
    }
  };

  const handleMouseUp = () => {
    if (boxSelectRect) {
      setBoxSelectRect(null);
    }
    setIsPanning(false);

    if (draggingNodeId) {
      if (hasDraggedRef.current) {
        const initialMap = dragInitialPositionsRef.current;
        const updated: Record<string, { x: number; y: number }> = {};
        Object.keys(initialMap).forEach(id => {
          const sys = mapState.systems[id];
          if (sys) {
            updated[id] = { x: sys.x || 0, y: sys.y || 0 };
          }
        });
        if (Object.keys(updated).length > 0) {
          mapperService.saveSystemPositions(updated);
        }
      }
      setDraggingNodeId(null);
    }
  };

  // Global window listener so mouse releases outside the canvas release panning & dragging cleanly
  useEffect(() => {
    const onGlobalMouseUp = () => {
      if (isPanning || draggingNodeId || boxSelectRect) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, [isPanning, draggingNodeId, boxSelectRect]);

  // Node Drag Start (supports single drag & multi-selection drag)
  const handleNodeDragStart = (e: React.MouseEvent, node: WormholeNode) => {
    e.stopPropagation();

    // If Linking Mode is active, clicking this node completes the link!
    if (linkingFromId) {
      if (linkingFromId !== node.id) {
        mapperService.addWormholeConnection(linkingFromId, node.id);
        setSelectedSystemId(node.id);
      }
      setLinkingFromId(null);
      return;
    }

    // If Shift or Ctrl is pressed: toggle selection without starting pan/drag
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      setMultiSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
      setSelectedSystemId(node.id);
      return;
    }

    // Determine target nodes for dragging
    let dragTargets: string[] = [node.id];
    if (multiSelectedIds.has(node.id)) {
      dragTargets = Array.from(multiSelectedIds);
    } else {
      setMultiSelectedIds(new Set([node.id]));
      dragTargets = [node.id];
    }

    setSelectedSystemId(node.id);
    setDraggingNodeId(node.id);
    hasDraggedRef.current = false;
    dragStartMouseRef.current = { clientX: e.clientX, clientY: e.clientY };

    // Record initial coordinates for all dragged nodes
    const initialPos: Record<string, { x: number; y: number }> = {};
    dragTargets.forEach(id => {
      const s = mapState.systems[id];
      if (s) {
        initialPos[id] = { x: s.x || 0, y: s.y || 0 };
      }
    });
    dragInitialPositionsRef.current = initialPos;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    // If scrolling over controls, buttons, drawers, or dialogs, do NOT zoom the map
    const target = e.target as HTMLElement;
    if (target.closest('.canvas-control') || target.closest('aside') || target.closest('button') || target.closest('input') || target.closest('textarea')) {
      return;
    }
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.35), 2.5));
  };

  // Zoom & Pan Auto-Fit
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.15, 2.2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.4));
  
  const handleFit = () => {
    const nodes = Object.values(mapState.systems).filter(n => !hiddenNodeIds.has(n.id));
    if (nodes.length === 0) return;

    const minX = Math.min(...nodes.map(n => n.x || 0));
    const maxX = Math.max(...nodes.map(n => (n.x || 0) + NODE_W));
    const minY = Math.min(...nodes.map(n => n.y || 0));
    const maxY = Math.max(...nodes.map(n => (n.y || 0) + NODE_H));

    const contentW = Math.max(maxX - minX + 160, 400);
    const contentH = Math.max(maxY - minY + 140, 300);

    const availableW = containerRef.current?.clientWidth || (window.innerWidth - (showInspector ? 384 : 0));
    const availableH = containerRef.current?.clientHeight || (window.innerHeight - 150);

    const fitZoom = Math.min(Math.max(Math.min(availableW / contentW, availableH / contentH), 0.45), 1.0);
    const fitPanX = availableW / 2 - ((minX + maxX) / 2) * fitZoom;
    const fitPanY = Math.max(20, availableH / 2 - ((minY + maxY) / 2) * fitZoom);

    setZoom(fitZoom);
    setPan({ x: Math.round(fitPanX), y: Math.round(fitPanY) });
  };

  // Run dynamic fit on first render and window resize
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFit();
    }, 150);
    const handleResize = () => handleFit();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [mapState.systems, hiddenNodeIds]);

  const handleCenterOnPilot = () => {
    if (activeSystem) {
      centerOnSystem(activeSystem.id);
    } else {
      handleFit();
    }
  };

  const handleAddConnection = async () => {
    if (!newSystemInput.trim()) return;
    const cleanTo = newSystemInput.trim().toUpperCase();
    const fromSys = selectedSystem?.id || 'J103955';
    await mapperService.addWormholeConnection(
      fromSys,
      cleanTo,
      whTypeInput.trim()
    );
    setSelectedSystemId(cleanTo);
    setNewSystemInput('');

    // Immediately prompt for signature!
    setSelectedConnection({
      id: `conn-${fromSys}-${cleanTo}`,
      from: fromSys,
      to: cleanTo,
      wormholeType: whTypeInput.trim() || 'Wormhole',
      massStatus: 'stable',
      timeStatus: 'stable'
    });
    setIsConnModalOpen(true);
  };

  const handleCopyBuddyLink = async () => {
    const url = window.location.origin;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Node dimensions (ample space for Statics C2 C3, EOL badges & WH Effects)
  const NODE_W = 158;
  const NODE_H = 70;

  // GalaxyFinder System Class Color Mapping
  // C1 (Sky Blue), C2 (Royal Blue), C3 (Lime Green), C4 (Amber), C5 (Magenta/Fuchsia), C6 (Crimson)
  // Highsec (Green), Lowsec (Orange), Nullsec (Red)
  const CLASS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
    'Highsec': { color: '#22c55e', label: 'Highsec', bg: 'rgba(34, 197, 94, 0.12)' },
    'Lowsec': { color: '#f97316', label: 'Lowsec', bg: 'rgba(249, 115, 22, 0.12)' },
    'Nullsec': { color: '#ef4444', label: 'Nullsec', bg: 'rgba(239, 68, 68, 0.12)' },
    'C1': { color: '#38bdf8', label: 'C1', bg: 'rgba(56, 189, 248, 0.12)' },      // Sky Blue
    'C2': { color: '#818cf8', label: 'C2', bg: 'rgba(129, 140, 248, 0.12)' },    // Indigo / Royal Blue
    'C3': { color: '#a3e635', label: 'C3', bg: 'rgba(163, 230, 53, 0.12)' },     // Lime Green (GalaxyFinder)
    'C4': { color: '#f59e0b', label: 'C4', bg: 'rgba(245, 158, 11, 0.12)' },     // Amber / Warm Gold
    'C5': { color: '#d946ef', label: 'C5', bg: 'rgba(217, 70, 239, 0.12)' },     // Vivid Magenta / Fuchsia
    'C6': { color: '#f43f5e', label: 'C6', bg: 'rgba(244, 63, 94, 0.12)' },     // Crimson / Rose
    'Thera': { color: '#14b8a6', label: 'Thera', bg: 'rgba(20, 184, 166, 0.12)' },
    'Pochven': { color: '#dc2626', label: 'Pochven', bg: 'rgba(220, 38, 38, 0.12)' }
  };

  const getSystemClassColor = (sysClass: string): string => {
    return CLASS_CONFIG[sysClass]?.color || '#38bdf8';
  };

  // Format header security / class badge
  const renderSecurityOrClass = (node: WormholeNode) => {
    const classColor = getSystemClassColor(node.systemClass);

    if (node.systemClass === 'Highsec') {
      const sec = node.security !== undefined ? node.security.toFixed(1) : '1.0';
      return <span className="font-bold text-xs" style={{ color: classColor }}>{sec}</span>;
    }
    if (node.systemClass === 'Lowsec') {
      const sec = node.security !== undefined ? node.security.toFixed(1) : '0.4';
      return (
        <span className="font-bold text-xs flex items-center gap-1" style={{ color: classColor }}>
          <span>{sec}</span>
          {node.sigCode && <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>[{node.sigCode}]</span>}
        </span>
      );
    }
    if (node.systemClass === 'Nullsec') {
      const sec = node.security !== undefined ? (node.security < 0 ? node.security.toFixed(1) : `-${node.security.toFixed(1)}`) : '-0.7';
      return (
        <span className="font-bold text-xs flex items-center gap-1" style={{ color: classColor }}>
          <span>{sec}</span>
          {node.sigCode && <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>[{node.sigCode}]</span>}
        </span>
      );
    }

    // Wormhole class (C1 - C6, Thera, Pochven)
    const isTarget = node.id === activeSystem?.id;
    return (
      <span className="font-bold text-xs flex items-center gap-1 leading-none">
        {isTarget && <span className="text-white text-[10px]">⊙</span>}
        <span className="font-extrabold tracking-tight" style={{ color: classColor }}>{node.systemClass}</span>
        {node.sigCode && <span className={`text-[10px] font-mono ${isDark ? 'text-cyan-200/90' : 'text-sky-800'}`}>[{node.sigCode}]</span>}
      </span>
    );
  };

  return (
    <div className={`flex flex-col w-full h-full min-h-0 font-mono select-none overflow-hidden relative ${
      isDark ? 'bg-[#121620] text-gray-200' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* 1. TOP TITLE BAR (Apple macOS Sequoia / VisionOS Frosted Glass Bar) */}
      <div className={`border-b px-4 py-2 flex items-center justify-between text-xs z-20 flex-wrap gap-2.5 backdrop-blur-2xl transition-colors ${
        isDark ? 'bg-[#161c28]/90 border-white/10 text-gray-200 shadow-md shadow-black/30' : 'bg-white/85 border-slate-200/80 text-slate-800 shadow-sm'
      }`}>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Pilot Identity & EVE SSO Profile (Apple Capsule) */}
          <div className="flex items-center gap-2">
            {currentPilot ? (
              <div className={`flex items-center gap-2 rounded-full pl-1 pr-2 py-0.5 border shadow-sm transition-all ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white' 
                  : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}>
                <img
                  src={currentPilot.avatarUrl}
                  alt={currentPilot.characterName}
                  className="w-5 h-5 rounded-full border border-cyan-400/60 object-cover"
                />
                <span className="font-semibold text-xs">{currentPilot.characterName}</span>
                {currentPilot.corporationTicker && (
                  <span className={`text-[10px] hidden sm:inline ${isDark ? 'text-cyan-300/80' : 'text-cyan-700 font-semibold'}`}>[{currentPilot.corporationTicker}]</span>
                )}
                <button
                  onClick={() => {
                    mapperService.setPilotLocation(currentPilot.characterName, selectedSystem?.id || 'J103955');
                  }}
                  className="px-2 py-0.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-all whitespace-nowrap ml-0.5"
                  title={`Move ${currentPilot.characterName} to ${selectedSystem?.name || 'J103955'}`}
                >
                  <MapPin className="w-2.5 h-2.5" />
                  <span>I'm in {selectedSystem?.name || 'J103955'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In Pilot</span>
              </button>
            )}
          </div>

          <div className={`hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-sans ${
            isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
            <span className="opacity-40">|</span>
            <span>{Object.keys(mapState.systems).length} Systems</span>
          </div>

          {/* Wireless Clipboard Sync Button */}
          <button
            onClick={() => setIsPasteModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-sans transition-all cursor-pointer ${
              isDark 
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25 shadow-sm' 
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
            }`}
            title="Wireless Clipboard: Auto-syncs copied D-Scan, Cosmic Signatures, and System names. Click to paste manually."
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold">Wireless Clipboard</span>
          </button>

          {/* Active Fleet in Chain */}
          {allActivePilots.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {allActivePilots.map((p, idx) => {
                const isMe = currentPilot && p.pilotName.toLowerCase().includes(currentPilot.characterName.toLowerCase());
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedSystemId(p.systemName);
                      centerOnSystem(p.systemName);
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border ${
                      isMe 
                        ? isDark ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200' : 'bg-cyan-50 border-cyan-300 text-cyan-900 font-semibold'
                        : isDark ? 'bg-purple-500/15 border-purple-500/40 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
                    }`}
                    title={`Click to focus on ${p.pilotName} in ${p.systemName}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isMe ? 'bg-cyan-400' : 'bg-purple-400 animate-pulse'}`}></span>
                    <span>{p.pilotName}</span>
                    <span className="text-[10px] opacity-70">@{p.systemName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Controls (Apple Segmented Pill Toolbar) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Segmented Controls Group */}
          <div className={`flex items-center p-0.5 rounded-full border ${
            isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            {/* Follow-Me */}
            <button
              onClick={() => {
                const next = !followMe;
                setFollowMe(next);
                if (next && activeSystem) {
                  centerOnSystem(activeSystem.id);
                }
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                followMe
                  ? isDark ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm' : 'bg-emerald-500 text-white font-semibold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={followMe ? 'Follow Me: ON' : 'Follow Me: OFF'}
            >
              <Navigation className={`w-3 h-3 ${followMe ? 'animate-pulse' : ''}`} />
              <span>{followMe ? 'Follow' : 'Follow: Off'}</span>
            </button>

            {/* Tidy Tree */}
            <button
              onClick={() => {
                mapperService.autoOrganizeTreeLayout();
                setTimeout(() => handleFit(), 80);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark ? 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-300'
              }`}
              title="Clean & Untangle Tree (Auto-organize spacing and center view)"
            >
              <FolderTree className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Tidy Tree</span>
            </button>

            {/* Box / Marquee Select Mode */}
            <button
              onClick={() => setBoxSelectMode(!boxSelectMode)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                boxSelectMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Box / Marquee Selection Mode (or drag on canvas while holding Shift)"
            >
              <BoxSelect className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Box Select</span>
            </button>

            {/* Collapse All */}
            <button
              onClick={() => mapperService.toggleCollapseAll()}
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle Collapse / Expand all branches"
            >
              <GitFork className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Fold All</span>
            </button>
          </div>

          {/* Jita Jump Count Pill */}
          <div
            onClick={() => {
              setSelectedSystemId('Jita');
              centerOnSystem('Jita');
            }}
            className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              jitaRoute.jumps !== null
                ? isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                : isDark ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title={`Shortest route to Jita 4-4: ${jitaRoute.jumps !== null ? `${jitaRoute.jumps} jumps` : 'No route'}`}
          >
            <Route className="w-3 h-3 text-blue-400" />
            <span>Jita: {jitaRoute.jumps !== null ? `${jitaRoute.jumps} J` : '—'}</span>
          </div>

          {/* Timers Button */}
          <button
            onClick={() => setIsTimerModalOpen(true)}
            className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all ${
              (mapState.timers || []).length > 0
                ? isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800 font-semibold'
                : isDark ? 'bg-white/5 border-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Create or View Structure Timers"
          >
            <Hourglass className="w-3 h-3 text-amber-400" />
            <span>Timers: {(mapState.timers || []).length}</span>
          </button>

          {/* Ship Fittings Window Button */}
          <button
            onClick={() => setIsFittingModalOpen(true)}
            className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              isDark 
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
            title="Open Ship Fittings Window (EFT Analyzer, Stats, & Presets)"
          >
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>Fittings</span>
          </button>

          {/* Share Link Pill */}
          <button
            onClick={handleCopyBuddyLink}
            className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Copy live tunnel link for fleet buddy"
          >
            {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
            <span className="hidden md:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          {/* Inspector Toggle */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-1.5 rounded-full border transition-colors ${
              showInspector 
                ? isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                : isDark ? 'bg-white/5 text-slate-400 border-white/5 hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="Toggle System Inspector"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-full border transition-colors ${
              isDark 
                ? 'bg-white/5 border-white/10 text-amber-300 hover:bg-white/10' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDark ? 'Switch to Daylight Clean Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-cyan-600" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-full border transition-colors ${
              isDark 
                ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN BODY ROW: LEFT (CANVAS + BOTTOM DECK) | RIGHT (FULL-HEIGHT SYSTEM INSPECTOR) */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* LEFT COLUMN: Map Canvas + Integrated Bottom Intel Deck */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
          {/* Main Interactive Visual Canvas */}
          <div 
            ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 relative overflow-hidden ${isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        style={getCanvasBackground()}
      >
        {/* LIVE JUMP DETECTED FLOATING HUD BANNER */}
        {lastJumpAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
            <div className={`px-4 py-2 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-center gap-3 font-sans ${
              isDark 
                ? 'bg-[#161c28]/95 border-emerald-500/40 text-white shadow-[0_8px_32px_rgba(16,185,129,0.25)]' 
                : 'bg-white/95 border-emerald-400 text-slate-900 shadow-xl'
            }`}>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                <Navigation className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400 text-[11px] tracking-wide">JUMP DETECTED</span>
                  <span className="text-[10px] text-slate-400">Live Pilot Follower</span>
                </div>
                <div className="text-slate-200 text-xs mt-0.5">
                  <span className="font-semibold text-white">{lastJumpAlert.pilotName || 'Pilot'}</span>
                  {lastJumpAlert.fromSystem ? (
                    <> jumped from <span className="text-cyan-300 font-mono font-medium">{lastJumpAlert.fromSystem}</span> to </>
                  ) : (
                    <> entered </>
                  )}
                  <span className="text-emerald-300 font-bold font-mono text-sm underline decoration-emerald-500/40">{lastJumpAlert.systemName}</span>
                  {lastJumpAlert.shipName && (
                    <span className="text-slate-400 text-[11px] ml-1.5">({lastJumpAlert.shipName})</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSystemId(lastJumpAlert.systemName);
                  centerOnSystem(lastJumpAlert.systemName);
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs ml-2 cursor-pointer shadow-sm transition-all"
              >
                Focus
              </button>
              <button
                onClick={() => setLastJumpAlert(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* INTERACTIVE LINKING MODE HUD BANNER */}
        {linkingFromId && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
            <div className={`px-4 py-2 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-center gap-3 font-sans ${
              isDark 
                ? 'bg-[#151c28]/95 border-cyan-500/50 text-white shadow-[0_8px_32px_rgba(6,182,212,0.35)]' 
                : 'bg-white/95 border-cyan-400 text-slate-900 shadow-xl'
            }`}>
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                <Link2 className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-cyan-400 text-[11px] tracking-wide">CONNECTING SYSTEMS</div>
                <div className="text-slate-200 mt-0.5">
                  Click any other system card to link with <span className="text-cyan-300 font-bold font-mono">{linkingFromId}</span>
                </div>
              </div>
              <button
                onClick={() => setLinkingFromId(null)}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-semibold text-xs ml-2 cursor-pointer shadow-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* WIRELESS CLIPBOARD REAL-TIME FLOATING HUD */}
        {lastClipboardNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
            <div className={`px-4 py-2 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-center gap-3 font-sans ${
              isDark 
                ? 'bg-[#161c28]/95 border-purple-500/40 text-white shadow-[0_8px_32px_rgba(168,85,247,0.25)]' 
                : 'bg-white/95 border-purple-400 text-slate-900 shadow-xl'
            }`}>
              <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300 shrink-0">
                <ClipboardCheck className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-400 text-[11px] tracking-wide">WIRELESS CLIPBOARD</span>
                  <span className="text-[10px] text-slate-400">Live Hands-Free Scanner</span>
                </div>
                <div className="text-slate-200 text-xs mt-0.5">
                  {lastClipboardNotice.systemName ? (
                    <>
                      System <span className="text-cyan-300 font-bold font-mono">{lastClipboardNotice.systemName}</span> detected in clipboard!
                    </>
                  ) : lastClipboardNotice.sigCount ? (
                    <>
                      <span className="text-amber-300 font-bold">{lastClipboardNotice.sigCount} Cosmic Signatures</span> synced to {selectedSystem?.name || 'Active System'}!
                    </>
                  ) : lastClipboardNotice.dscanCount ? (
                    <>
                      <span className="text-emerald-300 font-bold">D-Scan ({lastClipboardNotice.dscanCount} objects)</span> updated!
                    </>
                  ) : (
                    <span className="text-slate-300 font-mono truncate max-w-xs block">{lastClipboardNotice.text}</span>
                  )}
                </div>
              </div>

              {lastClipboardNotice.systemName && (
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => {
                      mapperService.addWormholeConnection(selectedSystem?.id || 'Jita', lastClipboardNotice.systemName!);
                      setLastClipboardNotice(null);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer shadow-sm transition-all"
                  >
                    Link to {selectedSystem?.name || 'Jita'}
                  </button>
                  {!mapState.systems[lastClipboardNotice.systemName] && (
                    <button
                      onClick={() => {
                        mapperService.setPilotLocation('Scout', lastClipboardNotice.systemName!);
                        setLastClipboardNotice(null);
                      }}
                      className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs cursor-pointer transition-all"
                    >
                      Add Node
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setLastClipboardNotice(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Transformable Canvas Layer */}
        <div
          className="absolute inset-0 origin-top-left pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '4000px',
            height: '3000px'
          }}
        >
          {/* SVG CONNECTION LINES LAYER */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              {/* Tactical Space Grid Pattern (scales & translates with pan/zoom) */}
              <pattern id="tactical-grid-fine" width="40" height="40" patternUnits="userSpaceOnUse">
                <path 
                  d="M 40 0 L 0 0 0 40" 
                  fill="none" 
                  stroke={isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(100, 116, 139, 0.12)"} 
                  strokeWidth="1" 
                />
              </pattern>
              <pattern id="tactical-grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
                <rect width="200" height="200" fill="url(#tactical-grid-fine)" />
                <path 
                  d="M 200 0 L 0 0 0 200" 
                  fill="none" 
                  stroke={isDark ? "rgba(56, 189, 248, 0.18)" : "rgba(14, 165, 233, 0.22)"} 
                  strokeWidth="1.2" 
                />
                {/* Precision Tactical Crosshairs (+) at every 200px intersection */}
                <path 
                  d="M -6 0 L 6 0 M 0 -6 L 0 6" 
                  fill="none" 
                  stroke={isDark ? "rgba(56, 189, 248, 0.5)" : "rgba(14, 165, 233, 0.55)"} 
                  strokeWidth="1.5" 
                />
              </pattern>
              {/* Wormhole Glow Filter */}
              <filter id="wh-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              {/* EOL Glowing Red Pulse Filter */}
              <filter id="eol-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feFlood floodColor="#ef4444" floodOpacity="0.85" result="glowColor" />
                <feComposite in="glowColor" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>


            {mapState.connections.map((conn) => {
              if (hiddenNodeIds.has(conn.from) || hiddenNodeIds.has(conn.to)) return null;

              const fromSys = mapState.systems[conn.from];
              const toSys = mapState.systems[conn.to];
              if (!fromSys || !toSys) return null;

              const x1 = (fromSys.x !== undefined ? fromSys.x : 578) + NODE_W / 2;
              const y1 = (fromSys.y !== undefined ? fromSys.y : 160) + NODE_H;
              const x2 = (toSys.x !== undefined ? toSys.x : 578) + NODE_W / 2;
              const y2 = toSys.y !== undefined ? toSys.y : 160;

              const midY = (y1 + y2) / 2;
              const midX = (x1 + x2) / 2;
              const pathData = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;

              const isStargate = conn.wormholeType === 'Stargate';
              const isEOL = conn.timeStatus === 'eol';
              const isCrit = conn.massStatus === 'critical';
              const isDestab = conn.massStatus === 'destab';

              // User requirement:
              // Known space (stargates) = emerald green (#22c55e) solid
              // Wormholes = purple or individual class color
              // EOL overrides = bright crimson red (#ef4444) dashed with slight pulse & broken chain
              // Critical mass = orange/red (#f97316)
              const destClass = toSys.systemClass;
              const whClassColor = getSystemClassColor(destClass);
              let strokeColor = isStargate ? '#22c55e' : whClassColor;
              let strokeDash: string | undefined = isStargate ? undefined : '6 3';

              if (isEOL) {
                strokeColor = '#ef4444'; // EOL Bright Red
                strokeDash = '5 3';
              } else if (isCrit) {
                strokeColor = '#f97316'; // Orange Critical
                strokeDash = '4 3';
              } else if (isDestab) {
                strokeColor = '#eab308'; // Amber Destabilized
                strokeDash = '6 3';
              }

              // Signature label with lifetime badge (<4h EOL / >4h Stable)
              const sigLabel = conn.sigFrom 
                ? (toSys.systemClass?.startsWith('C') ? `TC [${conn.sigFrom}]` : `[${conn.sigFrom}]`)
                : (conn.wormholeType || 'WH');
              const badgeText = isEOL ? `💔 ${sigLabel} [<4h EOL]` : (!isStargate ? `${sigLabel} [>4h]` : sigLabel);
              const badgeWidth = Math.max(54, badgeText.length * 7.2 + (isEOL ? 18 : 12));

              return (
                <g key={conn.id} className="cursor-pointer group pointer-events-auto">
                  {/* Invisible wide hit area (expanded to 28px) for effortless clicking on lines */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="28"
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConnection(conn);
                      setIsConnModalOpen(true);
                    }}
                  >
                    <title>{`Click to assign features: ${conn.from} ➔ ${conn.to} (${conn.wormholeType || 'Wormhole'}) [${isEOL ? 'EOL <4h' : 'Stable >4h'}]`}</title>
                  </path>

                  {/* Hover highlight glow */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isEOL ? '#ef4444' : '#38bdf8'}
                    strokeWidth="7"
                    strokeOpacity="0"
                    className="transition-opacity group-hover:stroke-opacity-40 pointer-events-none"
                  />

                  {/* Background shadow stroke */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="5"
                    strokeOpacity="0.8"
                    className="pointer-events-none"
                  />

                  {/* Main Connector Path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isEOL ? '2.5' : isStargate ? '2.5' : '2'}
                    strokeDasharray={strokeDash}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={isEOL ? 'url(#eol-glow)' : (!isStargate ? 'url(#wh-glow)' : undefined)}
                    className={`transition-colors group-hover:stroke-cyan-300 pointer-events-auto cursor-pointer ${isEOL ? 'eol-pulse-line' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConnection(conn);
                      setIsConnModalOpen(true);
                    }}
                  />

                  {/* Terminal joint dots for Stargates (Green) */}
                  {isStargate && !isEOL && (
                    <>
                      <circle cx={x1} cy={y1} r="2.5" fill={isDark ? '#22c55e' : '#16a34a'} />
                      <circle cx={x2} cy={y2} r="2.5" fill={isDark ? '#22c55e' : '#16a34a'} />
                    </>
                  )}

                  {/* Midpoint Label Tag (rendered on wormholes, or any connection marked EOL/Crit/custom) */}
                  {(!isStargate || isEOL || isCrit || isDestab || conn.sigFrom) && (
                    <g 
                      transform={`translate(${midX}, ${midY})`}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConnection(conn);
                        setIsConnModalOpen(true);
                      }}
                    >
                      <rect
                        x={-badgeWidth / 2}
                        y="-10"
                        width={badgeWidth}
                        height="20"
                        rx="5"
                        fill="#070c18"
                        stroke={isEOL ? '#ef4444' : strokeColor}
                        strokeWidth={isEOL ? '2' : '1.2'}
                        className={`group-hover:fill-[#0e172a] group-hover:stroke-cyan-300 transition-all shadow-md ${isEOL ? 'animate-pulse' : ''}`}
                      />
                      <text
                        x="0"
                        y="4"
                        fill={isEOL ? '#fca5a5' : isCrit ? '#fdba74' : isDestab ? '#fde047' : '#e9d5ff'}
                        fontSize="9.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {badgeText}
                      </text>

                      {/* Tactical Tags: Camped, Bubbled, Frig Hole */}
                      {conn.tactical === 'bubbled' && (
                        <g transform={`translate(${badgeWidth / 2 + 7}, 0)`}>
                          <circle r="5.5" fill="#f59e0b" stroke="#000" strokeWidth="1" />
                          <text y="2.5" fontSize="7" fontWeight="bold" fill="#000" textAnchor="middle">B</text>
                        </g>
                      )}
                      {conn.tactical === 'camped' && (
                        <g transform={`translate(${badgeWidth / 2 + 7}, 0)`}>
                          <circle r="5.5" fill="#ef4444" stroke="#000" strokeWidth="1" />
                          <text y="2.5" fontSize="7" fontWeight="bold" fill="#fff" textAnchor="middle">C</text>
                        </g>
                      )}
                      {conn.isFrig && (
                        <g transform={`translate(${-badgeWidth / 2 - 7}, 0)`}>
                          <circle r="5.5" fill="#38bdf8" stroke="#000" strokeWidth="1" />
                          <text y="2.5" fontSize="7" fontWeight="bold" fill="#000" textAnchor="middle">F</text>
                        </g>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* MARQUEE BOX SELECTION OVERLAY */}
          {boxSelectRect && (
            <div
              className="absolute pointer-events-none border-2 border-cyan-400/90 bg-cyan-500/15 rounded-xl z-40 shadow-[0_0_24px_rgba(6,182,212,0.35)] backdrop-blur-[1px]"
              style={{
                left: `${Math.min(boxSelectRect.startX, boxSelectRect.currX)}px`,
                top: `${Math.min(boxSelectRect.startY, boxSelectRect.currY)}px`,
                width: `${Math.abs(boxSelectRect.currX - boxSelectRect.startX)}px`,
                height: `${Math.abs(boxSelectRect.currY - boxSelectRect.startY)}px`
              }}
            />
          )}

          {/* HTML NODE CARDS LAYER (pointer-events-none on container so clicks pass to SVG lines underneath) */}
          <div className="absolute inset-0 pointer-events-none">
            {Object.values(mapState.systems).map((node, nodeIdx) => {
              if (hiddenNodeIds.has(node.id)) return null;

              const isSelected = node.id === selectedSystem?.id;
              const isMultiSelected = multiSelectedIds.has(node.id);
              const isActivePlayer = node.id === activeSystem?.id;
              const pilotCount = node.activePilots ? node.activePilots.length : 0;
              const sortedPilots = [...(node.activePilots || [])].sort((a, b) => a.localeCompare(b));
              const structCount = node.structures ? node.structures.length : 0;
              const childrenConnections = mapState.connections.filter(c => c.from === node.id && c.to !== node.id);
              const hasChildren = childrenConnections.length > 0;
              const nodeTimers = (mapState.timers || []).filter(t => t.systemName.trim().toUpperCase() === node.id.toUpperCase());
              const kills24h = systemThreatMap[node.name]?.kills24h || 0;

              // Border colors based on system class
              const classColor = getSystemClassColor(node.systemClass);
              const borderColor = isDark ? `${classColor}77` : classColor;

              const isWormhole = node.systemClass?.startsWith('C') || node.name.startsWith('J') || node.systemClass === 'Thera';
              const whMeta = isWormhole ? getWormholeSystemMetadata(node.name) : null;
              const nodeStatics = (node.statics && node.statics.length > 0) ? node.statics : (whMeta?.statics || []);
              const cleanStatics = nodeStatics.map(s => {
                if (s.startsWith('High') || s.includes('B274') || s.includes('E175')) return 'H';
                if (s.startsWith('Low') || s.includes('H296')) return 'L';
                if (s.startsWith('Null') || s.includes('K162')) return 'N';
                const m = s.match(/(C[1-6]|Thera|Pochven)/i);
                return m ? m[1].toUpperCase() : s.slice(0, 3).toUpperCase();
              });

              const nodeEffect = node.effect || whMeta?.effect;
              const hasWhEffect = nodeEffect && nodeEffect !== 'No Effect' && nodeEffect !== 'None';
              const effectMeta = hasWhEffect && WH_SYSTEM_EFFECTS[nodeEffect] ? WH_SYSTEM_EFFECTS[nodeEffect] : null;

              const connectedConns = mapState.connections.filter(c => c.from === node.id || c.to === node.id);
              const isNodeEOL = connectedConns.some(c => c.timeStatus === 'eol');
              const hasWHConn = connectedConns.some(c => c.wormholeType !== 'Stargate');

              // Safe fallback coordinates so new systems are never placed off canvas at (0, 0)
              const posX = node.x !== undefined ? node.x : (578 + ((nodeIdx % 3) - 1) * 190);
              const posY = node.y !== undefined ? node.y : (160 + Math.floor(nodeIdx / 3) * 110);

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeDragStart(e, node)}
                  className="canvas-node absolute cursor-pointer transition-shadow pointer-events-auto"
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    width: `${NODE_W}px`,
                    height: `${NODE_H}px`
                  }}
                >
                  {/* Card Container (Apple VisionOS / macOS Sequoia Frosted Glass Node) */}
                  <div
                    className={`w-full h-full rounded-2xl px-3 py-2 flex flex-col justify-between relative transition-all duration-150 backdrop-blur-md ${
                      linkingFromId === node.id
                        ? 'bg-[#0f2438]/95 shadow-[0_0_24px_rgba(6,182,212,0.85)] ring-2 ring-cyan-400 animate-pulse'
                        : linkingFromId
                        ? 'bg-[#0c1626]/85 hover:bg-[#10243c] border border-cyan-500/40 hover:ring-2 hover:ring-emerald-400 hover:scale-[1.03] cursor-pointer'
                        : isActivePlayer
                        ? isDark
                          ? 'bg-[#101a2e]/90 shadow-[0_0_24px_rgba(56,189,248,0.45),0_0_8px_rgba(255,255,255,0.7)] ring-2 ring-white/90'
                          : 'bg-white/95 shadow-[0_0_20px_rgba(2,132,199,0.35)] ring-2 ring-sky-500'
                        : isMultiSelected
                        ? isDark
                          ? 'bg-[#0b192e]/95 shadow-[0_0_24px_rgba(6,182,212,0.65)] ring-2 ring-cyan-400'
                          : 'bg-cyan-50/95 shadow-lg ring-2 ring-cyan-500'
                        : isSelected
                        ? isDark
                          ? 'bg-[#0f172a]/90 shadow-[0_0_16px_rgba(6,182,212,0.3)] ring-1.5 ring-cyan-400'
                          : 'bg-sky-50/95 shadow-md ring-1.5 ring-sky-400'
                        : isDark
                        ? 'bg-[#0c1222]/85 hover:bg-[#10172b] border border-white/10 shadow-lg shadow-black/20'
                        : 'bg-white/90 hover:bg-slate-50 shadow-sm border border-slate-200/80'
                    }`}
                    style={{
                      borderWidth: (isActivePlayer || isSelected || isMultiSelected || linkingFromId === node.id) ? '0px' : '1px',
                      borderColor: borderColor
                    }}
                  >
                    {/* Multi-Selection Checkmark Badge */}
                    {isMultiSelected && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center font-black text-[10px] shadow-lg shadow-cyan-500/60 z-30 animate-in zoom-in-75 duration-100">
                        <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                      </div>
                    )}
                    {/* Top Row: Security or WH Class + Statics (User requested: "Statics \n C2 C3") + Fold/Status Control */}
                    <div className="flex items-center justify-between leading-none">
                      {renderSecurityOrClass(node)}
                      
                      <div className="flex items-center gap-1.5">
                        {/* Dedicated Statics Display in Upper Right (User Diagram: Statics \n C2 C3) */}
                        {isWormhole && cleanStatics.length > 0 && (
                          <div className="flex flex-col items-end leading-none">
                            <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold tracking-tight">Statics</span>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {cleanStatics.map((st, sIdx) => {
                                const stColor = st.startsWith('C') ? getSystemClassColor(st) : st === 'H' ? '#22c55e' : st === 'L' ? '#f97316' : '#ef4444';
                                return (
                                  <span 
                                    key={sIdx} 
                                    className="text-[8.5px] font-bold font-mono px-1 py-0.2 rounded border bg-black/40"
                                    style={{ color: stColor, borderColor: stColor + '55' }}
                                  >
                                    {st}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {nodeTimers.length > 0 && (
                          <span 
                            className="text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm animate-pulse"
                            title={`${nodeTimers.length} active structure timer(s) in ${node.name}`}
                          >
                            <Hourglass className="w-2.5 h-2.5" />
                            <span>{nodeTimers.length}</span>
                          </span>
                        )}

                        {kills24h > 0 && (
                          <span 
                            className="text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold bg-red-500/15 border border-red-500/40 text-red-300 shadow-sm"
                            title={`${kills24h} kill(s) in last 24h on zKillboard`}
                          >
                            <Skull className="w-2.5 h-2.5" />
                            <span>{kills24h}</span>
                          </span>
                        )}

                        {structCount > 0 && (
                          <span className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600 font-semibold'}`}>
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{structCount}</span>
                          </span>
                        )}

                        {hasChildren && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              mapperService.toggleSystemCollapse(node.id);
                            }}
                            className={`p-0.5 rounded-full transition-all pointer-events-auto ${
                              node.isCollapsed
                                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40 text-[9px] font-bold px-1.5 flex items-center gap-0.5 shadow-sm'
                                : isDark
                                ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                            }`}
                            title={node.isCollapsed ? 'Click to expand folded branch' : 'Click to compress / fold this branch'}
                          >
                            {node.isCollapsed ? (
                              <>
                                <ChevronRight className="w-2.5 h-2.5" />
                                <span>+{childrenConnections.length}</span>
                              </>
                            ) : (
                              <ChevronDown className="w-2.5 h-2.5" />
                            )}
                          </button>
                        )}

                        {/* Interactive Link / Connect Handle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (linkingFromId === node.id) {
                              setLinkingFromId(null);
                            } else if (linkingFromId) {
                              mapperService.addWormholeConnection(linkingFromId, node.id);
                              setLinkingFromId(null);
                            } else {
                              setLinkingFromId(node.id);
                            }
                          }}
                          className={`p-1 rounded-full transition-all pointer-events-auto cursor-pointer ${
                            linkingFromId === node.id
                              ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/60 ring-2 ring-cyan-300 animate-pulse'
                              : linkingFromId
                              ? 'hover:bg-cyan-500/20 text-cyan-400 hover:text-white'
                              : 'hover:bg-white/10 text-slate-400 hover:text-cyan-300'
                          }`}
                          title={
                            linkingFromId === node.id 
                              ? 'Cancel linking' 
                              : linkingFromId 
                              ? `Click to connect with ${linkingFromId}` 
                              : `Link / connect ${node.name} to another system`
                          }
                        >
                          <Link2 className="w-2.5 h-2.5" />
                        </button>

                        {isSelected && node.id !== 'Jita' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete system "${node.name}" and all its connections?`)) {
                                mapperService.deleteSystem(node.id);
                              }
                            }}
                            className="p-0.5 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors pointer-events-auto"
                            title="Delete this system from the map"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: System Name on left, Lifetime Notification on right (<4h or >4h) */}
                    <div className="flex items-center justify-between leading-tight mt-1">
                      <span className={`text-xs font-bold tracking-tight truncate ${
                        isActivePlayer 
                          ? isDark ? 'text-white' : 'text-slate-950 font-black'
                          : isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {node.name}
                      </span>

                      {/* Lifetime Notification (<4h EOL with red pulse vs >4h Stable) */}
                      {(isWormhole || hasWHConn) && (
                        isNodeEOL ? (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.5)] flex items-center gap-0.5 animate-pulse"
                            title="End of Life connection: <4 hours remaining"
                          >
                            <span>💔 &lt;4h</span>
                          </span>
                        ) : (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-emerald-950/30 text-emerald-400/80 border border-emerald-500/25 flex items-center gap-0.5"
                            title="Stable connection: >4 hours remaining"
                          >
                            <span>&gt;4h</span>
                          </span>
                        )
                      )}
                    </div>

                    {/* Bottom Row: WH Effect (never 'W-Space') or K-Space Region */}
                    <div className="text-[9.5px] font-sans tracking-normal truncate leading-tight mt-1">
                      {isWormhole ? (
                        hasWhEffect ? (
                          <span 
                            className="font-bold tracking-tight" 
                            style={{ color: effectMeta?.color || '#06b6d4' }}
                            title={effectMeta?.desc || nodeEffect}
                          >
                            {effectMeta?.effect || nodeEffect}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[9px]">
                            Effect: <span className="text-slate-400 font-bold">None</span>
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 truncate">{node.region || 'Known Space'}</span>
                      )}
                    </div>

                    {/* Pilot Presence Badge (Purple Circle with number) + Hover Tooltip */}
                    {pilotCount > 0 && (
                      <div className="absolute -top-2 -right-2 group/pilot z-30">
                        {/* Purple Circular Count Badge */}
                        <div 
                          className="w-5 h-5 rounded-full bg-purple-600 border border-purple-300 text-white font-bold text-[10px] flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.8)] cursor-pointer hover:scale-110 transition-transform"
                        >
                          {pilotCount}
                        </div>

                        {/* Stacked Pilots in Alphabetical Order on Hover */}
                        <div className={`opacity-0 group-hover/pilot:opacity-100 pointer-events-none group-hover/pilot:pointer-events-auto transition-all duration-150 absolute top-full right-0 mt-1 min-w-[200px] p-3 rounded-2xl backdrop-blur-2xl border shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
                          isDark 
                            ? 'bg-[#0a0f1d]/95 border-purple-500/40 text-white shadow-[0_0_24px_rgba(168,85,247,0.25)]' 
                            : 'bg-white/95 border-purple-200 text-slate-900 shadow-xl'
                        }`}>
                          <div className={`text-[9px] font-sans font-bold uppercase tracking-wider pb-1.5 mb-2 border-b flex items-center justify-between ${
                            isDark ? 'text-purple-300 border-purple-500/20' : 'text-purple-700 border-purple-100'
                          }`}>
                            <span>Pilots in {node.name}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">{pilotCount}</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            {sortedPilots.map((pilotName, pIdx) => {
                              const isMe = currentPilot && pilotName.toLowerCase().includes(currentPilot.characterName.toLowerCase());
                              return (
                                <div
                                  key={pIdx}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-sans flex items-center gap-2 border transition-colors ${
                                    isMe
                                      ? isDark
                                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                                        : 'bg-cyan-50 border-cyan-300 text-cyan-900 font-semibold'
                                      : isDark
                                      ? 'bg-white/5 border-white/5 text-slate-200'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isMe ? 'bg-cyan-400' : 'bg-purple-400 animate-pulse'}`}></span>
                                  <User className={`w-3.5 h-3.5 shrink-0 ${isMe ? 'text-cyan-400' : 'text-purple-400'}`} />
                                  <span className="font-semibold truncate flex-1">{pilotName}</span>
                                  {isMe && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                                      YOU
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FLOATING MASS ACTION DOCK (Centered Bottom) */}
        {multiSelectedIds.size > 0 && (
          <div className="canvas-control absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#0c1220]/95 border border-cyan-500/40 rounded-2xl px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex items-center gap-3 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide whitespace-nowrap">
                {multiSelectedIds.size} {multiSelectedIds.size === 1 ? 'System' : 'Systems'} Selected
              </span>
            </div>

            {/* Quick Connect 2 Selected Systems */}
            {multiSelectedIds.size === 2 && (() => {
              const [sysA, sysB] = Array.from(multiSelectedIds);
              const isConnected = mapState.connections.some(
                c => (c.from === sysA && c.to === sysB) || (c.from === sysB && c.to === sysA)
              );
              return (
                <button
                  onClick={() => {
                    mapperService.addWormholeConnection(sysA, sysB);
                    setMultiSelectedIds(new Set());
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap ${
                    isConnected
                      ? 'bg-amber-600/90 hover:bg-amber-500 text-white shadow-amber-950/40'
                      : 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                  }`}
                  title={isConnected ? `Update link between ${sysA} and ${sysB}` : `Connect ${sysA} ↔ ${sysB}`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>{isConnected ? `Linked (${sysA} ↔ ${sysB})` : `Connect ${sysA} ↔ ${sysB}`}</span>
                </button>
              );
            })()}

            {/* Mass Delete */}
            <button
              onClick={() => {
                if (window.confirm(`Mass delete ${multiSelectedIds.size} selected system(s) and all their connections from the map?`)) {
                  mapperService.deleteSystemsBatch(Array.from(multiSelectedIds));
                  setMultiSelectedIds(new Set());
                }
              }}
              className="px-3.5 py-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-red-950/40 cursor-pointer whitespace-nowrap"
              title="Delete all selected systems"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({multiSelectedIds.size})</span>
            </button>

            {/* Select Downstream Branch */}
            <button
              onClick={() => {
                const expanded = new Set(multiSelectedIds);
                const queue = Array.from(multiSelectedIds);
                while (queue.length > 0) {
                  const curr = queue.shift()!;
                  const childConns = mapState.connections.filter(c => c.from === curr && !expanded.has(c.to));
                  for (const c of childConns) {
                    expanded.add(c.to);
                    queue.push(c.to);
                  }
                }
                setMultiSelectedIds(expanded);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Select all child and descendant systems in this branch"
            >
              <GitFork className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Select Branch</span>
            </button>

            {/* Align Horizontal */}
            <button
              onClick={() => {
                const nodes = Array.from(multiSelectedIds).map(id => mapState.systems[id]).filter(Boolean);
                if (nodes.length <= 1) return;
                const avgY = Math.round(nodes.reduce((acc, n) => acc + (n.y || 0), 0) / nodes.length);
                const updated: Record<string, { x: number; y: number }> = {};
                nodes.forEach(n => {
                  n.y = avgY;
                  updated[n.id] = { x: n.x || 0, y: avgY };
                });
                setMapState({ ...mapState });
                mapperService.saveSystemPositions(updated);
              }}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
              title="Align selected systems on same horizontal line"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Align H</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setMultiSelectedIds(new Set())}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Clear selection (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. FLOATING CANVAS CONTROLS (Bottom-Left) */}
        <div className={`canvas-control absolute bottom-4 left-4 z-20 flex flex-col items-center backdrop-blur-md border rounded-xl p-1 shadow-2xl space-y-1 ${
          isDark ? 'bg-[#161c28]/90 border-white/10' : 'bg-white/90 border-slate-200'
        }`}>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-cyan-950/60 text-gray-300 hover:text-cyan-300 transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-cyan-950/60 text-gray-300 hover:text-cyan-300 transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className={`w-4 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
          <div className="relative">
            <button
              onClick={() => setShowBgMenu(prev => !prev)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                showBgMenu || bgTheme !== 'classic_void'
                  ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 ring-1 ring-cyan-500/40' 
                  : 'hover:bg-cyan-950/60 text-gray-400 hover:text-gray-200'
              }`}
              title="Canvas Background & Infinite Grid Presets"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Background Theme Selector Popover */}
            {showBgMenu && (
              <div 
                className="absolute bottom-11 left-0 w-64 p-2.5 rounded-2xl bg-[#0f172a]/95 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 font-sans text-xs space-y-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-1.5 pt-0.5 pb-1 border-b border-white/10 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <span>Canvas Background</span>
                  <button onClick={() => setShowBgMenu(false)} className="hover:text-white p-0.5 cursor-pointer"><X className="w-3 h-3" /></button>
                </div>

                <button
                  onClick={() => selectBgTheme('classic_void')}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    bgTheme === 'classic_void'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#050813] border border-cyan-500/30 flex items-center justify-center text-[10px]">🌌</div>
                    <div>
                      <div className="font-semibold text-xs text-white">Deep Space (Classic)</div>
                      <div className="text-[10px] text-slate-400">Original starry nebula void</div>
                    </div>
                  </div>
                  {bgTheme === 'classic_void' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>

                <button
                  onClick={() => selectBgTheme('tactical_grey_grid')}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    bgTheme === 'tactical_grey_grid'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#121620] border border-slate-600 flex items-center justify-center text-[10px]">📐</div>
                    <div>
                      <div className="font-semibold text-xs text-white">Infinite Tactical Grid</div>
                      <div className="text-[10px] text-slate-400">Slate grey infinite square coordinates</div>
                    </div>
                  </div>
                  {bgTheme === 'tactical_grey_grid' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>

                <button
                  onClick={() => selectBgTheme('void_grid')}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    bgTheme === 'void_grid'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#050813] border border-cyan-400/50 flex items-center justify-center text-[10px]">🚀</div>
                    <div>
                      <div className="font-semibold text-xs text-white">Void + Grid</div>
                      <div className="text-[10px] text-slate-400">Classic nebula with tactical grid</div>
                    </div>
                  </div>
                  {bgTheme === 'void_grid' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>

                <button
                  onClick={() => selectBgTheme('blueprint_light')}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    bgTheme === 'blueprint_light'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#f8fafc] border border-slate-400 flex items-center justify-center text-[10px]">☀️</div>
                    <div>
                      <div className="font-semibold text-xs text-white">Daylight Blueprint</div>
                      <div className="text-[10px] text-slate-400">Clean high-contrast grid</div>
                    </div>
                  </div>
                  {bgTheme === 'blueprint_light' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleFit}
            className="p-2 rounded-lg hover:bg-cyan-950/60 text-gray-300 hover:text-cyan-300 transition-colors"
            title="Fit to Screen (Reset Zoom)"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenterOnPilot}
            className="p-2 rounded-lg hover:bg-cyan-950/60 text-cyan-400 hover:text-cyan-300 transition-colors"
            title="Center on Active Pilot (J103955)"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-cyan-950/60 text-cyan-300 hover:text-white transition-colors"
            title="Toggle True Fullscreen (Fills entire monitor)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* 4. SYSTEM INSPECTOR DRAWER (Collapsible Right Side) */}
        {/* Floating GalaxyFinder Hubs, Timers & zKill Feed (Bottom-Right Apple Frosted Glass Panel) */}
        {!showInspector && (
          <div className={`canvas-control absolute bottom-4 right-4 z-20 w-80 backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden font-sans text-xs transition-all ${
            isDark ? 'bg-[#161c28]/90 border-white/10 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'
          }`}>
            {/* Top 3-Way Tab Switcher */}
            <div className={`p-2 border-b flex items-center justify-between ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
              <div className={`flex items-center p-0.5 rounded-full border text-[10px] font-medium ${
                isDark ? 'bg-black/40 border-white/10' : 'bg-slate-200/60 border-slate-300'
              }`}>
                <button
                  onClick={() => setFloatingTab('hubs')}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    floatingTab === 'hubs' 
                      ? isDark ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm' : 'bg-white text-slate-900 font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hubs
                </button>
                <button
                  onClick={() => setFloatingTab('timers')}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    floatingTab === 'timers' 
                      ? isDark ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm' : 'bg-white text-slate-900 font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Timers ({(mapState.timers || []).length})
                </button>
                <button
                  onClick={() => setFloatingTab('zkill')}
                  className={`px-2 py-0.5 rounded-full transition-all flex items-center gap-1 ${
                    floatingTab === 'zkill' 
                      ? isDark ? 'bg-red-500/20 text-red-300 font-semibold shadow-sm' : 'bg-white text-red-700 font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Skull className="w-2.5 h-2.5 text-red-400" />
                  <span>zKill ({selectedSystemKills.length})</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">
                {selectedSystem?.name || 'Jita'}
              </span>
            </div>

            {/* TAB 1: TRADE HUBS */}
            {floatingTab === 'hubs' && (
              <div className="p-3 space-y-1">
                {tradeHubRoutes.map(hub => {
                  const hasPath = hub.jumps !== null;
                  return (
                    <div 
                      key={hub.hubName}
                      onClick={() => {
                        if (hasPath) {
                          setSelectedSystemId(hub.hubName);
                          centerOnSystem(hub.hubName);
                        }
                      }}
                      className={`flex items-center justify-between px-2.5 py-1 rounded-xl transition-colors ${
                        hasPath 
                          ? isDark ? 'hover:bg-white/5 cursor-pointer text-slate-200' : 'hover:bg-slate-100 cursor-pointer text-slate-800' 
                          : 'text-slate-500'
                      }`}
                    >
                      <span className="font-semibold text-xs">{hub.hubName}</span>
                      <span className={`font-semibold tabular-nums text-xs ${hasPath ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {hasPath ? `${hub.jumps} J` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: TIMERS */}
            {floatingTab === 'timers' && (
              <div className="p-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-semibold text-slate-300">Structure Timers</span>
                  <button
                    onClick={() => setIsTimerModalOpen(true)}
                    className="p-1 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                    title="Create Structure Timer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2">
                  {(!mapState.timers || mapState.timers.length === 0) ? (
                    <div className="py-3 text-center text-slate-400 text-[10px] font-medium">
                      No active timers in chain.
                      <button
                        onClick={() => setIsTimerModalOpen(true)}
                        className="block mx-auto mt-1 text-cyan-400 hover:underline text-[10px] font-semibold"
                      >
                        + Add Timer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {mapState.timers.map(timer => {
                        const rem = formatTimeRemaining(timer.vulnerableTime);
                        const stageColor = timer.timerType === 'Hull' ? 'text-red-400 border-red-500/40 bg-red-950/40' :
                                           timer.timerType === 'Armor' ? 'text-amber-400 border-amber-500/40 bg-amber-950/40' :
                                           'text-blue-400 border-blue-500/40 bg-blue-950/40';

                        return (
                          <div 
                            key={timer.id}
                            className={`p-2 rounded-xl border transition-all flex items-center justify-between ${
                              isDark ? 'bg-white/5 border-white/5 hover:border-cyan-500/40' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div 
                              className="cursor-pointer min-w-0 flex-1 pr-1.5"
                              onClick={() => {
                                setSelectedSystemId(timer.systemName);
                                centerOnSystem(timer.systemName);
                              }}
                            >
                              <div className="flex items-center gap-1.5 leading-tight">
                                <span className="font-semibold text-xs truncate">{timer.name}</span>
                                <span className={`text-[8.5px] px-1 py-0.2 rounded border font-bold uppercase ${stageColor}`}>
                                  {timer.timerType}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                                {timer.systemName} • {timer.structureType}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                mapperService.deleteStructureTimer(timer.id);
                              }}
                              className="p-1 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete timer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: LIVE ZKILLBOARD FEED AT A GLANCE */}
            {floatingTab === 'zkill' && (
              <div className="p-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      {selectedSystem?.name || activeSystem?.name || 'System'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                      (selectedSystem?.name && systemThreatMap[selectedSystem.name]?.threat === 'Extreme Danger') ? 'bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse' :
                      (selectedSystem?.name && systemThreatMap[selectedSystem.name]?.threat === 'Active Hunters') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                      (selectedSystem?.name && systemThreatMap[selectedSystem.name]?.threat === 'Low Risk') ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {(selectedSystem?.name && systemThreatMap[selectedSystem.name]?.threat) || 'Quiet'}
                    </span>
                  </div>

                  <a
                    href={`https://zkillboard.com/system/${encodeURIComponent(selectedSystem?.name || activeSystem?.name || 'Jita')}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                    title="Open on zKillboard"
                  >
                    <span>zKill</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="pt-2">
                  {selectedSystemKillsLoading ? (
                    <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating zKill...</span>
                    </div>
                  ) : selectedSystemKills.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <span className="text-emerald-400 font-semibold block text-[11px] mb-0.5">Quiet Space</span>
                      0 kills in past 24h. Safe to jump.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {selectedSystemKills.map(kill => {
                        const iskFormatted = kill.totalValue >= 1e9
                          ? `${(kill.totalValue / 1e9).toFixed(2)}B ISK`
                          : `${(kill.totalValue / 1e6).toFixed(1)}M ISK`;

                        return (
                          <a
                            key={kill.killmailId}
                            href={kill.zkillUrl || `https://zkillboard.com/kill/${kill.killmailId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-black/40 hover:bg-white/5 border border-white/5 hover:border-red-500/50 flex items-center justify-between gap-2 transition-all group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {kill.victim.shipTypeId ? (
                                <img
                                  src={`https://images.evetech.net/types/${kill.victim.shipTypeId}/render?size=64`}
                                  alt={kill.victim.shipTypeName}
                                  className="w-7 h-7 rounded-lg border border-white/10 object-cover bg-black/80 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-center shrink-0">
                                  <Skull className="w-3.5 h-3.5 text-red-400" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1 leading-tight">
                                <div className="text-[11px] font-bold text-white group-hover:text-red-300 truncate">
                                  {kill.victim.shipTypeName}
                                </div>
                                <div className="text-[9.5px] text-slate-400 truncate">
                                  <span className="text-red-400 mr-0.5">⚔️</span>
                                  {kill.finalBlow.characterName}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 leading-tight">
                              <div className="text-[10.5px] font-bold text-amber-400 tabular-nums">
                                {iskFormatted}
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono">
                                {kill.killmailTime.slice(0, 5)} EVE
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Structure Timer Modal */}
        <StructureTimerModal
          isOpen={isTimerModalOpen}
          defaultSystem={selectedSystem?.name || 'Jita'}
          initialName={timerModalPrefill?.name || ''}
          initialStructureType={timerModalPrefill?.type || 'Astrahus'}
          availableSystems={Object.keys(mapState.systems)}
          onClose={() => {
            setIsTimerModalOpen(false);
            setTimerModalPrefill(null);
          }}
        />

        {/* Pilot Login Modal */}
        <PilotLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={(profile) => {
            mapperService.setPilotLocation(profile.characterName, selectedSystem?.id || 'J103955');
          }}
        />

        {/* Signature & Connection Editor Modal */}
        {isConnModalOpen && selectedConnection && (
          <SignaturePromptModal
            isOpen={isConnModalOpen}
            fromSystem={selectedConnection.from}
            toSystem={selectedConnection.to}
            initialSig={selectedConnection.sigFrom || ''}
            initialType={selectedConnection.wormholeType || 'K162'}
            initialMass={selectedConnection.massStatus || 'stable'}
            initialTime={selectedConnection.timeStatus || 'stable'}
            initialTactical={selectedConnection.tactical || 'clear'}
            initialIsFrig={selectedConnection.isFrig || false}
            connectionId={selectedConnection.id}
            onClose={() => {
              setIsConnModalOpen(false);
              setSelectedConnection(null);
            }}
          />
        )}
      </div>

      {/* Integrated Bottom Intel Deck (D-Scan Radar, Probe Scanner / Signatures, Structures) */}
      <IntegratedIntelDeck
        selectedSystem={selectedSystem}
        theme={theme}
        onLinkWormhole={(sig) => {
          const target = window.prompt(`Link Wormhole signature [${sig.sigId}] (${sig.name || 'Wormhole'}) to destination system:`, '');
          if (target && target.trim()) {
            mapperService.addSystemConnection(
              selectedSystem.id,
              target.trim(),
              sig.name?.includes('K162') ? 'K162' : 'Wormhole',
              sig.sigId
            );
          }
        }}
      />
        </div>

        {/* RIGHT COLUMN: FULL-HEIGHT SYSTEM INSPECTOR (GOES ALL THE WAY DOWN TO THE BOTTOM OF THE SCREEN!) */}
        {showInspector && selectedSystem && (
          <aside onWheel={(e) => e.stopPropagation()} className={`w-84 xl:w-96 border-l h-full flex flex-col flex-shrink-0 z-30 overflow-hidden select-text text-xs transition-all ${isDark ? "bg-[#0a0f1d] border-white/10 text-slate-200 shadow-2xl" : "bg-white border-slate-200 text-slate-800 shadow-xl"}`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {/* Header */}
              <div className="pb-3 mb-3 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    SYSTEM INSPECTOR
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {selectedSystem.name}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-cyan-700/60 bg-cyan-950/80 text-cyan-300 uppercase">
                        {selectedSystem.systemClass}
                      </span>
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedSystem.name);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 1500);
                      }}
                      className="p-1 rounded text-gray-400 hover:text-cyan-300 hover:bg-cyan-950 transition-colors"
                      title="Copy system name to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowInspector(false)}
                  className="text-gray-500 hover:text-gray-300 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* GalaxyFinder System Effect Banner */}
              {selectedSystem.effect && WH_SYSTEM_EFFECTS[selectedSystem.effect] && (
                <div 
                  className="mb-3 p-2.5 rounded-xl border bg-black/40 backdrop-blur-sm"
                  style={{ borderColor: WH_SYSTEM_EFFECTS[selectedSystem.effect].color + '60' }}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: WH_SYSTEM_EFFECTS[selectedSystem.effect].color }}>
                    <Zap className="w-3.5 h-3.5" />
                    <span>{WH_SYSTEM_EFFECTS[selectedSystem.effect].effect}</span>
                  </div>
                  <div className="text-[10px] text-gray-300 mt-1 leading-relaxed">
                    {WH_SYSTEM_EFFECTS[selectedSystem.effect].desc}
                  </div>
                </div>
              )}

              {/* GalaxyFinder Trade Hub Navigator */}
              <div className="mb-3 p-3 bg-[#070b14] border border-blue-900/40 rounded-xl space-y-2">
                <div className="text-[10px] text-blue-400 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5" />
                    <span>Trade Hub Navigator</span>
                  </span>
                  <span className="text-gray-500 text-[9px] font-mono">GalaxyFinder BFS</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {tradeHubRoutes.map(hub => {
                    const hasPath = hub.jumps !== null;
                    return (
                      <div
                        key={hub.hubName}
                        onClick={() => {
                          if (hasPath && hub.path.length > 0) {
                            setSelectedSystemId(hub.hubName);
                            centerOnSystem(hub.hubName);
                          }
                        }}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          hasPath
                            ? 'bg-[#0d1629] border-blue-500/40 hover:border-blue-400 cursor-pointer text-white shadow-sm'
                            : 'bg-[#060a12] border-gray-800 text-gray-500 cursor-default'
                        }`}
                        title={hasPath ? `Route: ${hub.path.join(' -> ')}` : `No connection to ${hub.hubName} in current chain`}
                      >
                        <div className="flex items-center justify-between leading-none mb-1">
                          <span className="font-bold text-xs">{hub.hubName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            hasPath ? 'bg-blue-950 text-blue-300 border border-blue-700/60' : 'bg-gray-900 text-gray-600'
                          }`}>
                            {hasPath ? `${hub.jumps} J` : 'None'}
                          </span>
                        </div>
                        {hasPath && hub.path.length > 1 && (
                          <div className="text-[9px] text-gray-400 truncate font-mono">
                            via {hub.path[1]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Structure Timers in Selected System */}
              <div className="mb-3 p-3 bg-[#070b14] border border-amber-900/40 rounded-xl space-y-2">
                <div className="text-[10px] text-amber-400 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hourglass className="w-3.5 h-3.5" />
                    <span>Structure Timers ({mapperService.getSystemTimers(selectedSystem.name).length})</span>
                  </span>
                  <button
                    onClick={() => setIsTimerModalOpen(true)}
                    className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/50 flex items-center gap-1 text-[9px] font-bold transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>

                {mapperService.getSystemTimers(selectedSystem.name).length === 0 ? (
                  <div className="p-2 text-center text-gray-500 text-[10px]">
                    No active structure timers in {selectedSystem.name}.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {mapperService.getSystemTimers(selectedSystem.name).map(timer => {
                      const rem = formatTimeRemaining(timer.vulnerableTime);
                      const stageColor = timer.timerType === 'Hull' ? 'text-red-400 border-red-500/40 bg-red-950/40' :
                                         timer.timerType === 'Armor' ? 'text-amber-400 border-amber-500/40 bg-amber-950/40' :
                                         'text-blue-400 border-blue-500/40 bg-blue-950/40';

                      return (
                        <div key={timer.id} className="p-2 rounded-lg bg-[#0d1220] border border-gray-800 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 leading-tight">
                              <span className="font-bold text-white text-[11px] truncate">{timer.name}</span>
                              <span className={`text-[8.5px] px-1 py-0.2 rounded border font-bold uppercase ${stageColor}`}>
                                {timer.timerType}
                              </span>
                            </div>
                            <div className="text-[10px] mt-0.5">
                              <span className={rem.isUrgent ? 'text-red-400 font-bold animate-pulse' : 'text-amber-300'}>
                                {rem.text}
                              </span>
                              <span className="text-gray-500 text-[9px] ml-1.5 font-mono">
                                ({new Date(timer.vulnerableTime).toISOString().replace('T', ' ').slice(0, 16)} EVE)
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => mapperService.deleteStructureTimer(timer.id)}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-950/40"
                            title="Delete timer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* zKillboard Activity in Selected System (Live Feed at a Glance) */}
              <div className="mb-3 p-3 bg-[#0a0e1a]/95 border border-red-900/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                    <Skull className="w-4 h-4 text-red-400" />
                    <span>Live zKillboard Feed</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    (selectedSystem?.name && systemThreatMap[selectedSystem.name]?.threat === 'Extreme Danger') ? 'bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse' :
                    (selectedSystem?.name && systemThreatMap[selectedSystem.name]?.threat === 'Active Hunters') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                    (selectedSystem?.name && systemThreatMap[selectedSystem.name]?.threat === 'Low Risk') ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {(selectedSystem?.name && systemThreatMap[selectedSystem.name]?.threat) || 'Quiet'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-white/5">
                  <span className="font-sans">
                    {(selectedSystem?.name && systemThreatMap[selectedSystem.name]?.kills24h) || 0} kills in 24h
                  </span>
                  <a
                    href={`https://zkillboard.com/system/${encodeURIComponent(selectedSystem?.name || '')}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                  >
                    <span>View System</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Kills List */}
                {selectedSystemKillsLoading ? (
                  <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking live zKillboard...</span>
                  </div>
                ) : selectedSystemKills.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-500">
                    <span className="text-emerald-400 font-semibold block text-[11px] mb-0.5">Quiet Space</span>
                    0 kills in past 24h. No active hunter activity.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {selectedSystemKills.map(kill => {
                      const iskFormatted = kill.totalValue >= 1e9
                        ? `${(kill.totalValue / 1e9).toFixed(2)}B ISK`
                        : `${(kill.totalValue / 1e6).toFixed(1)}M ISK`;

                      return (
                        <a
                          key={kill.killmailId}
                          href={kill.zkillUrl || `https://zkillboard.com/kill/${kill.killmailId}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-black/40 hover:bg-white/5 border border-white/5 hover:border-red-500/50 flex items-center justify-between gap-2 transition-all group"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {kill.victim.shipTypeId ? (
                              <img
                                src={`https://images.evetech.net/types/${kill.victim.shipTypeId}/render?size=64`}
                                alt={kill.victim.shipTypeName}
                                className="w-7 h-7 rounded-lg border border-white/10 object-cover bg-black/80 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-center shrink-0">
                                <Skull className="w-3.5 h-3.5 text-red-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1 leading-tight">
                              <div className="text-[11px] font-bold text-white group-hover:text-red-300 truncate">
                                {kill.victim.shipTypeName}
                              </div>
                              <div className="text-[9.5px] text-slate-400 truncate">
                                <span className="text-red-400 mr-0.5">⚔️</span>
                                {kill.finalBlow.characterName} ({kill.finalBlow.shipTypeName || 'Ship'})
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 leading-tight">
                            <div className="text-[10.5px] font-bold text-amber-400 tabular-nums">
                              {iskFormatted}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              {kill.killmailTime.slice(0, 5)} EVE
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Node Actions: Fold / Compress & Delete */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => mapperService.toggleSystemCollapse(selectedSystem.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                    selectedSystem.isCollapsed
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-gray-900/90 hover:bg-gray-800 text-gray-200 border-gray-700'
                  }`}
                  title={selectedSystem.isCollapsed ? 'Click to expand folded branch' : 'Click to compress / fold this branch'}
                >
                  {selectedSystem.isCollapsed ? (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      <span>Expand Branch</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      <span>Fold Branch</span>
                    </>
                  )}
                </button>

                {selectedSystem.id !== 'Jita' ? (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete system "${selectedSystem.name}" and all its connections from the chain map?`)) {
                        mapperService.deleteSystem(selectedSystem.id);
                      }
                    }}
                    className="py-2 px-3 rounded-xl border border-red-500/40 bg-red-950/40 hover:bg-red-900/50 text-red-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    title="Permanently remove this system from the map"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete System</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-gray-500 font-mono flex items-center justify-center py-2 border border-gray-800 rounded-xl">
                    Root Hub (Locked)
                  </div>
                )}
              </div>

              {/* Live Fleet Member Tracking (Automatic Real-Time Presence) */}
              <div className="bg-[#070b14] border border-cyan-900/40 rounded-2xl p-3.5 mb-3 space-y-2.5">
                <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Fleet Member Tracking</span>
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>LIVE AUTOTRACK</span>
                  </div>
                </div>

                {/* List of Fleet Members in THIS Selected System */}
                {selectedSystem.activePilots && selectedSystem.activePilots.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSystem.activePilots.map((pilotName, idx) => {
                      const isMe = currentPilot && pilotName.toLowerCase().includes(currentPilot.characterName.toLowerCase());
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            isMe
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-purple-500/10 border-purple-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isMe && currentPilot?.avatarUrl ? (
                              <img
                                src={currentPilot.avatarUrl}
                                alt={currentPilot.characterName}
                                className="w-8 h-8 rounded-lg border border-emerald-400 object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-400/50 flex items-center justify-center font-bold text-xs text-purple-300 flex-shrink-0">
                                {pilotName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 leading-tight">
                              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                                <span>{pilotName}</span>
                                {isMe && (
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-emerald-300/80 truncate">
                                {isMe && currentPilot?.corporationTicker
                                  ? `[${currentPilot.corporationTicker}]`
                                  : isMe && currentPilot?.corporationName
                                  ? currentPilot.corporationName
                                  : 'Active Fleet Scout'}
                                {isMe && currentPilot?.activeShip ? ` • ${currentPilot.activeShip}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm flex-shrink-0 ${
                            isMe
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              : 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>IN SYSTEM</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-2 text-center bg-black/40 rounded-xl border border-white/5">
                    No fleet members currently in <strong className="text-white">{selectedSystem.name}</strong>
                  </div>
                )}

                {/* If Logged In, but In a Different System, show where you actually are with a 1-click jump button */}
                {currentPilot && activeSystem && activeSystem.id !== selectedSystem.id && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs mt-1 animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={currentPilot.avatarUrl}
                        alt={currentPilot.characterName}
                        className="w-7 h-7 rounded border border-cyan-400 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 leading-tight">
                        <span className="text-[10px] text-slate-400 block">Your Live Location:</span>
                        <span className="font-bold text-cyan-300 truncate block">
                          {activeSystem.name} {currentPilot.activeShip ? `(${currentPilot.activeShip})` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSystemId(activeSystem.id);
                        centerOnSystem(activeSystem.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                      title={`Jump camera to ${activeSystem.name}`}
                    >
                      <span>Jump to System</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {!currentPilot && (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer mt-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Sign In to Enable Live Autotracking</span>
                  </button>
                )}
              </div>

              {/* IN-DEPTH TACTICAL STRUCTURES DOSSIER (On the side, just like zKillboard!) */}
              <div className="mb-3 p-3 bg-[#0a0e1a]/95 border border-purple-900/40 rounded-2xl space-y-2.5 select-text">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>Tactical Structures</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-purple-950/80 border border-purple-800 text-purple-300 ml-1">
                      {selectedSystem.structures?.length || 0}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAddingStructure(!isAddingStructure)}
                    className="px-2 py-0.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-[10px] font-bold text-purple-300 flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Category Filter Pills */}
                {selectedSystem.structures && selectedSystem.structures.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] custom-scrollbar">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'citadel', label: 'Citadels' },
                      { id: 'industry', label: 'Industry' },
                      { id: 'poco', label: 'POCO/POS' },
                      { id: 'deployable', label: 'Deployables' }
                    ].map(f => {
                      const count = f.id === 'all' 
                        ? selectedSystem.structures.length 
                        : selectedSystem.structures.filter(s => getStructureInfo(s.type).cat === f.id).length;
                      if (f.id !== 'all' && count === 0) return null;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setStructureFilter(f.id as any)}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                            structureFilter === f.id 
                              ? 'bg-purple-500 text-black shadow-sm font-bold' 
                              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {f.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Inline Add Structure Form */}
                {isAddingStructure && (
                  <div className="p-2.5 rounded-xl bg-black/60 border border-purple-800/60 space-y-2 text-xs">
                    <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                      Log New Structure in {selectedSystem.name}
                    </div>
                    <input
                      type="text"
                      placeholder="Structure Name (e.g. Freeport Laboratory)..."
                      value={newStructName}
                      onChange={(e) => setNewStructName(e.target.value)}
                      className="w-full bg-black/80 border border-gray-800 rounded px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newStructType}
                        onChange={(e) => setNewStructType(e.target.value)}
                        className="bg-black/80 border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                      >
                        <option value="Astrahus">Astrahus (Medium Citadel)</option>
                        <option value="Fortizar">Fortizar (Large Citadel)</option>
                        <option value="Keepstar">Keepstar (XL Citadel)</option>
                        <option value="Raitaru">Raitaru (Engineering)</option>
                        <option value="Azbel">Azbel (Large EC)</option>
                        <option value="Sotiyo">Sotiyo (XL EC)</option>
                        <option value="Athanor">Athanor (Refinery)</option>
                        <option value="Tatara">Tatara (Large Refinery)</option>
                        <option value="Customs Office">Customs Office (POCO)</option>
                        <option value="Starbase (POS)">Starbase (POS)</option>
                        <option value="Mobile Depot">Mobile Depot</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Distance (e.g. 5.2 AU)"
                        value={newStructDistance}
                        onChange={(e) => setNewStructDistance(e.target.value)}
                        className="bg-black/80 border border-gray-800 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setIsAddingStructure(false)}
                        className="px-2.5 py-1 rounded text-[11px] text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!newStructName.trim()) return;
                          await mapperService.addSingleStructure(selectedSystem.id, {
                            name: newStructName.trim(),
                            type: newStructType,
                            distance: newStructDistance.trim() || 'Grid'
                          });
                          setNewStructName('');
                          setIsAddingStructure(false);
                        }}
                        disabled={!newStructName.trim()}
                        className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 text-white font-bold text-xs transition-all shadow-sm"
                      >
                        Save Structure
                      </button>
                    </div>
                  </div>
                )}

                {/* Structures List */}
                {(!selectedSystem.structures || selectedSystem.structures.length === 0) ? (
                  <div className="p-3 text-center text-gray-500 bg-[#070b14] border border-gray-800/80 rounded-xl text-[11px] font-sans">
                    <Building2 className="w-5 h-5 mx-auto mb-1.5 text-purple-400/50" />
                    <div>No structures scouted in {selectedSystem.name} yet.</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      In-game D-Scan (<kbd className="px-1 rounded bg-gray-800 text-cyan-300">Ctrl+C</kbd>) automatically logs citadels and refineries!
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedSystem.structures
                      .filter(s => structureFilter === 'all' || getStructureInfo(s.type).cat === structureFilter)
                      .map((s) => {
                        const info = getStructureInfo(s.type);
                        const isCopied = copiedStructId === s.id;
                        return (
                          <div 
                            key={s.id} 
                            className="p-2.5 rounded-xl bg-black/40 hover:bg-white/5 border border-white/5 hover:border-purple-500/40 transition-all space-y-1.5 group"
                          >
                            {/* Top row: Type Icon + Name + Distance */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <img
                                  src={`https://images.evetech.net/types/${info.typeId}/render?size=64`}
                                  alt={s.type}
                                  className="w-7 h-7 rounded-lg border border-white/10 object-cover bg-black/80 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="min-w-0 flex-1 leading-tight">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-[11.5px] truncate group-hover:text-purple-300">
                                      {s.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[8.5px] px-1 py-0.2 rounded border font-bold uppercase ${info.badgeColor}`}>
                                      {info.role}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{s.type}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-amber-300 font-bold text-xs">{s.distance}</span>
                              </div>
                            </div>

                            {/* Middle row: Tactical Profile & Tethering */}
                            <div className="flex items-center justify-between text-[9.5px] pt-1 border-t border-white/5 text-gray-400 font-mono">
                              <div className="flex items-center gap-1.5">
                                {info.isUpwell ? (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    Tethering Active
                                  </span>
                                ) : (
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                    Anchored
                                  </span>
                                )}
                                <span>•</span>
                                <span>{s.scoutedBy || 'Fleet'} @ {s.timestamp}</span>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setTimerModalPrefill({
                                      name: s.name,
                                      type: (info.role.includes('Citadel') ? 'Astrahus' : info.role.includes('Refinery') ? 'Athanor' : 'Raitaru') as any
                                    });
                                    setIsTimerModalOpen(true);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 text-[9px] font-bold"
                                  title="Add vulnerability timer for this structure"
                                >
                                  <Hourglass className="w-2.5 h-2.5 text-amber-400" />
                                  <span>Timer</span>
                                </button>

                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(s.name);
                                    setCopiedStructId(s.id);
                                    setTimeout(() => setCopiedStructId(null), 1500);
                                  }}
                                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                                  title="Copy structure name to clipboard"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>

                                <button
                                  onClick={() => mapperService.deleteScannedStructure(selectedSystem.id, s.id)}
                                  className="p-1 rounded bg-white/5 hover:bg-red-950/60 text-gray-400 hover:text-red-400"
                                  title="Remove structure from list"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Connected Wormholes & Signatures */}
              <div className="space-y-2 mb-3">
                <div className="text-[11px] font-bold text-gray-300 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    Wormhole Connections
                  </span>
                </div>

                {(() => {
                  const conns = mapState.connections.filter(c => c.from === selectedSystem.id || c.to === selectedSystem.id);
                  if (conns.length === 0) {
                    return (
                      <div className="p-2.5 text-center text-gray-500 bg-[#070b14] border border-gray-800/80 rounded-xl text-[11px]">
                        No active connections.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-1.5">
                      {conns.map(c => {
                        const otherSys = c.from === selectedSystem.id ? c.to : c.from;
                        return (
                          <div 
                            key={c.id} 
                            onClick={() => {
                              setSelectedConnection(c);
                              setIsConnModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-[#070b14] hover:bg-[#0c1424] border border-gray-800 hover:border-cyan-500/50 flex items-center justify-between cursor-pointer transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-xs">{otherSys}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-mono">
                                {c.sigFrom ? `[${c.sigFrom}]` : (c.wormholeType || 'WH')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {c.massStatus && c.massStatus !== 'stable' && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  c.massStatus === 'critical' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}>
                                  {c.massStatus}
                                </span>
                              )}
                              <span className="text-[10px] text-cyan-400 group-hover:underline">Edit</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Quick Connect to Existing System on Map */}
              <div className="bg-[#070b14] border border-gray-800/80 rounded-xl p-3 mb-2.5">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-2 flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-emerald-400" />
                  Connect {selectedSystem.name} to System on Map
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={quickConnectTarget}
                    onChange={(e) => setQuickConnectTarget(e.target.value)}
                    className="bg-black/80 border border-gray-800 focus:border-cyan-500 rounded px-2 py-1.5 text-xs text-white focus:outline-none flex-1 font-mono cursor-pointer"
                  >
                    <option value="">Select target system...</option>
                    {Object.values(mapState.systems)
                      .filter(s => s.id !== selectedSystem.id)
                      .map(s => {
                        const isConnected = mapState.connections.some(
                          c => (c.from === selectedSystem.id && c.to === s.id) || (c.from === s.id && c.to === selectedSystem.id)
                        );
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.systemClass}) {isConnected ? '✓ Linked' : ''}
                          </option>
                        );
                      })
                    }
                  </select>
                  <select
                    value={quickConnectType}
                    onChange={(e) => setQuickConnectType(e.target.value)}
                    className="bg-black/80 border border-gray-800 focus:border-cyan-500 rounded px-1.5 py-1.5 text-xs text-cyan-300 focus:outline-none w-24 font-mono cursor-pointer"
                  >
                    <option value="Wormhole">Wormhole</option>
                    <option value="Stargate">Stargate</option>
                  </select>
                  <button
                    onClick={() => {
                      if (quickConnectTarget) {
                        mapperService.addWormholeConnection(selectedSystem.id, quickConnectTarget, quickConnectType);
                        setQuickConnectTarget('');
                      }
                    }}
                    disabled={!quickConnectTarget}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Link
                  </button>
                </div>
              </div>

              {/* Add New Child Wormhole Form */}
              <div className="bg-[#070b14] border border-gray-800/80 rounded-xl p-3">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-2 flex items-center gap-1">
                  <Plus className="w-3 h-3 text-cyan-400" />
                  Link New System by Name
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSystemInput}
                    onChange={(e) => setNewSystemInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddConnection()}
                    placeholder="System (e.g. Veisto or J152438)"
                    className="bg-black/80 border border-gray-800 focus:border-cyan-500 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none flex-1 font-mono"
                  />
                  <input
                    type="text"
                    value={whTypeInput}
                    onChange={(e) => setWhTypeInput(e.target.value)}
                    placeholder="K162"
                    className="bg-black/80 border border-gray-800 focus:border-cyan-500 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none w-16 font-mono"
                  />
                  <button
                    onClick={handleAddConnection}
                    disabled={!newSystemInput.trim()}
                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-black font-bold text-xs transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 mt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
              <button
                onClick={() => {
                  if (window.confirm("Prune all disconnected / dead-end systems from the map?")) {
                    mapperService.pruneDeadEnds();
                  }
                }}
                className="hover:text-amber-400 flex items-center gap-1 transition-colors font-mono"
                title="Prune dead-end disconnected systems"
              >
                <span>Prune Inactive</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm("Reset entire chain map back to defaults?")) {
                    mapperService.clearMap();
                  }
                }}
                className="hover:text-red-400 flex items-center gap-1 transition-colors"
                title="Reset Entire Chain Map"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset Map</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Wireless Clipboard Manual Scan Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 font-sans ${
            isDark ? 'bg-[#121622] border-purple-500/30 text-white shadow-[0_12px_48px_rgba(0,0,0,0.85)]' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Wireless Clipboard Bridge</h3>
                  <p className="text-[11px] text-slate-400">Share D-Scan, Cosmic Signatures, or Systems wirelessly with fleet</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
              In EVE Online, copy any <strong className="text-purple-300">D-Scan window</strong> (Ctrl+A, Ctrl+C), <strong className="text-cyan-300">Probe Scanner signatures</strong>, or <strong className="text-emerald-300">System Name</strong>. Paste below to broadcast to all connected fleet members:
            </p>

            <textarea
              value={manualPasteText}
              onChange={(e) => setManualPasteText(e.target.value)}
              placeholder="Paste EVE clipboard text here (Ctrl+V)..."
              rows={6}
              className="w-full bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-400 resize-none mb-4"
              autoFocus
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                OS Auto-Listener Active
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (manualPasteText.trim()) {
                      import('../services/scoutWatcher').then(({ scoutWatcher }) => {
                        scoutWatcher.evaluateText(manualPasteText.trim(), 'dscan_paste');
                      });
                      setManualPasteText('');
                      setIsPasteModalOpen(false);
                    }
                  }}
                  disabled={!manualPasteText.trim()}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
                >
                  Broadcast Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ship Fittings Window Modal */}
      <ShipFittingsModal
        isOpen={isFittingModalOpen}
        onClose={() => setIsFittingModalOpen(false)}
        theme={theme}
      />
    </div>
  );
};
