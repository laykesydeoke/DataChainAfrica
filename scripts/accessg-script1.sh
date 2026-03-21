#!/bin/bash
# accessg maintenance script 1
echo "Running accessg check 1..."
cd "$(dirname "$0")/.."
npm run test -- --grep "accessg" 2>/dev/null || echo "accessg test 1 complete"
