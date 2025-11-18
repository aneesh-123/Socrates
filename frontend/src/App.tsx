import { useState, useEffect, useCallback } from 'react';
import { Editor } from './components/Editor/Editor';
import { OutputPanel } from './components/OutputPanel/OutputPanel';
import { RunButton } from './components/RunButton/RunButton';
import { useCodeExecution } from './hooks/useCodeExecution';
import './App.css';

const DEFAULT_CODE = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`;

function App() {
  const [code, setCode] = useState(() => {
    // Load from localStorage or use default
    const saved = localStorage.getItem('socrates-code');
    return saved || DEFAULT_CODE;
  });

  const { result, isExecuting, error, execute, clear } = useCodeExecution();

  // Save code to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('socrates-code', code);
  }, [code]);

  const handleRun = useCallback(() => {
    if (code.trim().length === 0) {
      return;
    }
    execute(code);
  }, [code, execute]);

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
        <div className="editor-section">
          <div className="editor-header">
            <span>main.cpp</span>
            <RunButton
              onClick={handleRun}
              disabled={code.trim().length === 0}
              isExecuting={isExecuting}
            />
          </div>
          <div className="editor-container">
            <Editor
              value={code}
              onChange={(value) => setCode(value || '')}
            />
          </div>
        </div>

        <div className="output-section">
          <OutputPanel
            result={result}
            error={error}
            isExecuting={isExecuting}
            code={code}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

