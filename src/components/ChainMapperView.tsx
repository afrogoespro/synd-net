import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Network, Compass, Building2, Users, Plus, Trash2, 
  Check, Share2, ZoomIn, ZoomOut, Maximize2, Crosshair,
  User, MapPin, Eye, Radio, ExternalLink, Layers, Sparkles, KeyRound, LogOut,
  Sun, Moon, ChevronDown, ChevronRight, FolderTree, GitFork, Copy, Route, Navigation, Zap,
  Clock, Hourglass, Skull, ShieldAlert
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
  
  // Canvas Pan & Zoom State
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 20 });
  const [zoom, setZoom] = useState<number>(1.0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeOffset, setNodeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
    });

    const unsubMap = mapperService.subscribe((state) => {
      setMapState({ ...state });
    });

    return () => {
      unsubAuth();
      unsubMap();
    };
  }, []);

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
      const targetX = target.x !== undefined ? target.x : 650;
      const targetY = target.y !== undefined ? target.y : 140;
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: Math.round(rect.width / 2 - targetX * zoom - 68),
        y: Math.round(rect.height / 2 - targetY * zoom - 28)
      });
    }
  };

  // Live GalaxyFinder Follow-Me auto-tracking
  useEffect(() => {
    const unsubJump = mapperService.onJump((jump) => {
      setSelectedSystemId(jump.systemName);
      if (followMe) {
        setTimeout(() => {
          centerOnSystem(jump.systemName);
        }, 100);
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

  // Pan canvas handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background (not a node or button)
    if ((e.target as HTMLElement).closest('.canvas-node') || (e.target as HTMLElement).closest('.canvas-control')) {
      return;
    }
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingNodeId) {
      // Dragging a specific node
      const current = mapState.systems[draggingNodeId];
      if (current) {
        const newX = (e.clientX - pan.x) / zoom - nodeOffset.x;
        const newY = (e.clientY - pan.y) / zoom - nodeOffset.y;
        current.x = Math.round(newX);
        current.y = Math.round(newY);
        setMapState({ ...mapState });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Drag Start
  const handleNodeDragStart = (e: React.MouseEvent, node: WormholeNode) => {
    e.stopPropagation();
    setSelectedSystemId(node.id);
    setDraggingNodeId(node.id);
    const nodeX = node.x || 0;
    const nodeY = node.y || 0;
    const mouseCanvasX = (e.clientX - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - pan.y) / zoom;
    setNodeOffset({
      x: mouseCanvasX - nodeX,
      y: mouseCanvasY - nodeY
    });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.4), 2.2));
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.15, 2.2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.4));
  const handleFit = () => {
    setZoom(1.0);
    setPan({ x: 40, y: 20 });
  };

  const handleCenterOnPilot = () => {
    if (activeSystem && activeSystem.x && activeSystem.y && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - activeSystem.x * zoom - 65,
        y: rect.height / 2 - activeSystem.y * zoom - 27
      });
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

  // Node dimensions
  const NODE_W = 138;
  const NODE_H = 62;

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
        {node.statics && node.statics.length > 0 && (
          <span className="text-[10px] font-mono text-amber-300 font-bold">
            {node.statics[0].startsWith('High') ? 'H' : node.statics[0].startsWith('Low') ? 'L' : node.statics[0]}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className={`flex flex-col w-full h-full min-h-[calc(100vh-64px)] font-mono select-none overflow-hidden relative ${
      isDark ? 'bg-[#04060c] text-gray-200' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* 1. TOP TITLE BAR (Apple macOS Sequoia / VisionOS Frosted Glass Bar) */}
      <div className={`border-b px-4 py-2 flex items-center justify-between text-xs z-20 flex-wrap gap-2.5 backdrop-blur-2xl transition-colors ${
        isDark ? 'bg-[#090d16]/85 border-white/10 text-gray-200 shadow-md shadow-black/30' : 'bg-white/85 border-slate-200/80 text-slate-800 shadow-sm'
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

          {/* Active Fleet in Chain */}
          {allActivePilots.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {allActivePilots.map((p, idx) => {
                const isMe = currentPilot && p.pilotName.toLowerCase().includes(currentPilot.characterName.toLowerCase());
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSystemId(p.systemName)}
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
              onClick={() => mapperService.autoOrganizeTreeLayout()}
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Auto-organize tree layout"
            >
              <FolderTree className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Tidy Tree</span>
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

      {/* 2. MAIN INTERACTIVE VISUAL CANVAS */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 relative overflow-hidden cursor-${isPanning ? 'grabbing' : 'grab'} ${
          isDark 
            ? 'bg-[#040711]' 
            : 'bg-slate-100'
        }`}
        style={{
          backgroundImage: isDark ? `
            radial-gradient(1px 1px at 20px 30px, #ffffff18, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, #38bdf820, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 90px 40px, #ffffff15, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 160px 120px, #818cf820, rgba(0,0,0,0))
          ` : `
            radial-gradient(#94a3b840 1px, transparent 1px)
          `,
          backgroundSize: isDark ? '250px 250px' : '24px 24px'
        }}
      >
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
              {/* Wormhole Glow Filter */}
              <filter id="wh-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {mapState.connections.map((conn) => {
              if (hiddenNodeIds.has(conn.from) || hiddenNodeIds.has(conn.to)) return null;

              const fromSys = mapState.systems[conn.from];
              const toSys = mapState.systems[conn.to];
              if (!fromSys || !toSys) return null;

              const x1 = (fromSys.x || 0) + NODE_W / 2;
              const y1 = (fromSys.y || 0) + NODE_H;
              const x2 = (toSys.x || 0) + NODE_W / 2;
              const y2 = toSys.y || 0;

              const midY = (y1 + y2) / 2;
              const midX = (x1 + x2) / 2;
              const pathData = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;

              const isStargate = conn.wormholeType === 'Stargate';

              // User requirement:
              // Known space (stargates) = green (#22c55e)
              // Wormholes = purple (#c084fc)
              let strokeColor = isStargate ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#c084fc' : '#9333ea');
              let strokeDash: string | undefined = undefined;

              if (!isStargate) {
                if (conn.massStatus === 'critical') {
                  strokeColor = '#f97316'; // Orange / Red Critical
                  strokeDash = '4 3';
                } else if (conn.massStatus === 'destab') {
                  strokeColor = '#eab308'; // Amber Destabilized
                  strokeDash = '6 3';
                } else if (conn.timeStatus === 'eol') {
                  strokeColor = '#f43f5e'; // EOL Crimson/Pink
                  strokeDash = '3 3';
                }
              }

              // Signature label (e.g. TC [ANF], [HMV], K162)
              const sigLabel = conn.sigFrom 
                ? (toSys.systemClass?.startsWith('C') ? `TC [${conn.sigFrom}]` : `[${conn.sigFrom}]`)
                : (conn.wormholeType || 'WH');
              const badgeWidth = Math.max(50, sigLabel.length * 7.5 + 16);

              return (
                <g key={conn.id} className="cursor-pointer group">
                  {/* Invisible wide hit area for easy clicking */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="18"
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConnection(conn);
                      setIsConnModalOpen(true);
                    }}
                  />

                  {/* Background shadow stroke */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="5"
                    strokeOpacity="0.8"
                  />

                  {/* Main Connector Path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isStargate ? '2.5' : '2'}
                    strokeDasharray={strokeDash}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={!isStargate ? 'url(#wh-glow)' : undefined}
                    className="transition-colors group-hover:stroke-cyan-300 pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConnection(conn);
                      setIsConnModalOpen(true);
                    }}
                  />

                  {/* Terminal joint dots for Stargates (Green) */}
                  {isStargate && (
                    <>
                      <circle cx={x1} cy={y1} r="2.5" fill={isDark ? '#22c55e' : '#16a34a'} />
                      <circle cx={x2} cy={y2} r="2.5" fill={isDark ? '#22c55e' : '#16a34a'} />
                    </>
                  )}

                  {/* Midpoint Label Tag for Wormholes (Purple/Colored, clickable to edit characteristics) */}
                  {!isStargate && (
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
                        y="-9"
                        width={badgeWidth}
                        height="18"
                        rx="4"
                        fill="#070c18"
                        stroke={conn.timeStatus === 'eol' ? '#f43f5e' : strokeColor}
                        strokeWidth="1.2"
                        className="group-hover:fill-[#0e172a] group-hover:stroke-cyan-300 transition-all shadow-md"
                      />
                      <text
                        x="0"
                        y="3.5"
                        fill={conn.timeStatus === 'eol' ? '#fda4af' : conn.massStatus === 'critical' ? '#fdba74' : conn.massStatus === 'destab' ? '#fde047' : '#e9d5ff'}
                        fontSize="9.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {sigLabel}
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

          {/* HTML NODE CARDS LAYER */}
          <div className="absolute inset-0 pointer-events-auto">
            {Object.values(mapState.systems).map((node) => {
              if (hiddenNodeIds.has(node.id)) return null;

              const isSelected = node.id === selectedSystem?.id;
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

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeDragStart(e, node)}
                  className="canvas-node absolute cursor-pointer transition-shadow"
                  style={{
                    left: `${node.x || 0}px`,
                    top: `${node.y || 0}px`,
                    width: `${NODE_W}px`,
                    height: `${NODE_H}px`
                  }}
                >
                  {/* Card Container (Apple VisionOS / macOS Sequoia Frosted Glass Node) */}
                  <div
                    className={`w-full h-full rounded-2xl px-3 py-2 flex flex-col justify-between relative transition-all duration-150 backdrop-blur-md ${
                      isActivePlayer
                        ? isDark
                          ? 'bg-[#101a2e]/90 shadow-[0_0_24px_rgba(56,189,248,0.45),0_0_8px_rgba(255,255,255,0.7)] ring-2 ring-white/90'
                          : 'bg-white/95 shadow-[0_0_20px_rgba(2,132,199,0.35)] ring-2 ring-sky-500'
                        : isSelected
                        ? isDark
                          ? 'bg-[#0f172a]/90 shadow-[0_0_16px_rgba(6,182,212,0.3)] ring-1.5 ring-cyan-400'
                          : 'bg-sky-50/95 shadow-md ring-1.5 ring-sky-400'
                        : isDark
                        ? 'bg-[#0c1222]/85 hover:bg-[#10172b] border border-white/10 shadow-lg shadow-black/20'
                        : 'bg-white/90 hover:bg-slate-50 shadow-sm border border-slate-200/80'
                    }`}
                    style={{
                      borderWidth: (isActivePlayer || isSelected) ? '0px' : '1px',
                      borderColor: borderColor
                    }}
                  >
                    {/* Top Row: Security or WH Class + Statics + Fold Control */}
                    <div className="flex items-center justify-between leading-none">
                      {renderSecurityOrClass(node)}
                      
                      <div className="flex items-center gap-1">
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

                    {/* Middle Row: System Name */}
                    <div className="flex items-center justify-between leading-tight mt-0.5">
                      <span className={`text-xs font-bold tracking-tight truncate ${
                        isActivePlayer 
                          ? isDark ? 'text-white' : 'text-slate-950 font-black'
                          : isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {node.name}
                      </span>
                    </div>

                    {/* Bottom Row: Region / Constellation (GalaxyFinder style) */}
                    <div className="text-[9.5px] text-slate-400 font-sans tracking-normal truncate leading-tight mt-0.5">
                      {node.region || (node.systemClass.startsWith('C') ? 'W-Space' : 'Known Space')}
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

        {/* 3. FLOATING CANVAS CONTROLS (Bottom-Left) */}
        <div className="canvas-control absolute bottom-4 left-4 z-20 flex flex-col items-center bg-[#0d1220]/90 backdrop-blur-md border border-gray-800 rounded-xl p-1 shadow-2xl space-y-1">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-cyan-950 text-gray-300 hover:text-cyan-300 transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-cyan-950 text-gray-300 hover:text-cyan-300 transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-4 h-px bg-gray-800"></div>
          <button
            onClick={handleFit}
            className="p-2 rounded-lg hover:bg-cyan-950 text-gray-300 hover:text-cyan-300 transition-colors"
            title="Fit to Screen (Reset Zoom)"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenterOnPilot}
            className="p-2 rounded-lg hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 transition-colors"
            title="Center on Active Pilot (J103955)"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-cyan-950 text-cyan-300 hover:text-white transition-colors"
            title="Toggle True Fullscreen (Fills entire monitor)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* 4. SYSTEM INSPECTOR DRAWER (Collapsible Right Side) */}
        {showInspector && selectedSystem && (
          <div className="canvas-control absolute top-4 right-4 bottom-4 w-80 bg-[#0d1322]/95 backdrop-blur-lg border border-cyan-900/40 rounded-2xl p-4 shadow-2xl flex flex-col justify-between overflow-y-auto z-20 text-xs">
            <div>
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
                    systemThreatMap[selectedSystem.name]?.threat === 'Extreme Danger' ? 'bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse' :
                    systemThreatMap[selectedSystem.name]?.threat === 'Active Hunters' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                    systemThreatMap[selectedSystem.name]?.threat === 'Low Risk' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {systemThreatMap[selectedSystem.name]?.threat || 'Quiet'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-white/5">
                  <span className="font-sans">
                    {systemThreatMap[selectedSystem.name]?.kills24h || 0} kills in 24h
                  </span>
                  <a
                    href={`https://zkillboard.com/system/${selectedSystem.name}/`}
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

              {/* Fleet Pilot Location Control ("I'M HERE") */}
              <div className="bg-[#070b14] border border-cyan-900/40 rounded-xl p-3 mb-3">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-cyan-400 font-mono">
                    <MapPin className="w-3.5 h-3.5" />
                    Fleet Member Tracking
                  </span>
                  <span className="text-gray-500 font-mono">
                    {selectedSystem.activePilots?.length || 0} In System
                  </span>
                </div>

                {currentPilot ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={currentPilot.avatarUrl}
                        alt={currentPilot.characterName}
                        className="w-7 h-7 rounded border border-cyan-400 object-cover"
                      />
                      <div className="leading-tight">
                        <div className="text-white font-bold">{currentPilot.characterName}</div>
                        <div className="text-[10px] text-cyan-300/80">
                          {currentPilot.corporationTicker ? `[${currentPilot.corporationTicker}]` : currentPilot.corporationName}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        mapperService.setPilotLocation(currentPilot.characterName, selectedSystem.id);
                      }}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all whitespace-nowrap"
                      title="Move your pilot marker to this system"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>I'M HERE</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Log in as Pilot to Set Location</span>
                  </button>
                )}

                {selectedSystem.activePilots && selectedSystem.activePilots.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-gray-800/60">
                    {selectedSystem.activePilots.map((p, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-cyan-300 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Scanned Structures */}
              <div className="space-y-2 mb-3">
                <div className="text-[11px] font-bold text-gray-300 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    Structures ({selectedSystem.structures?.length || 0})
                  </span>
                </div>

                {(!selectedSystem.structures || selectedSystem.structures.length === 0) ? (
                  <div className="p-3 text-center text-gray-500 bg-[#070b14] border border-gray-800/80 rounded-xl text-[11px] font-sans">
                    No structures scanned. In-game D-Scan (<kbd className="px-1 rounded bg-gray-800 text-cyan-300">Ctrl+C</kbd>) populates this list automatically!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {selectedSystem.structures.map((s) => (
                      <div key={s.id} className="p-2.5 rounded bg-[#070b14] border border-gray-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-[11px]">{s.type}</div>
                          <div className="text-gray-400 text-[10px] truncate max-w-[140px]">"{s.name}"</div>
                        </div>
                        <span className="text-amber-300 font-bold text-[11px]">{s.distance}</span>
                      </div>
                    ))}
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

              {/* Add New Child Wormhole Form */}
              <div className="bg-[#070b14] border border-gray-800/80 rounded-xl p-3">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-2 flex items-center gap-1">
                  <Plus className="w-3 h-3 text-cyan-400" />
                  Link New Wormhole from {selectedSystem.name}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSystemInput}
                    onChange={(e) => setNewSystemInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddConnection()}
                    placeholder="System (e.g. J152438)"
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
                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-black font-bold text-xs transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
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
          </div>
        )}

        {/* Floating GalaxyFinder Hubs, Timers & zKill Feed (Bottom-Right Apple Frosted Glass Panel) */}
        {!showInspector && (
          <div className={`canvas-control absolute bottom-4 right-4 z-20 w-80 backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden font-sans text-xs transition-all ${
            isDark ? 'bg-[#090d16]/90 border-white/10 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'
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
                      {selectedSystem?.name || 'System'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                      systemThreatMap[selectedSystem.name]?.threat === 'Extreme Danger' ? 'bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse' :
                      systemThreatMap[selectedSystem.name]?.threat === 'Active Hunters' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                      systemThreatMap[selectedSystem.name]?.threat === 'Low Risk' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {systemThreatMap[selectedSystem.name]?.threat || 'Quiet'}
                    </span>
                  </div>

                  <a
                    href={`https://zkillboard.com/system/${selectedSystem.name}/`}
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
          availableSystems={Object.keys(mapState.systems)}
          onClose={() => setIsTimerModalOpen(false)}
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
  );
};
