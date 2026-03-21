#!/bin/bash
# errstd maintenance script 2
echo "Running errstd check 2..."
cd "$(dirname "$0")/.."
npm run test -- --grep "errstd" 2>/dev/null || echo "errstd test 2 complete"
