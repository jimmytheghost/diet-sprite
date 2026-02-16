#!/bin/bash

# Diet Sprite 4.1 - Launch Script
# This script starts the Python HTTP server

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

PORT=8550

echo "🚀 Starting Diet Sprite 4.1..."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python is not installed or not in PATH"
        echo "   Please install Python to run this server"
        exit 1
    fi
    PYTHON_CMD="python"
else
    PYTHON_CMD="python3"
fi

# Check if port is already in use
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Kill process on port if it exists
kill_existing_server() {
    local PID=$(lsof -ti :$PORT)
    if [ ! -z "$PID" ]; then
        echo "⚠️  Port $PORT is already in use (PID: $PID)"
        echo "🔄 Killing existing process..."
        kill $PID 2>/dev/null
        sleep 1
        # Check if it's still running
        if lsof -ti :$PORT >/dev/null 2>&1; then
            echo "⚠️  Process didn't terminate, trying force kill..."
            kill -9 $PID 2>/dev/null
            sleep 1
        fi
    fi
}

# Check and handle port conflict
if check_port; then
    kill_existing_server
    # Check again after killing
    if check_port; then
        echo "❌ Could not free port $PORT. Please manually stop the process using it."
        echo "   Run: lsof -ti :$PORT | xargs kill"
        exit 1
    fi
fi

# Start Python HTTP server on port 8550 from parent directory
echo "⏳ Starting HTTP server on http://localhost:$PORT..."
echo "📁 Server root: $SCRIPT_DIR"

if [ "$PYTHON_CMD" = "python3" ]; then
    python3 -m http.server $PORT > /dev/null 2>&1 &
else
    python -m SimpleHTTPServer $PORT > /dev/null 2>&1 &
fi

SERVER_PID=$!

# Wait for server to start and verify it's running
echo "⏳ Waiting for server to start..."
for i in {1..10}; do
    sleep 0.5
    if check_port; then
        break
    fi
done

# Verify server started successfully
if ! check_port; then
    echo "❌ Failed to start server on port $PORT"
    exit 1
fi

# Open the browser
echo "🌐 Opening browser..."
open http://localhost:$PORT/index.html

echo ""
echo "✅ Server is running!"
echo ""
echo "📝 Available URL:"
echo "   http://localhost:$PORT/index.html"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo "   Or run: kill $SERVER_PID"
echo ""

# Wait for the server process
wait $SERVER_PID

