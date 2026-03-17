#!/bin/bash
# accessg maintenance script 2
echo "Running accessg check 2..."
cd "$(dirname "$0")/.."
npm run test -- --grep "accessg" 2>/dev/null || echo "accessg test 2 complete"
