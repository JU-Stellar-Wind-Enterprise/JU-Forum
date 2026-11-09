# Feature Specification: 3.1.4 Subforum Management (Create & Browse)

### 3.1.4 Subforum Management (Create & Browse)

**User Story:**  
As a university member, I want to browse existing subforums and propose or create new thematic discussion spaces for departments, batches, clubs, or academic interest groups, so that our community has structured communication channels.

**Success:**
- User opens the subforum directory to view all available discussion spaces with their title, description, creator, and activity count.
- User opens the subforum creation interface to submit a new discussion space.
- User enters the proposed Subforum Name (1 to 80 characters) and Description (1 to 500 characters).
- System validates that the subforum name is unique across the forum.
- System registers the subforum, assigns the creator as the initial subforum owner/moderator, and applies the platform approval workflow.
- Once active, the subforum becomes visible in the public directory, allowing members to open it and start discussion threads inside it.

**Failure:**
- If a subforum with the same name already exists, the system displays: *"A subforum with this name already exists."*
- If the subforum name is blank or exceeds 80 characters, the system displays: *"Subforum name must be between 1 and 80 characters."*
- If the description exceeds 500 characters, the system displays: *"Description cannot exceed 500 characters."*
- If an unauthenticated user attempts to create a subforum, the system redirects them to the login screen.
- If subforum creation fails due to a system issue, the system displays: *"Could not create subforum. Please try again."*
