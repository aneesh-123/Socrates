# Docker Setup Guide

## ✅ Yes, Docker Desktop Must Be Running

The backend uses Docker to execute code in isolated containers. **Docker Desktop must be running** for the application to work.

---

## 🔧 Configuration Required: **NONE!**

The good news: **No special configuration needed!** The backend automatically connects to Docker using the default settings.

---

## 🚀 What You Need to Do

### 1. Start Docker Desktop
- Open Docker Desktop application
- Wait until it shows "Docker Desktop is running" (green icon in system tray)
- That's it! No configuration needed.

### 2. Verify Docker is Working

Run this in PowerShell to test:
```powershell
docker ps
```

**Expected:** Should show an empty list (or running containers) - no errors.

If you see an error like "Cannot connect to Docker daemon", Docker Desktop isn't running yet.

---

## 📦 Docker Image (Automatic)

The backend uses the `gcc:latest` image. **You don't need to do anything** - Docker will automatically download it on first use.

**First code execution will be slower** (~30 seconds) because Docker needs to download the ~500MB image. After that, it's cached and much faster.

### Optional: Pre-download the Image

If you want to download it now (optional):
```powershell
docker pull gcc:latest
```

---

## 🔍 How It Works

1. **Backend connects to Docker** via the default Docker socket (no config needed)
2. **Creates a container** with your code
3. **Compiles and runs** the code inside the container
4. **Returns the output** and cleans up

The backend uses the `dockerode` library which automatically finds Docker on:
- **Windows:** `\\.\pipe\docker_engine` (Docker Desktop default)
- **Linux/Mac:** `/var/run/docker.sock` (default)

**No configuration needed!** It just works. ✨

---

## 🐛 Troubleshooting

### "Cannot connect to Docker daemon"
- **Solution:** Start Docker Desktop
- Wait for it to fully start (green icon in system tray)

### "Docker Desktop is starting..."
- **Solution:** Wait a bit longer. Docker Desktop takes 10-30 seconds to start.

### "Image not found" error
- **Solution:** Docker will auto-download on first use, or run:
  ```powershell
  docker pull gcc:latest
  ```

### Docker Desktop won't start
- Check if virtualization is enabled in BIOS
- Make sure WSL 2 is installed (Windows)
- Restart your computer

---

## ✅ Quick Check

Before starting the backend, verify Docker is ready:

```powershell
# Should show Docker version
docker --version

# Should show running containers (can be empty)
docker ps

# Should work without errors
docker info
```

If all three commands work → Docker is ready! 🎉

---

## 💡 Summary

- ✅ **Docker Desktop must be running**
- ✅ **No configuration needed** - uses defaults
- ✅ **Image downloads automatically** on first use
- ✅ **Just start Docker Desktop** and you're good to go!

