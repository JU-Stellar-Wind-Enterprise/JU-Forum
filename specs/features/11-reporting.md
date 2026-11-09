# Feature Specification: 3.1.11 Content Reporting & Flagging

### 3.1.11 Content Reporting & Flagging

**User Story:**  
As a forum member, I want to flag and report inappropriate, abusive, or spam content to moderators, so that the platform maintains a safe, respectful, and productive academic environment.

**Success:**
- User clicks the "Report" option on any post, comment, or announcement.
- User selects a reporting reason (Spam, Harassment, Offensive Content, False Information, Academic Misconduct, or Other) and optionally provides explanatory remarks.
- System validates the report and logs it in the moderation review queue.
- System confirms report submission to the user: *"Thank you. Your report has been submitted for moderator review."*
- System prevents duplicate reports by the same user on the same content item.
- Moderators can inspect reported content, review report reasons, dismiss unfounded reports, or take corrective action (such as hiding content, deleting posts, or warning users).

**Failure:**
- If no reporting reason is selected, the system displays: *"Please select a valid reason for reporting."*
- If the user has already reported the specific item, the system displays: *"You have already reported this content."*
- If the reported content has already been removed, the system displays: *"This content is no longer available."*
- If an unauthenticated user attempts to submit a report, the system redirects them to the login page.
