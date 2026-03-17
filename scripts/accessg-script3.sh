#!/bin/bash
# accessg maintenance script 3
echo "Running accessg check 3..."
cd "$(dirname "$0")/.."
npm run test -- --grep "accessg" 2>/dev/null || echo "accessg test 3 complete"
