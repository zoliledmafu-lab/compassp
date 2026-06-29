# Git Branch Workflow — Compass

This document explains how to work on the Compass project as a team using Git branches.

---

## What is a branch?

`main` is the live, stable version of the code. A branch is a separate copy where you can make changes without touching `main` until the work is ready and reviewed.

---

## Step-by-step workflow

### 1. Pull the latest main before starting

Always do this before creating a new branch so your work starts from the latest code.

```bash
git checkout main
git pull origin main
```

---

### 2. Create a branch for your feature or fix

```bash
git checkout -b feature/add-shona-subject
```

Use a descriptive name that reflects what you are working on:

| Prefix | When to use |
|--------|-------------|
| `feature/` | New feature or page |
| `fix/` | Bug fix |
| `update/` | Updating existing content or logic |
| `chore/` | Config, dependencies, cleanup |

You are now on your own branch. Changes here will not affect `main`.

---

### 3. Make your changes and commit as you go

Stage and commit in small, focused steps.

```bash
git add src/lib/knowledge/curriculum.ts
git commit -m "Add Shona O-Level curriculum data"

git add src/lib/subjects.ts
git commit -m "Register Shona subject in subjects list"
```

Small commits are easier to review and easier to undo if something goes wrong.

---

### 4. Push your branch to GitHub

```bash
git push origin feature/add-shona-subject
```

This makes your branch visible to your teammate on GitHub.

---

### 5. Open a Pull Request

```bash
gh pr create --title "Add Shona O-Level subject" --body "Adds curriculum data and subject registration for Shona."
```

Or go to github.com/zoliledmafu-lab/compassp and GitHub will prompt you to open a PR for your recently pushed branch.

Your teammate reviews the code, leaves comments, and approves it.

---

### 6. Merge into main

On GitHub, click **Merge pull request** once the PR is approved. The branch is merged into `main`.

---

### 7. Clean up after merging

```bash
git checkout main
git pull origin main                           # get the merged changes locally
git branch -d feature/add-shona-subject        # delete your local branch
```

---

## How two developers work at the same time

```
main ─────────────────────────────────────────────▶
       │                              │
       ├── feature/shona (dev 1)      │
       │          └────────────────▶  merged via PR
       │
       └── feature/dashboard (dev 2)
                  └──────────────────────────────▶  merged via PR
```

Each person works on their own branch. Neither blocks the other. PRs are how changes get reviewed before they land in `main`.

---

## Resolving merge conflicts

A conflict happens when two branches edit the same part of the same file. Git will flag it when you try to merge.

```bash
# Pull latest main into your branch to catch conflicts early
git checkout feature/your-branch
git merge main
```

Git marks the conflicting sections in the file:

```
<<<<<<< HEAD
your version of the code
=======
teammate's version of the code
>>>>>>> main
```

Edit the file to keep the correct version (or combine both), then:

```bash
git add src/the-file.tsx
git commit -m "Resolve merge conflict in the-file.tsx"
```

---

## Useful commands

| Command | What it does |
|---------|-------------|
| `git branch` | List all local branches |
| `git branch -a` | List all branches including remote |
| `git checkout branch-name` | Switch to an existing branch |
| `git checkout -b new-name` | Create and switch to a new branch |
| `git merge main` | Pull latest main changes into your branch |
| `git status` | See what files have changed |
| `git log --oneline -10` | See the last 10 commits |
| `git branch -d branch-name` | Delete a local branch after merging |
| `gh pr list` | See open pull requests |
| `gh pr create` | Open a pull request from the terminal |

---

## Quick reference card

```bash
# Start new work
git checkout main && git pull origin main
git checkout -b feature/my-feature

# Save progress
git add src/...
git commit -m "describe what changed"

# Share and review
git push origin feature/my-feature
gh pr create --title "..." --body "..."

# After PR is merged
git checkout main && git pull origin main
git branch -d feature/my-feature
```

---

## Repository

`https://github.com/zoliledmafu-lab/compassp`
