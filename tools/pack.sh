#!/bin/sh
# Builds dist/yamina-<version>.zip — only the files the extension needs — for
# uploading to the Chrome Web Store.
set -e
cd "$(dirname "$0")/.."
version=$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')
mkdir -p dist
out="dist/yamina-$version.zip"
rm -f "$out"
zip -q -X "$out" manifest.json background.js content.js icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png
echo "$out"
