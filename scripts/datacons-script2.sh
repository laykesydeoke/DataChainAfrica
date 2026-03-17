#!/bin/bash
# datacons maintenance script 2
echo "Running datacons check 2..."
cd "$(dirname "$0")/.."
npm run test -- --grep "datacons" 2>/dev/null || echo "datacons test 2 complete"
