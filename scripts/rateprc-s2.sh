#!/bin/bash
echo "Running rateprc check 2..."
npm run test -- --grep "rateprc" 2>/dev/null
