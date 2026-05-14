import { useState } from 'react';
import { Trash2, XCircle, ArrowDown, Copy, Bot, Send, History, ChevronRight } from 'lucide-react';
import type { TerminalSession } from '../hooks/useTerminalSessions';

interface InfoPanelProps {
  cmdHistory: string[];
  activeSession: TerminalSession | null;
  sendCommand: (id: string, cmd: string) => void;
}

export function InfoPanel({ cmdHistory, activeSession, sendCommand }: InfoPanelProps) {
  const [nlCommand, setNlCommand] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleAiTranslate = async () => {
    if (!nlCommand.trim() || !activeSession) return;
    setIsTranslating(true);
    setLastResult(null);
    try {
      const res = await fetch('http://localhost:7681/api/v1/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: nlCommand })
      });
      const data = await res.json();
      if (data.command && activeSession) {
        setLastResult(data.command);
        sendCommand(activeSession.id, data.command + '\n');
        setNlCommand('');
      }
    } catch {
      if (activeSession) sendCommand(activeSession.id, "echo 'AI Engine Offline'\n");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <aside className="col-start-3 row-start-2 w-64 border-l border-border flex flex-col glass-elevated right-panel-shadow overflow-y-auto hidden md:flex">

      {/* AI Assistant */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
            <Bot size={11} className="text-primary" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Assistant</span>
        </div>
        <p className="text-[10px] text-text-faint mb-2 leading-relaxed">
          Describe what you want to do in plain English.
        </p>
        <div className="flex flex-col gap-1.5">
          <textarea
            value={nlCommand}
            onChange={e => setNlCommand(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiTranslate(); }
            }}
            placeholder={`"list all python files"\n"kill port 3000"`}
            className="w-full bg-bg-base/60 border border-border rounded-md p-2 text-[11px] text-text-primary resize-none h-16 focus:outline-none focus:border-primary/50 placeholder:text-text-faint font-mono transition-colors"
          />
          {lastResult && (
            <div className="px-2 py-1 bg-primary/5 border border-primary/15 rounded text-[10px] font-mono text-primary/80 truncate">
              → {lastResult}
            </div>
          )}
          <button
            onClick={handleAiTranslate}
            disabled={isTranslating || !nlCommand.trim() || !activeSession}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[11px] font-semibold hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 hover:-translate-y-px active:translate-y-0"
          >
            {isTranslating ? (
              <><span className="animate-spin">⟳</span> Translating…</>
            ) : (
              <><Send size={11} /> Execute</>
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-border shrink-0">
        <p className="text-[9px] uppercase tracking-widest text-text-faint mb-2 font-semibold">Quick Actions</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { icon: <Trash2 size={11} />, label: 'Clear', action: () => activeSession && sendCommand(activeSession.id, 'clear\n'), color: 'text-text-muted' },
            { icon: <XCircle size={11} />, label: 'Kill', action: () => activeSession && sendCommand(activeSession.id, '\x03'), color: 'text-danger/70' },
            { icon: <ArrowDown size={11} />, label: 'Bottom', action: () => activeSession?.term.scrollToBottom(), color: 'text-text-muted' },
            { icon: <Copy size={11} />, label: 'Copy', action: () => { if (activeSession?.term.hasSelection()) navigator.clipboard.writeText(activeSession.term.getSelection()); }, color: 'text-text-muted' },
          ].map(({ icon, label, action, color }) => (
            <button
              key={label}
              onClick={action}
              className={clsx(`flex items-center justify-center gap-1.5 p-2 bg-bg-base/50 border border-border rounded-md text-[10px] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-150 ${color}`)}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Command History */}
      <div className="p-3 flex-1 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2">
          <History size={10} className="text-text-faint" />
          <p className="text-[9px] uppercase tracking-widest text-text-faint font-semibold">History</p>
          {cmdHistory.length > 0 && (
            <span className="ml-auto text-[9px] text-text-faint bg-white/5 rounded px-1.5 py-0.5">
              {cmdHistory.length}
            </span>
          )}
        </div>
        {cmdHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-faint">
            <History size={20} className="mb-2 opacity-30" />
            <p className="text-[10px]">No commands yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {cmdHistory.map((cmd, i) => (
              <div
                key={i}
                onClick={() => activeSession && sendCommand(activeSession.id, cmd + '\n')}
                className="group flex items-center gap-2 font-mono text-[10px] text-text-faint cursor-pointer px-2 py-1.5 rounded-md hover:bg-primary/5 hover:text-primary transition-all duration-100"
              >
                <span className="text-text-faint/40 select-none">$</span>
                <span className="flex-1 truncate group-hover:text-primary transition-colors">{cmd}</span>
                <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// Helper to avoid inline template literals for className joins
function clsx(...args: (string | undefined | null | false)[]): string {
  return args.filter(Boolean).join(' ');
}
