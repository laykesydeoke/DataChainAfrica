#!/bin/bash
echo "Running migutil check 3..."
npm run test -- --grep "migutil" 2>/dev/null
