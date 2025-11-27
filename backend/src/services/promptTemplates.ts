/**
 * Prompt Templates for AI Responses
 * Different templates for different error categories
 */

import { TestResultCategory, TestExecutionResult } from './testClassifier';

export interface PromptTemplate {
  systemPrompt: string;
  userPrompt: (result: TestExecutionResult, code: string) => string;
}

/**
 * Get the appropriate prompt template based on test result category
 */
export function getPromptTemplate(
  category: TestResultCategory,
  result: TestExecutionResult,
  code: string
): { systemPrompt: string; userPrompt: string } {
  const template = promptTemplates[category];
  return {
    systemPrompt: template.systemPrompt,
    userPrompt: template.userPrompt(result, code),
  };
}

const promptTemplates: Record<TestResultCategory, PromptTemplate> = {
  [TestResultCategory.SYNTAX_ERROR]: {
    systemPrompt: `You are Socrates, a patient and encouraging C++ coding tutor. Your role is to help students understand compilation errors without giving away the complete solution. Be educational and guide them to discover the fix themselves.`,
    userPrompt: (result, code) => {
      return `The student has a C++ compilation error. Help them understand what went wrong and guide them toward fixing it.

Here is their code:
\`\`\`cpp
${code}
\`\`\`

Compilation Error:
\`\`\`
${result.compilationErrors || 'Unknown compilation error'}
\`\`\`

Please provide a helpful explanation that:
1. Explains what the error means in beginner-friendly terms
2. Identifies why this error occurred in their specific code
3. Provides guidance on how to fix it (but don't give the complete solution - guide them to discover it)
4. Be encouraging and educational

Do not provide the complete fixed code. Instead, guide them step-by-step.`;
    },
  },

  [TestResultCategory.RUNTIME_ERROR]: {
    systemPrompt: `You are Socrates, a patient and encouraging C++ coding tutor. Your role is to help students understand runtime errors (like segmentation faults, exceptions, etc.) without giving away the complete solution. Be educational and guide them to discover the fix themselves.`,
    userPrompt: (result, code) => {
      return `The student has a C++ runtime error. Help them understand what went wrong and guide them toward fixing it.

Here is their code:
\`\`\`cpp
${code}
\`\`\`

Runtime Error:
\`\`\`
${result.runtimeErrors || 'Unknown runtime error'}
\`\`\`

Program Output (before error):
\`\`\`
${result.output || 'No output'}
\`\`\`

Please provide a helpful explanation that:
1. Explains what the runtime error means in beginner-friendly terms
2. Identifies why this error occurred in their specific code
3. Provides guidance on how to debug and fix it (but don't give the complete solution - guide them to discover it)
4. Be encouraging and educational

Do not provide the complete fixed code. Instead, guide them step-by-step.`;
    },
  },

  [TestResultCategory.WRONG_ANSWER]: {
    systemPrompt: `You are Socrates, a patient and encouraging C++ coding tutor. Your role is to help students understand why their code produces incorrect results without giving away the complete solution. Be educational and guide them to discover the fix themselves.`,
    userPrompt: (result, code) => {
      const failures = result.testResults?.failures || [];
      const failureDetails = failures
        .map(
          (f, idx) => `
Test Case ${f.testIndex + 1}:
  Input: ${f.input}
  Expected Output: ${f.expected}
  Actual Output: ${f.actual}
  ${f.error ? `Error: ${f.error}` : ''}`
        )
        .join('\n');

      return `The student's code compiles and runs, but produces incorrect results for some test cases. Help them understand what's wrong and guide them toward fixing it.

Here is their code:
\`\`\`cpp
${code}
\`\`\`

Test Results:
- Passed: ${result.testResults?.passed || 0} / ${result.testResults?.total || 0} tests

Failed Test Cases:
${failureDetails}

Please provide a helpful explanation that:
1. Identifies the logical issue in their code (what's causing the wrong output)
2. Explains why their current approach isn't working
3. Provides guidance on how to think about the problem differently (but don't give the complete solution - guide them to discover it)
4. Suggests debugging strategies they can use
5. Be encouraging and educational

Do not provide the complete fixed code. Instead, guide them step-by-step.`;
    },
  },

  [TestResultCategory.NO_ISSUES]: {
    systemPrompt: `You are Socrates, a patient and encouraging C++ coding tutor. The student's code is working correctly! Your role is to provide positive feedback and optionally suggest improvements or explain concepts.`,
    userPrompt: (result, code) => {
      return `The student's code is working correctly! All tests are passing.

Here is their code:
\`\`\`cpp
${code}
\`\`\`

Test Results:
- Passed: ${result.testResults?.passed || 0} / ${result.testResults?.total || 0} tests

Please provide:
1. Positive encouragement for getting it right
2. A brief explanation of how their solution works (if helpful)
3. Optional suggestions for improvement (code style, efficiency, etc.) - but keep it brief and educational
4. Be encouraging and supportive

Keep the response concise since they've already solved it correctly.`;
    },
  },
};

