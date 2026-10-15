#!/bin/bash
# ============================================================================
# WanderBudget AI — Quick Start Launch Script
# Student: Garudaiahgari Sai Siri Chandana | Register Number: 24BAI0226
# Course: BCSE302P Database Systems Lab | Slot: L25+L26 | Faculty: Dr. V. SIVAKUMAR
# ============================================================================

set -e

echo "================================================================="
echo " WanderBudget AI: Dynamic Trip Budget Builder & Cost Analyzer"
echo " Student: Garudaiahgari Sai Siri Chandana (24BAI0226) | Slot: L25+L26"
echo "================================================================="

# Start Backend Server
echo "Starting Backend API on port 5001..."
cd backend
node server_wanderbudget_24BAI0226.js &
BACKEND_PID=$!
cd ..

# Start Frontend Dev Server
echo "Starting Frontend Vite server on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "-----------------------------------------------------------------"
echo "✔ WanderBudget AI is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5001"
echo "Press Ctrl+C to terminate both servers."
echo "-----------------------------------------------------------------"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
