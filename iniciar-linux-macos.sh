#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
PORT="${PORT:-4173}"
PIDFILE=".algeroll-server.pid"

if [ -f "$PIDFILE" ]; then
  PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    rm -f "$PIDFILE"
    echo "AlgeRoll detenido."
    exit 0
  fi
  rm -f "$PIDFILE"
fi

node server.mjs --port "$PORT" >algeroll-server.log 2>algeroll-server-error.log &
echo $! > "$PIDFILE"
echo "AlgeRoll iniciado en http://127.0.0.1:$PORT/"
echo "Ejecuta de nuevo este script para detenerlo."
