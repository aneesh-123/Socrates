import Docker from 'dockerode';
import docker, { DOCKER_CONFIG } from '../config/docker';
import * as path from 'path';
import { parseCompilerError, ParsedError } from './errorParser';

export interface ExecutionResult {
  output: string;
  errors: string;
  parsedErrors?: ParsedError[]; // Structured parsed errors
  exitCode: number;
  executionTime: number;
}

/**
 * Creates a Docker container for code execution
 */
async function createContainer(hostDir: string): Promise<Docker.Container> {
  // Compile first, then run. Capture all output including errors.
  // Compile to /tmp (writable) since /workspace is read-only
  const compileAndRunScript = `
cd /workspace
g++ -std=c++17 -Wall -Wextra -o /tmp/main main.cpp 2>&1
COMPILE_EXIT=$?
if [ $COMPILE_EXIT -eq 0 ]; then
  timeout 10s /tmp/main 2>&1
  RUN_EXIT=$?
  echo "EXIT_CODE:$RUN_EXIT"
else
  echo "EXIT_CODE:$COMPILE_EXIT"
fi
`.trim();
  
  const container = await docker.createContainer({
    Image: DOCKER_CONFIG.IMAGE,
    Cmd: ['sh', '-c', compileAndRunScript],
    WorkingDir: '/workspace',
    HostConfig: {
      Binds: [`${hostDir}:/workspace:ro`], // Read-only mount (source code)
      NetworkMode: 'none', // No network access
      Memory: DOCKER_CONFIG.MEMORY_LIMIT,
      MemorySwap: DOCKER_CONFIG.MEMORY_SWAP,
      CpuQuota: DOCKER_CONFIG.CPU_LIMIT * 100000, // Convert to microseconds
      CpuPeriod: 100000,
      AutoRemove: true, // Automatically remove container when it exits
    },
    AttachStdout: true,
    AttachStderr: true,
      Tty: false,
      OpenStdin: false,
      // User: 'nobody', // Commented out - may cause permission issues
  });

  return container;
}

/**
 * Ensures the Docker image exists, pulling it if necessary
 */
