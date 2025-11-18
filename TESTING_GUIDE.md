# Testing Guide for Phase 3 & 4

This guide will help you test the error explanation feature end-to-end.

## Prerequisites

1. **OpenAI API Key**: Make sure you have `OPENAI_API_KEY` set in your `.env` file in the `backend` directory
2. **Backend dependencies**: Run `npm install` in the `backend` directory
3. **Frontend dependencies**: Run `npm install` in the `frontend` directory

---

## Step 1: Start the Backend Server

Open a terminal and navigate to the backend directory:

```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:3001
📝 Health check: http://localhost:3001/api/health
```

**If you see errors:**
- Check that port 3001 is not already in use
- Verify `.env` file exists in `backend` directory
- Check that `OPENAI_API_KEY` is set correctly

---

## Step 2: Test Backend Endpoint Directly (Optional but Recommended)

Open a **new terminal** and test the API endpoint with curl or Postman:

### Using curl (Windows PowerShell):

```powershell
curl -X POST http://localhost:3001/api/errors/explain `
  -H "Content-Type: application/json" `
  -d '{\"errorText\": \"main.cpp:5:10: error: expected '\'';'\'' before '\''}'\''\", \"code\": \"#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0\n}\"}'
```

### Using curl (Git Bash or Linux/Mac):

```bash
curl -X POST http://localhost:3001/api/errors/explain \
  -H "Content-Type: application/json" \
  -d '{
    "errorText": "main.cpp:5:10: error: expected '\'';'\'' before '\''}'\''",
    "code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0\n}"
  }'
```

### Using Postman:

1. Create a new POST request
2. URL: `http://localhost:3001/api/errors/explain`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "errorText": "main.cpp:5:10: error: expected ';' before '}'",
  "code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0\n}"
}
```

**Expected Response:**
```json
{
  "success": true,
  "explanation": {
    "explanation": "What the error means...",
    "whyItHappened": "Why it occurred...",
    "howToFix": "How to fix it...",
    "codeExample": "Optional example..."
  },
  "parsedError": {
    "file": "main.cpp",
    "line": 5,
    "column": 10,
    "type": "syntax",
    "message": "expected ';' before '}'",
    "rawError": "..."
  },
  "allErrors": [...]
}
```

**If you get an error:**
- Check backend console for error messages
- Verify OpenAI API key is valid
- Check network connectivity

---

## Step 3: Start the Frontend

Open a **new terminal** and navigate to the frontend directory:

```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

The app should automatically open in your browser at `http://localhost:3000`

---

## Step 4: Test the Full Integration

### Test Case 1: Missing Semicolon Error

1. **Write code with an error** in the editor:
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl
    return 0;
}
```

2. **Click "Run"** button (or press `Ctrl+Enter`)

3. **Expected**: You should see an error message like:
```
main.cpp:5:5: error: expected ';' before 'return'
```

4. **Click the "💡 Explain Error" button** next to "Errors:"

5. **Expected behavior:**
   - Button text changes to "🤔 Analyzing..."
   - After a few seconds, an explanation box appears below the error
   - The explanation should have sections:
     - **What this means:**
     - **Why it happened:**
     - **How to fix it:**
     - **Example:** (optional)

### Test Case 2: Undefined Variable Error

1. **Write code with undefined variable**:
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << x << endl;
    return 0;
}
```

2. **Click "Run"**

3. **Click "💡 Explain Error"**

4. **Verify** the explanation explains that `x` is not declared

### Test Case 3: Type Error

1. **Write code with type mismatch**:
```cpp
#include <iostream>
using namespace std;

int main() {
    int x = "hello";
    return 0;
}
```

2. **Click "Run"** and then **"💡 Explain Error"**

3. **Verify** the explanation addresses the type mismatch

---

## Step 5: Test Error Handling

### Test Case 4: Network Error (Backend Offline)

1. **Stop the backend server** (Ctrl+C in backend terminal)

2. **In the frontend**, try to explain an error

3. **Expected**: You should see an error message like:
   ```
   ⚠️ Error
   Failed to get error explanation: Network Error
   ```

### Test Case 5: Invalid Error Format

1. **Start backend again**

2. **Test with invalid error text** (if you have a way to trigger this)

3. **Expected**: Backend should return 400 with message about parsing failure

---

## What to Look For

### ✅ Success Indicators:

- [ ] Backend starts without errors
- [ ] Frontend loads and displays the editor
- [ ] Code execution works (Run button)
- [ ] Errors are displayed correctly
- [ ] "💡 Explain Error" button appears when errors exist
- [ ] Button shows loading state ("🤔 Analyzing...")
- [ ] Explanation appears with all sections
- [ ] Explanation is helpful and beginner-friendly
- [ ] Button is disabled while loading
- [ ] Error messages are shown if API fails

### ❌ Common Issues:

**Issue**: Backend won't start
- **Fix**: Check if port 3001 is in use, check `.env` file

**Issue**: "Explain Error" button doesn't appear
- **Fix**: Make sure there's an actual error (not just warnings)

**Issue**: Explanation never loads
- **Fix**: Check browser console (F12) for errors, verify backend is running

**Issue**: "OpenAI API key not configured"
- **Fix**: Check `backend/.env` file has `OPENAI_API_KEY=your_key_here`

**Issue**: CORS errors in browser console
- **Fix**: Verify backend CORS settings allow `http://localhost:3000`

---

## Quick Test Checklist

- [ ] Backend server running on port 3001
- [ ] Frontend running on port 3000
- [ ] Can execute code successfully
- [ ] Errors are displayed when code has errors
- [ ] "Explain Error" button appears
- [ ] Button triggers loading state
- [ ] Explanation appears after loading
- [ ] Explanation has all expected sections
- [ ] Error handling works (test with backend offline)

---

## Browser Developer Tools

To debug issues, open browser DevTools (F12):

1. **Console tab**: Check for JavaScript errors
2. **Network tab**: 
   - Look for requests to `/api/errors/explain`
   - Check response status (should be 200)
   - View response data
3. **React DevTools**: Inspect component state

---

## Expected API Call

When you click "Explain Error", you should see in the Network tab:

**Request:**
- Method: `POST`
- URL: `http://localhost:3001/api/errors/explain`
- Headers: `Content-Type: application/json`
- Body: 
```json
{
  "errorText": "main.cpp:5:10: error: ...",
  "code": "#include <iostream>..."
}
```

**Response:**
- Status: `200 OK`
- Body: JSON with `success: true` and `explanation` object

---

## Troubleshooting Commands

### Check if backend is running:
```bash
curl http://localhost:3001/api/health
```
Should return: `{"status":"ok","service":"socrates-backend"}`

### Check backend logs:
Look at the terminal where `npm run dev` is running in the backend directory

### Check frontend logs:
Look at the terminal where `npm run dev` is running in the frontend directory

### Check browser console:
Press F12 in the browser, go to Console tab

---

## Next Steps After Testing

Once everything works:
1. Try different types of errors
2. Test with longer code snippets
3. Test error handling edge cases
4. Consider adding auto-explanation feature (optional from guide)
5. Polish UI/UX based on your experience

---

**Happy Testing!** 🚀


