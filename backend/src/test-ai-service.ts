/**
 * Quick test to verify AI Service (Phase 2) is working
 * Run with: npx tsx src/test-ai-service.ts
 */

import 'dotenv/config';
import { parseCompilerError } from './services/errorParser';
import { explainError } from './services/aiService';

async function testAIService() {
  console.log('🧪 Testing Phase 2: AI Service\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Parse a compiler error
  console.log('📝 Step 1: Parsing compiler error...');
  const sampleError = `main.cpp:5:10: error: expected ';' before '}'
    5 |     return 0
      |          ^
      |          ;`;

  const parsedErrors = parseCompilerError(sampleError);
  
  if (parsedErrors.length === 0) {
    console.error('❌ Failed to parse error');
    process.exit(1);
  }

  const error = parsedErrors[0];
  console.log('✅ Error parsed successfully:');
  console.log(`   File: ${error.file}`);
  console.log(`   Line: ${error.line}`);
  console.log(`   Column: ${error.column}`);
  console.log(`   Type: ${error.type}`);
  console.log(`   Message: ${error.message}\n`);

  // Test 2: Generate AI explanation
  console.log('🤖 Step 2: Generating AI explanation...');
  console.log('   (This may take 5-10 seconds...)\n');

  const sampleCode = `#include <iostream>
using namespace std;

int main() {
    return 0
}`;

  try {
    const explanation = await explainError(error, sampleCode);

    console.log('✅ AI Explanation generated successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📖 EXPLANATION:\n');
    
    if (explanation.explanation) {
      console.log('💡 What this means:');
      console.log(explanation.explanation);
      console.log('');
    }

    if (explanation.whyItHappened) {
      console.log('🔍 Why it happened:');
      console.log(explanation.whyItHappened);
      console.log('');
    }

    if (explanation.howToFix) {
      console.log('🔧 How to fix it:');
      console.log(explanation.howToFix);
      console.log('');
    }

    if (explanation.codeExample) {
      console.log('📝 Example:');
      console.log(explanation.codeExample);
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Phase 2 is WORKING! 🎉');
    console.log('   The AI service can successfully:');
    console.log('   ✓ Parse compiler errors');
    console.log('   ✓ Generate beginner-friendly explanations');
    console.log('   ✓ Provide fix guidance\n');

  } catch (error) {
    console.error('❌ AI Service test FAILED\n');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}\n`);
      
      if (error.message.includes('OPENAI_API_KEY')) {
        console.log('💡 Make sure your .env file has:');
        console.log('   OPENAI_API_KEY=your-key-here\n');
      }
    }
    process.exit(1);
  }
}

testAIService().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

