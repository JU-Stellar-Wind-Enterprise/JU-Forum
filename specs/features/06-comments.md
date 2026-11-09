# Feature Specification: 3.1.6 Comments & Discussion Replies

### 3.1.6 Comments & Discussion Replies

**User Story:**  
As an authenticated user, I want to write comments and replies under discussion posts, so that I can answer questions, contribute insights, and actively engage with the campus community.

**Success:**
- User opens a discussion post and types a response into the comment input field.
- System verifies that the comment is not empty and falls within allowed length limits (up to 2,000 characters).
- System publishes the comment under the target post, displaying the commenter's name, role badge, timestamp, and voting controls.
- Comment author can edit or remove their own comments.
- Subforum moderators and administrators can remove inappropriate comments that violate community standards.

**Failure:**
- If the discussion thread has been locked or archived, the comment interface is disabled, displaying: *"Comments are closed for this post."*
- If the submitted comment text is empty, the system displays: *"Comment cannot be empty."*
- If an unauthenticated user attempts to comment, the system redirects them to the login page.
- If comment submission fails due to server connectivity, the system displays: *"Unable to post comment. Please try again."*
