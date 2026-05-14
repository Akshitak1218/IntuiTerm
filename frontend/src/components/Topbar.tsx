import { useEffect, useRef, useState } from 'react';
import { Plus, Terminal as TermIcon, Palette, Wifi, WifiOff } from 'lucide-react';
import clsx from 'clsx';
import type { TerminalSession, ThemeName } from '../hooks/useTerminalSessions';
import { TERMINAL_THEMES } from '../hooks/useTerminalSessions';

interface TopbarProps {
  onMenuToggle: () => void;
  onCreateSession: () => void;
  sessions: Record<string, TerminalSession>;
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export function Topbar({ onCreateSession, sessions, currentTheme, setTheme }: TopbarProps) {
  const hasConnected = Object.values(sessions).some(s => s.socket.readyState === WebSocket.OPEN);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      if (!themeMenuRef.current) return;
      if (!themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  return (
    <header className="col-span-full row-start-1 flex items-center justify-between px-4 z-20 glass border-b border-border"
      style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>

      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <TermIcon size={14} className="text-primary" />
          </div>
          <span className="font-bold text-sm text-text-primary tracking-tight">IntuiTerm</span>
        </div>

        {/* Connection badge */}
        <div className={clsx(
          "flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border transition-colors duration-500",
          hasConnected
            ? "bg-success/10 border-success/20 text-success"
            : "bg-danger/10 border-danger/20 text-danger"
        )}>
          {hasConnected
            ? <><Wifi size={10} /> Connected</>
            : <><WifiOff size={10} /> Disconnected</>}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">

        {/* Theme switcher */}
        <div ref={themeMenuRef} className="relative">
          <button
            onClick={() => setIsThemeOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] text-text-muted hover:bg-white/[0.05] hover:text-text-primary transition-all"
          >
            <Palette size={13} />
            <span className="hidden sm:inline">{currentTheme}</span>
          </button>
          <div className={clsx(
            "absolute right-0 top-full mt-1 w-36 glass-elevated rounded-lg shadow-xl transition-all duration-150 z-50 overflow-hidden py-1",
            isThemeOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}>
            {(Object.keys(TERMINAL_THEMES) as ThemeName[]).map(theme => (
              <button
                key={theme}
                onClick={() => {
                  setTheme(theme);
                  setIsThemeOpen(false);
                }}
                className={clsx(
                  "w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/[0.06] transition-colors",
                  theme === currentTheme ? "text-primary font-semibold" : "text-text-muted"
                )}
              >
                {theme === currentTheme ? '✓ ' : '  '}{theme}
              </button>
            ))}
          </div>
        </div>

        {/* New session */}
        <button
          onClick={onCreateSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 hover:-translate-y-px active:translate-y-0"
        >
          <Plus size={13} /> New Session
        </button>
      </div>
    </header>
  );
}
