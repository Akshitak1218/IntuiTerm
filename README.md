# IntuiTerm

IntuiTerm is a browser-based terminal workspace that provides Linux-style command execution, multi-session terminal management, and integrated file exploration on top of a local backend service.

## Overview

IntuiTerm is designed to offer a streamlined command-line experience with:

- Multiple terminal sessions in a single interface
- Drag-and-drop and double-click command shortcuts
- Integrated file explorer with live refresh behavior
- Real-time system status panel
- Natural-language command translation endpoint integration
- Theme support for terminal and UI surfaces

The application runs as a full-stack local project with a React frontend and a FastAPI backend.

## Core Features

- **Terminal Sessions**
  - Create, switch, close, and reorder sessions
  - WebSocket-based real-time terminal I/O
  - Resize synchronization between frontend and PTY

- **Command Workflows**
  - Quick command cards with modal-driven argument capture
  - Editor workflows using `vi` (including command remapping support)
  - Support for common filesystem and shell operations

- **File Explorer**
  - Recursive tree rendering (depth-limited by backend API)
  - Search filter for file/folder names
  - Live update polling plus manual refresh

- **System and Utility Panels**
  - CPU and memory visibility
  - Session-aware command history
  - AI translate endpoint integration for NL-to-command scenarios

## Tech Stack

### Frontend

- **React 19** with TypeScript
- **Vite** for development and production build tooling
- **Tailwind CSS** for styling
- **xterm.js** for terminal rendering
- **@dnd-kit** for drag-and-drop interactions
- **lucide-react** for iconography

### Backend

- **FastAPI** for REST and WebSocket APIs
- **Python 3.12+**
- **winpty** (Windows) for PTY process bridging
- **BusyBox** runtime for Linux-like command compatibility on Windows
- **psutil** for runtime system telemetry

## Repository Structure

```text
.
├─ frontend/                # React + Vite client
│  ├─ src/
│  │  ├─ components/        # UI modules
│  │  ├─ hooks/             # Session and theme hooks
│  │  └─ App.tsx            # Main layout and command modal flow
│  └─ package.json
├─ backend/                 # FastAPI server
│  ├─ app/
│  │  ├─ api/routes.py      # REST + WebSocket routes
│  │  └─ services/          # Terminal and AI service logic
│  ├─ bin/                  # BusyBox and terminal assets
│  └─ requirements.txt
└─ SETUP_FROM_ZERO_WINDOWS.txt
```

## Architecture Summary

1. Frontend initializes UI and terminal session state.
2. Terminal sessions connect to backend through WebSocket (`/api/v1/ws/{session_id}`).
3. Backend terminal manager spawns and manages PTY processes.
4. File explorer and system panels retrieve data via REST endpoints.
5. Terminal output is streamed to xterm.js in real time.



## Prerequisites

- Windows 10/11 (recommended for current runtime path)
- Git
- Node.js LTS and npm
- Python 3.12+
- `winget` (recommended for tool installation)

## Installation and Setup

Use the command script in:

- `SETUP_FROM_ZERO_WINDOWS.txt`

This setup guide installs required tools, frontend dependencies, backend dependencies, and validates BusyBox/terminfo presence.

## Running the Application

From the project root:

1. Start backend:
   - `cd backend`
   - `python .\run.py`
2. Start frontend in a separate terminal:
   - `cd frontend`
   - `npm run dev`
3. Open:
   - `http://localhost:5173`

## Available Backend Endpoints

- `GET /api/v1/files`  
  Returns file tree data for explorer rendering.

- `GET /api/v1/system-info`  
  Returns runtime system metrics.

- `POST /api/v1/ai/translate`  
  Accepts natural language input and returns command output payload.

- `WS /api/v1/ws/{session_id}`  
  Provides bidirectional terminal session transport.

## Build and Quality Checks

Frontend production build:

- `cd frontend`
- `npm run build`

This validates TypeScript compilation and Vite bundling.

## Operational Notes

- For terminal editor reliability on Windows, verify:
  - `backend/bin/busybox.exe`
  - `backend/bin/share/terminfo/...`
- If frontend changes are not visible immediately, perform a hard browser refresh (`Ctrl+F5`).
- If backend terminal behavior changes, restart backend to apply environment/session updates.

## Troubleshooting

- **Blank or unresponsive UI**
  - Confirm frontend dev server is running and reachable on port `5173`.
  - Check backend is available on configured API/WebSocket host and port.

- **Terminal session does not connect**
  - Verify backend process is active.
  - Confirm WebSocket route `/api/v1/ws/{session_id}` is reachable.

- **Editor commands fail**
  - Confirm BusyBox exists at `backend/bin/busybox.exe`.
  - Confirm terminfo directory exists under `backend/bin/share/terminfo`.