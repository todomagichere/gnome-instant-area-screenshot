#!/bin/sh
set -e
UUID=instant-area-screenshot@rperez
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -r "$(dirname "$0")/$UUID" "$DEST"
gnome-extensions enable "$UUID" 2>/dev/null || echo "Cierra sesión y vuelve a entrar, luego: gnome-extensions enable $UUID"
