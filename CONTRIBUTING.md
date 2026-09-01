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

### Generate Prisma Client

First run this to generate the Prisma client:

```bash
pnpm prisma generate
```

### Setup environment variables

Create or collect the `.env` file at the project root with appropriate environment variables.

> For our project, you can find it in our **Discord** server.

### Run Development Server

```bash
pnpm dev
```

Open your browser and navigate to `http://localhost:3000` or the url shown in your terminal.

### Run Unit Tests

```bash
pnpm test
```

Make sure all unit tests pass before opening a PR.

---

## 3. Branching & Commit Workflow

### Create a Branch

Do not commit directly to `main` or `develop`. Create a new branch using the format `<type>/<short-description>`:

```bash
git checkout -b feat/user-auth

```

#### Branch Types (`<type>`):

* `feat/` — New feature or major enhancement
(e.g., `feat/user-auth`)
* `fix/` — Bug fix
(e.g., `fix/login-redirect-loop`)
* `docs/` — Documentation changes only
(e.g., `docs/update-readme`)
* `style/` — Formatting, CSS changes, missing semi-colons
(e.g., `style/navbar-responsive-layout`)
* `refactor/` — Code changes that neither fix a bug nor add a feature
(e.g., `refactor/cleanup-api-routes`)
* `test/` — Adding or updating tests
(e.g., `test/auth-unit-tests`)
* `chore/` — Maintenance tasks, dependency updates, or config changes
(e.g., `chore/update-tailwind-config`)

> **Note:** Use lowercase hyphenated words (`kebab-case`) for your short description (e.g., `user-auth`, not `userAuth` or `user_auth`).

---

### Stage & Commit Changes

```bash
git status
git add .
git commit -m "feat: implement user authentication UI"

```

#### Conventional Commit Prefixes:

* `feat:` New feature or major enhancement
(e.g., `"feat: add user profile picture upload"`)
* `fix:` Bug fix
(e.g., `"fix: resolve session expiration redirect loop"`)
* `docs:` Documentation changes only
(e.g., `"docs: update API setup instructions in README"`)
* `style:` Formatting, CSS tweaks, missing semi-colons (no logical changes)
(e.g., `"style: fix mobile navbar padding and flex alignment"`)
* `refactor:` Code refactoring without functionality changes
(e.g., `"refactor: extract JWT token verification into middleware"`)
* `test:` Adding or updating tests
(e.g., `"test: add unit test suite for auth helper"`)
* `chore:` Maintenance tasks, dependency updates, or configuration changes
(e.g., `"chore: update tailwindcss to v3.4.0"`)

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
PR title uses the same format as commit messages.

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