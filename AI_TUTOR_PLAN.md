# AI Tutor Implementation Plan

## Your Vision
An interactive teaching system that:
- **Introduces concepts** (e.g., "What is a heap?")
- **Tests understanding** through interactive Q&A
- **Guides implementation** step-by-step from the ground up
- **Builds progressively** - each concept builds on previous ones
- **Adaptive learning** - adjusts based on user's understanding

**Example Flow:**
1. AI introduces "Heap" concept with explanation
2. User answers questions to demonstrate understanding
3. AI guides through implementing a heap from scratch
4. User practices with guided exercises
5. Moves to next concept (e.g., "Heap Sort")

---

## Phase 2: Interactive Concept-Based Teaching System

### Step 1: Curriculum & Concept System (Week 1)

**Goal:** Create a structured curriculum where concepts are taught interactively before coding.

**Implementation:**
1. **Concept Database**
   - Create `backend/src/data/curriculum.json` with concept definitions
   - Each concept has:
     - Title, description, prerequisites
     - Learning objectives
     - Concept explanation (text + examples)
     - Interactive Q&A questions
     - Implementation steps (progressive)
     - Practice exercises

2. **Backend API**
   - `GET /api/curriculum` - List all concepts/modules
   - `GET /api/concepts/:id` - Get specific concept
   - `POST /api/concepts/:id/quiz` - Submit Q&A answers
   - `POST /api/concepts/:id/step` - Get next implementation step
   - `POST /api/concepts/:id/check-step` - Verify implementation step

3. **Frontend UI**
   - Curriculum browser (shows learning path)
   - Concept view (explanation + Q&A)
   - Step-by-step implementation guide
   - Progress tracking

**Example Concept Structure:**
```json
{
  "id": "heap",
  "title": "Heaps",
  "prerequisites": ["arrays", "trees"],
  "learningObjectives": [
    "Understand what a heap is",
    "Know heap properties (min/max heap)",
    "Implement heap operations",
    "Apply heaps to solve problems"
  ],
  "explanation": {
    "text": "A heap is a complete binary tree...",
    "examples": ["visual diagram", "real-world analogy"]
  },
  "quiz": [
    {
      "question": "What is the time complexity of inserting into a heap?",
      "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      "correct": 1,
      "explanation": "Insertion requires bubbling up..."
    }
  ],
  "implementationSteps": [
    {
      "step": 1,
      "title": "Create the Heap Class Structure",
      "description": "Start by defining the basic class...",
      "starterCode": "class Heap {\n  // Your code here\n}",
      "hints": ["Think about what data members you need"],
      "validation": {
        "type": "structure",
        "checks": ["class exists", "has data members"]
      }
    },
    {
      "step": 2,
      "title": "Implement the Insert Function",
      "description": "Now add the insert method...",
      "starterCode": "void insert(int value) {\n  // Your code here\n}",
      "hints": ["Remember to maintain heap property"],
      "validation": {
        "type": "functionality",
        "testCases": [...]
      }
    }
  ]
}
```

---

### Step 2: AI Integration Setup (Week 1-2)

**Goal:** Set up AI service to power interactive teaching, Q&A, and step-by-step guidance.

**Options:**
1. **OpenAI API** (easiest, best quality)
   - Cost: ~$0.01-0.10 per request
   - Quality: Excellent for teaching
   - Setup: Just API key

2. **Anthropic Claude** (alternative)
   - Similar quality, different pricing
   - Good for educational content

3. **Open Source (Ollama)** (free, local)
   - Requires local setup
   - Slower but private

**Recommendation:** Start with OpenAI API for MVP, can switch later.

**Implementation:**
1. Install: `npm install openai` (or `anthropic`, `ollama`)
2. Create `backend/src/services/aiService.ts`
3. Add API key to environment variables
4. Create functions:
   - `explainConcept(concept, userLevel)` - Explain concept at appropriate level
   - `generateQuizQuestion(concept, previousAnswers)` - Generate Q&A questions
   - `evaluateAnswer(question, userAnswer)` - Check understanding
   - `generateNextStep(code, currentStep, concept)` - Guide to next implementation step
   - `explainError(error, code, context)` - Explain compiler errors in teaching context
   - `provideFeedback(code, step, concept)` - Give constructive feedback

