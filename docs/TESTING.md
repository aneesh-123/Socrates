# Testing Guide - Step by Step

## Step 1: Check Prerequisites

First, verify you have everything installed:

```bash
# Check Node.js (should be 18+)
node --version

# Check npm
npm --version

# Check Docker (must be running!)
docker --version
docker ps
```

If Docker isn't running, start Docker Desktop.

---

## Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

**Expected:** Should install packages without errors. Takes ~30 seconds.

---

## Step 3: Test Backend Setup

```bash
# Still in backend directory
npm run dev
```

**Expected:** You should see:
```
🚀 Server running on http://localhost:3001
📝 Health check: http://localhost:3001/api/health
```

**If you see errors:**
- "Cannot connect to Docker" → Start Docker Desktop
- "Port 3001 already in use" → Close the app using that port
- "Module not found" → Run `npm install` again

**Keep this terminal running!** Open a new terminal for the next steps.

---

## Step 4: Test Backend API (Optional)

In a new terminal, test the health endpoint:

```bash
# Windows PowerShell
curl http://localhost:3001/api/health

# Or use a browser: http://localhost:3001/api/health
```

**Expected:** `{"status":"ok","service":"socrates-backend"}`

---

## Step 5: Install Frontend Dependencies

In a new terminal:

```bash
cd frontend
npm install
```

**Expected:** Should install packages. Takes ~1-2 minutes (Monaco Editor is large).

---

## Step 6: Start Frontend

```bash
# Still in frontend directory
npm run dev
```

**Expected:** You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## Step 7: Open in Browser

1. Open your browser
2. Go to `http://localhost:3000`
3. You should see:
   - A code editor on the left (with default "Hello, World!" code)
   - An output panel on the right
   - A "Run" button in the top right

---

## Step 8: Test with Simple Code

The editor should already have this code:
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
```

1. Click the **"Run"** button (or press `Ctrl+Enter`)
2. Wait a few seconds (first run takes longer - Docker needs to pull image)
3. You should see in the output panel:
   - Status: "✓ Success"
   - Output: "Hello, World!"

---

## Step 9: Test Error Handling

Replace the code with something that has an error:

```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "This will fail" << endl
    return 0;  // Missing semicolon!
}
```

Click **Run**. You should see compiler errors in red.

---

## Step 10: Test a More Complex Program

Try this:

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> numbers = {1, 2, 3, 4, 5};
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    return 0;
}
```

Should output: `1 2 3 4 5`

---

## Troubleshooting

### Backend won't start
- **Docker not running:** Start Docker Desktop
- **Port in use:** Change PORT in `backend/src/server.ts`
- **Missing dependencies:** Run `npm install` in backend folder

### Frontend won't start
- **Port in use:** Change port in `frontend/vite.config.ts`
- **Missing dependencies:** Run `npm install` in frontend folder

### "Cannot connect to Docker"
- Make sure Docker Desktop is running
- On Linux, you might need: `sudo usermod -aG docker $USER` (then restart terminal)

### Code execution fails
- Check backend terminal for error messages
- Make sure Docker image exists: `docker pull gcc:latest`
- Check Docker is accessible: `docker ps`

### First run is very slow
- This is normal! Docker needs to pull the `gcc:latest` image (~500MB)
- Subsequent runs will be much faster

---

## Quick Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Browser shows the editor
- [ ] "Hello, World!" code runs successfully
- [ ] Compiler errors are displayed
- [ ] Output appears in the right panel

If all checkboxes are checked, you're good to go! 🎉

