#!/bin/bash
echo "Running trkgap check 2..."
npm run test -- --grep "trkgap" 2>/dev/null
