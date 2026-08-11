#!/usr/bin/env sh
set -eu

SERVER="${STARCUT_MCP_SERVER:-plugin:starcut:starcut}"

if command -v python3 >/dev/null 2>&1; then
  exec python3 -c 'import pty, sys; pty.spawn(sys.argv[1:])' \
    claude mcp login "$SERVER"
fi

exec claude mcp login "$SERVER"