---

### Step 3: Interactive Q&A System (Week 2)

**Goal:** Test user understanding before allowing them to code.

**Implementation:**
1. **Quiz Engine**
   - Create `backend/src/services/quizService.ts`
   - Support multiple question types:
     - Multiple choice
     - True/False
     - Short answer (AI-evaluated)
     - Code tracing (what does this code output?)

2. **AI-Powered Q&A**
   ```typescript
   async function generateQuestion(
     concept: Concept,
     userLevel: number,
     previousAnswers: Answer[]
   ): Promise<Question> {
     const prompt = `
       Generate a ${userLevel === 1 ? 'basic' : 'intermediate'} question about ${concept.title}.
       Previous questions asked: ${previousAnswers.map(a => a.question)}
       User's performance: ${calculatePerformance(previousAnswers)}
       
       Generate a question that tests understanding of: ${concept.learningObjectives}
       Don't repeat previous questions.
     `;
     
     return await aiService.generate(prompt);
   }
   
   async function evaluateAnswer(
     question: Question,
     userAnswer: string
   ): Promise<Evaluation> {
     // Check if answer demonstrates understanding
     // Provide explanation if wrong
     // Suggest review if needed
   }
   ```

3. **Adaptive Learning**
   - Track quiz performance
   - Adjust difficulty based on answers
   - Require minimum score (e.g., 70%) before proceeding
   - Offer review materials if struggling

4. **Frontend UI**
   - Quiz panel with questions
   - Immediate feedback on answers
   - Progress indicator (X/Y questions correct)
   - "Review Concept" button if score too low

---

### Step 4: Step-by-Step Implementation Guide (Week 2-3)

**Goal:** Guide users through implementing concepts from the ground up, one step at a time.

**Implementation:**

1. **Step Management**
   - Create `backend/src/services/stepService.ts`
   - Track current step for each concept
   - Validate each step before allowing next
   - Support branching based on user choices

2. **AI-Powered Step Guidance**
   ```typescript
   async function getNextStep(
     concept: Concept,
     currentStep: number,
     userCode: string,
     previousSteps: Step[]
   ): Promise<Step> {
     // Check if current step is complete
     const isValid = await validateStep(concept, currentStep, userCode);
     
     if (!isValid) {
       // Provide feedback on what's wrong
       return {
         type: 'feedback',
         message: await generateFeedback(userCode, concept.steps[currentStep])
       };
     }
     
     // Move to next step
     if (currentStep < concept.steps.length - 1) {
       return concept.steps[currentStep + 1];
     } else {
       // Concept complete!
       return { type: 'complete', message: 'Great job! You've implemented a heap!' };
     }
   }
   
   async function validateStep(
     concept: Concept,
     stepNumber: number,
     code: string
   ): Promise<boolean> {
     const step = concept.steps[stepNumber];
     
     if (step.validation.type === 'structure') {
       // Check code structure (AST parsing)
       return checkStructure(code, step.validation.checks);
     } else if (step.validation.type === 'functionality') {
       // Run test cases
       return await runTests(code, step.validation.testCases);
     }
   }
   ```

3. **Progressive Implementation**
   - Start with empty file or minimal skeleton
   - Each step builds on previous
   - Example flow for Heap:
     1. Create class structure
     2. Add data members (array, size)
     3. Implement helper methods (parent, left, right)
     4. Implement insert (with heapify up)
     5. Implement extract (with heapify down)
     6. Add utility methods (peek, isEmpty)

4. **UI Components**
   - Step indicator (Step 2 of 6)
   - Step description panel
   - Code editor (pre-filled with starter code for current step)
   - "Check Step" button
   - "Next Step" button (enabled when step is valid)
   - Progress visualization

---

### Step 5: Contextual Error Explanation (Week 3)

**Goal:** Explain errors in the context of what the user is learning.

**Implementation:**
1. **Error Parser**
   - Parse compiler errors (already have some logic)
   - Extract: file, line, error type, message
   - Link to current concept/step

