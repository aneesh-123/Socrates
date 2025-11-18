/**
 * Error Parser Service
 * Parses C++ compiler error messages into structured format
 */

export interface ParsedError {
  file: string;
  line: number;
  column?: number;
  type: 'syntax' | 'type' | 'undefined' | 'linker' | 'other';
  message: string;
  rawError: string;
  codeSnippet?: string;
}

/**
 * Parses compiler error text into structured error objects
 * @param errorText Raw error output from compiler
 * @returns Array of parsed errors
 */
export function parseCompilerError(errorText: string): ParsedError[] {
  const errors: ParsedError[] = [];
  if (!errorText || errorText.trim().length === 0) {
    return errors;
  }

  const lines = errorText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    
    // Match: main.cpp:5:10: error: message
    // Also handles: main.cpp:5:10: error: message (with or without column)
    const errorMatch = line.match(/^(\w+\.cpp):(\d+)(?::(\d+))?:\s*(error|warning):\s*(.+)$/);
    
    if (errorMatch) {
      const [, file, lineNum, col, errorType, message] = errorMatch;
      
      // Get code snippet from following lines if available
      let codeSnippet: string | undefined;
      // Look ahead for code context (usually 1-2 lines after error)
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const nextLine = lines[j];
        // Check if it's a code snippet line (contains line number or caret indicator)
        if (nextLine.includes(lineNum) || nextLine.match(/^\s+\^/) || nextLine.match(/^\s+\|/)) {
          codeSnippet = nextLine.trim();
          break;
        }
      }
      
      errors.push({
        file,
        line: parseInt(lineNum, 10),
        column: col ? parseInt(col, 10) : undefined,
        type: categorizeErrorType(message),
        message: message.trim(),
        rawError: line,
        codeSnippet,
      });
    } else {
      // Try to match linker errors and other formats
      // Linker errors: undefined reference to 'function'
      if (line.includes('undefined reference')) {
        errors.push({
          file: 'linker',
          line: 0,
          type: 'linker',
          message: line,
          rawError: line,
        });
      }
      // collect2: error: ld returned 1 exit status
      else if (line.includes('collect2:') || line.includes('ld returned')) {
        errors.push({
          file: 'linker',
          line: 0,
          type: 'linker',
          message: line,
          rawError: line,
        });
      }
    }
  }
  
  return errors;
}

/**
 * Categorizes error type based on error message
 */
function categorizeErrorType(message: string): ParsedError['type'] {
  const lower = message.toLowerCase();
  
  // Syntax errors
  if (
    lower.includes('expected') ||
    lower.includes('syntax') ||
    lower.includes('missing') ||
    lower.includes('before') ||
    lower.includes('after')
  ) {
    return 'syntax';
  }
  
  // Undefined variable/function errors
  if (
    lower.includes('not declared') ||
    lower.includes('undefined') ||
    lower.includes("was not declared") ||
    lower.includes("has not been declared")
  ) {
    return 'undefined';
  }
  
  // Type errors
  if (
    lower.includes('does not name a type') ||
    lower.includes('cannot convert') ||
    lower.includes('invalid conversion') ||
    lower.includes('no match for') ||
    lower.includes('cannot initialize') ||
    lower.includes('incompatible types')
  ) {
    return 'type';
  }
  
  // Linker errors
  if (
    lower.includes('undefined reference') ||
    lower.includes('linker') ||
    lower.includes('ld returned')
  ) {
    return 'linker';
  }
  
  return 'other';
}

/**
 * Gets code context around a specific line number
 * @param code Full source code
 * @param lineNumber Line number (1-indexed)
 * @param contextLines Number of lines before and after to include
 * @returns Code context with line numbers
 */
export function getCodeContext(code: string, lineNumber: number, contextLines = 3): string {
  const lines = code.split('\n');
  const start = Math.max(0, lineNumber - contextLines - 1);
  const end = Math.min(lines.length, lineNumber + contextLines);
  
  const context = lines.slice(start, end);
  return context
    .map((line, idx) => {
      const actualLineNum = start + idx + 1;
      const marker = actualLineNum === lineNumber ? '>>>' : '   ';
      return `${marker} ${actualLineNum}: ${line}`;
    })
    .join('\n');
}

