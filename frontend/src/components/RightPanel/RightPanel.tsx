import { useState, useEffect, useRef } from 'react';
import { TestCases } from '../TestCases/TestCases';
import './RightPanel.css';

interface RightPanelProps {
  code: string;
  testRunTrigger?: number;
}

export function RightPanel({ code, testRunTrigger }: RightPanelProps) {
  const [autoRunTrigger, setAutoRunTrigger] = useState(0);
  const lastTestRunTriggerRef = useRef<number>(0);

  // Handle external test run trigger (when Run is clicked)
  useEffect(() => {
    if (testRunTrigger !== undefined && testRunTrigger > lastTestRunTriggerRef.current) {
      lastTestRunTriggerRef.current = testRunTrigger;
      setAutoRunTrigger(prev => prev + 1);
    }
  }, [testRunTrigger]);

  return (
    <div className="right-panel">
      <div className="right-panel-content">
        <TestCases code={code} autoRunTrigger={autoRunTrigger} />
      </div>
    </div>
  );
}

