interface RunButtonProps {
  onClick: () => void;
  disabled: boolean;
  isExecuting: boolean;
}

export function RunButton({ onClick, disabled, isExecuting }: RunButtonProps) {
  return (
    <button
      className="run-button"
      onClick={onClick}
      disabled={disabled || isExecuting}
      title={isExecuting ? 'Code is running...' : 'Run your code (Ctrl+Enter)'}
    >
      {isExecuting ? (
        <>
          <span className="spinner">⏳</span> Running...
        </>
      ) : (
        <>
          <span>▶</span> Run
        </>
      )}
    </button>
  );
}

