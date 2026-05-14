import React, { useState, useEffect, useCallback } from 'react';

interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  children?: FileNode[];
}

interface FileExplorerProps {
  onFileClick: (path: string, name: string) => void;
}

const FILE_ICONS: Record<string, string> = {
  '.py': '🐍', '.ts': '📘', '.tsx': '⚛️', '.js': '📜', '.jsx': '⚛️',
  '.json': '📋', '.md': '📝', '.txt': '📄', '.css': '🎨', '.html': '🌐',
  '.sh': '⚙️', '.yaml': '📐', '.yml': '📐', '.env': '🔐', '.gitignore': '🚫',
  '.toml': '📐', '.lock': '🔒', '.sql': '🗃️', '.bat': '⚙️',
};

function getFileIcon(name: string, isDir: boolean): string {
  if (isDir) return '📁';
  const ext = name.includes('.') ? '.' + name.split('.').pop()!.toLowerCase() : '';
  return FILE_ICONS[ext] || '📄';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'K';
  return (bytes / (1024 * 1024)).toFixed(1) + 'M';
}

function FileTreeNode({
  node,
  depth,
  onFileClick,
}: {
  node: FileNode;
  depth: number;
  onFileClick: (path: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.is_dir) setExpanded(p => !p);
    else onFileClick(node.path, node.name);
  };

  return (
    <div>
      <div
        onClick={toggle}
        title={node.path}
        className="group flex items-center gap-1.5 px-2 py-[3px] rounded cursor-pointer select-none hover:bg-white/[0.05] transition-colors duration-100"
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {node.is_dir && (
          <span className="text-text-faint text-[9px] w-3 shrink-0 transition-transform duration-150" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}>
            ▶
          </span>
        )}
        {!node.is_dir && <span className="w-3 shrink-0" />}
        <span className="text-[13px] shrink-0">{getFileIcon(node.name, node.is_dir)}</span>
        <span className={`text-[11px] truncate flex-1 font-mono ${node.is_dir ? 'text-text-primary font-medium' : 'text-text-muted'} group-hover:text-text-primary transition-colors`}>
          {node.name}
        </span>
        {!node.is_dir && node.size !== undefined && (
          <span className="text-[9px] text-text-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0 font-mono">
            {formatSize(node.size)}
          </span>
        )}
      </div>
      {node.is_dir && expanded && node.children && (
        <div>
          {node.children.map(child => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} onFileClick={onFileClick} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ onFileClick }: FileExplorerProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchFiles = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:7681/api/v1/files');
      if (!res.ok) throw new Error('Failed to load');
      const data: FileNode[] = await res.json();
      setTree(data);
    } catch (e) {
      setError('Could not load files');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(true); }, [fetchFiles]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchFiles(false);
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchFiles]);

  const filterTree = (nodes: FileNode[], q: string): FileNode[] => {
    if (!q) return nodes;
    return nodes.flatMap(n => {
      if (n.name.toLowerCase().includes(q.toLowerCase())) return [n];
      if (n.is_dir && n.children) {
        const filtered = filterTree(n.children, q);
        if (filtered.length) return [{ ...n, children: filtered }];
      }
      return [];
    });
  };

  const displayed = filterTree(tree, search);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-faint">Explorer</span>
        <button
          onClick={() => fetchFiles(true)}
          title="Refresh"
          className="text-text-faint hover:text-primary p-1 rounded transition-colors text-xs"
        >
          ↻
        </button>
      </div>
      {/* Search */}
      <div className="px-2 py-1.5 border-b border-border shrink-0">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full bg-bg-base/60 border border-border rounded px-2 py-1 text-[11px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-primary/50 transition-colors font-mono"
        />
      </div>
      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && (
          <div className="flex items-center justify-center h-20 text-text-faint text-xs">
            <span className="animate-pulse">Loading…</span>
          </div>
        )}
        {error && (
          <div className="px-3 py-2 text-[11px] text-danger/80">{error}</div>
        )}
        {!loading && !error && displayed.length === 0 && (
          <div className="px-3 py-4 text-[11px] text-text-faint text-center">
            {search ? 'No files match your search' : 'Empty directory'}
          </div>
        )}
        {!loading && displayed.map(node => (
          <FileTreeNode key={node.path} node={node} depth={0} onFileClick={onFileClick} />
        ))}
      </div>
    </div>
  );
}
