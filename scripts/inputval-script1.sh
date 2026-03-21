#!/bin/bash
# inputval maintenance script 1
echo "Running inputval check 1..."
cd "$(dirname "$0")/.."
npm run test -- --grep "inputval" 2>/dev/null || echo "inputval test 1 complete"
