import { useState, useEffect, useRef } from 'react';
import { executeCode } from '../../services/api';
import './TestCases.css';

export interface TestCase {
  input: {
    [key: string]: any;
  };
  expectedOutput: any;
  label?: string;
}

interface TestCasesProps {
  testCases?: TestCase[];
  code?: string;
  onTestRun?: (testIndex: number, passed: boolean) => void;
  autoRunTrigger?: number; // Increment this to trigger auto-run
}

// Default test cases for Two Sum problem
const DEFAULT_TWO_SUM_TEST_CASES: TestCase[] = [
  {
    input: {
      nums: [2, 7, 11, 15],
      target: 9,
    },
    expectedOutput: [0, 1],
    label: 'Example 1',
  },
  {
    input: {
      nums: [3, 2, 4],
      target: 6,
    },
    expectedOutput: [1, 2],
    label: 'Example 2',
  },
  {
    input: {
      nums: [3, 3],
      target: 6,
    },
    expectedOutput: [0, 1],
    label: 'Example 3',
  },
];

interface TestResult {
  testIndex: number;
  passed: boolean;
  actualOutput?: string;
  consoleOutput?: string;
  error?: string;
  executionTime?: number;
}

export function TestCases({ 
  testCases = DEFAULT_TWO_SUM_TEST_CASES,
  code = '',
  onTestRun,
  autoRunTrigger,
}: TestCasesProps) {
  const [testResults, setTestResults] = useState<Map<number, TestResult>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [runningTestIndex, setRunningTestIndex] = useState<number | null>(null);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [isCheckingCompilation, setIsCheckingCompilation] = useState(false);
  // Initialize to current autoRunTrigger value to prevent running on mount/tab switch
  // This ensures the ref is set before any effects run
  const lastAutoRunTrigger = useRef<number>(autoRunTrigger ?? 0);
  const isFirstRender = useRef<boolean>(true);

  // Clear compilation errors when code changes
  useEffect(() => {
    setCompilationError(null);
  }, [code]);

  // Auto-run tests when trigger changes (code executed successfully)
  // Only run if trigger is provided and has increased (not just on mount or tab switch)
  useEffect(() => {
    // On first render, just sync the ref and skip running
    if (isFirstRender.current) {
      lastAutoRunTrigger.current = autoRunTrigger ?? 0;
      isFirstRender.current = false;
      return;
    }

    // Only trigger if autoRunTrigger is defined, greater than 0, and has increased
    if (autoRunTrigger !== undefined && autoRunTrigger > 0 && autoRunTrigger > lastAutoRunTrigger.current) {
      lastAutoRunTrigger.current = autoRunTrigger;
      // Only run if we have code and we're not already running
      if (code && code.trim().length > 0 && !isRunning && !isCheckingCompilation) {
        runAllTests();
      }
    }
    // Don't run on initial mount or when component becomes visible
    // Only run when trigger actually increases
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunTrigger]);

  const formatInput = (input: { [key: string]: any }): string => {
    // Format input for C++ code
    // For Two Sum: nums = [2,7,11,15], target = 9
    const parts: string[] = [];
    
    if (input.nums) {
      parts.push(`nums = [${input.nums.join(',')}]`);
    }
    if (input.target !== undefined) {
      parts.push(`target = ${input.target}`);
    }
    
    return parts.join(', ');
  };

  const formatExpectedOutput = (output: any): string => {
    if (Array.isArray(output)) {
      return `[${output.join(',')}]`;
    }
    return String(output);
  };

  const normalizeOutput = (output: string): string => {
    // Remove whitespace and normalize array format
    return output.trim().replace(/\s+/g, '');
  };

  const arraysEqual = (arr1: number[], arr2: number[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    // Sort arrays for comparison (order doesn't matter for Two Sum)
    const sorted1 = [...arr1].sort((a, b) => a - b);
    const sorted2 = [...arr2].sort((a, b) => a - b);
    return sorted1.every((val, idx) => val === sorted2[idx]);
  };

  const parseOutput = (output: string): number[] | null => {
    // Try to parse array output like [0,1] or [0, 1]
    const match = output.match(/\[([^\]]+)\]/);
    if (match) {
      const values = match[1].split(',').map(v => parseInt(v.trim(), 10));
      if (values.every(v => !isNaN(v))) {
        return values;
      }
    }
    return null;
  };

  const checkTestResult = (actualOutput: string, expectedOutput: any): boolean => {
    const normalizedActual = normalizeOutput(actualOutput);
    const normalizedExpected = normalizeOutput(formatExpectedOutput(expectedOutput));
    
    // Try to parse as arrays
    const actualArray = parseOutput(normalizedActual);
    const expectedArray = Array.isArray(expectedOutput) ? expectedOutput : parseOutput(normalizedExpected);
    
    if (actualArray && expectedArray) {
      return arraysEqual(actualArray, expectedArray);
    }
    
    // Fallback to string comparison
    return normalizedActual === normalizedExpected;
  };

  const parseTestOutput = (output: string): { consoleOutput: string; returnValue: string } => {
    const consoleStartIndex = output.indexOf('CONSOLE_START\n');
    const consoleEndIndex = output.indexOf('CONSOLE_END\n');
    const returnValueIndex = output.indexOf('RETURN_VALUE:');

    let consoleOutput = '';
    let returnValue = '';

    if (consoleStartIndex !== -1 && consoleEndIndex !== -1) {
      // Extract console output between CONSOLE_START and CONSOLE_END
      const start = consoleStartIndex + 'CONSOLE_START\n'.length;
      consoleOutput = output.substring(start, consoleEndIndex).trim();
    } else {
      // Fallback: if markers not found, assume all output is console output
      consoleOutput = output.trim();
    }

    if (returnValueIndex !== -1) {
      // Extract return value after RETURN_VALUE:
      const start = returnValueIndex + 'RETURN_VALUE:'.length;
      returnValue = output.substring(start).trim();
    }

    return { consoleOutput, returnValue };
  };

  const runTest = async (testIndex: number) => {
    if (!code || code.trim().length === 0) {
      return;
    }

    setIsRunning(true);
    setRunningTestIndex(testIndex);

    try {
      // Run code with specific test index
      const response = await executeCode(code, testIndex);
      
      if (response.success && response.result) {
        // Check for compilation errors first
        if (response.result.errors && response.result.errors.trim().length > 0) {
          const errors = response.result.errors.toLowerCase();
          const hasRealErrors = 
            errors.includes('error:') ||
            errors.includes('undefined reference') ||
            errors.includes('collect2:') ||
            errors.includes('ld returned');
          
          if (hasRealErrors) {
            setCompilationError(response.result.errors);
            const testResult: TestResult = {
              testIndex,
              passed: false,
              error: 'Compilation error',
            };
            setTestResults(prev => new Map(prev).set(testIndex, testResult));
            setIsRunning(false);
            setRunningTestIndex(null);
            return;
          }
        }

        const testCase = testCases[testIndex];
        const { consoleOutput, returnValue } = parseTestOutput(response.result.output);
        
        // Check if return value matches expected
        const passed = checkTestResult(returnValue || consoleOutput, testCase.expectedOutput);
        
        const testResult: TestResult = {
          testIndex,
          passed,
          actualOutput: returnValue || '(no return value)',
          consoleOutput: consoleOutput || '(no console output)',
          executionTime: response.result.executionTime,
        };
        
        setTestResults(prev => new Map(prev).set(testIndex, testResult));
        
        if (onTestRun) {
          onTestRun(testIndex, passed);
        }
      } else {
        const testResult: TestResult = {
          testIndex,
          passed: false,
          error: response.error || 'Execution failed',
        };
        
        setTestResults(prev => new Map(prev).set(testIndex, testResult));
      }
    } catch (error) {
      const testResult: TestResult = {
        testIndex,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      setTestResults(prev => new Map(prev).set(testIndex, testResult));
    } finally {
      setIsRunning(false);
      setRunningTestIndex(null);
    }
  };

  const checkCompilation = async (): Promise<boolean> => {
    if (!code || code.trim().length === 0) {
      return false;
    }

    setIsCheckingCompilation(true);
    setCompilationError(null);

    try {
      // Run code with first test case to check for compilation errors
      const response = await executeCode(code, 0);
      
      if (response.success && response.result) {
        // Check if there are compilation errors
        if (response.result.errors && response.result.errors.trim().length > 0) {
          // Check if it's a real compilation error (not just warnings)
          const errors = response.result.errors.toLowerCase();
          const hasRealErrors = 
            errors.includes('error:') ||
            errors.includes('undefined reference') ||
            errors.includes('collect2:') ||
            errors.includes('ld returned') ||
            errors.includes('cannot find') ||
            errors.includes('no such file') ||
            errors.includes('multiple definition');
          
          if (hasRealErrors) {
            setCompilationError(response.result.errors);
            setIsCheckingCompilation(false);
            return false;
          }
        }
        
        // Check exit code - non-zero might indicate compilation failure
        if (response.result.exitCode !== 0 && response.result.errors && response.result.errors.trim().length > 0) {
          const errors = response.result.errors.toLowerCase();
          if (errors.includes('error:')) {
            setCompilationError(response.result.errors);
            setIsCheckingCompilation(false);
            return false;
          }
        }
        
        setIsCheckingCompilation(false);
        return true; // Compilation successful
      } else {
        // Execution failed - might be compilation error
        setCompilationError(response.error || 'Compilation failed');
        setIsCheckingCompilation(false);
        return false;
      }
    } catch (error) {
      setCompilationError(error instanceof Error ? error.message : 'Unknown compilation error');
      setIsCheckingCompilation(false);
      return false;
    }
  };

  const runAllTests = async () => {
    if (!code || code.trim().length === 0) {
      return;
    }

    // First check for compilation errors
    const compilationSuccess = await checkCompilation();
    
    if (!compilationSuccess) {
      // Don't run tests if compilation failed
      setTestResults(new Map());
      return;
    }

    setIsRunning(true);
    setTestResults(new Map());

    // Run each test case individually
    for (let i = 0; i < testCases.length; i++) {
      setRunningTestIndex(i);
      await runTest(i);
    }

    setIsRunning(false);
    setRunningTestIndex(null);
  };

  const getTestStatus = (testIndex: number): 'pending' | 'running' | 'passed' | 'failed' => {
    if (runningTestIndex === testIndex) return 'running';
    const result = testResults.get(testIndex);
    if (!result) return 'pending';
    return result.passed ? 'passed' : 'failed';
  };

  const passedCount = Array.from(testResults.values()).filter(r => r.passed).length;
  const totalCount = testCases.length;

  return (
    <div className="test-cases-panel">
      <div className="test-cases-header">
        <div className="test-cases-title-row">
          <span className="test-cases-title">Test Cases</span>
          {testResults.size > 0 && (
            <span className="test-cases-summary">
              {passedCount}/{totalCount} passed
            </span>
          )}
        </div>
        <button
          className="run-all-tests-button"
          onClick={runAllTests}
          disabled={!code || code.trim().length === 0 || isRunning || isCheckingCompilation}
        >
          {isCheckingCompilation ? 'Checking...' : isRunning ? 'Running...' : 'Run All Tests'}
        </button>
      </div>

      {compilationError && (
        <div className="compilation-error-section">
          <div className="compilation-error-header">
            <strong>Compilation Errors:</strong>
          </div>
          <pre className="compilation-error-text">{compilationError}</pre>
        </div>
      )}

      <div className="test-cases-content">
        {testCases.map((testCase, index) => {
          const status = getTestStatus(index);
          const result = testResults.get(index);

          return (
            <div key={index} className={`test-case ${status}`}>
              <div className="test-case-header">
                <div className="test-case-label-row">
                  <span className="test-case-label">
                    {testCase.label || `Test Case ${index + 1}`}
                  </span>
                  {status === 'running' && (
                    <span className="test-status-running">Running...</span>
                  )}
                  {status === 'passed' && (
                    <span className="test-status-passed">✓ Passed</span>
                  )}
                  {status === 'failed' && (
                    <span className="test-status-failed">✗ Failed</span>
                  )}
                </div>
                <button
                  className="run-test-button"
                  onClick={() => runTest(index)}
                  disabled={!code || code.trim().length === 0 || isRunning}
                >
                  Run
                </button>
              </div>

              <div className="test-case-body">
                <div className="test-case-input">
                  <strong>Input:</strong>
                  <code>{formatInput(testCase.input)}</code>
                </div>
                <div className="test-case-expected">
                  <strong>Expected:</strong>
                  <code>{formatExpectedOutput(testCase.expectedOutput)}</code>
                </div>
                {result && (
                  <>
                    {result.actualOutput !== undefined && (
                      <div className="test-case-actual">
                        <strong>Output:</strong>
                        <code className={result.passed ? 'output-correct' : 'output-incorrect'}>
                          {result.actualOutput || '(no output)'}
                        </code>
                      </div>
                    )}
                    {result.consoleOutput !== undefined && (
                      <div className="test-case-console">
                        <strong>Console out:</strong>
                        <pre className="console-output">{result.consoleOutput || '(no console output)'}</pre>
                      </div>
                    )}
                    {result.error && (
                      <div className="test-case-error">
                        <strong>Error:</strong>
                        <code className="error-text">{result.error}</code>
                      </div>
                    )}
                    {result.executionTime !== undefined && (
                      <div className="test-case-time">
                        Runtime: {result.executionTime}ms
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

