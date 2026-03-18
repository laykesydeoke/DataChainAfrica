#!/bin/bash
echo "Running migutil check 1..."
npm run test -- --grep "migutil" 2>/dev/null
