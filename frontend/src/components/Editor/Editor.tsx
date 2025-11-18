import { Editor as MonacoEditor } from '@monaco-editor/react';
import { useRef } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  onMount?: (editor: any) => void;
}

export function Editor({ value, onChange, onMount }: EditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    if (onMount) {
      onMount(editor);
    }
  };

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="cpp"
      theme="vs-dark"
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
}

