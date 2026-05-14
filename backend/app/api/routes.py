import os
import platform
import psutil
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from typing import List, Optional
from app.services.terminal import terminal_manager
from app.services.ai import ai_service

router = APIRouter()

class AITranslateRequest(BaseModel):
    prompt: str

class AITranslateResponse(BaseModel):
    command: str

class FileNode(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: Optional[int] = None
    children: Optional[List['FileNode']] = None

class SystemInfo(BaseModel):
    os_name: str
    os_version: str
    hostname: str
    cpu_count: int
    cpu_percent: float
    memory_total_mb: int
    memory_used_mb: int
    memory_percent: float
    active_sessions: int
    uptime_seconds: float

def build_file_tree(path: str, max_depth: int = 3, current_depth: int = 0) -> List[FileNode]:
    nodes = []
    try:
        entries = sorted(os.scandir(path), key=lambda e: (not e.is_dir(), e.name.lower()))
        for entry in entries:
            if entry.name.startswith('.') or entry.name in {'node_modules', '__pycache__', '.git', 'venv', '.venv'}:
                continue
            node = FileNode(
                name=entry.name,
                path=entry.path.replace('\\', '/'),
                is_dir=entry.is_dir(),
                size=entry.stat().st_size if not entry.is_dir() else None,
            )
            if entry.is_dir() and current_depth < max_depth - 1:
                node.children = build_file_tree(entry.path, max_depth, current_depth + 1)
            nodes.append(node)
    except PermissionError:
        pass
    return nodes

@router.get("/files", response_model=List[FileNode])
async def list_files(path: str = Query(default=".")):
    # Resolve relative to the project root (two levels up from this file)
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    target = os.path.normpath(os.path.join(base, path))
    # Security: ensure path stays within base
    if not target.startswith(base):
        target = base
    return build_file_tree(target)

@router.get("/system-info", response_model=SystemInfo)
async def get_system_info():
    mem = psutil.virtual_memory()
    boot_time = psutil.boot_time()
    import time
    uptime = time.time() - boot_time
    return SystemInfo(
        os_name=platform.system(),
        os_version=platform.version()[:60],
        hostname=platform.node(),
        cpu_count=psutil.cpu_count(logical=True) or 1,
        cpu_percent=psutil.cpu_percent(interval=0.1),
        memory_total_mb=mem.total // (1024 * 1024),
        memory_used_mb=mem.used // (1024 * 1024),
        memory_percent=mem.percent,
        active_sessions=len(terminal_manager.sessions),
        uptime_seconds=uptime,
    )

@router.websocket("/ws/{session_id}")
async def websocket_terminal(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    success = await terminal_manager.create_session(session_id, websocket)
    if not success:
        await websocket.close(code=1013, reason="Server busy or failed to spawn PTY")
        return

    try:
        while True:
            text = await websocket.receive_text()
            await terminal_manager.handle_client_input(session_id, text)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error for {session_id}: {e}")
    finally:
        await terminal_manager.close_session(session_id)

@router.post("/ai/translate", response_model=AITranslateResponse)
async def translate_natural_language(request: AITranslateRequest):
    command = ai_service.translate_to_command(request.prompt)
    return AITranslateResponse(command=command)
