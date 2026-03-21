#!/bin/bash
echo "Running paglim check 1..."
npm run test -- --grep "paglim" 2>/dev/null
