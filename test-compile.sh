#!/bin/bash
# Simple test to verify Docker compilation works

echo "Testing Docker compilation..."

# Create a test file
mkdir -p test-temp
cat > test-temp/main.cpp << 'EOF'
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
EOF

# Test compilation in Docker
docker run --rm -v "$(pwd)/test-temp:/workspace:ro" gcc:latest sh -c "cd /workspace && g++ -std=c++17 -o main main.cpp 2>&1 && echo 'Compilation successful' || echo 'Compilation failed'"

# Cleanup
rm -rf test-temp

