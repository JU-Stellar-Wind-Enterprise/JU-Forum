# Feature Specification: 3.1.5 Create & Manage Posts

### 3.1.5 Create & Manage Posts

**User Story:**  
As an active forum member, I want to publish discussion posts inside approved subforums, so that I can ask academic questions, initiate discussions, and share knowledge with university peers.

**Success:**
- Authenticated user opens the post creation page.
- User selects a target Subforum from the available categories, enters a post Title (1 to 150 characters), and provides Body Content (1 to 10,000 characters).
- System verifies that the target subforum is active and that content lengths meet validation constraints.
- System publishes the post and links it to the author and the selected subforum.
- User is directed to the published post page, where the discussion thread displays the title, body content, author name, timestamp, subforum tag, and interactive voting controls.
- The author or an authorized moderator can lock or archive the discussion thread when a topic is resolved or closed to prevent further interactions.

**Failure:**
- If the post title is missing or exceeds 150 characters, the system displays: *"Title must be between 1 and 150 characters."*
- If the body content is empty or exceeds 10,000 characters, the system displays: *"Content must be between 1 and 10,000 characters."*
- If no subforum is selected, the system displays: *"Please select a subforum."*
- If the author's account is suspended or inactive, the system blocks post creation.
- If post submission fails due to a network or server issue, the system displays: *"Could not create post. Please try again."*
