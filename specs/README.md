# Specifications & Requirements Directory

This directory contains the project requirements, architecture specifications, and modular feature breakdowns for JU Forum.

> [!WARNING]
> Do **NOT** store specification documents inside `docs/`. The `npm run docs` command (TypeDoc) has `"cleanOutputDir": true` configured in `typedoc.json`, which automatically deletes and recreates `docs/` with generated HTML.

---

## Directory Structure

```
specs/
├── SRS.md                      # Complete master SRS document
├── overview.md                 # System overview, scope, actors, & NFRs
├── README.md                   # This index & TDD status tracker
└── features/                   # Modular feature specifications
    ├── 01-authentication.md
    ├── 02-view-profile.md
    ├── 03-edit-profile.md
    ├── 04-subforum.md
    ├── 05-posts.md
    ├── 06-comments.md
    ├── 07-voting.md
    ├── 08-polls.md
    ├── 09-announcements.md
    ├── 10-news-feed.md
    ├── 11-reporting.md
    └── 12-admin-dashboard.md
```

---

## Feature Implementation & TDD Status

| # | Feature Specification | Sprint 1 Service | Unit Tests | Sprint 2 Status |
| :-: | :--- | :--- | :--- | :--- |
| **01** | [`01-authentication.md`](./features/01-authentication.md) | `auth.service.ts` | Remote branch `origin/test/auth` | Needs test merge |
| **02** | [`02-view-profile.md`](./features/02-view-profile.md) | `profile.service.ts` | `profile.service.test.ts` (Passing) | Completed |
| **03** | [`03-edit-profile.md`](./features/03-edit-profile.md) | `profile.service.ts` | `profile.service.test.ts` (Passing) | Completed |
| **04** | [`04-subforum.md`](./features/04-subforum.md) | `subforum.service.ts` | Pending | Needs unit tests |
| **05** | [`05-posts.md`](./features/05-posts.md) | `post.service.ts` | `post.service.test.ts` (Passing) | Completed |
| **06** | [`06-comments.md`](./features/06-comments.md) | *Unimplemented* | None | **Ready for TDD** |
| **07** | [`07-voting.md`](./features/07-voting.md) | `vote.service.ts` | Remote branch `origin/test/vote` | Needs test merge |
| **08** | [`08-polls.md`](./features/08-polls.md) | *Unimplemented* | None | **Ready for TDD** |
| **09** | [`09-announcements.md`](./features/09-announcements.md) | `announcement.service.ts` | `announcement.service.test.ts` (Passing) | Completed |
| **10** | [`10-news-feed.md`](./features/10-news-feed.md) | *Unimplemented* | None | **Ready for TDD** |
| **11** | [`11-reporting.md`](./features/11-reporting.md) | *Unimplemented* | None | **Ready for TDD** |
| **12** | [`12-admin-dashboard.md`](./features/12-admin-dashboard.md) | *Unimplemented* | None | **Ready for TDD** |
