#!/bin/bash
# Auto-deploy watcher - monitors for changes and deploys automatically
# Run with: ./auto-deploy.sh
# Stop with: Ctrl+C

cd /Users/erikahester/giddy-guide

echo "🚀 Auto-deploy watcher started!"
echo "   Watching for changes in /Users/erikahester/giddy-guide"
echo "   Press Ctrl+C to stop"
echo ""

while true; do
    # Check if there are any changes (staged, unstaged, or untracked)
    if [[ -n $(git status --porcelain) ]]; then
        echo "📝 Changes detected, waiting 10 seconds for you to finish editing..."
        sleep 10

        # Check again - if still changes, deploy
        if [[ -n $(git status --porcelain) ]]; then
            echo "🔄 Deploying changes..."
            git add .
            git commit -m "Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"
            git push
            echo "✅ Deployed! Site will update in ~1-2 minutes."
            echo ""
        fi
    fi
    sleep 5
done
