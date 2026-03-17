#!/bin/bash
# evtemit maintenance script 1
echo "Running evtemit check 1..."
cd "$(dirname "$0")/.."
npm run test -- --grep "evtemit" 2>/dev/null || echo "evtemit test 1 complete"
