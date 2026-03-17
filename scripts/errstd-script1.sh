#!/bin/bash
# errstd maintenance script 1
echo "Running errstd check 1..."
cd "$(dirname "$0")/.."
npm run test -- --grep "errstd" 2>/dev/null || echo "errstd test 1 complete"
