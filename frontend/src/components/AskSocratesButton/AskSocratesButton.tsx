import './AskSocratesButton.css';

interface AskSocratesButtonProps {
  onClick: () => void;
}

export function AskSocratesButton({ onClick }: AskSocratesButtonProps) {
  return (
    <button
      className="ask-socrates-button"
      onClick={onClick}
      title="Ask Socrates for help with your code"
    >
      <span className="socrates-icon">🧠</span>
      <span>Ask Socrates</span>
    </button>
  );
}

