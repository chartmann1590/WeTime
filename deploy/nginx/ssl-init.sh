#!/bin/sh

set -e

CERT_DIR="/etc/ssl/wetime"
CERT_FILE="$CERT_DIR/wetime.crt"
KEY_FILE="$CERT_DIR/wetime.key"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Generating self-signed certificate..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=US/ST=New York/L=New York/O=WeTime/CN=localhost"
else
  echo "Certificate already exists."
fi

exec "$@"
