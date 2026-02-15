#!/bin/bash

# Git Hooks Installation Script
# Installs git hooks from scripts/git-hooks/ to .git/hooks/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SOURCE="$SCRIPT_DIR/git-hooks"
GIT_HOOKS_DIR="$(git rev-parse --git-dir)/hooks"

echo "Installing git hooks..."

# Copy hooks to .git/hooks/
if [ -d "$HOOKS_SOURCE" ]; then
    for hook in "$HOOKS_SOURCE"/*; do
        if [ -f "$hook" ]; then
            hook_name=$(basename "$hook")
            cp "$hook" "$GIT_HOOKS_DIR/$hook_name"
            chmod +x "$GIT_HOOKS_DIR/$hook_name"
            echo "  Installed: $hook_name"
        fi
    done
    echo "Git hooks installed successfully."
else
    echo "Error: Hooks directory not found at $HOOKS_SOURCE"
    exit 1
fi

# Configure commit template if not already set
TEMPLATE_PATH="$SCRIPT_DIR/../.gitmessage.txt"
if [ -f "$TEMPLATE_PATH" ]; then
    if ! git config commit.template "$TEMPLATE_PATH" 2>/dev/null; then
        git config commit.template "$TEMPLATE_PATH"
        echo "Configured commit message template."
    else
        echo "Commit template already configured."
    fi
else
    echo "Warning: Template file not found at $TEMPLATE_PATH"
fi

echo "Done."
