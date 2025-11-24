import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ParsedError {
  file: string;
  line: number;
  column?: number;
  type: 'syntax' | 'type' | 'undefined' | 'linker' | 'other';
  message: string;
  rawError: string;
  codeSnippet?: string;
}

export interface ExecutionResult {
  output: string;
  errors: string;
  parsedErrors?: ParsedError[];
  exitCode: number;
  executionTime: number;
  usedHarness?: boolean;
}

export interface ExecuteResponse {
  success: boolean;
  result?: ExecutionResult;
  error?: string;
  details?: unknown;
}

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
 * Executes C++ code on the backend
 * @param code C++ code to execute
 * @returns Execution result
 */
export async function executeCode(code: string): Promise<ExecuteResponse> {
  try {
    const response = await axios.post<ExecuteResponse>(`${API_BASE_URL}/execute`, {
      code,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to execute code',
        details: error.response?.data?.details,
      };
    }
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.status === 200;
  } catch {
    return false;
  }
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

