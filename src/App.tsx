import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CommandDashboardView } from './components/CommandDashboardView';
import { DScanParserView } from './components/DScanParserView';
import { ChainMapperView } from './components/ChainMapperView';
import { OreSiteEvaluatorView } from './components/OreSiteEvaluatorView';
import { LocalIntelView } from './components/LocalIntelView';
import { LiveKillfeedView } from './components/LiveKillfeedView';
import { EFTInspectorView } from './components/EFTInspectorView';
import { WormholeScoutPopup } from './components/WormholeScoutPopup';
import { WormholeTacticalHUD } from './components/WormholeTacticalHUD';
import { SignaturePromptModal } from './components/SignaturePromptModal';
import { MusicPlayerPopup } from './components/MusicPlayerPopup';
import { scoutWatcher, ScoutAlertEvent } from './services/scoutWatcher';
import { mapperService } from './services/mapperService';
import { soundManager } from './services/soundEffects';
import { authService } from './services/authService';
import { DScanReport } from './types/dscan';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dscan' | 'mapper' | 'ore' | 'local' | 'killfeed' | 'eft'>('dashboard');
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(true);
  const [autoWatchEnabled, setAutoWatchEnabled] = useState<boolean>(true);
  const [activeScoutAlert, setActiveScoutAlert] = useState<ScoutAlertEvent | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [currentSystem, setCurrentSystem] = useState<string>('J103955');
  const [showHud, setShowHud] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('synd_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('synd_theme', next);
  };

  const [jumpSigModal, setJumpSigModal] = useState<{
    isOpen: boolean;
    fromSystem: string;
    toSystem: string;
  } | null>(null);

  // Subscribe to live character jumps from EVE log tailer
  useEffect(() => {
    const unsubJump = mapperService.onJump((jumpData) => {
      setCurrentSystem(jumpData.systemName);
      const isWh = jumpData.systemName.startsWith('J') || (jumpData.fromSystem && jumpData.fromSystem.startsWith('J')) || jumpData.isWormhole;
      if (isWh) {
        setShowHud(true);
        playTacticalAlert('wh_entry');
        if (jumpData.fromSystem && jumpData.fromSystem !== jumpData.systemName) {
          setJumpSigModal({
            isOpen: true,
            fromSystem: jumpData.fromSystem,
            toSystem: jumpData.systemName
          });
        }
      }
    });

    // Subscribe to live character jumps from official EVE SSO scope access (esi-location.read_location.v1)
    const unsubSSO = authService.onLocationUpdate(({ systemName, shipName }) => {
      setCurrentSystem(systemName);
      const pilot = authService.getPilot();
      if (pilot) {
        mapperService.setPilotLocation(pilot.characterName, systemName, shipName);
      }
      playTacticalAlert('wh_entry');
    });

    return () => {
      unsubJump();
      unsubSSO();
    };
  }, []);

  // Play audio chime for alerts
  const playTacticalAlert = (type: 'critical' | 'radar' | 'wh_entry') => {
    if (!audioAlertsEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'wh_entry') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1040, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === 'critical') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch (e) {
      console.warn("Audio Context playback failed", e);
    }
  };

  // Subscribe to automated scout watcher
  useEffect(() => {
    const unsubscribe = scoutWatcher.subscribe((event) => {
      setActiveScoutAlert(event);
      playTacticalAlert('wh_entry');

      // If structures were detected in D-scan, sync them to shared mapper!
      if (event.structuresDetected.length > 0) {
        mapperService.syncScannedStructures(event.systemName, event.structuresDetected);
      }
    });

    if (autoWatchEnabled) {
      scoutWatcher.startClipboardPolling(1500);
    } else {
      scoutWatcher.stopClipboardPolling();
    }

    return () => {
      unsubscribe();
      scoutWatcher.stopClipboardPolling();
    };
  }, [autoWatchEnabled]);

  const handleSimulateWHEntry = (systemName: string) => {
    scoutWatcher.evaluateText(`${systemName}\nAstrahus\tAstrahus\t14.2 AU\nFortizar\tFortizar\t22 km`, 'system_detected');
    setJumpSigModal({
      isOpen: true,
      fromSystem: currentSystem,
      toSystem: systemName
    });
  };

  const handleScanAnalyzed = (report: DScanReport) => {
    const structures = report.items
      .filter(item => 
        item.shipInfo.role === 'Citadel / Upwell' ||
        item.itemType.toLowerCase().includes('astrahus') ||
        item.itemType.toLowerCase().includes('fortizar') ||
        item.itemType.toLowerCase().includes('raitaru') ||
        item.itemType.toLowerCase().includes('azbel') ||
        item.itemType.toLowerCase().includes('athanor') ||
        item.itemType.toLowerCase().includes('tatara') ||
        item.itemType.toLowerCase().includes('keepstar')
      )
      .map(item => ({
        name: item.itemName,
        type: item.itemType,
        distance: item.distanceStr
      }));

    if (structures.length > 0) {
      const activeSys = mapperService.getActiveSystem()?.id || 'Active System';
      mapperService.syncScannedStructures(activeSys, structures);
    }

    scoutWatcher.evaluateText(report.rawInput, 'dscan_paste');

    if (report.maxThreat === 'critical' || report.maxThreat === 'high') {
      playTacticalAlert('critical');
    } else {
      playTacticalAlert('radar');
    }
  };

  const handleCopyDiscordReport = async () => {
    if (!activeScoutAlert) return;
    const wh = activeScoutAlert.wormholeInfo;
    const structCount = activeScoutAlert.structuresDetected.length;

    let text = `🌌 **[SYND.NET WH INTEL] ${wh.systemName} (${wh.wormholeClass})**\n`;
    text += `🚪 **Statics:** ${wh.statics.join(', ')}\n`;
    text += `🏰 **Structures on Scan (${structCount}):**\n`;
    if (structCount === 0) {
      text += `  • None detected on 14.3 AU D-Scan\n`;
    } else {
      activeScoutAlert.structuresDetected.forEach(s => {
        text += `  • ${s.type} - "${s.name}" (${s.distance})\n`;
      });
    }
    text += `\n*Scouted via Synd.net Recon Suite*`;

    await navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#080b11] text-gray-200' : 'bg-slate-50 text-slate-900'
    }`}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        audioAlertsEnabled={audioAlertsEnabled}
        setAudioAlertsEnabled={setAudioAlertsEnabled}
        autoWatchEnabled={autoWatchEnabled}
        setAutoWatchEnabled={setAutoWatchEnabled}
        onSimulateWHEntry={handleSimulateWHEntry}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className={`flex-1 w-full ${
        activeTab === 'mapper' 
          ? 'p-0 m-0 max-w-none h-[calc(100vh-64px)] overflow-hidden flex flex-col' 
          : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
      }`}>
        {/* High-Level Wormhole Tactical Entry HUD (shown on non-mapper tabs or if toggled) */}
        {showHud && activeTab !== 'mapper' && activeTab !== 'dashboard' && currentSystem.startsWith('J') && (
          <WormholeTacticalHUD
            systemName={currentSystem}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onDismiss={() => setShowHud(false)}
            onLogSignature={() => {
              setJumpSigModal({
                isOpen: true,
                fromSystem: 'Parent System',
                toSystem: currentSystem
              });
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <CommandDashboardView
            onNavigateTab={(tab) => setActiveTab(tab)}
            theme={theme}
          />
        )}
        {activeTab === 'dscan' && <DScanParserView onScanAnalyzed={handleScanAnalyzed} />}
        {activeTab === 'mapper' && <ChainMapperView />}
        {activeTab === 'ore' && <OreSiteEvaluatorView />}
        {activeTab === 'local' && <LocalIntelView />}
        {activeTab === 'killfeed' && <LiveKillfeedView activeSystemName={currentSystem} />}
        {activeTab === 'eft' && <EFTInspectorView />}
      </main>

      {/* Floating Apple-Style Music Player Popup with Volume Slider */}
      <MusicPlayerPopup theme={theme} />

      {/* Pop-up Wormhole Scout HUD Modal */}
      <WormholeScoutPopup
        event={activeScoutAlert}
        onClose={() => setActiveScoutAlert(null)}
        onCopyReport={handleCopyDiscordReport}
        copied={copiedReport}
      />

      {/* Signature Prompt Modal on Wormhole Jump */}
      {jumpSigModal && (
        <SignaturePromptModal
          isOpen={jumpSigModal.isOpen}
          fromSystem={jumpSigModal.fromSystem}
          toSystem={jumpSigModal.toSystem}
          onClose={() => setJumpSigModal(null)}
        />
      )}

      {/* Footer (hidden in mapper for 100% full-screen edge-to-edge canvas) */}
      {activeTab !== 'mapper' && (
        <footer className="border-t border-gray-800/80 bg-[#06080d] py-6 text-center text-xs text-gray-500 font-mono">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="text-gray-400">
              Synd.net // Multi-User Wormhole Chain Mapper &amp; Ore Intel Suite
            </p>
            <p className="text-[11px] text-gray-600">
              EVE Online and the EVE logo are the registered trademarks of CCP hf. All rights are reserved worldwide.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
