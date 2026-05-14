import { useState } from 'react';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import type { InteractiveCommand } from './components/Sidebar';
import { TerminalPane } from './components/TerminalPane';
import { InfoPanel } from './components/InfoPanel';
import { useTerminalSessions } from './hooks/useTerminalSessions';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<InteractiveCommand | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [commandInput2, setCommandInput2] = useState('');
  const [editorChoice, setEditorChoice] = useState<'vi'>('vi');

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    cmdHistory,
    createSession,
    closeSession,
    sendCommand,
    containerRefs,
    currentTheme,
    setCurrentTheme,
    reorderSessions
  } = useTerminalSessions();

  const resetCommandModal = () => {
    setPendingCommand(null);
    setCommandInput('');
    setCommandInput2('');
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCommand || !activeSessionId) {
      return;
    }

    if (pendingCommand.id === 'pwd') {
      sendCommand(activeSessionId, 'pwd\n');
      resetCommandModal();
      return;
    }

    if (pendingCommand.id === 'cd' && commandInput.trim()) {
      sendCommand(activeSessionId, `cd "${commandInput.trim()}"\n`);
      resetCommandModal();
      return;
    }

    if ((pendingCommand.id === 'cp' || pendingCommand.id === 'mv') && commandInput.trim() && commandInput2.trim()) {
      sendCommand(activeSessionId, `${pendingCommand.id} "${commandInput.trim()}" "${commandInput2.trim()}"\n`);
      resetCommandModal();
      return;
    }

    if (commandInput.trim()) {
      const arg = commandInput.trim().includes(' ')
        ? `"${commandInput.trim()}"`
        : commandInput.trim();
      const commandPrefix = pendingCommand.id === 'edit' ? `${editorChoice} ` : pendingCommand.cmd;
      sendCommand(activeSessionId, commandPrefix + arg + '\n');
      resetCommandModal();
    }
  };

  const handleSendToTerminal = (cmd: string) => {
    if (activeSessionId) {
      sendCommand(activeSessionId, cmd);
    } else {
      const sess = createSession();
      setTimeout(() => {
        sendCommand(sess.id, cmd);
      }, 600);
    }
  };

  const handleQuickCommand = (cmd: string) => {
    if (Object.keys(sessions).length === 0) {
      const sess = createSession();
      setTimeout(() => sendCommand(sess.id, cmd), 600);
    } else if (activeSessionId) {
      sendCommand(activeSessionId, cmd);
    }
  };

  return (
    <div className="grid grid-cols-[208px_1fr_256px] grid-rows-[48px_1fr] h-dvh bg-bg-base text-text-primary overflow-hidden">
      <Topbar
        onMenuToggle={() => setIsSidebarOpen(p => !p)}
        onCreateSession={createSession}
        sessions={sessions}
        currentTheme={currentTheme}
        setTheme={setCurrentTheme}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        closeSession={closeSession}
        onCommandTrigger={cmd => setPendingCommand(cmd)}
        onSendToTerminal={handleSendToTerminal}
      />

      <TerminalPane
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        closeSession={closeSession}
        reorderSessions={reorderSessions}
        containerRefs={containerRefs}
        onCommandTrigger={cmd => setPendingCommand(cmd)}
        onQuickCommand={handleQuickCommand}
      />

      <InfoPanel
        cmdHistory={cmdHistory}
        activeSession={activeSessionId ? sessions[activeSessionId] : null}
        sendCommand={sendCommand}
      />

      {pendingCommand && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 fade-in"
          onClick={e => { if (e.target === e.currentTarget) resetCommandModal(); }}
        >
          <div className="glass-elevated rounded-xl shadow-2xl w-[420px] p-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-primary">{pendingCommand.label}</h3>
                <p className="text-[11px] text-text-muted mt-0.5">{pendingCommand.prompt}</p>
                {pendingCommand.id === 'edit' && (
                  <div className="mt-2 inline-flex rounded-md border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setEditorChoice('vi')}
                      className={`px-2 py-1 text-[10px] ${editorChoice === 'vi' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-white/5'}`}
                    >
                      vi
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={resetCommandModal}
                className="text-text-faint hover:text-text-primary p-1.5 rounded-lg hover:bg-white/10 transition-colors text-lg leading-none"
              >
                x
              </button>
            </div>
            <form onSubmit={handleCommandSubmit} className="flex gap-2">
              <div className="flex flex-col gap-2 bg-bg-base border border-border rounded-lg px-3 py-2 flex-1 focus-within:border-primary/40 transition-colors">
                <span className="text-primary/60 font-mono text-xs select-none whitespace-nowrap">
                  {pendingCommand.id === 'edit' ? `${editorChoice} ` : pendingCommand.cmd}
                </span>
                <input
                  type="text"
                  autoFocus
                  value={commandInput}
                  onChange={e => setCommandInput(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-text-primary flex-1 min-w-0 font-mono"
                  placeholder={pendingCommand.id === 'pwd' ? 'No input needed' : (pendingCommand.prompt || '...')}
                  disabled={pendingCommand.id === 'pwd'}
                />
                {(pendingCommand.id === 'cp' || pendingCommand.id === 'mv') && (
                  <input
                    type="text"
                    value={commandInput2}
                    onChange={e => setCommandInput2(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-text-primary flex-1 min-w-0 font-mono"
                    placeholder={pendingCommand.prompt2 || 'Destination path'}
                  />
                )}
              </div>
              <button
                type="submit"
                className="bg-primary/90 hover:bg-primary text-bg-base px-4 py-2 rounded-lg text-sm font-bold transition-all hover:-translate-y-px active:translate-y-0"
              >
                Run
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
