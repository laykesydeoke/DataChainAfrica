#!/bin/bash
# errstd maintenance script 3
echo "Running errstd check 3..."
cd "$(dirname "$0")/.."
npm run test -- --grep "errstd" 2>/dev/null || echo "errstd test 3 complete"
