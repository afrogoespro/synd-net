import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WormholeNode, WormholeConnection } from '../types/mapper';
import { RotateCw, Eye, Sparkles, Compass, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Hologram3DViewerProps {
  systems: Record<string, WormholeNode>;
  connections: WormholeConnection[];
  activeSystemId?: string;
  theme?: 'dark' | 'light';
  onSelectSystem?: (systemId: string) => void;
}

interface HoveredNodeInfo {
  name: string;
  systemClass: string;
  security?: number;
  statics?: string[];
  pilots?: string[];
  screenX: number;
  screenY: number;
}

export const Hologram3DViewer: React.FC<Hologram3DViewerProps> = ({
  systems,
  connections,
  activeSystemId = 'J103955',
  theme = 'dark',
  onSelectSystem
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<HoveredNodeInfo | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [systemCount, setSystemCount] = useState<number>(0);

  // References to keep across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const nodeMeshesRef = useRef<{ mesh: THREE.Mesh; node: WormholeNode }[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, 65);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(20, 40, 30);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 3.5, 100);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 5. Hologram Container Group
    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);
    groupRef.current = hologramGroup;

    // 6. Holographic Gimbal / Astrolabe Rings
    const ringMat1 = new THREE.LineBasicMaterial({ 
      color: isDark ? 0x06b6d4 : 0x0284c7, 
      transparent: true, 
      opacity: isDark ? 0.35 : 0.45 
    });
    const ringGeo1 = new THREE.RingGeometry(28, 28.3, 64);
    const ring1 = new THREE.LineLoop(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    hologramGroup.add(ring1);

    const ringMat2 = new THREE.LineBasicMaterial({ 
      color: isDark ? 0x818cf8 : 0x4f46e5, 
      transparent: true, 
      opacity: isDark ? 0.25 : 0.35 
    });
    const ringGeo2 = new THREE.RingGeometry(32, 32.2, 64);
    const ring2 = new THREE.LineLoop(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = Math.PI / 6;
    hologramGroup.add(ring2);

    // 7. Ambient Particle Dust / Star Field
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 35 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particlePos[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePos[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePos[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.8,
      color: isDark ? 0x38bdf8 : 0x0284c7,
      transparent: true,
      opacity: 0.45
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    hologramGroup.add(particlePoints);

    // 8. Place Systems in 3D Spherical/Constellation Coordinates
    const systemList = Object.values(systems);
    setSystemCount(systemList.length);
    const nodePositionMap = new Map<string, THREE.Vector3>();
    const nodeMeshes: { mesh: THREE.Mesh; node: WormholeNode }[] = [];

    // Distribute systems on concentric shells / organic 3D constellation
    systemList.forEach((sys, idx) => {
      let pos: THREE.Vector3;
      const isHome = sys.id === activeSystemId;
      const isJita = sys.name === 'Jita';

      if (isHome) {
        // Active system near glowing center
        pos = new THREE.Vector3(0, 0, 0);
      } else if (isJita) {
        // Trade hub at top apex
        pos = new THREE.Vector3(0, 18, 0);
      } else {
        // Fibonacci sphere projection with radius based on depth
        const total = Math.max(systemList.length, 12);
        const phi = Math.acos(1 - 2 * (idx + 0.5) / total);
        const theta = Math.PI * (1 + 5 ** 0.5) * (idx + 0.5);
        const radius = sys.systemClass?.startsWith('C') ? 14 + (idx % 3) * 4 : 20 + (idx % 4) * 3;
        pos = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi) * 0.75,
          radius * Math.sin(phi) * Math.sin(theta)
        );
      }
      nodePositionMap.set(sys.id, pos);

      // Node Sphere
      const isWh = sys.systemClass?.startsWith('C');
      const isHighsec = sys.systemClass === 'Highsec';
      const isLowsec = sys.systemClass === 'Lowsec';

      let nodeColor = 0x38bdf8;
      if (isHighsec) nodeColor = isDark ? 0x34d399 : 0x059669;
      else if (isLowsec) nodeColor = isDark ? 0xfbbf24 : 0xd97706;
      else if (isWh) nodeColor = isDark ? 0x38bdf8 : 0x0284c7;

      if (isHome) nodeColor = 0xa855f7; // Purple player indicator

      const sphereGeo = new THREE.SphereGeometry(isHome ? 2.2 : 1.4, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: nodeColor,
        emissive: nodeColor,
        emissiveIntensity: isHome ? 0.8 : 0.45,
        roughness: 0.2,
        metalness: 0.8
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.copy(pos);
      hologramGroup.add(mesh);
      nodeMeshes.push({ mesh, node: sys });

      // Holographic glowing aura ring around active player node
      if (isHome) {
        const auraGeo = new THREE.RingGeometry(2.8, 3.2, 32);
        const auraMat = new THREE.MeshBasicMaterial({
          color: 0xc084fc,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.rotation.x = Math.PI / 2;
        mesh.add(aura);
      }
    });

    nodeMeshesRef.current = nodeMeshes;

    // 9. Jump Line Connections
    connections.forEach((conn) => {
      const p1 = nodePositionMap.get(conn.from);
      const p2 = nodePositionMap.get(conn.to);
      if (!p1 || !p2) return;

      const isStargate = conn.wormholeType === 'Stargate';
      const curve = new THREE.LineCurve3(p1, p2);
      const points = curve.getPoints(20);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      const lineColor = isStargate ? (isDark ? 0x60a5fa : 0x2563eb) : (isDark ? 0x38bdf8 : 0x0284c7);
      const lineMat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: isStargate ? 0.75 : 0.85,
        linewidth: 2
      });
      const line = new THREE.Line(lineGeo, lineMat);
      hologramGroup.add(line);
    });

    // 10. Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isAutoRotating && !isDraggingRef.current) {
        hologramGroup.rotation.y += 0.0035;
        ring2.rotation.z += 0.005;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 11. Raycasting for hover & click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - prevMouseRef.current.x;
        const deltaY = e.clientY - prevMouseRef.current.y;
        prevMouseRef.current = { x: e.clientX, y: e.clientY };

        hologramGroup.rotation.y += deltaX * 0.007;
        hologramGroup.rotation.x += deltaY * 0.007;
        return;
      }

      // Check intersections
      raycaster.setFromCamera(mouse, camera);
      const meshes = nodeMeshesRef.current.map(nm => nm.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const found = nodeMeshesRef.current.find(nm => nm.mesh === hitMesh);
        if (found) {
          container.style.cursor = 'pointer';
          setHoveredNode({
            name: found.node.name,
            systemClass: found.node.systemClass,
            security: found.node.security,
            statics: found.node.statics,
            pilots: found.node.activePilots,
            screenX: e.clientX - rect.left,
            screenY: e.clientY - rect.top
          });
          return;
        }
      }

      container.style.cursor = 'default';
      setHoveredNode(null);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClick = () => {
      if (hoveredNode && onSelectSystem) {
        onSelectSystem(hoveredNode.name);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(30, Math.min(110, camera.position.z + e.deltaY * 0.05));
    };

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('click', handleClick);
    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [systems, connections, activeSystemId, isDark, isAutoRotating]);

  const resetView = () => {
    if (groupRef.current) {
      groupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 15, 65);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden select-none">
      {/* 3D Canvas Mounting Area */}
      <div ref={mountRef} className="w-full h-full min-h-[420px]" />

      {/* Top Left Floating Tag */}
      <div className="absolute top-4 left-5 flex items-center gap-2 pointer-events-none">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-md border text-xs font-mono shadow-sm ${
          isDark 
            ? 'bg-black/60 border-cyan-500/40 text-cyan-300' 
            : 'bg-white/80 border-slate-200 text-slate-800'
        }`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="font-bold">3D RECON HOLOGRAM</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-100 text-slate-600'}`}>
            {systemCount} JUMP NODES
          </span>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-5 flex items-center gap-2">
        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`p-2 rounded-xl backdrop-blur-md border transition-all shadow-sm ${
            isAutoRotating
              ? isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-sky-100 text-sky-800 border-sky-300'
              : isDark ? 'bg-black/50 text-gray-400 border-gray-800 hover:text-white' : 'bg-white/80 text-slate-600 border-slate-200'
          }`}
          title={isAutoRotating ? 'Pause Gyro Rotation' : 'Resume Auto Spin'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={resetView}
          className={`p-2 rounded-xl backdrop-blur-md border transition-all shadow-sm ${
            isDark ? 'bg-black/50 text-gray-400 border-gray-800 hover:text-white' : 'bg-white/80 text-slate-600 border-slate-200 hover:text-slate-900'
          }`}
          title="Reset 3D Orientation"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Center Interaction Guide */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
        <div className={`px-4 py-1.5 rounded-full backdrop-blur-md border text-[11px] font-sans flex items-center gap-2 shadow-sm ${
          isDark 
            ? 'bg-black/60 border-gray-800 text-gray-400' 
            : 'bg-white/90 border-slate-200 text-slate-600'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>Click &amp; drag to rotate sphere • Scroll to zoom • Hover / click any system</span>
        </div>
      </div>

      {/* Hovered Holographic System HUD Tooltip */}
      {hoveredNode && (
        <div
          className={`absolute pointer-events-none z-20 p-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-75 min-w-[200px] ${
            isDark
              ? 'bg-[#090e1a]/95 border-cyan-500/60 text-white shadow-[0_0_25px_rgba(6,182,212,0.25)]'
              : 'bg-white/95 border-slate-300 text-slate-900 shadow-xl'
          }`}
          style={{
            left: `${Math.min(hoveredNode.screenX + 15, (mountRef.current?.clientWidth || 500) - 220)}px`,
            top: `${Math.max(15, hoveredNode.screenY - 30)}px`
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b pb-2 mb-2 border-slate-200/40">
            <span className="font-bold font-mono text-sm tracking-wide">
              {hoveredNode.name}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              hoveredNode.systemClass.startsWith('C')
                ? isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-sky-100 text-sky-800'
                : hoveredNode.systemClass === 'Highsec'
                ? isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800'
                : isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {hoveredNode.systemClass}
            </span>
          </div>

          <div className="space-y-1 text-xs font-sans">
            <div className="flex items-center justify-between text-gray-400">
              <span>Security Status:</span>
              <span className={`font-mono font-bold ${
                (hoveredNode.security ?? 0) >= 0.5 ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                {hoveredNode.security !== undefined ? hoveredNode.security.toFixed(1) : '-0.99'}
              </span>
            </div>

            {hoveredNode.statics && hoveredNode.statics.length > 0 && (
              <div className="flex items-center justify-between text-gray-400">
                <span>Statics:</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {hoveredNode.statics.join(', ')}
                </span>
              </div>
            )}

            {hoveredNode.pilots && hoveredNode.pilots.length > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/20 text-purple-400 font-bold">
                <span>Active Pilots:</span>
                <span className="font-mono">
                  {hoveredNode.pilots.join(', ')}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-200/20 text-[10px] text-cyan-500 font-mono text-center">
            Click node to view on Chain Mapper →
          </div>
        </div>
      )}
    </div>
  );
};
