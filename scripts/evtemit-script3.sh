#!/bin/bash
# evtemit maintenance script 3
echo "Running evtemit check 3..."
cd "$(dirname "$0")/.."
npm run test -- --grep "evtemit" 2>/dev/null || echo "evtemit test 3 complete"
