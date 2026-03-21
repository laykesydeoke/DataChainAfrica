#!/bin/bash
echo "Running migutil check 2..."
npm run test -- --grep "migutil" 2>/dev/null
