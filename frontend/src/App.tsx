import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from './components/Editor/Editor';
import { ProblemDescription } from './components/ProblemDescription/ProblemDescription';
import { RightPanel } from './components/RightPanel/RightPanel';
import { RunButton } from './components/RunButton/RunButton';
import { AskSocratesButton } from './components/AskSocratesButton/AskSocratesButton';
import { SocratesChatPopup } from './components/SocratesChatPopup/SocratesChatPopup';
import { chatWithSocrates } from './services/api';
import './App.css';

const DEFAULT_CODE = `#include <vector>
#include <iostream>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        return {};
    }
};`;

const DEFAULT_SIDEBAR_WIDTH = 350;
const MIN_SIDEBAR_WIDTH = 250;
const MAX_SIDEBAR_WIDTH = 800;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [testRunTrigger, setTestRunTrigger] = useState(0);
  const [socratesResponse, setSocratesResponse] = useState<string | null>(null);
  const [socratesLoading, setSocratesLoading] = useState(false);
  const [socratesError, setSocratesError] = useState<string | null>(null);
  const [socratesVisible, setSocratesVisible] = useState(false);
  const [socratesCategory, setSocratesCategory] = useState<string | null>(null);
  const [socratesTestResult, setSocratesTestResult] = useState<{ passed?: number; total?: number } | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Load from localStorage or use default
    const saved = localStorage.getItem('socrates-sidebar-width');
    return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Save sidebar width to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('socrates-sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
  }, [sidebarWidth]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX.current;
      const newWidth = Math.max(
        MIN_SIDEBAR_WIDTH,
        Math.min(MAX_SIDEBAR_WIDTH, resizeStartWidth.current + diff)
      );
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleRun = useCallback(() => {
    if (code.trim().length === 0) {
      return;
    }
    
    // Always trigger test cases when Run is clicked
    setTestRunTrigger(prev => prev + 1);
  }, [code]);

  const handleAskSocrates = useCallback(async () => {
    if (!code || code.trim().length === 0) {
      setSocratesError('Please write some code first');
      setSocratesVisible(true);
      return;
    }

    setSocratesLoading(true);
    setSocratesError(null);
    setSocratesResponse(null);
    setSocratesCategory(null);
    setSocratesTestResult(null);
    setSocratesVisible(true);

    try {
      // Run tests, classify, and get AI response
      const result = await chatWithSocrates(code);
      
      setSocratesResponse(result.response);
      setSocratesCategory(result.category || null);
      setSocratesTestResult(result.testResult || null);
      console.log('Socrates API called successfully:', {
        category: result.category,
        testResult: result.testResult,
      });
    } catch (error) {
      console.error('Failed to chat with Socrates:', error);
      setSocratesError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setSocratesLoading(false);
    }
  }, [code]);

  const handleCloseSocrates = useCallback(() => {
    setSocratesVisible(false);
    setSocratesResponse(null);
    setSocratesError(null);
    setSocratesCategory(null);
    setSocratesTestResult(null);
  }, []);

  const handleToggleSocrates = useCallback(() => {
    setSocratesVisible(prev => !prev);
  }, []);

  // Keyboard shortcut: Ctrl+Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧠 Socrates</h1>
        <p className="subtitle">AI-Powered Interactive Coding Tutor</p>
      </header>
      
      <div className="main-container">
        <div 
          ref={sidebarRef}
          className="problem-section"
          style={{ width: `${sidebarWidth}px` }}
        >
          <ProblemDescription />
        </div>

        <div 
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleResizeStart}
        />

        <div className="editor-section">
          <div className="editor-header">
            <span>main.cpp</span>
            <RunButton
              onClick={handleRun}
              disabled={code.trim().length === 0}
              isExecuting={false}
            />
          </div>
          <div className="editor-container">
            <AskSocratesButton onClick={handleAskSocrates} />
            <Editor
              value={code}
              onChange={(value) => setCode(value || '')}
            />
          </div>
        </div>

        <div className="output-section">
          <RightPanel
            code={code}
            testRunTrigger={testRunTrigger}
          />
        </div>
      </div>

      <SocratesChatPopup
        isVisible={socratesVisible}
        response={socratesResponse}
        isLoading={socratesLoading}
        error={socratesError}
        category={socratesCategory}
        testResult={socratesTestResult}
        onClose={handleCloseSocrates}
        onToggle={handleToggleSocrates}
      />
    </div>
  );
}

export default App;

