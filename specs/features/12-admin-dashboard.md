# Feature Specification: 3.1.12 Admin Dashboard & User Management

### 3.1.12 Admin Dashboard & User Management

**User Story:**  
As a university forum Administrator or System Administrator, I want to access a dedicated administration dashboard to view platform activity metrics, manage user roles, review moderator applications, and suspend rule-violating accounts, so that I can ensure institutional safety and administrative oversight.

**Success:**
- Administrator logs in with elevated credentials and accesses the administrative dashboard.
- Dashboard displays real-time platform statistics, including total registered users, active subforums, published discussions, and pending moderation reports.
- Administrator can search and review user accounts, filter by role (Student, Faculty, Staff, Moderator), and update account statuses (Active, Suspended, or Rejected).
- Administrator can review pending moderator applications and grant or revoke moderator privileges.
- Administrator can publish platform-wide alert notices visible across all user feeds.
- Suspending an account immediately terminates active sessions and blocks future login attempts.

**Failure:**
- If a non-admin user attempts to access administrative pages, the system blocks access and returns an unauthorized access warning.
- If an administrator attempts to suspend their own account or modify another top-level administrator's permissions, the system blocks the action with an error notification.
- If database synchronization fails during an account update, the system rolls back the change and displays: *"Unable to update user status. Please try again."*
