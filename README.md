# Socrates - AI-Powered Interactive Coding Tutor

Phase 1: Editor + Compiler

A web-based coding environment that compiles and executes C++ code safely in a Docker sandbox. This is the foundation for an AI-driven tutoring system.

## Architecture

- **Frontend**: React + TypeScript + Monaco Editor
- **Backend**: Node.js + Express + TypeScript
- **Sandbox**: Docker containers with GCC compiler

## Features

- ✅ Live code editor with C++ syntax highlighting
- ✅ One-click code execution
- ✅ Real-time output and error display
- ✅ Secure Docker-based sandboxing
- ✅ Resource limits (CPU, memory, time)
- ✅ Auto-save to localStorage

## Prerequisites

- Node.js 18+ and npm
- Docker Desktop (or Docker Engine)
- Git

## Setup

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

### Docker Sandbox Image

Build the sandbox image (optional - uses `gcc:latest` by default):

```bash
cd backend
docker build -f Dockerfile.sandbox -t socrates-sandbox .
```

Update `backend/src/config/docker.ts` to use `socrates-sandbox` if you built a custom image.

## Usage

1. Start the backend server
2. Start the frontend development server
3. Open `http://localhost:3000` in your browser
4. Write C++ code in the editor
5. Click "Run" or press `Ctrl+Enter` to execute
6. View output or errors in the right panel

## Project Structure

```
Socrates/
├── backend/
│   ├── src/
│   │   ├── config/        # Docker configuration
│   │   ├── services/       # Docker, file, compiler services
│   │   ├── routes/         # API endpoints
│   │   └── server.ts       # Express app entry
│   └── Dockerfile.sandbox  # Sandbox image definition
│
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   ├── hooks/          # Custom React hooks
    │   ├── services/       # API client
    │   └── App.tsx         # Main app component
    └── index.html
```

## API Endpoints

- `POST /api/execute` - Execute C++ code
- `GET /api/health` - Health check

## Security Features

- Docker container isolation
- No network access in containers
- Resource limits (CPU, memory)
- Execution timeouts
- Code size limits
- Automatic container cleanup

## Future Phases

- Real-time code analysis
- AI-powered hints and feedback
- Lesson modules
- CUDA support
- Adaptive tutoring

## License

ISC

