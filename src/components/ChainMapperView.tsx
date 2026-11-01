import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, Compass, Building2, Users, Plus, Trash2, 
  Check, Share2, ZoomIn, ZoomOut, Maximize2, Crosshair,
  User, MapPin, Eye, Radio, ExternalLink, Layers, Sparkles, KeyRound, LogOut
} from 'lucide-react';
import { mapperService } from '../services/mapperService';
import { ChainMapState, WormholeNode, WormholeConnection } from '../types/mapper';
import { authService, PilotProfile } from '../services/authService';
import { PilotLoginModal } from './PilotLoginModal';
import { SignaturePromptModal } from './SignaturePromptModal';

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

  // Connection signature & status edit modal
  const [selectedConnection, setSelectedConnection] = useState<WormholeConnection | null>(null);
  const [isConnModalOpen, setIsConnModalOpen] = useState<boolean>(false);

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
      return <span className="text-emerald-400 font-bold text-xs">{sec}</span>;
    }
    if (node.systemClass === 'Lowsec') {
      const sec = node.security !== undefined ? node.security.toFixed(1) : '0.4';
      return (
        <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
          <span>{sec}</span>
          {node.sigCode && <span className="text-[10px] text-gray-400">[{node.sigCode}]</span>}
        </span>
      );
    }
    if (node.systemClass === 'Nullsec') {
      return <span className="text-red-400 font-bold text-xs">0.0</span>;
    }
    // Wormhole class (C1 - C6)
    const isTarget = node.id === activeSystem?.id;
    return (
      <span className="text-cyan-300 font-bold text-xs flex items-center gap-1">
        {isTarget && <span className="text-white text-[10px]">⊙</span>}
        <span className="text-cyan-400">{node.systemClass}</span>
        {node.sigCode && <span className="text-[10px] text-cyan-200/90 font-mono">[{node.sigCode}]</span>}
        {node.statics && node.statics.length > 0 && (
          <span className="text-[10px] text-amber-300/90 font-mono">
            {node.statics[0].startsWith('High') ? 'H' : node.statics[0].startsWith('Low') ? 'L' : node.statics[0]}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[calc(100vh-64px)] font-mono select-none overflow-hidden bg-[#04060c] relative">
      
      {/* 1. TOP TITLE BAR (Tripwire / Pathfinder style) */}
      <div className="bg-[#0b0f1a] border-b border-gray-800/80 px-4 py-2 flex items-center justify-between text-xs z-20 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Pilot Identity & EVE SSO Profile */}
          <div className="flex items-center gap-2 text-white font-bold tracking-wide text-xs">
            <span className="text-cyan-400 text-lg leading-none">≡</span>

            {currentPilot ? (
              <div className="flex items-center gap-2 bg-[#080d1a] border border-cyan-500/50 rounded-xl px-2.5 py-1 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <img
                  src={currentPilot.avatarUrl}
                  alt={currentPilot.characterName}
                  className="w-5 h-5 rounded border border-cyan-400 object-cover"
                />
                <span className="text-white font-bold">{currentPilot.characterName}</span>
                {currentPilot.corporationTicker && (
                  <span className="text-[10px] text-cyan-300 hidden sm:inline">[{currentPilot.corporationTicker}]</span>
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
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
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
              showInspector ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-gray-900 text-gray-400 border-gray-800'
            }`}
            title="Toggle System Inspector"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition-colors"
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
        className={`flex-1 relative overflow-hidden cursor-${isPanning ? 'grabbing' : 'grab'} bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#05070d] to-[#020306]`}
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20px 30px, #ffffff18, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, #38bdf820, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 90px 40px, #ffffff15, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 160px 120px, #818cf820, rgba(0,0,0,0))
          `,
          backgroundSize: '250px 250px'
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
              let strokeColor = isStargate ? '#3b82f6' : '#38bdf8';
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
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* HTML NODE CARDS LAYER */}
          <div className="absolute inset-0 pointer-events-auto">
            {Object.values(mapState.systems).map((node) => {
              const isSelected = node.id === selectedSystem?.id;
              const isActivePlayer = node.id === activeSystem?.id;
              const pilotCount = node.activePilots ? node.activePilots.length : 0;
              const structCount = node.structures ? node.structures.length : 0;

              // Border colors based on system class
              let borderColor = '#1f293d';
              if (node.systemClass === 'Highsec') borderColor = '#10b98188';
              else if (node.systemClass === 'Lowsec') borderColor = '#f59e0b88';
              else if (node.systemClass.startsWith('C')) borderColor = '#06b6d488';

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
                        ? 'bg-[#0f172a] shadow-[0_0_20px_rgba(255,255,255,0.9),inset_0_0_10px_rgba(6,182,212,0.35)]'
                        : isSelected
                        ? 'bg-[#11192d] shadow-[0_0_14px_rgba(6,182,212,0.3)]'
                        : 'bg-[#0d121f] hover:bg-[#121929]'
                    }`}
                    style={{
                      borderWidth: isActivePlayer ? '2px' : '1px',
                      borderColor: isActivePlayer ? '#ffffff' : isSelected ? '#38bdf8' : borderColor
                    }}
                  >
                    {/* Top Row: Security or WH Class + Statics */}
                    <div className="flex items-center justify-between leading-none">
                      {renderSecurityOrClass(node)}
                      
                      {structCount > 0 && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                          <Building2 className="w-2.5 h-2.5" />
                          <span>{structCount}</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: System Name */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold tracking-wide truncate ${
                        isActivePlayer ? 'text-white' : 'text-gray-200'
                      }`}>
                        {node.name}
                      </span>
                    </div>

                    {/* Pilot Presence Badge (Purple Circle with number, matching screenshot) */}
                    {pilotCount > 0 && (
                      <div 
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-purple-600 border border-purple-300 text-white font-bold text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.9)] animate-pulse"
                        title={node.activePilots?.join(', ')}
                      >
                        {pilotCount}
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
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                    {selectedSystem.name}
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-cyan-700/60 bg-cyan-950/80 text-cyan-300 uppercase">
                      {selectedSystem.systemClass}
                    </span>
                  </h3>
                </div>

                <button
                  onClick={() => setShowInspector(false)}
                  className="text-gray-500 hover:text-gray-300 text-sm font-bold p-1"
                >
                  ✕
                </button>
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

            {/* Footer Clear */}
            <div className="pt-3 mt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
              <span>Updated {selectedSystem.lastUpdated}</span>
              <button
                onClick={() => mapperService.clearMap()}
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
            connectionId={selectedConnection.id}
            onClose={() => {
              setIsConnModalOpen(false);
              setSelectedConnection(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
