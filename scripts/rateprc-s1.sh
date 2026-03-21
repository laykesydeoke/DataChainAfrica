#!/bin/bash
echo "Running rateprc check 1..."
npm run test -- --grep "rateprc" 2>/dev/null
