#!/bin/bash
echo "Running rateprc check 3..."
npm run test -- --grep "rateprc" 2>/dev/null
