# Phase 3 & 4 Implementation Guide

## Overview

This guide provides step-by-step instructions for completing:
- **Phase 3**: Backend API Endpoint for error explanations
- **Phase 4**: Frontend Integration to display AI explanations

---

## Prerequisites

✅ **Phase 1 Complete**: Error parser (`errorParser.ts`) working  
✅ **Phase 2 Complete**: AI service (`aiService.ts`) working and tested  
✅ **Backend running**: Server should be accessible at `http://localhost:3001`  
✅ **Frontend running**: React app should be accessible at `http://localhost:3000`

---

## Phase 3: Backend API Endpoint

### Goal
Create a REST API endpoint that accepts error text and user code, then returns AI-generated explanations.

### Step 1: Create the Errors Route File

**File to create**: `backend/src/routes/errors.ts`

**Implementation**:
```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { explainError } from '../services/aiService';
import { parseCompilerError, ParsedError } from '../services/errorParser';

const router = Router();

// Request validation schema
const explainRequestSchema = z.object({
  errorText: z.string().min(1, 'Error text cannot be empty'),
  code: z.string().min(1, 'Code cannot be empty'),
});

/**
 * POST /api/errors/explain
 * Generates AI explanation for a compiler error
 */
router.post('/explain', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = explainRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { errorText, code } = validationResult.data;

    // Parse the error text into structured format
    const parsedErrors = parseCompilerError(errorText);

    if (parsedErrors.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not parse error message',
        message: 'The error text provided does not match expected compiler error format',
      });
    }

    // Explain the first error (most important one)
    const firstError = parsedErrors[0];
    const explanation = await explainError(firstError, code);

    // Return success response
    res.json({
      success: true,
      explanation,
      parsedError: firstError,
      allErrors: parsedErrors, // Include all parsed errors for reference
    });
  } catch (error) {
    console.error('Error explanation failed:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return res.status(500).json({
          success: false,
          error: 'AI service not configured',
          message: 'OpenAI API key is not set. Please configure OPENAI_API_KEY in .env file',
        });
      }

      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'OpenAI API rate limit exceeded. Please try again in a moment.',
        });
      }
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Failed to generate explanation',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

export default router;
```

### Step 2: Register the Route in Server

**File to modify**: `backend/src/server.ts`

**Add this import** (after the existing imports):
```typescript
import errorsRouter from './routes/errors';
```

**Add this route** (after the existing `app.use('/api', executeRouter);` line):
```typescript
app.use('/api/errors', errorsRouter);
```

**Final server.ts should look like**:
```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import executeRouter from './routes/execute';
import errorsRouter from './routes/errors';  // <-- Add this

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));

// Routes
app.use('/api', executeRouter);
app.use('/api/errors', errorsRouter);  // <-- Add this

// ... rest of the file
```

### Step 3: Test the Endpoint

**Test using curl or Postman**:

```bash
curl -X POST http://localhost:3001/api/errors/explain \
  -H "Content-Type: application/json" \
  -d '{
    "errorText": "main.cpp:5:10: error: expected '\'';'\'' before '\''}'\''",
    "code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0\n}"
  }'
```

**Expected response**:
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

---

## Phase 4: Frontend Integration

### Goal
Update the frontend to display AI explanations when errors occur.

### Step 1: Update API Service

**File to modify**: `frontend/src/services/api.ts`

**Add the ErrorExplanation interface and function** (after the existing interfaces):

```typescript
export interface ErrorExplanation {
  explanation: string;
  whyItHappened: string;
  howToFix: string;
  codeExample?: string;
}

export interface ExplainErrorResponse {
  success: boolean;
  explanation: ErrorExplanation;
  parsedError?: ParsedError;
  allErrors?: ParsedError[];
  error?: string;
  message?: string;
}

/**
 * Gets AI explanation for a compiler error
 * @param errorText Raw error text from compiler
 * @param code User's code
 * @returns AI-generated explanation
 */
export async function explainError(
  errorText: string,
  code: string
): Promise<ErrorExplanation> {
  try {
    const response = await axios.post<ExplainErrorResponse>(
      `${API_BASE_URL}/errors/explain`,
      {
        errorText,
        code,
      }
    );

    if (!response.data.success || !response.data.explanation) {
      throw new Error(response.data.error || 'Failed to get error explanation');
    }

    return response.data.explanation;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to get error explanation: ${message}`);
    }
    throw new Error('Unknown error occurred while getting explanation');
  }
}
```

### Step 2: Create ErrorExplanation Component

**File to create**: `frontend/src/components/ErrorExplanation/ErrorExplanation.tsx`

**Implementation**:
```typescript
import { ErrorExplanation as ErrorExplanationType } from '../../services/api';
import './ErrorExplanation.css';

