#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>  (e.g. $0 1.2.0)" >&2
  exit 1
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Error: '$VERSION' is not a valid semver (e.g. 1.2.0 or 1.2.0-beta.1)" >&2
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "master" ]]; then
  echo "Error: must be on master (currently on '$BRANCH')" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: working tree is dirty — commit or stash changes first" >&2
  exit 1
fi

TAG="v$VERSION"

if git rev-parse "$TAG" &>/dev/null; then
  echo "Error: tag '$TAG' already exists" >&2
  exit 1
fi

echo "Releasing $TAG..."

npm version "$VERSION" --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release $TAG"
git tag "$TAG"
git push
git push origin "$TAG"

echo "Done — $TAG pushed. CI will build and publish the release."
