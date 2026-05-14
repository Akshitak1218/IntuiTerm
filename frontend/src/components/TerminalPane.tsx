import React, { useEffect } from 'react';
import type { TerminalSession } from '../hooks/useTerminalSessions';
import { TerminalSquare, X } from 'lucide-react';
import clsx from 'clsx';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WelcomeBanner } from './WelcomeBanner';

interface SortableTabProps {
  session: TerminalSession;
  isActive: boolean;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}

function SortableTab({ session, isActive, onActivate, onClose }: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: session.id });
  const isConnected = session.socket.readyState === WebSocket.OPEN;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onActivate(session.id)}
      {...attributes}
      {...listeners}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 text-[11px] rounded-t-lg cursor-pointer border-b-2 transition-all duration-150 relative select-none",
        isActive
          ? "border-primary text-primary bg-primary/[0.08] tab-active-glow"
          : "border-transparent text-text-muted hover:bg-white/[0.04] hover:text-text-primary",
        isDragging && "opacity-60 shadow-lg scale-105"
      )}
    >
      <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0", isConnected ? "bg-success" : "bg-danger/60")} />
      <TerminalSquare size={12} />
      <span className="font-medium">{session.name}</span>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onClose(session.id); }}
        className="ml-1 p-0.5 rounded hover:bg-white/10 hover:text-danger transition-colors"
      >
        <X size={11} />
      </button>
    </div>
  );
}

interface TerminalPaneProps {
  sessions: Record<string, TerminalSession>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  closeSession: (id: string) => void;
  reorderSessions: (newOrderIds: string[]) => void;
  containerRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onCommandTrigger: (cmd: any) => void;
  onQuickCommand: (cmd: string) => void;
}

export function TerminalPane({
  sessions, activeSessionId, setActiveSessionId, closeSession,
  reorderSessions, containerRefs, onCommandTrigger, onQuickCommand,
}: TerminalPaneProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const items = Object.keys(sessions);
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      reorderSessions(arrayMove(items, oldIndex, newIndex));
    }
  };

  // Open terminal in container
  useEffect(() => {
    Object.values(sessions).forEach(session => {
      const container = containerRefs.current[session.id];
      if (container && !container.hasChildNodes()) {
        session.term.open(container);
        setTimeout(() => session.fitAddon.fit(), 50);
      }
    });
  }, [sessions, containerRefs]);

  // Resize on window resize
  useEffect(() => {
    const handleResize = () => {
      if (activeSessionId && sessions[activeSessionId]) {
        sessions[activeSessionId].fitAddon.fit();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeSessionId, sessions]);

  // Focus active
  useEffect(() => {
    if (activeSessionId && sessions[activeSessionId]) {
      setTimeout(() => {
        sessions[activeSessionId].fitAddon.fit();
        sessions[activeSessionId].term.focus();
      }, 50);
    }
  }, [activeSessionId, sessions]);

  const items = Object.keys(sessions);
  const isEmpty = items.length === 0;

  return (
    <main className="col-start-2 row-start-2 flex flex-col min-w-0 bg-bg-base overflow-hidden">
      {/* Tab bar */}
      {!isEmpty && (
        <div className="flex px-3 pt-2 gap-1 overflow-x-auto border-b border-border shrink-0 bg-bg-surface/40">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={horizontalListSortingStrategy}>
              {items.map(id => (
                <SortableTab
                  key={id}
                  session={sessions[id]}
                  isActive={id === activeSessionId}
                  onActivate={setActiveSessionId}
                  onClose={closeSession}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Terminal area */}
      <div
        className="flex-1 relative overflow-hidden"
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={e => {
          e.preventDefault();
          try {
            const data = e.dataTransfer.getData('application/json');
            if (data) {
              const cmd = JSON.parse(data);
              if (cmd?.cmd && activeSessionId) onCommandTrigger(cmd);
            }
          } catch { /* ignore */ }
        }}
      >
        {/* Welcome banner when no sessions */}
        {isEmpty && (
          <WelcomeBanner onCommand={onQuickCommand} />
        )}

        {/* Glow border overlay for active terminal */}
        {!isEmpty && (
          <div className="absolute inset-0 pointer-events-none z-0"
            style={{ boxShadow: 'inset 0 0 60px rgba(79,152,163,0.03)' }} />
        )}

        {/* Terminal containers */}
        {items.map(id => (
          <div
            key={id}
            ref={el => { containerRefs.current[id] = el; }}
            className={clsx(
              "absolute inset-0 p-3 transition-opacity duration-200",
              id === activeSessionId ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
          />
        ))}
      </div>
    </main>
  );
}
