# Feature Specification: 3.1.10 Personalized News Feed

### 3.1.10 Personalized News Feed

**User Story:**  
As an authenticated user, I want to view an aggregated news feed on my home dashboard containing recent discussions, followed subforum updates, and official announcements, so that I can stay informed about university activities from a single page.

**Success:**
- Upon accessing the home dashboard, the system displays a unified feed composed of recent discussions from active subforums and relevant campus announcements matching the user's role.
- User can apply feed sorting and filtering options (such as "Latest", "Most Upvoted", or followed topics).
- Each discussion card presents the post title, author, subforum tag, vote count, and comment summary.
- User interactions on the feed (such as voting or opening threads) update smoothly without requiring full-page reloads.
- The feed supports structured pagination or continuous loading to optimize performance.

**Failure:**
- If an unauthenticated user visits the home feed, the system redirects them to the login page.
- If feed data cannot be fetched due to network interruption, the system displays: *"Unable to load feed items. Please refresh."*
- If a subforum is removed or archived, its posts are gracefully excluded from the active news feed.
