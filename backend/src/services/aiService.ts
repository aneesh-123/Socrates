/**
 * AI Service
 * Provides AI-powered error explanations using OpenAI
 */

import OpenAI from 'openai';
import { ParsedError, getCodeContext } from './errorParser';

// Initialize OpenAI client
let openai: OpenAI | null = null;

/**
 * Gets the API key by reading .env file directly
 * This avoids dotenv truncation issues with long API keys
 */
function getAPIKey(): string {
  try {
    const fs = require('fs');
    const path = require('path');
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '..', '.env'),
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), 'backend', '.env'),
    ];
    
    let envPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        envPath = p;
        break;
      }
    }
    
    if (envPath) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split(/\r?\n/);
      
      for (const line of lines) {
        if (line.trim().startsWith('OPENAI_API_KEY')) {
          // Extract everything after the = sign
          const match = line.match(/OPENAI_API_KEY\s*=\s*(.+)/);
          if (match) {
            let extractedKey = match[1].trim();
            // Remove quotes if the entire value is quoted
            if ((extractedKey.startsWith('"') && extractedKey.endsWith('"')) ||
                (extractedKey.startsWith("'") && extractedKey.endsWith("'"))) {
              extractedKey = extractedKey.slice(1, -1).trim();
            }
            // Remove any trailing whitespace or newlines
            extractedKey = extractedKey.replace(/[\s\r\n]+$/, '').trim();
            
            if (extractedKey.length > 0) {
              console.log(`✅ Loaded API key from file: ${extractedKey.length} characters`);
              return extractedKey;
            }
          }
        }
      }
    }
  } catch (error) {
    // Fallback to dotenv if file reading fails
    const dotenvKey = process.env.OPENAI_API_KEY;
    if (dotenvKey) {
      console.warn('⚠️  Could not read .env file directly, using dotenv value');
      return dotenvKey;
    }
  }
  
  // Final fallback to dotenv
  const dotenvKey = process.env.OPENAI_API_KEY;
  if (dotenvKey) {
    return dotenvKey;
  }
  
  throw new Error('OPENAI_API_KEY not found in .env file or environment variables');
}

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = getAPIKey();
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openai;
}

/**
 * Chat with Socrates - general AI chat functionality
 * @param message User's message
 * @param userCode Optional user code context
 * @returns AI response
 */
export async function chatWithSocrates(
  message: string,
  userCode?: string
): Promise<string> {
  try {
    const client = getOpenAIClient();
    
    // Build the system prompt
    const systemPrompt = `You are Socrates, an AI-powered interactive coding tutor. You help students learn C++ programming by:
- Answering questions about C++ concepts
- Explaining code and algorithms
- Providing guidance on problem-solving
- Being encouraging and educational
- Not giving away complete solutions, but guiding students to discover answers

Be patient, clear, and helpful. If the user provides code, analyze it and provide helpful feedback.`;

    // Build the user message with optional code context
    let userMessage = message;
    if (userCode) {
      userMessage = `${message}\n\nHere is my current code:\n\`\`\`cpp\n${userCode}\n\`\`\``;
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '';
    return content.trim();
  } catch (error) {
    // Handle API errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
      }
      throw new Error(`Failed to chat with Socrates: ${error.message}`);
    }
    throw new Error('Unknown error occurred while chatting with Socrates');
  }
}

/**
 * Chat with Socrates using custom prompts
 * @param systemPrompt System prompt for the AI
 * @param userPrompt User prompt/message
 * @returns AI response
 */
export async function chatWithSocratesCustom(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  try {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '';
    return content.trim();
  } catch (error) {
    // Handle API errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
      }
      throw new Error(`Failed to chat with Socrates: ${error.message}`);
    }
    throw new Error('Unknown error occurred while chatting with Socrates');
  }
}

export interface ErrorExplanation {
  explanation: string;        // What the error means
  whyItHappened: string;      // Why it occurred
  howToFix: string;          // How to fix it (guidance, not solution)
  codeExample?: string;       // Optional example fix
}

/**
 * Explains a compiler error in beginner-friendly terms using AI
 * @param error Parsed error information
 * @param userCode Full user code
 * @param codeContext Optional pre-computed code context (if not provided, will be computed)
 * @returns Structured error explanation
 */
export async function explainError(
  error: ParsedError,
  userCode: string,
  codeContext?: string
): Promise<ErrorExplanation> {
  try {
    const client = getOpenAIClient();
    
    // Get code context around the error line
    const context = codeContext || getCodeContext(userCode, error.line);
    
    // Build the prompt
    const prompt = `You are a patient, encouraging coding tutor helping a beginner understand C++ compiler errors.

The user got this error:
File: ${error.file}
Line: ${error.line}${error.column ? `, Column: ${error.column}` : ''}
Error Type: ${error.type}
Error Message: ${error.message}

The code around line ${error.line}:
${context}

Please provide a helpful explanation with these sections:
1. **What this means**: A simple explanation of what the error means (in beginner-friendly terms)
2. **Why it happened**: Why this error occurred (what in their code caused it)
3. **How to fix it**: How to fix it (guide them, don't just give the answer - be educational)
4. **Example** (optional): A brief code example if helpful (but don't give away the full solution)

Be encouraging and educational, like a patient teacher. Keep explanations clear and concise. Format your response with clear section headers.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        {
          role: 'system',
          content: 'You are a helpful C++ coding tutor that explains compiler errors in a beginner-friendly way. Always be encouraging and educational.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse the response into structured format
    return parseExplanation(content);
  } catch (error) {
    // Handle API errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
      }
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
      }
      throw new Error(`Failed to generate error explanation: ${error.message}`);
    }
    throw new Error('Unknown error occurred while generating explanation');
  }
}

/**
 * Parses AI response into structured ErrorExplanation
 * Attempts to extract sections, falls back to returning full text as explanation
 */
function parseExplanation(content: string): ErrorExplanation {
  const explanation: ErrorExplanation = {
    explanation: '',
    whyItHappened: '',
    howToFix: '',
  };

  // Try to parse structured sections
  // Look for common section headers
  const whatMatch = content.match(/(?:what this means|explanation)[:]\s*(.+?)(?=\n\n|\n\*\*|$)/is);
  const whyMatch = content.match(/(?:why it happened|why)[:]\s*(.+?)(?=\n\n|\n\*\*|$)/is);
  const howMatch = content.match(/(?:how to fix|how to fix it|fix)[:]\s*(.+?)(?=\n\n|\n\*\*|$)/is);
  const exampleMatch = content.match(/(?:example|code example)[:]\s*(.+?)(?=\n\n|\n\*\*|$)/is);

  if (whatMatch) {
    explanation.explanation = whatMatch[1].trim();
  }
  if (whyMatch) {
    explanation.whyItHappened = whyMatch[1].trim();
  }
  if (howMatch) {
    explanation.howToFix = howMatch[1].trim();
  }
  if (exampleMatch) {
    explanation.codeExample = exampleMatch[1].trim();
  }

  // If we couldn't parse sections, use the full content as explanation
  if (!explanation.explanation && !explanation.whyItHappened && !explanation.howToFix) {
    explanation.explanation = content.trim();
  }

  // If explanation is empty but we have other fields, use first part of content
  if (!explanation.explanation && content.trim().length > 0) {
    explanation.explanation = content.split('\n\n')[0]?.trim() || content.trim();
  }

  return explanation;
}

/**
 * Checks if OpenAI API is configured
 * @returns true if API key is set, false otherwise
 */
export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

