import { useState, useCallback } from 'react';
import { executeCode, ExecutionResult } from '../services/api';

interface UseCodeExecutionReturn {
  result: ExecutionResult | null;
  isExecuting: boolean;
  error: string | null;
  execute: (code: string) => Promise<void>;
  clear: () => void;
}

export function useCodeExecution(): UseCodeExecutionReturn {
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (code: string) => {
    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const response = await executeCode(code);
      
      if (response.success && response.result) {
        setResult(response.result);
      } else {
        setError(response.error || 'Execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isExecuting,
    error,
    execute,
    clear,
  };
}

