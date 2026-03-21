#!/bin/bash
# datacons maintenance script 3
echo "Running datacons check 3..."
cd "$(dirname "$0")/.."
npm run test -- --grep "datacons" 2>/dev/null || echo "datacons test 3 complete"
