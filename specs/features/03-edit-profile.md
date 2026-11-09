# Feature Specification: 3.1.3 Edit Profile

### 3.1.3 Edit Profile

**User Story:**  
As a registered user, I want to customize my profile by updating my display nickname, avatar image, "About Me" biography, and interest tags, so that my profile accurately represents my identity and academic interests.

**Success:**
- User opens the profile editing interface.
- User updates their display nickname:
  - System verifies that the nickname is unique across the platform, contains no spaces or offensive content, and enforces a 7-day modification cooldown to prevent abuse.
- User updates their avatar image by providing a valid image URL or uploading a supported image file.
- User edits their "About Me" biography (up to 500 characters); system automatically sanitizes the text to prevent script injection.
- User selects or adds academic interest tags (up to a maximum of 10 tags).
- User confirms the changes, and the system saves the updated profile, displaying: *"Profile updated successfully."*

**Failure:**
- If the proposed nickname contains invalid characters or offensive terms, the system displays: *"Invalid nickname provided."*
- If the user attempts to update their nickname before the 7-day cooldown period has elapsed, the system displays: *"Nickname can only be changed once every 7 days."*
- If the biography exceeds the 500-character limit, the system displays: *"About Me text exceeds the allowed 500-character limit."*
- If the user attempts to add duplicate interest tags or exceeds the 10-tag limit, the system rejects the addition with an informative notice.
- If a system error occurs during the save operation, the system displays: *"Unable to update profile. Please try again later."*
