# Feature Specification: 3.1.2 View Profile

### 3.1.2 View Profile

**User Story:**  
As a user (Student, Teacher, or Staff), I want to view my own profile and the public profiles of other forum members, so that I can see member details, institutional roles, academic departments, and community contributions.

**Success:**
- Authenticated user opens their personal profile page or clicks on any member's username or avatar.
- System retrieves and displays the member's profile information: Full Name, Display Nickname, Institutional Role (Student, Faculty, Staff, Moderator, or Admin), Department, Academic Batch, Avatar Image, About Me biography, and Academic Interest Tags.
- When viewing their own profile, the user is provided with controls to edit their profile details.
- System displays a summary of the member's recent posts, discussions, and community engagement.
- The profile display automatically reflects recent updates made by the account owner.

**Failure:**
- If an unauthenticated user attempts to view a member profile, the system redirects them to the login page.
- If the requested member profile does not exist, the system displays a *"Page Not Found"* message.
- If profile data cannot be loaded due to a temporary network issue, the system displays: *"Unable to load profile information. Please try again later."*
