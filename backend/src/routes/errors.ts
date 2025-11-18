import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { explainError } from '../services/aiService';
import { parseCompilerError, ParsedError } from '../services/errorParser';

const router = Router();

// Request validation schema
const explainRequestSchema = z.object({
  errorText: z.string().min(1, 'Error text cannot be empty'),
  code: z.string().min(1, 'Code cannot be empty'),
});

/**
 * POST /api/errors/explain
 * Generates AI explanation for a compiler error
 */
router.post('/explain', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = explainRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { errorText, code } = validationResult.data;

    // Parse the error text into structured format
    const parsedErrors = parseCompilerError(errorText);

    if (parsedErrors.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not parse error message',
        message: 'The error text provided does not match expected compiler error format',
      });
    }

    // Explain the first error (most important one)
    const firstError = parsedErrors[0];
    const explanation = await explainError(firstError, code);

    // Return success response
    res.json({
      success: true,
      explanation,
      parsedError: firstError,
      allErrors: parsedErrors, // Include all parsed errors for reference
    });
  } catch (error) {
    console.error('Error explanation failed:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return res.status(500).json({
          success: false,
          error: 'AI service not configured',
          message: 'OpenAI API key is not set. Please configure OPENAI_API_KEY in .env file',
        });
      }

      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'OpenAI API rate limit exceeded. Please try again in a moment.',
        });
      }
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Failed to generate explanation',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

export default router;

