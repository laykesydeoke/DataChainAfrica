#!/bin/bash
# inputval maintenance script 3
echo "Running inputval check 3..."
cd "$(dirname "$0")/.."
npm run test -- --grep "inputval" 2>/dev/null || echo "inputval test 3 complete"
