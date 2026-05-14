import { useEffect, useState } from 'react';
import { Cpu, MemoryStick, Activity, Clock } from 'lucide-react';

interface SystemInfo {
  os_name: string;
  os_version: string;
  hostname: string;
  cpu_count: number;
  cpu_percent: number;
  memory_total_mb: number;
  memory_used_mb: number;
  memory_percent: number;
  active_sessions: number;
  uptime_seconds: number;
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  );
}

function formatUptime(secs: number): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SystemStats() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState(false);

  const fetch_info = async () => {
    try {
      const res = await fetch('http://localhost:7681/api/v1/system-info');
      if (!res.ok) throw new Error();
      setInfo(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    fetch_info();
    const interval = setInterval(fetch_info, 3000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="px-3 py-3 text-[10px] text-danger/70 text-center">
        System info unavailable
      </div>
    );
  }

  if (!info) {
    return (
      <div className="px-3 py-3 text-[10px] text-text-faint text-center animate-pulse">
        Loading stats…
      </div>
    );
  }

  const cpuColor = info.cpu_percent > 80 ? '#f87171' : info.cpu_percent > 50 ? '#fbbf24' : '#4ade80';
  const memColor = info.memory_percent > 80 ? '#f87171' : info.memory_percent > 50 ? '#fbbf24' : '#4f98a3';

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Host info */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-success status-dot-live shrink-0" />
        <span className="text-[10px] font-semibold text-text-primary truncate">{info.hostname}</span>
        <span className="text-[9px] text-text-faint ml-auto shrink-0">{info.os_name}</span>
      </div>

      {/* CPU */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <Cpu size={10} className="text-primary/70" />
            <span>CPU</span>
            <span className="text-text-faint">×{info.cpu_count}</span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: cpuColor }}>
            {info.cpu_percent.toFixed(1)}%
          </span>
        </div>
        <MiniBar value={info.cpu_percent} color={cpuColor} />
      </div>

      {/* Memory */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <MemoryStick size={10} className="text-primary/70" />
            <span>RAM</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">
            <span style={{ color: memColor }}>{info.memory_used_mb}</span>
            <span className="text-text-faint">/{info.memory_total_mb} MB</span>
          </span>
        </div>
        <MiniBar value={info.memory_percent} color={memColor} />
      </div>

      {/* Sessions + Uptime */}
      <div className="flex gap-2 mt-1">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted bg-bg-base/50 rounded px-2 py-1 flex-1">
          <Activity size={9} className="text-primary/70" />
          <span className="text-text-faint">Sessions</span>
          <span className="ml-auto font-mono text-text-primary">{info.active_sessions}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted bg-bg-base/50 rounded px-2 py-1 flex-1">
          <Clock size={9} className="text-primary/70" />
          <span className="text-text-faint">Up</span>
          <span className="ml-auto font-mono text-text-primary">{formatUptime(info.uptime_seconds)}</span>
        </div>
      </div>
    </div>
  );
}
