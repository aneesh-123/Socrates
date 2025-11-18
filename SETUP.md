# Setup Guide

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Ensure Docker is Running

Make sure Docker Desktop (or Docker Engine) is running on your system. The backend will use Docker to execute code in isolated containers.

**Verify Docker:**
```bash
docker --version
docker ps
```

### 3. Pull Docker Image (Optional)

The backend uses `gcc:latest` by default. Pull it if you haven't already:

```bash
docker pull gcc:latest
```

### 4. Start Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### 5. Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### 6. Open in Browser

Navigate to `http://localhost:3000` and start coding!

## Troubleshooting

### Docker Issues

**Problem:** "Cannot connect to Docker daemon"
- **Solution:** Make sure Docker Desktop is running

**Problem:** "Image not found"
- **Solution:** Run `docker pull gcc:latest`

**Problem:** "Permission denied" (Linux)
- **Solution:** Add your user to the docker group: `sudo usermod -aG docker $USER` (then log out and back in)

### Port Conflicts

**Problem:** Port 3000 or 3001 already in use
- **Solution:** Change ports in:
  - Backend: `backend/src/server.ts` (PORT variable)
  - Frontend: `frontend/vite.config.ts` (server.port)

### Build Issues

**Problem:** TypeScript errors
- **Solution:** Run `npm install` in both directories to ensure all dependencies are installed

## Development Tips

- The backend auto-reloads on file changes (using `tsx watch`)
- The frontend uses Vite's hot module replacement
- Code is auto-saved to localStorage
- Use `Ctrl+Enter` to run code quickly

## Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ folder with a static server
```

