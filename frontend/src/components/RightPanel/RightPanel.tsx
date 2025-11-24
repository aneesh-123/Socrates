import { useState, useEffect, useRef } from 'react';
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

  // Auto-switch to output tab when there are errors
  useEffect(() => {
    const hasErrors = error || (result && result.errors && result.errors.trim().length > 0);
    
    // Track when execution transitions from executing to not executing
    const executionJustCompleted = wasExecutingRef.current && !isExecuting;
    
    if (hasErrors) {
      // If there are errors, show output tab
      setActiveTab('output');
    } else if (result && !isExecuting && executionJustCompleted) {
      // Only proceed if execution just completed (transitioned from executing to done)
      // and there are no errors
      const resultChanged = result !== lastResultRef.current;
      
      if (resultChanged && result.exitCode === 0 && !result.errors) {
        // Switch to test cases when there are no errors
        setActiveTab('testcases');
        
        // Only auto-run if execution just completed and there are no errors
        if (!error && (!result.errors || result.errors.trim().length === 0)) {
          setAutoRunTrigger(prev => prev + 1);
        }
      }
    }
    
    lastResultRef.current = result;
    wasExecutingRef.current = isExecuting;
  }, [error, result, isExecuting]);

  const hasErrors = error || (result && result.errors && result.errors.trim().length > 0);

  return (
    <div className="right-panel">
      <div className="right-panel-tabs">
        <button
          className={`tab-button ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          Output
          {hasErrors && <span className="error-indicator">!</span>}
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

