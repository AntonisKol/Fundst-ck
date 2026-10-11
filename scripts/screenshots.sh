#!/usr/bin/env bash
# Regenerates the README screenshots in docs/screenshots/ with Maestro.
#
# Needs: a booted iOS Simulator with Expo Go, the app served by
# `npx expo start --port 8082`, and a demo account in ~/fundstueck-demo.txt:
#   EMAIL=...
#   PASSWORD=...
set -euo pipefail

cd "$(dirname "$0")/.."
creds="$HOME/fundstueck-demo.txt"
[ -f "$creds" ] || { echo "Missing $creds (EMAIL=/PASSWORD= of the demo account)"; exit 1; }
email=$(grep '^EMAIL=' "$creds" | cut -d= -f2-)
password=$(grep '^PASSWORD=' "$creds" | cut -d= -f2-)

out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT

xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiBars 3
maestro test --test-output-dir "$out" -e EMAIL="$email" -e PASSWORD="$password" .maestro/screenshots.yaml

mkdir -p docs/screenshots
for shot in "$out"/*/*/takeScreenshot/*.png; do
  # Cap the height at 870px (about 400px wide): light for the repo, sharp in the README.
  sips -Z 870 "$shot" --out "docs/screenshots/$(basename "$shot")" > /dev/null
done
echo "Screenshots updated in docs/screenshots/"
