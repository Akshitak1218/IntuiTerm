import { Terminal, Zap, BookOpen, Cpu } from 'lucide-react';

const QUICK_COMMANDS = [
  { label: 'List files', cmd: 'ls -la\n', color: '#4f98a3' },
  { label: 'Disk usage', cmd: 'df -h\n', color: '#a78bfa' },
  { label: 'Running procs', cmd: 'ps aux\n', color: '#34d399' },
  { label: 'Current dir', cmd: 'pwd\n', color: '#fbbf24' },
  { label: 'System info', cmd: 'uname -a\n', color: '#f87171' },
  { label: 'Network', cmd: 'ifconfig\n', color: '#60a5fa' },
];

interface WelcomeBannerProps {
  onCommand: (cmd: string) => void;
}

export function WelcomeBanner({ onCommand }: WelcomeBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12 fade-in select-none">
      {/* Logo */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl blur-2xl opacity-30 bg-primary scale-150" />
        <div className="relative w-16 h-16 rounded-2xl glass-elevated flex items-center justify-center">
          <Terminal size={28} className="text-primary" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">
        IntuiTerm
      </h1>
      <p className="text-sm text-text-muted mb-8 text-center max-w-xs leading-relaxed">
        Your GUI based terminal for Linux. <br />
        Powered by
      </p>

      {/* Stats row */}
      <div className="flex gap-3 mb-8 flex-wrap justify-center">
        {[
          { icon: <Terminal size={12} />, label: 'BusyBox Shell' },
          { icon: <Zap size={12} />, label: 'WebSocket PTY' },
          { icon: <Cpu size={12} />, label: 'Live Stats' },
          { icon: <BookOpen size={12} />, label: 'AI Assistant' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border-border text-[11px] text-text-muted">
            <span className="text-primary">{icon}</span>
            {label}
          </div>
        ))}
      </div>

      {/* Quick commands */}
      <div className="w-full max-w-sm">
        <p className="text-[10px] text-text-faint uppercase tracking-widest mb-2 text-center">
          Quick commands — click to run
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_COMMANDS.map(({ label, cmd, color }) => (
            <button
              key={label}
              onClick={() => onCommand(cmd)}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg glass border-border text-left hover:border-primary/30 transition-all duration-200 hover:-translate-y-px"
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125" style={{ background: color }} />
              <span className="text-[11px] text-text-muted group-hover:text-text-primary transition-colors font-mono">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tip */}
      <p className="mt-8 text-[10px] text-text-faint text-center">
        Drag commands from sidebar · Use AI Assistant for natural language · Press ↑ for history
      </p>
    </div>
  );
}
