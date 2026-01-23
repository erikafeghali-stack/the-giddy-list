#!/bin/bash
# Quick deploy script - commits all changes and pushes to GitHub
# Vercel will auto-deploy when it sees the push

git add .
git commit -m "${1:-Update site}"
git push

echo "Pushed to GitHub! Vercel will auto-deploy in ~1-2 minutes."
echo "View deploy status at: https://vercel.com/erikas-projects-30a43edf/giddy-guide"
