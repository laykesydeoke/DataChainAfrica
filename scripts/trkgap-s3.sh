#!/bin/bash
echo "Running trkgap check 3..."
npm run test -- --grep "trkgap" 2>/dev/null
