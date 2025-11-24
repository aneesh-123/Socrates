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
  // Initialize to current autoRunTrigger value to prevent running on mount/tab switch
  // This ensures the ref is set before any effects run
  const lastAutoRunTrigger = useRef<number>(autoRunTrigger ?? 0);
  const isFirstRender = useRef<boolean>(true);

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
      if (code && code.trim().length > 0 && !isRunning) {
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

  const runTest = async (testIndex: number) => {
    if (!code || code.trim().length === 0) {
      return;
    }

    setIsRunning(true);
    setRunningTestIndex(testIndex);

    try {
      // For now, we'll just run the code and check if output matches
      // In a real implementation, you'd need to modify the code to accept the test input
      const response = await executeCode(code);
      
      if (response.success && response.result) {
        const testCase = testCases[testIndex];
        const actualOutput = response.result.output.trim();
        const passed = checkTestResult(actualOutput, testCase.expectedOutput);
        
        const testResult: TestResult = {
          testIndex,
          passed,
          actualOutput,
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

  const runAllTests = async () => {
    if (!code || code.trim().length === 0) {
      return;
    }

    setIsRunning(true);
    setTestResults(new Map());

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
          disabled={!code || code.trim().length === 0 || isRunning}
        >
          {isRunning ? 'Running...' : 'Run All Tests'}
        </button>
      </div>

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

