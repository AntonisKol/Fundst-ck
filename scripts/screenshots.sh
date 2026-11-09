#!/usr/bin/env bash
# Regenerates the README screenshots in docs/screenshots/ with Maestro.
#
#   ./scripts/screenshots.sh           # Expo Go, app served by `npx expo start --port 8082`
#   ./scripts/screenshots.sh --native  # native build from `npx expo run:ios` (Metro on 8081)
#
# Needs: Maestro (https://maestro.dev), a booted iOS Simulator with Expo Go or
# the native build installed, and a demo account in ~/fundstueck-demo.txt:
#   EMAIL=...
#   PASSWORD=...
# The demo account needs at least one post (My posts) and one conversation
# with messages (Messages, Chat).
set -euo pipefail

cd "$(dirname "$0")/.."

app_id="host.exp.Exponent"
case "${1:-}" in
  "") ;;
  --native) app_id="com.antoniskol.lostandfound-app" ;;
  *) echo "Usage: $0 [--native]"; exit 1 ;;
esac

maestro=$(command -v maestro || echo "$HOME/.maestro/bin/maestro")
[ -x "$maestro" ] || { echo "Maestro not found. Install it with: curl -fsSL \"https://get.maestro.mobile.dev\" | bash"; exit 1; }

creds="$HOME/fundstueck-demo.txt"
[ -f "$creds" ] || { echo "Missing $creds (EMAIL=/PASSWORD= of the demo account)"; exit 1; }
email=$(grep '^EMAIL=' "$creds" | cut -d= -f2-)
password=$(grep '^PASSWORD=' "$creds" | cut -d= -f2-)

out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT

xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiBars 3
# A fresh simulator has no location, so the app's location lookup fails and the
# dev build's error overlay covers the screen. Put it in central Berlin.
xcrun simctl location booted set 52.5200,13.4050
"$maestro" test --test-output-dir "$out" -e APP_ID="$app_id" -e EMAIL="$email" -e PASSWORD="$password" \
  .maestro/screenshots.yaml

mkdir -p docs/screenshots
for shot in "$out"/*/*/takeScreenshot/*.png; do
  # Cap the height at 870px (about 400px wide): light for the repo, sharp in the README.
  sips -Z 870 "$shot" --out "docs/screenshots/$(basename "$shot")" > /dev/null
done
echo "Screenshots updated in docs/screenshots/"
