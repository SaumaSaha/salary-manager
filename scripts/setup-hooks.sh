#!/bin/sh
# Setup git hooks to point to .githooks directory

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
echo "✅ Git hooks configured to use .githooks/ directory!"
