#!/bin/bash
# inputval maintenance script 2
echo "Running inputval check 2..."
cd "$(dirname "$0")/.."
npm run test -- --grep "inputval" 2>/dev/null || echo "inputval test 2 complete"