2. **AI Explanation with Context**
   ```typescript
   async function explainError(
     error: string,
     code: string,
     lineNumber: number,
     concept: Concept,
     currentStep: Step
   ): Promise<Explanation> {
     const prompt = `
       The user is learning about ${concept.title}.
       They're currently on step: ${currentStep.title}
       ${currentStep.description}
       
       They got this C++ compiler error:
       ${error}
       
       The code around line ${lineNumber}:
       ${getCodeContext(code, lineNumber)}
       
       Explain:
       1. What the error means (in simple terms)
       2. Why it happened (in context of what they're learning)
       3. How to fix it (guide them, don't just give answer)
       4. Relate it back to the concept if relevant
       
       Be encouraging and educational, like a patient teacher.
     `;
     
     return await aiService.generate(prompt);
   }
   ```

3. **UI Enhancement**
   - Click on error → Show contextual AI explanation
   - Auto-explain first error
   - Show fix suggestions (hints, not solutions)
   - Link to relevant concept explanation if needed

---

### Step 6: Adaptive Learning & Progress Tracking (Week 3-4)

**Goal:** Track learning progress and adapt teaching to user's needs.

**Implementation:**
1. **Progress Tracking**
   - Create `backend/src/services/progressService.ts`
   - Track per concept:
     - Quiz scores
     - Steps completed
     - Time spent
     - Errors encountered
     - Hints requested
   - Track overall curriculum progress

2. **Adaptive Teaching**
   ```typescript
   async function adaptTeaching(
     userId: string,
     concept: Concept
   ): Promise<Adaptation> {
     const progress = await getProgress(userId, concept);
     
     // Adjust based on performance
     if (progress.quizScore < 0.7) {
       return {
         action: 'review',
         message: 'Let\'s review the concept before coding',
         materials: concept.explanation
       };
     }
     
     if (progress.stepErrors > 3) {
       return {
         action: 'simplify',
         message: 'Let\'s break this down into smaller steps',
         simplifiedSteps: await generateSimplifiedSteps(concept)
       };
     }
     
     return { action: 'continue' };
   }
   ```

3. **Learning Path**
   - Prerequisite checking (can't do "Heap Sort" without "Heap")
   - Unlock next concepts based on completion
   - Suggest review if struggling
   - Personalized recommendations

4. **UI Features**
   - Progress dashboard
   - Learning path visualization
   - Concept completion badges
   - Time estimates
   - "Review" suggestions

---

## Implementation Order (Recommended)

### Sprint 1: Foundation (Week 1)
1. ✅ Curriculum structure (concept database)
2. ✅ Concept API endpoints
3. ✅ Frontend curriculum browser
4. ✅ Basic concept view UI
5. ✅ First concept: "Arrays" (simple, no prerequisites)

### Sprint 2: Q&A System (Week 2)
1. ✅ Quiz engine backend
2. ✅ AI-powered question generation
3. ✅ Answer evaluation
4. ✅ Quiz UI components
5. ✅ Require quiz completion before coding

### Sprint 3: Step-by-Step Implementation (Week 2-3)
1. ✅ Step management system
2. ✅ Step validation (structure + functionality)
3. ✅ AI-powered step guidance
4. ✅ Step-by-step UI
5. ✅ First full concept: "Heap" with 6 steps

### Sprint 4: AI Integration & Polish (Week 3-4)
1. ✅ Enhanced AI service (context-aware)
2. ✅ Contextual error explanation
3. ✅ Progress tracking
4. ✅ Adaptive learning
5. ✅ Learning path visualization
6. ✅ Testing & refinement

---

## Technical Architecture

### Backend Structure
```
backend/
├── src/
│   ├── services/
│   │   ├── aiService.ts            # AI integration (teaching-focused)
│   │   ├── quizService.ts          # Q&A management
│   │   ├── stepService.ts          # Step-by-step guidance
│   │   ├── progressService.ts      # Learning progress tracking
│   │   └── curriculumService.ts    # Concept/curriculum management
│   ├── routes/
│   │   ├── concepts.ts             # Concept endpoints
│   │   ├── quiz.ts                 # Quiz endpoints
│   │   ├── steps.ts                # Step endpoints
│   │   └── progress.ts             # Progress endpoints
│   └── data/
│       └── curriculum.json         # Concept database
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── CurriculumBrowser/      # Concept selection & learning path
│   │   ├── ConceptView/            # Concept explanation
│   │   ├── QuizPanel/              # Interactive Q&A
│   │   ├── StepGuide/              # Step-by-step implementation
│   │   ├── ProgressDashboard/      # Learning progress
│   │   └── ErrorExplanation/       # Contextual error help
│   ├── hooks/
│   │   ├── useConcept.ts           # Concept state
│   │   ├── useQuiz.ts              # Quiz state
│   │   ├── useSteps.ts             # Step management
│   │   └── useProgress.ts          # Progress tracking
│   └── services/
│       ├── conceptApi.ts           # Concept API calls
│       ├── quizApi.ts              # Quiz API calls
│       └── stepApi.ts              # Step API calls
```

---

## Example User Flow: Learning "Heaps"

1. **User browses curriculum**
   - Sees learning path: Arrays → Trees → Heaps → Heap Sort
   - "Heaps" is locked (requires "Trees" completion)
   - Completes "Trees" concept first

2. **User selects "Heaps" concept**
   - Sees concept explanation: "A heap is a complete binary tree..."
   - Visual examples and analogies
   - Learning objectives listed

3. **Interactive Q&A begins**
   - AI asks: "What is the time complexity of inserting into a heap?"
   - User selects answer
   - Immediate feedback with explanation
   - Continues until 5 questions answered
   - Must score 70%+ to proceed

4. **User passes quiz, moves to implementation**
   - Step 1: "Create the Heap class structure"
   - Editor shows starter code: `class Heap { }`
   - User adds data members: `vector<int> data; int size;`

5. **User clicks "Check Step"**
   - System validates structure
   - ✅ "Great! You've created the class. Moving to step 2..."

6. **Step 2: "Implement helper methods"**
   - Description: "Add methods to get parent, left child, right child indices"
   - User implements: `int parent(int i) { return (i-1)/2; }`
   - Gets error: "expected ';' before '}'"
   - AI explains: "You're missing a semicolon. In C++, every statement..."

7. **User fixes error, completes step**
   - Step 3 unlocks: "Implement insert method"
   - Progress: "Step 3 of 6"

8. **User completes all 6 steps**
   - Celebration: "🎉 You've implemented a complete Heap!"
   - Shows summary of what they built
   - "Heap Sort" concept now unlocked
   - Progress saved

---

## Quick Start: First Feature

**Recommendation:** Start with **Concept System + Q&A** - establishes teaching foundation.

1. Create curriculum structure (`curriculum.json`)
2. Add first simple concept: "Arrays" (no prerequisites)
3. Build concept view UI
4. Implement basic quiz system
5. Test with one concept end-to-end

**Time:** ~4-6 hours for MVP

**Alternative Quick Start:** If you want to see AI in action faster:
1. Set up OpenAI API
2. Create `aiService.ts`
3. Add contextual error explanation (uses existing error system)
4. Test with real compiler errors

**Time:** ~2-3 hours for MVP

---

## Questions to Decide

1. **AI Provider:** OpenAI, Claude, or Ollama?
2. **Concept Source:** Pre-written curriculum or AI-generated?
3. **Quiz Strictness:** Require 70% to proceed, or allow retakes?
4. **Progress:** Track across sessions (database) or localStorage only?
5. **Starting Concepts:** Which concepts to include first?
   - Suggested: Arrays, Linked Lists, Stacks, Queues, Trees, Heaps
6. **Step Validation:** How strict? (structure check vs. full functionality)

---

## Next Steps

1. **Choose AI provider** (I recommend OpenAI for MVP)
2. **Create curriculum structure** (start with 2-3 simple concepts)
3. **Build Q&A system** (core teaching feature)
4. **Implement step-by-step guide** (progressive implementation)
5. **Add progress tracking** (motivation & adaptation)

Want me to start implementing any of these? I'd suggest starting with:
1. Curriculum database structure (concepts.json)
2. Concept API endpoints
3. Basic Q&A system

Let me know which one you'd like to tackle first!




