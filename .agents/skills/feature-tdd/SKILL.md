---
name: feature-tdd
description: Implement a feature using AI-assisted Test Driven Development (TDD) for JU Forum. Automatically syncs with develop, creates a feature branch, infers the feature specification from specs/features/, grills the user to clarify requirements and edge cases, writes unit tests first (Red), implements the repository and service (Green), builds Server Actions and UI components, verifies all tests pass with Biome formatting, and commits cleanly. Triggers when the user asks to implement, build, develop, create, or work on any feature (e.g., "implement comments", "build polls feature", "implement 06-comments", "work on reporting", "build admin dashboard").
---

# Feature TDD Workflow

This skill guides you through the end-to-end Test-Driven Development (TDD) workflow for any feature in the **JU Forum** project.

Follow this cycle strictly. Do NOT skip phases or jump directly to writing UI/business logic before writing unit tests.

---

## Phase 0: Automated Git Sync & Branching

1. Run the following command to sync with the latest `develop`:
   ```bash
   git checkout develop && git pull origin develop
   ```
2. Determine the kebab-case feature slug from the user's prompt (e.g. `comments`, `polls`, `reporting`, `news-feed`, `admin-dashboard`).
3. Create and switch to a feature branch:
   ```bash
   git checkout -b feat/<feature-slug>
   ```

---

## Phase 1: Inactive Spec Inference

1. Scan the `specs/features/` directory and match the feature slug with the corresponding specification file:
   - `01-authentication.md`
   - `02-view-profile.md`
   - `03-edit-profile.md`
   - `04-subforum.md`
   - `05-posts.md`
   - `06-comments.md`
   - `07-voting.md`
   - `08-polls.md`
   - `09-announcements.md`
   - `10-news-feed.md`
   - `11-reporting.md`
   - `12-admin-dashboard.md`
2. Read the spec file completely. Extract:
   - **User Story**
   - **Success Criteria** (Every expected behavior and happy path)
   - **Failure Criteria** (Every validation rule, error message, and forbidden action)

---

## Phase 2: "Grill Me" – Requirement & Scope Clarification

Before writing any tests or code, interview the user to resolve ambiguities, edge cases, and design choices.

1. Formulate **2 to 3 targeted multiple-choice questions** focusing on:
   - **Edge cases:** (e.g. *"What should happen to comments if a post is deleted?"*, *"Can users vote on multiple poll options?"*)
   - **Permissions & Roles:** (e.g. *"Who can delete reports – only Admins or also Subforum Moderators?"*)
   - **UI / UX interactions:** (e.g. *"Should replies be flat or nested?", "Should reports include a freeform text box?"*)
2. Always put the **(Recommended)** default option first so non-coder teammates can easily confirm with one click or press enter.
3. Use the `ask_question` tool to present these questions and wait for user answers.
4. Incorporate the user's answers into the test plan.

---

## Phase 3: Database & Schema Check

1. Inspect `prisma/schema.prisma` to verify if the required model(s) exist for this feature.
2. If the model is missing or needs a new relation/field:
   - Add the minimal required model or relation in `prisma/schema.prisma`.
   - Run `pnpm prisma generate` to update Prisma Client types.

---

## Phase 4: 🔴 RED (Unit Tests First)

1. Review existing test patterns in `src/services/post.service.test.ts` and `src/services/announcement.service.test.ts`.
2. Create the test file: `src/services/<feature-slug>.service.test.ts`.
3. Set up Vitest with repository mocks:
   ```typescript
   import { beforeEach, describe, expect, it, vi } from "vitest";
   import * as featureRepo from "@/repositories/<feature-slug>.repository";
   import { ... } from "./<feature-slug>.service";

   vi.mock("@/repositories/<feature-slug>.repository", () => ({
     // mock repo methods here
   }));
   ```
4. Write test suites covering **every single Success and Failure condition** from the spec and the clarification answers.
5. Run the test:
   ```bash
   pnpm test src/services/<feature-slug>.service.test.ts
   ```
6. **Verify Failure:** The test file MUST fail or fail to compile because the service does not exist yet (RED phase confirmed).

---

## Phase 5: 🟢 GREEN (Minimal Implementation)

1. Create the repository file: `src/repositories/<feature-slug>.repository.ts`.
   - Implement database queries using Prisma Client (`import { prisma } from "@/lib/prisma"`).
2. Create the service file: `src/services/<feature-slug>.service.ts`.
   - Implement pure business logic, input validation, and authorization checks.
   - Every service function must return `Promise<ActionResult<T>>` using the project's standard type:
     ```typescript
     import type { ActionResult } from "@/types/result";
     ```
3. Run the unit test:
   ```bash
   pnpm test src/services/<feature-slug>.service.test.ts
   ```
4. Iterate until **100% of the unit tests pass** (GREEN phase confirmed).

---

## Phase 6: 🔵 Wiring (Server Actions & UI)

1. Create Server Actions: `src/actions/<feature-slug>.actions.ts`.
   - Mark with `"use server";`.
   - Call the service function and return the `ActionResult<T>`.
2. Build UI presentation:
   - Components in `src/components/<feature-slug>/`.
   - Page view in `src/app/<feature-slug>/page.tsx` (or integrated into existing views like `/post/[id]` for comments).
   - Use Tailwind CSS consistent with the existing layout (`src/app/globals.css`).

---

## Phase 7: Quality Gate & Verification

Run the full verification suite to ensure no regressions or formatting issues:
1. `pnpm format` (Biome format)
2. `pnpm lint` (Biome lint)
3. `pnpm test` (Vitest run on all test suites)

Fix any linting or type-checking issues before proceeding.

---

## Phase 8: Clean Commit & Teammate Handover

1. Stage all new and modified files:
   ```bash
   git add .
   ```
2. Commit using conventional commit format:
   ```bash
   git commit -m "feat(<feature-slug>): implement <feature-slug> with unit tests and UI"
   ```
3. Provide a clear, celebratory handover message to the teammate:
   - Summarize what was created (tests, service, actions, UI).
   - Provide the **exact command** for the teammate to push to GitHub:
     ```bash
     git push -u origin feat/<feature-slug>
     ```
   - Remind them to open the PR link printed by Git in the terminal to merge into `develop`.
