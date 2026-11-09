# Feature Specification: 3.1.7 Content Voting System

### 3.1.7 Content Voting System

**User Story:**  
As an authenticated forum member, I want to upvote or downvote discussion posts and comments, switch my vote, or remove my vote, so that valuable academic content is highlighted and community feedback is reflected.

**Success:**
- User clicks the Upvote or Downvote button on any active discussion post or comment.
- System records the vote and updates the total score (upvotes minus downvotes) dynamically.
- The user interface immediately highlights the active voting button to provide visual confirmation.
- If the user clicks the same vote button a second time, the system removes their vote and resets the score.
- If the user clicks the opposite vote button, the system switches the vote (e.g., from upvote to downvote) and recalculates the score accordingly.
- Authors are permitted to vote on their own published content.

**Failure:**
- If a post is locked or archived, voting controls are disabled, and submission attempts return: *"Voting is disabled on locked or archived content."*
- If an unauthenticated user attempts to cast a vote, the system redirects them to the login page.
- If a suspended user attempts to vote, the system displays: *"Suspended accounts cannot participate in voting."*
- If network communication fails, the user interface indicates a temporary network issue without altering the persistent score.
