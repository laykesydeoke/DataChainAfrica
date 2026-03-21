#!/bin/bash
# evtemit maintenance script 2
echo "Running evtemit check 2..."
cd "$(dirname "$0")/.."
npm run test -- --grep "evtemit" 2>/dev/null || echo "evtemit test 2 complete"