interface ErrorExplanationProps {
  explanation: ErrorExplanationType | null;
  isLoading?: boolean;
  error?: string | null;
}

export function ErrorExplanation({ explanation, isLoading, error }: ErrorExplanationProps) {
  if (isLoading) {
    return (
      <div className="error-explanation loading">
        <div className="explanation-header">
          <span className="icon">🤔</span>
          <span>Analyzing error...</span>
        </div>
        <div className="explanation-content">
          <p>Please wait while we generate an explanation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-explanation error">
        <div className="explanation-header">
          <span className="icon">⚠️</span>
          <span>Error</span>
        </div>
        <div className="explanation-content">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <div className="error-explanation">
      <div className="explanation-header">
        <span className="icon">💡</span>
        <span>AI Explanation</span>
      </div>
      <div className="explanation-content">
        {explanation.explanation && (
          <div className="section">
            <h4>What this means:</h4>
            <p>{explanation.explanation}</p>
          </div>
        )}

        {explanation.whyItHappened && (
          <div className="section">
            <h4>Why it happened:</h4>
            <p>{explanation.whyItHappened}</p>
          </div>
        )}

        {explanation.howToFix && (
          <div className="section">
            <h4>How to fix it:</h4>
            <p>{explanation.howToFix}</p>
          </div>
        )}

        {explanation.codeExample && (
          <div className="section">
            <h4>Example:</h4>
            <pre className="code-example">{explanation.codeExample}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Create CSS for ErrorExplanation Component

**File to create**: `frontend/src/components/ErrorExplanation/ErrorExplanation.css`

**Implementation**:
```css
.error-explanation {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  font-size: 0.9rem;
}

.error-explanation.loading {
  border-left-color: #ffc107;
  background: #fff3cd;
}

.error-explanation.error {
  border-left-color: #dc3545;
  background: #f8d7da;
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #495057;
}

.explanation-header .icon {
  font-size: 1.2rem;
}

.explanation-content {
  color: #212529;
}

.explanation-content .section {
  margin-bottom: 1rem;
}

.explanation-content .section:last-child {
  margin-bottom: 0;
}

.explanation-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
}

.explanation-content p {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.code-example {
  background: #e9ecef;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  overflow-x: auto;
  margin: 0.5rem 0 0 0;
  border: 1px solid #dee2e6;
}
```

### Step 4: Update OutputPanel Component

**File to modify**: `frontend/src/components/OutputPanel/OutputPanel.tsx`

**Add imports** (at the top):
```typescript
import { useState } from 'react';
import { ErrorExplanation } from '../ErrorExplanation/ErrorExplanation';
import { explainError, ParsedError } from '../../services/api';
```

**Add state** (inside the component, at the beginning):
```typescript
const [explanation, setExplanation] = useState<ErrorExplanation | null>(null);
const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
const [explanationError, setExplanationError] = useState<string | null>(null);
```

**Add function to fetch explanation** (before the return statement):
```typescript
const handleExplainError = async (errorText: string, code: string) => {
  setIsLoadingExplanation(true);
  setExplanationError(null);
  setExplanation(null);

  try {
    const explanation = await explainError(errorText, code);
    setExplanation(explanation);
  } catch (error) {
    setExplanationError(
      error instanceof Error ? error.message : 'Failed to get explanation'
    );
  } finally {
    setIsLoadingExplanation(false);
  }
};
```

**Update the error display section** (find the section that shows `hasErrors`):

Replace the error section with:
```typescript
{hasErrors && (
  <div className="error-section">
    <div className="section-header">
      <span>Errors:</span>
      <button
        className="explain-button"
        onClick={() => {
          if (result?.errors && result.parsedErrors && result.parsedErrors.length > 0) {
            // Get the code from somewhere - you'll need to pass it as a prop
            // For now, we'll use an empty string, but you should pass the actual code
            handleExplainError(result.errors, ''); // TODO: Pass actual code
          }
        }}
        disabled={isLoadingExplanation}
      >
        {isLoadingExplanation ? '🤔 Analyzing...' : '💡 Explain Error'}
      </button>
    </div>
    <pre className="error-text">{result.errors}</pre>
    
    {/* Add ErrorExplanation component */}
    <ErrorExplanation
      explanation={explanation}
      isLoading={isLoadingExplanation}
      error={explanationError}
    />
  </div>
)}
```

**Note**: You'll need to pass the user's code to the OutputPanel. See Step 5.

### Step 5: Update App.tsx to Pass Code to OutputPanel

**File to modify**: `frontend/src/App.tsx`

**Update OutputPanel usage** to pass the code:
```typescript
<OutputPanel
  result={result}
  error={error}
  isExecuting={isExecuting}
  code={code}  // <-- Add this prop
/>
```

**Update OutputPanel interface** to accept code:
```typescript
interface OutputPanelProps {
  result: ExecutionResult | null;
  error: string | null;
  isExecuting: boolean;
  code: string;  // <-- Add this
}
```

**Update the handleExplainError call** in OutputPanel to use the code prop:
```typescript
handleExplainError(result.errors, code);  // Use the code prop
```

### Step 6: Add CSS for Explain Button

**File to modify**: `frontend/src/components/OutputPanel/OutputPanel.css` (or create it if it doesn't exist)

**Add styles**:
```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.explain-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.2s;
}

.explain-button:hover:not(:disabled) {
  background: #0056b3;
}

.explain-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Step 7: Auto-Explain First Error (Optional Enhancement)

**In OutputPanel.tsx**, add useEffect to auto-explain:

```typescript
import { useEffect } from 'react';

// Add this effect (inside the component):
useEffect(() => {
  // Auto-explain first error when errors appear
  if (result?.errors && result.parsedErrors && result.parsedErrors.length > 0 && !explanation && !isLoadingExplanation) {
    handleExplainError(result.errors, code);
  }
}, [result?.errors, result?.parsedErrors]); // Only run when errors change
```

**Note**: This will auto-trigger explanation. You may want to make it optional or add a delay.

---

## Testing Checklist

### Backend Testing
- [ ] Start backend server: `npm run dev` (in backend directory)
- [ ] Test endpoint with curl/Postman
- [ ] Verify response structure matches expected format
- [ ] Test with invalid error text (should return 400)
- [ ] Test with missing code (should return 400)
- [ ] Test error handling (API key missing, rate limits, etc.)

### Frontend Testing
- [ ] Start frontend: `npm run dev` (in frontend directory)
- [ ] Write code with a syntax error (e.g., missing semicolon)
- [ ] Click "Run" and verify error appears
- [ ] Click "💡 Explain Error" button
- [ ] Verify loading state appears
- [ ] Verify explanation appears with all sections
- [ ] Test with network error (disable backend) - should show error message
- [ ] Test auto-explanation (if implemented)

### Integration Testing
- [ ] End-to-end: Write code → Get error → Click explain → See AI explanation
- [ ] Verify explanation is helpful and beginner-friendly
- [ ] Test with different error types (syntax, type, undefined, etc.)

---

## Troubleshooting

### Backend Issues

**Issue**: Endpoint returns 404
- **Fix**: Check that route is registered in `server.ts`
- **Fix**: Verify route path is `/api/errors/explain`

**Issue**: 401 Unauthorized from OpenAI
- **Fix**: Check `.env` file has `OPENAI_API_KEY` set
- **Fix**: Verify API key is full length (164 characters)

**Issue**: 500 Internal Server Error
- **Fix**: Check backend console for error details
- **Fix**: Verify `aiService.ts` and `errorParser.ts` are working

### Frontend Issues

**Issue**: "Explain Error" button doesn't appear
- **Fix**: Check that `hasErrors` is true
- **Fix**: Verify `result.parsedErrors` exists

**Issue**: Explanation doesn't load
- **Fix**: Check browser console for errors
- **Fix**: Verify API endpoint is accessible
- **Fix**: Check CORS settings in backend

**Issue**: Code prop not available
- **Fix**: Make sure `code` is passed from `App.tsx` to `OutputPanel`
- **Fix**: Update `OutputPanel` interface to accept `code` prop

---

## Files Created/Modified Summary

### Backend
- ✅ **Created**: `backend/src/routes/errors.ts`
- ✅ **Modified**: `backend/src/server.ts`

### Frontend
- ✅ **Created**: `frontend/src/components/ErrorExplanation/ErrorExplanation.tsx`
- ✅ **Created**: `frontend/src/components/ErrorExplanation/ErrorExplanation.css`
- ✅ **Modified**: `frontend/src/services/api.ts`
- ✅ **Modified**: `frontend/src/components/OutputPanel/OutputPanel.tsx`
- ✅ **Modified**: `frontend/src/App.tsx`
- ✅ **Created/Modified**: `frontend/src/components/OutputPanel/OutputPanel.css`

---

## Next Steps After Completion

Once Phase 3 and 4 are complete:
1. Test thoroughly with various error types
2. Consider adding error explanation caching
3. Add ability to explain multiple errors (not just first one)
4. Add "Copy explanation" button
5. Consider adding explanation history
6. Polish UI/UX based on user feedback

---

## Notes

- The API endpoint accepts `errorText` (raw string) and parses it internally
- The frontend can also send `parsedErrors` directly if available (future enhancement)
- Error explanations are generated on-demand (not cached)
- Consider rate limiting for production use
- API costs: ~$0.0002 per explanation (gpt-4o-mini)

---

**Good luck with the implementation!** 🚀

