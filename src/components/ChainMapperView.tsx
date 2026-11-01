import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Network, Compass, Building2, Users, Plus, Trash2, 
  Check, Share2, ZoomIn, ZoomOut, Maximize2, Crosshair,
  User, MapPin, Eye, Radio, ExternalLink, Layers, Sparkles, KeyRound, LogOut,
  Sun, Moon, ChevronDown, ChevronRight, FolderTree, GitFork, Copy, Route, Navigation, Zap
} from 'lucide-react';
import { mapperService } from '../services/mapperService';
import { ChainMapState, WormholeNode, WormholeConnection, WormholeSignature } from '../types/mapper';
import { authService, PilotProfile } from '../services/authService';
import { calculateTradeHubRoutes, findShortestRoute, WH_SYSTEM_EFFECTS, TradeHubRoute } from '../services/routeService';
import { PilotLoginModal } from './PilotLoginModal';
import { SignaturePromptModal } from './SignaturePromptModal';
import { IntegratedIntelDeck } from './IntegratedIntelDeck';

export const ChainMapperView: React.FC = () => {
  const [mapState, setMapState] = useState<ChainMapState>(mapperService.getState());
  const [selectedSystemId, setSelectedSystemId] = useState<string>('J103955');
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
      if (pilot) {
        mapperService.setPilotLocation(pilot.characterName, selectedSystemId);
      }
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
  ) || mapState.systems['J103955'] || selectedSystem;

  // Extract all active pilots across the chain
  const allActivePilots = Object.entries(mapState.systems).flatMap(([sysName, s]) => 
    (s.activePilots || []).map(p => ({ pilotName: p, systemName: sysName }))
  );

  // GalaxyFinder Center on System
  const centerOnSystem = (sysId: string) => {
    const target = mapState.systems[sysId];
    if (target && target.x !== undefined && target.y !== undefined && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: Math.round(rect.width / 2 - target.x * zoom - 68),
        y: Math.round(rect.height / 2 - target.y * zoom - 28)
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
        }, 80);
      }
    });
    return () => unsubJump();
  }, [followMe, zoom, mapState.systems]);

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
  const NODE_W = 136;
  const NODE_H = 56;

  // Format header security / class badge
  const renderSecurityOrClass = (node: WormholeNode) => {
    if (node.systemClass === 'Highsec') {
      const sec = node.security !== undefined ? node.security.toFixed(1) : '1.0';
      return <span className={`font-bold text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{sec}</span>;
    }
    if (node.systemClass === 'Lowsec') {
      const sec = node.security !== undefined ? node.security.toFixed(1) : '0.4';
      return (
        <span className={`font-bold text-xs flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
          <span>{sec}</span>
          {node.sigCode && <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>[{node.sigCode}]</span>}
        </span>
      );
    }
    if (node.systemClass === 'Nullsec') {
      return <span className={`font-bold text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>0.0</span>;
    }
    // Wormhole class (C1 - C6)
    const isTarget = node.id === activeSystem?.id;
    return (
      <span className={`font-bold text-xs flex items-center gap-1 ${isDark ? 'text-cyan-300' : 'text-sky-700'}`}>
        {isTarget && <span className={isDark ? 'text-white text-[10px]' : 'text-sky-900 text-[10px]'}>⊙</span>}
        <span className={isDark ? 'text-cyan-400' : 'text-sky-600 font-extrabold'}>{node.systemClass}</span>
        {node.sigCode && <span className={`text-[10px] font-mono ${isDark ? 'text-cyan-200/90' : 'text-sky-800'}`}>[{node.sigCode}]</span>}
        {node.statics && node.statics.length > 0 && (
          <span className={`text-[10px] font-mono ${isDark ? 'text-amber-300/90' : 'text-amber-600 font-bold'}`}>
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
      
      {/* 1. TOP TITLE BAR (Tripwire / Pathfinder style) */}
      <div className={`border-b px-4 py-2 flex items-center justify-between text-xs z-20 flex-wrap gap-2 ${
        isDark ? 'bg-[#0b0f1a] border-gray-800/80 text-gray-300' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Pilot Identity & EVE SSO Profile */}
          <div className={`flex items-center gap-2 font-bold tracking-wide text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span className="text-cyan-400 text-lg leading-none">≡</span>

            {currentPilot ? (
              <div className={`flex items-center gap-2 rounded-xl px-2.5 py-1 border shadow-sm ${
                isDark 
                  ? 'bg-[#080d1a] border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)] text-white' 
                  : 'bg-sky-50 border-sky-300 text-slate-900'
              }`}>
                <img
                  src={currentPilot.avatarUrl}
                  alt={currentPilot.characterName}
                  className="w-5 h-5 rounded border border-cyan-400 object-cover"
                />
                <span className="font-bold">{currentPilot.characterName}</span>
                {currentPilot.corporationTicker && (
                  <span className={`text-[10px] hidden sm:inline ${isDark ? 'text-cyan-300' : 'text-sky-700 font-semibold'}`}>[{currentPilot.corporationTicker}]</span>
                )}
                <button
                  onClick={() => {
                    mapperService.setPilotLocation(currentPilot.characterName, selectedSystem?.id || 'J103955');
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all whitespace-nowrap ml-1"
                  title={`Move ${currentPilot.characterName} to ${selectedSystem?.name || 'J103955'}`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>I'M IN {selectedSystem?.name || 'J103955'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_14px_rgba(6,182,212,0.35)] transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>SIGN IN PILOT / EVE SSO</span>
              </button>
            )}
          </div>

          <span className="hidden lg:inline-block w-px h-4 bg-gray-700/60"></span>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE SYNC
            </span>
            <span className="text-gray-600">|</span>
            <span>{Object.keys(mapState.systems).length} Systems Mapped</span>
          </div>

          {/* Active Fleet in Chain */}
          {allActivePilots.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pl-2 border-l border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase hidden sm:inline">FLEET:</span>
              {allActivePilots.map((p, idx) => {
                const isMe = currentPilot && p.pilotName.toLowerCase().includes(currentPilot.characterName.toLowerCase());
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSystemId(p.systemName)}
                    className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      isMe 
                        ? 'bg-cyan-950/90 border border-cyan-500/70 text-cyan-200' 
                        : 'bg-purple-950/90 border border-purple-500/70 text-purple-200 hover:border-purple-300'
                    }`}
                    title={`Click to focus on ${p.pilotName} in ${p.systemName}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isMe ? 'bg-cyan-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                    <span>{p.pilotName}</span>
                    <span className="text-[10px] opacity-75 font-mono">@{p.systemName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* GalaxyFinder Follow-Me Mode */}
          <button
            onClick={() => {
              const next = !followMe;
              setFollowMe(next);
              if (next && activeSystem) {
                centerOnSystem(activeSystem.id);
              }
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              followMe
                ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : isDark
                ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
            }`}
            title={followMe ? 'Follow Me: ON (Auto-pans canvas on jump)' : 'Follow Me: OFF (Click to enable auto-tracking)'}
          >
            <Navigation className={`w-3.5 h-3.5 ${followMe ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span>{followMe ? 'FOLLOW: ON' : 'FOLLOW: OFF'}</span>
          </button>

          {/* GalaxyFinder Tidy Tree */}
          <button
            onClick={() => mapperService.autoOrganizeTreeLayout()}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isDark
                ? 'bg-cyan-950/70 border-cyan-700/60 text-cyan-300 hover:bg-cyan-900 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100'
            }`}
            title="GalaxyFinder Tidy Tree: Auto-organize hierarchical system layout"
          >
            <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">TIDY TREE</span>
          </button>

          {/* GalaxyFinder Collapse All */}
          <button
            onClick={() => mapperService.toggleCollapseAll()}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isDark
                ? 'bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Toggle Collapse / Expand all branches across map"
          >
            <GitFork className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">COLLAPSE ALL</span>
          </button>

          {/* GalaxyFinder Live Jita Jump Count */}
          <div
            onClick={() => {
              setSelectedSystemId('Jita');
              centerOnSystem('Jita');
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              jitaRoute.jumps !== null
                ? 'bg-blue-950/80 border-blue-500/60 text-blue-300 hover:border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                : 'bg-gray-900/60 border-gray-800 text-gray-500'
            }`}
            title={`Shortest route to Jita 4-4: ${jitaRoute.jumps !== null ? `${jitaRoute.jumps} jumps via [${jitaRoute.path.join(' -> ')}]` : 'No connection in current chain'}`}
          >
            <Route className="w-3.5 h-3.5 text-blue-400" />
            <span>JITA: {jitaRoute.jumps !== null ? `${jitaRoute.jumps} J` : '∞'}</span>
          </div>

          <button
            onClick={handleCopyBuddyLink}
            className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] text-xs"
            title="Copy live tunnel link for fleet buddy"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copiedLink ? 'COPIED!' : 'SHARE LINK'}</span>
          </button>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-1.5 rounded border transition-colors ${
              showInspector 
                ? isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-sky-100 text-sky-800 border-sky-400'
                : isDark ? 'bg-gray-900 text-gray-400 border-gray-800' : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
            title="Toggle System Inspector"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded border transition-colors ${
              isDark 
                ? 'bg-gray-900 hover:bg-gray-800 text-amber-300 border-gray-800 shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm'
            }`}
            title={isDark ? 'Switch to Daylight / Clean Mode' : 'Switch to Tactical Night Mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded border transition-colors ${
              isDark 
                ? 'bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border-gray-800' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 border-slate-300'
            }`}
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
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

              // Pathfinder Line Styles
              let strokeColor = isStargate ? (isDark ? '#3b82f6' : '#2563eb') : (isDark ? '#38bdf8' : '#0284c7');
              let strokeDash: string | undefined = undefined;

              if (!isStargate) {
                if (conn.massStatus === 'critical') {
                  strokeColor = '#f97316';
                  strokeDash = '4 3';
                } else if (conn.massStatus === 'destab') {
                  strokeColor = '#eab308';
                  strokeDash = '6 3';
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

                  {/* Terminal joint dots for Stargates */}
                  {isStargate && (
                    <>
                      <circle cx={x1} cy={y1} r="2.5" fill="#60a5fa" />
                      <circle cx={x2} cy={y2} r="2.5" fill="#60a5fa" />
                    </>
                  )}

                  {/* Midpoint Label Tag for Wormholes (Clickable to edit sig / mass) */}
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
                        stroke={conn.timeStatus === 'eol' ? '#c084fc' : strokeColor}
                        strokeWidth="1.2"
                        className="group-hover:fill-[#0e172a] group-hover:stroke-cyan-300 transition-all shadow-md"
                      />
                      <text
                        x="0"
                        y="3.5"
                        fill={conn.timeStatus === 'eol' ? '#f0abfc' : conn.massStatus === 'critical' ? '#fdba74' : '#67e8f9'}
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

              // Border colors based on system class
              let borderColor = isDark ? '#1f293d' : '#cbd5e1';
              if (node.systemClass === 'Highsec') borderColor = isDark ? '#10b98188' : '#059669';
              else if (node.systemClass === 'Lowsec') borderColor = isDark ? '#f59e0b88' : '#d97706';
              else if (node.systemClass.startsWith('C')) borderColor = isDark ? '#06b6d488' : '#0284c7';

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
                  {/* Card Container */}
                  <div
                    className={`w-full h-full rounded-md px-2.5 py-1.5 flex flex-col justify-between relative transition-all ${
                      isActivePlayer
                        ? isDark
                          ? 'bg-[#0f172a] shadow-[0_0_20px_rgba(255,255,255,0.9),inset_0_0_10px_rgba(6,182,212,0.35)]'
                          : 'bg-white shadow-[0_0_16px_rgba(2,132,199,0.35)] ring-2 ring-sky-500'
                        : isSelected
                        ? isDark
                          ? 'bg-[#11192d] shadow-[0_0_14px_rgba(6,182,212,0.3)]'
                          : 'bg-sky-50 shadow-md ring-1 ring-sky-400'
                        : isDark
                        ? 'bg-[#0d121f] hover:bg-[#121929]'
                        : 'bg-white hover:bg-slate-50 shadow-sm border'
                    }`}
                    style={{
                      borderWidth: isActivePlayer ? '2px' : '1px',
                      borderColor: isActivePlayer ? (isDark ? '#ffffff' : '#0284c7') : isSelected ? '#38bdf8' : borderColor
                    }}
                  >
                    {/* Top Row: Security or WH Class + Statics + Fold Control */}
                    <div className="flex items-center justify-between leading-none">
                      {renderSecurityOrClass(node)}
                      
                      <div className="flex items-center gap-1">
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
                            className={`p-0.5 rounded transition-all pointer-events-auto ${
                              node.isCollapsed
                                ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/50 text-[9px] font-bold px-1 flex items-center gap-0.5 shadow-sm'
                                : isDark
                                ? 'hover:bg-cyan-950 text-gray-400 hover:text-cyan-300'
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
                            className="p-0.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-950/40 transition-colors pointer-events-auto"
                            title="Delete this system from the map"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: System Name */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold tracking-wide truncate ${
                        isActivePlayer 
                          ? isDark ? 'text-white' : 'text-slate-950 font-black'
                          : isDark ? 'text-gray-200' : 'text-slate-800'
                      }`}>
                        {node.name}
                      </span>
                    </div>

                    {/* Pilot Presence Badge (Purple Circle with number) + Hover Tooltip */}
                    {pilotCount > 0 && (
                      <div className="absolute -top-2 -right-2 group/pilot z-30">
                        {/* Purple Circular Count Badge */}
                        <div 
                          className="w-5 h-5 rounded-full bg-purple-600 border border-purple-300 text-white font-bold text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.9)] cursor-pointer hover:scale-110 transition-transform"
                        >
                          {pilotCount}
                        </div>

                        {/* Stacked Pilots in Alphabetical Order on Hover */}
                        <div className={`opacity-0 group-hover/pilot:opacity-100 pointer-events-none group-hover/pilot:pointer-events-auto transition-all duration-150 absolute top-full right-0 mt-1 min-w-[190px] p-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
                          isDark 
                            ? 'bg-[#0a0f1d]/95 border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                            : 'bg-white/95 border-purple-300 text-slate-900 shadow-xl'
                        }`}>
                          <div className={`text-[9px] font-mono font-bold uppercase tracking-wider pb-1.5 mb-2 border-b flex items-center justify-between ${
                            isDark ? 'text-purple-300 border-purple-500/30' : 'text-purple-700 border-purple-200'
                          }`}>
                            <span>PILOTS IN {node.name}</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold">{pilotCount}</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            {sortedPilots.map((pilotName, pIdx) => {
                              const isMe = currentPilot && pilotName.toLowerCase().includes(currentPilot.characterName.toLowerCase());
                              return (
                                <div
                                  key={pIdx}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 border transition-colors ${
                                    isMe
                                      ? isDark
                                        ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-200'
                                        : 'bg-cyan-50 border-cyan-400 text-cyan-900 font-bold'
                                      : isDark
                                      ? 'bg-purple-950/40 border-purple-800/50 text-gray-200'
                                      : 'bg-purple-50 border-purple-200 text-purple-950'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isMe ? 'bg-cyan-400' : 'bg-emerald-500 animate-pulse'}`}></span>
                                  <User className={`w-3.5 h-3.5 shrink-0 ${isMe ? 'text-cyan-400' : 'text-purple-500'}`} />
                                  <span className="font-semibold truncate flex-1">{pilotName}</span>
                                  {isMe && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
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
