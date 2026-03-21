#!/bin/bash
echo "Running trkgap check 1..."
npm run test -- --grep "trkgap" 2>/dev/null
