import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export interface TerminalSession {
  id: string;
  name: string;
  socket: WebSocket;
  term: Terminal;
  fitAddon: FitAddon;
}

export const TERMINAL_THEMES = {
  'Default Dark': {
    background: '#0f0f0e', foreground: '#cdccca', cursor: '#4f98a3', cursorAccent: '#0f0f0e',
    black: '#1a1918', brightBlack: '#5a5957', red: '#dd6974', brightRed: '#dd6974',
    green: '#6daa45', brightGreen: '#6daa45', yellow: '#e8af34', brightYellow: '#fdc551',
    blue: '#5591c7', brightBlue: '#5591c7', magenta: '#d163a7', brightMagenta: '#d163a7',
    cyan: '#4f98a3', brightCyan: '#4f98a3', white: '#cdccca', brightWhite: '#f9f8f5',
  },
  'Dracula': {
    background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f2', cursorAccent: '#282a36',
    black: '#21222c', brightBlack: '#6272a4', red: '#ff5555', brightRed: '#ff6e6e',
    green: '#50fa7b', brightGreen: '#69ff94', yellow: '#f1fa8c', brightYellow: '#ffffa5',
    blue: '#bd93f9', brightBlue: '#d6acff', magenta: '#ff79c6', brightMagenta: '#ff92df',
    cyan: '#8be9fd', brightCyan: '#a4ffff', white: '#f8f8f2', brightWhite: '#ffffff',
  },
  'Monokai': {
    background: '#272822', foreground: '#f8f8f2', cursor: '#f8f8f0', cursorAccent: '#272822',
    black: '#272822', brightBlack: '#75715e', red: '#f92672', brightRed: '#f92672',
    green: '#a6e22e', brightGreen: '#a6e22e', yellow: '#f4bf75', brightYellow: '#f4bf75',
    blue: '#66d9ef', brightBlue: '#66d9ef', magenta: '#ae81ff', brightMagenta: '#ae81ff',
    cyan: '#a1efe4', brightCyan: '#a1efe4', white: '#f8f8f2', brightWhite: '#f9f8f5',
  },
};

export type ThemeName = keyof typeof TERMINAL_THEMES;

export function useTerminalSessions() {
  const [sessions, setSessions] = useState<Record<string, TerminalSession>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('Default Dark');
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const createSession = useCallback(() => {
    const id = 'sess_' + Math.random().toString(36).substr(2, 9);
    const name = `Linux Shell ${Object.keys(sessions).length + 1}`;
    
    const wsUrl = `ws://localhost:7681/api/v1/ws/${id}`; 
    const socket = new WebSocket(wsUrl);
    
    const term = new Terminal({
      theme: TERMINAL_THEMES[currentTheme],
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      cursorBlink: true
    });
    
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    socket.onopen = () => {
      fitAddon.fit();
      socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    socket.onmessage = (e) => {
      term.write(e.data);
    };

    socket.onclose = () => {
      term.write('\r\n[Process exited]\r\n');
    };

    term.onData(data => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
      
      if (data === '\r') {
        const activeBuffer = term.buffer.active;
        const currentLine = activeBuffer.getLine(activeBuffer.cursorY + activeBuffer.viewportY);
        if (currentLine) {
          const text = currentLine.translateToString(true).trim();
          if (text && !text.startsWith('PS') && !text.includes('~')) {
            setCmdHistory(prev => [text, ...prev].slice(0, 20));
          }
        }
      }
    });

    term.onResize(size => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
      }
    });

    const newSession = { id, name, socket, term, fitAddon };
    
    setSessions(prev => ({ ...prev, [id]: newSession }));
    setActiveSessionId(id);
    
    return newSession;
  }, [sessions, currentTheme]);

  const closeSession = useCallback((id: string) => {
    setSessions(prev => {
      const newSessions = { ...prev };
      const session = newSessions[id];
      if (session) {
        session.socket.close();
        session.term.dispose();
        delete newSessions[id];
      }
      
      if (activeSessionId === id) {
        const remainingIds = Object.keys(newSessions);
        setActiveSessionId(remainingIds.length > 0 ? remainingIds[0] : null);
      }
      
      return newSessions;
    });
  }, [activeSessionId]);

  const sendCommand = useCallback((id: string, cmd: string) => {
    const session = sessions[id];
    if (session && session.socket.readyState === WebSocket.OPEN) {
      session.socket.send(cmd);
      setCmdHistory(prev => [cmd.trim(), ...prev].slice(0, 20));
      session.term.focus();
    }
  }, [sessions]);

  // Handle theme changes across all active sessions
  useEffect(() => {
    const t = TERMINAL_THEMES[currentTheme];
    Object.values(sessions).forEach(session => {
      session.term.options.theme = t;
    });

    const root = document.documentElement;
    root.style.setProperty('--app-bg-base', t.background);
    root.style.setProperty('--app-bg-surface', t.black);
    root.style.setProperty('--app-bg-surface-2', t.brightBlack);
    root.style.setProperty('--app-primary', t.cyan);
    root.style.setProperty('--app-text-primary', t.foreground);
    root.style.setProperty('--app-text-muted', t.white);
    root.style.setProperty('--app-text-faint', t.brightBlack);
    
    // For borders, let's create a 20% opacity version of foreground
    // Simple hex to rgba approximation (if 6-digit hex)
    let border = t.foreground;
    if (border.length === 7) {
      border = border + '20'; // append 20% alpha
    }
    root.style.setProperty('--app-border', border);

  }, [currentTheme, sessions]);

  // Allow reordering
  const reorderSessions = useCallback((newOrderIds: string[]) => {
    setSessions(prev => {
      const reordered: Record<string, TerminalSession> = {};
      newOrderIds.forEach(id => {
        if (prev[id]) reordered[id] = prev[id];
      });
      return reordered;
    });
  }, []);

  return {
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
  };
}
