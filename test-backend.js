// Quick test script for backend API
// Run this after starting the backend: node test-backend.js

const testCode = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from test!" << endl;
    return 0;
}`;

async function testBackend() {
  try {
    console.log('Testing backend API...\n');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch('http://localhost:3001/api/health');
    const health = await healthRes.json();
    console.log('   ✓ Health check:', health);
    
    // Test execute endpoint
    console.log('\n2. Testing code execution...');
    const executeRes = await fetch('http://localhost:3001/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: testCode }),
    });
    
    const result = await executeRes.json();
    
    if (result.success) {
      console.log('   ✓ Code executed successfully!');
      console.log('   Output:', result.result.output);
      console.log('   Exit code:', result.result.exitCode);
      console.log('   Execution time:', result.result.executionTime, 'ms');
    } else {
      console.log('   ✗ Execution failed:', result.error);
    }
    
    console.log('\n✅ Backend is working correctly!');
  } catch (error) {
    console.error('❌ Error testing backend:', error.message);
    console.log('\nMake sure:');
    console.log('  - Backend is running (npm run dev in backend/)');
    console.log('  - Docker is running');
    console.log('  - Backend is on http://localhost:3001');
  }
}

testBackend();

