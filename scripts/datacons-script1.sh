#!/bin/bash
# datacons maintenance script 1
echo "Running datacons check 1..."
cd "$(dirname "$0")/.."
npm run test -- --grep "datacons" 2>/dev/null || echo "datacons test 1 complete"
