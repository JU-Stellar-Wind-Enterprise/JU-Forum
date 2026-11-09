# Feature Specification: 3.1.9 Campus Announcements

### 3.1.9 Campus Announcements

**User Story:**  
As an authorized user (Teacher, Staff, Moderator, or Administrator), I want to author and publish official campus announcements with priority levels, target audience filters, and expiration dates, so that important institutional updates reach the intended audience promptly.

**Success:**
- User with authorized role (Faculty, Staff, Moderator, or Administrator) opens the announcement creation page.
- User enters the announcement Title (1 to 150 characters), Body Content (up to 10,000 characters), Priority Level (Low, Medium, High, or Urgent), Target Audience (All Users, Students, Faculty, or Staff), and an optional future Expiration Date.
- System validates the input, confirms role permissions, and publishes the announcement.
- The published announcement appears in the announcement feed and is displayed only to members belonging to the target audience (or all members if set to All Users).
- High-priority and urgent announcements are visually distinguished and pinned at the top of the announcement feed.
- The author or an administrator can edit or delete the announcement.
- Announcements that pass their expiration date are automatically hidden from the active feed.

**Failure:**
- If a general student account attempts to access the announcement creation form, the system blocks the request and displays: *"You do not have permission to create announcements."*
- If the title or content is empty or exceeds length limitations, the system displays: *"Please provide a valid title and announcement content."*
- If an expiration date in the past is selected, the system displays: *"Expiration date must be in the future."*
- If announcement publication fails due to a system issue, the system displays: *"Failed to publish announcement. Please try again."*
