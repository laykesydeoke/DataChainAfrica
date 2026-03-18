#!/bin/bash
echo "Running paglim check 2..."
npm run test -- --grep "paglim" 2>/dev/null
