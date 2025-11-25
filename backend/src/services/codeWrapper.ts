import * as fs from 'fs/promises';
import * as path from 'path';

const TEST_CASES_SNIPPET = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <stdexcept>
#include <exception>
#include <sstream>

using namespace std;

#include "solution.hpp"

struct TestCase {
  vector<int> nums;
  int target;
  vector<int> expected;
  string label;
};

vector<TestCase> getDefaultTestCases() {
  return {
    {{2, 7, 11, 15}, 9, {0, 1}, "Example 1"},
    {{3, 2, 4}, 6, {1, 2}, "Example 2"},
    {{3, 3}, 6, {0, 1}, "Example 3"}
  };
}

string vectorToString(const vector<int>& values) {
  if (values.empty()) {
    return "[]";
  }
  ostringstream oss;
  oss << "[";
  for (size_t i = 0; i < values.size(); ++i) {
    oss << values[i];
    if (i + 1 < values.size()) {
      oss << ", ";
    }
  }
  oss << "]";
  return oss.str();
}

string formatInput(const vector<int>& nums, int target) {
  ostringstream oss;
  oss << "nums = " << vectorToString(nums) << ", target = " << target;
  return oss.str();
}

bool arraysEqualUnordered(vector<int> a, vector<int> b) {
  if (a.size() != b.size()) {
    return false;
  }
  sort(a.begin(), a.end());
  sort(b.begin(), b.end());
  return a == b;
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  vector<TestCase> testCases = getDefaultTestCases();
  Solution solution;
  int passed = 0;

  for (size_t i = 0; i < testCases.size(); ++i) {
    const auto& test = testCases[i];
    vector<int> numsCopy = test.nums;
    cout << "Test Case " << (i + 1) << " - " << test.label << ": ";
    bool passedCase = false;
    vector<int> actual;
    bool executed = false;

    try {
      actual = solution.twoSum(numsCopy, test.target);
      executed = true;
      passedCase = arraysEqualUnordered(actual, test.expected);
      cout << (passedCase ? "PASSED" : "FAILED") << "\\n";
    } catch (const exception& ex) {
      cout << "FAILED (exception: " << ex.what() << ")\\n";
    } catch (...) {
      cout << "FAILED (unknown exception)\\n";
    }

    cout << "  Input:     " << formatInput(test.nums, test.target) << "\\n";
    cout << "  Expected:  " << vectorToString(test.expected) << "\\n";
    if (executed) {
      cout << "  Output:    " << vectorToString(actual) << "\\n";
    }
    cout << "-----------------------------\\n";

    if (passedCase) {
      passed++;
    }
  }

  cout << "Summary: " << passed << "/" << testCases.size() << " tests passed." << "\\n";
  if (passed == static_cast<int>(testCases.size())) {
    cout << "All tests passed!\\n";
    return 0;
  }

  cout << "Some tests failed.\\n";
  return 1;
}
`.trim();

const MAIN_DETECTION_REGEX = /\bint\s+main\s*\(/;

export interface PreparedCodeResult {
  mainFilePath: string;
  filesForErrors: Record<string, string>;
  usedHarness: boolean;
}

/**
 * Generates a harness that runs a single test case
 */
function generateSingleTestHarness(testIndex: number): string {
  const testCases = [
    { nums: [2, 7, 11, 15], target: 9, expected: [0, 1], label: "Example 1" },
    { nums: [3, 2, 4], target: 6, expected: [1, 2], label: "Example 2" },
    { nums: [3, 3], target: 6, expected: [0, 1], label: "Example 3" }
  ];

  const test = testIndex >= 0 && testIndex < testCases.length ? testCases[testIndex] : testCases[0];
  const numsStr = `{${test.nums.join(', ')}}`;
  const expectedStr = `{${test.expected.join(', ')}}`;

  return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <sstream>

using namespace std;

#include "solution.hpp"

string vectorToString(const vector<int>& values) {
  if (values.empty()) {
    return "[]";
  }
  ostringstream oss;
  oss << "[";
  for (size_t i = 0; i < values.size(); ++i) {
    oss << values[i];
    if (i + 1 < values.size()) {
      oss << ", ";
    }
  }
  oss << "]";
  return oss.str();
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  
  Solution solution;
  vector<int> nums = ${numsStr};
  int target = ${test.target};
  
  // Mark start of console output (before calling user's function)
  cout << "CONSOLE_START\\n";
  cout.flush();
  
  // Call user's function (this will capture all their cout statements)
  vector<int> result = solution.twoSum(nums, target);
  
  // Mark end of console output and start of return value
  cout << "CONSOLE_END\\n";
  cout.flush();
  cout << "RETURN_VALUE:" << vectorToString(result) << "\\n";
  cout.flush();
  
  return 0;
}
`.trim();
}

/**
 * Prepares user code for execution. If the user provided their own main function,
 * we use the code as-is. Otherwise, we generate a harness that includes the user's
 * Solution implementation and runs a single test case.
 */
export async function prepareCodeForExecution(
  dirPath: string, 
  userCode: string, 
  testIndex?: number
): Promise<PreparedCodeResult> {
  const hasUserMain = MAIN_DETECTION_REGEX.test(userCode);

  if (hasUserMain) {
    const mainPath = path.join(dirPath, 'main.cpp');
    await fs.writeFile(mainPath, userCode, 'utf-8');
    return {
      mainFilePath: mainPath,
      filesForErrors: { 'main.cpp': userCode },
      usedHarness: false,
    };
  }

  const trimmedUserCode = userCode.trim().length > 0 ? userCode.trim() + '\n' : '';
  const solutionPath = path.join(dirPath, 'solution.hpp');
  await fs.writeFile(solutionPath, trimmedUserCode, 'utf-8');

  // Generate harness for single test case if testIndex is provided
  const harnessCode = testIndex !== undefined 
    ? generateSingleTestHarness(testIndex)
    : TEST_CASES_SNIPPET;

  const mainPath = path.join(dirPath, 'main.cpp');
  await fs.writeFile(mainPath, harnessCode + '\n', 'utf-8');

  return {
    mainFilePath: mainPath,
    filesForErrors: {
      'solution.hpp': trimmedUserCode,
      'main.cpp': harnessCode,
    },
    usedHarness: true,
  };
}

