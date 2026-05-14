import { useState } from 'react';
import { TerminalSquare, X, FolderTree, Layers } from 'lucide-react';
import clsx from 'clsx';
import type { TerminalSession } from '../hooks/useTerminalSessions';
import { FileExplorer } from './FileExplorer';
import { SystemStats } from './SystemStats';

interface SidebarProps {
  isOpen: boolean;
  sessions: Record<string, TerminalSession>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  closeSession: (id: string) => void;
  onCommandTrigger: (cmd: InteractiveCommand) => void;
  onSendToTerminal: (cmd: string) => void;
}

export interface InteractiveCommand {
  id: string;
  label: string;
  prompt: string;
  prompt2?: string;
  cmd: string;
  noInput?: boolean;
}

type SidebarTab = 'explorer' | 'sessions';

export function Sidebar({ isOpen, sessions, activeSessionId, setActiveSessionId, closeSession, onCommandTrigger, onSendToTerminal }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');

  const interactiveCommands: InteractiveCommand[] = [
    { id: 'touch', label: '✦ Create File', prompt: 'File name:', cmd: 'touch ' },
    { id: 'mkdir', label: '✦ New Folder', prompt: 'Folder name:', cmd: 'mkdir -p ' },
    { id: 'rm', label: '✦ Delete', prompt: 'File/folder:', cmd: 'rm -rf ' },
    { id: 'grep', label: '✦ Search', prompt: 'Search term:', cmd: 'grep -rn ' },
    { id: 'cat', label: '✦ Read File', prompt: 'File name:', cmd: 'cat ' },
    { id: 'edit', label: '✦ Edit File', prompt: 'File name:', cmd: 'edit ' },
    { id: 'ls', label: '✦ List Files', prompt: '(none)', cmd: 'ls -la', noInput: true },
    { id: 'pwd', label: '✦ Current Dir', prompt: '(none)', cmd: 'pwd', noInput: true },
    { id: 'cd', label: '✦ Change Dir', prompt: 'Directory:', cmd: 'cd ' },
    { id: 'cp', label: '✦ Copy File', prompt: 'Source path:', prompt2: 'Destination path:', cmd: 'cp ' },
    { id: 'mv', label: '✦ Move/Rename', prompt: 'Source path:', prompt2: 'Destination path:', cmd: 'mv ' },
    { id: 'find', label: '✦ Find Files', prompt: 'Pattern:', cmd: 'find . -name ' },
  ];

  const handleFileClick = (path: string) => {
    // Send `cat` for files, `ls` for dirs
    onSendToTerminal(`cat "${path}"\n`);
  };

  return (
    <aside className={clsx(
      "col-start-1 row-start-2 flex flex-col glass-elevated border-r border-border sidebar-shadow transition-all duration-200 z-20 md:relative absolute inset-y-0",
      isOpen ? "translate-x-0 w-52" : "-translate-x-full md:translate-x-0 w-52"
    )}>
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        {([['explorer', FolderTree, 'Files'], ['sessions', Layers, 'Sessions']] as const).map(([tab, Icon, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors border-b-2",
              activeTab === tab
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-text-faint hover:text-text-muted"
            )}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'explorer' && (
          <FileExplorer onFileClick={handleFileClick} />
        )}

        {activeTab === 'sessions' && (
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Active sessions */}
            <div className="p-3 border-b border-border">
              <p className="text-[9px] uppercase tracking-widest text-text-faint mb-2 font-semibold">Sessions</p>
              <div className="flex flex-col gap-1">
                {Object.values(sessions).length === 0 && (
                  <p className="text-[10px] text-text-faint text-center py-2">No active sessions</p>
                )}
                {Object.values(sessions).map(session => {
                  const isActive = session.id === activeSessionId;
                  const isOpen = session.socket.readyState === WebSocket.OPEN;
                  return (
                    <div
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={clsx(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer transition-all duration-150 group",
                        isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-white/[0.04] border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0", isOpen ? "bg-success status-dot-live" : "bg-danger")} />
                        <TerminalSquare size={12} className={isActive ? "text-primary" : "text-text-faint"} />
                        <span className={clsx("text-[11px] truncate", isActive ? "text-primary font-medium" : "text-text-muted")}>{session.name}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); closeSession(session.id); }}
                        className="opacity-0 group-hover:opacity-70 hover:!opacity-100 p-0.5 rounded hover:text-danger transition-all"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive commands */}
            <div className="p-3 border-b border-border">
              <p className="text-[9px] uppercase tracking-widest text-text-faint mb-1 font-semibold">Commands</p>
              <p className="text-[9px] text-text-faint mb-2 leading-tight">Double-click or drag to terminal</p>
              <div className="flex flex-col gap-1">
                {interactiveCommands.map(cmd => (
                  <div
                    key={cmd.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('application/json', JSON.stringify(cmd));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onDoubleClick={() => {
                      if (!activeSessionId) return;
                      if (cmd.noInput) {
                        onSendToTerminal(`${cmd.cmd}\n`);
                        return;
                      }
                      onCommandTrigger(cmd);
                    }}
                    className="px-2.5 py-1.5 font-mono text-[10px] text-text-faint rounded cursor-grab hover:bg-white/[0.04] hover:text-primary border border-transparent hover:border-border transition-all duration-150 active:cursor-grabbing"
                    title={`Command: ${cmd.cmd}`}
                  >
                    {cmd.label}
                  </div>
                ))}
              </div>
            </div>

            {/* System stats */}
            <div>
              <div className="px-3 pt-3">
                <p className="text-[9px] uppercase tracking-widest text-text-faint mb-1 font-semibold">System</p>
              </div>
              <SystemStats />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
