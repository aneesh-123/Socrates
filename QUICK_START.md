# Quick Start - Get Running in 5 Minutes

## ✅ Prerequisites Check (Already Done!)
- ✅ Node.js v22.15.1
- ✅ npm 10.9.2  
- ✅ Docker 24.0.2
- ✅ Dependencies installed

---

## 🚀 Start the Backend

**Open Terminal 1:**

```powershell
cd backend
npm run dev
```

**Wait for:** `🚀 Server running on http://localhost:3001`

**Keep this terminal open!**

---

## 🎨 Start the Frontend

**Open Terminal 2 (new terminal):**

```powershell
cd frontend
npm run dev
```

**Wait for:** `Local: http://localhost:3000/`

---

## 🌐 Open in Browser

1. Open your browser
2. Go to: **http://localhost:3000**
3. You should see the code editor!

---

## 🧪 Test It!

### Test 1: Run Default Code
- The editor already has "Hello, World!" code
- Click the **"Run"** button (top right)
- **First time:** May take 10-30 seconds (Docker pulling image)
- **Expected:** See "Hello, World!" in the output panel

### Test 2: Try Your Own Code
Replace the code with:
```cpp
#include <iostream>
using namespace std;

int main() {
    int a = 5, b = 10;
    cout << "Sum: " << (a + b) << endl;
    return 0;
}
```
Click **Run** → Should output: `Sum: 15`

### Test 3: See an Error
Try this (missing semicolon):
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Error test" << endl  // Missing semicolon!
    return 0;
}
```
Click **Run** → Should show compiler errors in red

---

## 🐛 Troubleshooting

### Backend won't start?
- **"Cannot connect to Docker"** → Start Docker Desktop
- **"Port 3001 in use"** → Close whatever is using port 3001

### Frontend won't start?
- **"Port 3000 in use"** → Close whatever is using port 3000

### Code execution fails?
- Check Terminal 1 (backend) for error messages
- Make sure Docker Desktop is running
- First run is slow (Docker downloading gcc image)

### "Network error" in browser?
- Make sure backend is running in Terminal 1
- Check http://localhost:3001/api/health in browser

---

## ✅ Success Checklist

- [ ] Backend terminal shows "Server running"
- [ ] Frontend terminal shows "Local: http://localhost:3000"
- [ ] Browser shows the editor
- [ ] "Hello, World!" runs successfully
- [ ] Output appears in right panel

**If all checked → You're ready to code! 🎉**

---

## 💡 Tips

- **Keyboard shortcut:** `Ctrl+Enter` to run code
- **Auto-save:** Code is saved to browser localStorage
- **First run:** Takes longer (Docker image download)
- **Subsequent runs:** Much faster!

