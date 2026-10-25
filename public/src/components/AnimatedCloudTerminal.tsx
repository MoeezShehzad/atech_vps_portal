import React, { useState, useEffect } from 'react';

interface TerminalLine {
  id: string;
  type: 'command' | 'output';
  prompt?: string;
  text: string;
  style?: 'success' | 'info' | 'dim' | 'accent' | 'status';
}

export default function AnimatedCloudTerminal() {
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('$');
  const [currentTyped, setCurrentTyped] = useState('');
  const [hostTitle, setHostTitle] = useState('cloud-node-us01.atc');
  const [badge, setBadge] = useState({
    text: 'CONNECTING',
    color: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
  });

  useEffect(() => {
    let isMounted = true;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const typeCommand = async (cmd: string, promptStr: string) => {
      setCurrentPrompt(promptStr);
      for (let i = 1; i <= cmd.length; i++) {
        if (!isMounted) return;
        setCurrentTyped(cmd.slice(0, i));
        await sleep(35 + Math.random() * 25);
      }
      await sleep(250);
      if (!isMounted) return;
      setHistory((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'command', prompt: promptStr, text: cmd },
      ]);
      setCurrentTyped('');
    };

    const addLine = (text: string, style: 'success' | 'info' | 'dim' | 'accent' | 'status') => {
      if (!isMounted) return;
      setHistory((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'output', text, style },
      ]);
    };

    const runLoop = async () => {
      while (isMounted) {
        // Reset state
        setHistory([]);
        setCurrentTyped('');
        setHostTitle('cloud-node-us01.atc');
        setBadge({ text: 'CONNECTING', color: 'text-amber-400 bg-amber-950/60 border-amber-800/80' });
        await sleep(400);

        // Step 1: SSH connection
        await typeCommand('ssh admin@172.27.45.113', '$');
        await sleep(150);
        addLine('Authenticating via ED25519 SSH key...', 'dim');
        await sleep(300);
        addLine('✓ Connection established to cloud-node-us01 (Port 22)', 'success');
        setBadge({ text: 'CONNECTED', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80' });
        setHostTitle('admin@cloud-node-us01:~');
        await sleep(350);
        addLine('Ubuntu 24.04 LTS (x86_64) • 4 vCPU • 8 GB ECC RAM', 'info');
        await sleep(650);

        // Step 2: Deploy services
        setBadge({ text: 'DEPLOYING', color: 'text-sky-400 bg-sky-950/60 border-sky-800/80' });
        await typeCommand('docker compose up -d', 'admin@atc:~$');
        await sleep(200);
        addLine('✔ Container web-frontend   Started (Port 443 TLS)', 'success');
        await sleep(200);
        addLine('✔ Container db-primary     Healthy (PostgreSQL 16)', 'success');
        await sleep(200);
        addLine('✔ Mounted 160 GB SSD Array (1.4 GB/s NVMe)', 'success');
        await sleep(650);

        // Step 3: Health check & readiness
        await typeCommand('curl -s localhost/health', 'admin@atc:~$');
        await sleep(200);
        setBadge({ text: 'PROVISIONED', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80' });
        addLine('{"status":"online","latency":"0.6ms","packetLoss":"0%"}', 'accent');
        addLine('STATUS: READY IN 48 SECONDS • SSH: PORT 22', 'status');

        // Hold completed state for 4.5 seconds
        await sleep(4500);

        // Clear command
        await typeCommand('clear', 'admin@atc:~$');
        await sleep(300);
      }
    };

    runLoop();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="rounded-2xl bg-slate-950 text-slate-200 p-4 font-mono text-xs shadow-xl border border-slate-800 min-h-[295px] flex flex-col justify-between overflow-hidden">
      {/* Terminal Window Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="text-[10px] text-slate-400 font-medium ml-2">{hostTitle}</span>
        </div>
        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md transition-all duration-300 ${badge.color}`}>
          ● {badge.text}
        </span>
      </div>

      {/* Terminal Content Stream */}
      <div className="space-y-1.5 text-[11px] leading-relaxed flex-1 flex flex-col justify-start">
        {history.map((item) => {
          if (item.type === 'command') {
            return (
              <div key={item.id} className="text-slate-200 flex items-center">
                <span className="text-blue-400 font-bold mr-1.5">{item.prompt}</span>
                <span className="text-white font-medium">{item.text}</span>
              </div>
            );
          }
          if (item.style === 'success') {
            return (
              <div key={item.id} className="text-emerald-400 flex items-center gap-1.5 pl-2.5">
                <span>{item.text}</span>
              </div>
            );
          }
          if (item.style === 'dim') {
            return (
              <div key={item.id} className="text-slate-500 text-[10px] pl-2.5 italic">
                {item.text}
              </div>
            );
          }
          if (item.style === 'info') {
            return (
              <div key={item.id} className="text-sky-300 text-[10px] pl-2.5">
                {item.text}
              </div>
            );
          }
          if (item.style === 'accent') {
            return (
              <div key={item.id} className="pl-2.5 pt-0.5">
                <span className="inline-block text-emerald-300 font-mono text-[10px] bg-emerald-950/50 py-0.5 px-2 rounded-sm border border-emerald-800/60">
                  {item.text}
                </span>
              </div>
            );
          }
          if (item.style === 'status') {
            return (
              <div key={item.id} className="text-blue-300 font-semibold pt-1.5 mt-auto border-t border-slate-900 flex justify-between items-center text-[10px]">
                <span>STATUS: READY IN 48 SECONDS</span>
                <span className="text-slate-400">SSH: PORT 22</span>
              </div>
            );
          }
          return null;
        })}

        {/* Currently typing active command line */}
        {currentTyped && (
          <div className="text-slate-200 flex items-center">
            <span className="text-blue-400 font-bold mr-1.5">{currentPrompt}</span>
            <span className="text-white">{currentTyped}</span>
            <span className="inline-block w-1.5 h-3.5 bg-blue-400 animate-pulse ml-0.5" />
          </div>
        )}

        {/* Idle cursor */}
        {!currentTyped && history.length > 0 && history[history.length - 1].style !== 'status' && (
          <div className="text-slate-400 flex items-center">
            <span className="text-blue-400 font-bold mr-1.5">{currentPrompt}</span>
            <span className="inline-block w-1.5 h-3.5 bg-blue-400/80 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
