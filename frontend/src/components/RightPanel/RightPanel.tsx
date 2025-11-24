import { useState, useEffect, useRef, useMemo } from 'react';
import { OutputPanel } from '../OutputPanel/OutputPanel';
import { TestCases } from '../TestCases/TestCases';
import { ExecutionResult } from '../../services/api';
import './RightPanel.css';

interface RightPanelProps {
  result: ExecutionResult | null;
  error: string | null;
  isExecuting: boolean;
  code: string;
}

type TabType = 'output' | 'testcases';

export function RightPanel({ result, error, isExecuting, code }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('testcases');
  const [autoRunTrigger, setAutoRunTrigger] = useState(0);
  const lastResultRef = useRef<ExecutionResult | null>(null);
  const wasExecutingRef = useRef<boolean>(false);

  const hasCompilerErrors = useMemo(() => {
    if (error) {
      return true;
    }
    if (result && result.errors) {
      const normalized = result.errors.toLowerCase();
      if (
        normalized.includes('error:') ||
        normalized.includes('undefined reference') ||
        normalized.includes('collect2:') ||
        normalized.includes('ld returned')
      ) {
        return true;
      }
    }
    return false;
  }, [error, result]);

  // Auto-switch to output tab when there are errors
  useEffect(() => {
    // Track when execution transitions from executing to not executing
    const executionJustCompleted = wasExecutingRef.current && !isExecuting;

    if (hasCompilerErrors) {
      // If there are compiler errors, show output tab
      setActiveTab('output');
    } else if (result && !isExecuting && executionJustCompleted) {
      const resultChanged = result !== lastResultRef.current;

      if (resultChanged) {
        // Switch to test cases whenever compilation succeeded
        setActiveTab('testcases');
        setAutoRunTrigger(prev => prev + 1);
      }
    }

    lastResultRef.current = result;
    wasExecutingRef.current = isExecuting;
  }, [hasCompilerErrors, result, isExecuting]);

  return (
    <div className="right-panel">
      <div className="right-panel-tabs">
        <button
          className={`tab-button ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          Output
          {hasCompilerErrors && <span className="error-indicator">!</span>}
        </button>
        <button
          className={`tab-button ${activeTab === 'testcases' ? 'active' : ''}`}
          onClick={() => setActiveTab('testcases')}
        >
          Test Cases
        </button>
      </div>

      <div className="right-panel-content">
        {activeTab === 'output' && (
          <OutputPanel
            result={result}
            error={error}
            isExecuting={isExecuting}
            code={code}
          />
        )}
        {activeTab === 'testcases' && (
          <TestCases code={code} autoRunTrigger={autoRunTrigger} />
        )}
      </div>
    </div>
  );
}

