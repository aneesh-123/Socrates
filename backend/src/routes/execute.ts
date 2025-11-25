import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createTempDir, cleanupTempDir, validateCodeSize } from '../services/fileService';
import { executeCode } from '../services/dockerService';
import { DOCKER_CONFIG } from '../config/docker';
import { formatErrorGCCStyle } from '../services/errorParser';
import { prepareCodeForExecution } from '../services/codeWrapper';

const router = Router();

// Request validation schema
const executeRequestSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty'),
  testIndex: z.number().int().min(0).optional(),
});

/**
 * POST /api/execute
 * Compiles and executes C++ code in a Docker sandbox
 */
router.post('/execute', async (req: Request, res: Response) => {
  let tempDir: string | null = null;

  try {
    // Validate request body
    const validationResult = executeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { code, testIndex } = validationResult.data;

    // Validate code size
    try {
      validateCodeSize(code, DOCKER_CONFIG.MAX_CODE_SIZE);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Code size validation failed',
      });
    }

    // Create temporary directory
    tempDir = await createTempDir();

    // Prepare code: if no main(), automatically wrap with test harness (single test if testIndex provided)
    const preparedCode = await prepareCodeForExecution(tempDir, code, testIndex);

    // Execute code in Docker
    const result = await executeCode(tempDir);

    // Format errors in GCC style if there are errors
    let formattedErrors = result.errors;
    if (result.errors && result.errors.trim().length > 0) {
      formattedErrors = formatErrorGCCStyle(result.errors, preparedCode.filesForErrors);
    }

    // Debug: Log what we're sending back
    console.log('Execute route - Sending result:', {
      outputLength: result.output?.length || 0,
      outputPreview: result.output?.substring(0, 200) || '(empty)',
      hasErrors: !!formattedErrors,
      exitCode: result.exitCode,
    });

    // Return result
    res.json({
      success: true,
      result: {
        output: result.output,
        errors: formattedErrors,
        parsedErrors: result.parsedErrors,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
      },
    });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  } finally {
    // Cleanup temporary directory
    if (tempDir) {
      await cleanupTempDir(tempDir);
    }
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'socrates-backend' });
});

export default router;

