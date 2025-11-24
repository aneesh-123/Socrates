# AI-Powered Error Explanation Feature

## Overview

This document details the implementation of AI-powered error explanation for the Socrates code editor. This is the first AI feature to be added, providing immediate value by making compiler errors understandable and actionable for users.

## Current State

### What We Have
- ✅ Working C++ code execution in Docker sandbox
- ✅ Basic error display in `OutputPanel` component
- ✅ Error parsing in `dockerService.ts` (separates errors from output)
- ✅ Raw compiler error messages displayed to users

### What's Missing
- ❌ Structured error parsing (extract line numbers, error types)
- ❌ AI service integration
- ❌ User-friendly error explanations
- ❌ Error context (code around the error line)
- ❌ Fix suggestions and guidance

---

## Feature Goals

1. **Parse compiler errors** into structured format (file, line, type, message)
2. **Generate AI explanations** that are beginner-friendly
3. **Show code context** around the error line
4. **Provide fix suggestions** (hints, not full solutions)
5. **Make errors clickable** to get explanations on demand
6. **Auto-explain first error** for immediate help

---

## Implementation Plan

### Phase 1: Error Parser (Backend)

**Goal:** Extract structured information from compiler error messages.

**Location:** `backend/src/services/errorParser.ts`

**What to Parse:**
- File name (usually `main.cpp`)
- Line number
- Column number (if available)
- Error type (syntax, type, undefined reference, etc.)
- Error message
- Related code snippet (if compiler provides it)

**Example Error Formats to Handle:**
```
main.cpp:5:10: error: expected ';' before '}'
    5 |     return 0
      |          ^
```

```
main.cpp:10:15: error: 'x' was not declared in this scope
   10 |     cout << x << endl;
      |               ^
```

```
main.cpp:3:5: error: 'int' does not name a type
    3 | int main() {
      |     ^~~
```

**Implementation:**
```typescript
export interface ParsedError {
  file: string;
  line: number;
  column?: number;
  type: 'syntax' | 'type' | 'undefined' | 'linker' | 'other';
  message: string;
  rawError: string;
  codeSnippet?: string;
}

export function parseCompilerError(errorText: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = errorText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match: main.cpp:5:10: error: message
    const errorMatch = line.match(/^(\w+\.cpp):(\d+):(\d+):\s*(error|warning):\s*(.+)$/);
    
    if (errorMatch) {
      const [, file, lineNum, col, errorType, message] = errorMatch;
      
      // Get code snippet from next line if available
      let codeSnippet: string | undefined;
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith(lineNum)) {
        codeSnippet = lines[i + 1].trim();
      }
      
      errors.push({
        file,
        line: parseInt(lineNum, 10),
        column: parseInt(col, 10),
        type: categorizeErrorType(message),
        message: message.trim(),
        rawError: line,
        codeSnippet,
      });
    }
  }
  
  return errors;
}

function categorizeErrorType(message: string): ParsedError['type'] {
  const lower = message.toLowerCase();
  
  if (lower.includes('expected') || lower.includes('syntax')) {
    return 'syntax';
  }
  if (lower.includes('not declared') || lower.includes('undefined')) {
    return 'undefined';
  }
  if (lower.includes('does not name a type') || lower.includes('cannot convert')) {
    return 'type';
  }
  if (lower.includes('undefined reference') || lower.includes('linker')) {
    return 'linker';
  }
  
  return 'other';
}
```

**Integration:**
- Update `dockerService.ts` to use parser
- Return structured errors in execution result
- Keep raw error text for fallback

---

### Phase 2: AI Service Setup (Backend)

**Goal:** Set up OpenAI API integration for generating error explanations.

**Location:** `backend/src/services/aiService.ts`

**Setup Steps:**
1. Install OpenAI package: `npm install openai`
2. Add API key to environment variables (`.env` file)
3. Create service with error explanation function

**Implementation:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ErrorExplanation {
  explanation: string;        // What the error means
  whyItHappened: string;      // Why it occurred
  howToFix: string;          // How to fix it (guidance, not solution)
  codeExample?: string;       // Optional example fix
}

