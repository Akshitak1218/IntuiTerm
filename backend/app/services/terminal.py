import asyncio
import json
import os
import sys
from typing import Dict
from fastapi import WebSocket

USE_WINPTY = sys.platform == 'win32'
if USE_WINPTY:
    import winpty

# Setup busybox path for real Linux environment on Windows
# The backend is typically run from the 'backend' folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUSYBOX_PATH = os.path.join(BASE_DIR, "bin", "busybox.exe")
print(f"DEBUG: BUSYBOX_PATH is set to {BUSYBOX_PATH}")


class TerminalManager:
    def __init__(self):
        self.sessions: Dict[str, dict] = {}
        self.line_buffers: Dict[str, str] = {}
        self.max_sessions = 20

    async def create_session(self, session_id: str, websocket: WebSocket) -> bool:
        if len(self.sessions) >= self.max_sessions:
            return False

        try:
            if USE_WINPTY:
                # Use BusyBox for a real lightweight Linux environment on Windows
                if os.path.exists(BUSYBOX_PATH):
                    # Set up environment variables for BusyBox and Nano
                    bin_dir = os.path.dirname(BUSYBOX_PATH)
                    env = os.environ.copy()
                    
                    # Ensure our local bin and Git utilities are in the PATH
                    git_bin = "C:\\Program Files\\Git\\usr\\bin"
                    git_cmd_bin = "C:\\Program Files\\Git\\bin"
                    env["PATH"] = f"{bin_dir};{git_bin};{git_cmd_bin};{env.get('PATH', '')}"
                    env["HOME"] = os.path.expanduser("~")
                    terminfo_dir = os.path.join(bin_dir, "share", "terminfo")
                    env["TERM"] = "vt100"
                    env["TERMINFO"] = terminfo_dir
                    env["TERMINFO_DIRS"] = terminfo_dir
                    
                    # Critical Windows variable for winpty stability
                    if "SystemRoot" not in env:
                        env["SystemRoot"] = os.environ.get("SystemRoot", "C:\\Windows")

                    # Use list format for winpty spawn (much more reliable)
                    process = winpty.PtyProcess.spawn(
                        [BUSYBOX_PATH, "sh", "-l"],
                        dimensions=(24, 80),
                        env=env
                    )
                else:
                    # Fallback if busybox is missing
                    process = winpty.PtyProcess.spawn(
                        ["cmd.exe"],
                        dimensions=(24, 80)
                    )
            else:
                # On actual Linux/macOS — use real bash
                import ptyprocess
                process = ptyprocess.PtyProcessUnicode.spawn(['/bin/bash'])
                process.setwinsize(24, 80)
        except Exception as e:
            await websocket.send_text(f"\r\nError spawning shell: {e}\r\n")
            return False

        read_task = asyncio.create_task(
            self._read_from_pty(session_id, websocket, process)
        )
        self.sessions[session_id] = {
            "process": process,
            "task": read_task,
            "websocket": websocket,
        }
        self.line_buffers[session_id] = ""
        return True

    async def _read_from_pty(self, session_id: str, websocket: WebSocket, process):
        try:
            while True:
                if USE_WINPTY:
                    data = await asyncio.to_thread(process.read, 4096)
                else:
                    data = await asyncio.to_thread(process.read)

                if not data:
                    break
                await websocket.send_text(data)
        except Exception as e:
            print(f"PTY read error [{session_id}]: {e}")
        finally:
            await self.close_session(session_id)

    async def handle_client_input(self, session_id: str, text: str):
        if session_id not in self.sessions:
            return

        process = self.sessions[session_id]["process"]
        try:
            msg = json.loads(text)
            if isinstance(msg, dict) and msg.get("type") == "resize":
                process.setwinsize(msg.get("rows", 24), msg.get("cols", 80))
            else:
                process.write(text)
        except json.JSONDecodeError:
            # Remap editor commands so typing `nano file` or `vi file` works consistently in BusyBox.
            if text:
                buf = self.line_buffers.get(session_id, "")
                buf += text
                if "\r" in text or "\n" in text:
                    line = buf.replace("\r", "\n").split("\n", 1)[0].strip()
                    self.line_buffers[session_id] = ""
                    if line.startswith("nano ") or line == "nano":
                        arg = line[4:].strip()
                        mapped = f"{BUSYBOX_PATH} vi {arg}\r" if arg else f"{BUSYBOX_PATH} vi\r"
                        process.write(mapped)
                        return
                    if line.startswith("vi ") or line == "vi":
                        arg = line[2:].strip()
                        mapped = f"{BUSYBOX_PATH} vi {arg}\r" if arg else f"{BUSYBOX_PATH} vi\r"
                        process.write(mapped)
                        return
                else:
                    self.line_buffers[session_id] = buf
            process.write(text)

    async def close_session(self, session_id: str):
        if session_id not in self.sessions:
            return

        session = self.sessions.pop(session_id)
        self.line_buffers.pop(session_id, None)
        session["task"].cancel()

        try:
            if USE_WINPTY:
                session["process"].close(force=True)
            else:
                session["process"].terminate(True)
        except Exception:
            pass

        try:
            await session["websocket"].close()
        except Exception:
            pass


terminal_manager = TerminalManager()
