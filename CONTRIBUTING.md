# CONTRIBUTING.md

Welcome to the **JU Forum** project! Please follow these guidelines to keep our development workflow consistent.

---

## 1. Environment & Setup

### Clone & Install

```bash
git clone https://github.com/JU-Stellar-Wind-Enterprise/JU-Forum.git
cd JU-Forum
corepack enable # To use pnpm
pnpm install

```

---

## 2. Local Development & Testing

### Run Development Server

```bash
pnpm dev

```

Open your browser and navigate to `http://localhost:3000`.

### Run Unit Tests

```bash
pnpm test

```

Make sure all unit tests pass before opening a PR.

---

## 3. Branching & Commit Workflow

### Create a Branch

Do not commit directly to `main`. Create a new branch using the format `<type>/<your-name>/<short-description>`:

```bash
git checkout -b feature/kaium/user-auth

```

### Stage & Commit Changes

```bash
git status
git add .
git commit -m "feat: implement user authentication UI"

```

**Conventional Commit Prefixes:**

* `feat:` A new feature
* `fix:` A bug fix
* `docs:` Documentation changes only
* `style:` Formatting, missing semi-colons, etc. (no logical changes)
* `refactor:` Code refactoring without functionality changes
* `test:` Adding or updating tests
* `chore:` Maintenance tasks, dependency updates, or configuration changes



### Push to Remote

Run this command **once** for this project:

```bash
git config push.autoSetupRemote true

```

This makes Git automatically sets up tracking on new branches, allowing you to run a plain `git push` every time without passing `-u origin <branch-name>`.

After enabling this, you can simply run:

```bash
git push

```

Git will automatically create the remote branch with the same name and set up tracking.

---


## 4. Opening a Pull Request (PR)

After pushing, Git prints a direct URL in your terminal:

```text
Create a pull request for 'feature/kaium/user-auth' on GitHub by visiting:
   https://github.com/JU-Stellar-Wind-Enterprise/JU-Forum/pull/new/feature/kaium/user-auth

```

Control-click or copy that URL into your browser to open the PR creation page.

### PR Title & Body Format

**Title:** `<type>: <short summary>` (e.g., `feat: add authentication login component`)

**Body Template:**

```markdown
## Overview
Briefly describe what this PR does and why it is needed.

## Changes Made
- Added login component UI
- Integrated input validation logic
- Written unit tests for validation rules

## How to Test
1. Run `pnpm dev`
2. Navigate to `/login` page
3. Test invalid input submissions to verify error states
4. Run `pnpm test`

```

---

## 5. Review & Merge

1. **Assign Reviewers:** Add team members as reviewers on GitHub.
2. **Address Feedback:** Make requested changes locally, commit, and push to the same branch. The PR will automatically update.
3. **Merge:** Once approved, the PR will be merged into `main`. Delete your feature branch afterwards.