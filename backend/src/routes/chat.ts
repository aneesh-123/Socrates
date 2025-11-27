import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { chatWithSocratesCustom } from '../services/aiService';
import { classifyTestResults } from '../services/testClassifier';
import { getPromptTemplate } from '../services/promptTemplates';

const router = Router();

// Request validation schema
const chatRequestSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty'),
  message: z.string().optional(), // Optional for now, will be used for custom queries later
});

/**
 * POST /api/chat
 * Chat with Socrates AI tutor
 * Flow: Run tests -> Classify results -> Use appropriate prompt template -> Get AI response
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = chatRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { code } = validationResult.data;

    // Step 1: Run tests and classify results
    console.log('Running tests and classifying results...');
    const testResult = await classifyTestResults(code);
    console.log(`Classification result: ${testResult.category}`);

    // Step 2: Get appropriate prompt template based on category
    const { systemPrompt, userPrompt } = getPromptTemplate(
      testResult.category,
      testResult,
      code
    );

    // Step 3: Get AI response using the template
    console.log('Getting AI response...');
    const response = await chatWithSocratesCustom(systemPrompt, userPrompt);

    // Return success response with classification info
    res.json({
      success: true,
      response,
      category: testResult.category,
      testResult: {
        passed: testResult.testResults?.passed,
        total: testResult.testResults?.total,
      },
    });
  } catch (error) {
    console.error('Chat failed:', error);

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
      error: 'Failed to get AI response',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

export default router;