export async function explainError(
  error: ParsedError,
  userCode: string,
  codeContext?: string
): Promise<ErrorExplanation> {
  const prompt = `
You are a patient, encouraging coding tutor helping a beginner understand C++ compiler errors.

The user got this error:
File: ${error.file}
Line: ${error.line}${error.column ? `, Column: ${error.column}` : ''}
Error: ${error.message}

The code around line ${error.line}:
${codeContext || getCodeContext(userCode, error.line)}

Please provide:
1. A simple explanation of what the error means (in beginner-friendly terms)
2. Why this error happened (what in their code caused it)
3. How to fix it (guide them, don't just give the answer - be educational)
4. An optional brief code example if helpful (but don't give away the full solution)

Be encouraging and educational, like a patient teacher. Keep explanations clear and concise.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // or 'gpt-4' for better quality
    messages: [
      {
        role: 'system',
        content: 'You are a helpful C++ coding tutor that explains compiler errors in a beginner-friendly way.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content || '';
  
  // Parse the response (or structure it better with structured output)
  return parseExplanation(content);
}

function getCodeContext(code: string, lineNumber: number, contextLines = 3): string {
  const lines = code.split('\n');
  const start = Math.max(0, lineNumber - contextLines - 1);
  const end = Math.min(lines.length, lineNumber + contextLines);
  
  const context = lines.slice(start, end);
  return context
    .map((line, idx) => `${start + idx + 1}: ${line}`)
    .join('\n');
}

function parseExplanation(content: string): ErrorExplanation {
  // Simple parsing - could be improved with structured output
  // For now, split by sections if they exist, otherwise return as explanation
  
  return {
    explanation: content,
    whyItHappened: '',
    howToFix: '',
  };
}
```

**Environment Variables:**
Create `.env` file in `backend/`:
```
OPENAI_API_KEY=your-api-key-here
```

**Error Handling:**
- Handle API failures gracefully
- Fallback to basic error message if AI fails
- Rate limiting considerations
- Cost monitoring

---

### Phase 3: Backend API Endpoint

**Goal:** Create endpoint to get AI explanations for errors.

**Location:** `backend/src/routes/errors.ts`

**Endpoint:**
```
POST /api/errors/explain
```

**Request Body:**
```typescript
{
  error: ParsedError;
  code: string;
}
```

**Response:**
```typescript
{
  success: true;
  explanation: ErrorExplanation;
}
```

**Implementation:**
```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { explainError } from '../services/aiService';
import { parseCompilerError, ParsedError } from '../services/errorParser';

const router = Router();

const explainRequestSchema = z.object({
  errorText: z.string().min(1),
  code: z.string().min(1),
});

router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { errorText, code } = explainRequestSchema.parse(req.body);
    
    // Parse the error
    const parsedErrors = parseCompilerError(errorText);
    
    if (parsedErrors.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not parse error message',
      });
    }
    
    // Explain the first error (most important)
    const firstError = parsedErrors[0];
    const explanation = await explainError(firstError, code);
    
    res.json({
      success: true,
      explanation,
      parsedError: firstError,
      allErrors: parsedErrors, // Include all parsed errors
    });
  } catch (error) {
    console.error('Error explanation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate explanation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
```

**Integration:**
- Add route to `backend/src/server.ts`
- Mount at `/api/errors`

---

### Phase 4: Frontend Integration

**Goal:** Update UI to show AI explanations for errors.

**Changes Needed:**

1. **Update API Service** (`frontend/src/services/api.ts`)
   ```typescript
   export interface ErrorExplanation {
     explanation: string;
     whyItHappened: string;
     howToFix: string;
     codeExample?: string;
   }
   
   export async function explainError(
     errorText: string,
     code: string
   ): Promise<ErrorExplanation> {
     const response = await fetch(`${API_BASE_URL}/errors/explain`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ errorText, code }),
     });
     
     if (!response.ok) {
       throw new Error('Failed to get error explanation');
     }
     
     const data = await response.json();
     return data.explanation;
   }
   ```

2. **Create ErrorExplanation Component** (`frontend/src/components/ErrorExplanation/ErrorExplanation.tsx`)
   ```typescript
   import { ErrorExplanation as ErrorExplanationType } from '../../services/api';
   
   interface ErrorExplanationProps {
     explanation: ErrorExplanationType;
     isLoading?: boolean;
   }
   
   export function ErrorExplanation({ explanation, isLoading }: ErrorExplanationProps) {
     if (isLoading) {
       return (
         <div className="error-explanation loading">
           <div className="spinner">🤔 Analyzing error...</div>
         </div>
       );
     }
     
     return (
       <div className="error-explanation">
         <div className="explanation-header">
           <span className="icon">💡</span>
           <span>AI Explanation</span>
         </div>
         <div className="explanation-content">
           <div className="section">
             <h4>What this means:</h4>
             <p>{explanation.explanation}</p>
           </div>
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

3. **Update OutputPanel Component**
   - Add state for error explanation
   - Add "Explain Error" button when errors are present
   - Show explanation panel below errors
   - Auto-fetch explanation for first error

4. **Add Styling** (`frontend/src/components/ErrorExplanation/ErrorExplanation.css`)
   ```css
   .error-explanation {
     margin-top: 1rem;
     padding: 1rem;
     background: #f8f9fa;
     border-left: 4px solid #007bff;
     border-radius: 4px;
   }
   
   .explanation-header {
     display: flex;
     align-items: center;
     gap: 0.5rem;
     font-weight: 600;
     margin-bottom: 1rem;
   }
   
   .explanation-content .section {
     margin-bottom: 1rem;
   }
   
   .explanation-content h4 {
     margin: 0 0 0.5rem 0;
     font-size: 0.9rem;
     color: #495057;
   }
   
   .code-example {
     background: #e9ecef;
     padding: 0.5rem;
     border-radius: 4px;
     font-size: 0.85rem;
   }
   ```

---

## User Experience Flow

1. **User writes code with an error**
   - Compiles and gets error message

2. **Error appears in OutputPanel**
   - Raw compiler error shown
   - "💡 Explain Error" button appears

3. **User clicks "Explain Error" (or auto-triggers)**
   - Loading state: "🤔 Analyzing error..."
   - AI generates explanation

4. **Explanation appears**
   - Clear, beginner-friendly explanation
   - Why it happened
   - How to fix it (guidance)
   - Optional code example

5. **User fixes error**
   - Can click error again for more help if needed
   - Explanation persists until code changes

---

## Implementation Checklist

### Backend
- [ ] Create `errorParser.ts` service
- [ ] Install `openai` package
- [ ] Create `aiService.ts` with error explanation function
- [ ] Add `.env` file with `OPENAI_API_KEY`
- [ ] Create `/api/errors/explain` endpoint
- [ ] Update `dockerService.ts` to return structured errors
- [ ] Add error handling and fallbacks
- [ ] Test with various error types

### Frontend
- [ ] Add `explainError` function to `api.ts`
- [ ] Create `ErrorExplanation` component
- [ ] Update `OutputPanel` to show explanations
- [ ] Add "Explain Error" button
- [ ] Implement auto-explanation for first error
- [ ] Add loading states
- [ ] Style the explanation panel
- [ ] Handle API errors gracefully

### Testing
- [ ] Test with syntax errors
- [ ] Test with type errors
- [ ] Test with undefined variable errors
- [ ] Test with linker errors
- [ ] Test API failure scenarios
- [ ] Test with multiple errors
- [ ] Verify code context extraction

---

## Future Enhancements

1. **Structured AI Output**
   - Use OpenAI function calling for structured responses
   - Better parsing of explanation sections

2. **Multiple Error Support**
   - Explain all errors, not just first
   - Show error navigation (1 of 3)

3. **Error History**
   - Track common errors
   - Show patterns over time

4. **Inline Error Markers**
   - Highlight error lines in editor
   - Click line number to get explanation

5. **Error Categories**
   - Group similar errors
   - Show related documentation

6. **Cost Optimization**
   - Cache common error explanations
   - Use cheaper models for simple errors

---

## Cost Considerations

**OpenAI Pricing (as of 2024):**
- GPT-4o-mini: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- GPT-4: ~$2.50 per 1M input tokens, $10 per 1M output tokens

**Estimated Cost per Explanation:**
- Input: ~500 tokens (error + code context)
- Output: ~200 tokens (explanation)
- GPT-4o-mini: ~$0.0002 per explanation
- GPT-4: ~$0.0015 per explanation

**Recommendation:** Start with GPT-4o-mini for MVP, upgrade to GPT-4 if quality is insufficient.

---

## Next Steps

1. **Start with error parser** - No AI needed, immediate value
2. **Set up AI service** - Get API key, test basic integration
3. **Build endpoint** - Simple POST endpoint
4. **Update frontend** - Add explanation UI
5. **Test and iterate** - Refine prompts and UX

This feature provides immediate value and sets the foundation for more advanced AI features in the future!

