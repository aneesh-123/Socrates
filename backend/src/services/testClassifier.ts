/**
 * Test Classification Service
 * Classifies test execution results into categories for AI prompting
 */

import { executeCode } from './dockerService';
import { createTempDir, cleanupTempDir } from './fileService';
import { prepareCodeForExecution } from './codeWrapper';

export enum TestResultCategory {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  WRONG_ANSWER = 'WRONG_ANSWER',
  NO_ISSUES = 'NO_ISSUES',
}

export interface TestExecutionResult {
  category: TestResultCategory;
  compilationErrors?: string;
  runtimeErrors?: string;
  testResults?: {
    passed: number;
    total: number;
    failures: Array<{
      testIndex: number;
      input: string;
      expected: string;
      actual: string;
      error?: string;
    }>;
  };
  output?: string;
  exitCode?: number;
}

/**
 * Runs all test cases and classifies the result
 */
export async function classifyTestResults(code: string): Promise<TestExecutionResult> {
  let tempDir: string | null = null;

  try {
    // Create temporary directory
    tempDir = await createTempDir();

    // Prepare code for execution (runs all tests by default - no testIndex specified)
    const preparedCode = await prepareCodeForExecution(tempDir, code, undefined);

    // Execute code in Docker
    const result = await executeCode(tempDir);

    // Check for compilation errors first
    if (result.errors && result.errors.trim().length > 0) {
      const errors = result.errors.toLowerCase();
      const hasCompilationErrors =
        errors.includes('error:') ||
        errors.includes('undefined reference') ||
        errors.includes('collect2:') ||
        errors.includes('ld returned') ||
        errors.includes('cannot find') ||
        errors.includes('no such file') ||
        errors.includes('multiple definition');

      if (hasCompilationErrors) {
        return {
          category: TestResultCategory.SYNTAX_ERROR,
          compilationErrors: result.errors,
          exitCode: result.exitCode,
        };
      }
    }

    // Check for runtime errors
    // Segfaults typically exit with code 139 (SIGSEGV) or 11
    // Other signals: 134 (SIGABRT), 136 (SIGFPE)
    const runtimeExitCodes = [139, 11, 134, 136];
    const isRuntimeExitCode = result.exitCode !== undefined && runtimeExitCodes.includes(result.exitCode);

    // Check error text for runtime error indicators
    const errorText = (result.errors || '').toLowerCase();
    const outputText = (result.output || '').toLowerCase();
    const runtimeErrorIndicators = [
      'segmentation fault',
      'segfault',
      'terminate called',
      'exception',
      'abort',
      'signal',
      'floating point exception',
      'double free',
      'corruption',
    ];

    const hasRuntimeErrorInText = runtimeErrorIndicators.some((indicator) =>
      errorText.includes(indicator) || outputText.includes(indicator)
    );

    // Classify as runtime error if:
    // 1. Exit code indicates runtime error (segfault, etc.)
    // 2. OR error/output text contains runtime error indicators
    if (isRuntimeExitCode || (result.exitCode !== 0 && hasRuntimeErrorInText)) {
      return {
        category: TestResultCategory.RUNTIME_ERROR,
        runtimeErrors: result.errors || `Program crashed with exit code ${result.exitCode}`,
        output: result.output,
        exitCode: result.exitCode,
      };
    }

    // Parse test results from output
    const testResults = parseTestOutput(result.output || '');

    // Check if test output contains exception messages
    // The test harness catches exceptions and prints "FAILED (exception: ...)"
    const outputLower = (result.output || '').toLowerCase();
    const hasExceptionInOutput = 
      outputLower.includes('exception:') || 
      outputLower.includes('failed (exception') ||
      outputLower.includes('terminate called') ||
      outputLower.includes('std::exception');

    if (hasExceptionInOutput) {
      return {
        category: TestResultCategory.RUNTIME_ERROR,
        runtimeErrors: `Runtime exception detected in test output`,
        output: result.output,
        exitCode: result.exitCode,
      };
    }

    // If exit code is non-zero and we couldn't parse any test results,
    // it likely means the program crashed before completing tests (runtime error)
    if (result.exitCode !== 0 && testResults.total === 0 && !result.errors) {
      // Check if there's any output that suggests a crash
      if (outputLower.length > 0 && !outputLower.includes('test case')) {
        return {
          category: TestResultCategory.RUNTIME_ERROR,
          runtimeErrors: `Program exited with code ${result.exitCode} before completing tests`,
          output: result.output,
          exitCode: result.exitCode,
        };
      }
    }

    // Check if all tests passed
    if (testResults.passed === testResults.total && testResults.total > 0) {
      return {
        category: TestResultCategory.NO_ISSUES,
        testResults,
        output: result.output,
        exitCode: result.exitCode,
      };
    }

    // If we have test failures, classify as WRONG_ANSWER
    if (testResults.failures.length > 0) {
      return {
        category: TestResultCategory.WRONG_ANSWER,
        testResults,
        output: result.output,
        exitCode: result.exitCode,
      };
    }

    // Default: if we can't determine, assume NO_ISSUES
    return {
      category: TestResultCategory.NO_ISSUES,
      output: result.output,
      exitCode: result.exitCode,
    };
  } catch (error) {
    console.error('Error classifying test results:', error);
    // If execution fails completely, assume syntax error
    return {
      category: TestResultCategory.SYNTAX_ERROR,
      compilationErrors: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    if (tempDir) {
      await cleanupTempDir(tempDir);
    }
  }
}

/**
 * Parses test output to extract test results
 * Expected format from test harness:
 * Test Case 1 - Example 1: PASSED/FAILED
 *   Input: ...
 *   Expected: ...
 *   Output: ...
 * Summary: X/Y tests passed.
 */
function parseTestOutput(output: string): {
  passed: number;
  total: number;
  failures: Array<{
    testIndex: number;
    input: string;
    expected: string;
    actual: string;
    error?: string;
  }>;
} {
  const failures: Array<{
    testIndex: number;
    input: string;
    expected: string;
    actual: string;
    error?: string;
  }> = [];

  let passed = 0;
  let total = 0;

  // Extract summary line: "Summary: X/Y tests passed."
  const summaryMatch = output.match(/Summary:\s*(\d+)\/(\d+)\s+tests\s+passed/i);
  if (summaryMatch) {
    passed = parseInt(summaryMatch[1], 10);
    total = parseInt(summaryMatch[2], 10);
  }

  // Parse individual test cases
  const testCaseRegex = /Test Case (\d+)[^\n]*:\s*(PASSED|FAILED)/gi;
  let match;
  let currentTestIndex = 0;

  while ((match = testCaseRegex.exec(output)) !== null) {
    const testIndex = parseInt(match[1], 10) - 1; // Convert to 0-based
    const status = match[2].toUpperCase();
    currentTestIndex = testIndex;

    if (status === 'FAILED') {
      // Extract test details
      const testSection = output.substring(match.index);
      const inputMatch = testSection.match(/Input:\s*(.+?)(?:\n|Expected:)/i);
      const expectedMatch = testSection.match(/Expected:\s*(.+?)(?:\n|Output:)/i);
      const outputMatch = testSection.match(/Output:\s*(.+?)(?:\n|----------------|$)/i);
      const exceptionMatch = testSection.match(/exception:\s*(.+?)(?:\n|Input:)/i);

      failures.push({
        testIndex,
        input: inputMatch ? inputMatch[1].trim() : 'Unknown',
        expected: expectedMatch ? expectedMatch[1].trim() : 'Unknown',
        actual: outputMatch ? outputMatch[1].trim() : 'No output',
        error: exceptionMatch ? exceptionMatch[1].trim() : undefined,
      });
    }
  }

  // If we couldn't parse summary, estimate from failures
  if (total === 0 && failures.length > 0) {
    total = Math.max(...failures.map((f) => f.testIndex)) + 1;
    passed = total - failures.length;
  }

  return { passed, total, failures };
}

