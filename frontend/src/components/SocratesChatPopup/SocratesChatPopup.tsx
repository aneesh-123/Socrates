import './SocratesChatPopup.css';

interface SocratesChatPopupProps {
  isVisible: boolean;
  response: string | null;
  isLoading: boolean;
  error: string | null;
  category: string | null;
  testResult: { passed?: number; total?: number } | null;
  onClose: () => void;
  onToggle: () => void;
}

export function SocratesChatPopup({
  isVisible,
  response,
  isLoading,
  error,
  category,
  testResult,
  onClose,
  onToggle,
}: SocratesChatPopupProps) {
  if (!isVisible && !response && !isLoading && !error) {
    return null;
  }

  return (
    <div className={`socrates-chat-popup ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="socrates-chat-header" onClick={onToggle}>
        <div className="socrates-chat-title">
          <span className="socrates-icon">🧠</span>
          <span>Socrates</span>
        </div>
        <div className="socrates-chat-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="socrates-chat-toggle"
            onClick={onToggle}
            title={isVisible ? 'Hide' : 'Show'}
          >
            {isVisible ? '−' : '+'}
          </button>
          <button
            className="socrates-chat-close"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      {isVisible && (
        <div className="socrates-chat-content">
          {/* TESTING: Display category classification */}
          {category && (
            <div className="socrates-chat-testing-info">
              <strong>🧪 TESTING INFO:</strong>
              <div className="testing-details">
                <div><strong>Category:</strong> <span className="category-badge">{category}</span></div>
                {testResult && (
                  <div><strong>Tests:</strong> {testResult.passed ?? 0} / {testResult.total ?? 0} passed</div>
                )}
              </div>
            </div>
          )}
          {isLoading && (
            <div className="socrates-chat-loading">
              <span className="spinner">⏳</span>
              <span>Thinking...</span>
            </div>
          )}
          {error && (
            <div className="socrates-chat-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {response && !isLoading && !error && (
            <div className="socrates-chat-response">
              {response.split('\n').map((line, index) => (
                <p key={index}>{line || '\u00A0'}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

