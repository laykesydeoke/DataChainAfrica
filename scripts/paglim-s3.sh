#!/bin/bash
echo "Running paglim check 3..."
npm run test -- --grep "paglim" 2>/dev/null
