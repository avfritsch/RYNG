#!/bin/sh
# Install git hooks — run once after clone: npm run prepare

HOOK=".git/hooks/pre-push"

cat > "$HOOK" << 'EOF'
#!/bin/sh
# Pre-push hook: type check + unit tests + E2E tests
# Skip with: git push --no-verify

echo "🔍 Type check..."
npx tsc --noEmit || exit 1

echo "🧪 Unit tests..."
npm test || exit 1

echo "🌐 E2E tests..."
npm run test:e2e || exit 1

echo "✅ All checks passed."
EOF

chmod +x "$HOOK"
echo "✅ Pre-push hook installed."

COMMIT_HOOK=".git/hooks/commit-msg"
cat > "$COMMIT_HOOK" << 'HOOKEOF'
#!/bin/sh
npx --no -- commitlint --edit "$1"
HOOKEOF
chmod +x "$COMMIT_HOOK"
echo "✅ Commit-msg hook installed."
