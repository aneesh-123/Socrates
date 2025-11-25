import { useMemo, useState } from 'react';
import { ExecutionResult, explainError, ErrorExplanation as ErrorExplanationType } from '../../services/api';
import { ErrorExplanation } from '../ErrorExplanation/ErrorExplanation';

interface OutputPanelProps {
  result: ExecutionResult | null;
  error: string | null;
  isExecuting: boolean;
  code: string;
}

export function OutputPanel({ result, error, isExecuting, code }: OutputPanelProps) {
  const [explanation, setExplanation] = useState<ErrorExplanationType | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const hasCompilerErrors = useMemo(() => {
    if (error) {
      return true;
    }
    if (result?.errors) {
      const normalized = result.errors.toLowerCase();
      // Only treat real compilation/linker errors as errors
      // Ignore warnings (unused parameters, etc.) and test failures
      return (
        (normalized.includes('error:') && !normalized.includes('warning')) ||
        normalized.includes('undefined reference') ||
        normalized.includes('collect2:') ||
        normalized.includes('ld returned') ||
        normalized.includes('cannot find') ||
        normalized.includes('no such file') ||
        normalized.includes('multiple definition')
      );
    }
    return false;
  }, [error, result]);

  const handleExplainError = async (errorText: string) => {
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
  if (isExecuting) {
    return (
      <div className="output-panel">
        <div className="output-header">
          <span>Output</span>
          <span className="status-executing">Running...</span>
        </div>
        <div className="output-content">
          <div className="loading-spinner">⏳ Compiling and executing...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="output-panel">
        <div className="output-header">
          <span>Error</span>
        </div>
        <div className="output-content error">
          <pre>{error}</pre>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="output-panel">
        <div className="output-header">
          <span>Output</span>
        </div>
        <div className="output-content empty">
          <p>Click "Run" to execute your code</p>
        </div>
      </div>
    );
  }

  const displayErrors = hasCompilerErrors && result.errors ? result.errors : '';
  const hasErrors = displayErrors && displayErrors.trim().length > 0;
  
  // Show output if it exists (no more harness complexity)
  const hasOutput = result.output && typeof result.output === 'string' && result.output.trim().length > 0;
  
  // Debug: Log to see what we're receiving
  if (result) {
    console.log('OutputPanel - Received result:', {
      hasOutput,
      outputLength: result.output?.length || 0,
      outputPreview: result.output?.substring(0, 200) || '(empty)',
      hasErrors,
      exitCode: result.exitCode,
    });
  }

  return (
    <div className="output-panel">
      <div className="output-header">
        <span>Output</span>
        <span className={`status ${(result.exitCode ?? 1) === 0 ? 'status-success' : 'status-error'}`}>
          {(result.exitCode ?? 1) === 0 ? '✓' : '✗ Failed'}
          {(result.exitCode ?? 1) === 0 && result.executionTime && result.executionTime > 0 && ` (${result.executionTime}ms)`}
          {(result.exitCode ?? 1) !== 0 && result.executionTime && result.executionTime > 0 && ` (${result.executionTime}ms)`}
        </span>
      </div>
      <div className="output-content">
        {hasErrors && (
          <div className="error-section">
            <div className="section-header">
              <span>Errors:</span>
              <button
                className="explain-button"
                onClick={() => {
                  if (displayErrors) {
                    handleExplainError(displayErrors);
                  }
                }}
                disabled={isLoadingExplanation}
              >
                {isLoadingExplanation ? '🤔 Analyzing...' : '💡 Explain Error'}
              </button>
            </div>
            <pre className="error-text">{displayErrors}</pre>
            
            {/* Add ErrorExplanation component */}
            <ErrorExplanation
              explanation={explanation}
              isLoading={isLoadingExplanation}
              error={explanationError}
            />
          </div>
        )}
        {hasOutput && (
          <div className="output-text-section">
            <div className="section-header">Output:</div>
            <pre className="output-text">{result.output}</pre>
          </div>
        )}
        {!hasErrors && !hasOutput && (
          <div className="empty-output">Program executed successfully with no output.</div>
        )}
      </div>
    </div>
  );
}

