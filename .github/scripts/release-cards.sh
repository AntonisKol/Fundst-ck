#!/usr/bin/env bash
# Moves the "Done" cards that shipped in a release to "Released" on the
# "Fundstück" project board. Used by .github/workflows/release.yml.
#
#   .github/scripts/release-cards.sh <tag>
#
# What's in a release: the commits between the previous v* tag and <tag>.
# Their subjects name the merged PRs ("Title (#93)" or "Merge pull request #67"),
# and each PR brings the issues it closes ("Closes #N") plus the issue in its
# branch name (e.g. refactor/25-shared-item-loader). A PR with no linked issue
# has a card of its own, so the PR counts too.
# First release (no earlier v* tag): every Done card is moved.
# Only cards in Done are touched, so running it twice is harmless.
#
# Env: GH_TOKEN (classic PAT with "project" scope), REPO (owner/name),
#      PROJECT_ID, STATUS_FIELD_ID, DONE, RELEASED (option ids).
#      DRY_RUN=1 only prints what would move.
#      PREV_TAG overrides the previous tag (handy for dry runs).
#
# Local dry run against the real board, no tag needed:
#   GH_TOKEN=$(gh auth token) REPO=AntonisKol/Fundst-ck DRY_RUN=1 \
#     PREV_TAG=HEAD~5 .github/scripts/release-cards.sh HEAD
set -euo pipefail

tag="${1:?usage: release-cards.sh <tag>}"
: "${REPO:?}" "${GH_TOKEN:?}"
PROJECT_ID="${PROJECT_ID:-PVT_kwHOBCcPGs4BmglG}"
STATUS_FIELD_ID="${STATUS_FIELD_ID:-PVTSSF_lAHOBCcPGs4BmglGzhlJVBM}"
DONE="${DONE:-146c39c9}"
RELEASED="${RELEASED:-f90a7fe6}"
DRY_RUN="${DRY_RUN:-}"
owner="${REPO%/*}"; name="${REPO#*/}"

# Plain GraphQL throughout, like project-status.yml: the gh issue/pr/project
# subcommands demand extra token scopes this job doesn't need.

# Previous release tag: the nearest v* tag before this one.
prev="${PREV_TAG-$(git describe --tags --abbrev=0 --match 'v*' "$tag^" 2>/dev/null || true)}"

# Numbers ("#N" or "PR #N") of the cards that belong to this release.
# Empty "wanted" with all=1 means: every Done card.
all=0; wanted=""
if [ -z "$prev" ]; then
  all=1
  echo "$tag: first release - moving every Done card."
else
  echo "$tag: changes since $prev"
  prs=$(git log --format=%s "$prev..$tag" \
    | sed -nE 's/.*\(#([0-9]+)\)$/\1/p; s/^Merge pull request #([0-9]+) .*/\1/p' | sort -un)
  for pr in $prs; do
    info=$(gh api graphql \
      -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){headRefName closingIssuesReferences(first:20){nodes{number}}}}}' \
      -f o="$owner" -f r="$name" -F n="$pr" -q '.data.repository.pullRequest')
    branch=$(echo "$info" | jq -r '.headRefName // ""')
    issues="$(echo "$info" | jq -r '.closingIssuesReferences.nodes[]?.number') $(echo "$branch" | grep -oE '(^|/)[0-9]+-' | grep -oE '[0-9]+' || true)"
    issues=$(echo $issues | tr ' ' '\n' | grep -E '^[0-9]+$' | sort -un | sed "s/^/#/" | paste -sd " " - || true)
    echo "  PR #$pr ($branch) -> ${issues:-no linked issue}"
    wanted="$wanted PR #$pr $issues"
  done
  # One entry per line: "PR #93", "#25", ...
  wanted=$(echo "$wanted" | sed -E 's/(PR )?#/\n&/g' | sed 's/ *$//' | grep '#' | sort -u || true)
fi

# Every card on the board with its status, page by page.
items="[]"; cursor=""
while :; do
  page=$(gh api graphql \
    -f query='query($p:ID!,$c:String){node(id:$p){... on ProjectV2{items(first:100,after:$c){pageInfo{hasNextPage endCursor} nodes{id fieldValueByName(name:"Status"){... on ProjectV2ItemFieldSingleSelectValue{optionId}} content{__typename ... on Issue{number title repository{nameWithOwner}} ... on PullRequest{number title repository{nameWithOwner}}}}}}}}' \
    -f p="$PROJECT_ID" ${cursor:+-f c="$cursor"} -q '.data.node.items')
  items=$(jq -c --argjson more "$(echo "$page" | jq -c .nodes)" '. + $more' <<<"$items")
  [ "$(echo "$page" | jq -r .pageInfo.hasNextPage)" = "true" ] || break
  cursor=$(echo "$page" | jq -r .pageInfo.endCursor)
done

# Done cards from this repo, as "item-id<TAB>key<TAB>title" (key: "#N" or "PR #N").
done_cards=$(jq -r --arg repo "$REPO" --arg done "$DONE" '.[]
  | select(.fieldValueByName.optionId == $done and .content.repository.nameWithOwner == $repo)
  | [.id, ((if .content.__typename == "PullRequest" then "PR " else "" end) + "#" + (.content.number|tostring)), .content.title]
  | @tsv' <<<"$items")

moved=0
while IFS=$'\t' read -r item key title; do
  [ -n "$item" ] || continue
  if [ "$all" != 1 ] && ! grep -qxF "$key" <<<"$wanted"; then continue; fi
  if [ -n "$DRY_RUN" ]; then
    echo "[dry run] would move $key $title -> Released"
  else
    gh api graphql \
      -f query='mutation($p:ID!,$i:ID!,$f:ID!,$o:String!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{singleSelectOptionId:$o}}){projectV2Item{id}}}' \
      -f p="$PROJECT_ID" -f i="$item" -f f="$STATUS_FIELD_ID" -f o="$RELEASED" > /dev/null
    echo "$key $title -> Released"
  fi
  moved=$((moved + 1))
done <<<"$done_cards"

echo "$moved card(s) ${DRY_RUN:+would be }moved to Released."
