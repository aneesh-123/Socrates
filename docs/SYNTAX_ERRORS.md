# Common C++ Syntax Errors to Handle

This document lists common C++ syntax errors that the error parser and formatter should handle.

## 1. Missing Semicolons
**Error Pattern:** `expected ';' before ...`
**Example:**
```cpp
cout << "Hello" << endl  // Missing semicolon
return 0;
```
**GCC Output:**
```
main.cpp:5:36: error: expected ';' before 'return'
    5 |   cout << "Hello" << endl
      |                        ^
      |                        ;
    6 |   return 0;
```

## 2. Missing Braces
**Error Pattern:** `expected '}' before ...` or `expected '{' before ...`
**Example:**
```cpp
int main() {  // Missing closing brace
    return 0;
```
**GCC Output:**
```
main.cpp:3:1: error: expected '}' at end of input
```

## 3. Mismatched Parentheses
**Error Pattern:** `expected ')' before ...` or `expected '(' before ...`
**Example:**
```cpp
if (x > 0  // Missing closing parenthesis
    cout << "positive";
```
**GCC Output:**
```
main.cpp:5:15: error: expected ')' before 'cout'
```

## 4. Mismatched Brackets
**Error Pattern:** `expected ']' before ...` or `expected '[' before ...`
**Example:**
```cpp
int arr[5 = {1, 2, 3};  // Missing closing bracket
```
**GCC Output:**
```
main.cpp:3:11: error: expected ']' before '='
```

## 5. Missing Quotes in Strings
**Error Pattern:** `missing terminating " character` or `missing terminating ' character`
**Example:**
```cpp
cout << "Hello World;  // Missing closing quote
```
**GCC Output:**
```
main.cpp:5:25: error: missing terminating " character
```

## 6. Type Mismatches
**Error Pattern:** `cannot convert ...`, `invalid conversion`, `incompatible types`
**Example:**
```cpp
int x = "hello";  // String assigned to int
```
**GCC Output:**
```
main.cpp:5:11: error: cannot convert 'const char*' to 'int' in initialization
```

## 7. Undefined Variables/Functions
**Error Pattern:** `'...' was not declared`, `'...' has not been declared`
**Example:**
```cpp
cout << x << endl;  // x not declared
```
**GCC Output:**
```
main.cpp:5:11: error: 'x' was not declared in this scope
```

## 8. Missing Includes
**Error Pattern:** `'...' was not declared`, `'...' has not been declared` (for standard library)
**Example:**
```cpp
// Missing #include <iostream>
cout << "Hello";  // cout not declared
```
**GCC Output:**
```
main.cpp:5:5: error: 'cout' was not declared in this scope
```

## 9. Missing Return Statement
**Error Pattern:** `control reaches end of non-void function`
**Example:**
```cpp
int main() {
    // No return statement
}
```
**GCC Output:**
```
main.cpp: In function 'int main()':
main.cpp:3:1: warning: control reaches end of non-void function
```

## 10. Redeclaration
**Error Pattern:** `redeclaration of ...`, `'...' previously declared here`
**Example:**
```cpp
int x = 5;
int x = 10;  // Redeclaration
```
**GCC Output:**
```
main.cpp:6:5: error: redeclaration of 'int x'
main.cpp:5:5: note: 'int x' previously declared here
```

## 11. Using Undeclared Type
**Error Pattern:** `'...' does not name a type`
**Example:**
```cpp
MyClass obj;  // MyClass not defined
```
**GCC Output:**
```
main.cpp:5:1: error: 'MyClass' does not name a type
```

## 12. Missing Function Body
**Error Pattern:** `expected unqualified-id before '{' token` or similar
**Example:**
```cpp
int add(int a, int b)  // Missing function body
```
**GCC Output:**
```
main.cpp:3:1: error: expected unqualified-id before '{' token
```

## 13. Incorrect Array Initialization
**Error Pattern:** `too many initializers`, `array must be initialized with a brace-enclosed initializer`
**Example:**
```cpp
int arr[3] = {1, 2, 3, 4};  // Too many initializers
```
**GCC Output:**
```
main.cpp:3:18: error: too many initializers for 'int [3]'
```

## 14. Missing Namespace Qualifier
**Error Pattern:** `'...' is not a member of '...'`
**Example:**
```cpp
// Without using namespace std;
std::cout << "Hello";  // If std:: is missing
```
**GCC Output:**
```
main.cpp:5:5: error: 'cout' is not a member of 'std'
```

## 15. Incorrect Function Call
**Error Pattern:** `no matching function for call to '...'`, `too many arguments`, `too few arguments`
**Example:**
```cpp
cout << "Hello" << endl << endl << endl;  // Too many endl
```
**GCC Output:**
```
main.cpp:5:5: error: no matching function for call to 'operator<<'
```

## Error Parser Categories

The error parser categorizes errors into:
- **syntax**: Missing semicolons, braces, parentheses, brackets, quotes
- **type**: Type mismatches, invalid conversions
- **undefined**: Undefined variables, functions, types
- **linker**: Linker errors (undefined references, etc.)
- **other**: Everything else

## Notes

- Most syntax errors will have `expected` in the message
- Column numbers are important for pointing to exact error location
- Some errors may have multiple related error messages
- Function context ("In function 'int main()'") helps identify scope

