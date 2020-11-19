#!/bin/bash

#
# Install the extension directly without building
#

# --list-only

SOURCE='./stocks@infinicode.de/'
DEST="$HOME/.local/share/gnome-shell/extensions/stocks-qarj@infinicode.de/"

rsync --recursive --verbose $SOURCE $DEST

glib-compile-schemas ~/.local/share/gnome-shell/extensions/stocks-qarj@infinicode.de/schemas

