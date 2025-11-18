import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createTempDir, writeCodeToFile, cleanupTempDir, validateCodeSize } from '../services/fileService';
import { executeCode } from '../services/dockerService';
import { DOCKER_CONFIG } from '../config/docker';

const router = Router();

// Request validation schema
const executeRequestSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty'),
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

    const { code } = validationResult.data;

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

    // Write code to file
    await writeCodeToFile(tempDir, code);

    // Execute code in Docker
    const result = await executeCode(tempDir);

    // Return result
    res.json({
      success: true,
      result: {
        output: result.output,
        errors: result.errors,
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

