import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from './components/Editor/Editor';
import { ProblemDescription } from './components/ProblemDescription/ProblemDescription';
import { TestCases } from './components/TestCases/TestCases';
import './App.css';

const DEFAULT_CODE = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`;

const DEFAULT_SIDEBAR_WIDTH = 350;
const MIN_SIDEBAR_WIDTH = 250;
const MAX_SIDEBAR_WIDTH = 800;

function App() {
  const [code, setCode] = useState(() => {
    // Load from localStorage or use default
    const saved = localStorage.getItem('socrates-code');
    return saved || DEFAULT_CODE;
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Load from localStorage or use default
    const saved = localStorage.getItem('socrates-sidebar-width');
    return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Save code to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('socrates-code', code);
  }, [code]);

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
          </div>
          <div className="editor-container">
            <Editor
              value={code}
              onChange={(value) => setCode(value || '')}
            />
          </div>
        </div>

        <div className="output-section">
          <TestCases code={code} />
        </div>
      </div>
    </div>
  );
}

export default App;

