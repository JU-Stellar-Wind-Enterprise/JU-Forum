# Feature Specification: 3.1.8 Community Polls

### 3.1.8 Community Polls

**User Story:**  
As a user (Student, Teacher, or Staff), I want to create polls within discussion topics and vote on poll options, so that I can collect opinions, student feedback, and community sentiment.

**Success:**
- User opens the poll creation interface, enters the poll question, descriptive context, at least two voting options, and an optional poll closing date.
- System validates the fields and publishes the poll within the designated discussion space.
- Authorized users can view the poll and cast a single vote for their preferred option.
- System records each vote, prevents duplicate submissions from the same user, and updates percentage bars and vote totals automatically.
- When the poll reaches its scheduled closing date or is closed by the author/moderator, voting is disabled and final tallies remain archived for viewing.

**Failure:**
- If the poll question is missing or fewer than two options are provided, the system displays: *"Poll creation failed. Please enter a question and at least two voting options."*
- If a user attempts to vote more than once in the same poll, the system rejects the duplicate submission.
- If a user attempts to vote in a closed or expired poll, the system displays: *"This poll is closed and no longer accepting votes."*
- If an unauthenticated user attempts to vote, the system redirects them to the login page.