async function ensureImage(): Promise<void> {
  try {
    const image = docker.getImage(DOCKER_CONFIG.IMAGE);
    await image.inspect();
  } catch (error) {
    return new Promise((resolve, reject) => {
      docker.pull(DOCKER_CONFIG.IMAGE, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) {
          reject(err);
          return;
        }
        
        docker.modem.followProgress(stream, (err: Error | null, output: unknown) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }
}

/**
 * Executes code in a Docker container
 * @param hostDir Path to the directory containing the code
 * @returns Execution result with output, errors, and exit code
 */
export async function executeCode(hostDir: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  let container: Docker.Container | null = null;

  try {
    // Ensure image exists
    await ensureImage();
    
    // Create container
    container = await createContainer(hostDir);

    // Start container
    await container.start();

    // Wait for container to finish (with timeout)
    const timeout = (DOCKER_CONFIG.EXECUTION_TIMEOUT + DOCKER_CONFIG.COMPILATION_TIMEOUT) * 1000;
    const waitPromise = container.wait({ condition: 'not-running' });
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), timeout);
    });

    try {
      await Promise.race([waitPromise, timeoutPromise]);
    } catch (error) {
      // If timeout, kill the container
      try {
        await container.kill();
      } catch (killError) {
        // Container might have already exited
      }
      throw error;
    }

    // Get container logs
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      timestamps: false,
    });

    const executionTime = Date.now() - startTime;
    
    // Convert buffer to string and clean up Docker log formatting
    // Docker logs can have control characters - clean them up
    let logOutput = logs.toString('utf-8');
    
    // Remove Docker log frame headers (8-byte headers: [stream][padding][length][data])
    // Stream: 0x01 = stdout, 0x02 = stderr
    // We'll strip these by removing non-printable characters at line starts
    logOutput = logOutput
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/^\x01|\x01$/g, '') // Remove stdout markers
      .replace(/^\x02|\x02$/g, ''); // Remove stderr markers
    
    // Also clean up any remaining weird characters
    logOutput = logOutput.replace(/[^\x20-\x7E\n\r\t]/g, ''); // Keep only printable ASCII + newlines/tabs
    
    // Clean up numeric prefixes before filenames (e.g., "3main.cpp" -> "main.cpp")
    // This can happen due to Docker log formatting
    logOutput = logOutput.replace(/^(\d+)(\w+\.cpp)/gm, '$2');

    // Parse exit code from logs (if present) or use container exit code
    let exitCode = 0;
    const exitCodeMatch = logOutput.match(/EXIT_CODE:(\d+)/);
    if (exitCodeMatch) {
      exitCode = parseInt(exitCodeMatch[1], 10);
    } else {
      const inspect = await container.inspect();
      exitCode = inspect.State.ExitCode || 0;
    }

    // Remove exit code marker from output
    let cleanOutput = logOutput;
    const exitCodeIndex = logOutput.indexOf('EXIT_CODE:');
    if (exitCodeIndex !== -1) {
      cleanOutput = logOutput.substring(0, exitCodeIndex).trim();
    }

    // Split output and errors
    const lines = cleanOutput.split('\n');
    const outputLines: string[] = [];
    const errorLines: string[] = [];

    // Better error detection - look for common compiler/linker error patterns
    let inErrorSection = false;
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.includes('error:') ||
        lowerLine.includes('error ') ||
        lowerLine.includes('undefined reference') ||
        lowerLine.includes('collect2:') ||
        lowerLine.includes('ld returned') ||
        lowerLine.includes('cannot find') ||
        lowerLine.includes('no such file') ||
        lowerLine.includes('multiple definition') ||
        lowerLine.startsWith('main.cpp:')
      ) {
        inErrorSection = true;
        errorLines.push(line);
      } else if (inErrorSection && (line.trim().length === 0 || line.match(/^\s+\^/))) {
        // Continue error section for empty lines or error indicators (^)
        errorLines.push(line);
      } else if (inErrorSection && !line.includes('warning:')) {
        // Continue error section unless it's just a warning
        errorLines.push(line);
      } else {
        outputLines.push(line);
      }
    }

    // Get raw error text
    const rawErrorText = errorLines.length > 0 
      ? errorLines.join('\n') 
      : (exitCode !== 0 ? cleanOutput || 'Compilation or execution failed with no error message' : '');
    
    // Parse errors into structured format
    const parsedErrors = rawErrorText ? parseCompilerError(rawErrorText) : [];
    
    // Format errors in GCC style (we'll need the user code for this, but for now use raw)
    // Note: We'll format this in the route handler where we have access to user code
    const errorText = rawErrorText;

    // If compilation failed (non-zero exit code), show all output as errors if no clear errors found
    if (exitCode !== 0) {
      if (errorLines.length > 0) {
        return {
          output: '',
          errors: errorText,
          parsedErrors,
          exitCode,
          executionTime,
        };
      } else {
        // If no clear errors but exit code is non-zero, show full output as error
        return {
          output: '',
          errors: errorText,
          parsedErrors,
          exitCode,
          executionTime,
        };
      }
    }

    return {
      output: outputLines.join('\n').trim(),
      errors: errorText,
      parsedErrors: parsedErrors.length > 0 ? parsedErrors : undefined,
      exitCode,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          output: '',
          errors: 'Execution timed out. Your program took too long to run.',
          parsedErrors: [],
          exitCode: 124, // Standard timeout exit code
          executionTime,
        };
      }
      
      return {
        output: '',
        errors: `Execution error: ${error.message}`,
        parsedErrors: [],
        exitCode: 1,
        executionTime,
      };
    }

    return {
      output: '',
      errors: 'Unknown execution error occurred',
      parsedErrors: [],
      exitCode: 1,
      executionTime,
    };
  } finally {
    // Container is set to AutoRemove: true, so it will be removed automatically.
    // Only try to remove manually if AutoRemove didn't work (shouldn't happen).
    // If we get a 409 error, it means removal is already in progress - that's fine.
    if (container) {
      try {
        const inspect = await container.inspect();
        // Only remove if container still exists and isn't already being removed
        if (inspect.State.Status !== 'removing') {
          await container.remove({ force: true });
        }
      } catch (error: any) {
        // 409 means removal is already in progress (AutoRemove is working) - not an error
        // 404 means container already removed - also not an error
        if (error?.statusCode !== 409 && error?.statusCode !== 404) {
          // Only log if it's a real error
          console.error('Failed to remove container:', error);
        }
      }
    }
  }
}

