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
    // Also handles: 3main.cpp:5:10: error: message (with number prefix from Docker logs)
    // Also handles: main.cpp:5:10: error: message (with or without column)
    const errorMatch = line.match(/^(\d+)?(\w+\.cpp):(\d+)(?::(\d+))?:\s*(error|warning):\s*(.+)$/);
    
    if (errorMatch) {
      const [, prefix, file, lineNum, col, errorType, message] = errorMatch;
      
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

/**
 * Formats compiler errors in GCC-style format
 * @param errorText Raw error output from compiler
 * @param userCode Full user code for context
 * @returns Formatted error string in GCC style
 */
export function formatErrorGCCStyle(errorText: string, userCode: string): string {
  if (!errorText || errorText.trim().length === 0) {
    return '';
  }

  // Check if error is already in GCC format (has code snippets with |)
  // If so, just clean it up and return
  if (errorText.includes(' | ') && errorText.includes('^')) {
    // Already formatted, just clean up any Docker log artifacts
    return errorText
      .replace(/^(\d+)(\w+\.cpp)/gm, '$2') // Remove numeric prefixes
      .trim();
  }

  const lines = errorText.split('\n');
  const codeLines = userCode.split('\n');
  const formattedErrors: string[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) {
      i++;
      continue;
    }

    // Match: main.cpp:5:10: error: message
    // Also handles: 3main.cpp:5:10: error: message (with number prefix from Docker logs)
    const errorMatch = trimmedLine.match(/^(\d+)?(\w+\.cpp):(\d+)(?::(\d+))?:\s*(error|warning):\s*(.+)$/);
    
    if (errorMatch) {
      const [, prefix, file, lineNumStr, colStr, errorType, message] = errorMatch;
      const lineNum = parseInt(lineNumStr, 10);
      const column = colStr ? parseInt(colStr, 10) : undefined;
      
      // Get function context if available (look for "In function" line before error)
      let functionContext = '';
      if (i > 0) {
        const prevLine = lines[i - 1].trim();
        if (prevLine.includes('In function')) {
          functionContext = prevLine + '\n\n';
        }
      }
      
      // Get the actual code line (1-indexed to 0-indexed conversion)
      const codeLine = lineNum > 0 && lineNum <= codeLines.length 
        ? codeLines[lineNum - 1] 
        : '';
      
      // Build formatted error
      let formatted = functionContext;
      formatted += `${file}:${lineNum}${column ? `:${column}` : ''}: ${errorType}: ${message}\n\n`;
      
      if (codeLine) {
        // Format: "    8 |   cout << "Hello World""
        const lineNumStrFormatted = lineNum.toString();
        const linePrefix = `    ${lineNumStrFormatted} | `;
        formatted += `${linePrefix}${codeLine}\n`;
        
        // Add caret pointing to error location
        if (column !== undefined && column > 0) {
          // Calculate spacing for caret
          // Need to account for tabs in the code line
          let caretColumn = column - 1; // Convert to 0-indexed
          let visualColumn = 0;
          
          // Count visual columns (tabs = 4 spaces typically)
          for (let j = 0; j < Math.min(caretColumn, codeLine.length); j++) {
            if (codeLine[j] === '\t') {
              visualColumn += 4 - (visualColumn % 4); // Tab to next multiple of 4
            } else {
              visualColumn++;
            }
          }
          
          const spacesBeforeCaret = linePrefix.length + visualColumn;
          formatted += ' ' + ' '.repeat(spacesBeforeCaret) + '^\n';
          
          // Add suggested fix if it's a missing semicolon
          if (message.includes("expected ';'")) {
            formatted += ' ' + ' '.repeat(spacesBeforeCaret) + ';\n';
          }
        } else {
          // If no column, just point to end of line
          const spacesBeforeCaret = linePrefix.length + codeLine.length;
          formatted += ' ' + ' '.repeat(spacesBeforeCaret) + '^\n';
        }
        
        // Add next line context if available
        if (lineNum < codeLines.length) {
          const nextLine = codeLines[lineNum];
          const nextLineNumStr = (lineNum + 1).toString();
          const nextLinePrefix = `    ${nextLineNumStr} | `;
          formatted += `${nextLinePrefix}${nextLine}\n`;
          // Add continuation marker
          formatted += ' ' + ' '.repeat(nextLinePrefix.length) + '~~~~~~\n';
        }
      }
      
      formattedErrors.push(formatted);
    } else {
      // Check for "In function" context lines - preserve them
      if (trimmedLine.includes('In function')) {
        formattedErrors.push(trimmedLine);
        i++;
        continue;
      }
      
      // For non-standard errors, try to preserve original format
      if (trimmedLine.includes('undefined reference') || 
          trimmedLine.includes('collect2:') || 
          trimmedLine.includes('ld returned')) {
        formattedErrors.push(trimmedLine);
      }
    }
    
    i++;
  }
  
  // If we didn't format anything, return original (might already be formatted)
  if (formattedErrors.length === 0) {
    return errorText;
  }
  
  return formattedErrors.join('\n');
}

