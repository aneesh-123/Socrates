import { ErrorExplanation as ErrorExplanationType } from '../../services/api';
import './ErrorExplanation.css';

interface ErrorExplanationProps {
  explanation: ErrorExplanationType | null;
  isLoading?: boolean;
  error?: string | null;
}

export function ErrorExplanation({ explanation, isLoading, error }: ErrorExplanationProps) {
  if (isLoading) {
    return (
      <div className="error-explanation loading">
        <div className="explanation-header">
          <span className="icon">🤔</span>
          <span>Analyzing error...</span>
        </div>
        <div className="explanation-content">
          <p>Please wait while we generate an explanation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-explanation error">
        <div className="explanation-header">
          <span className="icon">⚠️</span>
          <span>Error</span>
        </div>
        <div className="explanation-content">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <div className="error-explanation">
      <div className="explanation-header">
        <span className="icon">💡</span>
        <span>AI Explanation</span>
      </div>
      <div className="explanation-content">
        {explanation.explanation && (
          <div className="section">
            <h4>What this means:</h4>
            <p>{explanation.explanation}</p>
          </div>
        )}

        {explanation.whyItHappened && (
          <div className="section">
            <h4>Why it happened:</h4>
            <p>{explanation.whyItHappened}</p>
          </div>
        )}

        {explanation.howToFix && (
          <div className="section">
            <h4>How to fix it:</h4>
            <p>{explanation.howToFix}</p>
          </div>
        )}

        {explanation.codeExample && (
          <div className="section">
            <h4>Example:</h4>
            <pre className="code-example">{explanation.codeExample}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

